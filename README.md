# Resume Analyzer (ATS-Style) using Gemini AI

A full-stack Node.js application that analyzes resume PDFs and provides ATS-style feedback using Google Gemini. The system extracts text from resumes, falls back to OCR for scanned PDFs, and returns structured insights such as ATS score, strengths, skill gaps, and actionable improvements.

---

## 📌 Project Overview

This project implements a multi-stage resume analysis pipeline designed for students and freshers:

Client → File Upload → PDF Text Extraction → OCR Fallback → Gemini AI → JSON Analysis

It demonstrates backend engineering concepts such as file uploads, text extraction, OCR handling, LLM integration, and defensive JSON parsing.

---

## ✨ Features

- Upload resume PDFs via a simple web interface
- Extract text from text-based PDFs using `pdf-parse`
- OCR fallback using Tesseract for image-based PDFs
- Resume analysis using Google Gemini LLM
- Forces Gemini to return **strict JSON output**
- ATS-style scoring and improvement suggestions
- Beginner-friendly feedback for students
- Single-page frontend served from Express

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- Multer (file uploads)
- pdf-parse (PDF text extraction)
- Tesseract.js (OCR fallback)
- Google Gemini (`@google/genai`)
- dotenv
- CORS

### Frontend
- HTML
- CSS
- Vanilla JavaScript (Fetch API)

### Tools
- Git & GitHub
- VS Code
- Postman (API testing)

---

## 📁 Project Structure
```
ATS/
│
├── public/
│ └── index.html # Frontend UI
│
├── server.js # Express server & main logic
├── geminiApi.js # Standalone Gemini API test script
├── .env # Environment variables
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```
---

## ⚙️ Installation & Setup

### 1️⃣ Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Google Gemini API key

### 2️⃣ Clone the repository
```bash
git clone https://github.com/Arnav5005/Application-tracking-system.git
cd Application-tracking-system
