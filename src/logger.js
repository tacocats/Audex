import { createLogger, format, transports } from 'winston'
import path from 'path'
import os from 'os'

const logFile = path.join(os.homedir(), '.audex', 'debug.log')

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message }) => `${level}: ${message}`)
      ),
      level: 'warn'
    }),
    new transports.File({
      filename: logFile,
      level: 'debug'
    })
  ],
  exceptionHandlers: [new transports.File({ filename: logFile })],
  rejectionHandlers: [new transports.File({ filename: logFile })]
})

export default logger
export { logFile }
