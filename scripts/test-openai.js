require('dotenv').config({ path: '.env.local' });

async function testOpenAI() {
  console.log("🧪 Testing OpenAI API Connection...\n");

  // Check environment
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("Environment check:");
  console.log("- OPENAI_API_KEY:", apiKey ? `${apiKey.substring(0, 8)}...` : "❌ NOT SET");
  console.log("");

  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY not found in environment variables");
    console.error("Make sure you have it set in .env.local");
    return;
  }

  // Test simple OpenAI call
  try {
    console.log("📞 Making test call to OpenAI API...");
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Responde solo con "OK" si me puedes escuchar.'
          }
        ],
        max_tokens: 10
      })
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenAI API Error:");
      console.error("Status:", response.status);
      console.error("Error:", errorText);
      return;
    }

    const data = await response.json();
    console.log("✅ OpenAI API Response:");
    console.log(JSON.stringify(data, null, 2));

    // Test our OpenAI client
    console.log("\n🔧 Testing our OpenAI client...");
    const { getOpenAIClient } = require('../lib/integrations/llm/openai.ts');
    
    const client = getOpenAIClient();
    console.log("Client created successfully");

    const result = await client.classifyFragment({
      fragmentText: "Mi psicólogo me ayudó mucho con mi ansiedad",
      contextText: "Estaba hablando de mi experiencia en terapia y cómo me ha ayudado",
      keywords: ["psicólogo", "ansiedad"],
      language: "es"
    });

    console.log("✅ Classification result:");
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("❌ Error testing OpenAI:");
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testOpenAI().then(() => {
  console.log("\n🏁 Test completed");
}).catch(error => {
  console.error("💥 Test failed:", error);
});
