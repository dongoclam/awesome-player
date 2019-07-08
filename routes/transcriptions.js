const express = require('express')
const router = express.Router()
const Uploader = require('../services/uploader')
const Converter = require('../services/converter')
const Transcription = require('../services/transcription')
const Subtitle = require('../services/subtitle')

router.post('/transcriptions', async (req, res) => {
  Uploader.saveFile(req, res)
    .then(filename => Converter.videoToAudio(filename))
    .then(filename => Transcription.speechToText(filename))
    .then(data => Subtitle.write(data))
    .then(subtitle => res.send({subtitle: subtitle}))
})

module.exports = router
