const _ = require('lodash');

const InteractionListener = require('../../../interfaces/interaction-listener');
const AttachmentsBuilder = require('../../../models/attachments-builder');
const InteractionBuilder = require('../../../models/interaction-builder');
const Registry = require('../../../models/registry');

const _formatter = Symbol('_formatter');
const _getJob = Symbol('_getJob');


/**
 *  Contains the entire interactive flow for choosing a job after the correct
 *  command is given.
 *
 *  @alias JobInfoInteractionListener
 *  @memberOf subscribers.jenkins
 *  @extends InteractionListener
 *  @private
 */
class JobInfoInteractionListener extends InteractionListener {
  /**
   *  Entry point for this processor.
   *
   *  @param {object}       options
   *  @param {SlackMessage} options.message
   *  @param {string}       options.jobName
   *  @returns {Promise}
   */
  async initiate({ message, jobName }) {
    this._log.json('initiating JobInfoInteractionListener with:', { message, jobName });
    const { channel, response_url } = message;
    const job = await this[_getJob](jobName);

    this._log.debug(`got job for ${job.name}`);

    const attachments = this[_formatter]({ job, message });
    this._log.json('attachments:', attachments);

    if (response_url) {
      return message.respond({ attachments });
    } else {
      return message.whisper({ attachments })
        .catch(data => this._log.error(data));
    }
  }

  /**
   *  This callback is executed when the user selects a parameter from the
   *  list. It re-builds the message with parameter info and replaces the
   *  original message.
   *
   *  @param {object}       options
   *  @param {SlackMessage} options.message
   */
  async jobParamInfo({ message }) {
    this._log.debug('jobParamInfo being called...');
    const { actions: [selectedParamAction], message_ts } = message;
    this._log.json('selected action:', selectedParamAction);

    const selectedParam = _.get(selectedParamAction, 'selected_options[0]');
    const [jobName, paramName] = selectedParam.value.split('#');
    this._log.json('selected param:', selectedParam);
    this._log.debug(`job name: ${jobName} | param name: ${paramName}`);

    if (jobName && paramName) {
      this._log.debug('we have a job name and param name!');
      const job = await this[_getJob](jobName);

      this._log.debug('getting attachments...');
      const attachments = this[_formatter]({ job, message });

      this._log.debug('responding...');
      message.respond({ attachments, replace_original: true });
    }
  }

  /**
   *  After selecting a job, present options (via buttons) for what the user
   *  wants to do with that job.
   *  @private
   */
  [_formatter]({ job, message }) {
    const { lastBuild, name } = job;
    this._log.debug(`formatting job: ${name}`)
    const params = job.paramDefs;
    this._log.debug(`found ${params.length} params`);
    const { emoji, status } = job.status;
    const { actions, message_ts } = message;
    const [selectedParamAction] = (actions || []);
    this._log.json('selected action:', selectedParamAction);

    const selectedParam = _.get(selectedParamAction, 'selected_options[0]');
    this._log.debug(`selectedParam = ${selectedParam}`);

    const attachmentsBuilder = new AttachmentsBuilder();
    const interactionBuilder = new InteractionBuilder();
    const attachments = [];
    const selected = [];
    const options = params.map((param) => {
      const option = {
        text: param.name,
        value: `${name}#${param.name}`,
      };
      return option;
    });
    let matchedOpt;

    this._log.debug('setting up jobInfoAttachments...');
    const jobInfoAttachments = attachmentsBuilder
      .fallback(job.description)
      .title({ title: job.name, link: job.url })
      .text(job.description)
      .field({ title: 'Status', value: `${emoji}`, short: true })
      .field({ title: 'Last Build', value: `<${lastBuild.url}|${lastBuild.number}> (<${lastBuild.url}console|Console>)`, short: true })
      .build();

    attachments.push(...jobInfoAttachments);

    this._log.debug('setting up interaction attachments...');
    interactionBuilder
      .callbackId('jobParamInfo')
      .fallback('Select a param to view information about it')
      .title('To view param details, select a param')

    if (selectedParam) {
      this._log.debug('finding selectedParam...');
      matchedOpt = options.find(opt => opt.value === selectedParam.value);
      if (matchedOpt) {
        this._log.debug('found matched opt!');
        selected.push(matchedOpt);
      }
    }

    this._log.debug('building paramSelectAttachments...');
    const paramSelectAttachments = interactionBuilder
      .select({ name: 'jobParam', text: 'Choose a param', selected })
      .options(options)
      .build();

    attachments.push(...paramSelectAttachments);

    if (matchedOpt) {
      const jobParam = params.find(param => param.name === matchedOpt.text);
      this._log.json('setting up jobParamAttachments for jobParam:', jobParam);
      attachmentsBuilder
        .fallback(jobParam.description || `Describing: ${jobParam.name}`)
        .field({ title: 'Description', value: jobParam.description })
        .field({ title: 'Type', value: `\`${jobParam.type}\``, short: true })

      if (jobParam.default) {
        attachmentsBuilder.field({ title: 'Default', value: `\`${jobParam.default}\``, short: true });
      }

      if (jobParam.choices) {
        attachmentsBuilder.field({
          title: 'Choices',
          value: jobParam.choices.map(choice => `\`${choice}\``).join(', '),
        });
      }

      this._log.debug('building jobParamAttachments...');
      const jobParamAttachments = attachmentsBuilder.build();

      attachments.push(...jobParamAttachments);
    }

    const dismissButtonAttachments = interactionBuilder
        .dismissButton({ ts: message_ts })
        .build();

    attachments.push(...dismissButtonAttachments);

    return attachments;
  }

  [_getJob](name) {
    const jenkins = Registry.for(this).get('Jenkins');
    return jenkins.getJob({ name })
      .catch((err) => {
        this._log.error(`Failed to get job. `, err);
        return Promise.reject(`Failed to get job info for ${name}: ${err}`);
      });
  }
}


module.exports = JobInfoInteractionListener;
