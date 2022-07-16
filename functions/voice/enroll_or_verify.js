const Airtable = require("airtable");
const voiceit2 = require("voiceit2-nodejs");
exports.handler = async function (context, event, callback) {
  let myVoiceIt = new voiceit2(
    context.VOICEIT_API_KEY,
    context.VOICEIT_API_TOKEN
  );
  console.log("In enroll or verify  ");
  console.log('event ' + JSON.stringify(event));
  console.log('context ' + JSON.stringify(context));
  const twiml = new Twilio.twiml.VoiceResponse();
  const digits = event.Digits;
  console.log(event);
  const phone = removeSpecialChars(event.From);
  const userId = await callerUserId(phone, context);
  // When the caller asked to enroll by pressing `1`, provide friendly
  // instructions, otherwise, we always assume their intent is to verify.
  console.log("In enroll or verify digits " + digits);
  if (digits == 1) {
    console.log("re-enroll");
    //Delete User's voice enrollments and re-enroll
    myVoiceIt.deleteAllEnrollments(
      {
        userId: userId,
      },
      async (jsonResponse) => {
        console.log("deleteAllEnrollments JSON: ", jsonResponse.message);
        speak(
          twiml,
          "You have chosen to re enroll your voice, you will now be asked to say a phrase three times, then you will be able to log in with that phrase"
        );
        twiml.redirect(context.SERVERLESS_BASE_URL + "/enroll");
        callback(null, twiml);
      }
    );
  } else {
    console.log("verify");
    //Check for number of enrollments > 2
    myVoiceIt.getAllVoiceEnrollments(
      {
        userId: userId,
      },
      async (jsonResponse) => {
        speak(twiml, "You have chosen to verify your Voice.");
        console.log("jsonResponse.message: ", jsonResponse.message);
        const enrollmentsCount = jsonResponse.count;
        console.log("enrollmentsCount: ", enrollmentsCount);
        if (enrollmentsCount > 2) {
          twiml.redirect(context.SERVERLESS_BASE_URL + "/verify");
          callback(null, twiml);
        } else {
          speak(
            twiml,
            "You do not have enough enrollments and need to re enroll your voice."
          );
          //Delete User's voice enrollments and re-enroll
          myVoiceIt.deleteAllEnrollments(
            {
              userId: userId,
            },
            async (jsonResponse) => {
              console.log("deleteAllEnrollments JSON: ", jsonResponse.message);
              twiml.redirect(context.SERVERLESS_BASE_URL + "/enroll");
              callback(null, twiml);
            }
          );
        }
      }
    );
  }
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
