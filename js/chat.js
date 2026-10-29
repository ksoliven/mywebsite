(function () {
  'use strict';

  // Deployed Cloudflare Worker. Set to an empty string to use local demo replies.
  // API keys belong in the backend environment, never in this file.
  var CHAT_ENDPOINT = 'https://kate-dev-portfolio-chat.kate-c-soliven.workers.dev/';
  var root = document.querySelector('.portfolio-chat');
  if (!root) return;
  var toggle = root.querySelector('.chat-toggle');
  var panel = root.querySelector('.chat-panel');
  var close = root.querySelector('.chat-close');
  var form = root.querySelector('form');
  var input = root.querySelector('input');
  var messages = root.querySelector('.chat-messages');
  var send = root.querySelector('.chat-send');
  var busy = false;
  // Public key from Cloudflare Turnstile; never put the secret key here.
  var TURNSTILE_SITE_KEY = '0x4AAAAAAFrTsEaPXx1LDhyx';
  var token = '';
  var widgetId = null;
  var loadingVerification = false;
  var verificationStatus = root.querySelector('.chat-verification-status');

  function updateControls() {
    var disabled = busy || (!!CHAT_ENDPOINT && !token);
    send.disabled = disabled;
  }

  function loadVerification() {
    if (!CHAT_ENDPOINT || widgetId !== null || loadingVerification) return;
    if (!TURNSTILE_SITE_KEY) {
      verificationStatus.textContent = 'Chat is being configured. Please use the contact link below.';
      return;
    }
    loadingVerification = true;
    verificationStatus.textContent = 'Loading verification…';
    function render() {
      try {
        widgetId = window.turnstile.render(root.querySelector('.chat-verification'), {
          sitekey: TURNSTILE_SITE_KEY,
          action: 'portfolio-chat',
          appearance: 'interaction-only',
          size: 'flexible',
          theme: document.documentElement.getAttribute('data-theme') === 'night' ? 'dark' : 'light',
          callback: function (value) { token = value; verificationStatus.textContent = busy ? 'Thinking…' : ''; updateControls(); },
          'expired-callback': function () { token = ''; verificationStatus.textContent = 'Verification expired. Refreshing…'; updateControls(); window.turnstile.reset(widgetId); },
          'error-callback': function () { token = ''; verificationStatus.textContent = 'Verification failed. Close and reopen chat to retry.'; loadingVerification = false; updateControls(); return true; }
        });
      } catch (error) {
        loadingVerification = false;
        verificationStatus.textContent = 'Verification unavailable. Close and reopen chat to retry.';
      }
    }
    if (window.turnstile) { render(); return; }
    var script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = render;
    script.onerror = function () {
      loadingVerification = false;
      script.remove();
      verificationStatus.textContent = 'Verification could not load. Close and reopen chat to retry.';
    };
    document.head.appendChild(script);
  }

  function setOpen(open) {
    panel.hidden = !open;
    if (open) {
      if (widgetId !== null && !token && !busy && window.turnstile) window.turnstile.reset(widgetId);
      else loadVerification();
    }
    toggle.setAttribute('aria-expanded', String(open));
    (open ? input : toggle).focus();
  }

  function addMessage(role, content) {
    var message = document.createElement('p');
    message.className = 'chat-message';
    message.dataset.role = role;
    // Treat all replies as text, including future model output.
    message.textContent = (role === 'user' ? 'You: ' : 'Kate’s assistant: ') + content;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  function demoReply(question) {
    if (/resume|résumé|contact|email/i.test(question)) {
      return 'You can download Kate’s résumé or open the contact section using the links below.';
    }
    if (/project|portfolio/i.test(question)) {
      return 'Explore the Work section for Kate’s portfolio projects. This demo does not yet answer questions about individual projects.';
    }
    if (/experience|backend|technolog|skill/i.test(question)) {
      return 'Kate’s website lists experience in Agile development, systems engineering, and software engineering, with technologies including TypeScript, NestJS, Python, PostgreSQL, FastAPI, Angular, React, and Docker.';
    }
    return 'This is a demo with sample replies. Try asking about experience, projects, or the résumé, or contact Kate using the link below.';
  }

  async function ask(question) {
    if (busy || !question.trim() || (CHAT_ENDPOINT && !token)) return;
    question = question.trim().slice(0, 500);
    busy = true;
    root.querySelector('.chat-info').open = false;
    verificationStatus.textContent = 'Thinking…';
    updateControls();
    addMessage('user', question);
    input.value = '';
    var timeout;
    try {
      var reply;
      if (!CHAT_ENDPOINT) {
        reply = demoReply(question);
      } else {
        var controller = new AbortController();
        timeout = setTimeout(function () { controller.abort(); }, 20000);
        var response = await fetch(CHAT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: question, turnstileToken: token }),
          signal: controller.signal
        });
        if (response.status === 429) throw new Error('rate-limit');
        if (response.status === 403) throw new Error('verification');
        if (!response.ok) throw new Error('Chat request failed');
        var data = await response.json();
        if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Invalid reply');
        reply = data.reply;
      }
      addMessage('assistant', reply);
    } catch (error) {
      var failure = error.message === 'rate-limit' ? 'Too many questions. Please wait a minute before trying again.' :
        error.message === 'verification' ? 'Verification failed. Please complete the new check and try again.' :
        'Chat is unavailable right now. Please try again or use the contact link below.';
      addMessage('assistant', failure);
    } finally {
      clearTimeout(timeout);
      busy = false;
      token = '';
      updateControls();
      if (CHAT_ENDPOINT && widgetId !== null && window.turnstile) {
        verificationStatus.textContent = 'Refreshing verification…';
        window.turnstile.reset(widgetId);
      } else {
        verificationStatus.textContent = '';
      }
    }
  }

  toggle.addEventListener('click', function () { setOpen(panel.hidden); });
  close.addEventListener('click', function () { setOpen(false); });
  root.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    ask(input.value);
  });
  root.querySelectorAll('[data-chat-section]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var section = document.querySelector('[data-section="' + link.dataset.chatSection + '"]');
      if (section) {
        event.preventDefault();
        setOpen(false);
        var navigation = new CustomEvent('portfolio:navigate', {
          detail: { section: link.dataset.chatSection }, cancelable: true
        });
        if (document.dispatchEvent(navigation)) {
          section.classList.add('section-open-immediately');
          section.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
            block: 'start'
          });
          section.setAttribute('tabindex', '-1');
          section.focus({ preventScroll: true });
        }
      }
    });
  });
  updateControls();
  root.hidden = false;
})();
