const fs = require('fs')
const crypto = require('crypto')
const config = require('../config')

class Subtitle {
  constructor() {}
}

Subtitle.write = function(data) {
  const fileName = crypto.randomBytes(16).toString("hex") + ".vtt"
  const filePath = config.uploadDir + fileName
  const stream = fs.createWriteStream(filePath)
  
  return new Promise((resolve, reject) => {
    stream.once('open', function() {
      stream.write('WEBVTT')
      splitSubtitle(data).forEach(subtitle => {
        if(subtitle.text) {
          stream.write('\n\n')
          stream.write(timeConvert(subtitle.startTime) + " --> " + timeConvert(subtitle.endTime))
          stream.write('\n')
          stream.write(subtitle.text)
        }
      })
      stream.close()
      resolve(fileName)
    })
  })
}

function splitSubtitle(data) {
  let result = []

  data.forEach(subtitle => {
    let totalDuration = subtitle.Duration
    let totalLength = subtitle.DisplayText.length
    let startTime = subtitle.Offset

    subtitle.DisplayText.split('.').forEach(text => {
      let duration = (text.length + 1) * totalDuration / totalLength

      result.push({
        text: text,
        startTime: startTime,
        endTime: startTime + duration
      })

      startTime = startTime + duration
    })
  })

  return result
}

function timeConvert(time) {
  time = time / 10000000
  var seconds = (time % 60).toFixed(3)
  var minutes = Math.floor(time / 60) % 60
  var hours = Math.floor(time / 3600)

  minutes = minutes < 10 ? `0${minutes}` : minutes
  seconds = seconds < 10 ? `0${seconds}` : seconds
  hours = hours < 10 ? `0${hours}` : hours

  return `${hours}:${minutes}:${seconds}`
}

module.exports = Subtitle
