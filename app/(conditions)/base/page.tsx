import BaseEditor from "@/components/base-editor";
import ConditionNav from "@/components/condition-nav";
import SideNav from "@/components/side-nav";
import { getArticleHtmlByTitle } from "@/lib/wiki";
import { Suspense } from "react";

export default async function BasePage({
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
    articleHtml = (await getArticleHtmlByTitle({ title })) || "";
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
                <BaseEditor articleHtml={articleHtml} articleTitle={title} />
              </Suspense>
            </article>
          </div>
        </main>
      ) : (
        <main className="p-4 h-screen">
          <div className="flex p-4 h-full overflow-hidden rounded-lg border">
            <article className="flex-grow overflow-hidden">
              <Suspense fallback={<div>Loading...</div>}>
                <BaseEditor articleHtml={articleHtml} articleTitle={title} />
              </Suspense>
            </article>
          </div>
        </main>
      )}
    </>
  );
}
