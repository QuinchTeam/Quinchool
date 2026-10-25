import { create } from "zustand";

import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";

interface ChatbotState {
  modelId: TextGenerationModelId;
  input: string;
  isListOpen: boolean;
  setModelId: (modelId: TextGenerationModelId) => void;
  setInput: (input: string) => void;
  toggleList: () => void;
  setListOpen: (isListOpen: boolean) => void;
}

export const useChatbotStore = create<ChatbotState>()((set) => ({
  modelId: DEFAULT_TEXT_GENERATION_MODEL_ID,
  input: "",
  isListOpen: false,
  setModelId: (modelId) => set({ modelId }),
  setInput: (input) => set({ input }),
  toggleList: () => set((state) => ({ isListOpen: !state.isListOpen })),
  setListOpen: (isListOpen) => set({ isListOpen }),
}));
