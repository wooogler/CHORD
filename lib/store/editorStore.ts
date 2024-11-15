import { create } from "zustand";
import * as cheerio from "cheerio";

interface EditorState {
  contentHtml: string;
  selectedHtml: string;
  isEditable: boolean;
  isLocked: boolean;
  setContentHtml: (contentHtml: string) => void;
  setSelectedHtml: (selectedHtml: string) => void;
  setIsEditable: (isEditable: boolean) => void;
  setIsLocked: (isLocked: boolean) => void;
  updateHighlightedContentHtml: ({
    editedHtml,
    originalHtml,
    apply,
  }: {
    editedHtml?: string;
    originalHtml?: string;
    apply: boolean;
  }) => void;
}

const useEditorStore = create<EditorState>((set) => ({
  contentHtml: "",
  selectedHtml: "",
  isEditable: true,
  isLocked: false,
  setContentHtml: (contentHtml: string) => set({ contentHtml }),
  setSelectedHtml: (selectedHtml: string) => set({ selectedHtml }),
  setIsEditable: (isEditable: boolean) => set({ isEditable }),
  setIsLocked: (isLocked: boolean) => set({ isLocked }),
  updateHighlightedContentHtml: ({
    editedHtml,
    originalHtml,
    apply,
  }: {
    editedHtml?: string;
    originalHtml?: string;
    apply: boolean;
  }) => {
    set((state) => {
      const $ = cheerio.load(state.contentHtml);
      const highlightedSpan = $("span.highlight-yellow");

      if (highlightedSpan.length) {
        if (apply) {
          highlightedSpan.replaceWith(
            `<span class="highlight-green">${editedHtml}</span>`
          );
        } else {
          highlightedSpan.replaceWith(`${originalHtml}`);
        }

        return { contentHtml: $.html() };
      }

      return state;
    });
  },
}));

export default useEditorStore;
