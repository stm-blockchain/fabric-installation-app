const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.json())


require('./routes')(app)

app.listen(8080)
