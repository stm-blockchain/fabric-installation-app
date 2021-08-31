const express = require('express');
const bodyParser = require('body-parser');
const context = require('../Common/lib/context');
const { Installation, DockerApi, Logger } = require('../Common');
const app = express();
const { v4: uuidv4 } = require('uuid');
const ErrorHandler = require('./controllers/ErrorHandler')

const inject = (req, res, next) => {
    const logger = Logger.getLogger(uuidv4());
    context.setLogger(logger);
    req.context = context;
    req.installation = new Installation(new DockerApi(), logger);
    req.logger = logger;
    next();
}

const logRequest = (req, res, next) => {
    req.logger.log({level: 'info', message: `New request received: ${req.originalUrl}`});
    req.logger.log({level: 'debug', message: `New request received: To ${req.originalUrl} from ${req.ip}\nPayload: ${req.body}`});
    next();
}
app.use(bodyParser.json());
app.use(inject);
app.use(logRequest);
require('./routes')(app, context);
app.use(ErrorHandler.handleErrors);

context.init(Logger.getLogger(`init`)).then(() => {
    app.listen(8080);
}).catch(e => {
    console.log(e.stack);
});
