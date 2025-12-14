"""
Risk of Ruin Engine - Pure Mathematical Calculations
Uses NumPy for Monte Carlo simulations (zero AI hallucinations)
"""

import numpy as np


def calculate_risk_of_ruin(bankroll, bet_size, win_probability, payout_ratio, total_hands=1000, simulations=10000):
    """
    Runs Monte Carlo simulations to calculate Risk of Ruin.
    
    This answers: "If I play 1000 hands with these parameters, what's the chance I go broke?"
    
    Args:
        bankroll: Starting bankroll amount
        bet_size: Bet size per hand
        win_probability: Probability of winning a single hand (0.0 to 1.0)
        payout_ratio: Payout multiplier on win (e.g., 1.0 for even money, 1.5 for 3:2 blackjack)
        total_hands: Number of hands to simulate
        simulations: Number of Monte Carlo runs (default 10,000)
    
    Returns:
        dict: Risk analysis results
    """
    
    # Validate inputs
    if bankroll <= 0 or bet_size <= 0:
        return {
            "error": "Bankroll and bet size must be positive",
            "risk_of_ruin_percent": 100.0,
            "recommendation": "INVALID"
        }
    
    if win_probability < 0 or win_probability > 1:
        return {
            "error": "Win probability must be between 0 and 1",
            "risk_of_ruin_percent": 100.0,
            "recommendation": "INVALID"
        }
    
    # 1. Setup the Simulation Array
    # Shape: (simulations, total_hands)
    # Each row is one "virtual night" of play
    results = np.random.random((simulations, total_hands))
    
    # 2. Apply Game Rules
    # If random number < win_prob, you win (Payout), else you lose (-bet_size)
    wins = results < win_probability
    pnl_per_hand = np.where(wins, bet_size * payout_ratio, -bet_size)
    
    # 3. Calculate Cumulative Path
    # This creates a timeline of your bankroll for every hand
    # Each simulation shows how bankroll changes over time
    cumulative_pnl = np.cumsum(pnl_per_hand, axis=1)
    bankroll_paths = cumulative_pnl + bankroll
    
    # 4. Check for Ruin (Did bankroll ever hit <= 0?)
    # np.any checks if 0 appears anywhere in the timeline
    ruin_instances = np.any(bankroll_paths <= 0, axis=1)
    risk_of_ruin_pct = np.mean(ruin_instances) * 100
    
    # 5. Calculate Statistics
    final_bankrolls = bankroll_paths[:, -1]
    avg_final_bankroll = np.mean(final_bankrolls)
    median_final_bankroll = np.median(final_bankrolls)
    min_final_bankroll = np.min(final_bankrolls)
    max_final_bankroll = np.max(final_bankrolls)
    
    # 6. Calculate Expected Value (EV) per hand
    ev_per_hand = (win_probability * bet_size * payout_ratio) - ((1 - win_probability) * bet_size)
    total_ev = ev_per_hand * total_hands
    
    # 7. Calculate Kelly Criterion (Optimal bet size)
    # Kelly = (p * b - q) / b
    # where p = win prob, q = loss prob, b = payout ratio
    if payout_ratio > 0:
        kelly_fraction = (win_probability * payout_ratio - (1 - win_probability)) / payout_ratio
        kelly_fraction = max(0, min(kelly_fraction, 1))  # Clamp between 0 and 1
        optimal_bet_size = bankroll * kelly_fraction
    else:
        kelly_fraction = 0
        optimal_bet_size = 0
    
    # 8. Determine Recommendation
    if risk_of_ruin_pct < 1.0:
        recommendation = "SAFE"
        risk_level = "Low"
    elif risk_of_ruin_pct < 5.0:
        recommendation = "CAUTION"
        risk_level = "Medium"
    elif risk_of_ruin_pct < 20.0:
        recommendation = "DANGEROUS"
        risk_level = "High"
    else:
        recommendation = "EXTREME_RISK"
        risk_level = "Critical"
    
    return {
        "risk_of_ruin_percent": round(risk_of_ruin_pct, 2),
        "expected_final_bankroll": round(avg_final_bankroll, 2),
        "median_final_bankroll": round(median_final_bankroll, 2),
        "min_final_bankroll": round(min_final_bankroll, 2),
        "max_final_bankroll": round(max_final_bankroll, 2),
        "expected_value": round(total_ev, 2),
        "ev_per_hand": round(ev_per_hand, 4),
        "kelly_fraction": round(kelly_fraction, 4),
        "optimal_bet_size": round(optimal_bet_size, 2),
        "current_bet_ratio": round(bet_size / bankroll, 4) if bankroll > 0 else 0,
        "recommendation": recommendation,
        "risk_level": risk_level,
        "simulations_run": simulations,
        "hands_simulated": total_hands
    }


def get_game_profiles():
    """
    Get profiles for all supported games with RTP and Volatility.
    
    RTP (Return to Player): Theoretical payout percentage (1.0 = 100%)
    Volatility: Variance level (Low = steady, High = big swings)
    Washing Efficiency: How good it is for clearing bonuses (High RTP + Low Volatility = Best)
    """
    return {
        "blackjack": {
            "name": "Blackjack (Basic Strategy)",
            "rtp": 0.995,  # 0.5% house edge
            "volatility": "Low",
            "washing_efficiency": "High",
            "min_bet": 10,
            "hands_per_hour": 60
        },
        "blackjack_card_counting": {
            "name": "Blackjack (Card Counting)",
            "rtp": 1.01,  # 1% player edge (varies)
            "volatility": "Medium",
            "washing_efficiency": "Very High",
            "min_bet": 25,
            "hands_per_hour": 50
        },
        "roulette_even": {
            "name": "Roulette (Red/Black)",
            "rtp": 0.973,  # European
            "volatility": "Low",
            "washing_efficiency": "Medium",
            "min_bet": 5,
            "hands_per_hour": 40
        },
        "roulette_straight": {
            "name": "Roulette (Straight Up)",
            "rtp": 0.973,
            "volatility": "Very High",
            "washing_efficiency": "Very Low",
            "min_bet": 1,
            "hands_per_hour": 40
        },
        "slots_low_vol": {
            "name": "Slots (Low Volatility)",
            "rtp": 0.96,
            "volatility": "Medium",
            "washing_efficiency": "Medium",
            "min_bet": 0.50,
            "hands_per_hour": 500
        },
        "slots_high_vol": {
            "name": "Slots (High Volatility/Jackpot)",
            "rtp": 0.94,
            "volatility": "Extreme",
            "washing_efficiency": "Low",
            "min_bet": 1.00,
            "hands_per_hour": 500
        },
        "craps_pass": {
            "name": "Craps (Pass Line + Odds)",
            "rtp": 0.99,  # With max odds
            "volatility": "Low",
            "washing_efficiency": "High",
            "min_bet": 10,
            "hands_per_hour": 40
        },
        "video_poker": {
            "name": "Video Poker (Jacks or Better)",
            "rtp": 0.9954,
            "volatility": "Medium",
            "washing_efficiency": "High",
            "min_bet": 1.25,
            "hands_per_hour": 400
        }
    }


def calculate_game_parameters(game_type, count=None):
    """
    Get default game parameters based on game type.
    
    Args:
        game_type: 'blackjack', 'roulette', 'slots', etc.
        count: True count for blackjack (optional)
    
    Returns:
        dict: win_probability, payout_ratio
    """
    
    params = {
        "blackjack": {
            "base_win_prob": 0.42,  # Approx without strategy
            "payout_ratio": 1.0,  # Even money (simplified)
            "with_basic_strategy": 0.48,  # Better with perfect basic strategy
            "blackjack_payout": 1.5  # 3:2 blackjack
        },
        "roulette": {
            "win_prob": 0.486,  # European roulette (single zero)
            "payout_ratio": 1.0  # Even money bets
        },
        "slots": {
            "win_prob": 0.10,  # Very low (varies by machine)
            "payout_ratio": 9.0  # 10x payout (varies)
        },
        "craps": {
            "win_prob": 0.493,  # Pass line bet
            "payout_ratio": 1.0
        },
        "sportsbook": {
            "win_prob": 0.50,  # Assuming -110 odds (implied 52.4%)
            "payout_ratio": 0.91  # -110 odds payout
        }
    }
    
    game_lower = game_type.lower()
    
    if game_lower == "blackjack":
        # Adjust win probability based on count
        if count is not None:
            # True count of +1 adds ~0.5% edge
            win_prob = 0.48 + (count * 0.005)
            win_prob = max(0.30, min(0.65, win_prob))  # Clamp between 30% and 65%
        else:
            win_prob = params["blackjack"]["with_basic_strategy"]
        
        return {
            "win_probability": win_prob,
            "payout_ratio": params["blackjack"]["payout_ratio"]
        }
    
    elif game_lower in params:
        return {
            "win_probability": params[game_lower].get("win_prob", params[game_lower].get("base_win_prob", 0.5)),
            "payout_ratio": params[game_lower]["payout_ratio"]
        }
    
    else:
        # Default: even money, 50/50
        return {
            "win_probability": 0.5,
            "payout_ratio": 1.0
        }

