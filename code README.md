# 🧠 MindFlow - AI Study Tracker

MindFlow is a personalized, AI-powered study resource tracker designed to help students organize courses, track progress, and generate AI summaries and flashcards from learning materials.

## ✨ Features

- **🤖 AI Integration**: Uses Google Gemini to automatically analyze URLs, guess difficulty levels, and generate summaries/flashcards.
- **📋 Kanban Boards**: Organize resources by status (To Do, In Progress, Completed).
- **🤝 Collaboration**: Share boards with peers via email invitations with specific permissions (Viewer/Editor).
- **🎨 Modern UI**: Fully responsive Dark Mode interface built with Tailwind CSS.
- **🔐 Authentication**: Secure Sign-up and Login flow (Simulated).
- **🔍 Smart Filters**: Filter resources by type, difficulty, length, and tags.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **AI**: Google Gemini API (@google/genai)

## 🚀 Getting Started

1. Clone the repo
2. `npm install`
3. Create a `.env` file with `VITE_API_KEY=your_gemini_key`
4. `npm run dev`