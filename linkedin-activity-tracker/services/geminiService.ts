
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A simple check, though the environment should have it.
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getActivityDetails = async (userName: string, date: string, count: number): Promise<string> => {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC' // Ensure date is not shifted
  });
  
  const activityLevelDescription = count > 7 ? 'very high' : count > 4 ? 'high' : count > 1 ? 'moderate' : 'low';

  const prompt = `
    You are a LinkedIn productivity analyst.
    For a user named "${userName}", describe their plausible LinkedIn activity on ${formattedDate}.
    Their activity level was "${activityLevelDescription}" with ${count} significant actions.
    Be creative and specific, mentioning things like posts, comments, connections, or skill endorsements.
    The summary should be one or two professional-sounding sentences.
    Do not repeat the user's name or the date in your response.
    Focus on the professional actions taken.
    Example: "Published a new article on future of AI and engaged with several comments from industry peers."
    Another Example: "Connected with five new professionals in the marketing sector and endorsed skills for colleagues."
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to generate activity details from Gemini API.");
  }
};
