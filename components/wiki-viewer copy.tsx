import React, { useCallback, useEffect, useRef } from "react";
import * as cheerio from "cheerio";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";

interface WikiViewerProps {
  contentHtml: string;
  setContentHtml: (html: string) => void;
  setSelectedHtml: (html: string) => void;
  isEditable: boolean;
  isLocked: boolean;
  articleTitle: string;
  handleSelection?: () => void;
}

const modifyWikiHtml = (htmlString: string) => {
  const $ = cheerio.load(htmlString);
  $("sup").remove();
  $("p:not(.wiki-paragraph)").after(
    '<p class="wiki-paragraph empty-paragraph"></p>'
  );
  $("p").addClass("wiki-paragraph");
  $("a").addClass("wiki-link");
  return $.html();
};

const WikiViewer: React.FC<WikiViewerProps> = ({
  contentHtml,
  setContentHtml,
  setSelectedHtml,
  isEditable,
  isLocked,
  articleTitle,
}) => {
  const contentEditableRef = useRef<string>(modifyWikiHtml(contentHtml));

  const handleLinkClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isLocked || isEditable) return;
      if (event.target instanceof HTMLAnchorElement) {
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

  const handleParagraphSelection = (e: React.MouseEvent<HTMLElement>) => {
    if (isLocked) return;
    const paragraph = e.target as HTMLElement;
    if (paragraph.tagName.toLowerCase() === "p") {
      const editor = document.getElementById("prompt-editor-content");
      if (editor) {
        editor.querySelectorAll('p[contenteditable="true"]').forEach((p) => {
          p.setAttribute("contenteditable", "false");
        });

        editor
          .querySelectorAll(
            ".highlight-yellow, .highlight-gray, .highlight-green"
          )
          .forEach((highlight) => {
            const parent = highlight.parentNode;
            while (highlight.firstChild) {
              parent?.insertBefore(highlight.firstChild, highlight);
            }
            parent?.removeChild(highlight);
          });
      }

      const highlightSpan = document.createElement("span");
      highlightSpan.className = "highlight-yellow";

      if (!paragraph.textContent?.trim()) {
        highlightSpan.textContent = " ";
      } else {
        while (paragraph.firstChild) {
          highlightSpan.appendChild(paragraph.firstChild);
        }
      }

      paragraph.appendChild(highlightSpan);
      paragraph.setAttribute("contenteditable", "true");

      setContentHtml(
        document.getElementById("prompt-editor-content")?.innerHTML || ""
      );
      setSelectedHtml(highlightSpan.innerHTML || "");
    }
  };

  useEffect(() => {
    const removeEditSections = () => {
      const editSections = document.querySelectorAll(".mw-editsection");
      editSections.forEach((section) => section.remove());
    };

    removeEditSections();
  }, [contentHtml]);

  const handleContentChange = (evt: ContentEditableEvent) => {
    if (isLocked) return;

    contentEditableRef.current = evt.target.value;

    const editor = document.getElementById("prompt-editor-content");
    if (editor) {
      const emptyParagraphs = editor.querySelectorAll(".empty-paragraph");
      emptyParagraphs.forEach((p) => {
        if (p.textContent?.trim()) {
          p.classList.remove("empty-paragraph");
        }
      });
    }
  };

  return (
    <div
      className="overflow-auto"
      onClick={(e) => {
        handleLinkClick(e);
        handleParagraphSelection(e);
      }}
    >
      <h1 id="firstHeading" className="firstHeading mw-first-heading">
        <i>{articleTitle}</i>
      </h1>
      <ContentEditable
        className="p-4 focus:outline-none"
        id="prompt-editor-content"
        html={modifyWikiHtml(contentHtml)}
        disabled={true}
        onChange={handleContentChange}
      />
    </div>
  );
};

export default WikiViewer;
