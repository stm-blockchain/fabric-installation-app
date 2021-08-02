module.exports = {
   handleErrors(error, req, res, next) {
       res.status(500)
           .send(JSON.stringify(`${error.name}: ${error.message}\n Stack Trace: ${error.cause.stack}`, null, 2));
   }
}