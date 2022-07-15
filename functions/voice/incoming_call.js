const voiceit2 = require("voiceit2-nodejs");
exports.handler = async function (context, event, callback) {
  let myVoiceIt = new voiceit2(context.VOICEIT_API_KEY, context.VOICEIT_API_TOKEN);
  const twiml = new Twilio.twiml.VoiceResponse();
  const phone = removeSpecialChars(event.From);
  const userId = 'usr_0e68e1339d2544d3ab63659200b30007';
  /*//@TODO in airtable add a mapping of phonenumber -> userid, fetch it when it comes in
  //@TODO helper functions in one place
  //@TODO move URL to environment variables
  //@TODO add an option to delete all the enrollments 
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
  //const userid = await callerUserId(phone);
  console.log('UserId ' + userId);
  console.log('phone ' + phone);
  console.log('API_KEY ' + context.VOICEIT_API_KEY);
  console.log('TOKEN ' + context.VOICEIT_API_TOKEN);
  myVoiceIt.getAllUsers((vals) => {console.log('count ' + vals);});
  // Check for user in VoiceIt db
 /* myVoiceIt.checkUserExists(
    {
      userId: userId,
    },
    async (jsonResponse) => {
      console.log('jsonResponse' + jsonResponse);
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
          action: "https://voiceit-4737-dev.twil.io/voice/enroll_or_verify",
          numDigits: 1,
          timeout: 5,
        });
        speak(gather, "You may now log in, or press one to re enroll");
        twiml.redirect("https://voiceit-4737-dev.twil.io/voice/enroll_or_verify?digits=TIMEOUT");
        callback(null, twiml);
      } else {*/
        // Create a new user for new number
        myVoiceIt.createUser(async (jsonResponse) => {
          console.log('create user response ' + JSON.stringify(jsonResponse)),
          speak(
            twiml,
            "Welcome to the Voice It Verification Demo, you are a new user and will now be enrolled"
          );
          /* TODO replace with Airtable
          try {
            const client = await pool.connect();
            const result = await client.query(
              "insert into users values (" +
                phone +
                ", '" +
                jsonResponse.userId +
                "')"
            );
            client.release();
          } catch (err) {
            console.error(err);
            res.send("Error " + err);
          }*/

          twiml.redirect("https://voiceit-4737-dev.twil.io/voice/enroll");
          callback(null, twiml);
        });
      }
   // }
 // );
//  callback(null, twiml);
//};
function removeSpecialChars(text){
  return text.replace(/[^0-9a-z]/gi, '');
}
function speak(twiml, textToSpeak, contentLanguage = "en-US"){
  twiml.say(textToSpeak, {
    voice: "alice",
    language: contentLanguage
  });
}