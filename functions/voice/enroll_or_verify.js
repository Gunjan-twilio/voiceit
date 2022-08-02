/* eslint-disable consistent-return */
const Airtable = require('airtable');
const Voiceit2 = require('voiceit2-nodejs');

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
  let userId = 0;
  try {
    const base = new Airtable({ apiKey: context.AIRTABLE_API_KEY }).base(
      context.AIRTABLE_BASE_ID,
    );
    const records = await base('Voice Biometric').select().all();
    records.forEach((record) => {
      const recordPhone = record.get('Phone Number');
      if (recordPhone === phone) {
        userId = record.get('Biometric UserId');
        return userId;
      }
    });
  } catch (err) {
    console.log(err);
  }
  return userId;
};

// eslint-disable-next-line no-unused-vars
const deleteUserId = async (phone, context) => {
  const userId = 0;
  try {
    const base = new Airtable({ apiKey: context.AIRTABLE_API_KEY }).base(
      context.AIRTABLE_BASE_ID,
    );
    // eslint-disable-next-line no-unused-vars
    let recordIdToDelete = '';
    const records = await base('Voice Biometric').select().all();
    records.forEach((record) => {
      const recordPhone = record.get('Phone Number');
      if (recordPhone === phone) {
        recordIdToDelete = record.getId();
      }
    });
    // @TODO: turn voice biometric into an environment variable
    // eslint-disable-next-line no-unused-vars
    base('Voice Biometric').destroy(['recbKxkEDgw2qivAe'], (err, deletedRecords) => {
      if (err) {
        console.error(err);
      }
    });
  } catch (err) {
    console.log(err);
  }
  return userId;
};

exports.handler = async function (context, event, callback) {
  const myVoiceIt = new Voiceit2(
    context.VOICEIT_API_KEY,
    context.VOICEIT_API_TOKEN,
  );
  // eslint-disable-next-line no-undef
  const twiml = new Twilio.twiml.VoiceResponse();
  const digits = event.Digits;
  const phone = removeSpecialChars(event.From);
  const userId = await callerUserId(phone, context);
  // When the caller asked to enroll by pressing `1`, provide friendly
  // instructions, otherwise, we always assume their intent is to verify.
  if (digits === 1) {
    // Delete User's voice enrollments and re-enroll
    myVoiceIt.deleteAllEnrollments(
      {
        userId,
      },
      // @TODO: check the response and make sure it was successful,
      // otherwise let the user know something went wrong
      async () => {
        speak(
          twiml,
          'You have chosen to re enroll your voice, you will now be asked to say a phrase three times, then you will be able to log in with that phrase',
        );
        twiml.redirect(`${context.SERVERLESS_BASE_URL}/enroll`);
        callback(null, twiml);
      },
    );
  } else if (digits === 2) {
    // const deleteProgress = await deleteUserId(phone, context);
    // myVoiceIt.deleteAllEnrollments(
    //   {
    //     userId: userId,
    //   },
    //   async (jsonResponse) => {
    //     speak(
    //       twiml,
    //       "You have chosen to delete your account"
    //     );
    //     callback(null, twiml);
    //   }
    // );
  } else {
    // Check for number of enrollments > 2
    myVoiceIt.getAllVoiceEnrollments(
      {
        userId,
      },
      async (jsonResponse) => {
        speak(twiml, 'You have chosen to verify your Voice.');
        const enrollmentsCount = jsonResponse.count;
        if (enrollmentsCount > 2) {
          twiml.redirect(`${context.SERVERLESS_BASE_URL}/verify`);
          callback(null, twiml);
        } else {
          speak(
            twiml,
            'You do not have enough enrollments and need to re enroll your voice.',
          );
          // Delete User's voice enrollments and re-enroll
          myVoiceIt.deleteAllEnrollments(
            {
              userId,
            },
            // eslint-disable-next-line no-unused-vars
            async (deleteEnrollmentsResponse) => {
              twiml.redirect(`${context.SERVERLESS_BASE_URL}/enroll`);
              callback(null, twiml);
            },
          );
        }
      },
    );
  }
  // callback(null, twiml);
};
