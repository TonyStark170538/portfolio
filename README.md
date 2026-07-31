# AI Portfolio Terminal

An AI-powered portfolio intelligence platform that combines modern frontend engineering, cloud-ready architecture, and artificial intelligence to help users better understand financial portfolios.

Live Demo:
https://portfolio-chi-navy-93.vercel.app

---

## Project Overview

AI Portfolio Terminal is a full-stack web application that provides intelligent portfolio analysis using Google's Gemini AI.

Instead of manually reading financial news and researching market trends, users receive an AI-generated market brief tailored to their portfolio. The application combines portfolio data, AI reasoning, and real-time web search to generate structured investment insights.

The project was built to explore the intersection of software engineering, artificial intelligence, cloud technologies, and user experience while creating a practical application that solves a real problem.

---

## Features

- AI-generated market briefs
- Portfolio-specific investment insights
- Structured AI responses
- Real-time Google Search integration through Gemini
- Modern responsive React interface
- FastAPI backend
- Error handling and graceful fallbacks
- Cloud-ready architecture

---

## Technology Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- Vite

### Backend

- Python
- FastAPI
- HTTPX

### Artificial Intelligence

- Google Gemini 2.5 Flash
- Google Search Tool

### Deployment

- Vercel (Frontend)
- FastAPI Backend

---

## Architecture

```
                React Frontend
                       │
                       │ REST API
                       ▼
                FastAPI Backend
                       │
                       ▼
                Gemini 2.5 Flash
                       │
              Google Search Tool
                       │
             Structured JSON Response
                       │
                       ▼
          React Components & Dashboard
```

---

## AI Integration

The AI functionality is implemented on the backend using Google's Gemini API.

When a user requests a market brief:

1. Portfolio assets are collected.
2. The backend generates a prompt describing the portfolio.
3. Gemini performs a live Google Search.
4. The AI returns structured JSON containing:

- Market Summary
- Portfolio Outlook
- Investment Advice
- Market Sentiment

The frontend renders this structured data as dedicated UI components rather than displaying raw AI text.

This approach produces predictable, typed responses that are easier to validate and display.

---

## Example AI Response

```json
{
  "summary": "Technology stocks remained strong following positive earnings reports.",
  "outlook": "The portfolio may benefit from continued AI sector growth.",
  "advice": [
    "Monitor market volatility",
    "Review portfolio diversification",
    "Watch upcoming earnings"
  ],
  "sentiment": "bullish"
}
```

---

## Project Structure

```
frontend/
│
├── components/
├── pages/
├── hooks/
├── services/
└── App.tsx

backend/
│
├── routes/
├── services/
├── ai/
├── models/
└── main.py
```

---

## Running Locally

Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

Install frontend

```bash
cd frontend
npm install
npm run dev
```

Install backend

```bash
cd backend

python -m venv venv

source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

## Environment Variables

Create a `.env` file inside the backend directory.

```
GEMINI_API_KEY=your_api_key_here
```

Never commit API keys to GitHub.

---

## Error Handling

The application includes several safety mechanisms:

- Missing API key detection
- Network request error handling
- Invalid AI response fallback
- JSON parsing fallback
- Neutral sentiment fallback when AI output cannot be parsed

These ensure the application continues functioning even when external services fail.

---

## Accessibility

The application follows accessibility best practices including:

- Semantic HTML
- Keyboard navigation
- Responsive layouts
- High contrast typography
- Accessible buttons
- Mobile-friendly design

---

## Performance

Optimizations include:

- Lazy rendering
- Optimized images
- Component reuse
- Efficient React state management
- Lightweight API responses

---

## Testing

The project includes component testing using Vitest and React Testing Library.

Tests cover:

- Component rendering
- User interaction
- AI response rendering

---

## Current Limitations

- No authentication
- Static portfolio data
- No brokerage integration
- No historical analytics
- AI depends on external Gemini API availability

---

## Future Improvements

- User authentication
- Database integration
- Portfolio synchronization
- Live stock prices
- Interactive analytics dashboard
- Portfolio risk scoring
- Cloud deployment automation
- AI portfolio optimization
- Historical performance tracking

---

## Deployment

Frontend:
- Vercel

Backend:
- FastAPI

Deployment Checklist

- Frontend deployed
- Backend deployed
- Environment variables configured
- HTTPS enabled
- Responsive layout verified
- Error handling implemented
- AI integration tested
- Mobile compatibility verified

---

## Rollback Strategy

Every deployment is connected to GitHub.

If a release introduces issues, the application can be rolled back by:

- Redeploying the previous successful deployment.
- Reverting the Git commit.
- Triggering a new deployment from the corrected branch.

---

## Lessons Learned

Building this project demonstrated that integrating AI into production software requires much more than calling an API.

Designing structured responses, handling failures gracefully, creating responsive interfaces, and maintaining clean software architecture were as important as the AI integration itself.

The project strengthened my understanding of:

- Software architecture
- AI application design
- Frontend engineering
- Backend API development
- Error handling
- Production deployment

---

## Author

**Toni**

Software Engineering Student

Focused on:

- Cybersecurity
- Artificial Intelligence
- Cloud Computing
- Modern Software Engineering
