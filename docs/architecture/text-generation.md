# Text Generation Backend Flow

All simple text generation run through `/api/text-generation`. It accepts modelId, and prompt. It returns generated text result.


## Runtime Path

```txt
POST /api/text-generation (route handler)
  -> generateText() service
  -> provider chain selects an adapter
  -> adapter.generateText()
  -> provider SDK/API call function
```

## Pieces

| Piece | File | Job |
| --- | --- | --- |
| API route | `src/app/api/text-generation/route.ts` | HTTP boundary: parse JSON, validate, run generateText() service, return `Response.json`. |
| Validation | `src/lib/validations/text-generation.ts` | Zod schema for allowed model IDs and non-empty prompt. |
| Service | `src/lib/ai/text-generation/service.ts` | Main text-generation entry point; picks default model and tries providers. |
| Provider chain | `src/lib/ai/text-generation/provider-chain.ts` | Reads the model config and returns adapters in provider order. |
| Model config | `src/lib/ai/text-generation/models.ts` | Source of truth for display models and provider model IDs. |
| Types | `src/lib/ai/text-generation/types.ts` | Shared model IDs, provider IDs, params, result, adapter contract. |
| Adapter | `src/lib/ai/text-generation/adapters/*.ts` | Converts app params/results/errors to one provider shape. |
| Provider call | `src/lib/ai/text-generation/providers/*.ts` | Thin SDK wrapper: env key, client, API call. |

## Ownership Rules

- API route handles HTTP only.
- Validation handles request shape only.
- Service handles orchestration only.
- Provider chain handles provider order/fallback only.
- Adapter handles provider translation and provider error mapping.
- Provider call handles the SDK/API only.
- Model config is shared data, not business logic.

## Current Provider Order

- Gemini 3.5 Flash, Gemini 3.1 Flash-Lite: Google AI Studio.
- GLM 5.2, Kimi K2.7 Code, Kimi K2.6: Cloudflare Workers AI.
- Gemma 4 26B A4B: Google AI Studio, OpenRouter, Cloudflare Workers AI.
- GPT-OSS 20B: Groq, OpenRouter, Cloudflare Workers AI.
- OpenRouter uses its free variants and needs `OPENROUTER_API_KEY`.
- Groq needs `GROQ_API_KEY`.

## Add a Provider

Example: Anthropic.

1. Add `TEXT_GENERATION_PROVIDER_IDS.ANTHROPIC` in `types.ts`.
2. Add `providers/anthropic.ts` for client setup and SDK call.
3. Add `adapters/anthropic.ts` implementing `TextGenerationProviderAdapter`.
4. Register it in `TEXT_GENERATION_ADAPTERS` in `provider-chain.ts`.
5. Add Anthropic model IDs to `providerModels` in `models.ts`.
6. Add a UI model group only if the new provider needs one.

## Add a Model

1. Add the app-facing ID to `TEXT_GENERATION_MODEL_IDS` in `types.ts`.
2. Add one `TEXT_GENERATION_MODELS` entry in `models.ts`.
3. Map each supported provider to its real provider model ID.

Existing validation, provider-chain lookup, and current UI groups follow from
those entries.

## Mirror for Other AI Types

Use the same shape only when the capability needs providers/adapters:

```txt
src/lib/ai/image-generation/
src/lib/ai/video-generation/
src/lib/ai/audio-generation/
```

Do not create shared `generation` abstractions until two AI types duplicate the
same code.
