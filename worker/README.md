# Protected portfolio chat backend

This directory is deployed separately from the static website. `worker.mjs` replaces the Hello World code in Cloudflare's editor. It requires the AI and rate limiter bindings and the Turnstile secret; missing configuration disables AI requests.

## Cloudflare setup

1. Create a **Managed** widget under **Turnstile**. Add hostnames `katedevdc.com`, `www.katedevdc.com`, and `localhost` (no scheme or port).
2. Put the public **Site Key** in `TURNSTILE_SITE_KEY` in `../js/chat.js`. Keep the **Secret Key** out of the frontend and source control.
3. On the Worker, add a secret named `TURNSTILE_SECRET_KEY` under **Settings → Variables and Secrets**.
4. Deploy this directory with Wrangler to apply the rate limiter binding. From this directory, run:

   ```sh
   npx wrangler login
   npx wrangler secret put TURNSTILE_SECRET_KEY
   npx wrangler deploy
   ```

   Enter the secret only at Wrangler's prompt. Check that the selected account contains `kate-dev-portfolio-chat` before deployment. If you already saved the secret in the dashboard, skip `secret put`. The config preserves the `AI` binding and adds `CHAT_RATE_LIMITER` (10 requests per 60 seconds). Namespace `1001` should be unique among unrelated rate limiters in your account; change it if already used.

   Rate limiter bindings currently require Wrangler configuration; the dashboard editor alone is insufficient for this setup. After deploying with Wrangler, keep future backend changes in this directory and deploy with Wrangler to avoid overwriting dashboard edits.

5. Test the local frontend at `http://localhost:8000` using `python3 -m http.server 8000` from the repository root. WebStorm preview at `http://localhost:63342` is also allowed. Complete Turnstile, send a question, and confirm a reply. Publish frontend changes after verifying the protected Worker.

## Checks

Run `node --test worker.test.mjs` from this directory. These tests mock the AI, verification service, and rate limiter: they consume no AI quota. End-to-end verification needs a real widget and Cloudflare deployment.

Opening the Worker URL returns `version: "turnstile-v1"` without using AI. A POST without a Turnstile token must return 403 (or 503 until configured), never an AI answer. Allowed-origin OPTIONS requests return 204.

## Behavior and limits

- Server checks the token with Siteverify and matches both hostname and action (`portfolio-chat`). Tokens are single use; the frontend refreshes verification after each attempt and upon expiry.
- Requests are capped at 8192 bytes, questions at 500 characters, tokens at 2048 characters, and generated answers at 200 model tokens.
- The anonymous chat limits by Cloudflare-provided IP. People sharing a network share a limit. No IP or message is explicitly logged or stored by this code; Cloudflare handles requests according to its service policies.
- Cloudflare's rate limiter is approximate and scoped to each location. It is an abuse mitigation, not a strict global quota or spending cap. Stay on the free plan if you want operations to stop at its allocation rather than enabling paid overages.
- CORS restricts browsers; it does not authenticate callers. Token verification and the rate limiter are mandatory on the server.
- The portfolio facts are a small reviewed starter set, not an automatic website or résumé import. Expand `FACTS` as needed.

References: [Turnstile rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/), [server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [rate limiter binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

## Secrets and public configuration

Production uses `env.TURNSTILE_SECRET_KEY`, supplied through Cloudflare Secrets. There is no secret key in the frontend. If you later need local Worker development, create a `.dev.vars` file with `TURNSTILE_SECRET_KEY` set there; `.dev.vars`, `.env` variants, and Wrangler state are ignored by Git. No local variables file is needed for the deployed Worker.

`TURNSTILE_SITE_KEY` is intentionally public: Cloudflare requires the browser to receive it. The chat endpoint is also a public address used by browser requests. Neither can be hidden by an environment variable or Git ignore rules once served to visitors. The site does not display the Worker URL as a visitor-facing link. Using a same-origin `/api/chat` address instead requires routing or proxying on the website's hosting; it cannot be done with a frontend-only change.
