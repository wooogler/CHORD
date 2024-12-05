import { create } from "zustand";
import * as cheerio from "cheerio";

interface HistoryItem {
  html: string;
  timestamp: number;
}

interface LogItem {
  textContent: string;
  action: string;
  timestamp: number;
  editedHtml?: string;
  originalHtml?: string;
}

interface EditorState {
  contentHtml: string;
  contentHistory: HistoryItem[];
  contentLogs: LogItem[];
  currentHistoryIndex: number;
  selectedHtml: string | null;
  surroundingHtml: string | null;
  isEditable: boolean;
  isLocked: boolean;
  rightPanel: "guide-only" | "chat" | "guide";
  setRightPanel: (rightPanel: "guide-only" | "chat" | "guide") => void;
  setContentHtml: (contentHtml: string, action?: string) => void;
  setSelectedHtml: (selectedHtml: string | null) => void;
  setIsEditable: (isEditable: boolean) => void;
  setIsLocked: (isLocked: boolean) => void;
  emptyContentLogs: () => void;
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
  addToLogs: ({
    html,
    action,
    editedHtml,
    originalHtml,
  }: {
    html: string;
    action: string;
    editedHtml?: string;
    originalHtml?: string;
  }) => void;
  undo: () => void;
  redo: () => void;
  getContentLogs: () => LogItem[];
}

const useEditorStore = create<EditorState>()((set, get) => ({
  contentHtml: "",
  contentHistory: [],
  contentLogs: [],
  currentHistoryIndex: -1,
  selectedHtml: null,
  surroundingHtml: null,
  isEditable: true,
  isLocked: false,
  rightPanel: "guide-only",
  setRightPanel: (rightPanel: "guide-only" | "chat" | "guide") =>
    set({ rightPanel }),
  setContentHtml: (contentHtml: string, action?: string) => {
    get().addToHistory(contentHtml);
    get().addToLogs({ html: contentHtml, action: action || "SET_CONTENT" });
  },
  setSelectedHtml: (selectedHtml: string | null) => {
    if (!selectedHtml) {
      set({ selectedHtml: null, surroundingHtml: null });
      return;
    }

    const contentHtml = get().contentHtml;
    const $ = cheerio.load(contentHtml);

    const targetP = $("p.wiki-paragraph")
      .filter((_, elem) => {
        const elemHtml = $(elem).html()?.trim() || "";
        return elemHtml.includes(selectedHtml.trim());
      })
      .first();

    console.log("selectedHtml", selectedHtml);

    if (targetP && targetP.length > 0) {
      const prevHeading = targetP.prevAll("div.mw-heading2").first();

      if (prevHeading.length) {
        const surroundingElements: string[] = [];
        let currentElement = prevHeading;

        while (currentElement.length) {
          if (currentElement.next().hasClass("mw-heading2")) {
            break;
          }

          let elementText = currentElement.text() || "";

          if (currentElement.is(targetP)) {
            elementText = elementText.replace(
              selectedHtml.trim(),
              `<target>${selectedHtml.trim()}</target>`
            );
          }

          surroundingElements.push(elementText);
          currentElement = currentElement.next();
        }

        const surroundingHtml = surroundingElements.join("\n");
        console.log("surroundingHtml", surroundingHtml);

        set({
          selectedHtml,
          surroundingHtml,
        });
        return;
      }
    }
  },
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
        get().addToLogs({
          html: newHtml,
          action: apply ? "APPLY_EDIT" : "CANCEL_EDIT",
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
  addToLogs: ({
    html,
    action,
    editedHtml,
    originalHtml,
  }: {
    html: string;
    action: string;
    editedHtml?: string;
    originalHtml?: string;
  }) => {
    set((state) => {
      const $ = cheerio.load(html);
      return {
        contentLogs: [
          ...state.contentLogs,
          {
            textContent: $(
              "p.edit-paragraph.wiki-paragraph:not(.empty-paragraph)"
            )
              .map((_, elem) => $(elem).text().trim())
              .get()
              .join("\n"),
            action,
            timestamp: Date.now(),
            editedHtml,
            originalHtml,
          },
        ],
      };
    });
  },
  undo: () => {
    set((state) => {
      if (state.currentHistoryIndex > 0) {
        const newIndex = state.currentHistoryIndex - 1;
        const newHtml = state.contentHistory[newIndex].html;
        get().addToLogs({ html: newHtml, action: "UNDO" });
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
        get().addToLogs({ html: newHtml, action: "REDO" });
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
  emptyContentLogs: () => {
    set({
      contentLogs: [],
      currentHistoryIndex: -1,
      contentHistory: [],
      contentHtml: "",
    });
  },
}));

export default useEditorStore;
