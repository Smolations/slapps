const _ = require('lodash');

const InteractionListener = require('../../../interfaces/interaction-listener');

const AttachmentsBuilder = require('../../../models/attachments-builder');
const DialogBuilder = require('../../../models/dialog-builder');
const InteractionBuilder = require('../../../models/interaction-builder');
const Registry = require('../../../models/registry');


/**
 *  Contains the entire interactive flow for choosing a job after the correct
 *  command is given.
 *
 *  @alias ChooseJobInteractionListener
 *  @memberOf subscribers.jenkins
 *  @extends InteractionListener
 *  @private
 */
class ChooseJobInteractionListener extends InteractionListener {
  /**
   *  Present a `select`, populated with available jobs, from which the user
   *  can choose. This is the "default," or starting interaction for this
   *  processor.
   *
   *  @param {object}       options
   *  @param {SlackMessage} options.message
   *  @param {array<slackOptionsLoadOpts>} [options.options] If provided, will be used instead of
   *                                       the external data source
   */
  initiate({ message, options }) {
    this._log.json('initiate being called with:', { message, options });
    const { value, message_ts } = message;
    const selectParams = { name: 'jobsList', text: 'Pick a job...' };
    const interactionBuilder = new InteractionBuilder();
    let attachments;

    interactionBuilder
      .fallback('Loading jobs...')
      .callbackId('jobSelection')
      .title('Choose a job');

    if (!options) {
      selectParams.dataSource = 'external';
    }

    this._log.json('final select params:', selectParams);
    interactionBuilder.select(selectParams);

    if (options) {
      this._log.json('adding options:', options);
      interactionBuilder.options(options);
    }

    attachments = interactionBuilder
      .dismissButton({ ts: message_ts })
      .build();

    const newMessage = {
      attachments,
      response_type: 'ephemeral',
    };

    return message.respond(newMessage);
  }

  /**
   *  After selecting a job, present options (via buttons) for what the user
   *  wants to do with that job.
   */
  jobSelection({ message, jobName }) {
    this._log.debug('jobSelection being called...');
    const { actions, message_ts } = message;
    const selectedJobName = jobName || actions[0].selected_options[0].value; // yikes
    const interactionBuilder = new InteractionBuilder();
    const attachments = interactionBuilder
      .fallback(`Showing available actions related to chosen job: ${selectedJobName}`)
      .callbackId('jobAction')
      .title(`Job: ${selectedJobName}`)
      .button({ name: 'action', text: 'Get Info', value: `${selectedJobName}#getInfo` })
      .button({ name: 'action', text: 'Build', value: `${selectedJobName}#build` })
      .button({ name: 'action', text: 'Follow', value: `${selectedJobName}#follow` })
      .dismissButton({ ts: message_ts })
      .build();

    const newMessage = {
      attachments,
      response_type: 'ephemeral',
      replace_original: true,
    };

    // this._log.debug(`saving selected job for next interaction: ${selectedJobName}`);

    return message.respond(newMessage);
  }

  /**
   *  Process the user's job action choice.
   */
  jobAction({ message }) {
    const { user, actions, message_ts } = message;
    const [jobName, selectedAction] = actions[0].value.split('#'); // yikes;
    const registry = Registry.for(this);
    const dialogBuilder = new DialogBuilder();
    const interactionBuilder = new InteractionBuilder();
    const jobFollowListener = registry.get('jobFollowListener');
    const jobInfoInteractionListener = registry.get('JobInfoInteractionListener');
    const jobsCollection = registry.get('JobsCollection');
    const slack = registry.get('Slack');
    let promise;

    this._log.debug(`selected job action: ${selectedAction}`);

    switch (selectedAction) {
      case 'getInfo':
        promise = jobInfoInteractionListener.initiate({ message, jobName });
        break;
      case 'build':
        this._log.debug('build hook!');
        const { trigger_id } = message;
        const job = jobsCollection.by('name', jobName);
        this._log.json('job from jobsCollection:', job);

        if (!_.isEmpty(job.params)) {
          this._log.debug('job has params; formatting...');
          const params = job.params.map((param) => {
            let line = `${param.name}=`;
            if (param.choices) {
              line += param.choices.join('|');
            } else if (!_.isUndefined(param.default)) {
              line += `${param.default}`;
            } else {
              line += `(${param.type})`;
            }
            return line;
          });
          const followOpts = [
            {
              label: 'follow',
              value: 'true',
            },
            {
              label: 'do not follow',
              value: 'false',
            },
          ];
          this._log.json('prepopulate dialog with:', params);
          const dialog = dialogBuilder
            .callbackId('buildJobDialogResponse')
            .title(`${jobName}`)
            .select({ name: 'follow', label: 'Follow this build?', value: followOpts[0].label })
            .options(followOpts)
            .textarea({ name: `${jobName}#params`, label: 'Parameters', defaultValue: params.join('\n') })
            .submitLabel('Build')
            .build(trigger_id);

          this._log.json('attempting to open dialog with', dialog);

          promise = slack.openDialog(dialog)
            .catch(err => this._log.error(`failed to open dialog: ${err}`));
        } else {
          this._log.debug('job has no params; go right to building!');
        }

        break;
      case 'follow':
        promise = jobFollowListener.addFollower({ user: user.id, jobName })
          .then((follower) => {
            return message.respond({
              text: `OK! You are now following *${follower.jobName}* until the next build finishes!`,
              attachments: interactionBuilder.dismissButton({ ts: message_ts }).build(),
            });
          });
        break;
      default:
        this._log.warn(`Unable to determine last button action from '${selectedAction}'.`);
        promise = Promise.reject(`Unable to determine last button action from '${selectedAction}'.`);
    }
    return promise;
  }

  buildJobDialogResponse({ message }) {
    this._log.json('received response from dialog', message);
    const registry = Registry.for(this);
    const interactionBuilder = new InteractionBuilder();
    const jenkins = registry.get('Jenkins');
    const jobFollowListener = registry.get('jobFollowListener');
    const { message_ts, submission, user } = message;
    const { follow } = submission;
    const jobNameKey = Object.keys(submission).find(key => key.includes('#'));
    const [jobName] = jobNameKey.split('#');
    const input = submission[jobNameKey];
    const paramLines = input.split('\n');
    const parameters = paramLines.reduce((paramsObj, paramLine) => {
      const [paramName, paramValue] = paramLine.split('=');
      // any need to validate here?
      paramsObj[paramName] = paramValue;
      return paramsObj;
    }, {});
    const jobBuildParams = { name: jobName, parameters };
    let promise = Promise.resolve();

    this._log.json(`jenkins.buildJob() will be called with:`, jobBuildParams);

    if (follow === 'true') {
      this._log.debug(`follow === true; adding follower...`);
      promise = jobFollowListener.addFollower({ user: user.id, jobName })
        .then((follower) => {
          this._log.debug(`follower added! sending response...`);
          // need some way to get message_ts from an original message...
          return message.respond({
            text: `OK! You are now following *${follower.jobName}*. Let's kick it off!`,
            attachments: interactionBuilder.dismissButton({ ts: message_ts }).build(),
          });
        });
    }

    return promise
      .then(() => {
        this._log.debug(`kicking off job...`);
        // probably should catch here and message or something...
        return jenkins.buildJob(jobBuildParams);
      })
      .catch(err => this._log.error(err));
  }
}


module.exports = ChooseJobInteractionListener;
