exports.handler = async function (context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  const digits = req.body.Digits;
  const phone = removeSpecialChars(event.From);
  const userId = await callerUserId(phone);
  // When the caller asked to enroll by pressing `1`, provide friendly
  // instructions, otherwise, we always assume their intent is to verify.
  if (digits == 1) {
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
        twiml.redirect("/enroll");
        res.type("text/xml");
        res.send(twiml.toString());
      }
    );
  } else {
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
          twiml.redirect("/verify");
          res.type("text/xml");
          res.send(twiml.toString());
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
              twiml.redirect("/enroll");
            }
          );
        }
      }
    );
  }
  callback(null, twiml);
};
function removeSpecialChars(text){
  return text.replace(/[^0-9a-z]/gi, '');
}

function speak(twiml, textToSpeak, contentLanguage = "en-US"){
  twiml.say(textToSpeak, {
    voice: "alice",
    language: contentLanguage
  });
}