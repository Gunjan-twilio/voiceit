exports.handler = async function(context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  speak(twiml, 'Please say the following phrase to verify your voice ');
  speak(twiml, context.VOICEPRINT_PHRASE, context.CONTENT_LANGUAGE);

  twiml.record({
    action: '/voice/process_verification',
    maxLength: '5',
    trim: 'do-not-trim',
  });
  callback(null, twiml);
};
function speak(twiml, textToSpeak, contentLanguage = "en-US"){
  twiml.say({
    voice: "alice",
    language: contentLanguage
  }, textToSpeak);
}