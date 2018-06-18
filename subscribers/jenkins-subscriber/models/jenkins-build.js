const _ = require('lodash');

const Envable = require('../../../mixins/envable');
const Identifyable = require('../../../mixins/identifyable');
const Jsonable = require('../../../mixins/jsonable');
const Logable = require('../../../mixins/logable');


const _jenkins = Symbol('jenkins');
const _name = Symbol('name');


function _translateParamType(jenkinsParamType) {
  const typeMap = {
    BooleanParameterValue: 'boolean',
    ChoiceParameterValue: 'select',
    StringParameterValue: 'string',
  };
  return typeMap[jenkinsParamType] || jenkinsParamType;
}


/**
 *  The JSON representation of a Jenkins build as returned from the Jenkins
 *  Remote API.
 *
 *  @alias JenkinsBuild
 *  @memberOf subscribers.jenkins
 *  @mixes module:slackbot/mixins~Eventable
 *  @mixes module:slackbot/mixins~Identifyable
 *  @mixes module:slackbot/mixins~Jsonable
 *  @mixes module:slackbot/mixins~Logable
 *  @extends module:slackbot/mixins~Eventable
 *  @extends module:slackbot/mixins~Identifyable
 *  @extends module:slackbot/mixins~Jsonable
 *  @extends module:slackbot/mixins~Logable
 *
 *  @param {object}  options
 *  @param {Jenkins} options.jenkins
 *  @param {string}  [options.name]     If not provided by `options.build`.
 *  @param {object}  [options.build={}] If available, the JSON returned from Jenkins.
 *  @private
 */
class JenkinsBuild extends Jsonable(Identifyable(Envable(Logable()))) {
  /**
   *  Returns this build's number.
   *  @type {number}
   *  @readonly
   */
  get number() {
    return _.get(this, 'builds[0].number');
  }

  /**
   *  Returns a more accessible array of the chosen parameters for this build.
   *  @type {array}
   *  @readonly
   */
  get params() {
    const paramAction = this.actions.find(action => action._class.endsWith('ParametersAction'));
    const rawParams = paramAction.parameters || [];
    return rawParams.map((param) => {
      const { name, value, _class } = param;
      return {
        name,
        value,
        type: _translateParamType(_class.split('.').pop()),
      };
    });
  }

  constructor({ jenkins, name, build = {}, ...superOpts } = {}) {
    super(superOpts);

    const buildName = name || build.name;

    if (!jenkins) {
      throw new Error('Must provide Jenkins instance!');
    } else if (!buildName) {
      throw new Error('Invalid name or build provided!');
    }

    build.name = buildName; // avoids custom getter for name

    Object.defineProperties(this, {
      [_jenkins]: {
        get() { return jenkins; },
      },
      [_name]: {
        get() { return buildName; },
      },
    });
  }

  /**
   *  Re-fetch the build.
   *
   *  @returns {Promise} Resolves with the raw JSON from the request.
   */
  refresh() {
    // might want to remove this functionality to make each build instance
    // more atomic and consistent with other Jsonables
    return this[_jenkins].getBuild({ name: this[_name], buildNumber: this.number, wrap: false })
      .then((build) => {
        Object.assign(this, build);
        return build;
      });
  }

  /**
   *  If the build is in progress, stop it.
   *  @returns {Promise}
   */
  async stop() {
    return await this[_jenkins].stopBuild({ name: this.name, buildNumber: this.number });
  }
}


module.exports = JenkinsBuild;
