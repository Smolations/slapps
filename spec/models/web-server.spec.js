const WebServer = require('../../models/web-server');
const querystring = require('querystring');
const request = require('request');


// don't blow up from self-signed https certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe('WebServer', () => {
  it('can be created', () => {
    expect(new WebServer()).toEqual(jasmine.any(Object));
  });

  describe('without SSL', () => {
    beforeAll(() => {
      // config comes from test.json
      this.webServer = new WebServer({ configKey: 'webServer' });
    });

    describe('#start/#stop', () => {
      beforeEach(() => {
        this.webServer.start();
      });

      afterEach(() => {
        this.webServer.stop();
      });

      describe("_on('WebServer:request:post:<route>')", () => {
        beforeEach(() => {
          this.route = '/webhook-route';
          this.routeEvent = `WebServer:request:post:${this.route}`;
        });

        describe('for a target route', () => {
          beforeEach(() => {
            this.formData = { unique: 'signature' };
            this.encodedFormData = querystring.stringify(this.formData);
            this.headers = { custom: 'header' };
            this.options = {
              url: `http://localhost:${this.webServer._config.port}${this.route}`,
              form: this.formData,
              headers: this.headers,
            };
          });

          it('returns 200 ok', (done) => {
            request.post(this.options, (error, response) => {
              expect(response.statusCode).toEqual(200);
              done();
            });
          });

          it('triggers the route event', (done) => {
            this.webServer._on(this.routeEvent, done);
            request.post(this.options);
          });

          it('emits the encoded (raw) form data', (done) => {
            this.webServer._on(this.routeEvent, ({ rawData }) => {
              expect(rawData).toEqual(this.encodedFormData);
              done();
            });

            request.post(this.options);
          });

          it('emits the encoded form data as JSON object', (done) => {
            this.webServer._on(this.routeEvent, ({ message }) => {
              expect(message).toEqual(this.formData);
              done();
            });

            request.post(this.options);
          });

          it('emits the headers object', (done) => {
            this.webServer._on(this.routeEvent, ({ headers }) => {
              expect(headers).toEqual(jasmine.objectContaining(this.headers));
              done();
            });

            request.post(this.options);
          });
        });

        describe('with an incoming http GET request for a registered webhook route', () => {
          beforeEach(() => {
            this.options = { url: `http://localhost:${this.webServer._config.port}${this.route}` };
          });

          it('returns 403 forbidden', (done) => {
            request.get(this.options, (error, response) => {
              expect(response.statusCode).toEqual(403);
              done();
            });
          });
        });

        // are registered webhooks more for security? this might be better mitigated
        // using the token/response uri provided by slack POST requests...
        xdescribe('with an incoming http POST request for an unregistered webhook route', () => {
          beforeEach(() => {
            this.options = { url: `http://localhost:${this.webServer._config.port}/unregistered` };
          });

          it('returns 403 forbidden', (done) => {
            request.post(this.options, (error, response) => {
              expect(response.statusCode).toEqual(403);
              done();
            });
          });
        });
      });
    });
  });

  describe('with SSL', () => {
    beforeAll(() => {
      // config comes from test.json
      this.webServer = new WebServer({ configKey: 'webServer', ssl: true });
    });

    describe('#start/#stop', () => {
      beforeEach(() => {
        this.webServer.start();
      });

      afterEach(() => {
        this.webServer.stop();
      });

      describe("_on('WebServer:request:post:<route>')", () => {
        beforeEach(() => {
          this.route = '/webhook-route';
          this.routeEvent = `WebServer:request:post:${this.route}`;
        });

        describe('with an incoming https POST request for a target route', () => {
          beforeEach(() => {
            this.formData = { unique: 'signature' };
            this.encodedFormData = querystring.stringify(this.formData);
            this.headers = { custom: 'header' };
            this.options = {
              url: `https://localhost:${this.webServer._config.port}${this.route}`,
              form: this.formData,
              headers: this.headers,
            };
          });

          it('returns 200 ok', (done) => {
            request.post(this.options, (error, response) => {
              expect(response.statusCode).toEqual(200);
              done();
            });
          });

          it('triggers the route event', (done) => {
            this.webServer._on(this.routeEvent, done);
            request.post(this.options);
          });

          it('emits the encoded (raw) form data', (done) => {
            this.webServer._on(this.routeEvent, ({ rawData }) => {
              expect(rawData).toEqual(this.encodedFormData);
              done();
            });

            request.post(this.options);
          });

          it('emits the header object', (done) => {
            this.webServer._on(this.routeEvent, ({ headers }) => {
              expect(headers).toEqual(jasmine.objectContaining(this.headers));
              done();
            });

            request.post(this.options);
          });
        });

        describe('with an incoming http GET request for a registered webhook route', () => {
          beforeEach(() => {
            this.options = { url: `https://localhost:${this.webServer._config.port}${this.route}` };
          });

          it('returns 403 forbidden', (done) => {
            request.get(this.options, (error, response) => {
              expect(response.statusCode).toEqual(403);
              done();
            });
          });
        });

        xdescribe('with an incoming http POST request for an unregistered webhook route', () => {
          beforeEach(() => {
            this.options = { url: `https://localhost:${this.port}/unregistered` };
          });

          it('returns 403 forbidden', (done) => {
            request.post(this.options, (error, response) => {
              expect(response.statusCode).toEqual(403);
              done();
            });
          });
        });
      });
    });
  });
});
