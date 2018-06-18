const AWS = require('aws-sdk');
const Loki = require('lokijs');
const AWSS3SyncAdapter = require('lokijs/src/aws-s3-sync-adapter.js');

const Configable = require('../../mixins/configable');
const DbAdapter = require('../../interfaces/db-adapter');

const _db = Symbol('db');
const _loadDB = Symbol('loadDB');
const _saveDB = Symbol('saveDB');


class LokiS3Adapter extends Configable(DbAdapter) {
  constructor({ fileName = 'sandbox.db', ...superOpts } = {}) {
    super(superOpts);

    const adapter = new AWSS3SyncAdapter({
      AWS,
      accessKeyId: this._config.accessKeyId,
      secretAccessKey: this._config.secretAccessKey,
      bucket: this._config.bucket,
    });;

    this[_db] = new Loki(fileName, {
      adapter,
      autoload: false,
      autosave: true,
      autosaveInterval: 300 * 1000 // every 5 mins
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


  [_loadDB]() {
    this[_db].loadDatabase({}, (err) => {
      if (err) {
        this._log.error(err);
        process.exit();
      } else {
        this._log.debug('DB loaded from AWS S3');
      }
    });
  }

  [_saveDB]() {
    this[_db].saveDatabase((err, data) => {
      if (err) {
        this._log.error(err);
        process.exit();
      } else {
        this._log.debug('DB saved to AWS S3');
        this[_loadDB](); // Now attempt to load it back.
      }
   })
  }
}


module.exports = LokiS3Adapter;
