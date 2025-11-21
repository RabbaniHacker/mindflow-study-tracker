import { GoogleGenAI, Type } from "@google/genai";
import { ResourceType, AIAnalysis } from "../types";

const getAiClient = () => {
  // FIX: In Vite (Client-side), we must use import.meta.env.VITE_API_KEY
  // We cast to 'any' to avoid TypeScript errors if types aren't perfectly set up
  const apiKey = (import.meta as any).env.VITE_API_KEY || '';
  
  if (!apiKey) {
    console.error("CRITICAL: VITE_API_KEY is missing in .env file");
  }
  
  return new GoogleGenAI({ apiKey });
};

// Helper to identify resource type from URL if possible
const inferTypeFromUrl = (url: string): ResourceType => {
  if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo')) return 'Video';
  if (url.includes('medium.com') || url.includes('blog') || url.includes('article')) return 'Reading';
  if (url.includes('leetcode') || url.includes('hackerrank') || url.includes('quiz')) return 'Practice';
  return 'Other';
};

/**
 * Analyzes a URL to extract metadata (Title, Description, Tags, Difficulty, Length)
 * Uses Gemini with Google Search Grounding to find actual page content.
 */
export const analyzeUrlMetadata = async (url: string) => {
  try {
    const ai = getAiClient();
    
    // We use the Google Search tool to allow the model to "visit" the URL via search results
    // to get the actual title and description.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        I have a link to a study resource: ${url}

        Please use Google Search to find the actual Title and a brief Description of this content.
        
        1. If it is a YouTube video, get the exact video title.
        2. Guess the Difficulty Level (Beginner, Intermediate, Advanced).
        3. Estimate the Length (Short <10m, Medium 10-30m, Long >30m).
        4. Suggest 3 relevant tags.

        Return ONLY a valid JSON object with this specific structure:
        {
          "title": "The actual title found",
          "description": "A short summary",
          "type": "Video" | "Reading" | "Practice" | "Other",
          "difficulty": "Beginner" | "Intermediate" | "Advanced",
          "length": "Short (<10m)" | "Medium (10-30m)" | "Long (>30m)",
          "tags": ["tag1", "tag2"]
        }
      `,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    let text = response.text || "{}";
    
    // Clean up potential markdown formatting from the AI response (e.g. ```json ... ```)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Attempt to find the JSON object if there is extra text around it
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.substring(jsonStart, jsonEnd + 1);
    }

    return JSON.parse(text);

  } catch (error) {
    console.error("AI Metadata Error - Falling back to basic data:", error);
    // Fallback if AI fails
    return {
      title: url,
      description: "Manually added resource",
      type: inferTypeFromUrl(url),
      difficulty: 'Intermediate',
      length: 'Medium (10-30m)',
      tags: ["study"]
    };
  }
};

/**
 * Generates deep insights (Summary, Key Points, Flashcards)
 */
export const generateStudyInsights = async (title: string, url: string, description: string): Promise<AIAnalysis> => {
  try {
    const ai = getAiClient();

    const prompt = `
      I am studying the following resource:
      Title: ${title}
      URL: ${url}
      Description: ${description}

      Please act as a tutor. 
      1. Generate a concise summary of what this topic likely covers.
      2. Extract 3-5 key learning points.
      3. Create 3 revision flashcards (Question/Answer) based on the likely content.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      summary: result.summary || "Analysis unavailable.",
      keyPoints: result.keyPoints || [],
      flashcards: result.flashcards || [],
      lastUpdated: new Date().toISOString()
    };
  } catch (e) {
    console.error("AI Insights Error:", e);
    throw e;
  }
};
