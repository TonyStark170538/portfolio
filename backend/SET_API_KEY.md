# Setting your OpenAI API Key

The AI Market Brief feature uses ChatGPT (gpt-4o-mini) with web search.

## Step 1 — Get a free API key
1. Go to: https://platform.openai.com
2. Sign up with your Google or email account
3. Go to "API Keys" in the left menu → click "Create new secret key"
4. Copy the key (starts with sk-)

New accounts get $5 in free credits — enough for hundreds of market briefs.

## Step 2 — Set it in your terminal (before starting the backend)

In the backend terminal, run this BEFORE `uvicorn app.main:app --reload`:

```powershell
$env:OPENAI_API_KEY = "sk-YOUR-KEY-HERE"
```

Then start the backend as normal:
```powershell
uvicorn app.main:app --reload
```

Note: You must set the variable in the SAME terminal session as uvicorn.
It resets when you close the terminal — just set it again next time.

## Optional — make it permanent (never type it again)
1. Press Win + S, search "Environment Variables"
2. Click "Edit the system environment variables"
3. Click "Environment Variables..." button
4. Under "User variables" click "New"
5. Variable name:  OPENAI_API_KEY
   Variable value: sk-YOUR-KEY-HERE
6. Click OK — restart your terminal — done forever
