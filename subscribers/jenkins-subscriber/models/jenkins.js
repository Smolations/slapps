const jenkins = require('jenkins'); // https://github.com/silas/node-jenkins

const Configable = require('../../../mixins/configable');
const Envable = require('../../../mixins/envable');
const Logable = require('../../../mixins/logable');

const JenkinsBuild = require('./jenkins-build');
const JenkinsJob = require('./jenkins-job');

const _client = Symbol('client');
const _csrfProtection = Symbol('csrfProtection');


/**
 *  This class facilitates communication between the `jenkins` client and the
 *  configured Jenkins instance. It provides access to the most common methods
 *  that are accessible via the Jenkins Remote API.
 *
 *  @alias Jenkins
 *  @memberOf subscribers.jenkins
 *  @mixes module:slackbot/mixins~Configable
 *  @mixes module:slackbot/mixins~Envable
 *  @mixes module:slackbot/mixins~Logable
 *  @extends module:slackbot/mixins~Configable
 *  @extends module:slackbot/mixins~Envable
 *  @extends module:slackbot/mixins~Logable
 *
 *  @param {object} options
 *  @param {object} [options.csrfProtection=null] This overrides whatever the config provides.
 *
 *  @see external:jenkins
 *  @private
 */
class Jenkins extends Logable(Envable(Configable())) {
  /**
   *  Retrieve the domain (with port) as provided by the config.
   *  @type {string}
   *  @readonly
   */
  get _domain() {
    const { port } = this._config;
    let { url } = this._config;

    if (port) {
      url = `${url}:${port}`;
    }

    return url;
  }

  constructor({ csrfProtection = null, ...superOpts } = {}) {
    super(superOpts);

    this[_csrfProtection] = (csrfProtection !== null) ? csrfProtection : this._config.csrfProtection;

    const { protocol, user, token } = this._config;
    const jenkinsOpts = {
      baseUrl: `${protocol}://${user}:${token}@${this._domain}`,
      crumbIssuer: this[_csrfProtection],
      promisify: true,
    };

    if (!token) {
      throw new Error('Unable to acquire token from config!');
    }

    this[_client] = jenkins(jenkinsOpts);
  }

  // general info

  /**
   *  Get general information about the Jenkins instance and its jobs.
   *
   *  @param {jenkinsCommonOpts} [options={}]
   *  @returns {Promise}
   */
  async getInfo(options = {}) {
    return await this[_client].info(options);
  }

  // builds

  /**
   *  Get information about a build.
   *
   *  @param {object}  options             Also accepts {@link jenkinsCommonOpts}.
   *  @param {string}  options.name        The job name.
   *  @param {number}  options.buildNumber
   *  @param {boolean} [options.wrap=true] Whether or not to wrap jobs with {@link JenkinsJob}.
   *  @returns {Promise}
   */
  getBuild({ name, buildNumber, wrap = true, ...commonOpts }) {
    this._log.json(`#getBuild() with:`, { name, buildNumber, wrap, ...commonOpts });
    return this[_client].build.get({ name, number: buildNumber, ...commonOpts })
      .then(build => wrap ? new JenkinsBuild({ jenkins: this, build }) : build)
      .catch((err) => this._log.error(`${err}`));
  }

  /**
   *  Get the log output for a build.
   *
   *  @param {object}  options
   *  @param {string}  options.name            The job name.
   *  @param {number}  options.buildNumber
   *  @param {number}  [options.startOffset=0]
   *  @param {string}  [options.type='text']   Can be `'text'` or `'html'`.
   *  @param {boolean} [options.meta=false]
   *  @returns {Promise}
   */
  async getBuildLog({ name, buildNumber, startOffset = 0, type = 'text', meta = false }) {
    return await this[_client].build.log(name, buildNumber, type, delay, meta);
  }

  /**
   *  Get information about a build.
   *
   *  @param {object}  options
   *  @param {string}  options.name        The job name.
   *  @param {number}  options.buildNumber
   *  @param {boolean} [options.wrap=true] Whether or not to wrap jobs with {@link JenkinsJob}.
   *  @returns {Promise}
   */
  getBuildLogStream({ name, buildNumber, type = 'text', delay = 1000 }) {
    return this[_client].build.logStream(name, buildNumber, type, delay);
  }

  /**
   *  Stop a build.
   *
   *  @param {object} options
   *  @param {string} options.name        The job name.
   *  @param {number} options.buildNumber
   *  @returns {Promise}
   */
  async stopBuild({ name, buildNumber }) {
    return await this[_client].build.stop(name, buildNumber);
  }

  // jobs

  /**
   *  List all jobs.
   *
   *  @param {object}  options             Also accepts {@link jenkinsCommonOpts}.
   *  @param {string}  options.filter      Not yet implemented
   *  @param {boolean} [options.wrap=true] Whether or not to wrap jobs with {@link JenkinsJob}.
   *  @returns {Promise}
   */
  async listJobs({ filter, wrap = true, ...commonOpts } = {}) {
    this._log.debug('listing jobs...');
    const jobs = await this[_client].job.list(/*commonOpts*/);
    const jobsList = wrap ? jobs.map(job => new JenkinsJob({ jenkins: this, job })) : jobs;
    this._log.debug(`returning jobsList of length: ${jobsList.length}`);
    return jobsList;
  }

  /**
   *  Get information about a job.
   *
   *  @param {object}  options             Also accepts {@link jenkinsCommonOpts}.
   *  @param {string}  options.name        The job name.
   *  @param {boolean} [options.wrap=true] Whether or not to wrap job with {@link JenkinsJob}.
   *  @returns {Promise}
   */
  async getJob({ name, wrap = true, ...commonOpts }) {
    this._log.debug(`getting job: ${name}`);
    const job = await this[_client].job.get({ name, ...commonOpts });
    return wrap ? new JenkinsJob({ jenkins: this, job }) : job;
  }

  /**
   *  Build a job.
   *
   *  @param {object} options
   *  @param {string} options.name            The job name.
   *  @param {object} [options.parameters={}] Any params for the job.
   *  @param {string} [options.token]         A user token with which to authenticate.
   *  @returns {Promise}
   */
  async buildJob({ name, parameters = {}, token }) {
    this._log.json(`#buildJob() with:`, { name, parameters, token });
    return await this[_client].job.build({ name, parameters, token });
  }

  // queue

  /**
   *  List queue items.
   *
   *  @param {object} options          Also accepts {@link jenkinsCommonOpts}.
   *  @param {string} [options.filter] Not yet implemented.
   *  @returns {Promise}
   */
  async listQueue({ filter, ...commonOpts } = {}) {
    const queue = await this[_client].queue.list(commonOpts);
    return queue.items;
  }

  /**
   *  Get information about a queue item.
   *
   *  @param {object} options         Also accepts {@link jenkinsCommonOpts}.
   *  @param {string} options.queueId Id of the queue item.
   *  @returns {Promise}
   */
  async getQueueItem({ queueId, ...commonOpts }) {
    return await this[_client].queue.item({ number: queueId, ...commonOpts });
  }

  /**
   *  Remove an item from the queue.
   *
   *  @param {object} options
   *  @param {string} options.queueId Id of the queue item.
   *  @returns {Promise}
   */
  async cancelQueueItem({ queueId }) {
    return await this[_client].queue.item({ queueId });
  }

  // views

  /**
   *  List all views.
   *
   *  @param {jenkinsCommonOpts} [options={}]
   *  @returns {Promise}
   */
  async listViews(options = {}) {
    return await this[_client].view.list(options);
  }

  /**
   *  Get information about a view.
   *
   *  @param {object} options      Also accepts {@link jenkinsCommonOpts}.
   *  @param {string} options.name The view name.
   *  @returns {Promise}
   */
  async getView({ name, ...commonOpts }) {
    return await this[_client].view.get({ name, ...commonOpts });
  }
}


module.exports = Jenkins;


/**
 *  @typedef {object} jenkinsCommonOpts
 *  @property {number} depth=0 How much data to return. (See {@link https://wiki.jenkins-ci.org/display/JENKINS/Remote+access+API#RemoteaccessAPI-Depthcontrol|depth control}).
 *  @property {string} [tree]  Path expression. (See {@link https://jenkins.gloo.us/api|Controlling the amount of data you fetch}).
 */
