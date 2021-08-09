const { createLogger, format, transports } = require('winston');
const date = new Date()
const logLevel = () => {
    let level = process.env.INSTALL_LOG_LEVEL || `-`;
    return level.toLowerCase() === `info` || level.toLowerCase() === `debug` ? level.toLowerCase() : `info`;
}

const myFormat = format.printf( ({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});
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
                level: logLevel(),
                filename: `${process.env.HOME}/ttz/logs/${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}.log`
            }),
            new transports.Console({
                level: `debug`,
            })
        ]
    })
};