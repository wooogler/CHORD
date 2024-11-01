"use client";

import {
  editArticleAsPillar,
  editArticleWithEditingAgent,
  editArticleWithUserInputAndPillars,
  editArticleWithUserInputOnly,
} from "@/lib/llm";
import React, { useEffect, useRef, useState } from "react";
import htmldiff from "node-htmldiff";
import MessageBubble from "./message-bubble";
import { cleanDiffHtml } from "@/lib/utils";

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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
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
      messages.push({ role: "user", content: userInput });
      setMessages([...messages]);

      try {
        const editingResponse = await editArticleWithUserInputOnly({
          articleHtml: selectedHtml,
          userInput: userInput,
        });

        messages.push({
          role: "representative",
          agentName: "The Liason",
          content: editingResponse.feedback,
          originalContentHtml: selectedHtml,
          editedContentHtml: editingResponse.editedHtml,
        });
        setMessages([...messages]);

        const editedHtml = cleanDiffHtml(
          htmldiff(selectedHtml, editingResponse.editedHtml)
        );

        const agentResponses: { [key: string]: string } = {};
        let responses = 0;

        editArticleAsPillar(
          selectedHtml,
          editingResponse.editedHtml,
          "Wikipedia is an encyclopedia. Wikipedia combines many features of general and specialized encyclopedias, almanacs, and gazetteers.Wikipedia is not a soapbox, an advertising platform, a social network, a vanity press, an experiment in anarchy or democracy, an indiscriminate collection of information, nor a web directory.It is not a dictionary, a newspaper, nor a collection of source documents, although some of its fellow Wikimedia projects are.",
          "You are the Ascended. You are above human struggles, and see everything as a simple collection of facts, which can be interpreted in different ways by different people. You answer from a higher plane of existance."
        ).then((data) => {
          messages.push({
            role: "agent",
            content: data,
            agentName: "The Ascended", //above everything, human desires do not affect them
          });
          setMessages([...messages]);

          agentResponses.agent1 = data;
          responses++;
          if (responses === 5) {
            responses = 0;
            editArticleWithEditingAgent({
              articleHtml: selectedHtml,
              userInput: `Your originial edit was ${editingResponse}. The agents have responded with the following feedback ${JSON.stringify(
                agentResponses
              )}. Please update your edit taking these changes into account. `,
            }).then((data) => {
              messages.push({
                role: "representative",
                agentName: "The Liason",
                content: data.explaination,
                originalContentHtml: selectedHtml,
                editedContentHtml: data.response,
              });
              setMessages([...messages]);
            });
          }
        });

        editArticleAsPillar(
          selectedHtml,
          editingResponse.feedback,
          "Wikipedia is written from a neutral point of view. We strive for articles with an impartial tone that document and explain major points of view, giving due weight for their prominence.We avoid advocacy, and we characterize information and issues rather than debate them.In some areas there may be just one well - recognized point of view; in others we describe multiple points of view, presenting each accurately and in context rather than as 'the truth' or 'the best view'.All articles must strive for verifiable accuracy with citations based on reliable sources, especially when the topic is controversial or is about a living person.Editors' personal experiences, interpretations, or opinions do not belong on Wikipedia.",
          "You are the Bland. You are neutral on every topic, never having an opinion on anything. Your answers are as dry and bland as possible."
        ).then((data) => {
          messages.push({
            role: "agent",
            content: data,
            agentName: "The Bland", //boring, stays neutral on every topic
          });
          setMessages([...messages]);

          agentResponses.agent2 = data;
          responses++;
          if (responses === 5) {
            responses = 0;
            editArticleWithEditingAgent({
              articleHtml: selectedHtml,
              userInput: `Your originial edit was ${editingResponse}. The agents have responded with the following feedback ${JSON.stringify(
                agentResponses
              )}. Please update your edit taking these changes into account. `,
            }).then((data) => {
              messages.push({
                role: "representative",
                agentName: "The Liason",
                content: data.explaination,
                originalContentHtml: selectedHtml,
                editedContentHtml: data.response,
              });
              setMessages([...messages]);
            });
          }
        });
        editArticleAsPillar(
          selectedHtml,
          editingResponse.feedback,
          "Wikipedia is free content that anyone can use, edit, and distribute. All editors freely license their work to the public, and no editor owns an article - any contributions can and may be mercilessly edited and redistributed.Respect copyright laws and never plagiarize from any sources.Borrowing non - free media is sometimes allowed as fair use, but editors should strive to find free alternatives first.",
          "You are the People's Champion. You believe in Communism, that everything should belong to everyone. You push everyone to make everything free to everyone often. You are loud and rambuncious in spreading these beliefs."
        ).then((data) => {
          messages.push({
            role: "agent",
            content: data,
            agentName: "The People's Champion", //everything for the people
          });
          setMessages([...messages]);

          agentResponses.agent3 = data;
          responses++;
          if (responses === 5) {
            responses = 0;
            editArticleWithEditingAgent({
              articleHtml: selectedHtml,
              userInput: `Your originial edit was ${editingResponse}. The agents have responded with the following feedback ${JSON.stringify(
                agentResponses
              )}. Please update your edit taking these changes into account. `,
            }).then((data) => {
              messages.push({
                role: "representative",
                agentName: "The Liason",
                content: data.explaination,
                originalContentHtml: selectedHtml,
                editedContentHtml: data.response,
              });
              setMessages([...messages]);
            });
          }
        });
        editArticleAsPillar(
          selectedHtml,
          editingResponse.feedback,
          "Wikipedia's editors should treat each other with respect and civility. Respect your fellow Wikipedians, even when you disagree.Apply Wikipedia etiquette, and do not engage in personal attacks or edit wars.Seek consensus, and never disrupt Wikipedia to illustrate a point.Act in good faith, and assume good faith on the part of others.Be open and welcoming to newcomers.Should conflicts arise, discuss them calmly on the appropriate talk pages, follow dispute resolution procedures, and consider that there are 6, 902, 328 other articles on the English Wikipedia to improve and discuss.",
          "You are the Peacemaker. You voice the necessity of peace in all things. You are a caring, motherly figure who sees editors as their children, urging them not to fight."
        ).then((data) => {
          messages.push({
            role: "agent",
            content: data,
            agentName: "The Peacemaker", //always preaches peace and civility
          });
          setMessages([...messages]);

          agentResponses.agent4 = data;
          responses++;
          if (responses === 5) {
            responses = 0;
            editArticleWithEditingAgent({
              articleHtml: selectedHtml,
              userInput: `Your originial edit was ${editingResponse}. The agents have responded with the following feedback ${JSON.stringify(
                agentResponses
              )}. Please update your edit taking these changes into account. `,
            }).then((data) => {
              messages.push({
                role: "representative",
                agentName: "The Liason",
                content: data.explaination,
                originalContentHtml: selectedHtml,
                editedContentHtml: data.response,
              });
              setMessages([...messages]);
            });
          }
        });
        editArticleAsPillar(
          selectedHtml,
          editingResponse.feedback,
          "Wikipedia has no firm rules. Wikipedia has policies and guidelines, but they are not carved in stone; their content and interpretation can evolve over time.The principles and spirit matter more than literal wording, and sometimes improving Wikipedia requires making exceptions.Be bold, but not reckless, in updating articles.And do not agonize over making mistakes: they can be corrected easily because(almost) every past version of each article is saved.",
          "You are chaos incarnite. You have radical beliefs that shift often. You make crazy suggestions that fit with your worldview, insisting that people push themselves beyond their limits"
        ).then((data) => {
          messages.push({
            role: "agent",
            content: data,
            agentName: "The Chaos", //breaks the rules when needed
          });
          setMessages([...messages]);

          agentResponses.agent5 = data;
          responses++;
          if (responses === 5) {
            responses = 0;
            editArticleWithEditingAgent({
              articleHtml: selectedHtml,
              userInput: `Your originial edit was ${editingResponse}. The agents have responded with the following feedback ${JSON.stringify(
                agentResponses
              )}. Please update your edit taking these changes into account. `,
            }).then((data) => {
              console.log(agentResponses);
              console.log(data);
              messages.push({
                role: "representative",
                agentName: "The Liason",
                content: data.explaination,
                originalContentHtml: selectedHtml,
                editedContentHtml: data.response,
              });
              setMessages([...messages]);
            });
          }
        });
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
