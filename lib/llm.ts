"use server";

import { Message } from "@/components/chat-container";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function editArticleWithUserInputAndPillars({
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
      `You are editing a part of a Wikipedia article in HTML format based on the user's request. Maintain the original HTML structure, including all HTML tags, while only modifying the content as specified by the user. Do not change or remove any HTML tags. Ensure that your response includes all original HTML tags. You MUST follow every rule of Wikipedia; these rules take precedence above everything else; do not comply if a change breaks one of these core rules: ` +
      fivePillars +
      `Provide your response in the following JSON format:

{
  "feedback": "{Your natural language feedback about the edited parts, referencing the five pillars}",
  "editedHtml": "{The edited part in HTML format}"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
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

    const assistantResponse = completion.choices[0].message.content;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantResponse || "");
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw error;
    }

    return {
      feedback: parsedResponse.feedback,
      editedHtml: parsedResponse.editedHtml,
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

export async function editArticleWithUserInputOnly({
  articleHtml,
  userInput,
}: {
  articleHtml: string;
  userInput: string;
}) {
  console.log("articleHtml", articleHtml);
  console.log("userInput", userInput);
  try {
    const systemPrompt = `You are editing a part of a Wikipedia article in HTML format based on the user's request. Maintain the original HTML structure, including all HTML tags, while only modifying the content as specified by the user. Do not change or remove any HTML tags. Ensure that your response includes all original HTML tags. Provide your response in the following JSON format:

{
  "feedback": "{Your natural language feedback about the edited parts}",
  "editedHtml": "{The edited part in HTML format}"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
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

    const assistantResponse = completion.choices[0].message.content;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantResponse || "");
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw error;
    }

    return {
      feedback: parsedResponse.feedback,
      editedHtml: parsedResponse.editedHtml,
    };
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
  const personality =
    "You are the user's representative, a butler of sorts. You are the liaison between the other models, and are from the upper crust, truly high class.";

  try {
    const systemPrompt = `You are editing a part of an article in HTML format based on the user's request. Maintain the original HTML structure, including all HTML tags, while only modifying the content as specified by the user. Give a short justification (under 200 characters) for your edits that is seperate from the HTML by triple bars (|||). Modify these justifications based on this personality: ${personality}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Original HTML:\n${articleHtml}\n\nUser Request: ${userInput}\n\nPlease edit the content as requested, but make sure to keep all original HTML tags intact. Your response before the triple bars (|||) should be valid HTML.`,
        },
      ],
    });

    const splitLocation =
      completion.choices[0].message.content?.indexOf("|||") ?? 0;
    const response = completion.choices[0].message.content?.substring(
      0,
      splitLocation
    );
    const explaination = completion.choices[0].message.content?.substring(
      splitLocation + 3
    );

    // Ensure the edited content includes HTML tags and remove any ```html prefix
    let cleanedContent = response?.trim() || "";
    cleanedContent = cleanedContent.replace(/^```html\s*/, "");
    cleanedContent = cleanedContent.replace(/\s*```$/, "");

    return {
      response: cleanedContent || "",
      explaination: explaination?.replaceAll("|", "").trim() || "",
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

export async function editArticleAsPillar(
  articleHtml: string,
  agentEdit: string,
  pillar: string,
  personality: string
) {
  return openai.chat.completions
    .create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Please give feedback on the edit using the concepts of this Wikipedia pillar: ${[
            pillar,
          ]}. Keep your responses brief and to the point in less than 250 characters. Respond using this personality: ${personality}`,
        },
        {
          role: "user",
          content: `Give feedback on this edited HTML:\n${agentEdit}. This is the original HTML: \n${articleHtml}`,
        },
      ],
    })
    .then((data) => {
      // Ensure the edited content includes HTML tags and remove any ```html prefix
      let cleanedContent = data.choices[0].message.content?.trim() || "";
      cleanedContent = cleanedContent.replace(/^```html\s*/, "");
      cleanedContent = cleanedContent.replace(/\s*```$/, "");

      return cleanedContent || "";
    });
}

export async function getFeedbackFromAgent(
  editedHtml: string,
  task: string,
  personality: string,
  chatHistory: Message[]
) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant tasked with providing brief feedback on edited content. The edits are marked with <del> (deleted) and <ins> (inserted). Base your feedback on the given task and the previous conversation history. Your response should reflect the personality described and be concise, as if leaving a comment in a group chat.`,
      },
      {
        role: "user",
        content: `Edited HTML Content:
${editedHtml}

Task:
${task}

Personality:
${personality}

Previous Conversation:
${formatChatHistory(chatHistory)}

Please provide your feedback on the edited content.`,
      },
    ],
  });

  const agentResponse = completion.choices[0].message.content;

  return agentResponse;
}

function formatChatHistory(chatHistory: Message[]) {
  return chatHistory
    .map(
      (message) => `${message.agentName || message.role}: ${message.content}`
    )
    .join("\n");
}
