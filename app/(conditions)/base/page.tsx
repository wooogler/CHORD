import BaseEditor from "@/components/base-editor";
import { getArticleHtmlByTitle } from "@/lib/wiki";
import { Suspense } from "react";

export default async function BasePage({
  searchParams,
}: {
  searchParams?: {
    title?: string;
  };
}) {
  const title = searchParams?.title || "";
  let articleHtml = "";

  if (title) {
    articleHtml = (await getArticleHtmlByTitle(title)) || "";
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BaseEditor articleHtml={articleHtml} articleTitle={title} />
    </Suspense>
  );
}
