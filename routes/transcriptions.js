const express = require('express')
const path = require('path')
const router = express.Router()
const Uploader = require('../services/uploader')
const Converter = require('../services/converter')
const Transcription = require('../services/transcription')
const Subtitle = require('../services/subtitle')

router.post('/transcriptions', async (req, res) => {
  const file = await Uploader.saveFile(req, res)
  const filename = path.basename(file.path)
  const ouputFileName = await Converter.videoToAudio(filename)
  const result = await Transcription.speechToText(ouputFileName)
  const subtitle = await Subtitle.write(result)
  res.send({subtitle: subtitle})
})

module.exports = router
