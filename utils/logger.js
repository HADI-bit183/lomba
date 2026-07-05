const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function getTimestamp() {
  return new Date().toISOString();
}

function formatMessage(level, message, meta) {
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  return `[${getTimestamp()}] [${level}] ${message}${metaStr}\n`;
}

function writeLog(level, message, meta) {
  const formatted = formatMessage(level, message, meta);
  // Log to console using standard streams so it's not just basic console.log
  if (level === 'ERROR' || level === 'FATAL') {
    process.stderr.write(formatted);
  } else {
    process.stdout.write(formatted);
  }

  // Also write to file
  const dateStr = new Date().toISOString().split('T')[0];
  const logFile = path.join(logDir, `app-${dateStr}.log`);
  
  fs.appendFile(logFile, formatted, (err) => {
    if (err) process.stderr.write(`Failed to write to log file: ${err.message}\n`);
  });
}

const logger = {
  info: (msg, meta) => writeLog('INFO', msg, meta),
  warn: (msg, meta) => writeLog('WARN', msg, meta),
  error: (msg, meta) => writeLog('ERROR', msg, meta),
  fatal: (msg, meta) => writeLog('FATAL', msg, meta)
};

module.exports = logger;
