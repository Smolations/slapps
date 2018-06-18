const _ = require('lodash');

const SlashCommandListener = require('../../../interfaces/slash-command-listener');
const InteractionBuilder = require('../../../models/interaction-builder');
const Registry = require('../../../models/registry');


/**
 *  Handles the "job" command.
 *
 *  @alias JobSlashCommandListener
 *  @memberOf subscribers.jenkins
 *  @extends SlashCommandListener
 *  @private
 */
class JobSlashCommandListener extends SlashCommandListener {
  get pattern() {
    return /^job(?= |$)/;
  }

  get parser() {
    const description = [
      'Interact with a Jenkins job in various ways. If the job name is omitted,',
      'you will be presented with an auto-complete select element with available',
      'jobs.',
    ].join(' ');
    return this.yargs
      .command('job [name]', description, (yargs) => {
        yargs
          .positional('name', {
            type: 'string',
            description: 'The name of the job.',
          })
          .option('info', {
            alias: 'i',
            type: 'boolean',
            description: 'View info about the job, including any parameters.',
          })
          .option('follow', {
            alias: 'f',
            type: 'boolean',
            description: 'Receive a DM that is updated in real time with build status.',
          })
          .option('tail', {
            alias: 't',
            type: 'boolean',
            description: 'Receive a DM that sends consecutive chunks of the console.',
          });
      })
      .help();
  }

  /**
   *  Processes the "job" command. If no other params are provided, an interactive
   *  experience kicks in, allowing the user to choose a job from a `select`
   *  and then choosing what they want to do with that job.
   *
   *  @param {object}       options
   *  @param {SlackMessage} options.message
   *  @returns {Promise}
   */
  process({ message }) {
    this._log.json(`processing message:`, message._json);
    const { text, user } = message;
    const interactionBuilder = new InteractionBuilder();

    const registry = Registry.for(this);
    const jenkins = registry.get('jenkins');
    const jobsCollection = registry.get('JobsCollection');
    const chooseJobInteractionListener = registry.get('ChooseJobInteractionListener');
    const jobInfoInteractionListener = registry.get('JobInfoInteractionListener');


    let promise = new Promise((resolve, reject) => {
      this.parser.parse(text, (err, argv, output) => {
        this._log.json('after parsing:', { err, argv, output });

        const { name, info, follow, tail } = argv;

        if (!name && !output) {
          this._log.debug(`going interactive...`);
          resolve(chooseJobInteractionListener.initiate({ message }));
        } else {
          if (err) {
            reject(`\`${err.message}\``);
          } else if (output) {
            const scriptNamePattern = new RegExp(argv.$0, 'g');
            const outputCode = `\`\`\`\n${output.replace(scriptNamePattern, '/jenkins')}\n\`\`\``;
            const attachments = interactionBuilder.dismissButton().build();
            resolve(message.respond({ text: outputCode, attachments }));
            // reject(outputCode);
          } else {
            const matchedJobs = jobsCollection.find({ name: { '$regex': [name, 'i'] } });
            this._log.debug(`checking job name matches from ${matchedJobs.length} options..`);
            switch (matchedJobs.length) {
              case 0:
                reject('Unable to find a job with given name!');
                break;

              case 1:
                this._log.debug('one job');
                const jobName = matchedJobs[0].name;
                // handle tail/follow cases
                if (info) {
                  resolve(jobInfoInteractionListener.initiate({ message, jobName }));
                } else if (!follow && !tail) {
                  resolve(chooseJobInteractionListener.jobSelection({ message, jobName }));
                }
                resolve();
                break;

              default:
                // present dropdown
                this._log.debug('many jobs');
                const options = matchedJobs.map(job => ({ text: job.name, value: job.name }));
                resolve(chooseJobInteractionListener.initiate({ message: message._json, options }));
                reject(`Multiple jobs match the given name:\n${jobNames.join('\n')}`);
                break;
            }
          }
        }
      });
    });

    return promise.catch((err) => {
      this._log.error(`totes erred: ${err}`);
      return message.respond({ text: err });
    });
  }
}


module.exports = JobSlashCommandListener;
