const _ = require('lodash');

const Envable = require('../mixins/envable');
const Identifyable = require('../mixins/identifyable');
const Logable = require('../mixins/logable');

const ListenerGroup = require('../interfaces/listener-group');

const Registry = require('../models/registry');
const InteractionListenerGroup = require('../models/interaction-listener-group');
const OptionsListenerGroup = require('../models/options-listener-group');
const RtmListenerGroup = require('../models/rtm-listener-group');
const SlackMessage = require('../models/slack-message');
const SlashCommandListenerGroup = require('../models/slash-command-listener-group');


/**
 *  This class acts as a base class for subscribers to the slack bot. The bot
 *  will pass the defined params for each subscriber, so this class provides
 *  a common set of functionality for all subscribers. It is optional to
 *  extend from this class for new subscribers, but it is strongly recommended.
 *
 *  @interface
 *  @alias Subscriber
 *  @memberof module:slackbot/interfaces
 *  @mixes Envable
 *  @mixes Identifyable
 *  @mixes Logable
 *  @extends Envable
 *  @extends Identifyable
 *  @extends Logable
 *
 *  @throws {SyntaxError} You cannot instantiate this class directly.
 */
class Subscriber extends Logable(Identifyable(Envable())) {
  static get [Symbol.species]() {
    return Subscriber;
  }


  constructor({ ...superOpts } = {}) {
    super(superOpts);
    if (new.target === Subscriber) {
      throw new SyntaxError('You cannot instantiate an abstract class!');
    }
  }


  /**
   *  This is where you add a listener group (i.e. a subclass of
   *  {@link ListenerGroup}). This ensures that the listeners you add to it
   *  will be added to the registry.
   *
   *  @param {ListenerGroup|array<ListenerGroup>} listenerGroups Any subclass with a species
   *                                                    of type `ListenerGroup`.
   *
   *  @throws {TypeError} Any and all listener groups must extend from
   *                      the `ListenerGroup` interface.
   */
  addListenerGroups(listenerGroups) {
    const registry = Registry.for(this);
    const procListenerGroups = Array.isArray(listenerGroups) ? listenerGroups : [listenerGroups];

    procListenerGroups.forEach((Collection) => {
      const name = _.camelCase(Collection.name);
      if (Collection[Symbol.species] !==  ListenerGroup) {
        throw new TypeError('Collection listener must be of type "ListenerGroup"!');
      }
      this._log.debug(`adding collection listener: ${Collection.name}`);
      this[name] = new Collection();
      registry.set(this[name]);
    });
  }

  /**
   *  This method is meant to be used to register any instances that are not
   *  automatically registered by the infrastructure. Pre-registered instances include:
   *  a `Slack` instance, `db` instance (if configured), subscriber instances, and
   *  any listeners added to any of the four pre-configured listener groups
   *  on a subscriber.
   *
   *  @abstract
   *  @param {Registry} registry Already scoped to the bot to which the subscriber
   *                             is added, for convenience.
   *  @throws {Error} If subclasses do not override this method.
   */
  register(/*registry*/) {
    // throw new Error('You must implement this method for Subscriber subclasses!');
  }

  /**
   *  This is the main method for subscriber code. Implementors should add
   *  their listeners here, along with any other server hooks they may need.
   *
   *  @abstract
   *  @param {Registry} registry Already scoped to the bot to which the subscriber
   *                             is added, for convenience.
   *  @throws {Error} If subclasses do not override this method.
   */
  subscribe(/*registry*/) {
    throw new Error('You must implement this method for Subscriber subclasses!');
  }


  /**
   *  This is private in the sense that subclasses should not override/use it,
   *  so the documentation is hidden. It is used to faciliate adding `Subscriber`
   *  instances to the registry.
   *
   *  @param {Registry} registry
   *  @private
   */
  _init(registry) {
    // this._log.debug(`finding registry for subscriber (${this._className})...`);
    // console.log(`subscriber registry.size = ${registry.size()}`);

    const server = registry.global('WebServer');
    const slack = registry.get('Slack');

    // we need the config for a slack app so we can grab these hooks
    const { interactiveUri, optionsLoadUri, slashCommandUri } = slack._config;

    // run this first to ensure that no collection listeners can be
    // accessed within the method. helps enforce separation of concerns..
    this.register(registry);

    // adds instances of these collection listeners to the subscriber, with
    // the property as a camelCased version of the class name
    this.addListenerGroups([
      InteractionListenerGroup,
      OptionsListenerGroup,
      RtmListenerGroup,
      SlashCommandListenerGroup,
    ]);

    // if your slack app has a slash command configured, the uri should be added
    // to your config. if you created and added any slash command listeners,
    // they will be sent every message received by this hook.
    if (slashCommandUri) {
      server.on(slashCommandUri, ({ headers, data, response }) => {
        this._log.json(`just saw a request from ${slashCommandUri}: `, data);
        if (this.slashCommandListenerGroup.length) {
          const message = new SlackMessage({ slack, message: data });
          return this.slashCommandListenerGroup.process({ headers, message, response });
        }
      });
    }

    // if your slack app has interactive messaging enabled, the uri should be added
    // to your config. if you created and added any interaction listeners,
    // they will be sent every message received by this hook.
    if (interactiveUri) {
      server.on(interactiveUri, ({ headers, data, response }) => {
        this._log.json(`just saw a request from ${interactiveUri}: `, data);
        if (this.interactionListenerGroup.length) {
          const message = new SlackMessage({ slack, message: data });
          return this.interactionListenerGroup.process({ headers, message, response });
        }
      });
    }

    // if your slack app uses dynamic options for select elements, the uri should be added
    // to your config. if you created and added any options listeners,
    // they will be sent every message received by this hook.
    if (optionsLoadUri) {
      server.on(optionsLoadUri, ({ headers, data, response }) => {
        this._log.json(`just saw a request from ${optionsLoadUri}: `, data);
        if (this.optionsListenerGroup.length) {
          const message = new SlackMessage({ slack, message: data });
          return this.optionsListenerGroup.process({ headers, message, response });
        }
      });
    }

    // if your slack app prefers interacting with rtm messages, and if you created
    // and added any rtm listeners, they will be sent every message received
    // by this hook.
    slack.rtmClient.on('message', (rtmMessage) => {
      // this._log.json(`incoming rtm message: `, rtmMessage);
      if (this.rtmListenerGroup.length) {
        const message = new SlackMessage({ slack, message: rtmMessage });
        return this.rtmListenerGroup.process({ message });
      }
    });

    // implementors MUST set their hooks in this method
    this.subscribe(registry);
  }
}


module.exports = Subscriber;
