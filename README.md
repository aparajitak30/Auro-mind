# AI-Assisted Mental Health Support Web Application

A full-stack application featuring a React frontend, Node.js backend, and a Python FastAPI ML microservice for emotion and risk detection.

## Project Structure

- `/frontend` - React Vite application (UI, Chat, Dashboard)
- `/backend` - Node.js Express API (Auth, DB Models, Chat Routing)
- `/ml-service` - Python FastAPI (Transformers for text emotion, Librosa/CNN for voice emotion)

## Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- MongoDB (running locally or a MongoDB Atlas URI)

## 🚀 Setup & Execution Steps

### 1. Start MongoDB
Ensure MongoDB is running locally on port `27017` or update the `MONGODB_URI` in `backend/.env`.

### 2. Start the ML Microservice (Python)
The ML service handles AI predictions. It will download the Hugging Face model on first run.

```bash
cd ml-service
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python main.py
```
*Runs on http://localhost:8000*

### 3. Start the Node.js Backend
The backend handles user authentication and routes requests to the ML service.

```bash
cd backend
npm install
npm run dev
```
*Runs on http://localhost:5000*

### 4. Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Runs on http://localhost:3000*

## 🧠 ML Models Explanation
- **Text Emotion**: Uses `j-hartmann/emotion-english-distilroberta-base` via Hugging Face.
- **Voice Emotion**: Scaffolding for a CNN model using MFCC features via `librosa`. A placeholder fallback is provided so the app runs even before you train the model with RAVDESS data.

## 🚢 Deployment Instructions

1. **Database**: Use MongoDB Atlas for cloud database hosting.
2. **ML Microservice**: Deploy via Docker to Google Cloud Run or AWS ECS.
   - Requires a machine with sufficient memory for Transformer models (minimum 2GB RAM).
3. **Backend**: Deploy Node.js server to Heroku, Render, or Railway. Ensure `.env` vars are set in the cloud provider.
4. **Frontend**: Build using `npm run build`. Deploy the `/dist` folder to Vercel, Netlify, or Firebase Hosting.

## ⚠️ Ethical Considerations & Disclaimers
This tool uses predictive AI and is NOT a substitute for professional mental health care. Critical keyword alerts are implemented, but all users should be presented with standard hotline numbers upon signup.
