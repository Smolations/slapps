const LokiFsAdapter = require('./db/loki/loki-fs-adapter');
const LokiS3Adapter = require('./db/loki/loki-s3-adapter');

const Envable = require('./mixins/envable');

const Registry = require('./models/registry');
const SlackBot = require('./models/slack-bot');


// bring in desired subscribers
const NectarSubscriber = require('./subscribers/nectar-subscriber');


// set up environment for errybody
const env = process.env.NODE_ENV || 'development';
Envable.env(env);

// get some persistence action goin...
let dbAdapter;
if (env === 'production') {
  dbAdapter = new LokiS3Adapter({ fileName: `${env}.db`, configKey: 'aws-s3' });
} else {
  dbAdapter = new LokiFsAdapter({ fileName: `db/data/${env}.db` });
}


// create the bot instances
const nectarBot = new SlackBot({ configKey: 'nectarBot', dbAdapter });

// add the subscribers ("subscribe them")
nectarBot.addSubscriber(NectarSubscriber);

// and awaaaaAAAAaaay we go!
nectarBot.start()
  .then(() => {
    console.log(`--------\nRegistry\n--------\n${Registry.toString()}`);
  });


