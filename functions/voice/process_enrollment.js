const voiceit2 = require("voiceit2-nodejs");
exports.handler = async function (context, event, callback) {
  console.log('Process Enrollment enrollmentCount ' + event.enrollCount);
  let myVoiceIt = new voiceit2(
    context.VOICEIT_API_KEY,
    context.VOICEIT_API_TOKEN
  );
  //const userId = await callerUserId(removeSpecialChars(req.body.From));
  const userId = 'usr_0e68e1339d2544d3ab63659200b30007';
  var enrollCount = event.enrollCount;
  const recordingURL = event.RecordingUrl + ".wav";
  const twiml = new Twilio.twiml.VoiceResponse();
  console.log('enrollCount' + enrollCount );
  console.log('recordingUrl' + event.RecordingUrl);
  function enrollmentDone() {
    enrollCount++;
    // VoiceIt requires at least 3 successful enrollments.
    if (enrollCount > 2) {
      speak(
        twiml,
        "Thank you, recording received, you are now enrolled and ready to log in"
      );
      twiml.redirect("https://voiceit-4737-dev.twil.io/voice/verify");
    } else {
      speak(
        twiml,
        "Thank you, recording received, you will now be asked to record your phrase again"
      );
      twiml.redirect("https://voiceit-4737-dev.twil.io/voice/enroll?enrollCount=" + enrollCount);
    }
  }

  function enrollAgain() {
    speak(twiml, "Your recording was not successful, please try again");
    twiml.redirect("https://voiceit-4737-dev.twil.io/voice/enroll?enrollCount=" + enrollCount);
  }

  // Sleep and wait for Twillio to make file available
  await new Promise((resolve) => setTimeout(resolve, 1000));
  myVoiceIt.createVoiceEnrollmentByUrl(
    {
      userId: userId,
      audioFileURL: recordingURL,
      phrase: context.VOICEPRINT_PHRASE,
      contentLanguage: context.CONTENT_LANGUAGE,
    },
    async (jsonResponse) => {
      console.log("createVoiceEnrollmentByUrl json: ", jsonResponse.message);
      if (jsonResponse.responseCode === "SUCC") {
        enrollmentDone();
      } else {
        enrollAgain();
      }

      callback(null, twiml);
    }
  );
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
