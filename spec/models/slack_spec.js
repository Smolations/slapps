const Slack = require('../../models/slack');
const nock = require('nock');

const $ = {};

describe('Slack', () => {
  it('can be created', () => {
    expect(new Slack()).toEqual(jasmine.any(Object));
  });

  it('accepts a token', () => {
    const token = 'token';
    const slack = new Slack({ token });

    expect(slack.token).toEqual(token);
  });

  describe('http requests', () => {
    beforeEach(() => {
      $.token = 'ABCDEFG-1234567';
      $.slack = new Slack({ token: $.token });
      $.baseUrl = 'https://slack.com:443';
      $.opts = { encodedQueryParams: true };
      $.channelId = 'C2GAHSNDU';
    });

    describe('#postMessage', () => {
      beforeEach(() => {
        $.path = '/api/chat.postMessage';
        $.payload = `unfurlLinks=false&asUser=true&channel=channel&text=Message%20Text&token=${$.token}`;
        $.responseData = { ok: true };
        $.request = nock($.baseUrl, $.opts)
          .post($.path, $.payload)
          .reply(200, $.responseData);
      });

      it('makes a https POST request to Slack', (done) => {
        $.slack.postMessage('channel', 'Message Text', () => {
          expect($.request.isDone()).toEqual(true);
          done();
        });
      });

      describe('with a successful response', () => {
        it('returns the data', (done) => {
          $.slack.postMessage('channel', 'Message Text', (error, data) => {
            expect(data).toEqual(jasmine.objectContaining($.responseData));
            done();
          });
        });
      });

      xdescribe('with an error response', () => {
        it('returns the error', () => {}); // no op
      });
    });

    describe('#allInvitedChannels', () => {
      beforeEach(() => {
        $.path = '/api/channels.list';
        $.payload = `token=${$.token}`;
        $.responseData = {
          ok: true,
          channels: [
            {
              id: `${$.channelId}`,
              name: 'devops',
              isMember: true,
              isArchived: false,
            },
          ],
        };
        $.request = nock($.baseUrl, $.opts)
          .post($.path, $.payload)
          .reply(200, $.responseData);
      });

      it('makes an https GET request to slack', (done) => {
        $.slack.allInvitedChannels(() => {
          expect($.request.isDone()).toEqual(true);
          done();
        });
      });

      it('returns an array of channel ids', (done) => {
        $.slack.allInvitedChannels((error, data) => {
          expect(data).toEqual([$.channelId]);
          done();
        });
      });
    });
  });

  xdescribe('#start', () => {
    it('makes a request to slack for the websocket url', () => {});

    it('connects to the slack websocket', () => {});
  });

  xdescribe('#message <event>', () => {
    it('is triggered when a message comes across the websocket', () => {});

    it('returns the message payload', () => {});
  });

  xdescribe('#sendMessage', () => it('sends the message over the slack websocket', () => {}));
});
