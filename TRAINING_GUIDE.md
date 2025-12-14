# State-Space Model Training Guide

## Overview

The AI wrapper now provides **trainable state-space models with attention** that learn from your data:

- **Casino Model**: Predicts clean money (washing progress) - Success metric: Clean money ratio
- **Sportsbook Model**: Predicts winning bets - Success metric: Win rate

## Architecture

### State-Space Model with Attention

- **Learned State Variables**: Automatically discovers hidden factors
- **Attention Mechanism**: Dynamically weights features based on context
- **Base Weights**: Initialized with Xavier uniform (good starting point)
- **Training**: Uses Adam optimizer with MSE loss

### Success Metrics

**Casino:**
- **Metric**: Clean money ratio (final clean money / starting bankroll)
- **Goal**: Maximize clean money while washing bonus funds
- **Range**: 0.0 (lost everything) to 1.0+ (profitable)

**Sportsbook:**
- **Metric**: Win rate (bets won / total bets)
- **Goal**: Maximize winning bets
- **Range**: 0.0 (never win) to 1.0 (always win)

## Training Data Format

### Casino Training Data

```json
{
  "sessions": [
    {
      "game_type": "blackjack",
      "avg_bet_size": 25,
      "starting_bankroll": 1000,
      "dirty_money": 200,
      "duration_minutes": 120,
      "hands_played": 300,
      "washing_target": 400,
      "clean_money": 850  // Success metric: final clean money
    }
  ],
  "epochs": 10
}
```

### Sportsbook Training Data

```json
{
  "bets": [
    {
      "team_data": {
        "epa_offense": 0.08,
        "epa_defense": 0.05,
        "epa_rank": 5,
        "recent_win_rate": 0.6,
        "momentum": 0.1
      },
      "opponent_data": {
        "epa_offense": 0.06,
        "epa_defense": 0.07,
        "epa_rank": 12,
        "recent_win_rate": 0.5,
        "momentum": -0.1
      },
      "odds": 2.1,
      "home": true,
      "rest_advantage": 2,
      "won": true  // Success metric: did bet win?
    }
  ],
  "epochs": 10
}
```

## API Endpoints

### Train Casino Model

**POST** `/api/train-casino-model`

```bash
curl -X POST http://localhost:8000/api/train-casino-model \
  -H "Content-Type: application/json" \
  -d '{
    "sessions": [...],
    "epochs": 10
  }'
```

### Train Sportsbook Model

**POST** `/api/train-sportsbook-model`

```bash
curl -X POST http://localhost:8000/api/train-sportsbook-model \
  -H "Content-Type: application/json" \
  -d '{
    "bets": [...],
    "epochs": 10
  }'
```

### Predict Casino Success

**POST** `/api/predict-casino-success`

```bash
curl -X POST http://localhost:8000/api/predict-casino-success \
  -H "Content-Type: application/json" \
  -d '{
    "game_type": "blackjack",
    "avg_bet_size": 25,
    "starting_bankroll": 1000,
    "dirty_money": 200,
    "duration_minutes": 120,
    "hands_played": 300,
    "washing_target": 400
  }'
```

**Response:**
```json
{
  "predicted_clean_money_ratio": 0.85,
  "interpretation": "Higher value = more clean money expected"
}
```

### Predict Sportsbook Win

**POST** `/api/predict-sportsbook-win`

```bash
curl -X POST http://localhost:8000/api/predict-sportsbook-win \
  -H "Content-Type: application/json" \
  -d '{
    "team_data": {...},
    "opponent_data": {...},
    "odds": 2.1,
    "home": true,
    "rest_advantage": 2
  }'
```

**Response:**
```json
{
  "predicted_win_probability": 0.65,
  "interpretation": "Higher value = more likely to win"
}
```

## Training Process

### Step 1: Collect Data

**For Casino:**
- Track your sessions with:
  - Game type, bet sizes, bankroll
  - Final clean money (success metric)
  - Washing progress

**For Sportsbook:**
- Track your bets with:
  - Team/opponent data (EPA, recent form)
  - Odds
  - Win/loss outcome (success metric)

### Step 2: Prepare Data

Ensure your data matches the format above. Minimum 10 samples required for training.

### Step 3: Train Model

Call the training endpoint with your data. The model will:
1. Initialize with base weights (Xavier uniform)
2. Train for specified epochs
3. Save model to `backend/models/` directory

### Step 4: Use Predictions

After training, use prediction endpoints to get model predictions for new scenarios.

## Model Files

Trained models are saved to:
- `backend/models/casino_model.pt`
- `backend/models/sportsbook_model.pt`

Models are automatically loaded on startup if they exist.

## Features Used

### Casino Features (12 dimensions)
1. Game type (encoded)
2. Bet size / bankroll ratio
3. Starting bankroll (normalized)
4. Dirty money ratio
5. Session duration (normalized)
6. Hands played (normalized)
7. Washing target ratio
8-12. Reserved for future features

### Sportsbook Features (12 dimensions)
1. Team EPA offense
2. Team EPA defense
3. Team EPA rank (normalized)
4. Opponent EPA offense
5. Opponent EPA defense
6. Odds (implied probability)
7. Team recent win rate
8. Opponent recent win rate
9. Team momentum
10. Opponent momentum
11. Home/away (1.0 = home, 0.0 = away)
12. Rest advantage (normalized)

## Training Tips

1. **More Data = Better**: Collect at least 50-100 samples for good results
2. **Diverse Data**: Include various scenarios (winning, losing, different games)
3. **Regular Retraining**: Retrain periodically as you collect more data
4. **Monitor Loss**: Lower loss = better predictions
5. **Validation**: Test on held-out data to verify model quality

## Integration with Existing Code

The trained models are automatically used by:
- `/api/scan-ev-bets` - Uses sportsbook model for win probability
- `/api/validate-bet` - Uses sportsbook model for predictions
- Casino Night workflow - Uses casino model for success prediction

## Example: Training from Session History

```python
# In your backend code or script
import requests

# Get your session history (from localStorage or database)
sessions = [
    {
        "game_type": "blackjack",
        "avg_bet_size": 25,
        "starting_bankroll": 1000,
        "dirty_money": 200,
        "duration_minutes": 120,
        "hands_played": 300,
        "washing_target": 400,
        "clean_money": 850
    },
    # ... more sessions
]

# Train model
response = requests.post(
    "http://localhost:8000/api/train-casino-model",
    json={"sessions": sessions, "epochs": 20}
)
print(response.json())
```

## Troubleshooting

**"Need at least 10 sessions/bets for training"**
- Collect more data before training

**"State-space model not available"**
- Ensure PyTorch is installed: `pip install torch`

**"Model not improving"**
- Try more epochs
- Check data quality
- Ensure success metrics are correct

**"Predictions seem random"**
- Model needs more training data
- Retrain with more diverse samples

---

**The models learn from YOUR data, adapting to YOUR playing style and success patterns!**

