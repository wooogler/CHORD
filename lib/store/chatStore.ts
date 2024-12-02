import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type MessageRole = "user" | "assistant" | "representative" | "agent";
export type ApplyStatus = "applied" | "cancelled" | "deferred" | null;

type Reaction = {
  agentName: string;
  emoji: string;
};
export type Message = {
  role: MessageRole;
  content: string;
  originalContentHtml?: string;
  editedContentHtml?: string;
  agentName?: string;
  activeAgent?: string | null;
  reactions?: Reaction[];
  applyStatus?: ApplyStatus;
  move?: "left" | "right";
  createdAt: number;
  removedAt?: number;
};

interface ChatState {
  messages: Message[];
  messageLogs: Message[];
  activeAgent: string | null;
  isLoading: boolean;
  phase: "prompt" | "editing" | "conversation";
  emptyChatStore: () => void;
  addUserMessage: (userMessage: Message) => void;
  addAssistantMessage: (assistantMessage: Message) => void;
  setActiveAgent: (agent: string | null) => void;
  changeLastMessageMove: (move: "left" | "right") => void;
  changeMessageApplyStatus: ({
    messageCreatedAt,
    applyStatus,
  }: {
    messageCreatedAt: number;
    applyStatus: ApplyStatus;
  }) => void;
  addReactionsToMessage: ({
    messageCreatedAt,
    reactions,
  }: {
    messageCreatedAt: number;
    reactions: Reaction[];
  }) => void;
  removeMessagesAfter: ({
    messageCreatedAt,
  }: {
    messageCreatedAt: number;
  }) => void;
  setIsLoading: (isLoading: boolean) => void;
  setPhase: (phase: "prompt" | "editing" | "conversation") => void;
  getMessageLogs: () => Message[];
}

const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      messageLogs: [],
      activeAgent: null,
      isLoading: false,
      phase: "prompt",
      emptyChatStore: () => set({ messages: [], messageLogs: [] }),
      addUserMessage: (userMessage) =>
        set((state) => ({
          messages: [...state.messages, userMessage],
          messageLogs: [...state.messageLogs, userMessage],
        })),
      addAssistantMessage: (assistantMessage) =>
        set((state) => ({
          messages: [...state.messages, assistantMessage],
          messageLogs: [...state.messageLogs, assistantMessage],
        })),
      changeLastMessageMove: (move: "left" | "right") =>
        set((state) => {
          const lastMessage = state.messages[state.messages.length - 1];
          const updatedMessage = { ...lastMessage, move };
          return {
            messages: [...state.messages.slice(0, -1), updatedMessage],
            messageLogs: state.messageLogs.map((msg) =>
              msg.createdAt === lastMessage.createdAt ? updatedMessage : msg
            ),
          };
        }),
      changeMessageApplyStatus: ({ messageCreatedAt, applyStatus }) =>
        set((state) => {
          const updatedMessages = state.messages.map((msg) =>
            msg.createdAt === messageCreatedAt ? { ...msg, applyStatus } : msg
          );
          const updatedLogs = state.messageLogs.map((msg) =>
            msg.createdAt === messageCreatedAt ? { ...msg, applyStatus } : msg
          );
          return {
            messages: updatedMessages,
            messageLogs: updatedLogs,
          };
        }),
      removeMessagesAfter: ({ messageCreatedAt }) =>
        set((state) => {
          const removedAt = Date.now();
          const updatedLogs = state.messageLogs.map((msg) =>
            msg.createdAt > messageCreatedAt ? { ...msg, removedAt } : msg
          );
          return {
            messages: state.messages.filter(
              (m) => m.createdAt <= messageCreatedAt
            ),
            messageLogs: updatedLogs,
          };
        }),
      addReactionsToMessage: ({ messageCreatedAt, reactions }) =>
        set((state) => {
          const updatedMessages = state.messages.map((msg) => {
            if (msg.createdAt === messageCreatedAt) {
              return {
                ...msg,
                reactions: [...(msg.reactions || []), ...reactions],
              };
            }
            return msg;
          });

          const updatedLogs = state.messageLogs.map((msg) => {
            if (msg.createdAt === messageCreatedAt) {
              return {
                ...msg,
                reactions: [...(msg.reactions || []), ...reactions],
              };
            }
            return msg;
          });

          return {
            messages: updatedMessages,
            messageLogs: updatedLogs,
          };
        }),
      setActiveAgent: (agent) => set({ activeAgent: agent }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setPhase: (phase) => set({ phase }),
      getMessageLogs: () => get().messageLogs,
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        messages: state.messages,
        messageLogs: state.messageLogs,
        activeAgent: state.activeAgent,
        phase: state.phase,
      }),
    }
  )
);

export default useChatStore;
