const winston = require(`winston`);
const date = new Date()
const logger = winston.createLogger({
    transports: [
        new winston.transports.File({
            filename: `${process.env.HOME}/ttzTest/${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}.log`,
        })
    ]
});
