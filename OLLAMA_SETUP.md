# Ollama Setup Guide

## Overview

The AI wrapper now uses **Ollama** as the primary LLM runtime. Ollama is easier to set up and manage than HuggingFace transformers.

## Installation

### Step 1: Install Ollama

**Windows:**
1. Download from: https://ollama.ai/
2. Run the installer
3. Ollama will start automatically

**Mac/Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Step 2: Pull a Model

```bash
# Popular models (choose one):
ollama pull llama3.2        # Default, good balance
ollama pull llama3.1        # Larger, more capable
ollama pull mistral         # Fast and efficient
ollama pull qwen2.5         # Strong reasoning
ollama pull deepseek-r1     # Math-focused
```

### Step 3: Verify Ollama is Running

```bash
ollama list
```

Should show your installed models.

### Step 4: Configure Environment

Create or update `.env` file:

```env
USE_LOCAL_AI=true
OLLAMA_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434
```

## Usage

The system will automatically:
1. Detect Ollama if running
2. Use your specified model
3. Fall back to HuggingFace if Ollama unavailable
4. Use rule-based reasoning if both unavailable

## API Endpoints

All existing endpoints work the same:
- `/api/analyze-session` - Uses Ollama for AI advice
- `/api/suggest-next-move` - Uses Ollama for recommendations

## Model Selection

Set via environment variable:

```bash
# Use specific model
export OLLAMA_MODEL=llama3.1

# Or in .env file
OLLAMA_MODEL=llama3.1
```

## Available Models

Popular Ollama models for this use case:

1. **llama3.2** (Default)
   - Good balance of speed and capability
   - ~2GB model size
   - Fast inference

2. **llama3.1**
   - More capable than 3.2
   - Better reasoning
   - Larger model

3. **mistral**
   - Very fast
   - Efficient
   - Good for real-time advice

4. **qwen2.5**
   - Strong reasoning
   - Good for math/analysis
   - Well-tested

5. **deepseek-r1**
   - Math-focused
   - Excellent for risk analysis
   - Reasoning-focused

## Troubleshooting

### "Ollama not available"
- Make sure Ollama is running: `ollama serve`
- Check if it's accessible: `curl http://localhost:11434/api/tags`

### "Model not found"
- Pull the model: `ollama pull llama3.2`
- Check available models: `ollama list`
- Update `OLLAMA_MODEL` in `.env`

### "Cannot connect to Ollama"
- Verify Ollama is running
- Check `OLLAMA_BASE_URL` is correct
- Default: `http://localhost:11434`

## Advantages of Ollama

1. **Easy Setup**: Just install and pull models
2. **No PyTorch Required**: Ollama handles everything
3. **Model Management**: Easy to switch models
4. **Fast**: Optimized inference
5. **Local**: All processing happens locally

## Fallback Behavior

If Ollama is not available:
1. Tries HuggingFace (if PyTorch installed)
2. Falls back to rule-based reasoning
3. System continues working

---

**Ollama is now your primary AI model!**

