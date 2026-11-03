import OpenAI from "openai";
import { KeyMoment, SocialDraft } from "./db";

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in the environment.");
  }
  return new OpenAI({ apiKey });
}

/**
 * Transcribe an audio file using OpenAI Whisper API
 */
export async function transcribeAudioFile(file: File | Blob): Promise<string> {
  const openai = getOpenAIClient();
  const response = await openai.audio.transcriptions.create({
    file: file as unknown as File,
    model: "whisper-1",
    language: "en",
    response_format: "text",
  });

  return typeof response === "string" ? response : (response as { text: string }).text;
}

export interface GeneratedEpisodeContent {
  title: string;
  keyMoments: KeyMoment[];
  drafts: SocialDraft[];
}

/**
 * Generate platform-specific social drafts and extract key moments from the transcript
 */
export async function generateMomentsAndDrafts(
  transcript: string,
  providedTitle?: string
): Promise<GeneratedEpisodeContent> {
  const openai = getOpenAIClient();

  const prompt = `You are a world-class podcast social media producer and content strategist.
Given the following podcast transcript, analyze the conversation and generate high-engagement, platform-tailored social drafts and identify the most memorable key moments.

TRANSCRIPT:
"""
${transcript.slice(0, 15000)}
"""

Please respond ONLY with valid, raw JSON (no markdown formatting, no code blocks) adhering strictly to this schema:
{
  "title": "${providedTitle || "A punchy, engaging episode title"}",
  "keyMoments": [
    {
      "id": "km_1",
      "title": "Short punchy highlight headline",
      "timestamp": "02:14",
      "summary": "1-2 sentence context of this point",
      "quote": "Exact or near-exact powerful quote from the transcript"
    }
  ],
  "drafts": [
    {
      "id": "draft_x",
      "platform": "twitter",
      "platformName": "X / Twitter Post",
      "title": "Viral Hook / Takeaway Post",
      "content": "Short, punchy post under 270 characters with a strong hook, 2-3 bullet takeaways, and 1 relevant hashtag.",
      "characterLimit": 280,
      "recommendedChannelService": "twitter",
      "status": "draft"
    },
    {
      "id": "draft_x_thread",
      "platform": "twitter",
      "platformName": "X / Twitter Mini-Thread Starter",
      "title": "Framework & Insight Breakdown",
      "content": "A captivating first tweet outlining an insightful lesson learned in the episode, ending with a hook to continue reading.",
      "characterLimit": 280,
      "recommendedChannelService": "twitter",
      "status": "draft"
    },
    {
      "id": "draft_linkedin",
      "platform": "linkedin",
      "platformName": "LinkedIn Thought Leadership",
      "title": "Actionable Industry Insight",
      "content": "A thoughtful, professional narrative post formatted with generous line breaks, clear takeaways, and an engaging conversational question at the end to spark comments.",
      "characterLimit": 3000,
      "recommendedChannelService": "linkedin",
      "status": "draft"
    },
    {
      "id": "draft_instagram",
      "platform": "instagram",
      "platformName": "Instagram / Reels Caption",
      "title": "Visual Clip Companion Caption",
      "content": "Engaging caption suited for a video reel or carousel quote, with line breaks, emoji accents, and targeted hashtags.",
      "characterLimit": 2200,
      "recommendedChannelService": "instagram",
      "status": "draft"
    },
    {
      "id": "draft_threads",
      "platform": "threads",
      "platformName": "Threads / Casual Take",
      "title": "Casual Behind-The-Scenes Hot Take",
      "content": "Casual, unfiltered conversational take from the conversation that invites replies.",
      "characterLimit": 500,
      "recommendedChannelService": "threads",
      "status": "draft"
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: "You are an expert podcast marketer. Return only valid JSON adhering to the user's requested schema.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response for draft generation.");
  }

  const parsed = JSON.parse(content) as GeneratedEpisodeContent;
  return parsed;
}
