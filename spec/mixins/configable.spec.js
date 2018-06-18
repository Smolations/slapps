const PurgeableModule = require('../helpers/purgeable-module');
const fs = require('fs');
const os = require('os');


function _makeConfig({ configBaseName = `${process.env.NODE_ENV || 'test'}`, config }) {
  const configContents = JSON.stringify(config);
  const tmpDir = os.tmpdir();
  const configPath = fs.mkdtempSync(`${tmpDir}/`);
  // console.log(`_makeConfig at: ${configPath}/${configBaseName}.json`);
  fs.writeFileSync(`${configPath}/${configBaseName}.json`, configContents);

  return { configPath, configBaseName };
}


describe('mixins: Configable', () => {
  beforeAll(() => {
    this.purgeableConfigable = new PurgeableModule('Configable', 'mixins/configable');
  });

  beforeEach(() => {
    // default config comes from ./config/test.json unless overridden
    const Configable = this.purgeableConfigable.require();
    this.Configed = (class extends Configable() {});
    this.Configable = Configable;
  });

  afterEach(() => {
    this.purgeableConfigable.purge();
  });


  it('can be created', () => {
    expect(new this.Configed()).toEqual(jasmine.any(Object));
  });

  describe('#constructor', () => {
    describe('configKey', () => {
      describe('when not provided', () => {
        it('config is an empty object', () => {
          const configed = new this.Configed();
          expect(configed._config).toEqual({});
        });
      });

      describe('when provided', () => {
        describe('and invalid', () => {
          it('should throw', () => {
            const shouldThrow = () => new this.Configed({ configKey: 'nonsense' });
            expect(shouldThrow).toThrowError(SyntaxError);
          });
        });

        describe('and valid', () => {
          it('config has correct data', () => {
            const configed = new this.Configed({ configKey: 'log' });
            expect(configed._config.path).toBeDefined();
          });
        });
      });
    });

    describe('configBaseName', () => {
      /**
       *  The cases where configBaseName is not provided are covered by the configKey
       *  tests, so no need to retest them here (they would look the same).
       *  Furthermore, the previous tests show that the config becomes an
       *  empty POJO when the configKey is not provided, so we provide one
       *  for each test here.
       */
      describe('when provided', () => {
        it('throws when invalid', () => {
          const config = () => new this.Configed({ configKey: 'doesnt matter', configBaseName: 'nonsense' });
          expect(config).toThrow();
        });

        it('is attached to instance when valid', () => {
          const configed = new this.Configed({ configKey: 'log', configBaseName: 'test' });
          expect(configed._config.path).toBeDefined();
        });
      });
    });
  });

  describe('with default ./config/test.json file', () => {
    describe('slackBot', () => {
      it('returns the config', () => {
        const configed = new this.Configed({ configKey: 'slackBot' });
        expect(configed._config.token).toEqual('SLACK-TOKEN');
        expect(configed._config.botToken).toEqual('SLACK-BOT-TOKEN');
        expect(configed._config.verificationToken).toEqual('SLACK-VERIFICATION-TOKEN');
        expect(configed._config.slashCommandUri).toEqual('SLACK-SLASH-COMMAND-URI');
        expect(configed._config.optionsLoadUri).toEqual('SLACK-OPTIONS-LOAD-URI');
        expect(configed._config.interactiveUri).toEqual('SLACK-INTERACTIVE-URI');
      });
    });

    describe('github/repo', () => {
      it('returns the config', () => {
        const configed = new this.Configed({ configKey: 'github/repo' });
        expect(configed._config.owner).toEqual('GITHUB-REPO-OWNER');
        expect(configed._config.name).toEqual('GITHUB-REPO-NAME');
        expect(configed._config.user).toEqual('GITHUB-USER');
        expect(configed._config.token).toEqual('GITHUB-TOKEN');
        expect(configed._config.defaultBranch).toEqual('GITHUB-DEFAULT-BRANCH');
        expect(configed._config.webhookUri).toEqual('GITHUB-WEBHOOK-URI');
        expect(configed._config.webhookSecret).toEqual('GITHUB-WEBHOOK-SECRET');
      });
    });

    describe('jenkins', () => {
      it('returns the config', () => {
        const configed = new this.Configed({ configKey: 'jenkins' });
        expect(configed._config.token).toEqual('JENKINS-TOKEN');
        expect(configed._config.user).toEqual('JENKINS-USER');
        expect(configed._config.protocol).toEqual('http');
        expect(configed._config.url).toEqual('localhost');
        expect(configed._config.port).toEqual(8080);
        expect(configed._config.csrfProtection).toEqual(false);
        expect(configed._config.notifyUri).toEqual('JENKINS-NOTIFY-URI');
      });
    });

    describe('log', () => {
      it('returns the config', () => {
        const configed = new this.Configed({ configKey: 'log' });
        expect(configed._config.path).toEqual('./log');
      });
    });

    describe('webServer', () => {
      it('returns the config', () => {
        const configed = new this.Configed({ configKey: 'webServer' });
        expect(configed._config.port).toEqual('12345');
        expect(configed._config.passphrase).toEqual('passphrase');
      });

      xdescribe('with a .pkcs12 file', () => {
        it('loads the contents from the file', () => {
          const configed = new this.Configed({ configKey: 'webServer' });
          const partialPkcs12Contents = {
            0: 48, 1: 130, 2: 9, 3: 105,
          };
          expect(configed._config.pfx).toEqual(jasmine.objectContaining(partialPkcs12Contents));
        });
      });
    });
  });

  describe('static methods', () => {
    describe('.configPath', () => {
      it('can be assigned', () => {
        const config = {
          key: {
            foo: true,
          },
        };
        const data = _makeConfig({ config });

        this.Configable.configPath(data.configPath);

        const configed = new this.Configed({ configKey: 'key' });

        expect(configed._config.foo).toEqual(true);
      });

      it('throws if path does not resolve', () => {
        const shouldThrow = () => this.Configable.configPath('nowhere/fast');
        expect(shouldThrow).toThrowError(SyntaxError);
      });
    });
  });
});
