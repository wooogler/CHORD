"use client";

import {
  editArticleAsPillar,
  editArticleWithEditingAgent,
  editArticleWithUserInputAndPillars,
  editArticleWithUserInputOnly,
  getFeedbackFromAgent,
} from "@/lib/llm";
import React, { useEffect, useRef, useState } from "react";
import htmldiff from "node-htmldiff";
import MessageBubble from "./message-bubble";
import { cleanDiffHtml } from "@/lib/utils";
import agentProfiles from "@/lib/agentProfiles";
export type MessageRole = "user" | "assistant" | "representative" | "agent";
export type Message = {
  role: MessageRole;
  content: string;
  originalContentHtml?: string;
  editedContentHtml?: string;
  agentName?: string;
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
  const [isPaused, setIsPaused] = useState(false);
  const [editedHtml, setEditedHtml] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isPaused) return;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      (lastMessage.role === "user" || lastMessage.role === "agent")
    ) {
      const currentSessionId = sessionIdRef.current;
      getAgentFeedbacks(currentSessionId, editedHtml);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sessionIdRef = useRef(0);
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  const handlePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleSubmit = async () => {
    if (!userInput) return;

    setIsLoading(true);

    if (condition === "prompt") {
      try {
        // Show spinner
        const highlightedSpan = document.querySelector(".highlight-yellow");
        if (highlightedSpan) {
          const spinner = highlightedSpan.querySelector(".spinner");
          if (spinner) spinner.classList.remove("hidden");
        }

        const response = await editArticleWithUserInputAndPillars({
          articleHtml: selectedHtml,
          userInput: userInput,
        });

        setContentHtml((prevContentHtml: string) => {
          // Create a temporary DOM element
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = prevContentHtml;

          // Find the span element with the highlight-yellow class
          const highlightedSpan = tempDiv.querySelector(
            "span.highlight-yellow"
          );

          if (highlightedSpan) {
            // Create a new span element
            const newSpan = document.createElement("span");
            newSpan.className = "highlight-green";
            if (response.feedback) {
              newSpan.innerHTML = response.editedHtml || "";
            } else {
              newSpan.innerHTML = prevContentHtml;
            }

            // Replace the existing element with the new one
            highlightedSpan.parentNode?.replaceChild(newSpan, highlightedSpan);

            // Return the modified HTML
            return tempDiv.innerHTML;
          }

          // If no matching element is found, return the original content
          return prevContentHtml;
        });

        setMessages([
          ...messages,
          { role: "user", content: userInput },
          {
            role: "assistant",
            content: response.feedback || "No feedback provided",
            originalContentHtml: selectedHtml,
            editedContentHtml: response.editedHtml,
          },
        ]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        setSelectedHtml("");
        setUserInput("");
      }
    } else if (condition === "chord") {
      setIsLoading(true);
      sessionIdRef.current += 1;
      const currentSessionId = sessionIdRef.current;
      const userMessage: Message = {
        role: "user",
        content: userInput,
      };
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, userMessage];
        messagesRef.current = newMessages;
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
          messagesRef.current = newMessages;
          return newMessages;
        });

        const editedHtml = cleanDiffHtml(
          htmldiff(selectedHtml, editingResponse.editedHtml)
        );

        setEditedHtml(editedHtml);

        getAgentFeedbacks(currentSessionId, editedHtml);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        setUserInput("");
      }
    }
  };

  const getAgentFeedbacks = async (
    currentSessionId: number,
    editedHtml: string
  ) => {
    const agents = agentProfiles;
    const agentPromises = agents.map(async (agentProfile) => {
      if (sessionIdRef.current !== currentSessionId) return null;

      const { agentName, task, personality } = agentProfile;
      const chatHistory = messagesRef.current;

      try {
        const agentResponse = await getFeedbackFromAgent(
          editedHtml,
          task,
          personality,
          chatHistory
        );

        if (sessionIdRef.current !== currentSessionId) return null;

        return {
          agentName,
          content: agentResponse || "",
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error(error);
      }
    });

    const agentResponses = await Promise.all(agentPromises);

    if (sessionIdRef.current !== currentSessionId) {
      return;
    }

    const validResponses = agentResponses.filter((res) => res !== null);

    if (validResponses.length === 0) {
      setIsLoading(false);
      return;
    }

    const longestResponse = validResponses.reduce((longest, current) => {
      if (!current) return longest;
      return longest && longest.content.length > current.content.length
        ? longest
        : current;
    }, validResponses[0]);

    const delay = (longestResponse?.content.length || 0) * 100;
    console.log("delay: ", delay);
    await new Promise((resolve) => setTimeout(resolve, delay));

    const agentMessage: Message = {
      role: "agent",
      agentName: longestResponse?.agentName || "Unknown Agent",
      content: longestResponse?.content || "",
    };

    setMessages((prevMessages) => {
      const newMessages = [...prevMessages, agentMessage];
      messagesRef.current = newMessages;
      return newMessages;
    });

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className="flex flex-col flex-1 p-4 overflow-y-auto min-h-0"
        ref={messagesEndRef}
      >
        <div className="flex flex-col space-y-2">
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              prevRole={messages[index - 1]?.role}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col p-4">
        <textarea
          className="w-full h-32 p-2 border rounded mb-4"
          placeholder="Write your prompt here..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.code === "Enter") {
              handleSubmit();
              e.preventDefault();
            }
          }}
          disabled={isLoading}
        />
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center flex-1 h-10"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
            ) : (
              "Submit"
            )}
          </button>
          <button
            onClick={handlePause}
            className="ml-2 bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 h-10"
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>
    </div>
  );
}
