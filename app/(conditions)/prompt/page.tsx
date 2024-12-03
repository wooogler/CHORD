import ConditionNav from "@/components/condition-nav";
import PromptEditor from "@/components/prompt-editor";
import SideNav from "@/components/side-nav";
import { excludeParagraph, getArticleHtmlByTitle } from "@/lib/wiki";
import { Suspense } from "react";

export default async function PromptPage({
  searchParams,
}: {
  searchParams?: {
    title?: string;
    oldid?: string;
    menu?: string;
    p?: string;
  };
}) {
  const title = searchParams?.title || "";
  const isMenu = searchParams?.menu === "true";
  const paragraphName = searchParams?.p;
  let articleHtml = "";

  if (title) {
    articleHtml =
      (await getArticleHtmlByTitle({
        title,
        oldid: searchParams?.oldid,
      })) || "";

    if (paragraphName) {
      articleHtml = excludeParagraph(articleHtml, paragraphName);
    }
  }

  return (
    <>
      {isMenu ? (
        <main className="grid grid-cols-[250px_1fr] h-screen p-8 gap-4">
          <aside className="border rounded-lg p-4 overflow-y-auto">
            <Suspense fallback={<div>Loading...</div>}>
              <SideNav />
            </Suspense>
          </aside>
          <div className="flex flex-col h-full overflow-hidden">
            <Suspense fallback={<div>Loading...</div>}>
              <ConditionNav />
            </Suspense>
            <article className="border-x border-b rounded-b-lg p-4 flex-grow overflow-hidden">
              <Suspense fallback={<div>Loading...</div>}>
                <PromptEditor
                  articleHtml={articleHtml}
                  articleTitle={title}
                  paragraphName={paragraphName}
                />
              </Suspense>
            </article>
          </div>
        </main>
      ) : (
        <main className="p-4 h-screen">
          <div className="flex p-4 h-full overflow-hidden rounded-lg border">
            <article className="flex-grow overflow-hidden">
              <Suspense fallback={<div>Loading...</div>}>
                <PromptEditor
                  articleHtml={articleHtml}
                  articleTitle={title}
                  paragraphName={paragraphName}
                />
              </Suspense>
            </article>
          </div>
        </main>
      )}
    </>
  );
}
