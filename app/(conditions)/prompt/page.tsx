import PromptEditor from "@/components/prompt-editor";
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

  return <PromptEditor articleHtml={articleHtml} />;
}
