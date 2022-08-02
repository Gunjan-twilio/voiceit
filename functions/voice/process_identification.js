/* eslint-disable func-names */
const Voiceit2 = require('voiceit2-nodejs');
const Airtable = require('airtable');

let numTries = 0;

function speak(twiml, textToSpeak, contentLanguage = 'en-US') {
  twiml.say(textToSpeak, {
    voice: 'alice',
    language: contentLanguage,
  });
}

function removeSpecialChars(text) {
  return text.replace(/[^0-9a-z]/gi, '');
}

const callerGroupId = async (phone, context) => {
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
  // eslint-disable-next-line no-undef
  const twiml = new Twilio.twiml.VoiceResponse();
  const myVoiceIt = new Voiceit2(context.VOICEIT_API_KEY, context.VOICEIT_API_TOKEN);
  const groupId = await callerGroupId(removeSpecialChars(event.From), context);
  const audioFileURL = `${event.RecordingUrl}.wav`;

  myVoiceIt.voiceIdentificationByUrl({
    groupId,
    audioFileURL,
    phrase: context.VOICEPRINT_PHRASE,
    contentLanguage: context.CONTENT_LANGUAGE,
  }, async (jsonResponse) => {
    console.log('createVoiceVerificationByUrl: ', jsonResponse.message);

    if (jsonResponse.responseCode === 'SUCC') {
      speak(twiml, 'Verification successful!');
      speak(twiml, 'Thank you for calling voice its voice biometrics demo. Have a nice day!');
      // Hang up
    } else if (numTries > 2) {
      // 3 attempts failed
      speak(twiml, 'Too many failed attempts. Please call back and select option 1 to re enroll and verify again.');
    } else {
      switch (jsonResponse.responseCode) {
        case 'STTF':
          speak(twiml, 'Verification failed. It seems you may not have said your enrolled phrase. Please try again.');
          numTries += 1;
          twiml.redirect(`${context.SERVERLESS_BASE_URL}/verify`);
          break;
        case 'FAIL':
          speak(twiml, 'Your verification did not pass, please try again.');
          numTries += 1;
          twiml.redirect('/verify');
          break;
        case 'SSTQ':
          speak(twiml, 'Please speak a little louder and try again.');
          numTries += 1;
          twiml.redirect(`${context.SERVERLESS_BASE_URL}/verify`);
          break;
        case 'SSTL':
          speak(twiml, 'Please speak a little quieter and try again.');
          numTries += 1;
          twiml.redirect(`${context.SERVERLESS_BASE_URL}/verify`);
          break;
        default:
          speak(twiml, 'Something went wrong. Your verification did not pass, please try again.');
          numTries += 1;
          twiml.redirect(`${context.SERVERLESS_BASE_URL}/verify`);
      }
    }
    callback(null, twiml);
  });
};
