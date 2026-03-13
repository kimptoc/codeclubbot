#!/usr/bin/env node

// Simple CLI script to test calling the Kilo Gateway API
// Usage: node test-kilo.mjs [optional-api-key]
// Or set KILO_API_KEY env var
// Defaults to 'anonymous' for free-tier models (200 req/hr/IP)

const apiKey = process.argv[2] || process.env.KILO_API_KEY || 'anonymous';
const baseUrl = 'https://api.kilo.ai/api/gateway';

console.log(`Testing Kilo API with key: ${apiKey === 'anonymous' ? 'anonymous (free tier)' : '***'}\n`);

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`,
};

// First, list available free models
console.log('--- Fetching available models ---');
try {
  const modelsRes = await fetch(`${baseUrl}/models`, { headers });
  console.log(`Models endpoint: ${modelsRes.status} ${modelsRes.statusText}`);

  if (modelsRes.ok) {
    const modelsJson = await modelsRes.json();
    const models = modelsJson.data || [];
    const freeModels = models.filter(m => m.id?.includes('free') || m.pricing?.prompt === '0');
    console.log(`Total models: ${models.length}`);
    if (freeModels.length > 0) {
      console.log(`Free models: ${freeModels.map(m => m.id).join(', ')}`);
    } else {
      console.log('Sample models:', models.slice(0, 5).map(m => m.id).join(', '));
    }
  }
} catch (err) {
  console.error('Models fetch error:', err.message);
}

// Then try a chat completion with a free model
console.log('\n--- Testing chat completion ---');
const model = process.argv[3] || 'kilo/auto-free';

try {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Say hello in exactly 5 words.' }],
      stream: false,
    }),
  });

  console.log(`Status: ${res.status} ${res.statusText}`);

  const body = await res.text();
  try {
    const json = JSON.parse(body);
    if (json.choices?.[0]?.message?.content) {
      console.log(`Model: ${model}`);
      console.log(`Reply: ${json.choices[0].message.content}`);
    } else {
      console.log('Response:', JSON.stringify(json, null, 2));
    }
  } catch {
    console.log('Response body:', body.slice(0, 500));
  }
} catch (err) {
  console.error('Chat fetch error:', err.message);
}
