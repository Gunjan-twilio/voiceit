## Documentation 

* VoiceIT API Docs can be found [here](https://api.voiceit.io)
* The 120 supported languages and dialects can be found [here](https://api.voiceit.io/#content-languages-with-upcharge) 

## Setup 

Add .env file to the root folder

**Required variables**: 
* Twilio: ACCOUNT_SID, AUTH_TOKEN
* VoiceIt: VOICEIT_API_KEY, VOICEIT_API_TOKEN, CONTENT_LANGUAGE, VOICEPRINT_PHRASE
* Database: DATABASE_URL, AIRTABLE_API_KEY, AIRTABLE_BASE_ID, SERVERLESS_BASE_URL 

Example: 
```
ACCOUNT_SID='AC406**********************'
AUTH_TOKEN='69ee********************'
VOICEIT_API_KEY='key_********************'
VOICEIT_API_TOKEN='tok_*********************'
CONTENT_LANGUAGE=en-US
VOICEPRINT_PHRASE='Never forget tomorrow is a new day'
DATABASE_URL=test
AIRTABLE_API_KEY='key************'
AIRTABLE_BASE_ID='app*********'
SERVERLESS_BASE_URL='https://test-9999-dev.twil.io/test'
```

Route incoming calls to functions/voice/incoming_call.js endpoint

## Flow of the Demo 

Incoming Call: Check if user Exists


## Verification 

Flow: 
1. [Create a user](https://api.voiceit.io/?javascript#create-a-user)
    - Made with VoiceIt.CreateUser API Call within incoming call
2. [Enroll voice](https://api.voiceit.io/?javascript#create-voice-enrollment-by-url)
    - **Users must have at least 3 enrollments to verify**
3. [Verify](https://api.voiceit.io/?javascript#verify-a-user-s-voice-by-url)
    - Users that do not have enough enrollments will be redirected to enrollments
    - If a user has bad enrollments(i.e. lots of background noise, poor connection at the time of the call, etc.), they can be deleted and redone. You can also check enrollments for a particular user in [dashboard](dashboard.voiceit.io)

## Identification

Flow: 
1. [Create group](https://api.voiceit.io/?javascript#create-a-group)
2. [Add users to the group](https://api.voiceit.io/?javascript#create-a-group)
    - **Users must have at least 3 enrollments to be identified**
3. [Identify](https://api.voiceit.io/?javascript#identify-a-user-s-voice-by-url)

Note the phrase and content language can be any of the 120 supported language and can be any custom phrase you add to your account