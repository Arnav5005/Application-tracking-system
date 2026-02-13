import express from "express"
import multer from "multer"
import cors from "cors"
import tesseract from "tesseract.js"
import dotenv from "dotenv"
import {pdfParser} from "pdf-parse"
import {GoogleGenAI} from "@google/genai"

dotenv.config()

const port=process.env.PORT || 1000

const server=express()

server.listen(port, function(){
    console.log(`App is running at port : ${port}`)
})