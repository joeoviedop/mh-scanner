// Script to initialize default therapy keywords
async function initializeKeywords() {
  console.log("🔧 Initializing default therapy keywords...");

  try {
    const response = await fetch('http://localhost:3000/api/config/keywords/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

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
    const checkResponse = await fetch('http://localhost:3000/api/config/keywords');
    const checkResult = await checkResponse.json();
    
    if (checkResult.success) {
      console.log(`✅ Verification: ${checkResult.data.keywords.length} keywords found in database`);
      console.log(`📊 Categories: ${checkResult.data.categories.join(', ')}`);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('Make sure the development server is running: npm run dev');
  }
}

initializeKeywords();
