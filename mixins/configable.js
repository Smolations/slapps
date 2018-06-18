const fs = require('fs');
const path = require('path');
const traverse = require('traverse');

const _config = Symbol('config');
const _loadConfig = Symbol('loadConfig');

let _configPath = './config';
let _configBaseName;
let _configExt = '.json';

let _configObj;


// lint doesn't like non-stabbies in callbacks, but this function's `this`
// needs to reference the traverse instance
function traverseOne(x) {
  if (typeof (x) === 'string' && /\.pkcs12$/.test(x)) {
    this.update(fs.readFileSync(x));
  }
}


/**
 *  Using this mixin allows for an instance to consume a config object for
 *  a given key. The default path is `./config`. To change it, use the
 *  `Configable.configPath()` method.
 *
 *
 *  @mixin
 *  @name module:slackbot/mixins~Configable
 *  @param {*} SuperClass=class{} The class to mix onto.
 *  @returns {Configable} The mixed class.
 *
 *  @see Configable
 */
const Configable = (SuperClass = class {}) =>

/**
 *  Using this mixin allows for an instance to consume a config object for
 *  a given key.
 *
 *  @class
 *  @alias Configable
 *  @param {object} options={}                             An object containing options for this class,
 *                                                         as well as any other extending classes.
 *  @param {string} options.configKey                      A key corresponding to the top-level keys
 *                                                         in the desired json config.
 *
 *  @see module:slackbot/mixins~Configable
 */
class extends SuperClass {
  /**
   *  Returns the config for the instance.
   *  @type {object}
   *  @readonly
   */
  get _config() {
    return this[_config];
  }


  constructor({ configKey, ...superOpts } = {}) {
    super(superOpts);

    let _configFilePath;

    if (!_configObj) {
      if (!_configBaseName) {
        _configBaseName = this._env || process.env.NODE_ENV || 'development';
      }
      _configFilePath =  path.resolve(_configPath, `${_configBaseName}${_configExt}`);
      _configObj = this[_loadConfig](_configFilePath);
    }

    if (!configKey) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[Configable]  ${this._className || this.constructor.name} was not provided a config key!`);
      }
      this[_config] = {};
    } else if (!_configObj[configKey]) {
      throw new SyntaxError(`Given config key (${configKey}) does not exist in config!`);
    } else {
      this[_config] = Object.assign({}, _configObj[configKey]);
    }
  }

  /**
   *  Loads the JSON object in the config.
   *
   *  @param {string} path Path to the JSON config.
   *  @returns {object}
   *  @private
   */
  [_loadConfig](path) {
    const data = fs.readFileSync(path);
    const json = JSON.parse(data);

    // Object.keys(json).forEach((key) => {
    //   this[key] = json[key];
    //   traverse(this[key]).forEach(traverseOne);
    // });

    return json;
  }
};


/**
 *  Set/Override the config path for all `Configable` instances. The default
 *  path is `./config`.
 *
 *  @function
 *  @name module:slackbot/mixins~Configable.configPath
 *  @param {string} newPath This can be a directory or a file. If it's a directory,
 *                          it should contain a `.json` file with a basename that
 *                          matches the environment set by `Envable` (if the instance
 *                          is mixed with it) or `process.env.NODE_ENV || 'development'`.
 *                          If the path is a file, the basename and extension can be
 *                          whatever you want, as long as the content is a simple
 *                          JSON object.
 */
Configable.configPath = (newPath) => {
  const resolvedPath = path.resolve(newPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new SyntaxError(`Provided config file could not be found at: ${resolvedPath}`);
  }

  const pathStats = fs.statSync(resolvedPath);

  if (pathStats.isFile()) {
    _configPath = path.dirname(resolvedPath);
    _configBaseName = path.basename(resolvedPath);
    _configExt = path.extname(resolvedPath);
  } else if (pathStats.isDirectory()) {
    _configPath = resolvedPath;
  }
}


module.exports = Configable;
