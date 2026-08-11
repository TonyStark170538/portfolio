# AI Portfolio Terminal — Build Log

## Phase: Build (Core) — Checkpoint 1

**Project:** AI Portfolio Terminal
**Repository:** TonyStark170538/portfolio
**Phase:** Build (Core)
**Estimated time:** 10 hours
**Goal:** Build and demonstrate one complete end-to-end agent run.

---

## 1. What I am building

The goal of this project is to build an AI-powered portfolio intelligence agent that helps an individual investor quickly understand current market conditions and how they may affect their portfolio.

For the MVP, I intentionally narrowed the scope to one core job:

> **Given a portfolio, generate a current market brief that explains relevant market conditions, portfolio outlook, investment considerations, and overall sentiment.**

The agent is not intended to execute trades, manage a brokerage account, or provide professional financial advice.

The original product specification defines the core flow as:

1. User opens the portfolio application.
2. User views their portfolio.
3. User requests an AI market brief.
4. Portfolio information is sent to the backend.
5. The backend creates a structured prompt.
6. Gemini retrieves current information using Google Search.
7. Gemini analyzes the portfolio and market context.
8. The backend validates the response.
9. The frontend displays the structured result.

This became the target for the Checkpoint 1 MVP.

---

## 2. Starting point

The project already had a full-stack foundation:

* React frontend
* TypeScript
* Tailwind CSS
* Vite
* Python/FastAPI backend
* Gemini API integration
* Google Search integration
* Structured AI responses
* Error/fallback handling
* Deployed frontend

The repository is organized into separate frontend and backend applications, with the backend responsible for communicating with Gemini and the frontend responsible for presenting the result.

The existing application already had the basic architecture required for the agent, so the focus of this phase was not to add more features. The focus was to make the **core loop reliable and demonstrable from beginning to end**.

---

## 3. MVP scope

### Included

For Checkpoint 1 I kept the following:

* Existing portfolio data
* Requesting an AI market brief
* Backend API request
* Gemini 2.5 Flash
* Live Google Search through Gemini
* Portfolio-aware analysis
* Structured JSON output
* Market summary
* Portfolio outlook
* Investment considerations
* Market sentiment
* Loading state
* Error/fallback state
* Frontend rendering of the result

### Deliberately excluded

I did not attempt to build:

* Brokerage integration
* Real-money trading
* Automatic buying/selling
* Automated portfolio management
* User authentication
* Multi-user support
* Historical portfolio analytics
* Cryptocurrency trading
* Tax optimization
* Real-time portfolio synchronization
* Database-backed portfolios
* Advanced portfolio risk scoring

These features are either explicitly outside the MVP specification or would add complexity without helping prove the core agent loop.

The existing specification also identifies brokerage integration, trading, authentication, historical analytics, and several other features as out of scope.

---

# 4. Build iteration

## Iteration 1 — Verify the existing architecture

### Goal

First I verified that the existing frontend/backend architecture could support the complete agent flow without introducing another framework or unnecessary infrastructure.

### What I checked

The intended architecture is:

```text
React Frontend
      ↓
FastAPI Backend
      ↓
Gemini API
      ↓
Google Search
      ↓
Structured JSON
      ↓
React Dashboard
```

This was already aligned with the product specification.

### Result

The architecture was suitable for the MVP.

Rather than rebuilding the application, I decided to keep the existing architecture and concentrate the work on making the core request reliable.

### Decision

**Keep the existing React + FastAPI + Gemini architecture.**

---

## Iteration 2 — Narrow the core agent job

The original project contains several possible future directions, including portfolio analytics, live prices, risk scoring, brokerage synchronization, and optimization.

I initially considered these as possible additions, but they were not necessary for Checkpoint 1.

I narrowed the agent to one question:

> "What is happening in the market right now, and what does it potentially mean for this portfolio?"

This made the success criteria much easier to test.

### Result

The agent only needs to successfully complete one useful loop:

```text
Portfolio
   ↓
Market research
   ↓
AI analysis
   ↓
Structured market brief
```

This reduced the amount of functionality that needed to be debugged simultaneously.

---

# 5. Connecting a real tool/data source

The most important external connection in the MVP is **Google Search through Gemini**.

The agent does not rely only on the model's stored knowledge. When generating the market brief, Gemini is configured to retrieve current information through Google Search.

This is important because the core value of the application depends on current market information.

The data flow is therefore:

```text
Static Portfolio Data
        +
Current Web Information
        ↓
      Gemini
        ↓
Portfolio-aware Market Brief
```

This satisfies the requirement that the MVP use a real external tool/data source.

---

# 6. Structured output

A major design decision was to avoid returning one large block of generated text.

Instead, the backend expects a structured response containing:

```json
{
  "summary": "...",
  "outlook": "...",
  "advice": [
    "...",
    "...",
    "..."
  ],
  "sentiment": "..."
}
```

The frontend then renders each field as a dedicated UI section.

This makes the output easier to validate and makes the result more useful than simply displaying raw model output.

---

# 7. What broke / problems found

## Problem 1 — External AI dependency

The market brief depends on the Gemini API being available.

If the API key is missing, the network request fails, or the service is unavailable, the main feature cannot perform its normal analysis.

### Change

I kept explicit error handling and fallback behavior instead of allowing the application to fail silently.

The backend checks for configuration problems and handles external request failures.

---

## Problem 2 — AI output cannot always be trusted to match the expected structure

A generative model can return unexpected output even when a structured format is requested.

This creates a problem for the frontend because the UI expects predictable fields.

### Change

The backend was designed to validate/parse the AI response before returning it to the frontend.

If the response cannot be processed correctly, the application uses a fallback rather than rendering potentially misleading data.

---

## Problem 3 — Live information introduces another failure point

Adding Google Search makes the market brief more useful, but it also adds an external dependency.

The request can potentially fail because of network problems or search/API availability.

### Change

I kept the live search step inside the AI workflow while adding failure handling around the external service.

This was preferable to removing live search because current information is part of the core product value.

---

## Problem 4 — Scope expansion

During development it was tempting to add features such as live stock prices, historical charts, portfolio risk scores, authentication, and brokerage connections.

These features could make the application look more complete, but they would make it harder to prove the basic agent works.

### Change

I cut these features from the Checkpoint 1 build.

The MVP is intentionally focused on proving one complete agent workflow rather than building a complete financial platform.

---

# 8. What I cut from the specification

The following were intentionally left out of the Checkpoint 1 implementation:

| Feature                             | Decision | Reason                                             |
| ----------------------------------- | -------- | -------------------------------------------------- |
| Brokerage integration               | Cut      | Not required for MVP                               |
| Real-time portfolio synchronization | Cut      | Adds infrastructure before core workflow is proven |
| Authentication                      | Cut      | Not needed for single-user demonstration           |
| Historical analytics                | Cut      | Does not contribute to the first end-to-end run    |
| Risk scoring                        | Cut      | Future feature, not necessary for market brief     |
| Live stock-price dashboard          | Cut      | Market research is sufficient for the MVP          |
| Portfolio optimization              | Cut      | Too broad for the first checkpoint                 |
| Trading functionality               | Cut      | Explicitly outside project scope                   |
| Database integration                | Cut      | Static portfolio data is sufficient for MVP        |

The important change was not removing these features permanently. They were moved behind the core workflow so that the first checkpoint could be completed with a smaller and more reliable system.

---

# 9. Current end-to-end flow

The successful MVP flow is:

```text
1. Open deployed AI Portfolio Terminal
              ↓
2. View portfolio
              ↓
3. Request market brief
              ↓
4. React sends portfolio to FastAPI
              ↓
5. FastAPI creates Gemini request
              ↓
6. Gemini performs live Google Search
              ↓
7. Gemini analyzes market + portfolio
              ↓
8. Backend parses structured response
              ↓
9. Frontend receives JSON
              ↓
10. Dashboard displays:
      - Market Summary
      - Portfolio Outlook
      - Investment Advice
      - Market Sentiment
```

The key requirement for this checkpoint is that the entire sequence completes without manually editing the result during the run.

---

# 10. MVP success criteria

The MVP is considered successful when I can perform the following without manual intervention:

* Open the deployed application.
* View the portfolio.
* Request a market brief.
* Trigger the backend request.
* Use the Gemini API.
* Use live Google Search information.
* Receive a structured response.
* Render the response in the frontend.
* Handle an external-service failure gracefully.

The core success condition is therefore:

> **One user request produces one complete, portfolio-aware market brief using live external information.**

---

# 11. Run capture plan

For the required approximately two-minute raw screen capture, I will record the complete workflow without editing the video.

The recording will show:

### Start

Open the deployed AI Portfolio Terminal.

### Step 1

Show the portfolio currently loaded in the application.

### Step 2

Request the AI market brief.

### Step 3

Show the loading/request state.

### Step 4

Allow the application to perform the backend → Gemini → Google Search workflow.

### Step 5

Show the completed structured result.

### Step 6

Briefly show the generated:

* Market Summary
* Portfolio Outlook
* Investment Advice
* Market Sentiment

The recording should be one continuous raw capture from request to result.

No manual copy/paste, editing of the AI response, or intermediate hand-editing should be used during the demonstration.

---

# 12. Evidence for Checkpoint 1

The submission will contain:

1. **Working agent**

   * AI Portfolio Terminal

2. **Build log**

   * This document

3. **Raw run capture**

   * Approximately two minutes
   * One successful end-to-end run
   * No editing

4. **Repository**

   * GitHub repository containing the implementation and specification

5. **Live application**

   * Deployed frontend

---

# 13. Current status

**Core architecture:** Complete

**Frontend:** Complete

**Backend:** Complete

**Gemini integration:** Complete

**Live search integration:** Complete

**Structured response:** Complete

**Error handling:** Implemented

**MVP scope:** Narrowed

**End-to-end run:** [TODO — verify and record]

**Raw screen capture:** [TODO — record successful run]

**Checkpoint 1:** [TODO — final verification]

---

# 14. Lessons learned

The main lesson from this build was that an agent does not need a large number of features to demonstrate useful behavior.

The most important part was getting one complete loop working reliably:

> **request → tool/data retrieval → reasoning → structured result**

I also learned that external tools improve the usefulness of an AI system but introduce additional failure modes. Because of this, validation and fallback behavior are part of the agent rather than optional extras.

For this checkpoint, reducing scope was also an important engineering decision. Instead of attempting authentication, brokerage integration, historical analytics, and portfolio optimization immediately, I focused on proving that the AI market research workflow works from the user's request through to the final UI.

The next development phase can build on this working core rather than trying to debug several new systems at once.

---

## Final Checkpoint 1 statement

The Checkpoint 1 MVP demonstrates a complete AI portfolio-intelligence workflow. A user can request a market brief, the system combines the user's portfolio with current web information retrieved through Google Search, Gemini analyzes the information, and the application presents the result as structured portfolio intelligence.

The MVP deliberately excludes advanced financial-platform features so that the core agent behavior can be demonstrated clearly and reliably.
