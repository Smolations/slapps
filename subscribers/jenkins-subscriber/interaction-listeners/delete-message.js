const InteractionListener = require('../../../interfaces/interaction-listener');


/**
 *  A universal processor to catch delete operations for a message.
 *
 *  @alias DeleteMessageInteractionListener
 *  @memberOf subscribers.jenkins
 *  @extends InteractionListener
 *  @private
 */
class DeleteMessageInteractionListener extends InteractionListener {
  /**
   *  Delete an incoming interactive message.
   *
   *  *NOTE:* Ephemeral messages cannot be deleted.
   *
   *  @param {object}       options
   *  @param {SlackMessage} options.message
   *  @returns {Promise}
   */
  deleteMessage({ message }) {
    this._log.debug('deleteMessage being called...');
    return message.delete();
  }
}


module.exports = DeleteMessageInteractionListener;
