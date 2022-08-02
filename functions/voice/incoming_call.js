/* eslint-disable consistent-return */
const Voiceit2 = require('voiceit2-nodejs');
const Airtable = require('airtable');

function removeSpecialChars(text) {
  return text.replace(/[^0-9a-z]/gi, '');
}

const callerUserId = async (phone, context) => {
  console.log('In callerUserId from airtable');
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
  const myVoiceIt = new Voiceit2(
    context.VOICEIT_API_KEY,
    context.VOICEIT_API_TOKEN,
  );
  // eslint-disable-next-line no-undef
  const twiml = new Twilio.twiml.VoiceResponse();
  const phone = removeSpecialChars(event.From);

  // @TODO in airtable add a mapping of phonenumber -> userid, fetch it when it comes in - done
  // @TODO helper functions in one place
  // @TODO move URL to environment variables - done
  // @TODO add an option to delete all the enrollments - done
  // @TODO change the phrase
  // @TODO review the list of the languages
  // @TODO store userId or groupId in cookies to not call databases too much

  const userId = await callerUserId(phone, context);

  // Check for user in VoiceIt db
  myVoiceIt.checkUserExists(
    {
      userId,
    },
    async (checkUserExistsResponse) => {
      console.log(`jsonResponse${JSON.stringify(checkUserExistsResponse)}`);
      // User already exists
      if (checkUserExistsResponse.exists === true) {
        // Greet the caller when their account profile is recognized by the VoiceIt API.
        twiml.say('Welcome back to the Voice It Verification Demo, your phone number has been recognized');
        // Let's provide the caller with an opportunity to enroll by typing `1` on
        // their phone's keypad. Use the <Gather> verb to collect user input
        twiml.gather({
          action: `${context.SERVERLESS_BASE_URL}/enroll_or_verify`,
          numDigits: 1,
          timeout: 5,
        });
        twiml.say('You may now log in, or press one to re enroll or two to delete your account');
        twiml.redirect(
          `${context.SERVERLESS_BASE_URL}/enroll_or_verify?digits=TIMEOUT`,
        );
        callback(null, twiml);
      } else {
        // Create a new user for new number
        myVoiceIt.createUser(async (createUserResponse) => {
          twiml.say('Welcome to the Voice It Verification Demo Test, you are a new user and will now be enrolled');
          const base = new Airtable({ apiKey: context.AIRTABLE_API_KEY }).base(
            context.AIRTABLE_BASE_ID,
          );

          base('Voice Biometric').create(
            [
              {
                fields: {
                  'Phone Number': phone,
                  'Biometric UserId': createUserResponse.userId,
                },
              },
            ],
            (err) => {
              if (err) {
                console.error(err);
              }
            },
          );
          twiml.redirect(`${context.SERVERLESS_BASE_URL}/enroll`);
          callback(null, twiml);
        });
      }
    },
  );
  // callback(null, twiml);
};
