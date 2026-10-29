(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;
  var submit = form.querySelector('[type="submit"]');
  var status = document.getElementById('contact-status');
  var widgetId = null;
  var sending = false;

  function showStatus(message) { status.textContent = message; }
  function notify(type, message, duration) {
    showStatus(message);
    if (typeof window.AWN === 'function') {
      var durations = {};
      durations[type] = duration || 4000;
      new window.AWN()[type](message, { durations: durations });
    }
  }
  function resetVerification() {
    if (widgetId !== null && window.grecaptcha) window.grecaptcha.reset(widgetId);
  }

  window.onContactCaptchaReady = function () {
    widgetId = window.grecaptcha.render('contact-captcha', {
      sitekey: document.getElementById('contact-captcha').dataset.sitekey,
      callback: function () { showStatus('Verification complete. You can send your message.'); },
      'expired-callback': function () { showStatus('Verification expired. Please complete the checkbox again.'); },
      'error-callback': function () { notify('alert', 'Verification could not load. Please refresh or use the email link.'); }
    });
  };

  if (window.emailjs) window.emailjs.init({ publicKey: 'iSPaNrHIO21mz9-u3' });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (sending) return;
    if (!window.emailjs || !window.grecaptcha || widgetId === null) {
      notify('alert', 'Verification is still loading. Please wait or use the email link.');
      return;
    }
    var token = window.grecaptcha.getResponse(widgetId);
    if (!token) {
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
    sending = true;
    submit.disabled = true;
    showStatus('Sending your message…');
    var sendingToast = typeof window.AWN === 'function' ? new window.AWN().info('Sending your message…', {
      labels: { info: 'Sending' },
      icons: { info: 'cog fa-spin' },
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
      notify('alert', captchaError ? 'Verification was not accepted. Please complete the checkbox again and retry.' :
        'Message failure. Please contact me by phone or email instead. Thank you', captchaError ? 4000 : 1000);
    } finally {
      dismissSendingToast();
      sending = false;
      submit.disabled = false;
      resetVerification();
    }
  });
})();
