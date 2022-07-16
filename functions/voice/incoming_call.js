const voiceit2 = require("voiceit2-nodejs");
const Airtable = require("airtable");
exports.handler = async function (context, event, callback) {
  let myVoiceIt = new voiceit2(
    context.VOICEIT_API_KEY,
    context.VOICEIT_API_TOKEN
  );
  const twiml = new Twilio.twiml.VoiceResponse();
  const phone = removeSpecialChars(event.From);

  /*//@TODO in airtable add a mapping of phonenumber -> userid, fetch it when it comes in - done
  //@TODO helper functions in one place
  //@TODO move URL to environment variables - done
  //@TODO add an option to delete all the enrollments - done
  //@TODO change the phrase
  //@TODO review the list of the languages

  
  myVoiceIt.deleteAllEnrollments({
      userId: userId,
      }, async (jsonResponse)=>{
        console.log("deleteAllEnrollments JSON: ", jsonResponse.message);
        speak(twiml, "You have chosen to re enroll your voice, you will now be asked to say a phrase three times, then you will be able to log in with that phrase");
        twiml.redirect('/enroll');
        res.type('text/xml');
        res.send(twiml.toString());
    });
  */
  const userId = await callerUserId(phone, context);
  console.log("UserId " + userId);
  console.log("phone " + phone);
  console.log("API_KEY " + context.VOICEIT_API_KEY);
  console.log("TOKEN " + context.VOICEIT_API_TOKEN);

  // Check for user in VoiceIt db
  myVoiceIt.checkUserExists(
    {
      userId: userId,
    },
    async (jsonResponse) => {
      console.log("jsonResponse" + JSON.stringify(jsonResponse));
      // User already exists
      if (jsonResponse.exists === true) {
        // Greet the caller when their account profile is recognized by the VoiceIt API.
        speak(
          twiml,
          "Welcome back to the Voice It Verification Demo, your phone number has been recognized"
        );
        // Let's provide the caller with an opportunity to enroll by typing `1` on
        // their phone's keypad. Use the <Gather> verb to collect user input
        const gather = twiml.gather({
          action: context.SERVERLESS_BASE_URL + "/enroll_or_verify",
          numDigits: 1,
          timeout: 5,
        });
        speak(gather, "You may now log in, or press one to re enroll");
        twiml.redirect(
          context.SERVERLESS_BASE_URL + "/enroll_or_verify?digits=TIMEOUT"
        );
        callback(null, twiml);
      } else {
        // Create a new user for new number
        myVoiceIt.createUser(async (jsonResponse) => {
          console.log("create user response " + JSON.stringify(jsonResponse)),
            speak(
              twiml,
              "Welcome to the Voice It Verification Demo, you are a new user and will now be enrolled"
            );
            var base = new Airtable({ apiKey: context.AIRTABLE_API_KEY }).base(
              context.AIRTABLE_BASE_ID
            );

          base("Voice Biometric").create(
            [
              {
                fields: {
                  "Phone Number": phone,
                  "Biometric UserId": jsonResponse.userId,
                },
              },
            ],
            function (err) {
              if (err) {
                console.error(err);
              }
            }
          );
          twiml.redirect(context.SERVERLESS_BASE_URL + "/enroll");
          callback(null, twiml);
        });
      }
    }
  );
  //callback(null, twiml);
};


function removeSpecialChars(text) {
  return text.replace(/[^0-9a-z]/gi, "");
}
function speak(twiml, textToSpeak, contentLanguage = "en-US") {
  twiml.say(textToSpeak, {
    voice: "alice",
    language: contentLanguage,
  });
}

const callerUserId = async (phone, context) => {
  console.log("In callerUserId from airtable");
  let userId = 0;
  try {
    var base = new Airtable({ apiKey: context.AIRTABLE_API_KEY }).base(
      context.AIRTABLE_BASE_ID
    );
    const records = await base("Voice Biometric").select().all();
    records.forEach(function (record) {
      let record_phone = record.get("Phone Number");
      if (record_phone == phone) {
        userId = record.get("Biometric UserId");
        console.log("In callerUserId userId" + userId);
        return userId;
      }
    });
  } catch (err) {
    console.log("error in callerUserId " + err);
  }
  return userId;
};
