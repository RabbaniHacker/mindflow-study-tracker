import { GoogleGenAI, Type } from "@google/genai";
import { ResourceType, AIAnalysis } from "../types";

const getAiClient = () => {
  // In a real app, error handling for missing key would be more robust
  const apiKey = process.env.API_KEY || '';
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
 * Uses Gemini to "guess" content based on URL structure and common knowledge if actual scraping isn't available.
 */
export const analyzeUrlMetadata = async (url: string) => {
  try {
    const ai = getAiClient();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this URL: ${url}. 
      Provide:
      1. A likely title.
      2. A brief description (max 2 sentences).
      3. A resource type (Video, Reading, Practice, or Other).
      4. 3 relevant tags.
      5. A difficulty level (Beginner, Intermediate, or Advanced) based on the likely topic complexity.
      6. A estimated length/duration (Short (<10m), Medium (10-30m), or Long (>30m)).
      Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Video', 'Reading', 'Practice', 'Other'] },
            difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
            length: { type: Type.STRING, enum: ['Short (<10m)', 'Medium (10-30m)', 'Long (>30m)'] },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['title', 'description', 'type', 'tags', 'difficulty', 'length']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("AI Metadata Error:", error);
    // Fallback
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
};