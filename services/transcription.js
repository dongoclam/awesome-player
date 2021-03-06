const fs = require('fs')
const sdk = require('microsoft-cognitiveservices-speech-sdk')
const config = require('../config')

class Transcription {
  constructor() {}
}

Transcription.speechToText = function(filename, language = 'en-US') {
  const filePath = config.uploadDir + filename
  const pushStream = sdk.AudioInputStream.createPushStream()

  fs.createReadStream(filePath)
    .on('data', function(arrayBuffer) {
      pushStream.write(arrayBuffer.buffer)
    })
    .on('end', function() {
      pushStream.close()
    })

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream)
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.SUB_SCRIPTION_KEY,
    process.env.SERVICE_REGION
  )

  speechConfig.speechRecognitionLanguage = language

  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)
  
  recognizer.startContinuousRecognitionAsync()

  return new Promise((resolve, reject) => {
    let result = []
    
    recognizer.recognized = (r, event) => {
      result.push(JSON.parse(event.privResult.privJson))
    }
  
    recognizer.sessionStopped = () => {
      resolve(result)
      fs.unlinkSync(filePath)
    }
  })
}

module.exports = Transcription
