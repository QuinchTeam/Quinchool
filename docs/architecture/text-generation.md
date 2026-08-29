# Text Generation Backend Flow

All simple text generation runs through `POST /text-generation` on the API. It
accepts modelId and prompt, and returns the generated text result. The LLM work
itself happens in `apps/ai`: providers, fallback, and tracing live with the rest
of the AI service, and the API keeps auth and the HTTP boundary the browser
already talks to.

## Runtime Path

```txt
POST /text-generation (apps/api controller, session guard)
  -> apps/api text-generation client (one HTTP hop)
  -> POST /text-generation (apps/ai route)
  -> generate_text() service
  -> provider chain, in the order the model config lists
  -> one provider call function
```

`/prompt-enhancer` is the same path with the prompt wrapped first; the wrapping
is `build_enhanced_prompt()` in the AI service.

## Pieces

| Piece | File | Job |
| --- | --- | --- |
| API route | `apps/api/src/text-generation/text-generation.controller.ts` | HTTP boundary: session guard, validate, call the client, return the result. |
| API validation | `apps/api/src/text-generation/text-generation.contract.ts` | Transport validation for non-empty model ID and prompt. |
| API client | `apps/api/src/common/ai-service.ts` | Shared HTTP hop to FastAPI, plus failure translation. |
| API workflow | `apps/api/src/text-generation/service.ts` | Maps the public routes to their FastAPI routes. |
| API errors | `apps/api/src/text-generation/errors.ts` | `TextGenerationError` and the response body the browser reads. |
| AI route | `apps/ai/app/routes/text_generation.py` | HTTP boundary: parse, run the service, map failures to a status. |
| AI validation | `apps/ai/app/validations/text_generation.py` | Model IDs, provider IDs, request and result contracts. |
| AI service | `apps/ai/app/services/text_generation.py` | Orchestration: default model, provider fallback, Langfuse observations. |
| Model config | `apps/ai/app/lib/llm/models.py` | Source of truth for which providers serve a model, in fallback order. |
| Provider calls | `apps/ai/app/lib/llm/providers.py` | One function per provider: env key, client, API call, usage. |
| Provider errors | `apps/ai/app/lib/llm/errors.py` | Turns a provider failure into a status and a readable sentence. |
| Tracing | `apps/ai/app/core/tracing.py` | Optional Langfuse client and observation wrappers. |
| UI model list | `apps/web/src/lib/ai/text-generation/models.ts` | Display names and descriptions for the model picker. |

## Ownership Rules

- The API controller handles HTTP and auth only.
- The API client handles the hop and failure translation only.
- The AI route handles HTTP only.
- The AI service handles orchestration and fallback only.
- A provider function handles one provider's API only.
- Model config is shared data, not business logic.
- The web app keeps model display copy, nothing else.

There is no adapter layer between the service and the providers: every provider
function already returns the same `ProviderText`, so there was nothing left for
one to translate.

## Current Provider Order

- Gemini 3.5 Flash, Gemini 3.1 Flash-Lite: Google AI Studio.
- Kimi K2.7 Code, Kimi K2.6: Cloudflare Workers AI.
- Gemma 4 26B A4B: Google AI Studio, OpenRouter, Cloudflare Workers AI.
- GPT-OSS 20B: Groq, OpenRouter, Cloudflare Workers AI.

Every provider key lives in `apps/ai/.env`: `GEMINI_API_KEY`,
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`, `OPENROUTER_API_KEY`,
`GROQ_API_KEY`. A missing key costs a fallback, not the request.

## Failures

A provider rate limit becomes `{ code: "rate_limit", error, providerId,
providerModelId }` with status 429, and the API forwards that body unchanged —
the provider's own wording says more than a generic message can. Anything else
becomes a 500 with the fallback sentence. An AI service that is not running
becomes a 503 telling you to start it.

## Add a Provider

Example: Anthropic.

1. Add `"anthropic"` to `TextGenerationProviderId` in
   `apps/ai/app/validations/text_generation.py`.
2. Add the call function to `apps/ai/app/lib/llm/providers.py` and register it
   in `TEXT_GENERATION_PROVIDERS`.
3. Add its key to `Settings` in `apps/ai/app/core/config.py`.
4. Add Anthropic model IDs to `TEXT_GENERATION_MODELS` in
   `apps/ai/app/lib/llm/models.py`.
5. Mirror the provider ID in `apps/web/src/lib/ai/text-generation/types.ts` only
   if the picker needs to name it.

## Add a Model

1. Add the app-facing ID to `TextGenerationModelId` in the AI validations.
2. Add one `TEXT_GENERATION_MODELS` entry mapping each provider to its real
   provider model ID, first provider first.
3. Add the same ID to the web app's model registry so the picker can show it.

Nest deliberately does not keep a model or provider registry. FastAPI validates
the requested model; Nest only checks that the transport field is non-empty.

## Mirror for Other AI Types

Use the same shape only when the capability needs several providers:

```txt
apps/ai/app/lib/llm/   (text)
apps/ai/app/lib/image/
apps/ai/app/lib/audio/
```

Do not create shared `generation` abstractions until two AI types duplicate the
same code.
