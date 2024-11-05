import { mapStrToColor } from "@/lib/utils";
import { Message, MessageRole } from "./chat-container";
import { useEffect, useState } from "react";
import htmldiff from "node-htmldiff";
import { Box, Stack } from "@mui/material";

export default function MessageBubble({
  message,
  prevRole,
  setActiveAgent,
  activeAgent,
  setContentHtml,
  isLastEditMessage,
}: {
  message: Message;
  prevRole?: MessageRole;
  setActiveAgent: (agentName: string) => void;
  activeAgent: string | null;
  setContentHtml: (value: React.SetStateAction<string>) => void;
  isLastEditMessage: boolean;
}) {
  const [isChangesApplied, setIsChangesApplied] = useState(false);
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

  let initialAlignment: "left" | "right";

  if (role === "user" || (role === "representative" && prevRole === "user")) {
    initialAlignment = "right";
  } else {
    initialAlignment = "left";
  }

  const [spacerWidth, setSpacerWidth] = useState(
    initialAlignment === "right" ? "100%" : "0%"
  );

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (role === "representative" && prevRole === "user") {
      setSpacerWidth("100%");
      timer = setTimeout(() => {
        setSpacerWidth("0%");
      }, 600);
    } else if (role === "representative" && prevRole === "agent") {
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
  }, [role, prevRole, initialAlignment]);

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

  const applyChanges = () => {
    setContentHtml((prevContentHtml: string) => {
      // Create a temporary DOM element
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = prevContentHtml;

      // Find the span element with the highlight-yellow class
      const highlightedSpan = tempDiv.querySelector("span.highlight-yellow");

      if (highlightedSpan) {
        // Create a new span element
        const newSpan = document.createElement("span");
        newSpan.className = "highlight-green";
        newSpan.innerHTML = message.editedContentHtml || prevContentHtml;

        // Replace the existing element with the new one
        highlightedSpan.parentNode?.replaceChild(newSpan, highlightedSpan);

        // Return the modified HTML
        return tempDiv.innerHTML;
      }

      // If no matching element is found, return the original content
      return prevContentHtml;
    });
    setIsChangesApplied(true);
  };

  return (
    <div className={`flex w-full`}>
      {(role === "user" || role === "representative") && (
        <div
          style={{
            width: spacerWidth,
            transition: "width 0.5s ease",
          }}
        />
      )}

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
          {originalContentHtml && (
            <div className=" bg-white p-2 rounded-lg mt-2">
              <div
                className="diff-container"
                dangerouslySetInnerHTML={{ __html: diffHtml }}
              />
              {!isChangesApplied && isLastEditMessage && (
                <div className="flex mt-2">
                  <button
                    className="text-blue-600 text-xs"
                    onClick={applyChanges}
                  >
                    Apply Changes
                  </button>
                  <button
                    className="text-red-600 text-xs ml-2"
                    onClick={() => setIsChangesApplied(true)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </Box>
      </div>
    </div>
  );
}
