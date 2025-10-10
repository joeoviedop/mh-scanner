#!/usr/bin/env node

/**
 * Test script to verify Apify integration is working
 * Usage: node scripts/test-apify.js [videoId]
 */

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

const APIFY_API_BASE = "https://api.apify.com/v2";
const DEFAULT_ACTOR_ID = "pintostudio~youtube-transcript-scraper";

async function testApifyConfig() {
  console.log('\n=== Testing Apify Configuration ===\n');
  
  // Check environment variables
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID?.trim() || DEFAULT_ACTOR_ID;
  
  if (!token) {
    console.error('❌ Missing APIFY_TOKEN or APIFY_API_TOKEN environment variable');
    console.log('   Please set one of these in your .env.local file');
    return false;
  }
  
  console.log('✅ Token found:', token.substring(0, 10) + '...' + token.substring(token.length - 5));
  console.log('✅ Actor ID:', actorId);
  
  return { token, actorId };
}

async function testApifyConnection(token, actorId) {
  console.log('\n=== Testing Apify API Connection ===\n');
  
  try {
    // Test API connection by fetching actor info
    const response = await fetch(`${APIFY_API_BASE}/acts/${actorId}?token=${token}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to connect to Apify API (${response.status}):`, errorText);
      
      if (response.status === 401) {
        console.log('   → Invalid API token. Please check your APIFY_TOKEN/APIFY_API_TOKEN');
      } else if (response.status === 404) {
        console.log('   → Actor not found. Check APIFY_ACTOR_ID or use default');
      }
      return false;
    }
    
    const actorInfo = await response.json();
    console.log('✅ Successfully connected to Apify');
    console.log('   Actor:', actorInfo.name || actorId);
    console.log('   Username:', actorInfo.username);
    
    return true;
  } catch (error) {
    console.error('❌ Network error connecting to Apify:', error.message);
    return false;
  }
}

async function testTranscriptFetch(token, actorId, videoId) {
  console.log('\n=== Testing Transcript Fetch ===\n');
  console.log('Video ID:', videoId);
  console.log('Video URL:', `https://www.youtube.com/watch?v=${videoId}`);
  
  try {
    // Start the actor run
    console.log('\nStarting Apify actor run...');
    const startResponse = await fetch(`${APIFY_API_BASE}/acts/${actorId}/runs?token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`
      }),
    });
    
    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      console.error(`❌ Failed to start actor run (${startResponse.status}):`, errorText);
      return false;
    }
    
    const run = await startResponse.json();
    console.log('✅ Actor run started');
    console.log('   Run ID:', run.id);
    console.log('   Status:', run.status);
    
    // Poll for completion
    console.log('\nPolling for completion (this may take 30-60 seconds)...');
    let currentRun = run;
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      if (['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(currentRun.status)) {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusResponse = await fetch(`${APIFY_API_BASE}/actor-runs/${currentRun.id}?token=${token}`);
      if (statusResponse.ok) {
        currentRun = await statusResponse.json();
        process.stdout.write(`   Status: ${currentRun.status} (attempt ${attempts + 1}/${maxAttempts})\r`);
      }
      
      attempts++;
    }
    
    console.log('\n');
    
    if (currentRun.status !== 'SUCCEEDED') {
      console.error('❌ Actor run did not succeed');
      console.log('   Final status:', currentRun.status);
      return false;
    }
    
    console.log('✅ Actor run completed successfully');
    
    // Fetch dataset items
    const datasetId = currentRun.defaultDatasetId || currentRun.outputDatasetId;
    if (!datasetId) {
      console.error('❌ No dataset ID found in run result');
      return false;
    }
    
    console.log('\nFetching dataset items...');
    console.log('   Dataset ID:', datasetId);
    
    const datasetResponse = await fetch(
      `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${token}&clean=1&format=json`
    );
    
    if (!datasetResponse.ok) {
      const errorText = await datasetResponse.text();
      console.error(`❌ Failed to fetch dataset (${datasetResponse.status}):`, errorText);
      return false;
    }
    
    const items = await datasetResponse.json();
    console.log('✅ Dataset fetched');
    console.log('   Total items:', items.length);
    
    if (items.length > 0) {
      console.log('\n📝 Sample of first item structure:');
      const firstItem = items[0];
      console.log(JSON.stringify(firstItem, null, 2).substring(0, 1000) + '...');
      
      // Try to identify the transcript data structure
      let transcriptFound = false;
      const possibleFields = ['segments', 'transcript', 'data', 'captions', 'transcriptSegments'];
      
      for (const field of possibleFields) {
        if (firstItem[field]) {
          console.log(`\n✅ Found transcript data in field: ${field}`);
          
          if (Array.isArray(firstItem[field])) {
            console.log(`   Array with ${firstItem[field].length} segments`);
            if (firstItem[field].length > 0) {
              console.log('   Sample segment:', JSON.stringify(firstItem[field][0], null, 2));
            }
          } else if (typeof firstItem[field] === 'object' && firstItem[field].segments) {
            console.log(`   Object with segments array (${firstItem[field].segments.length} segments)`);
          } else if (typeof firstItem[field] === 'string') {
            console.log(`   Plain text transcript (${firstItem[field].length} characters)`);
          }
          
          transcriptFound = true;
        }
      }
      
      if (!transcriptFound) {
        console.log('\n⚠️  Could not identify transcript field in response');
        console.log('   Available fields:', Object.keys(firstItem));
      }
    } else {
      console.log('\n⚠️  No items returned in dataset');
      console.log('   This video may not have captions available');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error during transcript fetch:', error.message);
    console.error(error.stack);
    return false;
  }
}

async function main() {
  console.log('🔍 Apify Integration Test Script');
  console.log('=================================');
  
  // Get video ID from command line or use default
  const videoId = process.argv[2] || 'xqyUdNxWAAE'; // Default: a video with known captions
  
  // Test configuration
  const config = await testApifyConfig();
  if (!config) {
    process.exit(1);
  }
  
  // Test API connection
  const connected = await testApifyConnection(config.token, config.actorId);
  if (!connected) {
    process.exit(1);
  }
  
  // Test transcript fetching
  const success = await testTranscriptFetch(config.token, config.actorId, videoId);
  
  console.log('\n=================================');
  if (success) {
    console.log('✅ All tests passed!');
    console.log('\nYour Apify integration is working correctly.');
  } else {
    console.log('❌ Some tests failed');
    console.log('\nPlease check the errors above and fix the configuration.');
  }
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error);
