import { mapStrToColor } from "@/lib/utils";
import { Message, MessageRole } from "./chat-container";
import { useEffect, useState } from "react";
import htmldiff from "node-htmldiff";
import { Box, Stack } from "@mui/material";

export default function MessageBubble({
  message,
  move,
  setActiveAgent,
  activeAgent,
  setContentHtml,
  isLastEditMessage,
  setIsLocked,
  setMessages,
  setSelectedHtml,
  setPhase,
}: {
  message: Message;
  move?: "right" | "left";
  setActiveAgent: (agentName: string) => void;
  activeAgent: string | null;
  setContentHtml: (value: React.SetStateAction<string>) => void;
  isLastEditMessage: boolean;
  setIsLocked: (value: React.SetStateAction<boolean>) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSelectedHtml: (value: React.SetStateAction<string>) => void;
  setPhase: (phase: "prompt" | "editing" | "conversation") => void;
}) {
  const [applyStatus, setApplyStatus] = useState<
    "applied" | "cancelled" | "deferred" | null
  >(null);
  const {
    reactions,
    role,
    content,
    originalContentHtml,
    editedContentHtml,
    agentName,
  } = message;

  const diffHtml = htmldiff(
    originalContentHtml || "",
    editedContentHtml || "",
    null
  );

  console.log("originalContentHtml", originalContentHtml);
  console.log("editedContentHtml", editedContentHtml);
  console.log("diffHtml", diffHtml);

  let initialAlignment: "left" | "right";

  if (role === "user" || (move === "left" && role === "representative")) {
    initialAlignment = "right";
  } else {
    initialAlignment = "left";
  }

  const [spacerWidth, setSpacerWidth] = useState(
    initialAlignment === "right" ? "100%" : "0%"
  );

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (role === "representative" && move === "left") {
      setSpacerWidth("100%");
      timer = setTimeout(() => {
        setSpacerWidth("0%");
      }, 600);
    } else if (role === "representative" && move === "right") {
      setSpacerWidth("0%");
      timer = setTimeout(() => {
        setSpacerWidth("100%");
      }, 600);
    } else {
      setSpacerWidth(initialAlignment === "right" ? "100%" : "0%");
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [role, move, initialAlignment]);

  const getBubbleColorClasses = (
    role: MessageRole,
    activeAgent: string | null,
    agentName?: string
  ) => {
    if (role === "representative" || role === "assistant")
      return "bg-gray-200 text-black";
    else if (role === "user") return "bg-blue-500 text-white";
    else if (role === "agent") {
      if (activeAgent) return "bg-white text-black";
      else return `bg-${mapStrToColor(agentName || "Agent")}-200 text-black`;
    }
  };

  const bubbleClasses = `w-full rounded-lg p-3 ${getBubbleColorClasses(
    role,
    message.activeAgent || null,
    agentName
  )}`;

  const applyChanges = (apply: boolean) => {
    setContentHtml((prevContentHtml: string) => {
      // Create a temporary DOM element
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = prevContentHtml;

      // Find the span element with the highlight-yellow class
      const highlightedSpan = tempDiv.querySelector("span.highlight-yellow");

      if (highlightedSpan) {
        // Create a new span element
        const newSpan = document.createElement("span");
        if (apply) {
          newSpan.className = "highlight-green";
          newSpan.innerHTML = message.editedContentHtml || "";
        } else {
          newSpan.innerHTML = message.originalContentHtml || "";
        }

        // Replace the existing element with the new one
        highlightedSpan.parentNode?.replaceChild(newSpan, highlightedSpan);

        // Return the modified HTML
        return tempDiv.innerHTML;
      }

      // If no matching element is found, return the original content
      return prevContentHtml;
    });
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages];
      const messagesWithoutFirstFeedback = newMessages.filter(
        (msg) => msg.role !== "agent" || msg.activeAgent
      );
      return messagesWithoutFirstFeedback;
    });
    setApplyStatus(apply ? "applied" : "cancelled");
    setIsLocked(false);
    setSelectedHtml("");
    setPhase("prompt");
  };

  return (
    <div className={`flex w-full`}>
      <div
        style={{
          width: spacerWidth,
          transition: "width 0.5s ease",
        }}
      />

      <div className="max-w-[70%] flex-shrink-0">
        {agentName && (
          <Box sx={{ display: "flex", position: "relative" }}>
            <div
              className={`text-xs text-${mapStrToColor(
                agentName || "Agent"
              )}-600 mb-1`}
            >
              {agentName}
            </div>
            {activeAgent === null && role === "agent" && agentName && (
              <div
                onClick={() => setActiveAgent(agentName)}
                className="text-xs text-gray-500 font-bold cursor-pointer ml-2"
              >
                Reply
              </div>
            )}
          </Box>
        )}
        <Box className={bubbleClasses} sx={{ position: "relative" }}>
          <div>{content}</div>
          <Stack
            direction="row"
            spacing={0.8}
            sx={{
              width: 24 * 3,
              height: 24,
              position: "absolute",
              top: "100%",
              left: "93.5%",
              transform: "translate(-100%, -50%)",
            }}
          >
            {reactions
              ?.filter((_, index) => index === 0 || index === 2 || index == 4)
              .map((reaction, index) => {
                return (
                  <Box
                    className={`bg-${mapStrToColor(reaction.agentName)}-200`}
                    key={index}
                    sx={{
                      width: 24,
                      height: 24,
                      border: "1px solid black",
                    }}
                  >
                    {reaction.emoji}
                  </Box>
                );
              })}
          </Stack>
          {["representative", "assistant"].includes(role) && (
            <div className=" bg-white p-2 rounded-lg mt-2">
              <div
                className={`diff-container ${applyStatus ? "opacity-50" : ""}`}
                dangerouslySetInnerHTML={{ __html: diffHtml }}
                style={{ pointerEvents: applyStatus ? "none" : "auto" }}
              />
              {!applyStatus && isLastEditMessage && (
                <div className="flex mt-2 font-bold">
                  <button
                    className="text-blue-600 text-xs"
                    onClick={() => applyChanges(true)}
                  >
                    Apply Changes
                  </button>
                  {move === "left" ? (
                    <button
                      className="text-red-600 text-xs ml-2"
                      onClick={() => applyChanges(false)}
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      className="text-red-600 text-xs ml-2"
                      onClick={() => setApplyStatus("deferred")}
                    >
                      Ask Again
                    </button>
                  )}
                </div>
              )}
              {applyStatus && (
                <div
                  className={`text-xs font-bold mt-2 ${
                    applyStatus === "applied"
                      ? "text-blue-800"
                      : applyStatus === "cancelled"
                      ? "text-red-800"
                      : "text-gray-800"
                  }`}
                >
                  {applyStatus === "applied"
                    ? "Changes applied"
                    : applyStatus === "cancelled"
                    ? "Changes cancelled"
                    : "Changes deferred"}
                </div>
              )}
            </div>
          )}
        </Box>
      </div>
    </div>
  );
}
