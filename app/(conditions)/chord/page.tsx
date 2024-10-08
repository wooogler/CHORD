import ChordEditor from "@/components/chord-editor";
import { getArticleHtmlByTitle } from "@/lib/wiki";

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

  return <ChordEditor articleHtml={articleHtml} articleTitle={title} />;
}
