import express from "express";
import multer from "multer";
import cors from "cors";
import Tesseract from "tesseract.js";
import dotenv from "dotenv";
import { PDFParse } from "pdf-parse";
import { GoogleGenAI } from "@google/genai";

// server.js functioning

/*
This Express server:

1. Accepts a resume PDF upload

2. Tries to extract text from it using:

3. pdf-parse (fast, structured)

4. fallback to OCR using Tesseract (slow, CPU-heavy)

5. Sends extracted text to Gemini LLM

6. Forces Gemini to return strict JSON

7. Returns an ATS-style resume analysis
*/

// multi stage pipeline ----> Client → Upload → Parse PDF → OCR fallback → LLM → JSON → Client

// function to extract text from image using tesseract

async function extractTextFromImage(imageBuffer) {
  try {
    console.log("Attempting OCR extraction....");

    const result = await Tesseract.recognize(
      // tesseract is CPU bound One request = 1–3 seconds , 10 concurrent uploads = server death use Worker queue (BullMQ / RabbitMQ) for scaling
      imageBuffer,
      "eng",
      {
        logger: (m) => console.log(m),
      },
    );

    return (result?.data?.text || "").trim();
  } catch (error) {
    console.error("OCR error : ", error.message);
    throw error;
  }
}

dotenv.config();
const port = process.env.PORT || 1000;

// Gemini Setup

const apiKey = process.env.API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

// ask gemini and force JSON o/p

async function askGeminiforJSON(prompt) {
  if (!genAI) {
    throw new Error(
      "Missing Gemini API key. Set API_KEY in your .env file and restart the server.",
    );
  }
  const jsonOnlyPrompt = `You are an API. Return ONLY valid JSON. No markdown. No backticks. No extra explanation.${prompt}`;
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: jsonOnlyPrompt,
  });

  const raw =
    (typeof result?.text === "function" ? result.text() : result?.text) ||
    (typeof result?.response?.text === "function"
      ? result.response.text()
      : "");

  // try JSON parse directly

  try {
    return JSON.parse(raw);
  } catch {
    // extract JSON block if Gemini adds extra text
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first === -1 || last === -1) {
      throw new Error("Gemini did not return JSON.");
    }
    const cleaned = raw.slice(first, last + 1);
    return JSON.parse(cleaned);
  }
}

const app = express();

// upload the file

const upload = multer({ storage: multer.memoryStorage() });

// middleware

app.use(
  express.static("public"), // serve frontend files
  express.json(),
);

app.use(cors());

app.get("/", function (req, res) {
  res.json({ message: "this message is from server" });
});

app.post("/resume/upload", upload.single("resume"), async function (req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "No resume file uploaded." });
  }

  const targetRole = req.body.targetRole || "Software Developer(Fresher)";

  //  3) Extract text from PDF

  console.log("Extracting text from PDF...");
  let resumeText = "";

  try {
    const parser = new PDFParse({ data: req.file.buffer });
    const pdfData = await parser.getText();
    await parser.destroy();

    resumeText = (pdfData.text || "").trim();
    console.log(` Extracted ${resumeText.length} characters from PDF`);
  } catch (pdfError) {
    console.error(" PDF extraction failed:", pdfError.message);
  }

  //  4) If PDF text extraction failed, try OCR
  if (!resumeText) {
    console.log(" PDF text is empty. Attempting OCR...");

    try {
      resumeText = await extractTextFromImage(req.file.buffer);

      if (!resumeText || resumeText.trim().length === 0) {
        return res.status(400).json({
          error:
            "Could not extract text from PDF. The file might be an image-based PDF without text layer, or the OCR failed. Please try a text-based PDF.",
        });
      }

      console.log(` OCR extracted ${resumeText.length} characters`);
    } catch (ocrError) {
      return res.status(400).json({
        error:
          "Could not extract text from PDF using OCR. Error: " +
          ocrError.message,
      });
    }
  }

  //  Final check
  if (!resumeText || resumeText.trim().length < 50) {
    return res.status(400).json({
      error:
        "Extracted text is too short or empty. Please upload a valid resume PDF.",
    });
  }

  //  5) Ask Gemini to analyze resume
  console.log(" Sending to Gemini for analysis...");

  const prompt = `
    Analyze this resume for the target role: "${targetRole}"

    Return JSON in EXACT shape:
    {
    "atsScore": number (0-100),
    "strengths": ["..."],
    "weakAreas": ["..."],
    "missingSkills": ["..."],
    "projectGaps": ["..."],
    "quickFixes": ["..."],
    "oneLineVerdict": "..."
    }

    Rules:
    - Be beginner-friendly.
    - Be realistic (no fake praise).
    - Mention projects/deployment/GitHub if missing.

    Resume Text:
    """
    ${resumeText}
    """
    `;

  let analysis;
  try {
    analysis = await askGeminiforJSON(prompt);
    console.log(" Analysis complete!");
  } catch (err) {
    return res.status(500).json({
      error: "Gemini analysis failed. " + (err?.message || "Unknown error"),
    });
  }

  //  6) Return response
  res.json({
    targetRole,
    fileName: req.file.originalname,
    extractedChars: resumeText.length,
    analysis,
  });
});

app.listen(port, function () {
  console.log(`App is running at port : ${port}`);
});
