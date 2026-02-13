import {GoogleGenAI} from "@google/genai";

const ai = new GoogleGenAI({apiKey:"AIzaSyAVIrurYnMkR-YH45cpAHtm_N3pPSgXWpQ"});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Explain how AI works in a few words",
  });
  console.log("**********************")
  console.log(response.text);
}

await main();