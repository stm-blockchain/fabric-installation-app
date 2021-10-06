const express = require('express');
const bodyParser = require('body-parser');
const context = require('../Common/lib/context');
const { Installation, DockerApi, Logger } = require('../Common');
const app = express();
const { v4: uuidv4 } = require('uuid');
const ErrorHandler = require('./controllers/ErrorHandler');
const cors = require('cors');

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
    req.logger.log({level: 'debug', message: `New request received: To ${req.originalUrl} from ${req.ip}\nPayload: ${JSON.stringify(req.body, null, 2)}`});
    next();
}
app.use(bodyParser.json());
app.options('*', cors())
app.use(cors());
app.use(inject);
app.use(logRequest);
require('./routes')(app, context);
app.use(ErrorHandler.handleErrors);

context.init(Logger.getLogger(`init`)).then(() => {
    app.listen(5000);
    console.log('Listening: http://localhost:5000');
}).catch(e => {
    console.log(e.stack);
});
