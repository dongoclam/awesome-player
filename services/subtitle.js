const fs = require('fs')
const crypto = require('crypto')
const config = require('../config')

class Subtitle {
  constructor() {}
}

Subtitle.write = async function(subtitle) {
  const fileName = crypto.randomBytes(16).toString("hex") + ".vtt"
  const filePath = config.uploadDir + fileName
  const stream = fs.createWriteStream(filePath)
  
  stream.once('open', function() {
    let duration = 0
    stream.write('WEBVTT')
    subtitle.forEach(sub => {
      let startTime = duration
      duration = duration + sub.Duration

      if(sub.DisplayText) {
        stream.write('\n\n')
        stream.write(timeConvert(startTime) + "-->" + timeConvert(duration))
        stream.write('\n')
        stream.write(sub.DisplayText)
      }
    })
    stream.close()
  })

  return fileName
}

function timeConvert(time) {
  time = time / 10000000
  var seconds = time % 60;
  var minutes = Math.floor(time / 60) % 60;
  var hours = Math.floor(time / 3600);

  minutes = minutes < 10 ? `0${minutes}` : minutes;
  seconds = seconds < 10 ? `0${seconds}` : seconds;
  hours = hours < 10 ? `0${hours}` : hours;

  return `${hours}:${minutes}:${seconds}`
}

module.exports = Subtitle
