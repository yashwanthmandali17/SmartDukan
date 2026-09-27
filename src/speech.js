// Text-To-Speech (TTS) Voice Engine for Non-Literate / Low-Literacy Users

export const speakText = (text, langCode = 'en') => {
  if (!('speechSynthesis' in window)) {
    alert("Voice Speech is not supported in this browser.");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language mapping
  switch (langCode) {
    case 'hi':
      utterance.lang = 'hi-IN';
      break;
    case 'te':
      utterance.lang = 'te-IN';
      break;
    case 'en':
    default:
      utterance.lang = 'en-US';
      break;
  }

  utterance.rate = 0.9; // Slightly slower for clear understanding
  utterance.pitch = 1.0;

  // Try to pick appropriate voice if available
  const voices = window.speechSynthesis.getVoices();
  const targetVoice = voices.find(v => v.lang.startsWith(utterance.lang));
  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
