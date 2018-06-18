const LokiCollection = require('../../../db/loki/loki-collection');

const JenkinsJob = require('../models/jenkins-job');

const _jenkins = Symbol('jenkins');
const _transformJob = Symbol('transformJenkinsJob');


/**
 *  This class is a wrapper around the persistent collection for jenkins jobs.
 *  It provides some extra functionality and overrides to fit in with the
 *  slack bot infrastructure. Oh yea, you can `new` it as many times as you
 *  want, but there will only ever be one instance.  =]
 *
 *  @alias JobsCollection
 *  @memberOf subscribers.jenkins
 *  @extends LokiCollection
 *
 *  @param {object}   options
 *  @param {Registry} options.registry A `Registry` instance.
 *
 *  @see external:LokiJS
 *  @private
 */
class JobsCollection extends LokiCollection {
  constructor({ registry, ...superOpts } = {}) {
    const collectionKey = 'JENKINS_JOBS';

    super({ collectionKey, ...superOpts });

    this[_jenkins] = registry.get('Jenkins');

    // set interval for refresh?
  }


  /**
   *  This differs from the LokiJS insert as it accepts one or more `JenkinsJob`s.
   *
   *  @param {object|JenkinsJob|array<object>|array<JenkinsJob>} jobs
   *  @returns {array<jenkinsJobRecord>}
   */
  insert(jobs) {
    let jobsArray = Array.isArray(jobs) ? jobs : [jobs];
    const records = jobsArray.map((job) => {
      let record = job;
      if (!job.params) {
        record = this[_transformJob](job);
      }
      return record;
    });
    return this._proxied.insert(records);
  }

  /**
   *  Get all jobs with only the important information needed for the data
   *  store.
   *
   *  @returns {Promise} Resolves with an array of inserted records.
   */
  refresh() {
    const tree = 'jobs[name,url,description,actions[parameterDefinitions[name,type,description,choices,defaultParameterValue[value]]]]';

    this._log.debug('refreshing list of jenkins jobs...');

    return this[_jenkins].getInfo({ tree })
      .then((info) => {
        const { jobs } = info;
        const records = jobs.map(this[_transformJob]);
        this._proxied.clear();
        this._log.debug(`returning ${records.length} inserted records...`);
        return this._proxied.insert(records);
      });
  }


  /**
   *  @private
   */
  [_transformJob](job) {
    const { name, url, description } = job;
    const params = JenkinsJob.getParamDefs(job);
    return { name, url, description, params };
  }
}


module.exports = JobsCollection;


/**
 *  @typedef {object} jenkinsJobRecord
 *  @property {string}             name        Name of the job.
 *  @property {string}             url         Direct url to job.
 *  @property {string}             description The description of the job.
 *  @property {array<jobParamDef>} params      List of parameters for the job.
 */
