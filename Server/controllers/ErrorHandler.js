module.exports = {
   handleErrors(error, req, res, next) {
       res.status(500).send(`${error.name}: ${error.message}\n Stack Trace: ${error.cause.stack}`);
   }
}