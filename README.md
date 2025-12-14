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

### Live Session Tracking (Casino Night)
- 💰 Bankroll management with clean/dirty money tracking
- 📊 Win/loss tracking across all games
- 🎯 Session analytics and washing progress
- 📁 Export data to files
- 🧠 AI Coach for strategic recommendations
- 🏦 Heads-up display (HUD) for active sessions

### Risk Analysis System
- 🧮 Monte Carlo simulations (10,000 runs)
- 📊 Risk of Ruin calculations
- 💵 Kelly Criterion optimal bet sizing
- 🤖 AI-powered strategic advice (optional)
- ⚠️ Real-time risk warnings

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
├── sessionManager.js       # Session tracking
├── backend_api.py          # FastAPI backend
├── requirements.txt        # Python dependencies
├── .env                    # API keys (gitignored)
├── .env.example            # API key template
└── backend/
    ├── ai_wrapper.py       # AI reasoning engine
    ├── risk_engine.py      # Risk analysis (NumPy)
    └── brains/
        ├── nfl/            # NFL analysis engine
        ├── nhl/            # NHL analysis engine
        └── nba/            # NBA analysis engine (future)
```

## 🎮 Usage Examples

### Using Sportsbook Value Finder
1. Go to **Sportsbook** tab
2. Select sport: **NBA (ML Model)**, **NFL (EPA Model)**, or **NHL (xG Model)**
3. Enter bankroll and click **"🔍 Scan for +EV Bets"**
4. Click **"🎯 Analyze with Handicapping"** on any hot bet
5. View **Smart Card** with combined analysis

**Note:** Without backend, you'll see mock/demo data. All features still work!

### Starting a Casino Night Session
1. Click **"🏦 Start Casino Night"** button in header
2. Enter:
   - Starting Cash (Clean Money): e.g., $1,000
   - Bonus Funds (Dirty Money): e.g., $200
   - Washing Target: (auto: 2x bonus)
3. Click **"Start Night"**
4. HUD appears at bottom showing bankroll, wash progress, and risk level
5. Play games - all results automatically log to session
6. Click **"🔴 End Night"** to view summary and save session

### Using Risk Analysis
1. Play any game (Blackjack, Sportsbook, etc.)
2. Click **"🧠 Ask Coach"** in HUD (if session active)
3. View risk analysis with:
   - Risk of Ruin percentage
   - Optimal bet size (Kelly Criterion)
   - AI strategic advice
4. Adjust your strategy based on recommendations

## 🎲 Game Rules

### Blackjack
- **Objective**: Get as close to 21 as possible without going over
- **Card Values**: Number cards = face value, Face cards = 10, Ace = 1 or 11
- **Dealer Rules**: Must hit on 16 or less, stand on 17 or more
- **Blackjack**: 21 with first two cards pays 2:1

### Craps (Pass Line + Odds Strategy)
1. Place Pass Line bet before come-out roll
2. If point is established (4, 5, 6, 8, 9, 10), place Odds bet
3. Odds bet has 0% house edge (best bet in casino)
4. House edge: 1.41% (Pass Line only), 0.85% (with 1x Odds), 0.61% (with 2x Odds)

## 🔧 Backend API Endpoints

### POST `/api/scan-ev-bets`
Scans sportsbooks for +EV bets.

### POST `/api/validate-bet`
Validates a bet with handicapping models.

### POST `/api/analyze-session`
Analyzes session risk with Monte Carlo simulation and AI advice.

### POST `/api/suggest-next-move`
AI Coach recommendation based on current session state.

### POST `/api/calculate-equity`
Calculates poker hand equity.

### POST `/api/simulate-hand`
Simulates blackjack hand EV.

See `SETUP.md` for detailed API documentation.

## 🔒 Security

- **API Keys**: Stored in `.env` file (gitignored)
- **Never commit**: `.env` file or any files with real keys
- **Template**: Use `.env.example` as a guide
- **Backend**: Loads keys from environment variables

## 📚 External Integrations

- **EV Betting**: `jbram22/ev_sports_betting`
- **Poker Equity**: `rundef/node-poker-odds-calculator`
- **Blackjack Sim**: `mhluska/blackjack-simulator`
- **NFL Data**: `nflverse/nfl_data_py`
- **NHL Scraper**: `HarryShomer/Hockey-Scraper`

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

For more detailed setup, troubleshooting, and technical information, see `SETUP.md`.

---

**Enjoy the game and good luck!** 🎰
