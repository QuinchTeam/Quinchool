# Text-generation

## Providers

### Direct Providers

1. Google (Google AI Studio) - for Gemini and Gemma

### Third-party Providers

1. Cloudflare Workers AI
2. OpenRouter
3. Groq

## Our Models

Note: [ Model : Provider -> Fallback Provider -> ... ]

1. Gemini 3.5 Flash : Google AI Studio
2. Gemini 3.1 Flash-Lite : Google AI Studio
3. GLM 5.2 : Cloudflare Workers AI
4. Kimi K2.7 Code : Cloudflare Workers AI
5. Kimi K2.6 : Cloudflare Workers AI
6. Gemma 4 26B (A4B) : Google AI Studio → OpenRouter → Cloudflare Workers AI
7. GPT-OSS 20B : Groq → OpenRouter → Cloudflare Workers AI
