const _ = require('lodash');
const crypto = require('crypto');
const querystring = require('querystring');

const Jsonable = require('../../mixins/jsonable');
const Logable = require('../../mixins/logable');

const _computedSignature = Symbol('computedSignature');
const _constantTimeCompare = Symbol('constantTimeCompare');
const _secret = Symbol('secret');
const _truncate = Symbol('truncate');


/**
 *  A wrapper for github event webhooks.
 *
 *  @alias GithubEvent
 *  @memberOf module:slackbot/models
 *  @mixes Jsonable
 *  @mixes Logable
 *  @extends Jsonable
 *  @extends Logable
 *
 *  @see external:crypto
 *  @see external:querystring
 */
class GithubEvent extends Jsonable(Logable()) {
  /**
   *  @readonly
   */
  get branch() {
    let branch;
    if (this.isMergedPullRequest) {
      branch = _.get(this._json, 'pull_request.base.ref');
    }
    return branch;
  }

  /**
   *  @readonly
   */
  get isClosedPullRequest() {
    return this.isPullRequest && (this._json.action === 'closed');
  }

  /**
   *  Whether or not this hook represents a merged pull request.
   *  @readonly
   */
  get isMergedPullRequest() {
    const isMerged = (_.get(this._json, 'pull_request.merged') === true);
    return (this.isPullRequest && isMerged && this.isClosedPullRequest);
  }

  /**
   *  @readonly
   */
  get isPublished() {
    return (this._json.action === 'published');
  }

  /**
   *  Whether or not this hook represents a published release.
   */
  get isPublishedRelease() {
    return (this.isRelease && this.isPublished);
  }

  /**
   *  @readonly
   */
  get isPullRequest() {
    return !!this._json.pull_request;
  }

  /**
   *  @readonly
   */
  get isRelease() {
    return !!this._json.release;
  }

  /**
   *  I dunno...
   *  @readonly
   */
  get isValid() {
    return this[_constantTimeCompare](this['x-hub-signature'], this[_computedSignature]());
  }

  /**
   *  @readonly
   */
  get repoOwner() {
    const name = _.get(this._json, 'repository.full_name') || '';
    return name.split('/')[0];
  }

  /**
   *  @readonly
   */
  get repoName() {
    const name = _.get(this._json, 'repository.full_name') || '';
    return name.split('/')[1];
  }

  /**
   *  Only gets a title if it's a merged PR.
   *  @readonly
   */
  get title() {
    let title;
    if (this.isMergedPullRequest) {
      title = this[_truncate](_.get(this._json, 'pull_request.title'), 60);
    }
    return title;
  }

  /**
   *  @readonly
   */
  get url() {
    let url;
    if (this.isMergedPullRequest) {
      url = _.get(this._json, 'pull_request.html_url');
    }
    if (this.isPublishedRelease) {
      url = _.get(this._json, 'release.html_url');
    }
    return url;
  }

  /**
   *  @readonly
   */
  get user() {
    let user;
    if (this.isMergedPullRequest) {
      user = _.get(this._json, 'pull_request.merged_by.login');
    }
    if (this.isPublishedRelease) {
      user = _.get(this._json, 'release.author.login');
    }
    return user;
  }


  constructor({ payload, headers = {}, secret = '', ...superOpts } = {}) {
    super({ json: payload, ...superOpts });

    this._json['x-hub-delivery'] = headers['x-github-delivery'];
    this._json['x-hub-signature'] = headers['x-hub-signature'];
    this._json.event = headers['x-github-event'];

    this[_secret] = secret;
  }


  [_computedSignature]() {
    const hash = crypto
      .createHmac('sha1', this[_secret])
      .update(this._json, 'utf8')
      .digest('hex');
    return `sha1=${hash}`;
  }

  [_constantTimeCompare](a, b) {
    if (a.length !== b.length) { return false; }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  [_truncate](text, length) {
    if (text.length > length) {
      return `${text.substr(0, length).trim()}...`;
    }
    return text;
  }
}


module.exports = GithubEvent;
