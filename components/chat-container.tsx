"use client";

import { editArticleWithPrompt } from "@/lib/llm";
import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./message-bubble";

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

        const response = await editArticleWithPrompt({
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
            if (response.edit) {
              newSpan.innerHTML = response.text || "";
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
            content: "Response",
            originalContentHtml: selectedHtml,
            editedContentHtml: response.text,
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
      try {
        setMessages([
          ...messages,
          { role: "user", content: userInput },
          { role: "representative", content: "chord messages 111" },
          {
            role: "agent",
            content: "agent message 1",
            agentName: "Agent 1",
          },
          {
            role: "agent",
            content: "agent message 2",
            agentName: "Agent 2",
          },
          { role: "representative", content: "chord messages 222" },
        ]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        setUserInput("");
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-col flex-1 p-4 overflow-y-auto min-h-0">
        <div className="flex flex-col space-y-2">
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              prevRole={messages[index - 1]?.role}
            />
          ))}
          <div ref={messagesEndRef} />
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
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
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
  );
}
