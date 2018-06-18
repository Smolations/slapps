const Registry = require('../../models/registry');
const RtmListener = require('../../interfaces/rtm-listener');

class RtmProc extends RtmListener {
  get pattern() {
    return /^job(?= |$)/;
  }

  /**
   *  Every slash command can accept command-line-like arguments, so defining
   *  them with a `yargs` parser will make it much easier to parse them. Even
   *  if your command includes no arguments, you can define the command and
   *  add some help text. You can craft your `signature` getter using your own
   *  string or with the assistance of `yargs`.
   *  @type {object}
   *  @abstract
   *  @readonly
   *
   *  @example                'foo [bar] [baz=one,two,three]'
   *  get parser() {
   *    return this.yargs
   *      .command('foo', 'do things in a foo-ey way', {
   *        bar: {
   *          describe: 'sprinkle some bar on it',
   *        },
   *        baz: {
   *          type: 'string',
   *          choices: ['one', 'two', 'three'],
   *        },
   *      });
   *  }
   */
  // get parser() {
  //   return this.yargs
  //     .command('job [name]', 'Interact with a Jenkins job in various ways', (yargs) => {
  //       yargs
  //         .positional('name', {
  //           type: 'string',
  //           description: 'The name of the job.',
  //         })
  //         .option('follow', {
  //           alias: 'f',
  //           type: 'boolean',
  //           description: 'Receive a DM that is updated in real time with build status.',
  //         })
  //         .option('tail', {
  //           alias: 't',
  //           type: 'boolean',
  //           description: 'Receive a DM that sends consecutive chunks of the console.',
  //         });
  //     })
  //     .help();
  // }


  process({ message }) {
    const { channel, text } = message;
    const registry = Registry.for(this);
    const db = registry.get('db');
    // const jobName = 'QA-control';

    // const jobInfoInteractionListener = this.subscriber.interactionListenerGroup.find(proc => proc._className === 'JobInfoInteractionListener');

    // if (jobInfoInteractionListener) {
    //   this._log.error('Found jobInfoInteractionListener! initiating...');
    //   jobInfoInteractionListener.initiate({ message, jobName });
    // } else {
    //   this._log.error('Unable to find jobInfoInteractionListener!');
    // }
    try {
      this._log.debug('getting users collection...');
      const users = db.getCollection('users');

      this._log.debug('inserting into users collection...');
      users.insert({
        name: 'Odin',
        age: 50,
        address: 'Asgard',
      });

      this._log.debug('finding from users collection...');
      const user = users.find({ age: {'$gte': 35} });

      this._log.json('is it odin?', user);
    } catch (e) {
      this._log.error(e.message);
    }

    // this.parser.parse(text, (err, argv, output) => {
    //   this._log.json('after parsing:', { err, argv, output });
    //   if (err) {
    //     this.subscriber.sendMessage({ channel: channel.id, text: `\`${err.message}\`` });
    //   } else if (output) {
    //     const scriptNamePattern = new RegExp(argv.$0, 'g');
    //     const outputCode = `\`\`\`\n${output.replace(scriptNamePattern, '/jenkins')}\n\`\`\``;
    //     this.subscriber.sendMessage({ channel: channel.id, text: outputCode });
    //   }
    // });
  }
}

module.exports = RtmProc;
