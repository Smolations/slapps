const Release = require('../../models/release');

const $ = {};

describe('Release', () => {
  it('can be created', () => {
    expect(new Release()).toEqual(jasmine.any(Object));
  });

  describe('#constructor', () => {
    it('accepts a user', () => {
      const user = 'unique-user';
      const release = new Release({ user });

      expect(release.user).toEqual(user);
    });

    it('accepts a channel', () => {
      const channel = { the: 'channel' };
      const release = new Release({ channel });

      expect(release.channel).toEqual(channel);
    });

    it('accepts a state', () => {
      const state = 'UNIQUE-STATE';
      const release = new Release({ state });

      expect(release.state).toEqual(state);
    });

    it('accepts a version', () => {
      const version = '9.7.5';
      const release = new Release({ version });

      expect(release.version).toEqual(version);
    });

    describe('merged (flag)', () => {
      it('can be assigned', () => {
        const release = new Release({ merged: true });

        expect(release.merged).toEqual(true);
      });

      it('is set to false by default', () => {
        const release = new Release();

        expect(release.merged).toEqual(false);
      });
    });
  });

  describe('#generateVersion', () => {
    beforeEach(() => {
      $.release = new Release();
    });

    describe('Mountain Time', () => {
      describe('without daylight savings time', () => {
        beforeEach(() => {
          $.epochTime = Date.UTC(2000, 0, 1, 7, 8, 9); // January 1, 2000, 07:08:09 UTC
        });

        it('returns YYYYMMDD.HHMMSS -7000 MST', () => {
          expect($.release.generateVersion($.epochTime)).toEqual('20000101.000809'); // January 1, 2000, 00:08:09 MT
        });
      });

      describe('during daylight savings time', () => {
        beforeEach(() => {
          $.epochTime = Date.UTC(2000, 5, 1, 7, 8, 9); // June 1, 2000, 07:08:09 UTC
        });

        it('returns YYYYMMDD.HHMMSS -6000 MDT', () => {
          expect($.release.generateVersion($.epochTime)).toEqual('20000601.010809'); // June 1, 2000, 01:08:09 MT
        });
      });
    });

    describe('without a time', () => {
      it('returns the current date/time', () => {
        expect($.release.generateVersion()).toMatch(/\d{8}\.\d{6}/); // YYYYMMDD.HHMMSS
      });
    });
  });
});
