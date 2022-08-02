exports.handler = async function (context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  console.log(`Event${event}`);
  console.log(`enrollCount${event.enrollCount}`);
  const enrollCount = event.enrollCount || 0;

  speak(twiml, 'Please say the following phrase to enroll ');
  speak(twiml, context.VOICEPRINT_PHRASE, context.CONTENT_LANGUAGE);

  twiml.record({
    action: `${context.SERVERLESS_BASE_URL}/process_enrollment?enrollCount=${enrollCount}`,
    maxLength: 5,
    trim: 'do-not-trim',
  });

  callback(null, twiml);
};

function removeSpecialChars(text) {
  return text.replace(/[^0-9a-z]/gi, '');
}
function speak(twiml, textToSpeak, contentLanguage = 'en-US') {
  twiml.say(textToSpeak, {
    voice: 'alice',
    language: contentLanguage,
  });
}
