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
export type MessageRole = "user" | "assistant" | "representative" | "agent";
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
};

export default function ChatContainer({
  selectedHtml,
  setSelectedHtml,
  setContentHtml,
  condition,
}: {
  selectedHtml: string;
  setSelectedHtml: React.Dispatch<React.SetStateAction<string>>;
  setContentHtml: React.Dispatch<React.SetStateAction<string>>;
  condition: "prompt" | "chord";
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editedHtml, setEditedHtml] = useState("");
  const [cleanedEditedHtml, setCleanedEditedHtml] = useState("");
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

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

    setMessages((prevMessages) => {
      const newMessages = [
        ...prevMessages,
        { role: "user" as MessageRole, content: userInput },
      ];
      return newMessages;
    });

    try {
      // Show spinner
      const highlightedSpan = document.querySelector(".highlight-yellow");
      if (highlightedSpan) {
        const spinner = highlightedSpan.querySelector(".spinner");
        if (spinner) spinner.classList.remove("hidden");
      }

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
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setSelectedHtml("");
      setUserInput("");
    }
  };

  const handleSubmitSuggestion = async () => {
    if (!userInput) return;

    setIsLoading(true);
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

      getFirstFeedbackFromAgents(cleanedEditedHtml);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setUserInput("");
    }
  };

  const getFirstFeedbackFromAgents = async (editedHtml: string) => {
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
    };

    setMessages((prevMessages) => {
      const newMessages = [...prevMessages, representativeMessage];
      return newMessages;
    });

    const newEditedHtml = cleanDiffHtml(
      htmldiff(selectedHtml, editingResponse.editedHtml)
    );

    setEditedHtml(newEditedHtml);
  };

  const getReactionsToMessage = async (
    editedHtml: string,
    message: string,
    messageIndex: number,
    originalAgent: string
  ) => {
    const agents = agentProfiles;

    // 모든 에이전트에게 동시에 요청
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
                  prevRole={messages[index - 1]?.role}
                  setActiveAgent={setActiveAgent}
                  activeAgent={activeAgent}
                  setContentHtml={setContentHtml}
                  isLastEditMessage={message === lastEditMessage}
                />
              </div>
            );
          })}
        </div>
      </div>

      {condition === "prompt" ? (
        <div className={`flex flex-col p-4 `}>
          <textarea
            className="w-full h-32 p-2 border rounded mb-4"
            placeholder="Write your prompt here..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.code === "Enter") {
                handleSubmitPrompt();
                e.preventDefault();
              }
            }}
            disabled={isLoading}
          />
          <div className={`flex items-center space-x-2`}>
            <button
              onClick={handleSubmitPrompt}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center flex-1 h-10"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`flex flex-col p-4 rounded-lg ${
            activeAgent ? `bg-${mapStrToColor(activeAgent)}-200` : ""
          }`}
        >
          <textarea
            className="w-full h-32 p-2 border rounded mb-4"
            placeholder="Write your suggestion here..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.code === "Enter") {
                if (activeAgent) {
                  handleSubmitReply();
                } else {
                  handleSubmitSuggestion();
                }
                e.preventDefault();
              }
            }}
            disabled={isLoading}
          />

          {activeAgent ? (
            <div className={`flex items-center space-x-2`}>
              <button
                onClick={handleSubmitReply}
                className={`text-white px-4 py-2 rounded flex font-bold items-center justify-center flex-1 h-10 bg-${mapStrToColor(
                  activeAgent
                )}-600`}
              >
                {isLoading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                ) : (
                  `Reply to ${activeAgent}`
                )}
              </button>
              {activeAgent !== null ? (
                <button
                  className="text-white px-4 py-2 rounded bg-red-600 font-bold w-20"
                  onClick={() => setActiveAgent(null)}
                >
                  Cancel
                </button>
              ) : (
                <button
                  className="text-white px-4 py-2 rounded bg-blue-600 font-bold w-20"
                  onClick={handleEditWithActiveAgent}
                >
                  Edit
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleSubmitSuggestion}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center flex-1 h-10"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
              ) : (
                "Submit"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
