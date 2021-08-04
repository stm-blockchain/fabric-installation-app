const { createLogger, format, transports } = require('winston');
const date = new Date()
const logLevel = process.env.INSTALL_LOG_LEVEL || `info`;

const myFormat = format.printf( ({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});
//
// const logger = createLogger({
//     levels: {error: 0, warn: 1, info: 2, debug: 3},
//     format: format.combine(
//         format.label({ label: 'CUSTOM', message: true }),
//         format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
//         myFormat
//     ),
//     transports: [
//         new transports.File({
//             level: logLevel.toLowerCase(),
//             filename: `${process.env.HOME}/ttzTest/${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}.log`
//         })
//     ]
// });

// logger.log({level: 'error', message: 'error', category: "cat"})
// logger.log({level: 'warn', message: 'warn', category: "cat"})
// logger.log({level: 'info', message: 'info', category: "cat"})
// logger.log({level: 'debug', message: 'debug',category: "cat"})
module.exports.getLogger = (label) => {
    return createLogger({
        levels: {error: 0, warn: 1, info: 2, debug: 3},
        format: format.combine(
            format.label({ label: label, message: true }),
            format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
            myFormat
        ),
        transports: [
            new transports.File({
                level: logLevel.toLowerCase(),
                filename: `${process.env.HOME}/ttzTest/${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}.log`
            })
        ]
    })
};