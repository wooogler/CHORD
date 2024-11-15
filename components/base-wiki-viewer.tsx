import { cleanWikiHtml } from "@/lib/utils";
import React, { useCallback, useEffect } from "react";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";

interface BaseWikiViewerProps {
  contentHtml: string;
  isEditable: boolean;
  handleChange?: (evt: React.FormEvent<HTMLDivElement>) => void;
  articleTitle: string;
  handleSelection?: () => void;
}

const BaseWikiViewer: React.FC<BaseWikiViewerProps> = ({
  contentHtml,
  isEditable,
  handleChange,
  articleTitle,
  handleSelection,
}) => {
  const handleLinkClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isEditable && event.target instanceof HTMLAnchorElement) {
        event.preventDefault();
        const href = event.target.getAttribute("href");
        if (href) {
          if (href.startsWith("#")) {
            const element = document.querySelector(href);
            element?.scrollIntoView({ behavior: "smooth" });
          } else if (href.startsWith("/wiki/")) {
            const pageName = href.replace("/wiki/", "");
            window.open(`https://en.wikipedia.org/wiki/${pageName}`, "_blank");
          } else {
            window.open(href, "_blank");
          }
        }
      }
    },
    [isEditable]
  );

  useEffect(() => {
    const removeEditSections = () => {
      const editSections = document.querySelectorAll(".mw-editsection");
      editSections.forEach((section) => section.remove());
    };

    removeEditSections();
  }, [contentHtml]);

  return (
    <div className="overflow-auto" onClick={handleLinkClick}>
      <h1 id="firstHeading" className="firstHeading mw-first-heading">
        <i>{articleTitle}</i>
      </h1>
      <ContentEditable
        className="p-4 focus:outline-none"
        id="prompt-editor-content"
        html={cleanWikiHtml(contentHtml)}
        disabled={!isEditable}
        onChange={(evt: ContentEditableEvent) => handleChange?.(evt)}
        onMouseUp={handleSelection}
      />
    </div>
  );
};

export default BaseWikiViewer;
