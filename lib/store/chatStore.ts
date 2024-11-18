import { create } from "zustand";

export type MessageRole = "user" | "assistant" | "representative" | "agent";
export type ApplyStatus = "applied" | "cancelled" | "deferred" | null;
export type Message = {
  role: MessageRole;
  content: string;
  originalContentHtml?: string;
  editedContentHtml?: string;
  agentName?: string;
  activeAgent?: string | null;
  reactions?: {
    agentName: string;
    emoji: string;
  }[];
  applyStatus?: ApplyStatus;
  move?: "left" | "right";
  createdAt: number;
};

interface ChatState {
  messages: Message[];
  activeAgent: string | null;
  isLoading: boolean;
  phase: "prompt" | "editing" | "conversation";
  setMessages: (messages: Message[]) => void;
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
  addReactionToMessage: ({
    messageCreatedAt,
    agentName,
    emoji,
  }: {
    messageCreatedAt: number;
    agentName: string;
    emoji: string;
  }) => void;
  removeMessagesAfter: ({
    messageCreatedAt,
  }: {
    messageCreatedAt: number;
  }) => void;
  setIsLoading: (isLoading: boolean) => void;
  setPhase: (phase: "prompt" | "editing" | "conversation") => void;
}

const useChatStore = create<ChatState>((set) => ({
  messages: [],
  activeAgent: null,
  isLoading: false,
  phase: "prompt",
  setMessages: (messages) => set({ messages }),
  addUserMessage: (userMessage) =>
    set((state) => ({
      messages: [...state.messages, userMessage],
    })),
  addAssistantMessage: (assistantMessage) =>
    set((state) => ({
      messages: [...state.messages, assistantMessage],
    })),
  changeLastMessageMove: (move: "left" | "right") =>
    set((state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      return {
        messages: [...state.messages.slice(0, -1), { ...lastMessage, move }],
      };
    }),
  changeMessageApplyStatus: ({
    messageCreatedAt,
    applyStatus,
  }: {
    messageCreatedAt: number;
    applyStatus: ApplyStatus;
  }) =>
    set((state) => {
      const message = state.messages.find(
        (m) => m.createdAt === messageCreatedAt
      );
      if (message) {
        message.applyStatus = applyStatus;
      }
      return { messages: state.messages };
    }),
  addReactionToMessage: ({
    messageCreatedAt,
    agentName,
    emoji,
  }: {
    messageCreatedAt: number;
    agentName: string;
    emoji: string;
  }) =>
    set((state) => {
      const message = state.messages.find(
        (m) => m.createdAt === messageCreatedAt
      );
      if (message) {
        message.reactions = [
          ...(message.reactions || []),
          { agentName, emoji },
        ];
      }
      return { messages: state.messages };
    }),
  removeMessagesAfter: ({ messageCreatedAt }: { messageCreatedAt: number }) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.createdAt <= messageCreatedAt),
    })),
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setPhase: (phase) => set({ phase }),
}));

export default useChatStore;
