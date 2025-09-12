# Gemma2:2b Quantization Optimization Guide

This guide shows how your Gemma2:2b model is already optimized with quantization for better performance and lower resource usage.

## Quick Start

### 1. Install Optimized Models

```bash
# Primary model (already Q4_0 quantized - 1.6GB)
ollama pull gemma2:2b

# Alternative sizes
ollama pull gemma2:2b-instruct  # Instruct-tuned version
ollama pull gemma2:9b          # Larger model
ollama pull gemma2:27b         # Largest variant
```

### 2. Environment Variables for Optimization

Add these to your shell profile or run before starting:

```bash
# Performance optimization
export OLLAMA_NUM_PARALLEL=1
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_KV_CACHE_TYPE="q8_0"

# Thread and GPU optimization
export OLLAMA_NUM_THREADS=8
export OLLAMA_GPU_LAYERS=40
export OLLAMA_GPU_MEMORY_FRACTION=0.8
```

## Model Comparison

| Model | Size | Memory | Speed | Quality | Quantization | Use Case |
|-------|------|---------|-------|---------|-------------|----------|
| `gemma2:2b` | 1.6GB | 3-4GB RAM | Fast | Good | Q4_0 (built-in) | Recommended |
| `gemma2:2b-instruct` | ~1.6GB | 3-4GB RAM | Fast | Better | Q4_0 (built-in) | Chat/Instructions |
| `gemma2:9b` | ~5GB | 8-10GB RAM | Medium | High | Q4_0 | Larger contexts |
| `gemma2:27b` | ~15GB | 20-24GB RAM | Slower | Highest | Q4_0 | High-end hardware |

## Configuration

Your BYok app now supports these optimized models automatically:

- **Default**: `gemma2:2b` (Q4_0 quantized, recommended)
- **Available**: `gemma2:2b`, `gemma2:2b-instruct`, `gemma2:9b`, `gemma2:27b`
- **Auto-optimization**: Settings adjust based on model type and quantization

## Testing

```bash
# Test the optimized model
ollama run gemma2:2b "Explain quantization in AI models"

# Compare different sizes
time ollama run gemma2:2b "Hello world"
time ollama run gemma2:9b "Hello world" 
```

## Advanced Configuration

Create custom model configurations:

```bash
# Create optimized Modelfile
cat > Modelfile << EOF
FROM gemma2:2b
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1
PARAMETER num_ctx 2048
EOF

ollama create gemma2-optimized -f Modelfile
```

## Troubleshooting

### GPU Issues
```bash
# Check GPU availability
ollama ps
nvidia-smi  # For NVIDIA GPUs
```

### Memory Issues
```bash
# Use CPU-only mode
export CUDA_VISIBLE_DEVICES=""
ollama run gemma2:2b
```

### Performance Issues
- `gemma2:2b` already uses optimal Q4_0 quantization
- Reduce `num_ctx` for faster responses  
- Set `OLLAMA_NUM_THREADS` to your CPU core count
- Consider `gemma2:2b-instruct` for better chat responses

## What Changed

1. **Model Selection**: Updated with available Gemma2 variants
2. **Default Model**: Uses `gemma2:2b` (already Q4_0 quantized - 1.6GB)
3. **Auto-optimization**: Smart parameter adjustment for quantized models
4. **GPU Support**: Enabled GPU acceleration when available

**Key Insight**: The `gemma2:2b` model is already optimized with Q4_0 quantization, providing excellent performance at just 1.6GB!