module.exports = {
   handleErrors(error, req, res, next) {
       req.logger.log({level: 'error', message: `${error.name}: ${error.message}\n${error.cause.stack}`});
       return res.status(500)
           .send(JSON.stringify(`${error.name}: ${error.message}\n Stack Trace: ${error.cause.stack}`, null, 2));
   }
}