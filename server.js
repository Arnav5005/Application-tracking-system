import express from "express"
import multer from "multer"
import cors from "cors"
import Tesseract from "tesseract.js"
import dotenv from "dotenv"
import {pdfParser} from "pdf-parse"
import {GoogleGenAI} from "@google/genai"


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

async function TextExtractor(imageBuffer) {
    try{
        console.log("Attempting OCR extraction....")

        const result=await Tesseract.recognize( // tesseract is CPU bound One request = 1–3 seconds , 10 concurrent uploads = server death use Worker queue (BullMQ / RabbitMQ) for scaling
            imageBuffer,
            "eng",
            {
                logger: m=>console.log(m)
            }
        )
    }
    catch(error){
        console.error("OCR error : ",error.message)
    }
}

dotenv.config()
const port=process.env.PORT || 1000

// Gemini Setup

const genAI=new GoogleGenAI(process.env.API_KEY)

// ask gemini and force JSON o/p

async function askGeminiforJSON(prompt) {
    const model=genAI.getGenerativeModel({model:"gemini-2.5-flash"});
    const jsonOnlyPrompt=`You are an API. Return ONLY valid JSON. No markdown. No backticks. No extra explanation.${prompt}`;
    const result=await model.generateContent(jsonOnlyPrompt);
    const raw=result.response.text();

    // try JSON parse directly

    try{
        return JSON.parse(raw)
    }
    catch{
        // extract JSON block if Gemini adds extra text
        const first=raw.indexOf("{");
        const last=raw.lastIndexOf("}");
        if(first===-1 || last===-1){
            throw new Error("Gemini did not return JSON.")
        }
        const cleaned=raw.slice(first,last+1);
        return JSON.parse(cleaned)
    }
}

const app=express()

// upload the file

const upload=multer()

app.get("/",function(req,res){
    res.json({message: "this message is from server"})
})
app.post("")

app.listen(port, function(){
    console.log(`App is running at port : ${port}`)
})