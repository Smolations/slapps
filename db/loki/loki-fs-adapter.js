const Loki = require('lokijs');
const LokiFsStructuredAdapter = require('lokijs/src/loki-fs-structured-adapter.js');

const DbAdapter = require('../../interfaces/db-adapter');

const _db = Symbol('db');
const _initCallback = Symbol('initCallback');


class LokiFsAdapter extends DbAdapter {
  constructor({ fileName = 'db/data/sandbox.db', ...superOpts } = {}) {
    super(superOpts);

    this[_db] = new Loki(fileName, {
      adapter: new LokiFsStructuredAdapter(),
      autoload: true,
      autoloadCallback : () => this[_initCallback](),
      autosave: true,
      autosaveInterval: 5 * 1000
    });

    process.on('SIGINT', () => {
      this._log.debug('heard SIGINT. disconnecting...');
      this.disconnect();
      process.exit(0);
    });
  }

  getInstance() {
    return this[_db];
  }

  disconnect() {
    this._log.debug('#disconnect() flushing database...');
    this[_db].close();
  }

  /**
   *  All of the initialization for--whatever--goes here.
   *  @private
   */
  [_initCallback]() {
    // maybe nothing here so other bots can use this adapter without
    // another bot's tables mixing it all up...
  }
}


module.exports = LokiFsAdapter;
