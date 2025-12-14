"""
Enhanced Sportsbook Predictor using State-Space Models and AI Concepts

This module implements:
1. Learned state variables (hidden team form, matchup dynamics)
2. Dynamic attention weights (which factors matter when)
3. Probabilistic future predictions (expected future behavior affects present)
4. Tensor-based computation for efficiency

Key Concept: Unlike classical systems with fixed A, B, C, D matrices,
this model learns its own state-space representation and dynamically
rewrites the transition dynamics based on context.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import json

# Try to import PyTorch for tensor operations (optional - falls back to NumPy)
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    PYTORCH_AVAILABLE = True
except ImportError:
    PYTORCH_AVAILABLE = False
    print("⚠️ PyTorch not available. Using NumPy fallback for predictions.")


class StateSpacePredictor:
    """
    State-Space Model for Sports Predictions
    
    Learns:
    - Hidden state variables (team form, momentum, matchup dynamics)
    - Transition dynamics (how states evolve over time)
    - Attention weights (which factors matter in different contexts)
    - Output mappings (how states translate to win probabilities)
    """
    
    def __init__(self, use_pytorch: bool = True):
        self.use_pytorch = use_pytorch and PYTORCH_AVAILABLE
        self.state_dim = 8  # Hidden state dimension (learned features)
        self.feature_dim = 12  # Input features (EPA, recent form, etc.)
        
        # Initialize learned parameters (equivalent to A, B, C, D matrices)
        if self.use_pytorch:
            self._init_pytorch_model()
        else:
            self._init_numpy_model()
    
    def _init_pytorch_model(self):
        """Initialize PyTorch-based state-space model"""
        # A matrix: State transition (how hidden states evolve)
        self.A = nn.Parameter(torch.randn(self.state_dim, self.state_dim) * 0.1)
        
        # B matrix: Input-to-state mapping (how features affect states)
        self.B = nn.Parameter(torch.randn(self.feature_dim, self.state_dim) * 0.1)
        
        # C matrix: State-to-output mapping (how states predict outcomes)
        self.C = nn.Parameter(torch.randn(self.state_dim, 1) * 0.1)
        
        # Attention weights: Dynamic importance of different features
        self.attention = nn.MultiheadAttention(self.feature_dim, num_heads=2, batch_first=True)
        
        # Normalization
        self.layer_norm = nn.LayerNorm(self.state_dim)
        
        print("✅ PyTorch state-space model initialized")
    
    def _init_numpy_model(self):
        """Initialize NumPy-based fallback model"""
        # Learned matrices (initialized randomly, would be trained in production)
        np.random.seed(42)
        self.A = np.random.randn(self.state_dim, self.state_dim) * 0.1
        self.B = np.random.randn(self.feature_dim, self.state_dim) * 0.1
        self.C = np.random.randn(self.state_dim, 1) * 0.1
        
        # Attention weights (simplified)
        self.attention_weights = np.ones(self.feature_dim) / self.feature_dim
        
        print("✅ NumPy state-space model initialized (fallback)")
    
    def extract_features(self, team_data: Dict, opponent_data: Optional[Dict] = None) -> np.ndarray:
        """
        Extract feature vector from team data.
        
        Features include:
        - EPA metrics (offense, defense)
        - Recent form (last 5 games)
        - Momentum (trending up/down)
        - Matchup history
        - Expected future performance (probabilistic)
        """
        features = np.zeros(self.feature_dim)
        
        # Feature 0-2: EPA metrics
        features[0] = team_data.get('epa_offense', 0.0)
        features[1] = team_data.get('epa_defense', 0.0)
        features[2] = team_data.get('epa_rank', 15.0) / 32.0  # Normalized rank
        
        # Feature 3-4: Recent form (last 5 games win rate, point differential)
        features[3] = team_data.get('recent_win_rate', 0.5)
        features[4] = team_data.get('recent_point_diff', 0.0) / 20.0  # Normalized
        
        # Feature 5: Momentum (trending up = 1, down = -1, flat = 0)
        features[5] = team_data.get('momentum', 0.0)
        
        # Feature 6-7: Matchup-specific (if opponent data available)
        if opponent_data:
            # Offense vs Defense matchup
            features[6] = features[0] - opponent_data.get('epa_defense', 0.0)
            # Defense vs Offense matchup
            features[7] = opponent_data.get('epa_offense', 0.0) - features[1]
        else:
            features[6] = 0.0
            features[7] = 0.0
        
        # Feature 8-9: Expected future performance (probabilistic predictions)
        # This is the key: using expected future to inform present
        features[8] = self._predict_future_performance(team_data, horizon=3)  # Next 3 games
        features[9] = self._predict_future_performance(team_data, horizon=5)  # Next 5 games
        
        # Feature 10: Home/away advantage
        features[10] = team_data.get('home_advantage', 0.0)
        
        # Feature 11: Rest advantage (days of rest)
        features[11] = team_data.get('rest_advantage', 0.0) / 7.0  # Normalized
        
        return features
    
    def _predict_future_performance(self, team_data: Dict, horizon: int = 3) -> float:
        """
        Predict future performance using current state.
        
        This implements the concept: "Expected future behavior affects present decisions"
        Like how a QB's decision is influenced by where the WR is expected to be.
        """
        # Use current EPA and momentum to predict future performance
        current_epa = team_data.get('epa_offense', 0.0)
        momentum = team_data.get('momentum', 0.0)
        
        # Simple model: future performance = current + momentum trend
        # In production, this would be learned by the neural network
        future_prediction = current_epa + (momentum * 0.1 * horizon)
        
        # Clip to reasonable range
        return np.clip(future_prediction, -0.2, 0.2)
    
    def compute_attention_weights(self, features: np.ndarray, context: Optional[Dict] = None) -> np.ndarray:
        """
        Compute dynamic attention weights for features.
        
        This is like the attention mechanism in Transformers:
        - Different features matter more in different contexts
        - Weights change based on current situation
        """
        if self.use_pytorch:
            # Use PyTorch attention
            features_tensor = torch.FloatTensor(features).unsqueeze(0).unsqueeze(0)  # [1, 1, feature_dim]
            attn_output, attn_weights = self.attention(features_tensor, features_tensor, features_tensor)
            weights = attn_weights.squeeze().detach().numpy()
            return weights.flatten()[:self.feature_dim]  # Take first row
        else:
            # NumPy fallback: context-dependent weighting
            weights = np.ones(self.feature_dim)
            
            # Adjust weights based on context
            if context:
                # In close games, momentum matters more
                if context.get('game_type') == 'close':
                    weights[5] *= 1.5  # Momentum
                
                # In blowouts, EPA matters more
                if context.get('game_type') == 'blowout':
                    weights[0] *= 1.5  # EPA offense
                    weights[1] *= 1.5  # EPA defense
            
            # Normalize
            weights = weights / np.sum(weights)
            return weights
    
    def predict(self, team_features: np.ndarray, opponent_features: Optional[np.ndarray] = None,
                context: Optional[Dict] = None) -> Dict:
        """
        Predict game outcome using state-space model.
        
        Process:
        1. Extract/combine features
        2. Compute attention weights (dynamic importance)
        3. Map features to hidden state (B matrix)
        4. Evolve state (A matrix - state transition)
        5. Map state to output (C matrix - win probability)
        """
        # Combine team and opponent features
        if opponent_features is not None:
            # Create matchup features
            combined_features = np.concatenate([
                team_features,
                opponent_features,
                team_features - opponent_features  # Difference features
            ])
            # Take first feature_dim elements
            if len(combined_features) > self.feature_dim:
                combined_features = combined_features[:self.feature_dim]
            elif len(combined_features) < self.feature_dim:
                combined_features = np.pad(combined_features, (0, self.feature_dim - len(combined_features)))
        else:
            combined_features = team_features
        
        # Apply attention weights (dynamic feature importance)
        attention_weights = self.compute_attention_weights(combined_features, context)
        weighted_features = combined_features * attention_weights
        
        if self.use_pytorch:
            # PyTorch computation
            features_tensor = torch.FloatTensor(weighted_features).unsqueeze(0)  # [1, feature_dim]
            state_tensor = torch.zeros(1, self.state_dim)  # Initial hidden state
            
            # State update: x_new = A * x_old + B * u
            # where x = hidden state, u = input features
            state_tensor = torch.matmul(state_tensor, self.A.T) + torch.matmul(features_tensor, self.B)
            state_tensor = self.layer_norm(state_tensor)
            
            # Output: y = C * x
            output = torch.matmul(state_tensor, self.C)
            win_probability = torch.sigmoid(output).item()  # Convert to probability
            
        else:
            # NumPy computation
            # Initial hidden state
            state = np.zeros(self.state_dim)
            
            # State update: x_new = A * x_old + B * u
            state = np.dot(state, self.A.T) + np.dot(weighted_features, self.B)
            
            # Normalize state
            state = state / (np.linalg.norm(state) + 1e-8)
            
            # Output: y = C * x
            output = np.dot(state, self.C)
            win_probability = 1 / (1 + np.exp(-output))  # Sigmoid
            
        # Calculate confidence based on state magnitude
        if self.use_pytorch:
            state_magnitude = torch.norm(state_tensor).item()
        else:
            state_magnitude = np.linalg.norm(state)
        
        confidence = min(100, int(state_magnitude * 20))  # Scale to 0-100
        
        return {
            'win_probability': float(win_probability),
            'confidence': confidence,
            'state_magnitude': float(state_magnitude),
            'attention_weights': attention_weights.tolist() if isinstance(attention_weights, np.ndarray) else attention_weights
        }
    
    def calculate_ev(self, win_probability: float, odds: float) -> Dict:
        """
        Calculate Expected Value and Kelly Criterion from prediction.
        
        Args:
            win_probability: Model's predicted win probability (0-1)
            odds: Decimal odds from sportsbook
        
        Returns:
            dict with EV, Kelly fraction, recommendation
        """
        # Expected Value: EV = (p * odds) - 1
        ev = (win_probability * odds) - 1
        ev_percent = ev * 100
        
        # Kelly Criterion: f = (bp - q) / b
        # where b = odds - 1, p = win_prob, q = 1 - p
        b = odds - 1
        p = win_probability
        q = 1 - p
        
        if b > 0:
            kelly_fraction = (b * p - q) / b
            kelly_fraction = max(0, min(kelly_fraction, 0.25))  # Cap at 25%
        else:
            kelly_fraction = 0.0
        
        # Recommendation
        if ev_percent > 5 and win_probability > 0.55:
            recommendation = "STRONG_PLAY"
        elif ev_percent > 2 and win_probability > 0.52:
            recommendation = "MODERATE_PLAY"
        elif ev_percent > 0:
            recommendation = "WEAK_PLAY"
        else:
            recommendation = "FADE"
        
        return {
            'ev': ev,
            'ev_percent': ev_percent,
            'kelly_fraction': kelly_fraction,
            'recommendation': recommendation,
            'implied_probability': 1 / odds,
            'edge': win_probability - (1 / odds)  # True prob - implied prob
        }


# Global predictor instance
_predictor = None

def get_predictor() -> StateSpacePredictor:
    """Get or create global predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = StateSpacePredictor(use_pytorch=PYTORCH_AVAILABLE)
    return _predictor


def predict_game(team_data: Dict, opponent_data: Optional[Dict] = None,
                 odds: Optional[float] = None, context: Optional[Dict] = None) -> Dict:
    """
    Main prediction function for a game.
    
    Args:
        team_data: Dict with team metrics (EPA, recent form, etc.)
        opponent_data: Optional opponent metrics
        odds: Optional decimal odds from sportsbook
        context: Optional context (game_type, home/away, etc.)
    
    Returns:
        dict with prediction, EV, Kelly, recommendation
    """
    predictor = get_predictor()
    
    # Extract features
    team_features = predictor.extract_features(team_data, opponent_data)
    opponent_features = None
    if opponent_data:
        opponent_features = predictor.extract_features(opponent_data, team_data)
    
    # Predict outcome
    prediction = predictor.predict(team_features, opponent_features, context)
    
    result = {
        'win_probability': prediction['win_probability'],
        'confidence': prediction['confidence'],
        'state_magnitude': prediction['state_magnitude'],
        'attention_weights': prediction['attention_weights']
    }
    
    # Calculate EV if odds provided
    if odds:
        ev_data = predictor.calculate_ev(prediction['win_probability'], odds)
        result.update(ev_data)
    
    return result


def enhance_ev_bet(ev_bet: Dict, team_data: Dict, opponent_data: Optional[Dict] = None) -> Dict:
    """
    Enhance an EV bet with state-space model predictions.
    
    Takes a basic EV bet and adds:
    - Learned win probability (not just implied from odds)
    - Confidence score
    - Attention weights (which factors matter)
    - Enhanced EV calculation
    """
    # Get odds from bet
    odds = ev_bet.get('odds', 1.0)
    
    # Context from bet
    context = {
        'game_type': 'close' if abs(odds - 2.0) < 0.3 else 'blowout',
        'market': ev_bet.get('market', 'h2h')
    }
    
    # Predict using state-space model
    prediction = predict_game(team_data, opponent_data, odds, context)
    
    # Merge with original bet data
    enhanced_bet = ev_bet.copy()
    enhanced_bet.update({
        'model_win_probability': prediction['win_probability'],
        'model_confidence': prediction['confidence'],
        'model_ev': prediction.get('ev_percent', 0),
        'model_kelly_fraction': prediction.get('kelly_fraction', 0),
        'model_recommendation': prediction.get('recommendation', 'FADE'),
        'edge': prediction.get('edge', 0),
        'attention_weights': prediction.get('attention_weights', []),
        'prediction_method': 'state_space_model'
    })
    
    return enhanced_bet

