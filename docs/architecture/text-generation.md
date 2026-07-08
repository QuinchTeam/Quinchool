# Text Generation — Backend Flow

Request path, top to bottom:

```
Client (page.tsx)
   │  POST /api/text-generation { modelId, prompt }
   ▼
API Route            src/app/api/text-generation/route.ts
   │  parses + validates body
   ▼
Validation           src/lib/validations/text-generation.ts
   │  textGenerationSchema (zod)
   ▼
Service              src/lib/ai/text-generation/service.ts
   │  generateText() — picks default model, walks the provider chain
   ▼
Provider Chain       src/lib/ai/text-generation/provider-chain.ts
   │  getTextGenerationProviderChain() — reads which providers serve
   │  this model from config, returns their adapters in order
   ▼
Config               src/lib/ai/text-generation/models.ts
   │  TEXT_GENERATION_MODELS — model → { providerId: providerModelId }
   │  (single source of truth for "which provider supports this model")
   ▼
Adapter              src/lib/ai/text-generation/adapters/openai.ts
   │  TextGenerationProviderAdapter — translates the generic
   │  { modelId, prompt } into the provider's own call shape,
   │  maps provider errors via errors.ts
   ▼
Provider Service     src/lib/ai/text-generation/providers/openai.ts
   │  thin wrapper around the OpenAI SDK client
   ▼
OpenAI API
```

## Adding a new provider (e.g. Anthropic)

1. Add a service wrapper: `src/lib/ai/text-generation/providers/anthropic.ts` (SDK client + call).
2. Add an adapter: `src/lib/ai/text-generation/adapters/anthropic.ts` implementing
   `TextGenerationProviderAdapter`, mapping Anthropic's errors to `TextGenerationError`.
3. Register the adapter in `TEXT_GENERATION_ADAPTERS` in `provider-chain.ts`.
4. Add `TEXT_GENERATION_PROVIDER_IDS.ANTHROPIC` in `types.ts`.
5. List which models it serves in `providerModels` on the relevant entries in
   `models.ts` — the provider chain picks it up automatically,
   no separate list to maintain.

## Adding a new model

Add one entry to `TEXT_GENERATION_MODELS` in `models.ts` with
its `providerModels` map. Everything downstream (chain, validation enum via
`TEXT_GENERATION_MODEL_IDS`, UI dropdown) follows from that one place.
