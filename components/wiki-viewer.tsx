import React, { useCallback, useEffect } from "react";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";

interface WikiViewerProps {
  content: string;
  isEditable: boolean;
  handleChange?: (evt: any) => void;
  articleTitle: string;
  handleSelection?: () => void;
}

const WikiViewer: React.FC<WikiViewerProps> = ({
  content,
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
  }, [content]);

  return (
    <div className="overflow-auto" onClick={handleLinkClick}>
      <h1 id="firstHeading" className="firstHeading mw-first-heading">
        <i>{articleTitle}</i>
      </h1>
      <ContentEditable
        className="p-4 focus:outline-none"
        id="prompt-editor-content"
        html={content}
        disabled={!isEditable}
        onChange={(evt: ContentEditableEvent) => handleChange?.(evt)}
        onMouseUp={handleSelection}
      />
    </div>
  );
};

export default WikiViewer;
