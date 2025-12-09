# Blackjack Tracker - Complete Guide

A comprehensive gambling tracker with blackjack, sportsbook value finder, poker equity calculator, and live session tracking.

## 🚀 Quick Start (No Setup Required!)

**Just open `index.html` in your web browser and start playing!**

The app works completely standalone - no installation, no dependencies, no backend required. All features work out of the box with mock data.

### Optional: Backend API (For Real Sports Data)

The backend is **completely optional**. The app works perfectly without it, using mock data for demonstrations.

If you want to use real sports betting data:

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

**Note:** Without the backend, you'll see mock data for sports betting features, but all other features (blackjack, poker, session tracking) work fully.

## ✅ Launch Verification

The app is designed to launch **immediately** with zero setup:

- ✅ **No server required** - Just open `index.html` in any modern browser
- ✅ **No dependencies** - Pure HTML/CSS/JavaScript, no build step
- ✅ **No installation** - Works offline, no npm/pip required
- ✅ **Graceful fallbacks** - All backend features show mock data if backend isn't running
- ✅ **Error handling** - App continues working even if API calls fail

**To verify it works:**
1. Double-click `index.html` (or right-click → Open with → Browser)
2. You should see the game interface immediately
3. All tabs (Blackjack, Sportsbook, Craps, Poker, Health) should be clickable
4. Blackjack game should work immediately - place a bet and play!

## 🎯 Features

### Blackjack Game
- ✨ Beautiful, modern UI with smooth animations
- 🎴 Realistic card graphics
- 💰 Betting system with balance tracking
- 📊 Card counting (running count, true count)
- 🤖 Intelligent dealer AI
- 📱 Responsive design

### Sportsbook Value Finder
- 🔍 Scans multiple sportsbooks for +EV bets
- 📈 Calculates Expected Value (EV)
- 💵 Kelly Criterion bet sizing
- 🎯 Smart Card with market + model analysis
- 🏈 NFL, 🏀 NBA, 🏒 NHL handicapping

### Poker Equity Calculator
- 🃏 Hand vs range equity calculation
- 📊 Monte Carlo simulation
- 🎲 Range analysis

### Live Session Tracking
- 💰 Bankroll management
- 📊 Win/loss tracking
- 🎯 Session analytics
- 📁 Export data to files

## 🏈 Sports Handicapping Integration

### NFL Brain (EPA/Play-by-Play)
- **Repository**: `mattleonard16/nflalgorithm`
- **Endpoint**: `/api/nfl/validate/{team_abbr}`
- **Metrics**: EPA Rank, Pass Offense, Recent Trends
- **Status**: ✅ Backend ready, uses `nfl_data_py`

### NBA Brain (Neural Networks)
- **Repository**: `kyleskom/NBA-Machine-Learning-Sports-Betting`
- **Endpoints**: `/api/nba/predict`, `/api/nba/validate/{team_abbr}`
- **Metrics**: ML Confidence, EV, Kelly Fraction
- **Status**: ✅ Backend ready (use separate venv for TensorFlow)

### NHL Brain (xG Analytics)
- **Repository**: `justinjjlee/NHL-Analytics`
- **Endpoint**: `/api/nhl/validate/{team_abbr}`
- **Metrics**: xG%, PDO, Corsi/Fenwick
- **Status**: ✅ Backend ready, uses `hockey_scraper`

### Smart Card System
Combines **Price Shopping** (Layer 1) with **Handicapping** (Layer 2):
1. **Market Signal**: Odds vs Fair Value, Edge calculation
2. **Model Signal**: Sport-specific analytics (EPA, ML, xG)
3. **Combined Recommendation**: Confidence score, Kelly bet size

## 📁 Project Structure

```
blackjack/
├── index.html              # Main UI
├── script.js               # Frontend logic
├── styles.css              # Styling
├── backend_api.py          # FastAPI backend
├── requirements.txt        # Python dependencies
├── .env                    # API keys (gitignored)
├── .env.example            # API key template
└── backend/
    ├── nfl_brain/          # Clone mattleonard16/nflalgorithm here
    ├── nba_brain/          # Clone kyleskom/NBA-Machine-Learning-Sports-Betting here
    └── nhl_brain/          # Clone justinjjlee/NHL-Analytics here
```

## 🔧 Backend API Endpoints

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

## 🚀 Advanced Setup

### Integrating Sports Brains

1. **Clone repositories:**
   ```bash
   cd backend
   git clone https://github.com/mattleonard16/nflalgorithm.git nfl_brain
   git clone https://github.com/kyleskom/NBA-Machine-Learning-Sports-Betting.git nba_brain
   git clone https://github.com/justinjjlee/NHL-Analytics.git nfl_brain
   ```

2. **Set up NBA Brain (separate venv):**
   ```bash
   cd nba_brain
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Update `backend_api.py`:**
   - Modify endpoints to call actual brain scripts
   - Convert output to JSON format
   - Add caching for performance

## 🔒 Security

- **API Keys**: Stored in `.env` file (gitignored)
- **Never commit**: `.env` file or any files with real keys
- **Template**: Use `.env.example` as a guide
- **Backend**: Loads keys from environment variables

## 📊 Usage Examples

### Using Sportsbook Value Finder
1. Go to **Sportsbook** tab
2. Select sport: **NBA (ML Model)**, **NFL (EPA Model)**, or **NHL (xG Model)**
3. Enter bankroll and click **"🔍 Scan for +EV Bets"**
4. Click **"🎯 Analyze with Handicapping"** on any hot bet
5. View **Smart Card** with combined analysis

**Note:** Without backend, you'll see mock/demo data. All features still work!

### Using Live Session Tracking
1. Go to **Health** tab
2. Click **"Start New Session"**
3. Select site and game type
4. Record wins/losses as you play
5. Click **"End Session"** to save stats
6. Export data using **📁 Export** icon

## 🐛 Troubleshooting

### Backend Not Starting
- Check Python version (3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Verify `.env` file exists with `ODDS_API_KEY`

### NBA Brain TensorFlow Errors
- Use separate virtual environment
- Or run as subprocess (isolated)

### API Key Not Working
- Verify key in `.env` file
- Check key is valid at https://the-odds-api.com/
- Restart backend server after changing `.env`

## 📚 External Integrations

- **EV Betting**: `jbram22/ev_sports_betting`
- **Poker Equity**: `rundef/node-poker-odds-calculator`
- **Blackjack Sim**: `mhluska/blackjack-simulator`
- **NFL Data**: `nflverse/nfl_data_py`
- **NHL Scraper**: `HarryShomer/Hockey-Scraper`

## 🎲 Game Rules

- **Objective**: Get as close to 21 as possible without going over
- **Card Values**: Number cards = face value, Face cards = 10, Ace = 1 or 11
- **Dealer Rules**: Must hit on 16 or less, stand on 17 or more
- **Blackjack**: 21 with first two cards pays 2:1

## 📝 Notes

- **NBA Brain**: Uses TensorFlow - run in separate venv to avoid conflicts
- **NFL Brain**: Cache weekly predictions (they don't change during the week)
- **NHL Brain**: Update metrics daily via GitHub Actions or local cron
- **All Brains**: Use Redis for caching predictions during active use

---

**Enjoy the game and good luck!** 🎰
