# How AI Works in This Codebase

## Overview

The AI system uses **Ollama** (a local LLM runtime) to provide strategic advice based on **your actual game data**, not general tips. It's a transformer-based language model that analyzes your specific situation and gives personalized recommendations.

## How It Works

### 1. **Ollama is NOT giving general transformer tips**

Ollama doesn't provide generic advice. Instead, it:
- Receives **specific data** about your current situation
- Analyzes that data using transformer-based reasoning
- Generates **personalized recommendations** based on your actual stats

### 2. **Two Main AI Functions**

#### A. **Risk Analysis (`ask_brain`)**
**Purpose:** Analyzes if your betting strategy is safe or dangerous

**Input Data:**
- Risk of Ruin percentage (from Monte Carlo simulation)
- Expected ending bankroll
- Optimal bet size (Kelly Criterion)
- Current bet ratio
- Your game context (e.g., "Playing Blackjack. Count is +4.")

**What Ollama Does:**
1. Receives a prompt with all your math data
2. Uses transformer reasoning to analyze the risk
3. Returns actionable advice like:
   - "⚠️ DANGEROUS (8% risk of ruin). Lower your bet size immediately."
   - "✅ SAFE (0.5% risk). Strategy is sustainable."

**Example Prompt:**
```
You are a professional Advantage Player (AP) assistant specializing in risk management.

CURRENT SIMULATION DATA:
- Risk of Ruin: 8%
- Expected Ending Bankroll: $1,200.00
- Risk Level: DANGEROUS
- Optimal Bet Size (Kelly): $25.00
- Current Bet Ratio: 15% of bankroll

USER CONTEXT:
Playing Blackjack. Count is +4.

TASK:
Analyze if the user should continue playing or change strategy.
- If Risk of Ruin > 5%, strongly recommend lowering bet size
- If Risk of Ruin < 1%, the strategy is safe
- Consider the optimal bet size vs current bet
- Be concise and actionable (max 3 sentences)

RESPONSE:
```

#### B. **Game Recommendations (`suggest_next_move`)**
**Purpose:** Suggests which game to play next based on washing progress

**Input Data:**
- Current bankroll
- Washing needed (how much more to play)
- Washing progress percentage
- Time remaining
- Available games with their RTP, volatility, hands/hour

**What Ollama Does:**
1. Receives a prompt with your washing status and game options
2. Analyzes which game best fits your goal
3. Returns JSON with recommendation:
   ```json
   {
     "recommendation": "Blackjack (Basic Strategy)",
     "strategy": "Flat bet minimums.",
     "reasoning": "You are winning. Minimize variance to finish the wash safely.",
     "action_tab": "tab-wash",
     "action_settings": {"bet_size": 25}
   }
   ```

### 3. **Trainable State-Space Models**

In addition to Ollama, there are **trainable neural networks** for predictions:

- **Casino Model:** Predicts "clean money" success (washing efficiency)
- **Sportsbook Model:** Predicts win probability for bets

These are **PyTorch-based state-space models with attention** that:
- Learn from your historical data
- Can be trained on your actual results
- Make predictions based on learned patterns

## Data Flow

```
Your Game Data
    ↓
Monte Carlo Simulation (risk_engine.py)
    ↓
Math Results (risk_of_ruin, expected_bankroll, etc.)
    ↓
Ollama LLM (transformer-based reasoning)
    ↓
Strategic Advice (personalized recommendations)
```

## Key Points

1. **Ollama is data-driven:** It doesn't give general tips - it analyzes YOUR specific situation
2. **Uses transformer reasoning:** The LLM uses attention mechanisms to understand context and relationships
3. **No training data needed for advice:** Ollama uses its pre-trained knowledge + your data to reason
4. **State-space models ARE trainable:** The casino/sportsbook prediction models learn from your data
5. **Fallback system:** If Ollama is unavailable, it uses rule-based reasoning

## When AI is Used

### Currently Available (Backend API Endpoints):

1. **`POST /api/analyze-session`** - Risk Analysis with AI Advice
   - **When:** Called when analyzing session risk
   - **What it does:**
     - Runs Monte Carlo simulation (10,000 simulations)
     - Calculates risk of ruin, expected bankroll, optimal bet size
     - **Then calls Ollama** to provide strategic advice based on the math results
   - **AI Output:** Personalized advice like "⚠️ DANGEROUS (8% risk). Lower bet size."
   - **Status:** ✅ Backend ready, but frontend may not be calling it yet

2. **`POST /api/suggest-next-move`** - Game Recommendation
   - **When:** Called when you need to know which game to play next
   - **What it does:**
     - Analyzes your washing progress, bankroll, time remaining
     - Looks at available games (RTP, volatility, hands/hour)
     - **Then calls Ollama** to recommend the best game and strategy
   - **AI Output:** JSON with game recommendation, strategy, and reasoning
   - **Status:** ✅ Backend ready, but frontend may not be calling it yet

3. **State-Space Models** - Predictions (Trainable)
   - **`POST /api/train-casino-model`** - Train on your casino session data
   - **`POST /api/train-sportsbook-model`** - Train on your bet results
   - **`POST /api/predict-casino-success`** - Predict washing efficiency
   - **`POST /api/predict-sportsbook-win`** - Predict bet win probability
   - **Status:** ✅ Backend ready, can be called via API

### Important Note:

**AI is only used if:**
1. `USE_LOCAL_AI=true` environment variable is set
2. Ollama is running (`ollama serve`)
3. A model is pulled (`ollama pull llama3.2`)
4. The frontend actually calls these endpoints

**If AI is not enabled:**
- The system uses **rule-based fallback reasoning**
- Still provides advice, but it's based on simple if/else rules
- Math calculations (Monte Carlo) still work without AI

## Setup

1. Install Ollama: https://ollama.ai/
2. Pull a model: `ollama pull llama3.2`
3. Set environment: `USE_LOCAL_AI=true`
4. Start backend: The AI will automatically connect

## Summary

**Ollama = Transformer-based LLM that reasons about YOUR data**
- Not general tips
- Personalized advice based on your stats
- Uses transformer attention to understand context
- Provides actionable recommendations

**State-Space Models = Trainable neural networks**
- Learn from your historical data
- Make predictions based on learned patterns
- Can be trained via API endpoints

