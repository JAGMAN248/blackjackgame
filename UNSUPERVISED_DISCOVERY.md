# Unsupervised Feature Discovery Guide

## Overview

The unsupervised feature discovery system finds **hidden correlations** in data without pre-classification. It extracts news, weather, and player mechanics as **anonymous weighted features** (no names, just numbered weights).

## Key Features

1. **Correlation Discovery**: Finds hidden relationships between features automatically
2. **Anonymous Features**: No feature names - just numbered weights
3. **News & Weather Integration**: Fetches latest data as weighted features
4. **Player Mechanics**: Extracts all player stats as anonymous weights
5. **Pattern Discovery**: Discovers what makes winning parleys

## Anonymous Feature Extraction

All features are returned as **numbered weights only** - no names or classifications:

```json
{
  "news_weights": [0.23, -0.15, 0.08, ...],  // 8 weights (no names)
  "weather_weights": [-0.12, 0.45, ...],     // 6 weights (no names)
  "player_weights": [0.18, 0.32, -0.05, ...] // N weights (no names)
}
```

## API Endpoints

### Discover Patterns

**POST** `/api/nfl/discover-patterns`

Discovers hidden correlations in your parley data.

```json
{
  "training_data": [
    {
      "parley_bets": [
        {
          "qb_data": {...},
          "team_data": {...},
          "team_abbr": "KC",
          "opponent_abbr": "BUF"
        }
      ],
      "won": true
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "discovered_features": 20,
  "feature_weights": [[...], [...], ...],  // Anonymous weights
  "explained_variance": [0.25, 0.18, ...],
  "strong_correlations": [
    {
      "feature_i": 3,
      "feature_j": 7,
      "correlation": 0.82
    }
  ],
  "winning_pattern": [0.15, -0.08, 0.23, ...],  // Pattern for wins
  "note": "Features are anonymous (numbered weights only, no names)"
}
```

### Fetch News & Weather

**POST** `/api/nfl/fetch-news-weather`

Fetches latest news and weather as anonymous features.

```json
{
  "team_abbr": "KC",
  "opponent_abbr": "BUF"
}
```

**Response:**
```json
{
  "team": "KC",
  "opponent": "BUF",
  "news_weights": [0.23, -0.15, 0.08, 0.12, -0.05, 0.45, 0.18, 0.32],
  "weather_weights": [-0.12, -0.25, -0.08, 0.05, 1.0, 0.85],
  "combined_weights": [0.23, -0.15, ..., -0.12, -0.25, ...],
  "note": "Weights are anonymous (no feature names, just numbered values)"
}
```

**News Weights (8 dimensions):**
- Weight 0: Recent performance sentiment
- Weight 1: Injury news frequency
- Weight 2: Trade/roster changes
- Weight 3: Coaching news
- Weight 4: Player controversy (negative)
- Weight 5: Media attention volume
- Weight 6: Positive momentum
- Weight 7: Team chemistry

**Weather Weights (6 dimensions):**
- Weight 0: Temperature impact
- Weight 1: Wind speed (negative)
- Weight 2: Precipitation (negative)
- Weight 3: Humidity
- Weight 4: Dome indicator
- Weight 5: Weather consistency

### Predict Using Discovered Patterns

**POST** `/api/nfl/predict-unsupervised`

Predicts parley using automatically discovered patterns.

```json
{
  "parley_bets": [
    {
      "qb_data": {...},
      "team_data": {...},
      "team_abbr": "KC",
      "opponent_abbr": "BUF"
    }
  ]
}
```

**Response:**
```json
{
  "predicted_win_probability": 0.72,
  "confidence": "High",
  "method": "Unsupervised pattern discovery",
  "note": "Uses automatically discovered correlations (no pre-classified features)"
}
```

### Extract Anonymous Player Mechanics

**POST** `/api/nfl/extract-anonymous-mechanics`

Extracts all player stats as anonymous weighted features.

```json
{
  "epa_per_dropback": 0.15,
  "completion_rate": 0.68,
  "touchdowns": 28,
  "interceptions": 8,
  ...
}
```

**Response:**
```json
{
  "anonymous_weights": [0.15, 0.68, 0.28, -0.08, ...],
  "n_features": 12,
  "note": "Features are anonymous (numbered weights only)"
}
```

## How It Works

### 1. Correlation Discovery

Uses **Principal Component Analysis (PCA)** to find:
- Hidden patterns in data
- Features that correlate with winning
- Strong relationships between variables

### 2. Feature Extraction

Automatically extracts:
- All player stats (no pre-classification)
- News sentiment and frequency
- Weather conditions
- Team metrics

### 3. Pattern Discovery

Finds:
- **Winning Pattern**: Average feature values for winning parleys
- **Strong Correlations**: Features that move together
- **Important Components**: Features that explain most variance

### 4. Prediction

Uses discovered patterns to predict:
- Distance to winning pattern → probability
- Closer to pattern = higher win probability

## Example Workflow

```python
import requests

# 1. Discover patterns from historical parleys
training_data = [
    {
        "parley_bets": [...],
        "won": True
    },
    # ... more parleys
]

response = requests.post(
    "http://localhost:8000/api/nfl/discover-patterns",
    json={"training_data": training_data}
)
patterns = response.json()

# 2. Fetch news/weather for new parley
news_weather = requests.post(
    "http://localhost:8000/api/nfl/fetch-news-weather",
    json={"team_abbr": "KC", "opponent_abbr": "BUF"}
)

# 3. Predict new parley
prediction = requests.post(
    "http://localhost:8000/api/nfl/predict-unsupervised",
    json={"parley_bets": [...]}
)
```

## What Gets Discovered

The system automatically finds:

1. **Hidden Correlations**: Features that move together
   - Example: QB red zone efficiency correlates with parley wins
   - Example: Weather conditions correlate with passing stats

2. **Winning Patterns**: Average feature values for winners
   - Example: Winning parleys have higher weight_3, lower weight_7
   - Example: Pattern: [0.15, -0.08, 0.23, ...]

3. **Important Features**: Which weights matter most
   - Explained variance shows which components are most important
   - Higher variance = more predictive power

4. **News/Weather Impact**: How external factors affect outcomes
   - News sentiment weights
   - Weather condition weights
   - Combined impact on predictions

## Advantages

1. **No Pre-Classification**: Discovers patterns automatically
2. **Anonymous Features**: No bias from feature names
3. **Real-Time Data**: Fetches latest news and weather
4. **Correlation Discovery**: Finds hidden relationships
5. **Adaptive**: Learns from your data

## Notes

- Features are **completely anonymous** (just numbered weights)
- No feature names or classifications
- System discovers what matters automatically
- News and weather fetched in real-time
- All player stats extracted as weights

---

**The system discovers hidden patterns in YOUR data without any pre-classification!**

