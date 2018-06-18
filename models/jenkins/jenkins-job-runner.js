const _jobs = Symbol('jobs');

function _jobStatuses(jobs = []) {
  return jobs.map(job => job.status());
}

function _resolve(data = []) {
  let success = true;
  const results = [];

  data.forEach((status, index) => {
    if (status !== 'SUCCESS') {
      success = false;
    }
    results.push({
      job: this[_jobs][index],
      status,
    });
  });

  return { results, success };
}


/**
 *  @alias JenkinsJobRunner
 *  @memberOf subscribers.jenkins
 *  @private
 */
class JenkinsJobRunner {
  constructor() {
    this[_jobs] = [];
  }

  /**
   *  Add a job.
   *
   *  @param {JenkinsJob} job
   *  @returns {boolean} Whether or not the job was added to the queue.
   */
  add(job) {
    if (job) {
      this[_jobs].push(job);
      return true;
    }
    return false;
  }

  /**
   *  Return all jobs in queue.
   *
   *  @returns {array}
   */
  all() {
    return this[_jobs];
  }

  /**
   *  Return all of the statuses for the jobs in queue.
   *
   *  @returns {Promise} Resolves to `{ job, status }`.
   */
  status() {
    return Promise
      .all(_jobStatuses(this[_jobs]))
      .then(_resolve.bind(this));
  }
}


module.exports = JenkinsJobRunner;
