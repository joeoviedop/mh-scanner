const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

async function testBasicApify() {
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
  
  if (!token) {
    console.error('❌ No APIFY_TOKEN or APIFY_API_TOKEN found');
    return;
  }
  
  console.log('✅ Token found:', token.substring(0, 15) + '...');
  
  // Test a simple API call
  const response = await fetch('https://api.apify.com/v2/acts/pintostudio~youtube-transcript-scraper?token=' + token);
  
  if (!response.ok) {
    console.error('❌ API call failed:', response.status, await response.text());
    return;
  }
  
  const data = await response.json();
  console.log('✅ Actor found:', data.name || data.id);
  
  // Try to start a run
  console.log('\nStarting actor run for test video...');
  const runResponse = await fetch('https://api.apify.com/v2/acts/pintostudio~youtube-transcript-scraper/runs?token=' + token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      videoUrl: 'https://www.youtube.com/watch?v=xqyUdNxWAAE'
    }),
  });
  
  if (!runResponse.ok) {
    console.error('❌ Failed to start run:', runResponse.status, await runResponse.text());
    return;
  }
  
  const runData = await runResponse.json();
  console.log('✅ Run started');
  console.log('Full response:', JSON.stringify(runData, null, 2));
  
  // Extract run ID
  const runId = runData.data?.id || runData.id;
  if (!runId) {
    console.error('❌ No run ID in response');
    return;
  }
  
  console.log('Run ID:', runId);
  console.log('Initial status:', runData.data?.status || runData.status);
  
  // Wait and check status once
  console.log('\nWaiting 5 seconds then checking status...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
  if (!statusResponse.ok) {
    console.error('❌ Failed to check status:', statusResponse.status);
    return;
  }
  
  const statusData = await statusResponse.json();
  console.log('Current status:', statusData.data?.status || statusData.status);
  console.log('Dataset ID:', statusData.data?.defaultDatasetId || statusData.defaultDatasetId);
}

testBasicApify().catch(console.error);
