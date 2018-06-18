const fs = require('fs');
const path = require('path');


/**
 *  A class to assist with requiring/purging modules. This is useful if a
 *  module uses a private variable that needs to be reset for other tests.
 *
 *  @param {string} name The name of the module (what you would probably name
 *                       the variable when requiring the module).
 *  @param {string} modulePath The path (relative to project root) to the module.
 */
class PurgeableModule {
  constructor(name, modulePath) {
    const resolvedPath = path.resolve(__dirname, '..', '..', modulePath);

    if (!name || !modulePath) {
      throw new TypeError(`Must provide name and path to module!`);
    } else if (!fs.existsSync(`${modulePath}.js`)) {
      throw new SyntaxError(`Given path (to file ${modulePath}.js) could not be found!`);
    }

    this.name = name;
    this.path = resolvedPath;
  }

  /**
   *  Require the module. This is basically like a global `require`.
   *  @returns {*}
   */
  require() {
    return require(this.path);
  }

  /**
   *  Purge the module from the `require cache`.
   */
  purge() {
    delete require.cache[require.resolve(this.path)];
  }
}


module.exports = PurgeableModule;
