const phraseOutput = document.querySelector('#phrase');
const speechStatus = document.querySelector('#speech-status');
const gestureButtons = document.querySelectorAll('[data-phrase]');
const speech = window.speechSynthesis;
const supportsSpeech = Boolean(speech && window.SpeechSynthesisUtterance);

function showSpeechStatus(message) {
  speechStatus.textContent = message;
  speechStatus.hidden = !message;
}

if (!supportsSpeech) {
  showSpeechStatus('Speech playback is unavailable in this browser.');
}

for (const button of gestureButtons) {
  button.addEventListener('click', () => {
    const { phrase } = button.dataset;
    phraseOutput.textContent = phrase;
    if (!supportsSpeech) return;

    showSpeechStatus('');
    speech.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = 'en';
    utterance.addEventListener('error', ({ error }) => {
      if (error === 'canceled' || error === 'interrupted') return;
      showSpeechStatus('Could not play the phrase. Select the gesture to try again.');
    });
    speech.speak(utterance);
  });
  button.disabled = false;
}
