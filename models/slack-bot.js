const fs = require('fs');

const Envable = require('../mixins/envable');
const Identifyable = require('../mixins/identifyable');
const Logable = require('../mixins/logable');

const Registry = require('./registry');
const Slack = require('./slack');
const SlackPostRequest = require('./slack-post-request');
const WebServer = require('./web-server');

const _dbAdapter = Symbol('dbAdapter');
const _eventsInit = Symbol('eventsInit');
const _isStarted = Symbol('isStarted');
const _name = Symbol('name');
const _packageJson = Symbol('packageJson');
const _processSubscriberQueue = Symbol('processSubscriberQueue')
const _registry = Symbol('registry');
const _subscribers = Symbol('subscribers');
const _subscriberOpts = Symbol('subscriberOpts')
const _subscriberQueue = Symbol('subscriberQueue');

const packageJsonPath = `${__dirname}/../package.json`;
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));


/**
 *  The control center for slack interactions. An instance of this class ties
 *  together subscribers, hooks, server interactions, and more. In general,
 *  one `SlackBot` is paired with one Slack app.
 *
 *  @alias Slackbot
 *  @memberOf module:slackbot/models
 *  @mixes Envable
 *  @mixes Identifyable
 *  @mixes Logable
 *  @extends Envable
 *  @extends Identifyable
 *  @extends Logable
 *
 *  @param {object}    options
 *  @param {string}    options.configKey    This should be the config for a slack app.
 *  @param {string}    [options.configPath] This should be the config path for a slack app.
 *  @param {DbAdapter} [options.dbAdapter]  A DbAdapter instance if `options.db` is not provided.
 *  @param {*}         [options.db]         A db instance if `options.dbAdapter` is not provided.
 */
class SlackBot extends Identifyable(Logable(Envable())) {
  /**
   *  Whether or not the SlackBot instance has started up.
   *  @type {boolean}
   *  @readonly
   */
  get isStarted() {
    return this[_isStarted];
  }

  /**
   *  This is the root context name. It is the same as the provided `configKey`
   *  when the bot is instantiated.
   *  @type {string}
   *  @readonly
   */
  get name() {
    return this[_name];
  }

  /**
   *  Gets the version from package.json.
   *  @type {string}
   *  @readonly
   */
  get version() {
    return this[_packageJson].version;
  }


  /**
   *  Return the options object that will be passed to all added subscribers.
   *  @type {subscriberOpts}
   *  @readonly
   *  @private
   */
  get [_subscriberOpts]() {
    return {
      env: this._env,
    };
  }


  constructor({ configKey, configPath, db, dbAdapter, ...superOpts } = {}) {
    super(superOpts);

    let _dbInstance = db;

    this[_isStarted] = false;
    this[_name] = configKey;

    this[_packageJson] = packageJson;
    this[_registry] = Registry.context(configKey);

    this[_registry].set(this);

    if (!this[_registry].global('WebServer')) {
      SlackBot.serverOpts();
    }

    this[_registry].set(new Slack({ configKey, configPath, env: this._env }));
    this[_registry].set(new SlackPostRequest({ env: this._env }));

    if (db || dbAdapter) {
      if (!db) {
        this[_dbAdapter] = dbAdapter;
        if (dbAdapter._species.name !== 'DbAdapter') {
          throw new TypeError(`${configKey} must be provided with valid DbAdapter instance!`);
        }
        _dbInstance = dbAdapter.getInstance();
      }
      this[_registry].set('db', _dbInstance);
    }

    this[_subscriberQueue] = [];
    this[_subscribers] = [];

    this[_eventsInit]();
  }


  /**
   *  Required for the `WebServer` global.
   *
   *  @param {object} options
   *  @param {string} [options.configKey='webServer'] So the server knows where
   *                                                  to get its config.
   */
  static serverOpts({ configKey = 'webServer', ...opts } = {}) {
    // the web api requires ssl
    if (Registry.global('WebServer')) {
      throw new SyntaxError(`This method can only be called once, before Slackbot instantiation!`);
    }
    Registry.global(new WebServer({ configKey, ...opts }));
  }


  /**
   *  Adds a `Subscriber` to the bot.
   *
   *  @param {Subscriber} subscriber
   */
  addSubscriber(subscriber) {
    this[_subscriberQueue].push(subscriber);
  }

  /**
   *  Starts the bot by starting the server and RTM client.
   */
  async start() {
    let server = Registry.global('WebServer');

    if (!server) {
      WebServer.serverOpts();
      server = Registry.global('WebServer');
    }

    this[_isStarted] = true;
    server.start();
    await this[_registry].get('Slack').start();
    this[_processSubscriberQueue]();
  }

  /**
   *  Stops the server.
   */
  stop() {
    const server = Registry.global('WebServer');

    this[_dbAdapter] && this[_dbAdapter].disconnect();
    this[_registry].get('Slack').rtmClient.disconnect();
    server.stop();
    this[_isStarted] = false;
  }


  /**
   *  Examples of (possibly) useful rtm events. (This method will not be
   *  around forever).
   */
  [_eventsInit]() {
    const slack = this[_registry].get('Slack');

    // the client has successfully connected to the server
    slack.rtmClient.on('hello', () => {
      this._log.debug(`rtm hello`);
    });
    // The server intends to close the connection soon.
    slack.rtmClient.on('goodbye', () => {
      this._log.debug(`rtm goodbye`);
    });
    // You joined a channel
    slack.rtmClient.on('channel_joined', (data) => {
      this._log.debug(`joined channel: ${data.channel.name}`);
    });
    // A member's data has changed
    slack.rtmClient.on('user_change', (data) => {
      this._log.debug(`user changed profile: ${data.user.name}`);
    });
  }

  /**
   *  Validates and attains an instance of each subscriber.
   *  @private
   */
  [_processSubscriberQueue]() {
    const subscribers = [];
    const subscriberOpts = this[_subscriberOpts];

    const leftOvers = this[_subscriberQueue].reduce((acc, Subscriber) => {
      const instanceIsClass = Identifyable.isClass(Subscriber);
      let instance;

      if (typeof Subscriber === 'function') {
        instance = instanceIsClass ? new Subscriber(subscriberOpts) : Subscriber(subscriberOpts);

        this[_registry].set(instance);
        instance._init(this[_registry]);

        subscribers.push(instance);
      } else {
        acc.splice(acc.length, 0, Subscriber);
      }
      return acc;
    }, []);

    this[_subscribers].splice(this[_subscribers].length, 0, ...subscribers);
    this[_subscriberQueue] = leftOvers;

    if (this[_subscriberQueue].length) {
      this._log.warn(`Unable to instantiate ${leftOvers.length} subscriber(s).`);
    }
  }
}


module.exports = SlackBot;


/**
 *  Subscribers are the main containers for access to parts of the nectarbot
 *  ecosystem. The parameters they receive define that access.
 *  @typedef {object} subscriberOpts
 *  @property {string} env Passing through the environment to subscribers
 */
