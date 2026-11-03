(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;
  var submit = form.querySelector('[type="submit"]');
  var status = document.getElementById('contact-status');
  var widgetId = null;
  var sending = false;
  // Local SVGs keep notification icons independent of external icon loaders.
  function icon(content, className) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' +
      (className ? ' class="' + className + '"' : '') + '>' + content + '</svg>';
  }
  var sendingIcon = icon('<circle cx="12" cy="12" r="9" opacity=".25"/><path d="M12 3a9 9 0 0 1 9 9"/>', 'toast-spinner');
  var notifier = typeof window.AWN === 'function' ? new window.AWN({ icons: {
    prefix: '', suffix: '',
    info: icon('<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>'),
    success: icon('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
    alert: icon('<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3v.01"/>')
  } }) : null;


  function showStatus(message) { status.textContent = message; }
  function notify(type, message, duration) {
    showStatus(message);
    if (notifier) {
      var durations = {};
      durations[type] = duration || 4000;
      notifier[type](message, { durations: durations });
    }
  }
  function resetVerification() {
    if (widgetId !== null && window.grecaptcha) window.grecaptcha.reset(widgetId);
  }

  var emailReady = null;
  var captchaReady = null;
  var contactReady = null;

  function loadScript(id, source, callbackName) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      var finished = false;
      var timer;
      function finish(error) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (error) { script.remove(); reject(error); }
        else resolve();
      }
      script.id = id;
      script.src = source;
      script.async = true;
      script.onerror = function () { finish(new Error('Contact script could not load.')); };
      if (callbackName) window[callbackName] = function () { finish(); };
      else script.onload = function () { finish(); };
      timer = setTimeout(function () { finish(new Error('Contact script timed out.')); }, 15000);
      document.head.appendChild(script);
    });
  }

  function loadEmail() {
    if (!emailReady) {
      var scriptReady = window.emailjs ? Promise.resolve() : loadScript(
        'contact-emailjs', 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js');
      emailReady = scriptReady.then(function () {
        if (!window.emailjs) throw new Error('Email service is unavailable.');
        window.emailjs.init({
          publicKey: 'iSPaNrHIO21mz9-u3',
          blockHeadless: true,
          limitRate: { id: 'portfolio-contact', throttle: 60000 }
        });
      }).catch(function (error) { emailReady = null; throw error; });
    }
    return emailReady;
  }

  function loadCaptcha() {
    if (!captchaReady) {
      var scriptReady = window.grecaptcha && typeof window.grecaptcha.render === 'function' ? Promise.resolve() : loadScript(
        'contact-recaptcha',
        'https://www.google.com/recaptcha/api.js?onload=onContactCaptchaReady&render=explicit',
        'onContactCaptchaReady');
      captchaReady = scriptReady.then(function () {
        if (widgetId !== null) return;
        widgetId = window.grecaptcha.render('contact-captcha', {
          sitekey: document.getElementById('contact-captcha').dataset.sitekey,
          callback: function () { showStatus('Verification complete. You can send your message.'); },
          'expired-callback': function () { showStatus('Verification expired. Please complete the checkbox again.'); },
          'error-callback': function () { notify('alert', 'Verification could not load. Please refresh or contact me on LinkedIn.'); }
        });
      }).catch(function (error) { captchaReady = null; throw error; });
    }
    return captchaReady;
  }

  function loadContact() {
    if (!contactReady) {
      showStatus('Loading contact form…');
      contactReady = Promise.all([loadEmail(), loadCaptcha()]).then(function () {
        showStatus('Complete the verification checkbox before sending.');
      }).catch(function (error) {
        contactReady = null;
        showStatus('Contact form could not load. Try again or contact me on LinkedIn.');
        throw error;
      });
    }
    return contactReady;
  }

  function warmContact() { loadContact().catch(function () {}); }
  form.addEventListener('focusin', warmContact);
  document.addEventListener('portfolio:reveal', function (event) {
    if (event.detail.section.contains(form)) warmContact();
  });
  if (window.IntersectionObserver) {
    var contactObserver = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        contactObserver.disconnect();
        warmContact();
      }
    }, { rootMargin: '600px 0px' });
    contactObserver.observe(form);
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (sending) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (form.elements.user_name.value.length > 100 || form.elements.user_email.value.length > 254 || form.elements.message.value.length > 3000) {
      notify('alert', 'Please keep your name under 100 characters and your message under 3,000 characters.');
      return;
    }
    sending = true;
    submit.disabled = true;
    try {
      await loadContact();
    } catch (error) {
      sending = false;
      submit.disabled = false;
      notify('alert', 'Contact form could not load. Please try again or contact me on LinkedIn.');
      return;
    }
    var token = window.grecaptcha.getResponse(widgetId);
    if (!token) {
      sending = false;
      submit.disabled = false;
      notify('alert', 'Please complete the “I’m not a robot” checkbox before sending.');
      return;
    }
    // Keep the verified token inside this form so sendForm includes it.
    var captchaResponse = form.querySelector('[name="g-recaptcha-response"]');
    if (!captchaResponse) {
      captchaResponse = document.createElement('input');
      captchaResponse.type = 'hidden';
      captchaResponse.name = 'g-recaptcha-response';
      form.appendChild(captchaResponse);
    }
    captchaResponse.value = token;
    form.elements.contact_number.value = Math.floor(Math.random() * 100000);
    showStatus('Sending your message…');
    var sendingToast = notifier ? notifier.info('Sending your message…', {
      labels: { info: 'Sending' },
      icons: { info: sendingIcon },
      durations: { info: 0 }
    }) : null;
    function dismissSendingToast() {
      if (sendingToast) { sendingToast.remove(); sendingToast = null; }
    }
    try {
      await window.emailjs.sendForm('service_nzt1uxp', 'template_fbzuim3', form);
      dismissSendingToast();
      form.reset();
      notify('success', 'Message successfully sent', 1000);
    } catch (error) {
      dismissSendingToast();
      var captchaError = error && typeof error.text === 'string' && /recaptcha/i.test(error.text);
      var message = error && error.status === 429 ? 'Please wait a minute before sending another message.' :
        error && error.status === 451 ? 'This browser could not send the message. Please try another browser or contact me on LinkedIn.' :
        captchaError ? 'Verification was not accepted. Please complete the checkbox again and retry.' :
        'Message could not be sent. Please try again or contact me on LinkedIn.';
      notify('alert', message, 4000);
    } finally {
      dismissSendingToast();
      sending = false;
      submit.disabled = false;
      resetVerification();
    }
  });
})();
