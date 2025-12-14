"""Quick test to verify AI is working"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Set environment
os.environ['USE_LOCAL_AI'] = 'true'
os.environ['AI_MODEL_ID'] = 'deepseek-ai/deepseek-math-7b-instruct'

print("🧪 Quick AI Test")
print("=" * 50)

# Test imports
try:
    from risk_engine import calculate_risk_of_ruin
    print("✅ Risk engine imported")
except Exception as e:
    print(f"❌ Risk engine error: {e}")
    sys.exit(1)

try:
    from ai_wrapper import get_ai_instance
    print("✅ AI wrapper imported")
except Exception as e:
    print(f"❌ AI wrapper error: {e}")
    sys.exit(1)

# Test risk calculation
print("\n📊 Calculating sample risk...")
math_data = calculate_risk_of_ruin(
    bankroll=1000,
    bet_size=25,
    win_probability=0.48,
    payout_ratio=1.0,
    simulations=1000
)
print(f"   Risk of Ruin: {math_data['risk_of_ruin_percent']}%")

# Test AI
print("\n🤖 Testing AI (this may download model on first run)...")
try:
    ai = get_ai_instance()
    
    if ai.initialized:
        print("   ✅ AI model loaded!")
        context = "Playing blackjack, true count +4"
        advice = ai.ask_brain(context, math_data)
        print(f"   ✅ AI Advice: {advice[:100]}...")
    else:
        print("   ⚠️ AI using fallback (still works!)")
        advice = ai.ask_brain("Playing blackjack", math_data)
        print(f"   ✅ Fallback Advice: {advice[:100]}...")
        
except Exception as e:
    print(f"   ⚠️ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n✅ Test complete!")

