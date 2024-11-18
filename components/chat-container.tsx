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
import useEditorStore from "@/lib/store/editorStore";
import useChatStore, { Message, MessageRole } from "@/lib/store/chatStore";

export default function ChatContainer({
  condition,
}: {
  condition: "prompt" | "chord";
}) {
  const messages = useChatStore((state) => state.messages);
  const activeAgent = useChatStore((state) => state.activeAgent);
  const {
    setIsLoading,
    setPhase,
    addUserMessage,
    addAssistantMessage,
    changeLastMessageMove,
    addReactionToMessage,
    setActiveAgent,
  } = useChatStore();
  const [editedHtml, setEditedHtml] = useState("");
  const [cleanedEditedHtml, setCleanedEditedHtml] = useState("");
  const [userInput, setUserInput] = useState("");

  const { setIsLocked } = useEditorStore();

  const selectedHtml = useEditorStore((state) => state.selectedHtml);

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

    addUserMessage({
      role: "user",
      content: userInput,
      createdAt: Date.now(),
    });

    setUserInput("");

    try {
      console.log("selectedHtml", selectedHtml);
      console.log("userInput", userInput);

      const response = await editArticleWithUserInputOnly({
        articleHtml: selectedHtml,
        userInput: userInput,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.feedback || "No feedback provided",
        originalContentHtml: selectedHtml,
        editedContentHtml: response.editedHtml,
        createdAt: Date.now(),
      };

      addAssistantMessage(assistantMessage);

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

    addUserMessage({
      role: "user",
      content: userInput,
      createdAt: Date.now(),
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
        createdAt: Date.now(),
      };

      addAssistantMessage(representativeMessage);
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
          createdAt: Date.now(),
        };

        addAssistantMessage(agentMessage);
        getReactionsToMessage(
          editedHtml,
          agentResponse ?? "",
          agentMessage.createdAt,
          agentName
        );
      } catch (error) {
        console.error(error);
      }
    });

    await Promise.all(agentPromises);
    setIsLoading(false);
  };

  const handleSubmitReply = async () => {
    setUserInput("");

    const latestMessageFromActiveAgent = messages.findLast(
      (message) => message.agentName === activeAgent
    );

    if (
      latestMessageFromActiveAgent &&
      !latestMessageFromActiveAgent.activeAgent
    ) {
      const newAgentMessage = {
        activeAgent: activeAgent,
        ...latestMessageFromActiveAgent,
      };
      addAssistantMessage(newAgentMessage);
    }

    const userMessage: Message = {
      role: "user",
      content: userInput,
      activeAgent: activeAgent,
      createdAt: Date.now(),
    };
    addUserMessage(userMessage);

    setIsLoading(true);

    const agentProfile = agentProfiles.find(
      (agent) => agent.agentName === activeAgent
    );
    try {
      const latestMessagesWithActiveAgent = messages.reduceRight(
        (acc: Message[], curr) => {
          if (
            acc.length === 0 &&
            (curr.agentName === activeAgent || curr.activeAgent === activeAgent)
          ) {
            return [curr];
          }
          if (
            acc.length > 0 &&
            (curr.agentName === activeAgent || curr.activeAgent === activeAgent)
          ) {
            return [curr, ...acc];
          }
          if (acc.length > 0) {
            return acc;
          }
          return [];
        },
        []
      );
      console.log(
        "latestMessagesWithActiveAgent",
        latestMessagesWithActiveAgent
      );

      const response = await getFeedbackFromAgent({
        editedHtml: cleanedEditedHtml,
        task: agentProfile?.task || "",
        personality: agentProfile?.personality || "",
        chatHistory: latestMessagesWithActiveAgent,
        isMultiAgentChat: false,
      });

      const agentMessage: Message = {
        role: "agent" as MessageRole,
        agentName: activeAgent || "Agent",
        content: response || "",
        activeAgent: activeAgent,
        createdAt: Date.now(),
      };
      addAssistantMessage(agentMessage);
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
      createdAt: Date.now(),
    };

    addAssistantMessage(representativeMessage);

    const cleanedEditedHtml = cleanDiffHtml(
      htmldiff(selectedHtml, editingResponse.editedHtml)
    );

    setCleanedEditedHtml(cleanedEditedHtml);

    setEditedHtml(editingResponse.editedHtml);
  };

  const handleAskAgain = () => {
    changeLastMessageMove("left");
    setPhase("editing");
    getFeedbackFromAgents(cleanedEditedHtml);
  };

  const getReactionsToMessage = async (
    editedHtml: string,
    message: string,
    messageCreatedAt: number,
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

          addReactionToMessage({
            messageCreatedAt,
            agentName,
            emoji: agentResponse ?? "X",
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
                  isLastEditMessage={message === lastEditMessage}
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
          handleSubmitPrompt={handleSubmitPrompt}
          isTextSelected={!!selectedHtml}
        />
      ) : (
        <ChordInput
          userInput={userInput}
          setUserInput={setUserInput}
          handleSubmitReply={handleSubmitReply}
          handleSubmitSuggestion={handleSubmitSuggestion}
          handleEditWithActiveAgent={handleEditWithActiveAgent}
          isTextSelected={!!selectedHtml}
        />
      )}
    </div>
  );
}
