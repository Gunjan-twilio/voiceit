exports.handler = async function (context, event, callback) {
  // eslint-disable-next-line no-undef
  const twiml = new Twilio.twiml.VoiceResponse();
  speak(twiml, 'Please say the following phrase to verify your voice ' + context.VOICEPRINT_PHRASE, context.CONTENT_LANGUAGE);

  twiml.record({
    action: '/voice/process_verification',
    maxLength: '5',
    trim: 'do-not-trim',
  });
  callback(null, twiml);
};

function speak(twiml, textToSpeak, contentLanguage){
  twiml.say({
    voice: "woman",
    language: contentLanguage
  }, textToSpeak);
}
