
import { GoogleGenAI, Type } from "@google/genai";
import { MENU_ITEMS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getBaristaRecommendation = async (userInput: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userInput,
    config: {
      systemInstruction: `You are a sophisticated and friendly AI Barista for "Aura Brew". 
      Recommend drinks from our menu based on the user's mood, taste preferences, or time of day.
      Current Menu: ${JSON.stringify(MENU_ITEMS)}
      Keep responses brief and inviting. Focus on flavor profiles.`,
    },
  });
  return response.text;
};

export const visualizeCustomDrink = async (description: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `A photorealistic, highly detailed close-up of a unique gourmet coffee drink: ${description}. Soft natural lighting, aesthetic coffee shop background, professional food photography.` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const findNearbyShops = async (locationStr: string, lat?: number, lng?: number) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest',
    contents: `Find Aura Brew coffee shop locations near ${locationStr}.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: lat && lng ? { latitude: lat, longitude: lng } : undefined
        }
      }
    }
  });
  
  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};
