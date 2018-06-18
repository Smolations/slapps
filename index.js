const LokiAdapter = require('./db/loki/loki-adapter');

const SlackBot = require('./models/slack-bot');


// bring in desired subscribers
const JenkinsSubscriber = require('./subscribers/jenkins-subscriber');
const NectarSubscriber = require('./subscribers/nectar-subscriber');

// get some persistence action goin...
const env = process.env.NODE_ENV || 'development';
const dbAdapter = new LokiAdapter({ fileName: `db/data/${env}.db` });

// set global server opts for all slack bots
SlackBot.serverOpts({ configKey: 'webServer' });


/**
 *  This demonstrates a single slack bot handling multiple subscribers that
 *  respond to multiple commands, but all of the messages will be sent from
 *  the bot user associated with the one slack token provided from the config.
 */
if (false && justForDemonstrationPurposes) {
  // create the bot instance
  const slackBot = new SlackBot({ configKey: 'slackBot', dbAdapter });

  // add the subscribers ("subscribe them")
  slackBot.addSubscriber(NectarSubscriber);
  slackBot.addSubscriber(JenkinsSubscriber);

  // and awaaaaAAAAaaay we go!
  slackBot.start();
}


/**
 *  This demonstrates the use of a single slack bot model to create two
 *  separate instances associated with two different slack tokens. This
 *  allows for two distinct slaack apps (which means 2 bot users).
 */
if (false && justForDemonstrationPurposes) {
  // create the bot instances
  const nectarBot = new SlackBot({ configKey: 'nectarBot', dbAdapter });
  const jenkinsBot = new SlackBot({ configKey: 'jenkinsBot', dbAdapter });

  // add the subscribers ("subscribe them")
  nectarBot.addSubscriber(NectarSubscriber);
  jenkinsBot.addSubscriber(JenkinsSubscriber);

  // and awaaaaAAAAaaay we go!
  nectarBot.start();
  jenkinsBot.start();
}
