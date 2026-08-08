# AI Portfolio Terminal — Product Specification

## Project

AI Portfolio Terminal

### Capstone Track

FE4 — Open Project

AI Portfolio Terminal is an AI-powered portfolio intelligence platform that helps individual investors understand current market conditions and how they may affect their portfolio.

The application combines portfolio information, real-time web search, and generative AI to produce a structured market brief.

---

## Target User

The primary user is an individual investor who wants to quickly understand current market conditions and their potential impact on their portfolio without manually researching multiple financial news sources.

The application is designed for users who want a structured overview rather than a professional trading or financial management platform.

---

## Problem

Understanding how current market events affect an investment portfolio requires reading financial news, researching individual assets, and connecting different pieces of information.

This process can be time-consuming and difficult to structure.

AI Portfolio Terminal reduces this research effort by combining portfolio information with current web-based market information and generating a structured AI market brief.

---

## Core Flow

The main user flow is:

1. User opens AI Portfolio Terminal.
2. User views or enters their portfolio assets.
3. User requests an AI market brief.
4. The frontend sends the portfolio information to the FastAPI backend.
5. The backend creates a structured prompt for Gemini.
6. Gemini uses Google Search to retrieve current market information.
7. Gemini analyzes the portfolio and current market context.
8. The backend validates and returns structured JSON.
9. The frontend displays the result in dedicated dashboard components.

### Data Flow

User
↓
React Frontend
↓
FastAPI REST API
↓
Gemini API
↓
Google Search
↓
Structured JSON
↓
React Dashboard

---

## Core Screens

### 1. Portfolio Dashboard

The main application screen where users can view their portfolio and access the AI market analysis.

The dashboard provides the primary entry point into the application.

### 2. AI Market Brief

The main AI-powered feature.

The result is displayed as structured sections rather than raw AI text:

- Market Summary
- Portfolio Outlook
- Investment Advice
- Market Sentiment

### 3. Error / Fallback States

The application provides user feedback when:

- The backend is unavailable.
- The Gemini API cannot be reached.
- The AI response cannot be parsed.
- Required configuration is missing.

---

## AI Feature

The primary AI feature is the AI-generated market brief.

Gemini receives information about the user's portfolio and current market context.

The model uses Google Search to retrieve current information before generating its response.

The backend requests a structured response containing:

- Market summary
- Portfolio outlook
- Investment advice
- Market sentiment

The frontend renders this structured response through typed UI components.

The AI output is intended to provide informational analysis and should not be treated as guaranteed financial advice.

---

## Data Sources

### Portfolio Data

Portfolio assets are currently provided by the application and are not connected to a brokerage account.

### Market Information

Current market information is retrieved through Google's Search Tool through the Gemini API.

### AI Processing

Gemini processes the portfolio information and current market information to generate the market brief.

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

### AI

- Google Gemini 2.5 Flash
- Google Search Tool

### Deployment

- Vercel for the frontend
- FastAPI backend deployment

---

## Architecture

The application uses a frontend/backend architecture.

The React frontend is responsible for the user interface, portfolio presentation, loading states, and rendering structured AI results.

The FastAPI backend acts as the application API layer. It receives requests from the frontend, communicates with Gemini, processes the response, and returns structured data.

The Gemini API provides the AI reasoning layer and Google Search provides current web information.

Keeping the AI API interaction on the backend prevents the Gemini API key from being exposed in the frontend.

---

## Success Criteria

The MVP is successful when a user can:

1. Open the deployed application.
2. View their portfolio.
3. Request a market brief.
4. Receive an AI-generated analysis.
5. See current market information incorporated into the analysis.
6. View the result in structured UI components.
7. Receive a graceful fallback when an external service fails.

---

## Error Handling

The application should gracefully handle:

- Missing API keys
- Backend failures
- Network failures
- Invalid Gemini responses
- JSON parsing errors
- Unexpected AI output

When the AI response cannot be processed correctly, the application should avoid displaying misleading information and provide a safe fallback.

---

## Out of Scope

The following features are explicitly outside the scope of the current capstone:

- Brokerage account integration
- Real-money trading
- Automatic buying or selling
- Automated portfolio management
- Guaranteed investment recommendations
- Professional financial advisory services
- User authentication
- Multi-user collaboration
- Real-time portfolio synchronization
- Historical portfolio performance analytics
- Automated tax optimization
- Cryptocurrency trading
- Financial transactions

These features may be considered in future versions but are not required for the capstone MVP.

---

## Current Limitations

- Portfolio data is currently static.
- The application depends on the Gemini API.
- Market information depends on external search availability.
- The system does not connect directly to brokerage accounts.
- AI-generated information requires user verification.
- The application is not intended to provide professional financial advice.

---

## Future Improvements

Potential future improvements include:

- User authentication
- Database-backed portfolios
- Brokerage integrations
- Live market prices
- Historical portfolio analytics
- Portfolio risk scoring
- Interactive financial charts
- AI-powered portfolio comparisons
- Cloud deployment automation

These improvements are intentionally outside the current MVP scope.

---

## Product Goal

The goal of AI Portfolio Terminal is to demonstrate how modern frontend engineering, backend APIs, cloud-ready architecture, real-time web search, and generative AI can be combined into a practical software product.

The project focuses on turning raw market information into structured, understandable portfolio intelligence through a real working application.