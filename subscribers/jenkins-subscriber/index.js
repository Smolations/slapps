const Subscriber = require('../../interfaces/subscriber');

const SlackMessage = require('../../models/slack-message');

const Jenkins = require('./models/jenkins');
const JenkinsNotification = require('./models/jenkins-notification');

const JenkinsJob = require('./models/jenkins-job');
const JobsCollection = require('./db-models/jobs-collection');

const JobSlashCommandListener = require('./slash-command-processors/job');

const JobsListOptionsListener = require('./options-processors/jobs-list');

const ChooseJobInteractionListener = require('./interaction-processors/choose-job');
const DeleteMessageInteractionListener = require('./interaction-processors/delete-message');
const JobInfoInteractionListener = require('./interaction-processors/job-info');

const JobFollowNotifyHookListener = require('./notify-hook-processors/job-follow');

const RtmProc = require('./rtm-proc');
/**
 *  A subscriber for Jenkins-related things.
 *
 *  @alias JenkinsSubscriber
 *  @extends Subscriber
 *  @private
 */
class JenkinsSubscriber extends Subscriber {
  register(registry) {
    registry.set(new Jenkins({ configKey: 'jenkins' }));
    registry.set(new JobsCollection({ registry }));
    registry.set('jobFollowListener', new JobFollowNotifyHookListener());
  }

  subscribe(registry) {
    const jobFollowListener = registry.get('jobFollowListener');
    const jobsCollection = registry.get('JobsCollection');
    const server = registry.global('WebServer');
    const jenkins = registry.get('Jenkins');

    this.slashCommandListenerGroup.add([
      JobSlashCommandListener,
    ]);

    this.optionsListenerGroup.add([
      JobsListOptionsListener,
    ]);

    this.interactionListenerGroup.add([
      ChooseJobInteractionListener,
      DeleteMessageInteractionListener,
      JobInfoInteractionListener,
    ]);

    this.rtmListenerGroup.add([
      RtmProc,
    ]);


    server.on(jenkins._config.notifyUri, ({ data }) => {
      this._log.json(`saw a request from ${jenkins._config.notifyUri}`, data);
      const notification = new JenkinsNotification({ notification: data });
      jobFollowListener.process({ notification });
    });

    jobsCollection.refresh()
      .catch((err) => {
        this._log.error(`Something went wrong while bootstrapping data:  ${err}`);
      });

    // Registry.for(this);

    // const name = 'QA-control';
    // const buildNumber = 98;
    // this.jenkins.getBuild({ name, buildNumber, wrap: false })
    //   .then(build => this._log.json(`getting build #${buildNumber} for ${name}:`, build));

    // this.jenkins.getJob({ name })
    //   .then((job) => {
    //     this._log.debug(`got job for ${name}`);
    //     this._log.debug(`job actions: ${job.actions}`);
    //     this._log.debug(`paramDefs: ${job.paramDefs}`);
    //   });
  }
}


module.exports = JenkinsSubscriber;
