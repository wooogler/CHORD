import ChordEditor from "@/components/chord-editor";
import ConditionNav from "@/components/condition-nav";
import SideNav from "@/components/side-nav";
import { getArticleHtmlByTitle, getArticleTalkByTitle } from "@/lib/wiki";
import { Suspense } from "react";

export default async function PromptPage({
  searchParams,
}: {
  searchParams?: {
    title?: string;
    menu?: string;
  };
}) {
  const title = searchParams?.title || "";
  const isMenu = searchParams?.menu === "true";
  let articleHtml = "";
  let articleTalk = "";

  if (title) {
    articleHtml = (await getArticleHtmlByTitle(title)) || "";
    articleTalk = (await getArticleTalkByTitle(title)) || "";
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
                <ChordEditor
                  articleHtml={articleHtml}
                  articleTitle={title}
                  articleTalk={articleTalk}
                />
              </Suspense>
            </article>
          </div>
        </main>
      ) : (
        <main className="p-8 h-screen">
          <div className="flex h-full overflow-hidden">
            <article className="flex-grow overflow-hidden">
              <Suspense fallback={<div>Loading...</div>}>
                <ChordEditor
                  articleHtml={articleHtml}
                  articleTitle={title}
                  articleTalk={articleTalk}
                />
              </Suspense>
            </article>
          </div>
        </main>
      )}
    </>
  );
}
