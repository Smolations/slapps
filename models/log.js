const _ = require('lodash');
const moment = require('moment');
const winston = require('winston'); // https://github.com/winstonjs/winston
const { createLogger, format, transports } = winston;
const DailyRotateFile = require('winston-daily-rotate-file'); // https://github.com/winstonjs/winston-daily-rotate-file

const Configable = require('../mixins/configable');
const Envable = require('../mixins/envable');
const Identifyable = require('../mixins/identifyable');

const _logger = Symbol('logger');
const _label = Symbol('label');

let _loggers;


function _format() {
  const simpleFormat = format.printf((info) => {
    const targetLabelLength = 20;
    const targetLevelLength = 7; // length of longest preconfigured ('verbose')
    const timestamp = moment(info.timestamp).format('HH:mm:ss.SSS');
    let label = info.label || '?';
    let level = `${info.level.toUpperCase()}`;

    level = level.padStart(targetLevelLength); // account for colon

    if (label.length > targetLabelLength) {
      label = `${label.slice(0, targetLabelLength - 3,)}...`;
    }

    label = `[${label}]`.padEnd(targetLabelLength + 2); // account for brackets

    return `${timestamp} ${level} ${label} ${info.message}`;
  });

  const formatCombination = [
    // format.colorize(),
    format.timestamp(),
    format.splat(),
    simpleFormat,
  ];

  return format.combine(...formatCombination);
}

function _transports(path, basename) {
  const format = _format();
  const level = 'debug';
  const _transports = [
    new DailyRotateFile({
      dirname: path,
      filename: `%DATE%.${basename}.log`,
      // datePattern: 'yyyy-MM-dd',
      prepend: true,
      maxFiles: '3d',
      level,
      format,
    }),
  ];

  if (process.env.NODE_ENV !== 'test') {
    console.log('adding Console transport...')
    _transports.push(new transports.Console({
      level,
      format,
    }));
  }

  return _transports;
}


/**
 *  A wrapper class around a Winston logger. It provides pass-throughs to
 *  the logging methods that automatically add a prefix to the log statement
 *  so that the origin of the messages can be more easily identified.
 *
 *  @mixes Configable
 *  @mixes Envable
 *  @extends Configable
 *  @extends Envable
 */
class Log extends Identifyable(Configable(Envable())) {
  constructor({ label, opts = {}, ...superOpts } = {}) {
    super({ configKey: 'log', ...superOpts });

    const basename = this._config.basename || this._env;
    const logPath = this._config.path || './log';

    this[_label] = label;

    // console.log(`instantiating new log for: ${label}`);

    if (!_loggers) {
      _loggers = new winston.Container({
        level: 'debug',
        format: _format(),
        transports: _transports(logPath, basename),
      });
      // winston.on('error', (err) => { console.error(err); });
    }

    this[_logger] = _loggers.get(label, opts);
  }

  /**
   *  The generic log method. The log level must be specified before any content.
   *
   *  @param {string} level The log level.
   *  @param {*} ...args Any other args allows by the Winston `log` method.
   */
  log(level, ...splat) {
    const loggerArgs = { level, label: this[_label] };
    const message = splat.shift();
    const meta = {};
    const [splatTail] = splat.slice(-1, 1);

    if (_.isPlainObject(splatTail)) {
      Object.assign(meta, splat.pop());
    }

    Object.assign(loggerArgs, { message, splat, meta });

    this[_logger].log(loggerArgs);
  }

  /**
   *  The passthrough for the Winston `debug` logger method.
   *  @param {*} ...args The args to pass to the method.
   */
  debug(...args) {
    this.log('debug', ...args);
  }

  /**
   *  The passthrough for the Winston `error` logger method.
   *  @param {*} ...args The args to pass to the method.
   */
  error(...args) {
    this.log('error', ...args);
  }

  /**
   *  The passthrough for the Winston `info` logger method.
   *  @param {*} ...args The args to pass to the method.
   */
  info(...args) {
    this.log('info', ...args);
  }

  /**
   *  The passthrough for the Winston `warn` logger method.
   *  @param {*} ...args The args to pass to the method.
   */
  warn(...args) {
    this.log('warn', ...args);
  }

  /**
   *  A new method, specifically for logging a message with a json payload.
   *  The message is displayed along with the pretty-printed JSON object.
   *  @param {string} message   The message.
   *  @param {object} [json={}] The json object to pretty-print.
   *
   *  @todo the check for `._json` can probably be removed since adding
   *  the `toJSON` method for `Jsonable` instances...
   */
  json(message, json = {}) {
    const pojo = json._json ? json._json : json; // support Jsonable instances
    this.debug(`${message}\n${JSON.stringify(pojo, null, 2).replace(/\\"/, '"')}`);
  }
}


module.exports = Log;
