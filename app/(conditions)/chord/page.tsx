import ChordEditor from "@/components/chord-editor";
import { getArticleHtmlByTitle, getArticleTalkByTitle } from "@/lib/wiki";
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
  let articleTalk = "";

  if (title) {
    articleHtml = (await getArticleHtmlByTitle(title)) || "";
    articleTalk = (await getArticleTalkByTitle(title)) || "";
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChordEditor articleHtml={articleHtml} articleTitle={title} articleTalk={articleTalk} />
    </Suspense>
  );
}
