const _ = require('lodash');

const Envable = require('../../mixins/envable');
const Identifyable = require('../../mixins/identifyable');
const Jsonable = require('../../mixins/jsonable');
const Logable = require('../../mixins/logable');


const _jenkins = Symbol('jenkins');
const _name = Symbol('name');
const _translateParamType = Symbol('translateParamType');


/**
 *  The JSON representation of a Jenkins build as returned from the Jenkins
 *  Remote API.
 *
 *  @alias JenkinsBuild
 *  @memberOf subscribers.jenkins
 *  @mixes Eventable
 *  @mixes Identifyable
 *  @mixes Jsonable
 *  @mixes Logable
 *  @extends Eventable
 *  @extends Identifyable
 *  @extends Jsonable
 *  @extends Logable
 *
 *  @param {object}  options
 *  @param {string}  [options.name]     If not provided by `options.build`.
 *  @param {object}  [options.build={}] If available, the JSON returned from Jenkins.
 */
class JenkinsBuild extends Jsonable(Identifyable(Envable(Logable()))) {
  get causes() {
    const actions = this._json.actions || [];
    const causesAction = _.find(actions, action => action.causes);
    const causes = [];

    if (causesAction) {
      causes.push(...causesAction.causes.map(cause => _.omit(cause, '_class')));
    }

    return causes;
  }

  /**
   *  Returns an object with properties `milliseconds`, `seconds`, `minutes`, and `pretty`.
   *  The latter of which is a string with format `#m #s`.
   *  @type {object}
   *  @readonly
   */
  get duration() {
    const { duration } = this._json;
    const data = {
      milliseconds: 0,
      seconds: 0,
      minutes: 0,
      pretty: '0m 0s',
    };

    if (duration) {
      data.milliseconds = duration;
      data.seconds = _.round(duration/1000);
      data.minutes = _.round(data.seconds/60, 2);
      data.pretty = `${_.floor(data.minutes)}m ${data.seconds - _.floor(data.minutes)*60}s`;
    }

    return data;
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
        type: this[_translateParamType](_class.split('.').pop()),
      };
    });
  }


  constructor({ name, build = {}, ...superOpts } = {}) {
    super({ json: build, ...superOpts });

    const buildName = name || build.name;

    if (!buildName) {
      throw new SyntaxError('Invalid name or build provided!');
    }

    build.name = buildName; // avoids custom getter for name
  }


  [_translateParamType](jenkinsParamType) {
    const typeMap = {
      BooleanParameterValue: 'boolean',
      ChoiceParameterValue: 'select',
      StringParameterValue: 'string',
    };
    return typeMap[jenkinsParamType] || jenkinsParamType;
  }
}


module.exports = JenkinsBuild;
