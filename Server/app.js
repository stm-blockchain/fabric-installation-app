const express = require('express')
const bodyParser = require('body-parser')
const context = require('../Common/lib/context')
const { Installation } = require('../Common/index');
const installation = new Installation();

const app = express()
const inject = (req, res, next) => {
    req.context = context;
    req.installation = installation;
    next();
}
app.use(bodyParser.json())
app.use(inject);
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
    require('./routes')(app, context);
    app.listen(8080);
}).catch(e => {
    console.log(e.stack);
});
