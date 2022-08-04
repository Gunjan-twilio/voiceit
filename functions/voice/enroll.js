exports.handler = async function (context, event, callback) {
  // eslint-disable-next-line no-undef
  const twiml = new Twilio.twiml.VoiceResponse();
  const enrollCount = event.enrollCount || 0;

  twiml.say('Please say the following phrase to enroll ');
  twiml.say(context.VOICEPRINT_PHRASE);

  twiml.record({
    action: `${context.SERVERLESS_BASE_URL}/process_enrollment?enrollCount=${enrollCount}`,
    maxLength: 5,
    trim: 'do-not-trim',
  });

  callback(null, twiml);
};
