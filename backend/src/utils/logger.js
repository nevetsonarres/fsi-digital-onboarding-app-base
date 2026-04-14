const { createLogger, format, transports } = require('winston');
const config = require('../config');

const logger = createLogger({
  level: config.nodeEnv === 'test' ? 'silent' : 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
