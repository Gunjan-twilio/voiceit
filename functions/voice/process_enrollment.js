const VoiceIt = require('voiceit2-nodejs');
const Airtable = require('airtable');

function removeSpecialChars(text) {
  return text.replace(/[^0-9a-z]/gi, '');
}
function speak(twiml, textToSpeak, contentLanguage = 'en-US') {
  twiml.say(textToSpeak, {
    voice: 'alice',
    language: contentLanguage,
  });
}

const callerUserId = async (phone, context) => {
  console.log('In callerUserId from airtable');
  let userId = 0;
  try {
    const base = new Airtable({ apiKey: context.AIRTABLE_API_KEY }).base(
      context.AIRTABLE_BASE_ID,
    );
    const records = await base('Voice Biometric').select().all();
    // eslint-disable-next-line consistent-return
    records.forEach((record) => {
      const recordPhone = record.get('Phone Number');
      if (recordPhone === phone) {
        userId = record.get('Biometric UserId');
        console.log(`In callerUserId userId${userId}`);
        return userId;
      }
    });
  } catch (err) {
    console.log(`error in callerUserId ${err}`);
  }
  return userId;
};

exports.handler = async function (context, event, callback) {
  console.log(`Process Enrollment enrollmentCount ${event.enrollCount}`);
  const myVoiceIt = new VoiceIt(
    context.VOICEIT_API_KEY,
    context.VOICEIT_API_TOKEN,
  );

  const phone = removeSpecialChars(event.From);
  const userId = await callerUserId(phone, context);
  let { enrollCount } = event;
  const recordingURL = `${event.RecordingUrl}.wav`;
  // eslint-disable-next-line no-undef
  const twiml = new Twilio.twiml.VoiceResponse();
  function enrollmentDone() {
    enrollCount += 1;
    // VoiceIt requires at least 3 successful enrollments.
    if (enrollCount > 2) {
      speak(
        twiml,
        'Thank you, recording received, you are now enrolled and ready to log in',
      );
      twiml.redirect(`${context.SERVERLESS_BASE_URL}/verify`);
    } else {
      speak(
        twiml,
        'Thank you, recording received, you will now be asked to record your phrase again',
      );
      twiml.redirect(`${context.SERVERLESS_BASE_URL}/enroll?enrollCount=${enrollCount}`);
    }
  }

  function enrollAgain() {
    speak(twiml, 'Your recording was not successful, please try again');
    twiml.redirect(`${context.SERVERLESS_BASE_URL}/enroll?enrollCount=${enrollCount}`);
  }

  // Sleep and wait for Twillio to make file available
  // await new Promise((resolve) => setTimeout(resolve, 1000));
  myVoiceIt.createVoiceEnrollmentByUrl(
    {
      userId,
      audioFileURL: recordingURL,
      phrase: context.VOICEPRINT_PHRASE,
      contentLanguage: context.CONTENT_LANGUAGE,
    },
    async (jsonResponse) => {
      console.log('createVoiceEnrollmentByUrl json: ', jsonResponse.message);
      if (jsonResponse.responseCode === 'SUCC') {
        enrollmentDone();
      } else {
        enrollAgain();
      }

      callback(null, twiml);
    },
  );
};
