const express = require('express')
const bodyParser = require('body-parser')
const context = require('../Common/lib/context')

const app = express()
app.use(bodyParser.json())
//init
/*
- create data folder if it doesn't exist +
- start postgres container +
- initialize node-postgress +
- check existing data
- if existing data is present load them into context object
- return the context object
 */
context.init().then(() => {
    require('./routes')(app)
    app.listen(8080)
}).catch(e => {
    console.log(e.stack);
});
