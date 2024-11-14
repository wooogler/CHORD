"use client";

import {
  editArticleWithConversation,
  editArticleWithUserInputOnly,
  getFeedbackFromAgent,
  getReactionFromAgent,
} from "@/lib/llm";
import React, { useEffect, useRef, useState } from "react";
import htmldiff from "node-htmldiff";
import MessageBubble from "./message-bubble";
import { cleanDiffHtml, mapStrToColor } from "@/lib/utils";
import agentProfiles from "@/lib/agentProfiles";
import PromptInput from "./prompt-input";
import ChordInput from "./chord-input";

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
};

export default function ChatContainer({
  selectedHtml,
  setSelectedHtml,
  setContentHtml,
  condition,
  setIsLocked,
}: {
  selectedHtml: string;
  setSelectedHtml: React.Dispatch<React.SetStateAction<string>>;
  setContentHtml: React.Dispatch<React.SetStateAction<string>>;
  condition: "prompt" | "chord";
  setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editedHtml, setEditedHtml] = useState("");
  const [cleanedEditedHtml, setCleanedEditedHtml] = useState("");
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [phase, setPhase] = useState<"prompt" | "editing" | "conversation">(
    "prompt"
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmitPrompt = async () => {
    if (!userInput) return;

    setIsLoading(true);
    setIsLocked(true);

    setMessages((prevMessages) => {
      const newMessages = [
        ...prevMessages,
        { role: "user" as MessageRole, content: userInput },
      ];
      return newMessages;
    });

    setUserInput("");

    try {
      const response = await editArticleWithUserInputOnly({
        articleHtml: selectedHtml,
        userInput: userInput,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.feedback || "No feedback provided",
        originalContentHtml: selectedHtml,
        editedContentHtml: response.editedHtml,
      };

      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, assistantMessage];
        return newMessages;
      });

      setPhase("editing");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitSuggestion = async () => {
    if (!userInput) return;

    setIsLoading(true);
    setIsLocked(true);

    const userMessage: Message = {
      role: "user",
      content: userInput,
    };
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages, userMessage];
      return newMessages;
    });

    setUserInput("");

    try {
      const editingResponse = await editArticleWithUserInputOnly({
        articleHtml: selectedHtml,
        userInput: userInput,
      });

      const representativeMessage: Message = {
        role: "representative",
        agentName: "The Liason",
        content: editingResponse.feedback,
        originalContentHtml: selectedHtml,
        editedContentHtml: editingResponse.editedHtml,
        move: "left",
      };

      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, representativeMessage];
        return newMessages;
      });
      setPhase("editing");

      const cleanedEditedHtml = cleanDiffHtml(
        htmldiff(selectedHtml, editingResponse.editedHtml)
      );

      setCleanedEditedHtml(cleanedEditedHtml);

      setEditedHtml(editingResponse.editedHtml);

      getFeedbackFromAgents(cleanedEditedHtml);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFeedbackFromAgents = async (editedHtml: string) => {
    const agents = agentProfiles;

    const agentPromises = agents.map(async (agentProfile) => {
      const { agentName, task, personality } = agentProfile;

      try {
        const agentResponse = await getFeedbackFromAgent({
          editedHtml,
          task,
          personality,
          isMultiAgentChat: true,
        });

        const agentMessage: Message = {
          role: "agent",
          agentName: agentName,
          content: agentResponse || "",
        };

        setMessages((prevMessages) => {
          const newMessages = [...prevMessages, agentMessage];
          getReactionsToMessage(
            editedHtml,
            agentResponse ?? "",
            newMessages.length - 1,
            agentName
          );
          return newMessages;
        });
      } catch (error) {
        console.error(error);
      }
    });

    await Promise.all(agentPromises);
    setIsLoading(false);
  };

  const handleSubmitReply = async () => {
    setUserInput("");

    const updatedMessages = [...messages];

    const latestMessageFromActiveAgent = messages.findLast(
      (message) => message.agentName === activeAgent
    );
    console.log("latestMessageFromActiveAgent", latestMessageFromActiveAgent);

    if (
      latestMessageFromActiveAgent &&
      !latestMessageFromActiveAgent.activeAgent
    ) {
      const newAgentMessage = {
        activeAgent: activeAgent,
        ...latestMessageFromActiveAgent,
      };
      updatedMessages.push(newAgentMessage);
    }

    const userMessage: Message = {
      role: "user",
      content: userInput,
      activeAgent: activeAgent,
    };
    updatedMessages.push(userMessage);

    setMessages(updatedMessages);

    setIsLoading(true);

    const agentProfile = agentProfiles.find(
      (agent) => agent.agentName === activeAgent
    );
    try {
      const latestMessagesWithActiveAgent = updatedMessages.reduceRight(
        (acc: Message[], curr) => {
          if (acc.length === 0 && curr.activeAgent === activeAgent) {
            return [curr];
          }
          if (acc.length > 0 && curr.activeAgent === activeAgent) {
            return [curr, ...acc];
          }
          if (acc.length > 0) {
            return acc;
          }
          return [];
        },
        []
      );

      const response = await getFeedbackFromAgent({
        editedHtml: cleanedEditedHtml,
        task: agentProfile?.task || "",
        personality: agentProfile?.personality || "",
        chatHistory: latestMessagesWithActiveAgent,
        isMultiAgentChat: false,
      });
      setMessages((prevMessages) => {
        const newMessages = [
          ...prevMessages,
          {
            role: "agent" as MessageRole,
            agentName: activeAgent || "Agent",
            content: response || "",
            activeAgent: activeAgent,
          },
        ];
        return newMessages;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditWithActiveAgent = async () => {
    setActiveAgent(null);
    const latestMessagesWithActiveAgent = messages.reduceRight(
      (acc: Message[], curr) => {
        if (acc.length === 0 && curr.activeAgent === activeAgent) {
          return [curr];
        }
        if (acc.length > 0 && curr.activeAgent === activeAgent) {
          return [curr, ...acc];
        }
        if (acc.length > 0) {
          return acc;
        }
        return [];
      },
      []
    );

    const editingResponse = await editArticleWithConversation({
      articleHtml: editedHtml,
      conversation: latestMessagesWithActiveAgent,
    });

    const representativeMessage: Message = {
      role: "representative",
      agentName: "The Liason",
      content: editingResponse.feedback,
      originalContentHtml: selectedHtml,
      editedContentHtml: editingResponse.editedHtml,
      move: "right",
    };

    setMessages((prevMessages) => {
      const newMessages = [...prevMessages, representativeMessage];
      return newMessages;
    });

    const cleanedEditedHtml = cleanDiffHtml(
      htmldiff(selectedHtml, editingResponse.editedHtml)
    );

    setCleanedEditedHtml(cleanedEditedHtml);

    setEditedHtml(editingResponse.editedHtml);
  };

  const handleAskAgain = () => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      return [...prevMessages.slice(0, -1), { ...lastMessage, move: "left" }];
    });
    setPhase("editing");
    getFeedbackFromAgents(cleanedEditedHtml);
  };

  const getReactionsToMessage = async (
    editedHtml: string,
    message: string,
    messageIndex: number,
    originalAgent: string
  ) => {
    const agents = agentProfiles;

    const agentPromises = agents.map(async (agentProfile) => {
      const { agentName, task, personality } = agentProfile;

      if (agentName !== originalAgent) {
        try {
          const agentResponse = await getReactionFromAgent(
            editedHtml,
            task,
            personality,
            message
          );

          console.log(agentResponse);

          setMessages((prevMessages) => {
            if (prevMessages[messageIndex].reactions) {
              prevMessages[messageIndex].reactions.push({
                agentName: agentName,
                emoji: agentResponse ?? "X",
              });
            } else {
              prevMessages[messageIndex].reactions = [
                { agentName: agentName, emoji: agentResponse ?? "X" },
              ];
            }
            return [...prevMessages];
          });
        } catch (error) {
          console.error(error);
        }
      }
    });

    // 모든 응답이 완료될 때까지 기다림
    await Promise.all(agentPromises);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className="flex flex-col flex-1 p-4 overflow-y-auto min-h-0"
        ref={messagesEndRef}
      >
        <div className="flex flex-col">
          {messages.map((message, index) => {
            const editMessages = messages.filter(
              (msg) => msg.editedContentHtml
            );
            const lastEditMessage = editMessages[editMessages.length - 1];

            return (
              <div
                key={index}
                className={
                  message.activeAgent
                    ? `bg-${mapStrToColor(message.activeAgent)}-200 p-4`
                    : "mb-4"
                }
              >
                <MessageBubble
                  message={message}
                  setActiveAgent={setActiveAgent}
                  setMessages={setMessages}
                  activeAgent={activeAgent}
                  setContentHtml={setContentHtml}
                  isLastEditMessage={message === lastEditMessage}
                  setIsLocked={setIsLocked}
                  setSelectedHtml={setSelectedHtml}
                  setPhase={setPhase}
                  handleAskAgain={handleAskAgain}
                />
              </div>
            );
          })}
        </div>
      </div>

      {condition === "prompt" ? (
        <PromptInput
          userInput={userInput}
          setUserInput={setUserInput}
          isLoading={isLoading}
          handleSubmitPrompt={handleSubmitPrompt}
          isTextSelected={!!selectedHtml}
          phase={phase}
          messages={messages}
        />
      ) : (
        <ChordInput
          userInput={userInput}
          setUserInput={setUserInput}
          isLoading={isLoading}
          activeAgent={activeAgent}
          setActiveAgent={setActiveAgent}
          handleSubmitReply={handleSubmitReply}
          handleSubmitSuggestion={handleSubmitSuggestion}
          handleEditWithActiveAgent={handleEditWithActiveAgent}
          messages={messages}
          isTextSelected={!!selectedHtml}
          phase={phase}
        />
      )}
    </div>
  );
}
