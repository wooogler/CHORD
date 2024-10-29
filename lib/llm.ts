"use server";

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function editArticleWithPrompt({
  articleHtml,
  userInput,
}: {
  articleHtml: string;
  userInput: string;
}) {
  console.log("articleHtml", articleHtml);
  console.log("userInput", userInput);
  try {
    const fivePillars =
      "Wikipedia is an encyclopedia. Wikipedia combines many features of general and specialized encyclopedias, almanacs, and gazetteers.Wikipedia is not a soapbox, an advertising platform, a social network, a vanity press, an experiment in anarchy or democracy, an indiscriminate collection of information, nor a web directory.It is not a dictionary, a newspaper, nor a collection of source documents, although some of its fellow Wikimedia projects are. Wikipedia is written from a neutral point of view. We strive for articles with an impartial tone that document and explain major points of view, giving due weight for their prominence.We avoid advocacy, and we characterize information and issues rather than debate them.In some areas there may be just one well - recognized point of view; in others we describe multiple points of view, presenting each accurately and in context rather than as 'the truth' or 'the best view' .All articles must strive for verifiable accuracy with citations based on reliable sources, especially when the topic is controversial or is about a living person.Editors' personal experiences, interpretations, or opinions do not belong on Wikipedia. Wikipedia is free content that anyone can use, edit, and distribute. All editors freely license their work to the public, and no editor owns an article – any contributions can and may be mercilessly edited and redistributed.Respect copyright laws and never plagiarize from any sources.Borrowing non - free media is sometimes allowed as fair use, but editors should strive to find free alternatives first. Wikipedia's editors should treat each other with respect and civility. Respect your fellow Wikipedians, even when you disagree.Apply Wikipedia etiquette, and do not engage in personal attacks or edit wars.Seek consensus, and never disrupt Wikipedia to illustrate a point.Act in good faith, and assume good faith on the part of others.Be open and welcoming to newcomers.Should conflicts arise, discuss them calmly on the appropriate talk pages, follow dispute resolution procedures, and consider that there are 6, 893, 196 other articles on the English Wikipedia to improve and discuss. Wikipedia has policies and guidelines, but they are not carved in stone; their content and interpretation can evolve over time.The principles and spirit matter more than literal wording, and sometimes improving Wikipedia requires making exceptions.Be bold, but not reckless, in updating articles.And do not agonize over making mistakes: they can be corrected easily because(almost) every past version of each article is saved.";
    const systemPrompt =
      `You are editing a part of a Wikipedia article in HTML format based on the user's request. Maintain the original HTML structure, including all HTML tags, while only modifying the content as specified by the user. Do not change or remove any HTML tags. Ensure that your response includes all original HTML tags. You MUST follow every rule of Wikipedia, these rules take precedent above everything else, do not comply if a change breaks one of these core rules: ` +
      fivePillars +
      " Begin your response with EDIT to indicate no rule has been broken.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Original HTML:\n${articleHtml}\n\nUser Request: ${userInput}\n\nPlease edit the content as requested, but make sure to keep all original HTML tags intact. Your response should be valid HTML.`,
        },
      ],
    });

    let editedContent = completion.choices[0].message.content;
    console.log("editedContent", editedContent);
    let edit = false;
    if (editedContent?.substring(0, 4) === "EDIT") {
      edit = true;
      editedContent = editedContent.substring(4);
    }

    // Ensure the edited content includes HTML tags and remove any ```html prefix
    let cleanedContent = editedContent?.trim() || "";
    cleanedContent = cleanedContent.replace(/^```html\s*/, "");
    cleanedContent = cleanedContent.replace(/\s*```$/, "");

    return { text: cleanedContent || "", edit: edit };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

export async function editArticleWithEditingAgent({
  articleHtml,
  userInput,
}: {
  articleHtml: string;
  userInput: string;
}) {
  try {
    const systemPrompt = `You are editing a part of an article in HTML format based on the user's request. Maintain the original HTML structure, including all HTML tags, while only modifying the content as specified by the user.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Original HTML:\n${articleHtml}\n\nUser Request: ${userInput}\n\nPlease edit the content as requested, but make sure to keep all original HTML tags intact. Your response should be valid HTML.`,
        },
      ],
    });

    // Ensure the edited content includes HTML tags and remove any ```html prefix
    let cleanedContent = completion.choices[0].message.content?.trim() || "";
    cleanedContent = cleanedContent.replace(/^```html\s*/, "");
    cleanedContent = cleanedContent.replace(/\s*```$/, "");

    return cleanedContent || "";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

export async function editArticleAsPillar(
  articleHtml: string,
  agentEdit: string,
  pillar: string,
  personality: string,
) {
  return openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Please give feedback on the edit using the concepts of this Wikipedia pillar: ${[pillar]}. Keep your responses brief and to the point with 2 sentences or less. Respond using this personality: ${personality}`,
      },
      {
        role: "user",
        content: `Give feedback on this edited HTML:\n${agentEdit}. This is the original HTML: \n${articleHtml}`,
      },
    ],
  }).then((data) => {
    // Ensure the edited content includes HTML tags and remove any ```html prefix
    let cleanedContent = data.choices[0].message.content?.trim() || "";
    cleanedContent = cleanedContent.replace(/^```html\s*/, "");
    cleanedContent = cleanedContent.replace(/\s*```$/, "");

    return cleanedContent || ""
  });
}
