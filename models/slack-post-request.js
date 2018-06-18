const http = require('http');
const https = require('https');
const querystring = require('querystring');
const _url = require('url');

const Envable = require('../mixins/envable');
const Identifyable = require('../mixins/identifyable');
const Logable = require('../mixins/logable');


// options <Object> | <string> | <URL>
//   protocol:  <string> Protocol to use. Defaults to http:.
//   host: <string> A domain name or IP address of the server to issue the request to. Defaults to localhost.
//   hostname: <string> Alias for host. To support url.parse(), hostname is preferred over host.
//   family: <number> IP address family to use when resolving host and hostname. Valid values are 4 or 6. When unspecified, both IP v4 and v6 will be used.
//   port: <number> Port of remote server. Defaults to 80.
//   localAddress: <string> Local interface to bind for network connections.
//   socketPath: <string> Unix Domain Socket (use one of host:port or socketPath).
//   method: <string> A string specifying the HTTP request method. Defaults to 'GET'.
//   path: <string> Request path. Defaults to '/'. Should include query string if any. E.G. '/index.html?page=12'. An exception is thrown when the request path contains illegal characters. Currently, only spaces are rejected but that may change in the future.
//   headers: <Object> An object containing request headers.
//   auth: <string> Basic authentication i.e. 'user:password' to compute an Authorization header.
//   agent: <http.Agent> | <boolean> Controls Agent behavior. Possible values:
//     undefined: (default): use http.globalAgent for this host and port.
//     Agent: object: explicitly use the passed in Agent.
//     false:: causes a new Agent with default values to be used.
//   createConnection: <Function> A function that produces a socket/stream to use for the request when the agent option is not used. This can be used to avoid creating a custom Agent class just to override the default createConnection function. See agent.createConnection() for more details.
//   timeout: <number>: A number specifying the socket timeout in milliseconds. This will set the timeout before the socket is connected.
// callback: <Function>
//
// Returns: <http.ClientRequest>

// const postData = querystring.stringify({
//   'msg': 'Hello World!'
// });

// const options = {
//   hostname: 'www.google.com',
//   port: 80,
//   path: '/upload',
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/x-www-form-urlencoded',
//     'Content-Length': Buffer.byteLength(postData)
//   }
// };


/**
 *  A lightweight class to handle POST requests suitable for slack hook consumption.
 *
 *  @alias SlackPostRequest
 *  @memberOf module:slackbot/models
 *  @mixes Envable
 *  @mixes Identifyable
 *  @mixes Logable
 *  @extends Envable
 *  @extends Identifyable
 *  @extends Logable
 *
 *  @see external:http
 *  @see external:https
 *  @see external:querystring
 *  @see external:url
 */
class SlackPostRequest extends Identifyable(Logable(Envable())) {
  /**
   *  Default options for all requests. The `hostname`, `port`, and `path` are
   *  all acquired by the parsed `url` instance. See source for provided values.
   *  @type {object}
   *  @readonly
   */
  get _defaultOpts() {
    const { hostname, port, path } = this.parsedUrl;
    return {
      hostname,
      port,
      path,
      method: 'POST',
      headers: {
        'Accept': 'application/json,*/*',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(this.postBody),
      },
    };
  }

  /**
   *  A copy of the given url (post parsing).
   *  @type {string}
   *  @readonly
   */
  get url() {
    return this.parsedUrl.href;
  }

  /**
   *  This method provides the most flexibility when sending a request. Behind
   *  the scenes, this class uses node's `http` or `https` module, depending on
   *  whether or not the given `url` is ssl-enabled.
   *
   *  @param {object} options
   *  @param {string} options.url The URL to which to POST.
   *  @param {object} [options.options={}] Any options to pass to the HTTP Request.
   *  @param {object} [options.headers={}] Any headers to pass to the HTTP Request.
   *  @param {string} [options.body=''] The body of the request.
   *  @returns {Promise} Resolves or rejects with response `{ headers, body }`;
   */
  send({ url, options = {}, headers = {}, body = '' }) {
    const opts = {};
    const parsedUrl =  _url.parse(url);
    const { protocol } = parsedUrl;
    const httpObj = (protocol === 'http:') ? http : https;

    this.parsedUrl = parsedUrl;
    this.postBody = body;

    const promise = new Promise((resolve, reject) => {
      const defaultOpts = this._defaultOpts;
      Object.assign(defaultOpts.headers, headers);
      Object.assign(opts, defaultOpts, options);

      this._log.debug('sending POST to: ', this.url);
      this._log.json('  with opts: ', opts);

      const req = httpObj.request(opts, (res) => {
        const resHeaders = res.headers;
        let resBody = '';
        this._log.debug(`STATUS: ${res.statusCode}`);
        this._log.json(`HEADERS: `, resHeaders);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          resBody += chunk;
          this._log.debug(`BODY: ${chunk}`);
        });
        res.on('end', () => {
          const dataObj = { headers: resHeaders, body: resBody };
          if (res.statusCode >= 400) {
            reject(dataObj);
          } else {
            resolve(dataObj);
          }

          this._log.debug('No more data in response.');
        });
      });

      req.on('error', (e) => {
        reject(e);
        this._log.error(`problem with request: ${e.message}`);
      });

      // write data to request body
      req.write(this.postBody);
      req.end();
    });

    return promise;
  }

  /**
   *  This is a convenience method for POSTing JSON objects. It automatically
   *  sets the correctly needed headers and stringifies the provided `json`.
   *
   *  @param {object} options
   *  @param {string} options.url The URL to which to POST.
   *  @param {object} options.json The JSON object to POST.
   *  @param {object} [options.options={}] Any options to pass to the HTTP Request.
   *  @param {object} [options.headers={}] Any headers to pass to the HTTP Request.
   *  @returns {Promise} Resolves or rejects with response `{ headers, body }`;
   *
   *  @see SlackPostRequest#send
   */
  sendJSON({ url, options = {}, headers = {}, json }) {
    const body = JSON.stringify(json);
    const newHeaders = Object.assign({}, headers, { 'Content-Type': 'application/json,*/*' });
    return this.send({ url, options, headers: newHeaders, body });
  }
}


module.exports = SlackPostRequest;
