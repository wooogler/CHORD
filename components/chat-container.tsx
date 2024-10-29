"use client";

import { editArticleAsPillar, editArticleWithEditingAgent, editArticleWithPrompt } from "@/lib/llm";
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
        //currently building with await so everything has to complete before displaying, but an async flow would likely be better with .then()'s
        const editingResponse = await editArticleWithEditingAgent({
          articleHtml: selectedHtml,
          userInput: userInput,
        });

        const agent1Response = editArticleAsPillar(
          selectedHtml,
          editingResponse,
          "Wikipedia is an encyclopedia. Wikipedia combines many features of general and specialized encyclopedias, almanacs, and gazetteers.Wikipedia is not a soapbox, an advertising platform, a social network, a vanity press, an experiment in anarchy or democracy, an indiscriminate collection of information, nor a web directory.It is not a dictionary, a newspaper, nor a collection of source documents, although some of its fellow Wikimedia projects are.",
          "You are the Ascended. You are above human struggles, and see everything as a simple collection of facts, which can be interpreted in different ways by different people. You answer from a higher plane of existance."
        )
        const agent2Response = editArticleAsPillar(
          selectedHtml,
          editingResponse,
          "Wikipedia is written from a neutral point of view. We strive for articles with an impartial tone that document and explain major points of view, giving due weight for their prominence.We avoid advocacy, and we characterize information and issues rather than debate them.In some areas there may be just one well - recognized point of view; in others we describe multiple points of view, presenting each accurately and in context rather than as 'the truth' or 'the best view'.All articles must strive for verifiable accuracy with citations based on reliable sources, especially when the topic is controversial or is about a living person.Editors' personal experiences, interpretations, or opinions do not belong on Wikipedia.",
          "You are the Bland. You are neutral on every topic, never having an opinion on anything. Your answers are as dry and bland as possible."
        )
        const agent3Response = editArticleAsPillar(
          selectedHtml,
          editingResponse,
          "Wikipedia is free content that anyone can use, edit, and distribute. All editors freely license their work to the public, and no editor owns an article - any contributions can and may be mercilessly edited and redistributed.Respect copyright laws and never plagiarize from any sources.Borrowing non - free media is sometimes allowed as fair use, but editors should strive to find free alternatives first.",
          "You are the People's Champion. You believe in Communism, that everything should belong to everyone. You push everyone to make everything free to everyone often. You are loud and rambuncious in spreading these beliefs."
        )
        const agent4Response = editArticleAsPillar(
          selectedHtml,
          editingResponse,
          "Wikipedia's editors should treat each other with respect and civility. Respect your fellow Wikipedians, even when you disagree.Apply Wikipedia etiquette, and do not engage in personal attacks or edit wars.Seek consensus, and never disrupt Wikipedia to illustrate a point.Act in good faith, and assume good faith on the part of others.Be open and welcoming to newcomers.Should conflicts arise, discuss them calmly on the appropriate talk pages, follow dispute resolution procedures, and consider that there are 6, 902, 328 other articles on the English Wikipedia to improve and discuss.",
          "You are the Peacemaker. You voice the necessity of peace in all things. You are a caring, motherly figure who sees editors as their children, urging them not to fight."
        )
        const agent5Response = editArticleAsPillar(
          selectedHtml,
          editingResponse,
          "Wikipedia has no firm rules. Wikipedia has policies and guidelines, but they are not carved in stone; their content and interpretation can evolve over time.The principles and spirit matter more than literal wording, and sometimes improving Wikipedia requires making exceptions.Be bold, but not reckless, in updating articles.And do not agonize over making mistakes: they can be corrected easily because(almost) every past version of each article is saved.",
          "You are chaos incarnite. You have radical beliefs that shift often. You make crazy suggestions that fit with your worldview, insisting that people push themselves beyond their limits"
        )

        const agentResponses = {
          agent1: await agent1Response,
          agent2: await agent2Response,
          agent3: await agent3Response,
          agent4: await agent4Response,
          agent5: await agent5Response,
        }

        const editingResponseFinal = await editArticleWithEditingAgent({
          articleHtml: selectedHtml,
          userInput: `Your originial edit was ${editingResponse}. The agents have responded with the following feedback ${JSON.stringify(agentResponses)}. Please update your edit taking these changes into account. `,
        });

        setMessages([
          ...messages,
          { role: "user", content: userInput },
          {
            role: "representative",
            content: "Response",
            originalContentHtml: selectedHtml,
            editedContentHtml: editingResponse,
          },
          {
            role: "agent",
            content: agentResponses.agent1,
            agentName: "The Ascended", //above everything, human desires do not affect them
          },
          {
            role: "agent",
            content: agentResponses.agent2,
            agentName: "The Bland", //boring, stays neutral on every topic 
          },
          {
            role: "agent",
            content: agentResponses.agent3,
            agentName: "The People's Champion", //everything for the people
          },
          {
            role: "agent",
            content: agentResponses.agent4,
            agentName: "The Peacemaker", //always preaches peace and civility
          },
          {
            role: "agent",
            content: agentResponses.agent5,
            agentName: "The Chaos", //breaks the rules when needed
          },
          {
            role: "representative", content: "Response",
            originalContentHtml: selectedHtml,
            editedContentHtml: editingResponseFinal,
          },
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
