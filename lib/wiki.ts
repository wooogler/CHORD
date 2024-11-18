import wikipedia from "wikipedia";

export async function getArticleHtmlByTitle(
  title: string
): Promise<string | null> {
  try {
    const page = await wikipedia.page(title);
    const html = await page.html();
    return html;
  } catch (error) {
    console.error(`제목으로 기사를 가져오는 중 오류 발생: ${error}`);
    return "";
  }
}

export async function getArticleTalkByTitle(
  title: string
): Promise<string | null> {
  try {
    const page = await wikipedia.page("Talk:" + title);
    const returnField = await page.content();
    return returnField;
  } catch (error) {
    console.error(`제목으로 기사를 가져오는 중 오류 발생: ${error}`);
    return "";
  }
}