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
    CHAT_AI_RATE_LIMITER: { limit: async () => ({ success: true }) },
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
  env.AI.run = async (model) => {
    aiCalls++;
    assert.equal(model, '@cf/google/gemma-4-26b-a4b-it');
    return { choices: [{ message: { content: 'A portfolio answer.' } }] };
  };
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

test('both rate-limit bindings are required and API responses are not cached or sniffed', async () => {
  const env = environment();
  delete env.CHAT_AI_RATE_LIMITER;
  const response = await worker.fetch(request({ message: 'Hello', turnstileToken: 'token' }), env);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
});

test('invalid JSON shapes and content types are rejected without external work', async () => {
  const env = environment();
  const originalFetch = globalThis.fetch;
  let externalCalls = 0;
  globalThis.fetch = async () => { externalCalls++; throw new Error('Must not verify invalid input'); };
  try {
    for (const data of [null, [], true, 12, 'hello', {}, { message: '   ' }, { message: 12 }]) {
      assert.equal((await worker.fetch(request(data), env)).status, 400);
    }
    assert.equal((await worker.fetch(request({ message: 'Hello', turnstileToken: 'x'.repeat(2049) }), env)).status, 403);
    assert.equal((await worker.fetch(request({}, { 'Content-Type': 'application/json-invalid' }), env)).status, 415);
    assert.equal((await worker.fetch(request({ message: 'Hello' }, { 'Content-Type': 'application/json; charset=UTF-8' }), env)).status, 403);
    const invalid = new Request('https://chat.example/', { method: 'POST', headers: {
      Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1'
    }, body: '{not json' });
    assert.equal((await worker.fetch(invalid, env)).status, 400);
    assert.equal((await worker.fetch(request({}, { 'Content-Length': '9000' }), env)).status, 413);
    const noIP = request({ message: 'Hello', turnstileToken: 'token' });
    noIP.headers.delete('CF-Connecting-IP');
    assert.equal((await worker.fetch(noIP, env)).status, 403);
    assert.equal(externalCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('shared AI burst limit is checked only after valid verification and before inference', async () => {
  const env = environment();
  const originalFetch = globalThis.fetch;
  const keys = [];
  let aiCalls = 0;
  env.AI.run = async () => { aiCalls++; return { response: 'Answer' }; };
  env.CHAT_AI_RATE_LIMITER.limit = async ({ key }) => { keys.push(key); return { success: false }; };
  try {
    globalThis.fetch = async () => Response.json({ success: false });
    assert.equal((await worker.fetch(request({ message: 'Hello', turnstileToken: 'invalid' }), env)).status, 403);
    assert.equal(keys.length, 0);
    globalThis.fetch = async () => Response.json({ success: true, hostname: 'katedevdc.com', action: 'portfolio-chat' });
    for (const ip of ['192.0.2.1', '192.0.2.2']) {
      const response = await worker.fetch(request({ message: 'Hello', turnstileToken: 'valid' }, { 'CF-Connecting-IP': ip }), env);
      assert.equal(response.status, 429);
      assert.equal(response.headers.get('Retry-After'), '60');
    }
    assert.deepEqual(keys, ['portfolio-chat', 'portfolio-chat']);
    assert.equal(aiCalls, 0);
    env.CHAT_AI_RATE_LIMITER.limit = async () => { throw new Error('Limiter unavailable'); };
    assert.equal((await worker.fetch(request({ message: 'Hello', turnstileToken: 'valid' }), env)).status, 503);
    assert.equal(aiCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('oversized chunked requests are canceled before verification', async () => {
  let canceled = false;
  const body = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(8193)); },
    cancel() { canceled = true; }
  });
  const req = new Request('https://chat.example/', { method: 'POST', headers: {
    Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1'
  }, body, duplex: 'half' });
  assert.equal((await worker.fetch(req, environment())).status, 413);
  assert.equal(canceled, true);
});

test('stalled request bodies time out and release the stream', async () => {
  let canceled = false;
  const body = new ReadableStream({ cancel() { canceled = true; } });
  const req = new Request('https://chat.example/', { method: 'POST', headers: {
    Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1'
  }, body, duplex: 'half' });
  const response = await worker.fetch(req, environment());
  assert.equal(response.status, 408);
  assert.equal(canceled, true);
});
