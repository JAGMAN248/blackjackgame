# Setup & Technical Documentation

Complete setup guide, configuration, and technical details for the Blackjack Tracker.

## 📋 Table of Contents

1. [Backend Setup](#backend-setup)
2. [ML/AI Setup](#mlai-setup)
3. [Casino Night Workflow](#casino-night-workflow)
4. [Risk Analysis System](#risk-analysis-system)
5. [Sports Brains Integration](#sports-brains-integration)
6. [API Documentation](#api-documentation)
7. [Fixes & Development Notes](#fixes--development-notes)
8. [Troubleshooting](#troubleshooting)

---

## Backend Setup

### Minimal Setup (Required)

**Only 1 dependency needed:**
```bash
pip install numpy
```

This enables the Risk Engine (Monte Carlo simulations). The system works with just NumPy.

### Full Backend Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up API key:**
   - Copy `.env.example` to `.env`
   - Add your Odds API key: `ODDS_API_KEY=your_key_here`
   - Get key from: https://the-odds-api.com/

3. **Start the backend server:**
   ```bash
   python backend_api.py
   # Or: uvicorn backend_api:app --reload --port 8000
   ```

### Environment Variables

Create `.env` file:
```
ODDS_API_KEY=your_key_here
USE_LOCAL_AI=false  # Set to true to enable AI (see ML Setup)
AI_MODEL_ID=deepseek-ai/deepseek-math-7b-instruct  # Optional: specify model
```

---

## ML/AI Setup

### Quick Start (Automated)

```bash
python setup_ml.py
```

This will:
1. ✅ Install PyTorch (with CUDA if available)
2. ✅ Install Transformers & BitsAndBytes
3. ✅ Configure environment variables
4. ✅ Test the setup
5. ✅ Download model on first use (~4GB)

### Manual ML Setup

**Step 1: Install PyTorch**

For NVIDIA GPU (CUDA 12.1):
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

For CPU only:
```bash
pip install torch torchvision torchaudio
```

**Step 2: Install Transformers**
```bash
pip install transformers accelerate bitsandbytes
```

**Step 3: Enable AI**
Add to `.env`:
```
USE_LOCAL_AI=true
AI_MODEL_ID=deepseek-ai/deepseek-math-7b-instruct
```

**Step 4: Test**
```bash
python quick_test_ai.py
```

### Model Information

**Default Model:** DeepSeek-Math-7B-Instruct
- **Size:** 7B parameters (~4GB quantized)
- **Type:** Open-source, math-focused LLM
- **License:** Apache 2.0
- **Source:** HuggingFace
- **First Download:** ~5-10 minutes (one-time)

**Why This Model:**
- ✅ Open-source (Apache 2.0)
- ✅ Small (fits on consumer GPUs)
- ✅ Math-focused (perfect for risk analysis)
- ✅ Pre-trained (no training needed)
- ✅ Functional (ready to use)

**Alternative Models:**
- `meta-llama/Meta-Llama-3-8B-Instruct` - General purpose, well-tested
- `mistralai/Mistral-7B-Instruct-v0.3` - Fast inference
- `microsoft/Phi-3-small-7b-instruct` - Low-end GPUs

### ML Architecture

```
User Request
    ↓
Risk Engine (NumPy) ← Pure Math, NOT ML
    ↓ Calculates: risk_of_ruin_percent = 2.5%
    ↓
AI Wrapper (PyTorch + LLM) ← THIS IS THE ML
    ↓ Loads: DeepSeek-Math-7B (pre-trained model)
    ↓ Generates: Strategic advice
    ↓
Response
```

**Key Principle:** Math handles calculations (zero hallucinations), AI handles strategic reasoning.

### ML Components Location

- **AI Reasoning Engine**: `backend/ai_wrapper.py`
  - Loads pre-trained LLM models
  - Uses PyTorch for inference
  - Provides strategic reasoning based on math results

- **Risk Engine**: `backend/risk_engine.py`
  - Pure NumPy mathematics (NOT ML)
  - Monte Carlo simulation
  - Calculates Risk of Ruin, EV, Kelly Criterion

- **Sports Brains**: `backend/brains/`
  - NFL: `nfl/nfl_engine.py` - EPA analysis
  - NHL: `nhl/nhl_engine.py` - xG analysis
  - NBA: `nba/` - Ready for ML integration

### Hallucination Prevention

The system is designed to prevent hallucinations:

1. **Math Engine is Primary** - All calculations use pure NumPy (zero AI)
2. **AI Only Provides Advice** - Never calculates numbers, only interprets them
3. **Pre-trained Models** - Well-tested models from HuggingFace
4. **Low Temperature (0.1)** - Focuses on logic, not creativity
5. **Fallback System** - Rule-based advice if AI unavailable

**What AI CANNOT Do:**
- ❌ Calculate risk percentages (already done by NumPy)
- ❌ Change EV calculations (already done by NumPy)
- ❌ Modify Kelly Criterion (already done by NumPy)

**What AI CAN Do:**
- ✅ Interpret risk levels ("2.5% is low risk")
- ✅ Provide strategic advice ("Consider reducing bet size")
- ✅ Explain implications ("Your bet is 5% of bankroll, which is aggressive")

---

## Casino Night Workflow

### Overview

The app is a **Session-Based Operating System for Advantage Play (AP)**. This enables a complete "Casino Night" workflow where you enter a casino, track every move, utilize ML helpers, and cash out.

### Phase 1: Check-In (The Lobby)

**Before you see any games**, click **"🏦 Start Casino Night"** button in the header.

**Inputs:**
- **Starting Cash** (Clean Money): e.g., $1,000
- **Bonus Funds** (Dirty Money): e.g., $200
- **Washing Target** (Optional): Defaults to 2x bonus if not specified

**What happens:**
- Bankroll is initialized
- Dirty money is tracked separately
- Washing target is set
- Session becomes active

### Phase 2: Heads Up Display (HUD)

Once the session starts, a **permanent footer bar** appears at the bottom of the screen, visible on all tabs:

**Left Section:**
- 🏦 **Bankroll**: Current total bankroll

**Center Section:**
- 🧼 **Wash Progress**: Visual progress bar showing wagering progress
- Percentage and amount (e.g., "40% ($400 / $1,000)")

**Right Section:**
- **Risk Indicator**: 🟢 Low / 🟡 Medium / 🔴 High Risk
- 🔴 **End Night** button
- 🧠 **Ask Coach** button (AI recommendations)

### Phase 3: Game Logger (Mirror Mode)

**All games automatically log to the session:**

#### Blackjack
- Every hand automatically logs wins/losses
- Wager amount and net result tracked
- No manual input needed

#### Sportsbook, Craps, Poker
- Use **"Record Win"** or **"Record Loss"** buttons
- Enter amount and click
- Automatically updates session

**What gets tracked:**
- Game type
- Wager amount
- Profit/Loss
- Timestamp
- Bankroll after each play

### Phase 4: Cash Out (End of Night)

Click **"🔴 End Night"** button in the HUD.

**Summary shows:**
- Starting Bankroll
- Ending Bankroll
- Profit/Loss (with color coding)
- Total Wagered
- Washing Status (Complete/Incomplete with percentage)
- Games Played count
- Session Duration
- Dirty Money Remaining
- Clean Money

**Actions:**
- **"End Night"**: Saves session and closes
- **"Continue Playing"**: Cancels and keeps session active

### Washing Logic

When you wager money:
1. Calculate dirty money ratio in bankroll
2. Proportion of wager is considered "dirty"
3. Wagered dirty money becomes "clean"
4. Wash progress increases

**Example:**
- Bankroll: $1,200 ($1,000 clean + $200 dirty = 16.7% dirty)
- Wager $100: $16.70 is dirty, $83.30 is clean
- After wager: $1,016.70 clean, $183.30 dirty

### Session Data Structure

```javascript
{
    totalBankroll: 0,
    cleanMoney: 0,
    dirtyMoney: 0,
    sessionActive: false,
    sessionStartTime: null,
    startingBankroll: 0,
    washingTarget: 0,
    totalWagered: 0,
    sessionLog: [
        {
            time: "2024-01-15T20:30:00Z",
            game: "blackjack",
            wager: 25,
            result: 25,  // profit/loss
            bankrollAfter: 1025
        }
    ]
}
```

### Wipe Data

**Location:** Health tab → Cash Out section → **"🗑️ Wipe All Data"**

**What it does:**
- Deletes all session history
- Clears localStorage
- Reloads page

**⚠️ Warning:** Cannot be undone!

---

## Risk Analysis System

### Overview

Hybrid system combining **pure mathematical calculations** (NumPy Monte Carlo) with **AI reasoning** (PyTorch + LLM) to provide risk analysis for advantage play.

### Architecture

1. **Risk Engine** (`backend/risk_engine.py`)
   - Pure NumPy - No AI, just math
   - Runs 10,000 Monte Carlo simulations
   - Calculates Risk of Ruin, EV, Kelly Criterion
   - Answers: "What's the chance I go broke?"

2. **AI Wrapper** (`backend/ai_wrapper.py`)
   - PyTorch + Transformers - Local LLM
   - Uses 4-bit quantization (fits on consumer GPUs)
   - Takes math results and provides strategic advice
   - Answers: "Should I continue or change strategy?"

3. **Integration** (`backend_api.py`)
   - Endpoint: `POST /api/analyze-session`
   - Combines both engines
   - Graceful fallback if AI unavailable

### Usage

**API Endpoint:** `POST /api/analyze-session`

**Request Body:**
```json
{
    "game": "blackjack",
    "bankroll": 1000.0,
    "bet_size": 25.0,
    "odds": 2.0,  // Optional: decimal odds
    "count": 4.0,  // Optional: true count for blackjack
    "total_hands": 1000,  // Optional: default 1000
    "simulations": 10000  // Optional: default 10000
}
```

**Response:**
```json
{
    "math_analysis": {
        "risk_of_ruin_percent": 2.5,
        "expected_final_bankroll": 1050.0,
        "median_final_bankroll": 1048.0,
        "min_final_bankroll": 0.0,
        "max_final_bankroll": 1500.0,
        "expected_value": 50.0,
        "ev_per_hand": 0.05,
        "kelly_fraction": 0.02,
        "optimal_bet_size": 20.0,
        "current_bet_ratio": 0.025,
        "recommendation": "CAUTION",
        "risk_level": "Medium",
        "simulations_run": 10000,
        "hands_simulated": 1000
    },
    "ai_advice": "⚠️ CAUTION (2.5% risk). Consider reducing bet size slightly. Current bet is 2.5% of bankroll.",
    "game_parameters": {
        "win_probability": 0.48,
        "payout_ratio": 1.0
    },
    "context": "Playing blackjack with true count of 4.0. Bankroll: $1,000.00, Bet size: $25.00."
}
```

### Game Parameters

**Blackjack:**
- Base win prob: 42% (without strategy)
- With basic strategy: 48%
- Adjusts based on true count (+1 count = +0.5% edge)
- Payout: 1.0 (even money, simplified)

**Roulette:**
- Win prob: 48.6% (European, single zero)
- Payout: 1.0 (even money)

**Slots:**
- Win prob: 10% (varies by machine)
- Payout: 9.0 (10x payout)

**Craps:**
- Win prob: 49.3% (pass line)
- Payout: 1.0

**Sportsbook:**
- Win prob: 50% (assuming -110 odds)
- Payout: 0.91 (-110 odds)

### Performance

**Risk Engine (NumPy):**
- Speed: ~1 second for 10,000 simulations
- Memory: Minimal (NumPy is efficient)
- Accuracy: High (pure math, no approximations)

**AI Wrapper (PyTorch):**
- GPU (4-bit): ~2-5 seconds per query
- CPU: ~10-30 seconds per query
- Memory: ~6-8GB VRAM (4-bit quantized)

---

## Enhanced Sportsbook Predictor (State-Space Model)

### Overview

The sportsbook predictor uses **state-space modeling concepts** to make predictions:

1. **Learned State Variables**: Automatically discovers hidden factors (team form, momentum, matchup dynamics)
2. **Dynamic Attention**: Weights different features differently based on context (like Transformers)
3. **Probabilistic Future Predictions**: Uses expected future performance to inform present decisions
4. **Tensor-Based Computation**: Uses PyTorch tensors (or NumPy fallback) for efficient parallel computation

**Key Difference from Classical Systems:**
- Classical: Fixed A, B, C, D matrices (ẋ = Ax + Bu, y = Cx + Du)
- AI Model: Learns its own state-space representation and dynamically rewrites transition dynamics

### How It Works

**Location:** `backend/sportsbook_predictor.py`

**Process:**
1. **Feature Extraction**: Converts team data (EPA, recent form, momentum) into feature vectors
2. **Attention Weights**: Computes dynamic importance of each feature based on context
3. **State Update**: Maps features to hidden state (B matrix), then evolves state (A matrix)
4. **Output Prediction**: Maps state to win probability (C matrix)
5. **EV Calculation**: Uses predicted win probability to calculate Expected Value and Kelly Criterion

**Example:**
```python
from sportsbook_predictor import predict_game

team_data = {
    'epa_offense': 0.08,
    'epa_defense': 0.05,
    'momentum': 0.1,  # Trending up
    'recent_win_rate': 0.6
}

prediction = predict_game(team_data, opponent_data, odds=2.0)
# Returns: win_probability, confidence, EV, Kelly fraction
```

### Integration

The predictor is automatically used in:
- `/api/scan-ev-bets` - Enhances EV calculations with learned win probabilities
- `/api/validate-bet` - Adds state-space model predictions to handicapping

**Fallback:** If PyTorch is not available, uses NumPy-based computation (slower but functional).

## Sports Brains Integration

### NFL Brain

**Location:** `backend/brains/nfl/nfl_engine.py`

**Current Status:**
- Uses `nfl_data_py` for EPA stats (data analysis)
- Ready for integration with `mattleonard16/nflalgorithm`

**Setup:**
```bash
cd backend
git clone https://github.com/mattleonard16/nflalgorithm.git nfl_brain
```

**Endpoint:** `GET /api/nfl/validate/{team_abbr}`

### NHL Brain

**Location:** `backend/brains/nhl/nhl_engine.py`

**Current Status:**
- Uses `hockey_scraper` for xG stats (data analysis)
- Ready for integration with `justinjjlee/NHL-Analytics`

**Setup:**
```bash
cd backend
git clone https://github.com/justinjjlee/NHL-Analytics.git nhl_brain
```

**Endpoint:** `GET /api/nhl/validate/{team_abbr}`

### NBA Brain

**Location:** `backend/brains/nba/`

**Current Status:**
- Directory created, ready for integration
- Planned: `kyleskom/NBA-Machine-Learning-Sports-Betting`
- ML Type: Neural Networks (TensorFlow) + XGBoost

**Setup:**
```bash
cd backend
git clone https://github.com/kyleskom/NBA-Machine-Learning-Sports-Betting.git nba_brain
cd nba_brain
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Note:** NBA Brain uses TensorFlow - run in separate venv to avoid conflicts.

---

## API Documentation

### POST `/api/scan-ev-bets`

Scans sportsbooks for +EV bets.

**Request:**
```json
{
  "bankroll": 1000.0,
  "sport": "basketball_nba"
}
```

**Response:**
```json
{
  "bets": [
    {
      "event": "Lakers vs Warriors",
      "market": "Moneyline",
      "selection": "Lakers",
      "odds": 2.10,
      "ev": 3.5,
      "kellyFraction": 0.025,
      "sportsbook": "DraftKings",
      "team_abbr": "LAL",
      "opponent_abbr": "GSW",
      "sport": "basketball_nba"
    }
  ],
  "timestamp": "2024-01-01T12:00:00"
}
```

### POST `/api/validate-bet`

Validates a bet with handicapping models.

**Request:**
```json
{
  "team_abbr": "KC",
  "opponent_abbr": "BUF",
  "sport": "nfl"
}
```

**Response:**
```json
{
  "team": "KC",
  "confidence_score": 75,
  "market_signal": "Odds +150 (Fair Value +130)",
  "model_signal": "EPA Rank #3 vs Defensive Rank #28",
  "recommendation": "Strong Play. Bet $50.",
  "kelly_bet": 0.025
}
```

### POST `/api/analyze-session`

Analyzes session risk with Monte Carlo simulation and AI advice.

See [Risk Analysis System](#risk-analysis-system) for details.

### POST `/api/suggest-next-move`

AI Coach recommendation based on current session state.

**Request:**
```json
{
  "current_bankroll": 1000.0,
  "total_wagered": 500.0,
  "wash_progress": 0.4,
  "dirty_money": 200.0,
  "clean_money": 800.0,
  "session_duration_minutes": 60
}
```

**Response:**
```json
{
  "recommendation": "Continue playing",
  "strategy": "Your wash progress is 40%. Consider increasing bet size slightly to reach target faster.",
  "reasoning": "With $200 dirty money remaining and 40% progress, you're on track. Current risk level is low."
}
```

### POST `/api/calculate-equity`

Calculates poker hand equity.

**Request:**
```json
{
  "holeCards": ["As", "Ks"],
  "boardCards": ["Ah", "7d", "2c"],
  "opponentRange": "random"
}
```

### POST `/api/simulate-hand`

Simulates blackjack hand EV.

**Request:**
```json
{
  "playerHand": ["10♠", "6♥"],
  "dealerHand": ["7♦"],
  "runningCount": 4,
  "trueCount": 2.0
}
```

---

## Fixes & Development Notes

### Win/Loss Tracking Updates

**Fixed Issues:**
- Win/loss now properly updates session manager
- Added `updateHUD()` calls after every game result
- All games (Sportsbook, Craps, Poker) update correctly
- Health dashboard refreshes automatically

**Location:** `endGame()`, `recordGameWin()`, `recordGameLoss()` functions

### Coach Button & JSON Parsing

**Fixed Issues:**
- Coach button visibility check for active session
- Backend always returns JSON strings (even fallback)
- Frontend has robust JSON parsing with cleanup
- Handles both string and object responses
- Execute button finds bet inputs with multiple selector fallbacks

### Health Dashboard Updates

**Fixed Issues:**
- Live Mode toggle updates Health dashboard
- ML/Stat advice displays on Health page
- Dashboard auto-updates when switching tabs
- Shows current mode indicator (SIMULATOR vs LIVE MIRROR)
- Fetches fresh ML advice based on mode

### Craps Instructions

**Added:**
- Comprehensive instruction section
- Basic Strategy: Step-by-step guide for Pass Line + Odds
- Where to Place Bets: Clear explanation
- House edge explanation (1.41% Pass Line, 0% Odds)
- Example play with dollar amounts

---

## Troubleshooting

### Backend Not Starting
- Check Python version (3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Verify `.env` file exists with `ODDS_API_KEY`

### ML/AI Issues

**"CUDA not available"**
- Solution: Use CPU mode (slower but works)
- Model will auto-detect and use CPU

**"Out of memory"**
- Solution: Model uses 4-bit quantization (~4GB)
- If still issues, try smaller model or CPU mode
- Reduce `simulations` parameter

**"Model download failed"**
- Solution: Check internet connection
- Model downloads from HuggingFace (~4GB)
- Can take 5-10 minutes

**"Import errors"**
- Solution: Run `python setup_ml.py` to install dependencies
- Or manually: `pip install -r requirements.txt`

### NBA Brain TensorFlow Errors
- Use separate virtual environment
- Or run as subprocess (isolated)

### API Key Not Working
- Verify key in `.env` file
- Check key is valid at https://the-odds-api.com/
- Restart backend server after changing `.env`

### Session Not Updating
- Check session is active: `window.sessionManager.getSessionStatus()`
- Check browser console for errors
- Verify `sessionManager.logGameResult()` is being called
- Check HUD updates: `window.sessionManager.updateHUD()`

### Coach Not Working
- Check browser console for errors
- Verify backend is running: `http://localhost:8000/health`
- Check session is active
- Check API response: Network tab → `/api/suggest-next-move`

---

## Future Enhancements

1. **NBA Brain Integration:**
   - Clone `kyleskom/NBA-Machine-Learning-Sports-Betting`
   - Create `backend/brains/nba/nba_engine.py`
   - Integrate PyTorch/XGBoost models

2. **Session Analytics:**
   - Charts/graphs for session history
   - Win rate by game type
   - Washing efficiency metrics

3. **Multi-Game Session UI:**
   - Better visualization of multiple games
   - Game-specific progress tracking

4. **Export Enhancements:**
   - CSV export for session logs
   - PDF reports
   - Cloud sync (optional)

5. **Caching:**
   - Cache AI responses for similar scenarios
   - Cache sports brain predictions
   - Use Redis for active sessions

---

**For user-facing documentation, see `README.md`.**

