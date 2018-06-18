const GithubRepo = require('../../models/github-repo');
const nock = require('nock');
const fs = require('fs');

const $ = {};

describe('GithubRepo', () => {
  it('can be created', () => {
    expect(new GithubRepo()).toEqual(jasmine.any(Object));
  });

  describe('#constructor', () => {
    beforeAll(() => {
      const file = `./config/${process.env.NODE_ENV}.json`;
      const data = fs.readFileSync(file);

      this.config = JSON.parse(data).githubRepo;
      this.repo = new GithubRepo({ configKey: 'githubRepo' });
    });

    it('retains a token', () => {
      expect(this.repo._config.token).toEqual(this.config.token);
    });

    it('retains an owner', () => {
      expect(this.repo._config.owner).toEqual(this.config.owner);
    });

    it('retains a user', () => {
      expect(this.repo._config.user).toEqual(this.config.user);
    });

    it('retains a name', () => {
      expect(this.repo._config.name).toEqual(this.config.name);
    });

    it('retains a defaultBranch', () => {
      expect(this.repo._config.defaultBranch).toEqual(this.config.defaultBranch);
    });

    describe('with a token', () => {
      it('is authenticated by default', () => {
        expect(this.repo.authenticated).toEqual(true);
      });
    });
  });

  describe('web requests', () => {
    beforeEach(() => {
      $.baseUrl = 'https://api.github.com:443';
      $.params = { encodedQueryParams: true };
      $.request = nock($.baseUrl, $.params);

      // config data comes from test.json
      $.githubRepo = new GithubRepo({ configKey: 'githubRepo' });
    });

    describe('#latestTag', () => {
      beforeEach(() => {
        $.tagName = '1.2.3';

        return $.request.get(`/repos/${$.githubRepo._config.owner}/${$.githubRepo._config.name}/releases/latest`)
          .reply(200, { tagName: `${$.tagName}` });
      });

      it('authenticates with the github api', async (done) => {
        await $.githubRepo.latestTag();
        expect($.githubRepo.authenticated).toEqual(true);
        done();
      });

      it('makes a https request to the github api', async (done) => {
        await $.githubRepo.latestTag();
        expect($.request.isDone()).toEqual(true);
        done();
      });

      it('returns the latest tag name', async (done) => {
        const tag = await $.githubRepo.latestTag();
        expect(tag).toEqual($.tagName);
        done();
      });
    });

    describe('#isDirty', () => {
      beforeEach(() => {
        $.latestTag = '1.2.3';
        $.latestSha = '50d5f155bb0a1262793755a0f8e5c470eb98dc56';
        $.latestTagSha = '50d5f155bb0a1262793755a0f8e5c470eb98dc56';
      });

      describe('when the sha of the default branch matches the latest tag sha', () => {
        beforeEach(() => {
          const { owner, name, defaultBranch } = $.githubRepo._config;

          // get latest sha
          $.request.get(`/repos/${owner}/${name}/commits/heads/${defaultBranch}`)
            .reply(200, { sha: `${$.latestSha}` });

          // get latest tag
          $.request.get(`/repos/${owner}/${name}/releases/latest`)
            .reply(200, { tagName: `${$.latestTag}` });

          // get latest tag sha
          $.request.get(`/repos/${owner}/${name}/git/refs/tags/${$.latestTag}`)
            .reply(200, { object: { sha: `${$.latestTagSha}` } });
        });

        it('returns false', async (done) => {
          const isDirty = await $.githubRepo.isDirty();
          expect(isDirty).toEqual(false);
          done();
        });
      });

      describe('when the sha of the default branch does NOT match the latest tag sha', () => {
        beforeEach(() => {
          const { owner, name, defaultBranch } = $.githubRepo._config;

          $.latestSha = '937268e5c55a014750d5f155b270eb98dc56fb0a'; // different sha

          // get latest sha
          $.request.get(`/repos/${owner}/${name}/commits/heads/${defaultBranch}`)
            .reply(200, { sha: `${$.latestSha}` });

          // get latest tag
          $.request.get(`/repos/${owner}/${name}/releases/latest`)
            .reply(200, { tagName: `${$.latestTag}` });

          // get latest tag sha
          $.request.get(`/repos/${owner}/${name}/git/refs/tags/${$.latestTag}`)
            .reply(200, { object: { sha: `${$.latestTagSha}` } });
        });

        it('returns true', async (done) => {
          const isDirty = await $.githubRepo.isDirty();
          expect(isDirty).toEqual(true);
          done();
        });
      });
    });

    describe('#publishRelease', () => {
      beforeEach(() => {
        const { owner, name } = $.githubRepo._config;
        $.tagName = '1.2.3';
        $.description = 'Description of this release.';
        $.url = `https://github.com/${owner}/${name}/releases/tag/${$.tagName}`;

        $.nockPublishRelease = (opts = {}) => {
          const nockResponse = $.request
            .post(`/repos/${owner}/${name}/releases`, { tag_name: `${$.tagName}`, name: `${$.tagName}`, body: `${$.description}` });

          if (opts.error != null) {
            return nockResponse.replyWithError(opts.error);
          }
          return nockResponse.reply(201, { html_url: `${$.url}` });
        };
      });

      describe('with a successful request', () => {
        beforeEach(() => {
          $.nockPublishRelease();
        });

        it('makes the request to github', async (done) => {
          await $.githubRepo.publishRelease($.tagName, $.description);
          expect($.request.isDone()).toEqual(true);
          done();
        });

        it('returns the url', async (done) => {
          const url = await $.githubRepo.publishRelease($.tagName, $.description);
          expect($.request.isDone()).toEqual(true);
          expect(url).toEqual($.url);
          done();
        });
      });

      describe('with an unsuccessful request', () => {
        beforeEach(() => {
          $.error = 'publish release error';
          return $.nockPublishRelease({ error: $.error });
        });

        it('returns the error', async (done) => {
          await $.githubRepo.publishRelease($.tagName, $.description)
            .catch((error) => {
              expect(error).toMatch($.error);
              done();
            });
        });
      });
    });
  });
});

