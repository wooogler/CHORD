import { mapStrToColor } from "@/lib/utils";
import { Message, MessageRole } from "./chat-container";
import { useEffect, useState } from "react";
import htmldiff from "node-htmldiff";

export default function MessageBubble({
  message,
  prevRole,
}: {
  message: Message;
  prevRole?: MessageRole;
}) {
  const { role, content, originalContentHtml, editedContentHtml, agentName } =
    message;

  const diffHtml = htmldiff(originalContentHtml || "", editedContentHtml || "");

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
      }, 1000);
    } else if (role === "representative" && prevRole === "agent") {
      setSpacerWidth("0%");
      timer = setTimeout(() => {
        setSpacerWidth("100%");
      }, 1000);
    } else {
      setSpacerWidth(initialAlignment === "right" ? "100%" : "0%");
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [role, prevRole, initialAlignment]);

  const bubbleClasses = `w-full rounded-lg p-3 ${
    role === "user"
      ? "bg-blue-500 text-white"
      : role === "assistant"
      ? "bg-gray-200 text-black"
      : role === "agent"
      ? `bg-${mapStrToColor(agentName || "Agent")}-200 text-black`
      : "bg-gray-200 text-black"
  }`;

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
          <div
            className={`text-xs text-${mapStrToColor(
              agentName || "Agent"
            )}-600 mb-1`}
          >
            {agentName}
          </div>
        )}
        <div className={bubbleClasses}>
          <div>{content}</div>
          {originalContentHtml && (
            <div
              className="diff-container bg-white p-2 rounded-lg mt-2"
              dangerouslySetInnerHTML={{ __html: diffHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
