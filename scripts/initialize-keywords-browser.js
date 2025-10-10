// Run this script in the browser console while on the dashboard
// It will initialize the keywords using the authenticated session

console.log("🔧 Initializing default therapy keywords from browser...");

async function initializeKeywords() {
  try {
    console.log("📞 Making request to initialize keywords...");
    
    const response = await fetch('/api/config/keywords/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to initialize keywords:', response.status, error);
      return;
    }

    const result = await response.json();
    console.log('✅ Keywords initialized successfully!');
    console.log(`📝 Added ${result.data.count} default keywords`);

    // Verify keywords were added
    console.log('\n🔍 Verifying keywords...');
    const checkResponse = await fetch('/api/config/keywords');
    const checkResult = await checkResponse.json();
    
    if (checkResult.success) {
      console.log(`✅ Verification: ${checkResult.data.keywords.length} keywords found in database`);
      console.log(`📊 Categories: ${checkResult.data.categories.join(', ')}`);
      
      // Show a sample of keywords
      const sampleKeywords = checkResult.data.keywords.slice(0, 10).map(k => k.keyword);
      console.log(`🔑 Sample keywords: ${sampleKeywords.join(', ')}...`);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

initializeKeywords();
