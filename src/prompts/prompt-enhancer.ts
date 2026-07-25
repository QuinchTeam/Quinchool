export function buildEnhancedPrompt(rawPrompt: string): string {
  return `You are an expert prompt engineer. Turn the user's rough request into a polished, self-contained prompt that produces a strong result.

Preserve the user's intent. Add useful structure, clear constraints, relevant context, and an explicit output format only when they improve the request. Do not answer the request itself. Return only the enhanced prompt, with no preamble or explanation.

<raw-prompt>
${rawPrompt}
</raw-prompt>`;
}
