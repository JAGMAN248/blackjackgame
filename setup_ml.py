"""
Complete ML Setup Script
Installs dependencies and tests the AI model
"""
import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a command and show progress"""
    print(f"\n{'='*60}")
    print(f"📦 {description}")
    print(f"{'='*60}")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        print(e.stderr)
        return False

def main():
    print("🚀 Complete ML Setup for Risk Analysis")
    print("=" * 60)
    print("This will install:")
    print("1. PyTorch (with CUDA support if available)")
    print("2. Transformers (HuggingFace)")
    print("3. BitsAndBytes (4-bit quantization)")
    print("4. Test the setup")
    print("=" * 60)
    
    # Step 1: Install PyTorch
    print("\n🔧 Step 1: Installing PyTorch...")
    if not run_command(
        "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121",
        "Installing PyTorch with CUDA 12.1 support"
    ):
        print("⚠️ Trying CPU-only PyTorch...")
        run_command(
            "pip install torch torchvision torchaudio",
            "Installing PyTorch (CPU-only)"
        )
    
    # Step 2: Install Transformers
    print("\n🔧 Step 2: Installing Transformers...")
    run_command(
        "pip install transformers accelerate",
        "Installing HuggingFace Transformers"
    )
    
    # Step 3: Install BitsAndBytes (optional, for GPU quantization)
    print("\n🔧 Step 3: Installing BitsAndBytes...")
    run_command(
        "pip install bitsandbytes",
        "Installing BitsAndBytes for 4-bit quantization"
    )
    
    # Step 4: Verify installations
    print("\n🔍 Step 4: Verifying Installations...")
    try:
        import torch
        print(f"✅ PyTorch {torch.__version__} installed")
        if torch.cuda.is_available():
            print(f"✅ CUDA available: {torch.cuda.get_device_name(0)}")
        else:
            print("⚠️ CUDA not available (will use CPU)")
    except ImportError:
        print("❌ PyTorch not installed")
        return False
    
    try:
        import transformers
        print(f"✅ Transformers {transformers.__version__} installed")
    except ImportError:
        print("❌ Transformers not installed")
        return False
    
    # Step 5: Setup environment
    print("\n🔧 Step 5: Setting up environment...")
    env_file = ".env"
    env_vars = {
        "USE_LOCAL_AI": "true",
        "AI_MODEL_ID": "deepseek-ai/deepseek-math-7b-instruct"
    }
    
    # Read existing .env
    existing_vars = {}
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    existing_vars[key] = value
    
    # Merge with new vars
    existing_vars.update(env_vars)
    
    # Write .env
    with open(env_file, 'w') as f:
        for key, value in existing_vars.items():
            f.write(f"{key}={value}\n")
    
    print("✅ Environment variables set:")
    for key, value in env_vars.items():
        print(f"   {key}={value}")
    
    # Step 6: Test AI setup
    print("\n🧪 Step 6: Testing AI Setup...")
    print("⏳ This will download the model on first run (~4GB)...")
    print("⏳ This may take 5-10 minutes...")
    
    try:
        # Add backend to path
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
        
        from ai_wrapper import get_ai_instance
        from risk_engine import calculate_risk_of_ruin
        
        # Set environment
        os.environ['USE_LOCAL_AI'] = 'true'
        os.environ['AI_MODEL_ID'] = 'deepseek-ai/deepseek-math-7b-instruct'
        
        print("\n📥 Loading AI model (first time download)...")
        ai = get_ai_instance()
        
        if ai.initialized:
            print("✅ AI model loaded successfully!")
            
            # Test with sample data
            print("\n🧪 Testing with sample risk data...")
            math_data = calculate_risk_of_ruin(
                bankroll=1000,
                bet_size=25,
                win_probability=0.48,
                payout_ratio=1.0,
                simulations=1000
            )
            
            context = "Playing blackjack with true count +4"
            advice = ai.ask_brain(context, math_data)
            
            print(f"\n✅ AI Test Successful!")
            print(f"📊 Risk: {math_data['risk_of_ruin_percent']}%")
            print(f"🤖 AI Advice: {advice[:150]}...")
            
        else:
            print("⚠️ AI model not initialized (using fallback)")
            print("ℹ️ This is OK - fallback reasoning still works")
            print("ℹ️ Check GPU/CUDA availability or try CPU mode")
        
    except Exception as e:
        print(f"⚠️ Error testing AI: {e}")
        print("ℹ️ Fallback reasoning will be used")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("✅ Setup Complete!")
    print("\nNext steps:")
    print("1. Start backend: python backend_api.py")
    print("2. Test endpoint: POST http://localhost:8000/api/analyze-session")
    print("3. Model will download automatically on first use")
    print("=" * 60)

if __name__ == "__main__":
    main()

