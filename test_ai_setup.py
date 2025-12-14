"""
Test script to verify AI setup and download model
"""
import os
import sys

print("🧪 Testing AI Setup...")
print("=" * 50)

# Test 1: Check PyTorch
print("\n1. Checking PyTorch...")
try:
    import torch
    print(f"   ✅ PyTorch {torch.__version__} installed")
    if torch.cuda.is_available():
        print(f"   ✅ CUDA available: {torch.cuda.get_device_name(0)}")
        print(f"   ✅ CUDA version: {torch.version.cuda}")
    else:
        print("   ⚠️ CUDA not available (will use CPU - slower)")
except ImportError:
    print("   ❌ PyTorch not installed")
    sys.exit(1)

# Test 2: Check Transformers
print("\n2. Checking Transformers...")
try:
    import transformers
    print(f"   ✅ Transformers {transformers.__version__} installed")
except ImportError:
    print("   ❌ Transformers not installed")
    sys.exit(1)

# Test 3: Check BitsAndBytes
print("\n3. Checking BitsAndBytes...")
try:
    import bitsandbytes
    print(f"   ✅ BitsAndBytes installed")
except ImportError:
    print("   ⚠️ BitsAndBytes not installed (needed for 4-bit quantization)")

# Test 4: Check Environment
print("\n4. Checking Environment Variables...")
use_ai = os.getenv("USE_LOCAL_AI", "false")
model_id = os.getenv("AI_MODEL_ID", "deepseek-ai/deepseek-math-7b-instruct")
print(f"   USE_LOCAL_AI: {use_ai}")
print(f"   AI_MODEL_ID: {model_id}")

# Test 5: Try to import AI wrapper
print("\n5. Testing AI Wrapper Import...")
try:
    from ai_wrapper import get_ai_instance, LocalAI
    print("   ✅ AI wrapper imported successfully")
except ImportError as e:
    print(f"   ❌ Failed to import: {e}")
    sys.exit(1)

# Test 6: Initialize AI (this will download model on first run)
print("\n6. Initializing AI Model...")
print("   ⏳ This will download the model on first run (~4GB)...")
print("   ⏳ This may take 5-10 minutes...")

try:
    # Set environment to enable AI
    os.environ['USE_LOCAL_AI'] = 'true'
    
    ai = get_ai_instance()
    
    if ai.initialized:
        print("   ✅ AI model loaded successfully!")
        print(f"   ✅ Model device: {ai.model.device if ai.model else 'N/A'}")
    else:
        print("   ⚠️ AI model not initialized (using fallback)")
        print("   ℹ️ This is OK - fallback reasoning still works")
        
except Exception as e:
    print(f"   ⚠️ Error initializing AI: {e}")
    print("   ℹ️ Fallback reasoning will be used")

# Test 7: Test with sample data
print("\n7. Testing AI with Sample Risk Data...")
try:
    from risk_engine import calculate_risk_of_ruin
    
    # Calculate sample risk
    math_data = calculate_risk_of_ruin(
        bankroll=1000,
        bet_size=25,
        win_probability=0.48,
        payout_ratio=1.0,
        simulations=1000  # Smaller for quick test
    )
    
    print(f"   Math Result: {math_data['risk_of_ruin_percent']}% risk")
    
    # Get AI advice
    ai = get_ai_instance()
    context = "Playing blackjack with true count +4"
    advice = ai.ask_brain(context, math_data)
    
    print(f"   ✅ AI Advice Generated:")
    print(f"   {advice[:200]}...")
    
except Exception as e:
    print(f"   ⚠️ Error testing: {e}")

print("\n" + "=" * 50)
print("✅ Setup test complete!")
print("\nNext steps:")
print("1. If model downloaded successfully, you're ready!")
print("2. Start backend: python backend_api.py")
print("3. Test endpoint: POST /api/analyze-session")

