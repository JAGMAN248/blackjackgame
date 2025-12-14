"""
Local AI Wrapper - Reasoning Engine using Ollama
Uses Ollama for local LLM inference

Default: Uses Ollama (ollama serve must be running)
Fallback: HuggingFace transformers (if Ollama unavailable)
"""

import os
import sys
from typing import List, Dict
import requests
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Try to import Ollama client (via REST API)
OLLAMA_AVAILABLE = False
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# Try to connect to Ollama
try:
    response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
    if response.status_code == 200:
        OLLAMA_AVAILABLE = True
        print("✅ Ollama detected and available")
except:
    OLLAMA_AVAILABLE = False
    print("⚠️ Ollama not available. Install: https://ollama.ai/ or use fallback.")

# Try to import PyTorch and transformers (fallback)
HF_AVAILABLE = False
try:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False

AI_AVAILABLE = OLLAMA_AVAILABLE or HF_AVAILABLE

# Import trainable state-space model
try:
    from trainable_state_space import (
        TrainableStateSpaceModel,
        StateSpaceTrainer,
        prepare_casino_features,
        prepare_sportsbook_features,
        fetch_historical_sportsbook_data
    )
    STATE_SPACE_AVAILABLE = True
except ImportError as e:
    STATE_SPACE_AVAILABLE = False
    print(f"⚠️ Trainable state-space model not available: {e}")


class LocalAI:
    """
    Local AI Brain for strategic reasoning.
    Uses Ollama by default, falls back to HuggingFace if needed.
    """
    
    def __init__(self, model_id=None, use_gpu=True, use_ollama=True):
        """
        Initialize the AI model.
        
        Args:
            model_id: Model name (Ollama model name or HuggingFace ID)
            use_gpu: Whether to use GPU (for HuggingFace fallback)
            use_ollama: Prefer Ollama if available
        """
        self.model = None
        self.tokenizer = None
        self.initialized = False
        self.use_ollama = use_ollama and OLLAMA_AVAILABLE
        self.ollama_model = None
        self.ollama_base_url = OLLAMA_BASE_URL
        
        # State-space models for casino and sportsbook
        self.casino_model = None
        self.sportsbook_model = None
        self.casino_trainer = None
        self.sportsbook_trainer = None
        # Device for state-space models (PyTorch)
        try:
            import torch
            self.device = 'cuda' if (use_gpu and torch.cuda.is_available()) else 'cpu'
        except:
            self.device = 'cpu'
        
        # Initialize state-space models if available
        if STATE_SPACE_AVAILABLE and AI_AVAILABLE:
            try:
                # Casino model (clean money success metric)
                self.casino_model = TrainableStateSpaceModel(
                    feature_dim=12,
                    state_dim=8,
                    use_attention=True
                )
                self.casino_trainer = StateSpaceTrainer(self.casino_model, device=self.device)
                
                # Sportsbook model (winning bets success metric)
                self.sportsbook_model = TrainableStateSpaceModel(
                    feature_dim=12,
                    state_dim=8,
                    use_attention=True
                )
                self.sportsbook_trainer = StateSpaceTrainer(self.sportsbook_model, device=self.device)
                
                # Try to load pre-trained models if they exist
                model_dir = os.path.join(os.path.dirname(__file__), 'models')
                os.makedirs(model_dir, exist_ok=True)
                
                casino_model_path = os.path.join(model_dir, 'casino_model.pt')
                sportsbook_model_path = os.path.join(model_dir, 'sportsbook_model.pt')
                
                if os.path.exists(casino_model_path):
                    self.casino_trainer.load_model(casino_model_path)
                    print("✅ Loaded pre-trained casino model")
                
                if os.path.exists(sportsbook_model_path):
                    self.sportsbook_trainer.load_model(sportsbook_model_path)
                    print("✅ Loaded pre-trained sportsbook model")
                    
            except Exception as e:
                print(f"⚠️ Error initializing state-space models: {e}")
        
        # Try Ollama first if available and preferred
        if self.use_ollama:
            try:
                print("🧠 Connecting to Ollama...")
                
                # Get model name from environment or use default
                if model_id is None:
                    model_id = os.getenv("OLLAMA_MODEL", os.getenv("AI_MODEL_ID", "llama3.2"))
                
                self.ollama_model = model_id
                
                # Test connection and check if model exists
                try:
                    # List available models
                    response = requests.get(f"{self.ollama_base_url}/api/tags", timeout=5)
                    if response.status_code == 200:
                        models = response.json().get('models', [])
                        model_names = [m.get('name', '') for m in models]
                        
                        # Check if model exists (exact match or starts with)
                        model_found = any(m.startswith(model_id) or model_id in m for m in model_names)
                        
                        if not model_found:
                            print(f"⚠️ Model '{model_id}' not found in Ollama.")
                            print(f"Available models: {', '.join(model_names[:5])}")
                            print(f"💡 Pull model: ollama pull {model_id}")
                            # Try to use first available model
                            if model_names:
                                self.ollama_model = model_names[0].split(':')[0]  # Remove tag
                                print(f"🔄 Using available model: {self.ollama_model}")
                            else:
                                raise Exception("No models available in Ollama")
                        
                        self.initialized = True
                        print(f"✅ Ollama connected! Using model: {self.ollama_model}")
                    else:
                        raise Exception("Ollama API not responding")
                        
                except requests.exceptions.RequestException as e:
                    print(f"⚠️ Cannot connect to Ollama: {e}")
                    print("💡 Make sure Ollama is running: ollama serve")
                    self.use_ollama = False
                    self.initialized = False
                    
            except Exception as e:
                print(f"⚠️ Ollama initialization error: {e}")
                self.use_ollama = False
                self.initialized = False
        
        # Fallback to HuggingFace if Ollama not available
        if not self.initialized and HF_AVAILABLE and not self.use_ollama:
            try:
                print("🧠 Loading HuggingFace model (fallback)...")
                
                if model_id is None:
                    model_id = os.getenv("AI_MODEL_ID", "deepseek-ai/deepseek-math-7b-instruct")
                
                if use_gpu and torch.cuda.is_available():
                    print(f"✅ CUDA available. Using GPU: {torch.cuda.get_device_name(0)}")
                    quant_config = BitsAndBytesConfig(
                        load_in_4bit=True,
                        bnb_4bit_compute_dtype=torch.float16,
                        bnb_4bit_quant_type="nf4"
                    )
                    self.tokenizer = AutoTokenizer.from_pretrained(model_id)
                    self.model = AutoModelForCausalLM.from_pretrained(
                        model_id,
                        quantization_config=quant_config,
                        device_map="auto",
                        trust_remote_code=True
                    )
                else:
                    print("⚠️ Using CPU mode (slow).")
                    self.tokenizer = AutoTokenizer.from_pretrained(model_id)
                    self.model = AutoModelForCausalLM.from_pretrained(
                        model_id,
                        device_map="cpu",
                        trust_remote_code=True
                    )
                
                self.initialized = True
                print("✅ HuggingFace model loaded!")
                
            except Exception as e:
                print(f"❌ Error loading HuggingFace model: {e}")
                self.initialized = False
        
        if not self.initialized:
            print("⚠️ AI not available. Using fallback reasoning.")
    
    def ask_brain(self, context, math_data):
        """
        Ask the AI for strategic advice based on math data.
        
        Args:
            context: User context string (e.g., "Playing Blackjack. Count is +4.")
            math_data: Output from risk_engine (contains risk_of_ruin_percent, etc.)
        
        Returns:
            str: AI advice
        """
        
        if not self.initialized:
            # Fallback to rule-based reasoning
            return self._fallback_reasoning(context, math_data)
        
        try:
            risk_pct = math_data.get('risk_of_ruin_percent', 0)
            expected_bankroll = math_data.get('expected_final_bankroll', 0)
            recommendation = math_data.get('recommendation', 'UNKNOWN')
            optimal_bet = math_data.get('optimal_bet_size', 0)
            current_bet = math_data.get('current_bet_ratio', 0) * 100
            
            prompt = f"""You are a professional Advantage Player (AP) assistant specializing in risk management.

CURRENT SIMULATION DATA:
- Risk of Ruin: {risk_pct}%
- Expected Ending Bankroll: ${expected_bankroll:,.2f}
- Risk Level: {recommendation}
- Optimal Bet Size (Kelly): ${optimal_bet:,.2f}
- Current Bet Ratio: {current_bet:.2f}% of bankroll

USER CONTEXT:
{context}

TASK:
Analyze if the user should continue playing or change strategy.
- If Risk of Ruin > 5%, strongly recommend lowering bet size
- If Risk of Ruin < 1%, the strategy is safe
- Consider the optimal bet size vs current bet
- Be concise and actionable (max 3 sentences)

RESPONSE:"""
            
            # Use Ollama if available
            if self.use_ollama and self.ollama_model:
                try:
                    response = requests.post(
                        f"{self.ollama_base_url}/api/generate",
                        json={
                            "model": self.ollama_model,
                            "prompt": prompt,
                            "stream": False,
                            "options": {
                                "temperature": 0.1,
                                "num_predict": 150
                            }
                        },
                        timeout=30
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        response_text = result.get('response', '').strip()
                        
                        # Extract just the response part (after "RESPONSE:")
                        if "RESPONSE:" in response_text:
                            response_text = response_text.split("RESPONSE:")[-1].strip()
                        
                        return response_text
                    else:
                        raise Exception(f"Ollama API error: {response.status_code}")
                        
                except Exception as e:
                    print(f"⚠️ Ollama request error: {e}")
                    # Fallback to HuggingFace or rule-based
                    if self.model is not None:
                        pass  # Will try HuggingFace below
                    else:
                        return self._fallback_reasoning(context, math_data)
            
            # Fallback to HuggingFace
            if self.model is not None and self.tokenizer is not None:
                inputs = self.tokenizer(prompt, return_tensors="pt")
                
                # Move to GPU if available
                if torch.cuda.is_available() and hasattr(self.model, 'device') and self.model.device.type == 'cuda':
                    inputs = {k: v.to("cuda") for k, v in inputs.items()}
                
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=150,
                    temperature=0.1,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
                
                response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                
                # Extract just the response part (after "RESPONSE:")
                if "RESPONSE:" in response:
                    response = response.split("RESPONSE:")[-1].strip()
                
                return response
            
            # Ultimate fallback
            return self._fallback_reasoning(context, math_data)
            
        except Exception as e:
            print(f"⚠️ Error generating AI response: {e}")
            return self._fallback_reasoning(context, math_data)
    
    def get_nfl_betting_advice(self, prediction_data: Dict) -> str:
        """
        Get betting advice from Ollama based on NFL prediction results.
        
        Args:
            prediction_data: Dict with:
                - predicted_win_probability: float (0-1)
                - odds: float (decimal odds)
                - confidence: str
                - recommendation: str
                - mechanics_insights: Dict
                - parley_bets: List of bet dicts
        
        Returns:
            str: Ollama betting advice
        """
        if not self.initialized:
            return self._fallback_nfl_advice(prediction_data)
        
        try:
            win_prob = prediction_data.get('predicted_win_probability', 0.5)
            odds = prediction_data.get('odds', 2.0)
            confidence = prediction_data.get('confidence', 'Moderate')
            recommendation = prediction_data.get('recommendation', 'MODERATE_PLAY')
            mechanics = prediction_data.get('mechanics_insights', {})
            parley_bets = prediction_data.get('parley_bets', [])
            
            # Calculate EV
            ev = (win_prob * (odds - 1)) - (1 - win_prob)
            kelly_fraction = (win_prob * odds - 1) / (odds - 1) if odds > 1 else 0
            
            # Build context from mechanics
            mechanics_summary = ""
            if mechanics:
                if 'qb_clutch_factor' in mechanics:
                    mechanics_summary += f"QB Clutch Factor: {mechanics['qb_clutch_factor']:.2f}. "
                if 'qb_red_zone_efficiency' in mechanics:
                    mechanics_summary += f"Red Zone Efficiency: {mechanics['qb_red_zone_efficiency']:.2f}. "
            
            prompt = f"""You are a professional sports betting analyst specializing in NFL parleys.

PREDICTION ANALYSIS:
- Predicted Win Probability: {win_prob:.1%}
- Bookmaker Odds: {odds:.2f} (decimal)
- Expected Value (EV): {ev:+.2%}
- Kelly Criterion: {kelly_fraction:.1%} of bankroll
- Confidence Level: {confidence}
- Model Recommendation: {recommendation}

KEY MECHANICS:
{mechanics_summary if mechanics_summary else "Standard metrics"}

PARLEY DETAILS:
- Number of legs: {len(parley_bets)}
- Combined odds: {odds:.2f}

TASK:
Provide actionable betting advice:
1. Should this parley be placed? (Yes/No/Maybe)
2. What bet size is appropriate? (Use Kelly Criterion: {kelly_fraction:.1%})
3. What are the key risks?
4. Any alternative strategies?

Be concise and actionable (max 4 sentences).

RESPONSE:"""
            
            # Use Ollama if available
            if self.use_ollama and self.ollama_model:
                try:
                    response = requests.post(
                        f"{self.ollama_base_url}/api/generate",
                        json={
                            "model": self.ollama_model,
                            "prompt": prompt,
                            "stream": False,
                            "options": {
                                "temperature": 0.2,
                                "num_predict": 200
                            }
                        },
                        timeout=30
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        response_text = result.get('response', '').strip()
                        
                        # Extract just the response part
                        if "RESPONSE:" in response_text:
                            response_text = response_text.split("RESPONSE:")[-1].strip()
                        
                        return response_text
                    else:
                        raise Exception(f"Ollama API error: {response.status_code}")
                        
                except Exception as e:
                    print(f"⚠️ Ollama request error: {e}")
                    return self._fallback_nfl_advice(prediction_data)
            
            # Fallback
            return self._fallback_nfl_advice(prediction_data)
            
        except Exception as e:
            print(f"⚠️ Error generating NFL betting advice: {e}")
            return self._fallback_nfl_advice(prediction_data)
    
    def _fallback_nfl_advice(self, prediction_data: Dict) -> str:
        """Fallback NFL betting advice when Ollama unavailable"""
        win_prob = prediction_data.get('predicted_win_probability', 0.5)
        odds = prediction_data.get('odds', 2.0)
        ev = (win_prob * (odds - 1)) - (1 - win_prob)
        
        if ev > 0.1:
            return f"✅ STRONG PLAY: {win_prob:.1%} win probability with {ev:+.1%} EV. Positive value bet."
        elif ev > 0:
            return f"✅ MODERATE PLAY: {win_prob:.1%} win probability with {ev:+.1%} EV. Small positive value."
        else:
            return f"❌ FADE: {win_prob:.1%} win probability with {ev:.1%} EV. Negative value - avoid this bet."
    
    def suggest_next_move(self, washing_status, game_profiles):
        """
        Suggest the best game/strategy based on washing progress.
        
        Args:
            washing_status: dict {
                "bankroll": float,
                "washing_needed": float,
                "washing_progress_pct": float,
                "time_remaining_minutes": int
            }
            game_profiles: dict of available games (from risk_engine)
            
        Returns:
            str: AI Recommendation
        """
        if not self.initialized:
            return self._fallback_suggestion(washing_status)
            
        try:
            bankroll = washing_status.get('bankroll', 0)
            needed = washing_status.get('washing_needed', 0)
            progress = washing_status.get('washing_progress_pct', 0)
            time_left = washing_status.get('time_remaining_minutes', 60)
            
            prompt = f"""You are a professional Advantage Player (AP) advisor maximizing bonus washing efficiency.

CURRENT STATUS:
- Bankroll: ${bankroll:,.2f}
- Washing Needed: ${needed:,.2f}
- Progress: {progress:.1f}%
- Time Remaining: {time_left} mins

AVAILABLE GAMES:
{self._format_game_profiles(game_profiles)}

TASK:
Recommend the SINGLE best game and strategy to play NEXT.
- Goal: Wash the remaining ${needed:,.2f} while preserving bankroll.
- If Washing Needed > Bankroll: You need variance (risk) to double up? Or slow grind?
- If Washing Needed < Bankroll: Protect the lead! Low volatility.
- Consider Time: Slots are fast, Blackjack is slow.

RESPONSE FORMAT:
{
    "recommendation": "Game Name",
    "strategy": "Specific advice...",
    "reasoning": "Why this fits...",
    "action_tab": "tab-wash" OR "tab-sports" OR "tab-craps" OR "tab-poker",
    "action_settings": {
        "bet_size": number (optional),
        "game_mode": "string" (optional)
    }
}
Return ONLY valid JSON."""

            # Use Ollama if available
            if self.use_ollama and self.ollama_model:
                try:
                    response_obj = requests.post(
                        f"{self.ollama_base_url}/api/generate",
                        json={
                            "model": self.ollama_model,
                            "prompt": prompt,
                            "stream": False,
                            "options": {
                                "temperature": 0.3,
                                "num_predict": 300
                            }
                        },
                        timeout=60
                    )
                    
                    if response_obj.status_code == 200:
                        result = response_obj.json()
                        response = result.get('response', '').strip()
                    else:
                        raise Exception(f"Ollama API error: {response_obj.status_code}")
                except Exception as e:
                    print(f"⚠️ Ollama request error: {e}")
                    # Fallback to HuggingFace
                    if self.model is None or self.tokenizer is None:
                        return self._fallback_suggestion(washing_status)
                    # Continue to HuggingFace code below
            
            # Fallback to HuggingFace
            if self.model is not None and self.tokenizer is not None:
                inputs = self.tokenizer(prompt, return_tensors="pt")
                if torch.cuda.is_available() and hasattr(self.model, 'device') and self.model.device.type == 'cuda':
                    inputs = {k: v.to("cuda") for k, v in inputs.items()}
                    
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=300,
                    temperature=0.3,
                    do_sample=True
                )
                
                response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            else:
                return self._fallback_suggestion(washing_status)
            if "RESPONSE FORMAT:" in response:
                response = response.split("RESPONSE FORMAT:")[-1].strip()
            
            # Attempt to extract JSON from response if it contains extra text
            import json
            import re
            try:
                # Find JSON structure
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    return json_match.group(0)
            except:
                pass
                
            return response
            
        except Exception as e:
            print(f"⚠️ Error generating suggestion: {e}")
            import json
            fallback_result = self._fallback_suggestion(washing_status)
            # _fallback_suggestion already returns JSON string
            return fallback_result if isinstance(fallback_result, str) else json.dumps(fallback_result)

    def _format_game_profiles(self, profiles):
        text = ""
        for key, p in profiles.items():
            text += f"- {p['name']}: RTP {p['rtp']*100:.1f}%, Volatility {p['volatility']}, Hands/Hr {p['hands_per_hour']}\n"
        return text

    def _fallback_suggestion(self, status):
        """Rule-based suggestion when AI is offline"""
        import json
        bankroll = status.get('bankroll', 0)
        needed = status.get('washing_needed', 0)
        
        result = {
            "recommendation": "Blackjack",
            "strategy": "Standard play",
            "reasoning": "Steady grind is best.",
            "action_tab": "tab-wash",
            "action_settings": {}
        }
        
        if needed <= 0:
            result = {
                "recommendation": "Cash Out",
                "strategy": "Stop playing immediately.",
                "reasoning": "Washing complete. Lock in profits.",
                "action_tab": "tab-health",
                "action_settings": {}
            }
            return json.dumps(result)
            
        ratio = needed / bankroll if bankroll > 0 else 999
        
        if ratio < 0.5:
            result = {
                "recommendation": "Blackjack (Basic Strategy)",
                "strategy": "Flat bet minimums.",
                "reasoning": "You are winning. Minimize variance to finish the wash safely.",
                "action_tab": "tab-wash",
                "action_settings": {"bet_size": 25}
            }
        elif ratio > 2.0:
            result = {
                "recommendation": "Craps (High Volatility)",
                "strategy": "Pass Line + Max Odds.",
                "reasoning": "You are behind. You need a big win to recover funds before washing completes.",
                "action_tab": "tab-craps",
                "action_settings": {}
            }
        else:
            result = {
                "recommendation": "Blackjack",
                "strategy": "Standard play.",
                "reasoning": "Steady grind is best. Avoid high-risk bets.",
                "action_tab": "tab-wash",
                "action_settings": {}
            }
        
        import json
        return json.dumps(result)

    def _fallback_reasoning(self, context, math_data):
        """
        Rule-based fallback when AI is not available.
        """
        risk_pct = math_data.get('risk_of_ruin_percent', 0)
        recommendation = math_data.get('recommendation', 'UNKNOWN')
        optimal_bet = math_data.get('optimal_bet_size', 0)
        current_bet_ratio = math_data.get('current_bet_ratio', 0)
        
        if risk_pct > 20:
            advice = f"⚠️ EXTREME RISK ({risk_pct}% chance of ruin). STOP PLAYING IMMEDIATELY. Your bet size is too large relative to your bankroll."
        elif risk_pct > 5:
            advice = f"⚠️ DANGEROUS ({risk_pct}% risk of ruin). Lower your bet size. Optimal bet: ${optimal_bet:,.2f}."
        elif risk_pct > 1:
            advice = f"⚠️ CAUTION ({risk_pct}% risk). Consider reducing bet size slightly. Current bet is {current_bet_ratio*100:.1f}% of bankroll."
        else:
            advice = f"✅ SAFE ({risk_pct}% risk). Strategy is sustainable. Continue playing with current parameters."
        
        if optimal_bet > 0 and current_bet_ratio > 0:
            if current_bet_ratio > 0.1:  # More than 10% of bankroll per bet
                advice += " Your bet size is very aggressive. Consider using Kelly Criterion (${optimal_bet:,.2f})."
        
        return advice
    
    def train_casino_model(self, sessions: List[Dict], epochs: int = 10, save: bool = True):
        """
        Train casino state-space model on session data.
        
        Success Metric: Clean money (washing progress)
        
        Args:
            sessions: List of session dicts with:
                - game_type, avg_bet_size, starting_bankroll, dirty_money
                - duration_minutes, hands_played, washing_target
                - clean_money (final clean money - success metric)
            epochs: Number of training epochs
            save: Whether to save the trained model
        """
        if not STATE_SPACE_AVAILABLE or self.casino_trainer is None:
            print("⚠️ State-space model not available for training")
            return
        
        # Prepare training data
        training_sessions = []
        for session in sessions:
            features = prepare_casino_features(session)
            training_sessions.append({
                'features': features.tolist(),
                'clean_money': session.get('clean_money', 0),
                'starting_bankroll': session.get('starting_bankroll', 1000),
                'washing_progress': session.get('washing_progress', 0)
            })
        
        if len(training_sessions) < 10:
            print("⚠️ Need at least 10 sessions for training")
            return
        
        print(f"📊 Training casino model on {len(training_sessions)} sessions...")
        self.casino_trainer.train_casino(training_sessions, epochs=epochs)
        
        if save:
            model_dir = os.path.join(os.path.dirname(__file__), 'models')
            os.makedirs(model_dir, exist_ok=True)
            model_path = os.path.join(model_dir, 'casino_model.pt')
            self.casino_trainer.save_model(model_path)
    
    def train_sportsbook_model(self, bets: List[Dict], epochs: int = 10, save: bool = True):
        """
        Train sportsbook state-space model on bet data.
        
        Success Metric: Winning bets (win rate)
        
        Args:
            bets: List of bet dicts with:
                - team_data, opponent_data, odds
                - won (bool) - success metric
            epochs: Number of training epochs
            save: Whether to save the trained model
        """
        if not STATE_SPACE_AVAILABLE or self.sportsbook_trainer is None:
            print("⚠️ State-space model not available for training")
            return
        
        # Prepare training data
        training_bets = []
        for bet in bets:
            features = prepare_sportsbook_features(bet)
            training_bets.append({
                'features': features.tolist(),
                'won': bet.get('won', False)
            })
        
        if len(training_bets) < 10:
            print("⚠️ Need at least 10 bets for training")
            return
        
        print(f"📊 Training sportsbook model on {len(training_bets)} bets...")
        self.sportsbook_trainer.train_sportsbook(training_bets, epochs=epochs)
        
        if save:
            model_dir = os.path.join(os.path.dirname(__file__), 'models')
            os.makedirs(model_dir, exist_ok=True)
            model_path = os.path.join(model_dir, 'sportsbook_model.pt')
            self.sportsbook_trainer.save_model(model_path)
    
    def predict_casino_success(self, session_features: Dict) -> float:
        """
        Predict casino success (clean money ratio) using trained model.
        
        Args:
            session_features: Session feature dict
        
        Returns:
            Predicted clean money ratio (0-1)
        """
        if self.casino_model is None:
            return 0.5  # Default prediction
        
        features = prepare_casino_features(session_features)
        return self.casino_model.predict(features)
    
    def predict_sportsbook_win(self, bet_features: Dict) -> float:
        """
        Predict sportsbook win probability using trained model.
        
        Args:
            bet_features: Bet feature dict
        
        Returns:
            Predicted win probability (0-1)
        """
        if self.sportsbook_model is None:
            return 0.5  # Default prediction
        
        features = prepare_sportsbook_features(bet_features)
        return self.sportsbook_model.predict(features)


# Global AI instance (initialized on demand)
_ai_instance = None


def get_ai_instance():
    """
    Get or create the global AI instance.
    Lazy loading: only initializes when first needed.
    
    Uses Ollama by default if available.
    
    Environment variables:
    - USE_LOCAL_AI: "true" to enable AI (default: "false")
    - OLLAMA_MODEL: Ollama model name (default: "llama3.2")
    - OLLAMA_BASE_URL: Ollama server URL (default: "http://localhost:11434")
    - AI_MODEL_ID: HuggingFace model ID (fallback only)
    
    Popular Ollama models:
    - llama3.2 (default)
    - llama3.1
    - mistral
    - qwen2.5
    - deepseek-r1
    """
    global _ai_instance
    
    if _ai_instance is None:
        # Check if user wants to use AI (can be disabled via env var)
        use_ai = os.getenv("USE_LOCAL_AI", "false").lower() == "true"
        
        # Get model ID from environment
        model_id = os.getenv("OLLAMA_MODEL", os.getenv("AI_MODEL_ID", None))
        
        # Prefer Ollama if available
        use_ollama = OLLAMA_AVAILABLE
        
        if use_ai and AI_AVAILABLE:
            try:
                _ai_instance = LocalAI(model_id=model_id, use_ollama=use_ollama)
            except Exception as e:
                print(f"⚠️ Failed to initialize AI: {e}")
                _ai_instance = LocalAI(model_id=model_id, use_ollama=use_ollama)  # Will use fallback
        else:
            # Create instance that will use fallback
            _ai_instance = LocalAI(model_id=model_id, use_ollama=use_ollama)
            if not use_ai:
                _ai_instance.initialized = False
    
    return _ai_instance

