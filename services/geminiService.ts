import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { ComicScript } from "../types";

const SCRIPT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";

// Lazy initialization to allow app to load without key (for setup)
let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    // process.env.API_KEY is injected by Vite at build time
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("API Key is missing. Please create a .env file in the root directory with API_KEY=your_key_here");
    }

    // We initialize here so we can catch the error if the key is missing when the user clicks generate,
    // rather than crashing the whole app on load.
    ai = new GoogleGenAI({ apiKey: apiKey });
  }
  return ai;
};

const comicSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A catchy title for the comic strip.",
    },
    panels: {
      type: Type.ARRAY,
      description: "An array of exactly 4 panels for the comic strip.",
      items: {
        type: Type.OBJECT,
        properties: {
          panel_number: { type: Type.INTEGER },
          description: {
            type: Type.STRING,
            description: "A narrative description of what happens in this panel.",
          },
          visual_prompt: {
            type: Type.STRING,
            description: "A detailed visual description for an AI image generator. Include details about style (comic book style), characters, setting, lighting, and composition. Ensure it describes the scene visually without focusing on text.",
          },
          dialogue: {
            type: Type.STRING,
            description: "Spoken dialogue for a character, if any. Keep it brief.",
            nullable: true,
          },
          character: {
            type: Type.STRING,
            description: "The name of the character speaking.",
            nullable: true,
          },
          caption: {
            type: Type.STRING,
            description: "Narrator caption text, if any (e.g., 'Meanwhile...', 'Later that day...').",
            nullable: true,
          },
        },
        required: ["panel_number", "description", "visual_prompt"],
      },
    },
  },
  required: ["title", "panels"],
};

export const generateComicScript = async (prompt: string): Promise<ComicScript> => {
  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: SCRIPT_MODEL,
      contents: `Create a funny or interesting 4-panel comic strip script based on this idea: "${prompt}". 
      Ensure the visual prompts are highly descriptive for an image generation model, specifying a consistent comic book art style (e.g., 'vibrant comic book style, thick outlines, cel shaded').`,
      config: {
        responseMimeType: "application/json",
        responseSchema: comicSchema,
        systemInstruction: "You are a creative comic book writer. You excel at breaking down stories into 4 visual panels with punchy dialogue.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No script generated");
    
    return JSON.parse(text) as ComicScript;
  } catch (error) {
    console.error("Error generating script:", error);
    throw error;
  }
};

export const generatePanelImage = async (visualPrompt: string): Promise<string> => {
  try {
    const client = getAiClient();
    const finalPrompt = `${visualPrompt}, high quality, comic book masterpiece, 2d vector art style, flat colors, thick ink lines`;
    
    const response: GenerateContentResponse = await client.models.generateContent({
      model: IMAGE_MODEL,
      contents: finalPrompt,
      config: {
        // We do not set responseMimeType for image models unless we want JSON metadata, 
        // but here we want the actual image in the response parts.
      }
    });

    // Iterate through parts to find the image
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating panel image:", error);
    throw error;
  }
};