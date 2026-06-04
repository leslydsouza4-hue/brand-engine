import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.AI_INTEGRATIONS_GEMINI_BASE_URL) {
  throw new Error(
    "AI_INTEGRATIONS_GEMINI_BASE_URL must be set. Did you forget to provision the Gemini AI integration?",
  );
}

if (!process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
  throw new Error(
    "AI_INTEGRATIONS_GEMINI_API_KEY must be set. Did you forget to provision the Gemini AI integration?",
  );
}

export const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export type GeminiImageModel = "gemini-2.5-flash-image" | "gemini-3-pro-image-preview";

export async function generateImage(
  prompt: string,
  model: GeminiImageModel = "gemini-2.5-flash-image",
  options?: {
    aspectRatio?: string;
    referenceImages?: { data: string; mimeType: string }[];
  }
): Promise<{ b64_json: string; mimeType: string }> {
  // Reference images (if any) come first so the model conditions on them,
  // followed by the text prompt.
  const parts: Array<
    | { inlineData: { data: string; mimeType: string } }
    | { text: string }
  > = [];
  for (const ref of options?.referenceImages ?? []) {
    parts.push({ inlineData: { data: ref.data, mimeType: ref.mimeType } });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      ...(options?.aspectRatio
        ? { imageConfig: { aspectRatio: options.aspectRatio } }
        : {}),
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  return {
    b64_json: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || "image/png",
  };
}

export async function editImage(
  prompt: string,
  inputB64: string,
  inputMimeType: string = "image/png",
  model: GeminiImageModel = "gemini-2.5-flash-image"
): Promise<{ b64_json: string; mimeType: string }> {
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: inputB64, mimeType: inputMimeType } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  return {
    b64_json: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || "image/png",
  };
}
