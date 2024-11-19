import React, { useCallback, useEffect, useRef } from "react";
import * as cheerio from "cheerio";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import useEditorStore from "@/lib/store/editorStore";

interface WikiViewerProps {
  articleTitle: string;
}

const modifyWikiHtml = (htmlString: string) => {
  const $ = cheerio.load(htmlString);
  $("sup").remove();
  $("div.mw-heading2").after('<p class="wiki-paragraph empty-paragraph"></p>');
  $("div.mw-heading3").after('<p class="wiki-paragraph empty-paragraph"></p>');
  $("p:not(.wiki-paragraph)").after(
    '<p class="wiki-paragraph empty-paragraph"></p>'
  );
  $("p").addClass("wiki-paragraph");
  $("a").addClass("wiki-link");
  return $.html();
};

const WikiViewer: React.FC<WikiViewerProps> = ({ articleTitle }) => {
  const { setContentHtml, setSelectedHtml } = useEditorStore();
  const contentHtml = useEditorStore((state) => state.contentHtml);
  const isLocked = useEditorStore((state) => state.isLocked);

  const contentEditableRef = useRef<string>(modifyWikiHtml(contentHtml));

  const handleLinkClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const isInEditableContent = (event.target as HTMLElement).closest(
        '[contenteditable="true"]'
      );

      if (isInEditableContent) {
        return;
      }

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
    []
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

      while (paragraph.firstChild) {
        highlightSpan.appendChild(paragraph.firstChild);
      }

      paragraph.appendChild(highlightSpan);
      paragraph.setAttribute("contenteditable", "true");

      setContentHtml(
        document.getElementById("prompt-editor-content")?.innerHTML || "",
        "SELECT_PARAGRAPH"
      );
      setSelectedHtml(highlightSpan.innerHTML || null);
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
  };

  const handleBlur = () => {
    const editor = document.getElementById("prompt-editor-content");
    if (editor) {
      let newContentHtml = editor.innerHTML;
      const currentContentHtml = contentHtml;

      // 먼저 empty paragraph 체크 및 수정
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = newContentHtml;

      const wikiParagraphs = tempDiv.querySelectorAll(".wiki-paragraph");
      wikiParagraphs.forEach((p) => {
        if (!p.textContent?.trim()) {
          p.classList.add("empty-paragraph");
          p.setAttribute("contenteditable", "false");
          p.innerHTML = "";
        }
      });

      const emptyParagraphs = tempDiv.querySelectorAll(".empty-paragraph");
      emptyParagraphs.forEach((p) => {
        if (p.textContent?.trim()) {
          p.classList.remove("empty-paragraph");
        }
      });

      // 수정된 HTML 가져오기
      newContentHtml = tempDiv.innerHTML;

      // 변경사항이 있을 경우에만 store 업데이트
      if (newContentHtml !== currentContentHtml) {
        setContentHtml(newContentHtml, "EDIT_PARAGRAPH");
      }
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
        onBlur={handleBlur}
      />
    </div>
  );
};

export default WikiViewer;
