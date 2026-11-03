const ORIGINS = new Set(['https://katedevdc.com', 'https://www.katedevdc.com', 'http://localhost:8000', 'http://localhost:63342']);
const FACTS = `Kate Soliven lives in Woodbridge, Virginia, in the Washington, DC metropolitan area. She works in systems and software engineering. Her current employer is Booz Allen Hamilton, where she has worked as a Staff Engineer since 2022 (2022–Present in her portfolio). Her previous employer was Zekiah Technologies Inc., where she was a Full Stack Software Developer from 2020 to 2022. Her Booz Allen portfolio entry includes internal work and client work supporting the United States Space Force and NASA. She has experience with Agile development, and JavaScript, TypeScript, NestJS, Python, PostgreSQL, FastAPI, Angular, React, Swagger, and Docker.
Kate also has experience with AnyLogic for simulation modeling, JMP for statistical analysis and data visualization, and Capella for model-based systems engineering (MBSE) and system architecture modeling.
Her current unit-testing tools are Jest, Jasmine, pytest, and Vitest. Her George Mason University degree is a Bachelor of Science in Management Information Systems (MIS), with a minor in Information Technology.
Certifications listed on the portfolio: INCOSE Associate Systems Engineering Professional (ASEP), certification number 13329, valid through October 31, 2031; Palantir Foundry & AIP Builder Foundations, issued June 18, 2026; AWS Cloud Practitioner, earned August 2022; and CompTIA Security+, earned January 2021. Renewal/expiration dates for AWS and Security+ are not confirmed.
Portfolio: https://katedevdc.com
Résumé: https://katedevdc.com/documents/ksoliven.pdf
GitHub: https://github.com/ksoliven
Visitors can use the portfolio's contact section to reach Kate.`;

const MAX_BODY_BYTES = 8192;
const BODY_TIMEOUT_MS = 5000;

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function readJson(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, 'Missing body.');
  let timer;
  let completed = false;
  const read = async () => {
    const chunks = [];
    let bytes = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) throw new RequestError(413, 'Request too large.');
      chunks.push(value);
    }
    const buffer = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
    try {
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer));
    } catch {
      throw new RequestError(400, 'Invalid JSON.');
    }
  };
  try {
    const data = await Promise.race([
      read(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new RequestError(408, 'Request body timed out.')), BODY_TIMEOUT_MS);
      })
    ]);
    completed = true;
    return data;
  } finally {
    clearTimeout(timer);
    // Stop receiving oversized or stalled streams without waiting on the sender.
    if (!completed) reader.cancel().catch(() => {});
    else reader.releaseLock();
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = ORIGINS.has(origin);
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };
    if (allowed) Object.assign(headers, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
      status, headers: { ...headers, ...extra }
    });
    if (request.method === 'GET') return json({ status: 'Chat endpoint running', version: 'abuse-controls-v2' });
    if (!allowed) return json({ error: 'Origin not allowed.' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405);
    if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return json({ error: 'Expected JSON.' }, 415);
    // Fail closed until all protections are configured.
    if (!env.AI || !env.CHAT_RATE_LIMITER || !env.CHAT_AI_RATE_LIMITER || !env.TURNSTILE_SECRET_KEY) {
      return json({ error: 'Chat is not configured yet.' }, 503);
    }
    try {
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip) return json({ error: 'Client address unavailable.' }, 403);
      // Anonymous visitors have no account ID. Shared networks share this limit.
      const limit = await env.CHAT_RATE_LIMITER.limit({ key: 'chat:' + ip });
      if (!limit.success) return json({ error: 'Too many questions. Please wait a minute.' }, 429, { 'Retry-After': '60' });

      const length = request.headers.get('Content-Length');
      if (length && /^\d+$/.test(length) && Number(length) > MAX_BODY_BYTES) {
        return json({ error: 'Request too large.' }, 413);
      }
      const data = await readJson(request);
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return json({ error: 'Expected a JSON object.' }, 400);
      }
      if (typeof data?.message !== 'string' || !data.message.trim() || data.message.length > 500) {
        return json({ error: 'Enter a question of 1–500 characters.' }, 400);
      }
      if (typeof data.turnstileToken !== 'string' || !data.turnstileToken || data.turnstileToken.length > 2048) {
        return json({ error: 'Please complete verification.' }, 403);
      }
      const verified = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: data.turnstileToken, remoteip: ip }),
        signal: AbortSignal.timeout(5000)
      });
      if (!verified.ok) return json({ error: 'Verification unavailable. Please retry.' }, 503);
      const verification = await verified.json();
      if (!verification.success || verification.action !== 'portfolio-chat' || verification.hostname !== new URL(origin).hostname) {
        return json({ error: 'Verification failed. Please retry.' }, 403);
      }
      // One shared key limits verified AI calls across IPs at each edge location.
      // This sheds bursts; the binding is approximate, not a global spending cap.
      const aiLimit = await env.CHAT_AI_RATE_LIMITER.limit({ key: 'portfolio-chat' });
      if (!aiLimit.success) return json({ error: 'Chat is busy. Please try again in a minute.' }, 429, { 'Retry-After': '60' });
      const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
        messages: [
          { role: 'system', content: `You are Kate's portfolio assistant. Answer in plain text in at most three short sentences using only the facts below. If details are missing, say you don't know and suggest contacting Kate. Never invent qualifications, availability, salary, or project details. Politely decline unrelated requests.\n${FACTS}` },
          { role: 'user', content: data.message.trim() }
        ],
        max_tokens: 200,
        temperature: 0.2
      });
      if (typeof result.response !== 'string' || !result.response.trim()) return json({ error: 'No answer available.' }, 502);
      return json({ reply: result.response });
    } catch (error) {
      if (error instanceof RequestError) return json({ error: error.message }, error.status);
      return json({ error: 'Chat is temporarily unavailable.' }, 503);
    }
  }
};
