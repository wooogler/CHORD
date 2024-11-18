import { create } from "zustand";
import * as cheerio from "cheerio";

interface HistoryItem {
  html: string;
  timestamp: number;
}

interface LogItem {
  html: string;
  action: string;
  timestamp: number;
  metadata?: any;
}

interface EditorState {
  contentHtml: string;
  contentHistory: HistoryItem[];
  contentLogs: LogItem[];
  currentHistoryIndex: number;
  selectedHtml: string;
  isEditable: boolean;
  isLocked: boolean;
  setContentHtml: (contentHtml: string, action?: string) => void;
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
  addToHistory: (html: string) => void;
  addToLogs: (html: string, action: string, metadata?: any) => void;
  undo: () => void;
  redo: () => void;
  getContentLogs: () => LogItem[];
}

const useEditorStore = create<EditorState>((set, get) => ({
  contentHtml: "",
  contentHistory: [],
  contentLogs: [],
  currentHistoryIndex: -1,
  selectedHtml: "",
  isEditable: true,
  isLocked: false,
  setContentHtml: (contentHtml: string, action?: string) => {
    get().addToHistory(contentHtml);
    get().addToLogs(contentHtml, action || "SET_CONTENT");
  },
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

        const newHtml = $.html();
        get().addToHistory(newHtml);
        get().addToLogs(newHtml, apply ? "APPLY_EDIT" : "CANCEL_EDIT", {
          editedHtml,
          originalHtml,
        });
        return { contentHtml: newHtml };
      }

      return state;
    });
  },
  addToHistory: (html: string) => {
    set((state) => {
      const newHistory = state.contentHistory.slice(
        0,
        state.currentHistoryIndex + 1
      );
      newHistory.push({
        html,
        timestamp: Date.now(),
      });

      return {
        contentHtml: html,
        contentHistory: newHistory,
        currentHistoryIndex: newHistory.length - 1,
      };
    });
  },
  addToLogs: (html: string, action: string, metadata?: any) => {
    set((state) => ({
      contentLogs: [
        ...state.contentLogs,
        {
          html,
          action,
          timestamp: Date.now(),
          metadata,
        },
      ],
    }));
  },
  undo: () => {
    set((state) => {
      if (state.currentHistoryIndex > 0) {
        const newIndex = state.currentHistoryIndex - 1;
        const newHtml = state.contentHistory[newIndex].html;
        get().addToLogs(newHtml, "UNDO");
        return {
          contentHtml: newHtml,
          currentHistoryIndex: newIndex,
        };
      }
      return state;
    });
  },
  redo: () => {
    set((state) => {
      if (state.currentHistoryIndex < state.contentHistory.length - 1) {
        const newIndex = state.currentHistoryIndex + 1;
        const newHtml = state.contentHistory[newIndex].html;
        get().addToLogs(newHtml, "REDO");
        return {
          contentHtml: newHtml,
          currentHistoryIndex: newIndex,
        };
      }
      return state;
    });
  },
  getContentLogs: () => {
    return get().contentLogs;
  },
}));

export default useEditorStore;
