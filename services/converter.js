const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const crypto = require('crypto')
const fs = require('fs')
const config = require('../config')

ffmpeg.setFfmpegPath(ffmpegPath);

class Converter {
  constructor() {}
}

Converter.videoToAudio = function(videoName) {
  const videoPath = config.uploadDir + videoName
  const audioName = crypto.randomBytes(16).toString("hex") + ".wav"
  const audioPath = config.uploadDir + audioName
  
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath).withNoVideo().outputFormat('wav').audioChannels(1)
      .audioBitrate(128).audioFrequency(16000).save(audioPath)
      .on('end', () => {
        resolve(audioName)
        fs.unlinkSync(videoPath)
      })
  })
}

module.exports = Converter
