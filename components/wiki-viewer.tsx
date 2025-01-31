import React, { useCallback, useEffect, useRef } from "react";
import * as cheerio from "cheerio";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import useEditorStore from "@/lib/store/editorStore";
import { Button } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import useChatStore from "@/lib/store/chatStore";
interface WikiViewerProps {
  articleTitle: string;
  paragraphName?: string;
}

const modifyWikiHtml = (htmlString: string) => {
  const $ = cheerio.load(htmlString);
  $("sup").remove();
  $("p").addClass("wiki-paragraph");
  $("a").addClass("wiki-link");
  return $.html();
};

const WikiViewer: React.FC<WikiViewerProps> = ({
  articleTitle,
  paragraphName,
}) => {
  const { setContentHtml, setSelectedHtml, setRightPanel, emptyContentLogs } =
    useEditorStore();
  const { emptyChatStore } = useChatStore();
  const contentHtml = useEditorStore((state) => state.contentHtml);
  const isLocked = useEditorStore((state) => state.isLocked);
  const rightPanel = useEditorStore((state) => state.rightPanel);

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
    if (paragraph.classList.contains("target-paragraph")) {
      paragraph.classList.remove("target-paragraph");
      paragraph.classList.add(
        "edit-paragraph",
        "empty-paragraph",
        "wiki-paragraph"
      );
      paragraph.textContent = "Remove this text and start writing your own";
    } else if (paragraph.classList.contains("edit-paragraph")) {
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
      highlightSpan.textContent = "";

      while (paragraph.firstChild) {
        highlightSpan.appendChild(paragraph.firstChild);
      }

      paragraph.appendChild(highlightSpan);
      paragraph.setAttribute("contenteditable", "true");

      let pIndex: number | null = null;
      const editParagraphs = editor?.querySelectorAll("p.edit-paragraph");
      if (editParagraphs) {
        editParagraphs.forEach((p, index) => {
          if (p === paragraph) {
            pIndex = index;
          }
        });
      }

      setContentHtml(
        document.getElementById("prompt-editor-content")?.innerHTML || "",
        "SELECT_PARAGRAPH"
      );
      setSelectedHtml(highlightSpan.innerHTML, pIndex);
    }
  };

  const handleContentChange = (evt: ContentEditableEvent) => {
    if (isLocked) return;

    contentEditableRef.current = evt.target.value;
  };

  const handleBlur = () => {
    const editor = document.getElementById("prompt-editor-content");
    if (editor) {
      let newContentHtml = editor.innerHTML;
      const currentContentHtml = contentHtml;

      const $ = cheerio.load(newContentHtml);
      const editParagraphs = $("p.edit-paragraph:has(span.highlight-yellow)");
      editParagraphs.each((i, p) => {
        const spans = $(p).find("span.highlight-yellow");
        if (spans.length > 1) {
          const firstSpan = spans.first();
          $(p).empty().text($(firstSpan).text());

          const otherSpans = spans.slice(1);
          otherSpans.each((i, span) => {
            const contents = $(span).text().split(/\n+/);

            contents.forEach((content, index) => {
              if (content.trim()) {
                const newP = $("<p>")
                  .addClass("wiki-paragraph edit-paragraph")
                  .text(content);
                $(p).after(newP);
              } else if (index < contents.length - 1) {
                const emptyP = $("<p>").addClass(
                  "wiki-paragraph edit-paragraph empty-paragraph"
                );
                $(p).after(emptyP);
              }
            });
          });
        } else if (spans.length === 1) {
          $(p).empty().text($(spans.first()).text());
        }
      });

      $("p.empty-paragraph").each((_, p) => {
        if ($(p).text().trim()) {
          $(p).removeClass("empty-paragraph");
        }
      });

      $("p.edit-paragraph").each((_, p) => {
        if (!$(p).text().trim()) {
          const nextP = $(p).next("p");
          if (nextP.hasClass("empty-paragraph")) {
            nextP.remove();
          }
          const totalEditParagraphs = $("p.edit-paragraph").length;

          if (totalEditParagraphs === 1) {
            $(p)
              .removeClass("edit-paragraph empty-paragraph")
              .addClass("target-paragraph")
              .text("Write this paragraph");
          } else {
            $(p).remove();
          }
        }
      });

      $("div.mw-heading").each((_, heading) => {
        const nextElement = $(heading).next();
        if (nextElement.is("p.edit-paragraph.wiki-paragraph")) {
          const emptyP = $("<p>").addClass(
            "edit-paragraph empty-paragraph wiki-paragraph"
          );
          $(heading).after(emptyP);
        }
      });

      $("p.edit-paragraph.wiki-paragraph:not(.empty-paragraph)").each(
        (_, p) => {
          const nextP = $(p).next("p");
          if (!nextP.length || !nextP.hasClass("empty-paragraph")) {
            const emptyP = $("<p>").addClass("edit-paragraph empty-paragraph");
            $(p).after(emptyP);
          }
        }
      );

      newContentHtml = $.html();

      if (newContentHtml !== currentContentHtml) {
        setContentHtml(newContentHtml, "EDIT_PARAGRAPH");
      }
    }
  };

  const emptyStores = () => {
    emptyContentLogs();
    emptyChatStore();
    setRightPanel("guide-only");
    alert("Initialized");
    window.location.reload();
  };

  useEffect(() => {
    if (paragraphName) {
      setTimeout(() => {
        const element = document.querySelector(`[id*="${paragraphName}"]`);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    }
  }, [paragraphName]);

  return (
    <div
      className="overflow-auto"
      onClick={(e) => {
        handleLinkClick(e);
        handleParagraphSelection(e);
      }}
    >
      <div className="flex justify-between sticky top-0 bg-white z-10">
        <h1
          id="firstHeading"
          className="firstHeading mw-first-heading flex-1"
          onClick={(e) => {
            if (e.shiftKey) {
              emptyStores();
            }
          }}
        >
          <i>{articleTitle}</i>
        </h1>
        {rightPanel === "guide-only" && (
          <Button
            variant="contained"
            color="success"
            className="h-10 ml-10 mr-4"
            onClick={() => setRightPanel("chat")}
            startIcon={<ArrowForwardIcon />}
          >
            Next
          </Button>
        )}
      </div>
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
