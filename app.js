const express = require('express')
const bodyParser = require('body-parser')
const favicon = require('serve-favicon')
const app = express()
const config = require('./config')

const homeRouter = require('./routes/home')
const transcriptionsRouter = require('./routes/transcriptions')

app.set('view engine', 'hbs')
app.use(favicon('./public/img/favicon.ico'))
app.use(express.static('public'))
app.use('/static', express.static('uploads'))
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/', homeRouter)
app.use(transcriptionsRouter)

app.listen(config.port, () => {
  console.log(`Runing on port ${config.port}...`)
})
