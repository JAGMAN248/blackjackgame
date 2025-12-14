# How Data Flows in This System

## Ollama - Does NOT Fetch Data

**Important:** Ollama is a **reasoning engine**, not a data fetcher. It doesn't get data on its own.

### How Ollama Works:

1. **You provide data** → Backend calculates math (Monte Carlo, risk analysis)
2. **Backend sends data to Ollama** → Creates a prompt with your stats
3. **Ollama reasons about the data** → Returns strategic advice
4. **Backend returns advice** → You see it in the UI

**Example Flow:**
```
Your Game Stats
    ↓
Monte Carlo Simulation (risk_engine.py)
    ↓
Math Results (risk_of_ruin: 8%, expected_bankroll: $1200)
    ↓
Ollama Prompt: "Risk of Ruin is 8%. Should user continue?"
    ↓
Ollama Response: "⚠️ DANGEROUS. Lower bet size."
```

**Ollama does NOT:**
- ❌ Fetch NFL data
- ❌ Get player stats
- ❌ Access external APIs
- ❌ Pull betting odds

**Ollama DOES:**
- ✅ Reason about data you give it
- ✅ Provide strategic advice
- ✅ Analyze risk scenarios
- ✅ Suggest game strategies

---

## NFL Predictor - How It Gets Data

### Current Status: **PARTIALLY IMPLEMENTED**

The NFL predictor has the **structure** to fetch data, but needs setup:

### 1. **Team Data** ✅ Can Fetch (if `nfl_data_py` installed)

```python
# In nfl_parley_predictor.py
def fetch_team_data(self, team_abbr: str, year: int = None):
    if not NFL_DATA_AVAILABLE:
        return self._mock_team_data(team_abbr)  # Falls back to mock
    
    # Fetches from nfl_data_py
    df = nfl.import_seasonal_data([year])
    team_data = df[df['team'] == team_abbr.upper()]
```

**What it gets:**
- EPA (Expected Points Added) stats
- Team efficiency metrics
- Seasonal data

**Setup:**
```bash
pip install nfl-data-py
```

### 2. **Player Data** ⚠️ Currently MOCKED

```python
def fetch_player_data(self, player_name: str, position: str, year: int = None):
    if not NFL_DATA_AVAILABLE:
        return self._mock_player_data(position)  # Returns mock data
    
    # TODO: In production, fetch from nfl_data_py player stats
    return self._mock_player_data(position)  # Currently always returns mock
```

**Status:** Player data fetching is **not fully implemented**. It always returns mock data.

**To fix:** Need to implement actual player stat fetching from `nfl_data_py`.

### 3. **Training Data** ⚠️ Requires Your Input

The model needs **historical parley data** to train:

```python
# You must provide training data via API
POST /api/nfl/train-parley-model
{
    "parleys": [
        {
            "player_features": [...],  # 29 dims
            "team_features": [...],    # 5 dims
            "matchup_features": [...], # 10 dims
            "won": true  # Did this parley win?
        },
        ...
    ],
    "epochs": 20
}
```

**Without training data, the model:**
- Uses random weights (not accurate)
- Can't learn patterns
- Won't predict accurately

---

## How NFL Predictor Decides Likelihood

### There is NO OpenAI Integration

**Important:** There's no "OpenAI best bets" in this codebase. The NFL predictor works independently.

### Prediction Process:

1. **Input:** You provide parley bets with player/team data
2. **Feature Extraction:**
   - Player mechanics (QB, RB, WR, Defense) → 29 dimensions
   - Team synergy → 5 dimensions
   - Matchup dynamics → 10 dimensions
3. **Multi-Layer State-Space Model:**
   - Layer 1: Player mechanics → Hidden states
   - Layer 2: Team synergy → Hidden states
   - Layer 3: Matchup dynamics → Hidden states
   - Layer 4: Combine all → Win probability
4. **Output:** Win probability (0-1)

### Example:

```python
# You send parley bets
POST /api/nfl/predict-parley
{
    "parley_bets": [
        {
            "qb_data": {
                "epa_per_dropback": 0.15,
                "red_zone_td_rate": 0.6,
                ...
            },
            "team_data": {...},
            "opponent_data": {...},
            "home": true,
            ...
        }
    ]
}

# Model processes through layers
# Returns: {"predicted_win_probability": 0.68}
```

---

## What's Missing for Full Functionality

### 1. **Real Player Data Fetching**
- Currently: Always returns mock data
- Needed: Implement `fetch_player_data()` to use `nfl_data_py` player stats

### 2. **Training Data**
- Currently: Model has random weights
- Needed: You must provide historical parley data to train

### 3. **News/Weather Integration**
- Code exists in `unsupervised_features.py`
- But not fully integrated into NFL predictor

### 4. **OpenAI Integration**
- **Does not exist** in this codebase
- If you want to integrate OpenAI bets, you'd need to:
  - Add OpenAI API calls
  - Fetch their bet recommendations
  - Feed them into the NFL predictor
  - Compare predictions

---

## Summary

### Ollama:
- ✅ Works for strategic advice
- ❌ Does NOT fetch data
- ✅ Receives data you provide and reasons about it

### NFL Predictor:
- ⚠️ Team data: Can fetch (if `nfl_data_py` installed)
- ❌ Player data: Currently mocked (needs implementation)
- ❌ Training: Needs your historical parley data
- ❌ OpenAI: No integration exists

### To Make It Work:
1. Install `nfl-data-py`: `pip install nfl-data-py`
2. Implement real player data fetching
3. Provide training data (historical parleys with outcomes)
4. Train the model
5. Then it can predict accurately

**Current State:** The structure is there, but it needs data and training to be useful.

