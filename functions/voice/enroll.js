exports.handler = async function (context, event, callback) {
  // eslint-disable-next-line no-undef
  const twiml = new Twilio.twiml.VoiceResponse();
  const enrollmentCount = event.enrollmentCount || 0;

  twiml.say('Please say the following phrase to enroll ');
  speak(twiml, context.VOICEPRINT_PHRASE, context.CONTENT_LANGUAGE);

  twiml.record({
    action: `/voice/process_enrollment?enrollmentCount=${enrollmentCount}`,
    maxLength: 5,
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
