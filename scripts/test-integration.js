// Quick test of the fixed Apify integration
const fs = require('fs');
const path = require('path');

// Load environment variables
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

// Import the fixed module
const { fetchTranscriptFromApify } = require('../lib/integrations/apify/transcript');

async function test() {
  console.log('Testing fixed Apify integration...\n');
  
  const testVideoId = 'xqyUdNxWAAE';
  console.log(`Fetching transcript for video: ${testVideoId}`);
  console.log('URL: https://www.youtube.com/watch?v=' + testVideoId);
  console.log('\nThis may take 30-60 seconds...\n');
  
  try {
    const result = await fetchTranscriptFromApify(testVideoId);
    
    if (!result) {
      console.log('❌ No transcript returned');
      return;
    }
    
    console.log('✅ Transcript fetched successfully!');
    console.log('\nDebug info:');
    console.log('  Run ID:', result.debug.runId);
    console.log('  Dataset ID:', result.debug.datasetId);
    console.log('  Run Status:', result.debug.runStatus);
    console.log('  Total segments:', result.segments.length);
    console.log('  Raw item count:', result.debug.rawItemCount);
    
    if (result.segments.length > 0) {
      console.log('\nFirst 3 segments:');
      result.segments.slice(0, 3).forEach((seg, i) => {
        console.log(`  ${i + 1}. [${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s] "${seg.text.substring(0, 100)}..."`);
      });
      
      // Calculate total text
      const fullText = result.segments.map(s => s.text).join(' ');
      console.log(`\nTotal text length: ${fullText.length} characters`);
      console.log(`Word count: ${fullText.split(/\s+/).filter(Boolean).length} words`);
    } else {
      console.log('\n⚠️  No segments in transcript');
      console.log('Raw sample:', JSON.stringify(result.debug.rawSample?.[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

test();
