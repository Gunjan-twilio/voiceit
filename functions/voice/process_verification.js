const voiceit2 = require("voiceit2-nodejs");
const Airtable = require("airtable");
var numTries = 0;

//@TODO : Persist the userid in airtable
//@TODO
exports.handler = async function(context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  let myVoiceIt = new voiceit2(context.VOICEIT_API_KEY, context.VOICEIT_API_TOKEN);
  const userId = await callerUserId(removeSpecialChars(event.From), context);
  const recordingURL = event.RecordingUrl + '.wav';

  // Sleep and wait for Twillio to make file available
  await new Promise(resolve => setTimeout(resolve, 1000));
  myVoiceIt.voiceVerificationByUrl({
    userId: userId,
  	audioFileURL: recordingURL,
    phrase: context.VOICEPRINT_PHRASE,
  	contentLanguage: context.CONTENT_LANGUAGE,
  	}, async (jsonResponse)=>{
      console.log("createVoiceVerificationByUrl: ", jsonResponse.message);

      if (jsonResponse.responseCode == "SUCC") {
        speak(twiml, 'Verification successful!');
        speak(twiml,'Thank you for calling voice its voice biometrics demo. Have a nice day!');
        //Hang up
      } else if (numTries > 2) {
        //3 attempts failed
        speak(twiml,'Too many failed attempts. Please call back and select option 1 to re enroll and verify again.');
      } else {
        switch (jsonResponse.responseCode) {
          case "STTF":
              speak(twiml, "Verification failed. It seems you may not have said your enrolled phrase. Please try again.");
              numTries = numTries + 1;
              twiml.redirect(context.SERVERLESS_BASE_URL + '/verify');
              break;
          case "FAIL":
              speak(twiml,"Your verification did not pass, please try again.");
              numTries = numTries + 1;
              twiml.redirect('/verify');
              break;
          case "SSTQ":
              speak(twiml,"Please speak a little louder and try again.");
              numTries = numTries + 1;
              twiml.redirect(context.SERVERLESS_BASE_URL + '/verify');
              break;
          case "SSTL":
              speak(twiml,"Please speak a little quieter and try again.");
              numTries = numTries + 1;
              twiml.redirect(context.SERVERLESS_BASE_URL + '/verify');
              break;
          default:
              speak(twiml,"Something went wrong. Your verification did not pass, please try again.");
              numTries = numTries + 1;
              twiml.redirect(context.SERVERLESS_BASE_URL + '/verify');
          }
      }
  callback(null, twiml);
});
};

function speak(twiml, textToSpeak, contentLanguage = "en-US"){
  twiml.say(textToSpeak, {
    voice: "alice",
    language: contentLanguage
  });
}

function removeSpecialChars(text){
  return text.replace(/[^0-9a-z]/gi, '');
}
function speak(twiml, textToSpeak, contentLanguage = "en-US"){
  twiml.say(textToSpeak, {
    voice: "alice",
    language: contentLanguage
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
