# NFL Parley Predictor - Multi-Layer State-Space Model

## Overview

The NFL Parley Predictor uses a **multi-layer state-space model** that learns from real NFL data and discovers hidden mechanics for winning parleys.

### Key Features

1. **Player-Level Mechanics**: Extracts hidden factors for each position
   - QB: Clutch factor, red zone efficiency, deep ball accuracy
   - RB: Breakaway ability, goal line efficiency, fumble rate
   - WR: Target share, separation ability, YAC
   - Defense: Pressure rate, turnover rate, red zone stops

2. **Multi-Layer Architecture**:
   - **Layer 1**: Player Mechanics → Hidden States (29 features)
   - **Layer 2**: Team Synergy → Hidden States (5 features)
   - **Layer 3**: Matchup Dynamics → Hidden States (10 features)
   - **Layer 4**: State Combination → Parley Prediction

3. **Attention Mechanisms**: Each layer uses attention to dynamically weight features

4. **Learned State Transitions**: Each layer learns its own A matrix (state transition dynamics)

## Architecture

```
Input Features
    ↓
Layer 1: Player Mechanics (QB+RB+WR+DEF)
    ↓ Attention → State Space (A₁)
    ↓
Layer 2: Team Synergy
    ↓ Attention → State Space (A₂)
    ↓
Layer 3: Matchup Dynamics
    ↓ Attention → State Space (A₃)
    ↓
Layer 4: Combine All States
    ↓
Parley Win Probability
```

## Player Mechanics Extracted

### QB Mechanics (8 dimensions)
1. EPA per dropback (overall efficiency)
2. Completion rate under pressure (resilience)
3. Deep ball accuracy (big play ability)
4. Red zone TD rate (scoring ability)
5. 4th quarter EPA (clutch performance)
6. Home vs away split (consistency)
7. Weather EPA (reliability)
8. Clutch factor (game-winning drives per game)

### RB Mechanics (6 dimensions)
1. Yards per carry (normalized)
2. Breakaway run rate (20+ yard runs)
3. Goal line TD rate
4. Reception rate (pass catching)
5. Fumble rate (negative - lower is better)
6. Usage rate (touches per game)

### WR Mechanics (7 dimensions)
1. Target share
2. Catch rate
3. Yards after catch (normalized)
4. Deep target rate
5. Red zone target rate
6. Drop rate (negative)
7. Separation rating (open rate)

### Defense Mechanics (8 dimensions)
1. EPA allowed per play (negative - lower is better)
2. Pressure rate
3. Turnover rate
4. Red zone stop rate
5. 3rd down stop rate
6. Deep ball allowed rate (negative)
7. Run EPA allowed (negative)
8. Penalty rate (negative)

### Team Synergy (5 dimensions)
1. QB-WR connection strength
2. Offensive line protection (sack rate, negative)
3. Special teams EPA
4. Coaching efficiency
5. Injury impact (negative)

### Matchup Dynamics (10 dimensions)
1. Offense vs Defense EPA advantage
2. Defense vs Offense EPA advantage
3. Home field advantage
4. Rest advantage
5. Weather factor
6. Divisional game indicator
7. Recent form difference
8. Injury impact difference
9. Coaching matchup advantage
10. Historical head-to-head advantage

## API Endpoints

### Train Parley Model

**POST** `/api/nfl/train-parley-model`

```json
{
  "parleys": [
    {
      "player_features": [0.15, 0.55, 0.45, ...],  // 29 dims
      "team_features": [0.7, -0.05, 0.0, ...],     // 5 dims
      "matchup_features": [0.03, -0.02, 1.0, ...],  // 10 dims
      "won": true
    }
  ],
  "epochs": 20
}
```

### Predict Parley

**POST** `/api/nfl/predict-parley`

```json
{
  "parley_bets": [
    {
      "qb_data": {
        "epa_per_dropback": 0.15,
        "completion_rate_under_pressure": 0.55,
        "deep_ball_accuracy": 0.45,
        "red_zone_td_rate": 0.6,
        "q4_epa": 0.12,
        "home_epa": 0.16,
        "away_epa": 0.14,
        "weather_epa": 0.13,
        "game_winning_drives": 3,
        "games_played": 16
      },
      "rb_data": {...},
      "wr_data": {...},
      "def_data": {...},
      "team_data": {
        "epa_offense": 0.08,
        "epa_defense": 0.05,
        "qb_wr_connection": 0.7,
        "sack_rate": 0.05,
        "special_teams_epa": 0.0,
        "coaching_efficiency": 0.6,
        "injury_impact_score": 0.1
      },
      "opponent_data": {...},
      "home": true,
      "rest_advantage": 2,
      "weather_factor": 0.0,
      "divisional": false,
      "coaching_advantage": 0.1,
      "h2h_advantage": 0.05
    }
  ]
}
```

**Response:**
```json
{
  "predicted_win_probability": 0.72,
  "confidence": "High",
  "recommendation": "STRONG_PLAY",
  "mechanics_insights": {
    "qb_clutch_factor": 0.1875,
    "qb_red_zone_efficiency": 0.6
  },
  "model_layers": {
    "layer_1": "Player Mechanics (QB+RB+WR+DEF)",
    "layer_2": "Team Synergy",
    "layer_3": "Matchup Dynamics",
    "layer_4": "Parley Combination"
  }
}
```

### Fetch Historical Data

**GET** `/api/nfl/fetch-historical-data?team_abbr=KC&year=2024`

Returns team data and player mechanics that can be used for training.

## Training Process

### Step 1: Collect Parley Data

For each parley you've placed:
- Record all bets in the parley
- Record whether it won or lost
- Include player/team/matchup data

### Step 2: Build Training Dataset

The model will automatically extract:
- Player mechanics from QB/RB/WR/DEF data
- Team synergy from team stats
- Matchup dynamics from game context

### Step 3: Train Model

Call `/api/nfl/train-parley-model` with your parley history.

The model learns:
- Which player mechanics matter most for parleys
- How team synergy affects outcomes
- What matchup factors predict wins
- Hidden patterns across all layers

### Step 4: Use Predictions

After training, use `/api/nfl/predict-parley` to predict new parleys.

## What Makes Winning Parleys?

The model discovers hidden mechanics such as:

1. **QB Clutch Factor**: QBs with high game-winning drives → better parley success
2. **Red Zone Efficiency**: Teams that convert in red zone → more scoring → more wins
3. **Defense Pressure**: High pressure rates → more turnovers → better outcomes
4. **Team Synergy**: Strong QB-WR connections → more consistent performance
5. **Matchup Advantages**: Offense vs weak defense → higher win probability

## Model Files

Trained model saved to:
- `backend/models/nfl_parley_model.pt`

Automatically loaded on startup if it exists.

## Integration with Existing Code

The parley predictor integrates with:
- `/api/scan-ev-bets` - Can use parley predictions for multi-leg bets
- `/api/validate-bet` - Enhanced with player-level mechanics

## Example: Building a Winning Parley

```python
import requests

# Build parley with player mechanics
parley_bets = [
    {
        "qb_data": {
            "epa_per_dropback": 0.18,  # Elite QB
            "red_zone_td_rate": 0.7,    # High scoring
            "game_winning_drives": 4,   # Clutch
            # ... more QB stats
        },
        "team_data": {
            "epa_offense": 0.12,        # Top offense
            "qb_wr_connection": 0.8,    # Strong connection
            # ... more team stats
        },
        "opponent_data": {
            "epa_defense": 0.08,        # Weak defense
            # ... opponent stats
        },
        "home": True,
        "rest_advantage": 3
    }
]

# Predict parley
response = requests.post(
    "http://localhost:8000/api/nfl/predict-parley",
    json={"parley_bets": parley_bets}
)

result = response.json()
print(f"Win Probability: {result['predicted_win_probability']:.1%}")
print(f"Recommendation: {result['recommendation']}")
```

## Success Metrics

The model optimizes for:
- **Parley Win Rate**: Percentage of parleys that win
- **Accuracy**: Correct predictions on held-out data

After training, monitor:
- Training loss (should decrease)
- Accuracy (should increase)
- Validation performance (should improve)

---

**The model learns from YOUR parley history, discovering hidden mechanics that predict winning combinations!**

