# Kate Soliven Portfolio

<p align="center">
  <img src="images/about-cherry-blossoms.png" alt="Washington Monument framed by cherry blossoms" width="320">
</p>

Hi, I'm Kate! This is where I share my software and systems engineering experience, projects, and résumé. The cherry blossom design is inspired by Washington, DC, with day and night themes.

## Features

- Responsive layouts for desktop, tablet, and mobile
- Projects, work experience, education, and certifications
- Downloadable résumé and contact form
- “Ask about Kate” AI assistant

## Built With

HTML, CSS, JavaScript, Bootstrap, and jQuery. EmailJS handles the contact form; Cloudflare Workers AI powers the chatbot with Turnstile verification and rate limiting.

Designed with Figma, Adobe Illustrator, and Photoshop.

## Local Preview

From the repository root:

```bash
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000). The site loads its CSS directly; no frontend build step is required.

Chatbot backend setup is documented in [worker/README.md](worker/README.md). Secrets stay in Cloudflare or Git-ignored local files.

## Credits

Created by [Kate Soliven](https://github.com/ksoliven). Based on a Colorlib template, with acknowledgments to Coding Dojo and Adobe.
