import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';

const origin = 'https://katedevdc.com';
function request(data, extra = {}) {
  return new Request('https://chat.example/', { method: 'POST', headers: {
    Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...extra
  }, body: JSON.stringify(data) });
}
function environment() {
  return {
    TURNSTILE_SECRET_KEY: 'test-secret',
    CHAT_RATE_LIMITER: { limit: async () => ({ success: true }) },
    AI: { run: async () => { throw new Error('AI must not run'); } }
  };
}

test('missing configuration, rejected origin, invalid input and missing token fail closed', async () => {
  assert.equal((await worker.fetch(request({ message: 'Hello' }), {})).status, 503);
  assert.equal((await worker.fetch(request({}, { Origin: 'https://other.example' }), environment())).status, 403);
  assert.equal((await worker.fetch(request({ message: 'x'.repeat(501) }), environment())).status, 400);
  assert.equal((await worker.fetch(request({ message: 'Hello' }), environment())).status, 403);
  assert.equal((await worker.fetch(request({ message: 'x'.repeat(9000) }), environment())).status, 413);
});

test('rate limit returns 429 and retry guidance before verification or AI', async () => {
  const env = environment();
  env.CHAT_RATE_LIMITER.limit = async () => ({ success: false });
  const response = await worker.fetch(request({ message: 'Hello', turnstileToken: 'token' }), env);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
});

test('verification must succeed and match hostname and action before AI runs', async () => {
  const previousFetch = globalThis.fetch;
  const env = environment();
  let aiCalls = 0;
  env.AI.run = async () => { aiCalls++; return { response: 'A portfolio answer.' }; };
  try {
    for (const verification of [
      { success: false },
      { success: true, hostname: 'other.example', action: 'portfolio-chat' },
      { success: true, hostname: 'katedevdc.com', action: 'other' }
    ]) {
      globalThis.fetch = async () => Response.json(verification);
      assert.equal((await worker.fetch(request({ message: 'Hello', turnstileToken: 'token' }), env)).status, 403);
    }
    assert.equal(aiCalls, 0);
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
      assert.equal(JSON.parse(options.body).response, 'token');
      return Response.json({ success: true, hostname: 'katedevdc.com', action: 'portfolio-chat' });
    };
    const response = await worker.fetch(request({ message: 'Hello', turnstileToken: 'token' }), env);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
    assert.deepEqual(await response.json(), { reply: 'A portfolio answer.' });
    assert.equal(aiCalls, 1);
    globalThis.fetch = async () => { throw new Error('Verification outage'); };
    assert.equal((await worker.fetch(request({ message: 'Hello', turnstileToken: 'token' }), env)).status, 503);
    assert.equal(aiCalls, 1);
  } finally { globalThis.fetch = previousFetch; }
});
