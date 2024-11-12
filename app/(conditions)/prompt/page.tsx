import PromptEditor from "@/components/prompt-editor";
import { getArticleHtmlByTitle } from "@/lib/wiki";
import { Suspense } from "react";

export default async function PromptPage({
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
      <PromptEditor articleHtml={articleHtml} articleTitle={title} />
    </Suspense>
  );
}
