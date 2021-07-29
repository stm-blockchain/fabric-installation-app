const express = require('express')
const bodyParser = require('body-parser')
const context = require('../Common/lib/context')
const { Installation, DockerApi } = require('../Common');
const app = express()

const inject = (req, res, next) => {
    req.context = context;
    req.installation = new Installation(new DockerApi())
    next();
}
app.use(bodyParser.json())
app.use(inject);

context.init().then(() => {
    require('./routes')(app, context);
    app.listen(8080);
}).catch(e => {
    console.log(e.stack);
});
