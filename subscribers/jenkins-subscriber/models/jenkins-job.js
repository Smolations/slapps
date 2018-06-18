const _ = require('lodash');

const Envable = require('../../../mixins/envable');
const Jsonable = require('../../../mixins/jsonable');
const Logable = require('../../../mixins/logable');


const _colorData = Symbol('colorData');
const _findColor = Symbol('findColor');
const _jenkins = Symbol('jenkins');
const _name = Symbol('name');
const _translateParamType = Symbol('translateParamType');


/**
 *  The JSON representation of a Jenkins job as returned from the Jenkins
 *  Remote API.
 *
 *  @alias JenkinsJob
 *  @memberOf subscribers.jenkins
 *  @mixes module:slackbot/mixins~Eventable
 *  @mixes module:slackbot/mixins~Jsonable
 *  @mixes module:slackbot/mixins~Logable
 *  @extends module:slackbot/mixins~Eventable
 *  @extends module:slackbot/mixins~Jsonable
 *  @extends module:slackbot/mixins~Logable
 *
 *  @param {object}  options
 *  @param {Jenkins} options.jenkins
 *  @param {string}  [options.name]   If not provided by `options.job`.
 *  @param {object}  [options.job={}] If available, the JSON returned from Jenkins.
 *
 *  @throws {Error} Must provide jenkins instance and job name.
 *  @private
 */
class JenkinsJob extends Jsonable(Envable(Logable())) {
  /**
   *  Returns a more accessible array of the available parameters for a
   *  given job.
   *
   *  @param {object|JenkinsJob} job An `actions` property __must__ exist or an
   *                                 empty array will be returned.
   *  @returns {array<jobParamDef>}
   */
  static getParamDefs(job = {}) {
    const defs = [];
    const json = job._json || job;
    const { actions } = json;

    if (actions) {
      const paramDefsAction = actions.find(action => _.isArray(action.parameterDefinitions));
      if (paramDefsAction && paramDefsAction.parameterDefinitions.length) {
        // this._log.debug(`found ${paramDefsAction.parameterDefinitions.length} param definitions`);
        paramDefsAction.parameterDefinitions.forEach((def) => {
          const { name, type, description, choices } = def;
          const newDef = { name, description };

          newDef.type = JenkinsJob[_translateParamType](type);
          newDef.default = _.get(def, 'defaultParameterValue.value', null);

          if (choices) {
            newDef.choices = choices;
          }

          defs.push(newDef);
        });
      }
    }
    return defs;
  }

  /**
   *  Translate a parameter definition found on the job to something more...
   *  javascript-friendly.
   *
   *  @param {string} jenkinsParamType
   *  @returns {string} If matched with a known type, the "friendly" type is returned.
   *                    Otherwise, the original parameter is returned.
   *
   *  @private
   */
  static [_translateParamType](jenkinsParamType) {
    const typeMap = {
      BooleanParameterDefinition: 'boolean',
      ChoiceParameterDefinition: 'select',
      StringParameterDefinition: 'string',
    };
    return typeMap[jenkinsParamType] || jenkinsParamType;
  }

  // END static methods

  /**
   *  Returns a more accessible array of the available parameters for building
   *  this job. Accesses {@link JenkinsJob.getParamDefs} behind the scenes.
   *  @type {array<jobParamDef>}
   *  @readonly
   */
  get paramDefs() {
    return JenkinsJob.getParamDefs(this._json);
  }

  /**
   *  The job status object as interpreted from the job's `"color"`.
   *  @type {colorObj}
   *  @readonly
   */
  get status() {
    if (this._json.inQueue) {
      return this[_findColor]('queued');
    }
    return this[_findColor](this._json.color);
  }

  /**
   *  Collection of all available `colorObj`s.
   *  @type {Array<colorObj>}
   *  @private
   *  @readonly
   */
  get [_colorData]() {
    return [
      { color: 'queued', status: 'QUEUED', emoji: ':jenkins_status_grey:' },
      { color: 'red', status: 'FAILURE', emoji: ':jenkins_status_red:' },
      { color: 'red_anime', status: 'FAILURE', emoji: ':jenkins_status_red_anime:' },
      { color: 'yellow', status: 'UNSTABLE', emoji: ':jenkins_status_yellow:' },
      { color: 'yellow_anime', status: 'UNSTABLE', emoji: ':jenkins_status_yellow_anime:' },
      { color: 'blue', status: 'SUCCESS', emoji: ':jenkins_status_blue:' },
      { color: 'blue_anime', status: 'SUCCESS', emoji: ':jenkins_status_blue_anime:' },
      { color: 'grey', status: 'PENDING', emoji: ':jenkins_status_grey:' },
      { color: 'grey_anime', status: 'PENDING', emoji: ':jenkins_status_grey_anime:' },
      { color: 'disabled', status: 'DISABLED', emoji: ':jenkins_status_grey:' },
      { color: 'disabled_anime', status: 'DISABLED', emoji: ':jenkins_status_grey_anime:' },
      { color: 'aborted', status: 'ABORTED', emoji: ':jenkins_status_grey:' },
      { color: 'aborted_anime', status: 'ABORTED', emoji: ':jenkins_status_grey_anime:' },
      { color: 'nobuilt', status: 'NOTBUILT', emoji: ':jenkins_status_grey:' },
      { color: 'nobuilt_anime', status: 'NOTBUILT', emoji: ':jenkins_status_grey_anime:' },
    ];
  }

  // could just make the json param "json", but might be more
  // intuitive if we call it "job" and then pass it up to Jsonable
  // manually.
  constructor({ jenkins, name, job = {}, ...superOpts } = {}) {
    super({ json: job, ...superOpts});

    const jobName = name || job.name;

    if (!jenkins) {
      throw new Error('Must provide Jenkins instance!');
    } else if (!jobName) {
      throw new Error('Invalid name or job provided!');
    }

    job.name = jobName; // avoids custom getter for name

    Object.defineProperties(this, {
      [_jenkins]: {
        get() { return jenkins; },
      },
      [_name]: {
        get() { return jobName; },
      },
    });
  }


  /**
   *  Build this job.
   *
   *  @param {object} options
   *  @param {object} [options.parameters={}] Parameters for the build.
   *  @param {object} [options.token]         API token.
   *  @returns {Promise}
   */
  async build({ parameters = {}, token } = {}) {
    const buildOpts = {
      name: this[_name],
      parameters,
      token,
    };

    return await this[_jenkins].buildJob(buildOpts);
  }

  /**
   *  Re-fetch the job. Useful to get most recent build and other variable info.
   *
   *  @returns {Promise} Resolves with the raw JSON from the request.
   */
  async refresh() {
    // might want to remove this functionality to make each job instance
    // more atomic and consistent with other Jsonables
    const job = await this[_jenkins].getJob({ name: this[_name], wrap: false });
    Object.assign(this._json, job);
    return job;
  }


  /**
   *  Find a `colorObj` given a `color`.
   *
   *  @param {string} color
   *  @returns {colorObj|undefined}
   *
   *  @private
   */
  [_findColor](color) {
    return this[_colorData].find(colorObj => colorObj.color === color);
  }
}


module.exports = JenkinsJob;


/**
 *  @typedef {object} jobParamDef
 *  @property {string}        name
 *  @property {string}        description
 *  @property {array<string>} choices     Only for the `select` type.
 *  @property {string}        type        One of `boolean`, `select`, `string`.
 *  @property {*|null}        default     Depends on `type`. If no default, then `null`.
 */
/**
 *  A means of aggregating data associated with build status.
 *  @typedef {object} colorObj
 *  @property {string} color  A color as identified for the job.
 *  @property {string} status An associated status.
 *  @property {string} emoji  The slack emoji that represents the status.
 */
