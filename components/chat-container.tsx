"use client";

import {
  editArticleWithContext,
  editArticleWithConversation,
  editArticleWithUserInputOnly,
  getFeedbackFromAgent,
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
  articleTalk,
}: {
  condition: "prompt" | "chord";
  articleTalk?: string;
}) {
  const messages = useChatStore((state) => state.messages);
  const activeAgent = useChatStore((state) => state.activeAgent);
  const rightPanel = useEditorStore((state) => state.rightPanel);
  const {
    setIsLoading,
    setPhase,
    addUserMessage,
    addAssistantMessage,
    changeLastMessageMove,
    setActiveAgent,
  } = useChatStore();
  const [editedHtml, setEditedHtml] = useState("");
  const setCleanedEditedHtml = useState("")[1];
  const [userInput, setUserInput] = useState("");

  const { setIsLocked } = useEditorStore();

  const selectedHtml = useEditorStore((state) => state.selectedHtml);
  const surroundingHtml = useEditorStore((state) => state.surroundingHtml);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (rightPanel === "chat" && messages.length === 0) {
      addAssistantMessage({
        role: "assistant",
        content:
          "Hello! I'm here to help you edit the article. Please select the paragraph to edit.",
        createdAt: Date.now(),
      });
    }
  }, [messages.length, rightPanel]);

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

      // const response = await editArticleWithUserInputOnly({
      //   articleHtml: selectedHtml || "",
      //   userInput: userInput,
      // });

      const response = await editArticleWithContext({
        articleHtml: selectedHtml || "",
        userInput: userInput,
        surroundingHtml: surroundingHtml || "",
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.feedback || "No feedback provided",
        originalContentHtml: selectedHtml || "",
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
        articleHtml: selectedHtml || "",
        userInput: userInput,
      });

      const representativeMessage: Message = {
        role: "representative",
        agentName: "The Liason",
        content: editingResponse.feedback,
        originalContentHtml: selectedHtml || "",
        editedContentHtml: editingResponse.editedHtml,
        move: "left",
        createdAt: Date.now(),
      };

      addAssistantMessage(representativeMessage);
      setPhase("editing");

      const cleanedEditedHtml = cleanDiffHtml(
        htmldiff(selectedHtml || "", editingResponse.editedHtml || "")
      );

      setCleanedEditedHtml(cleanedEditedHtml);

      setEditedHtml(editingResponse.editedHtml);

      getFeedbackFromAgents(
        selectedHtml || "",
        editingResponse.editedHtml || ""
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFeedbackFromAgents = async (prevHtml: string, postHtml: string) => {
    const agents = agentProfiles;

    const agentPromises = agents.map(async (agentProfile) => {
      const { agentName, personality } = agentProfile;
      let task = agentProfile.task;

      if (
        agentName === "Community Liason" &&
        (articleTalk === null ||
          articleTalk === undefined ||
          articleTalk === "")
      ) {
        return;
      } else if (
        agentName === "Community Liason" &&
        articleTalk !== null &&
        articleTalk !== undefined &&
        articleTalk !== ""
      ) {
        task = task + articleTalk;
      }

      try {
        const agentResponse = await getFeedbackFromAgent(
          prevHtml,
          postHtml,
          task,
          personality,
          undefined,
          true
        );

        const agentMessage: Message = {
          role: "agent",
          agentName: agentName,
          content: agentResponse || "",
          createdAt: Date.now(),
        };

        addAssistantMessage(agentMessage);
        // getReactionsToMessage(
        //   prevHtml,
        //   postHtml,
        //   agentResponse ?? "",
        //   agentMessage.createdAt,
        //   agentName
        // );
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

    const currentMessages = useChatStore.getState().messages;

    const agentProfile = agentProfiles.find(
      (agent) => agent.agentName === activeAgent
    );
    try {
      const latestMessagesWithActiveAgent = currentMessages.reduceRight(
        (acc: Message[], curr) => {
          if (
            (acc.length === 0 &&
              curr.agentName === activeAgent &&
              curr.activeAgent === activeAgent) ||
            (curr.role === "user" && curr.activeAgent === activeAgent)
          ) {
            return [curr];
          }
          if (
            (acc.length > 0 &&
              curr.agentName === activeAgent &&
              curr.activeAgent === activeAgent) ||
            (curr.role === "user" && curr.activeAgent === activeAgent)
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

      let task = agentProfile?.task || "";

      if (
        agentProfile?.agentName === "Community Liason" &&
        (articleTalk === null ||
          articleTalk === undefined ||
          articleTalk === "")
      ) {
        return;
      } else if (
        agentProfile?.agentName === "Community Liason" &&
        articleTalk !== null &&
        articleTalk !== undefined &&
        articleTalk !== ""
      ) {
        task = task + articleTalk;
      }

      const response = await getFeedbackFromAgent(
        selectedHtml || "",
        editedHtml,
        task,
        agentProfile?.personality || "",
        latestMessagesWithActiveAgent,
        false
      );

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
      surroundingHtml: surroundingHtml || "",
      conversation: latestMessagesWithActiveAgent,
    });

    const representativeMessage: Message = {
      role: "representative",
      agentName: "The Liason",
      content: editingResponse.feedback,
      originalContentHtml: selectedHtml || "",
      editedContentHtml: editingResponse.editedHtml,
      move: "right",
      createdAt: Date.now(),
    };

    addAssistantMessage(representativeMessage);

    const cleanedEditedHtml = cleanDiffHtml(
      htmldiff(selectedHtml || "", editingResponse.editedHtml || "")
    );

    setCleanedEditedHtml(cleanedEditedHtml);

    setEditedHtml(editingResponse.editedHtml);
  };

  const handleAskAgain = () => {
    changeLastMessageMove("left");
    setPhase("editing");
    getFeedbackFromAgents(selectedHtml || "", editedHtml);
  };

  // const getReactionsToMessage = async (
  //   prevHtml: string,
  //   postHtml: string,
  //   message: string,
  //   messageCreatedAt: number,
  //   originalAgent: string
  // ) => {
  //   const agents = agentProfiles;
  //   const reactions: { agentName: string; emoji: string }[] = [];

  //   const agentPromises = agents.map(async (agentProfile) => {
  //     const { agentName, task, personality } = agentProfile;

  //     if (
  //       agentProfile?.agentName === "Community Liason" &&
  //       (articleTalk === null ||
  //         articleTalk === undefined ||
  //         articleTalk === "")
  //     ) {
  //       return;
  //     }

  //     if (agentName !== originalAgent) {
  //       try {
  //         const agentResponse = await getReactionFromAgent(
  //           prevHtml,
  //           postHtml,
  //           task,
  //           personality,
  //           message
  //         );

  //         reactions.push({
  //           agentName,
  //           emoji: agentResponse ?? "X",
  //         });
  //       } catch (error) {
  //         console.error(error);
  //       }
  //     }
  //   });

  //   // 모든 응답이 완료될 때까지 기다림
  //   await Promise.all(agentPromises);

  //   // 모든 반응을 한 번에 추가
  //   if (reactions.length > 0) {
  //     addReactionsToMessage({
  //       messageCreatedAt,
  //       reactions,
  //     });
  //   }

  //   setIsLoading(false);
  // };

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
