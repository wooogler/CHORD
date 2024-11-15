import { create } from "zustand";

interface WikiState {
  contentHtml: string;
  selectedHtml: string;
  isEditable: boolean;
  isLocked: boolean;
}

export const useChordStore = create<WikiState>((set) => ({
  contentHtml: "",
  selectedHtml: "",
  isEditable: false,
  isLocked: false,
  setContentHtml: (contentHtml: string) => set({ contentHtml }),
  setSelectedHtml: (selectedHtml: string) => set({ selectedHtml }),
  setIsEditable: (isEditable: boolean) => set({ isEditable }),
  setIsLocked: (isLocked: boolean) => set({ isLocked }),
}));
