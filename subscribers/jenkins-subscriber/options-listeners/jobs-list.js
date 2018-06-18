const OptionsListener = require('../../../interfaces/options-listener');
const Registry = require('../../../models/registry');


/**
 *  An `OptionsListener` to handle options load requests for Jenkins jobs.
 *
 *  @alias JobsListOptionsListener
 *  @memberOf subscribers.jenkins
 *  @extends OptionsListener
 *  @private
 */
class JobsListOptionsListener extends OptionsListener {
  /**
   *  The name used when specifying the external data source for slack `select`
   *  options.
   *  @type {string}
   *  @readonly
   */
  get name() {
    return 'jobsList';
  }

  /**
   *  Uses incoming `message` to determine if any filtering should be done
   *  on the final collection of options. The list is also cached on an
   *  interval so that an API call is not made for every request (of which
   *  Slack makes plenty).
   *
   *  @param {object}       options
   *  @param {SlackMessage} options.message
   *  @returns {Promise} Resolves with array of {@link slackOptionsLoadOpts}.
   */
  process({ message }) {
    // const { jobsCollection } = this.subscriber;
    const { value } = message;
    const registry = Registry.for(this);
    const jobsCollection = registry.get('JobsCollection');
    const jobs = jobsCollection.find();
    const options = jobs.map((job) => {
      return { text: job.name, value: job.name };
    });

    return Promise.resolve(options)
      .then((options) => {
        let filteredOptions = options;
        if (value && value.length >= 2) {
          filteredOptions = options.filter(option => option.value.toLowerCase().includes(value.toLowerCase()));
        }
        // @todo there's a limit of 100, so consider slicing and doing
        // some user messaging somehow
        return filteredOptions;
      });
  }
}


module.exports = JobsListOptionsListener;
