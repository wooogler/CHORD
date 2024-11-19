import ConditionNav from "@/components/condition-nav";
import PromptEditor from "@/components/prompt-editor";
import SideNav from "@/components/side-nav";
import { getArticleHtmlByTitle } from "@/lib/wiki";
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

  if (title) {
    articleHtml = (await getArticleHtmlByTitle(title)) || "";
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
                <PromptEditor articleHtml={articleHtml} articleTitle={title} />
              </Suspense>
            </article>
          </div>
        </main>
      ) : (
        <main className="p-8 h-screen">
          <div className="flex h-full overflow-hidden">
            <article className="flex-grow overflow-hidden">
              <Suspense fallback={<div>Loading...</div>}>
                <PromptEditor articleHtml={articleHtml} articleTitle={title} />
              </Suspense>
            </article>
          </div>
        </main>
      )}
    </>
  );
}
