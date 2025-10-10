# 🔧 Debug Guide: Why OpenAI API Calls Aren't Showing

## 🎯 **Problem Identified**

You're not seeing OpenAI API calls in the usage dashboard because the workflow isn't reaching the LLM classification step. Here's why:

## 🔍 **Root Cause Analysis**

### 1. **Keywords Not Initialized** ❌
The system needs therapy keywords in the database to detect mentions. Without keywords, no matches are found, so the LLM is never called.

### 2. **Workflow Flow**
```
Episode Processing → Get Keywords → Find Matches → LLM Analysis
                                        ↑
                                  STOPS HERE if no keywords
```

## ✅ **Solution Steps**

### Step 1: Start Development Server
```bash
npm run dev
```

### Step 2: Initialize Keywords
```bash
# Option A: Use the script
node scripts/initialize-keywords.js

# Option B: Direct API call
curl -X POST http://localhost:3000/api/config/keywords/initialize
```

### Step 3: Verify Keywords
Visit: `http://localhost:3000/dashboard/config`

You should see 130+ keywords organized in categories like:
- 🎯 Core Therapy
- 🧠 Mental Health  
- 💊 Treatment
- etc.

### Step 4: Test Processing
1. Go to `/dashboard/episodes/[episodeId]`
2. Click "Start Mention Detection"
3. Watch the console logs (browser dev tools)

## 🧪 **Debug Logs Added**

The system now shows detailed logging:

```
🔍 Fetching active keywords...
📝 Found 67 active keywords: ['terapia', 'psicologo', ...]
🎯 Detecting keyword matches in 245 segments...
✅ Found 3 keyword matches
🤖 Starting LLM classification phase...
🤖 Classifying fragment 1/3: "Mi psicólogo me ayudó..."
🤖 OpenAI Request: { endpoint: '...', model: 'gpt-4o-mini', ... }
✅ OpenAI Response: { hasChoices: true, contentLength: 156 }
```

## 📊 **Expected OpenAI Usage**

Once keywords are initialized and episodes are processed:
- **Model**: gpt-4o-mini
- **Tokens per fragment**: ~200-400 tokens
- **Fragments per episode**: 1-10 (depends on content)
- **Total cost**: ~$0.01-0.05 per episode

## 🚨 **If Still No API Calls**

1. **Check Keywords**: Make sure active keywords exist
2. **Check Transcript**: Episode needs a transcript first  
3. **Check Matches**: Transcript must contain therapy-related terms
4. **Check Console**: Look for error messages in browser/server logs

## 🔬 **Manual Test**

Direct OpenAI test (should show in usage dashboard):
```bash
cd /Users/joe/Warp/mh-scanner
OPENAI_API_KEY="$(grep OPENAI_API_KEY .env.local | cut -d'=' -f2)" node -e "
fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Test from mh-scanner app' }],
    max_tokens: 10
  })
}).then(res => res.json()).then(console.log);
"
```

This should immediately show up in your OpenAI usage dashboard.

## 📋 **Checklist**

- [ ] Development server running
- [ ] Keywords initialized (130+ keywords)
- [ ] Episode has transcript
- [ ] Transcript contains therapy terms
- [ ] Processing started successfully
- [ ] Console shows LLM classification logs
- [ ] OpenAI dashboard shows usage

The most likely issue is **Step 2** - keywords not initialized. Once you run the initialization, the system should start making OpenAI calls!
