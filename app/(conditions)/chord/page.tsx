import ChordEditor from "@/components/chord-editor";
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
      <ChordEditor articleHtml={articleHtml} articleTitle={title} />
    </Suspense>
  );
}
