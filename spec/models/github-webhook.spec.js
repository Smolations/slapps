const GithubWebhook = require('../../models/github-webhook');

const $ = {};

describe('GithubWebhook', () => {
  it('can be created', () => {
    expect(new GithubWebhook()).toEqual(jasmine.any(Object));
  });

  xdescribe('#constructor', () => {
    it('accepts data', () => {
      const data = 'data';
      const webhook = new GithubWebhook({ data });

      expect(webhook.data).toEqual(data);
    });

    it('accepts headers', () => {
      const headers = 'headers';
      const webhook = new GithubWebhook({ headers });

      expect(webhook.headers).toEqual(headers);
    });

    it('accepts a secret', () => {
      const secret = 'the secret';
      const webhook = new GithubWebhook({ secret });

      expect(webhook.secret).toEqual(secret);
    });
  });

  describe('#valid', () =>
    describe('with valid data, signature, and secret', () => {
      beforeEach(() => {
        $.secret = 'ABCDEF-123456';
        $.data = 'payload=%7B%22ref%22%3A%22refs%2Ftags%2F3.0.9%22%2C%22before%22%3A%220000000000000000000000000000000000000000%22%2C%22after%22%3A%22049c51f1265922d882949dede0f4c215c329d799%22%2C%22created%22%3Atrue%2C%22deleted%22%3Afalse%2C%22forced%22%3Afalse%2C%22base_ref%22%3A%22refs%2Fheads%2Fmaster%22%2C%22compare%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest%2Fcompare%2F3.0.9%22%2C%22commits%22%3A%5B%5D%2C%22head_commit%22%3A%7B%22id%22%3A%22049c51f1265922d882949dede0f4c215c329d799%22%2C%22tree_id%22%3A%2254e609bd6f1d345774c626d626bc3fba2b11f90a%22%2C%22distinct%22%3Atrue%2C%22message%22%3A%22Merge+pull+request+%2319+from+taujenis%2Fnewbranch%5Cn%5Cncommit%22%2C%22timestamp%22%3A%222017-01-12T06%3A46%3A46-07%3A00%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest%2Fcommit%2F049c51f1265922d882949dede0f4c215c329d799%22%2C%22author%22%3A%7B%22name%22%3A%22Alex+Taujenis%22%2C%22email%22%3A%22taujenis%40users.noreply.github.com%22%2C%22username%22%3A%22taujenis%22%7D%2C%22committer%22%3A%7B%22name%22%3A%22GitHub%22%2C%22email%22%3A%22noreply%40github.com%22%2C%22username%22%3A%22web-flow%22%7D%2C%22added%22%3A%5B%5D%2C%22removed%22%3A%5B%5D%2C%22modified%22%3A%5B%22README.md%22%5D%7D%2C%22repository%22%3A%7B%22id%22%3A76759433%2C%22name%22%3A%22test%22%2C%22full_name%22%3A%22taujenis%2Ftest%22%2C%22owner%22%3A%7B%22name%22%3A%22taujenis%22%2C%22email%22%3A%22taujenis%40users.noreply.github.com%22%7D%2C%22private%22%3Afalse%2C%22html_url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest%22%2C%22description%22%3A%22A+useless+repository+created+to+test+github+webhooks.%22%2C%22fork%22%3Afalse%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest%22%2C%22forks_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fforks%22%2C%22keys_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fkeys%7B%2Fkey_id%7D%22%2C%22collaborators_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fcollaborators%7B%2Fcollaborator%7D%22%2C%22teams_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fteams%22%2C%22hooks_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fhooks%22%2C%22issue_events_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fissues%2Fevents%7B%2Fnumber%7D%22%2C%22events_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fevents%22%2C%22assignees_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fassignees%7B%2Fuser%7D%22%2C%22branches_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fbranches%7B%2Fbranch%7D%22%2C%22tags_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Ftags%22%2C%22blobs_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fgit%2Fblobs%7B%2Fsha%7D%22%2C%22git_tags_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fgit%2Ftags%7B%2Fsha%7D%22%2C%22git_refs_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fgit%2Frefs%7B%2Fsha%7D%22%2C%22trees_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fgit%2Ftrees%7B%2Fsha%7D%22%2C%22statuses_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fstatuses%2F%7Bsha%7D%22%2C%22languages_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Flanguages%22%2C%22stargazers_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fstargazers%22%2C%22contributors_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fcontributors%22%2C%22subscribers_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fsubscribers%22%2C%22subscription_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fsubscription%22%2C%22commits_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fcommits%7B%2Fsha%7D%22%2C%22git_commits_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fgit%2Fcommits%7B%2Fsha%7D%22%2C%22comments_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fcomments%7B%2Fnumber%7D%22%2C%22issue_comment_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fissues%2Fcomments%7B%2Fnumber%7D%22%2C%22contents_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fcontents%2F%7B%2Bpath%7D%22%2C%22compare_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fcompare%2F%7Bbase%7D...%7Bhead%7D%22%2C%22merges_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fmerges%22%2C%22archive_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2F%7Barchive_format%7D%7B%2Fref%7D%22%2C%22downloads_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fdownloads%22%2C%22issues_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fissues%7B%2Fnumber%7D%22%2C%22pulls_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fpulls%7B%2Fnumber%7D%22%2C%22milestones_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fmilestones%7B%2Fnumber%7D%22%2C%22notifications_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fnotifications%7B%3Fsince%2Call%2Cparticipating%7D%22%2C%22labels_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Flabels%7B%2Fname%7D%22%2C%22releases_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Freleases%7B%2Fid%7D%22%2C%22deployments_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fdeployments%22%2C%22created_at%22%3A1482029717%2C%22updated_at%22%3A%222016-12-18T02%3A57%3A31Z%22%2C%22pushed_at%22%3A1485332636%2C%22git_url%22%3A%22git%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest.git%22%2C%22ssh_url%22%3A%22git%40github.com%3Ataujenis%2Ftest.git%22%2C%22clone_url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest.git%22%2C%22svn_url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest%22%2C%22homepage%22%3A%22%22%2C%22size%22%3A7%2C%22stargazers_count%22%3A0%2C%22watchers_count%22%3A0%2C%22language%22%3Anull%2C%22has_issues%22%3Atrue%2C%22has_downloads%22%3Atrue%2C%22has_wiki%22%3Atrue%2C%22has_pages%22%3Afalse%2C%22forks_count%22%3A0%2C%22mirror_url%22%3Anull%2C%22open_issues_count%22%3A0%2C%22forks%22%3A0%2C%22open_issues%22%3A0%2C%22watchers%22%3A0%2C%22default_branch%22%3A%22master%22%2C%22stargazers%22%3A0%2C%22master_branch%22%3A%22master%22%7D%2C%22pusher%22%3A%7B%22name%22%3A%22taujenis%22%2C%22email%22%3A%22taujenis%40users.noreply.github.com%22%7D%2C%22sender%22%3A%7B%22login%22%3A%22taujenis%22%2C%22id%22%3A18267030%2C%22avatar_url%22%3A%22https%3A%2F%2Favatars.githubusercontent.com%2Fu%2F18267030%3Fv%3D3%22%2C%22gravatar_id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%22%2C%22html_url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%22%2C%22followers_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Ffollowers%22%2C%22following_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Ffollowing%7B%2Fother_user%7D%22%2C%22gists_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fgists%7B%2Fgist_id%7D%22%2C%22starred_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fstarred%7B%2Fowner%7D%7B%2Frepo%7D%22%2C%22subscriptions_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fsubscriptions%22%2C%22organizations_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Forgs%22%2C%22repos_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Frepos%22%2C%22events_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fevents%7B%2Fprivacy%7D%22%2C%22received_events_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Freceived_events%22%2C%22type%22%3A%22User%22%2C%22site_admin%22%3Afalse%7D%7D';

        $.headers = {
          host: '174.16.150.51:12345',
          accept: '*/*',
          'user-agent': 'GitHub-Hookshot/46646bb',
          'x-github-event': 'push',
          'x-github-delivery': '9cecf600-e2d7-11e6-822b-3f7401ff0fdd',
          'content-type': 'application/x-www-form-urlencoded',
          'x-hub-signature': 'sha1=08538596a3b7981f3eb42b41364efa501d04e132',
          'content-length': '7736',
        };

        $.webhook = new GithubWebhook({
          secret: $.secret,
          data: $.data,
          headers: $.headers,
        });
      });

      it('returns true', () => {
        expect($.webhook.valid()).toEqual(true);
      });

      xdescribe('with invalid data', () => {
        beforeEach(() => {
          $.data = 'payload=INVALID%7B%22action%22%3A%22published%22%2C%22release%22%3A%7B%22url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Freleases%2F5252127%22%2C%22assets_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Freleases%2F5252127%2Fassets%22%2C%22upload_url%22%3A%22https%3A%2F%2Fuploads.github.com%2Frepos%2Ftaujenis%2Ftest%2Freleases%2F5252127%2Fassets%7B%3Fname%2Clabel%7D%22%2C%22html_url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest%2Freleases%2Ftag%2F3.0.6%22%2C%22id%22%3A5252127%2C%22tag_name%22%3A%223.0.6%22%2C%22target_commitish%22%3A%22master%22%2C%22name%22%3A%223.0.6%22%2C%22draft%22%3Afalse%2C%22author%22%3A%7B%22login%22%3A%22taujenis%22%2C%22id%22%3A18267030%2C%22avatar_url%22%3A%22https%3A%2F%2Favatars.githubusercontent.com%2Fu%2F18267030%3Fv%3D3%22%2C%22gravatar_id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%22%2C%22html_url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%22%2C%22followers_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Ffollowers%22%2C%22following_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Ffollowing%7B%2Fother_user%7D%22%2C%22gists_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fgists%7B%2Fgist_id%7D%22%2C%22starred_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fstarred%7B%2Fowner%7D%7B%2Frepo%7D%22%2C%22subscriptions_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fsubscriptions%22%2C%22organizations_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Forgs%22%2C%22repos_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Frepos%22%2C%22events_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fevents%7B%2Fprivacy%7D%22%2C%22received_events_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Freceived_events%22%2C%22type%22%3A%22User%22%2C%22site_admin%22%3Afalse%7D%2C%22prerelease%22%3Afalse%2C%22created_at%22%3A%222017-01-12T13%3A46%3A46Z%22%2C%22published_at%22%3A%222017-01-24T15%3A33%3A04Z%22%2C%22assets%22%3A%5B%5D%2C%22tarball_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Ftarball%2F3.0.6%22%2C%22zipball_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fzipball%2F3.0.6%22%2C%22body%22%3A%22asdf%22%7D%2C%22repository%22%3A%7B%22id%22%3A76759433%2C%22name%22%3A%22test%22%2C%22full_name%22%3A%22taujenis%2Ftest%22%2C%22owner%22%3A%7B%22login%22%3A%22taujenis%22%2C%22id%22%3A18267030%2C%22avatar_url%22%3A%22https%3A%2F%2Favatars.githubusercontent.com%2Fu%2F18267030%3Fv%3D3%22%2C%22gravatar_id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%22%2C%22html_url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%22%2C%22followers_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Ffollowers%22%2C%22following_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Ffollowing%7B%2Fother_user%7D%22%2C%22gists_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fgists%7B%2Fgist_id%7D%22%2C%22starred_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fstarred%7B%2Fowner%7D%7B%2Frepo%7D%22%2C%22subscriptions_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fsubscriptions%22%2C%22organizations_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Forgs%22%2C%22repos_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Frepos%22%2C%22events_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fevents%7B%2Fprivacy%7D%22%2C%22received_events_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Freceived_events%22%2C%22type%22%3A%22User%22%2C%22site_admin%22%3Afalse%7D%2C%22private%22%3Afalse%2C%22html_url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest%22%2C%22description%22%3A%22A+useless+repository+created+to+test+github+webhooks.%22%2C%22fork%22%3Afalse%2C%22url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%22%2C%22forks_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fforks%22%2C%22keys_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fkeys%7B%2Fkey_id%7D%22%2C%22collaborators_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fcollaborators%7B%2Fcollaborator%7D%22%2C%22teams_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fteams%22%2C%22hooks_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fhooks%22%2C%22issue_events_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fissues%2Fevents%7B%2Fnumber%7D%22%2C%22events_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fevents%22%2C%22assignees_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fassignees%7B%2Fuser%7D%22%2C%22branches_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fbranches%7B%2Fbranch%7D%22%2C%22tags_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Ftags%22%2C%22blobs_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fgit%2Fblobs%7B%2Fsha%7D%22%2C%22git_tags_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fgit%2Ftags%7B%2Fsha%7D%22%2C%22git_refs_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fgit%2Frefs%7B%2Fsha%7D%22%2C%22trees_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fgit%2Ftrees%7B%2Fsha%7D%22%2C%22statuses_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fstatuses%2F%7Bsha%7D%22%2C%22languages_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Flanguages%22%2C%22stargazers_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fstargazers%22%2C%22contributors_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fcontributors%22%2C%22subscribers_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fsubscribers%22%2C%22subscription_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fsubscription%22%2C%22commits_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fcommits%7B%2Fsha%7D%22%2C%22git_commits_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fgit%2Fcommits%7B%2Fsha%7D%22%2C%22comments_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fcomments%7B%2Fnumber%7D%22%2C%22issue_comment_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fissues%2Fcomments%7B%2Fnumber%7D%22%2C%22contents_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fcontents%2F%7B%2Bpath%7D%22%2C%22compare_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fcompare%2F%7Bbase%7D...%7Bhead%7D%22%2C%22merges_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fmerges%22%2C%22archive_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2F%7Barchive_format%7D%7B%2Fref%7D%22%2C%22downloads_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fdownloads%22%2C%22issues_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fissues%7B%2Fnumber%7D%22%2C%22pulls_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fpulls%7B%2Fnumber%7D%22%2C%22milestones_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fmilestones%7B%2Fnumber%7D%22%2C%22notifications_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fnotifications%7B%3Fsince%2Call%2Cparticipating%7D%22%2C%22labels_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Flabels%7B%2Fname%7D%22%2C%22releases_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Freleases%7B%2Fid%7D%22%2C%22deployments_url%22%3A%22https%3A%2F%2Fapi.github.com%2Frepos%2Ftaujenis%2Ftest%2Fdeployments%22%2C%22created_at%22%3A%222016-12-18T02%3A55%3A17Z%22%2C%22updated_at%22%3A%222016-12-18T02%3A57%3A31Z%22%2C%22pushed_at%22%3A%222017-01-24T15%3A28%3A44Z%22%2C%22git_url%22%3A%22git%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest.git%22%2C%22ssh_url%22%3A%22git%40github.com%3Ataujenis%2Ftest.git%22%2C%22clone_url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest.git%22%2C%22svn_url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest%22%2C%22homepage%22%3A%22%22%2C%22size%22%3A8%2C%22stargazers_count%22%3A0%2C%22watchers_count%22%3A0%2C%22language%22%3Anull%2C%22has_issues%22%3Atrue%2C%22has_downloads%22%3Atrue%2C%22has_wiki%22%3Atrue%2C%22has_pages%22%3Afalse%2C%22forks_count%22%3A0%2C%22mirror_url%22%3Anull%2C%22open_issues_count%22%3A0%2C%22forks%22%3A0%2C%22open_issues%22%3A0%2C%22watchers%22%3A0%2C%22default_branch%22%3A%22master%22%7D%2C%22sender%22%3A%7B%22login%22%3A%22taujenis%22%2C%22id%22%3A18267030%2C%22avatar_url%22%3A%22https%3A%2F%2Favatars.githubusercontent.com%2Fu%2F18267030%3Fv%3D3%22%2C%22gravatar_id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%22%2C%22html_url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%22%2C%22followers_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Ffollowers%22%2C%22following_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Ffollowing%7B%2Fother_user%7D%22%2C%22gists_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fgists%7B%2Fgist_id%7D%22%2C%22starred_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fstarred%7B%2Fowner%7D%7B%2Frepo%7D%22%2C%22subscriptions_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fsubscriptions%22%2C%22organizations_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Forgs%22%2C%22repos_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Frepos%22%2C%22events_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Fevents%7B%2Fprivacy%7D%22%2C%22received_events_url%22%3A%22https%3A%2F%2Fapi.github.com%2Fusers%2Ftaujenis%2Freceived_events%22%2C%22type%22%3A%22User%22%2C%22site_admin%22%3Afalse%7D%7D';

          $.webhook = new GithubWebhook({
            secret: $.secret,
            data: $.data,
            headers: $.headers,
          });
        });

        it('returns false', () => {
          expect($.webhook.valid()).toEqual(false);
        });
      });

      describe('with an invalid signature', () => {
        beforeEach(() => {
          $.headers = {
            host: '174.16.150.51:12345',
            accept: '*/*',
            'user-agent': 'GitHub-Hookshot/46646bb',
            'x-github-event': 'push',
            'x-github-delivery': '9cecf600-e2d7-11e6-822b-3f7401ff0fdd',
            'content-type': 'application/x-www-form-urlencoded',
            'x-hub-signature': 'sha1=08538596a3b7981f3eb42b41364efa501INVALID',
            'content-length': '7736',
          };

          $.webhook = new GithubWebhook({
            secret: $.secret,
            data: $.data,
            headers: $.headers,
          });
        });

        it('returns false', () => {
          expect($.webhook.valid()).toEqual(false);
        });
      });

      describe('with an invalid secret', () => {
        beforeEach(() => {
          $.secret = 'ABCDEF-INVALID';

          $.webhook = new GithubWebhook({
            secret: $.secret,
            data: $.data,
            headers: $.headers,
          });
        });

        it('returns false', () => {
          expect($.webhook.valid()).toEqual(false);
        });
      });
    }));

  describe('with the merged pull request', () => {
    beforeEach(() => {
      $.data = 'payload=%7B%22action%22%3A%22closed%22%2C%22pull_request%22%3A%7B%22html_url%22%3A%22https%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest%2Fpull%2F5%22%2C%22state%22%3A%22closed%22%2C%22merged%22%3Atrue%2C%22title%22%3A%22Pull%20Request%20Title%22%2C%22merged_by%22%3A%7B%22login%22%3A%22taujenis%22%7D%2C%22base%22%3A%7B%22ref%22%3A%22branch_name%22%7D%7D%2C%22repository%22%3A%7B%22full_name%22%3A%22taujenis%2Ftest%22%7D%7D';
      $.webhook = new GithubWebhook({ data: $.data });
    });

    describe('#mergedPullRequest', () => {
      it('returns true', () => {
        expect($.webhook.mergedPullRequest()).toEqual(true);
      });
    });

    describe('#publishedRelease', () => {
      it('returns false', () => {
        expect($.webhook.publishedRelease()).toEqual(false);
      });
    });

    describe('#user', () => {
      it('returns the github merge author', () => {
        expect($.webhook.user).toEqual('taujenis');
      });
    });

    describe('#repoOwner', () => {
      it('returns the github repository owner', () => {
        expect($.webhook.repoOwner).toEqual('taujenis');
      });
    });

    describe('#repoName', () => {
      it('returns the github repository name', () => {
        expect($.webhook.repoName).toEqual('test');
      });
    });

    describe('#branch', () => {
      it('returns the github branch name', () => {
        expect($.webhook.branch).toEqual('branch_name');
      });
    });

    describe('#url', () => {
      it('returns the github pull request url', () => {
        expect($.webhook.url).toEqual('https://github.com/taujenis/test/pull/5');
      });
    });

    describe('#title', () => {
      it('retuns the github pull request title', () => {
        expect($.webhook.title).toEqual('Pull Request Title');
      });

      describe('when the title is longer than 60 characters', () => {
        beforeEach(() => {
          $.data = 'payload=%7B%22action%22%3A%22closed%22%2C%22pull_request%22%3A%7B%22state%22%3A%22closed%22%2C%22merged%22%3Atrue%2C%22title%22%3A%22This%20is%20a%20very%20long%20description%20for%20the%20Github%20Pull%20Request%20that%20should%20be%20truncated.%22%7D%7D';
          $.webhook = new GithubWebhook({ data: $.data });
        });

        it('truncates the title', () => {
          expect($.webhook.title).toEqual('This is a very long description for the Github Pull Request…');
        });
      });
    });
  });

  describe('with the published release', () => {
    beforeEach(() => {
      $.data = 'payload=%7B%20%22action%22%3A%20%22published%22%2C%20%22release%22%3A%20%7B%22html_url%22%3A%20%22https%3A%2F%2Fgithub.com%2Ftaujenis%2Ftest%2Freleases%2Ftag%2F1.2.3%22%2C%20%22tag_name%22%3A%20%221.2.3%22%2C%20%22author%22%3A%20%7B%22login%22%3A%20%22taujenis%22%7D%7D%2C%20%22repository%22%3A%20%7B%20%22full_name%22%3A%20%22taujenis%2Ftest%22%7D%20%7D';
      $.webhook = new GithubWebhook({ data: $.data });
    });

    describe('#publishedRelease', () => {
      it('returns true', () => {
        expect($.webhook.publishedRelease()).toEqual(true);
      });
    });

    describe('#mergedPullRequest', () => {
      it('returns false', () => {
        expect($.webhook.mergedPullRequest()).toEqual(false);
      });
    });

    describe('#user', () => {
      it('returns the github release author', () => {
        expect($.webhook.user).toEqual('taujenis');
      });
    });

    describe('#repoOwner', () => {
      it('returns the github repository owner', () => {
        expect($.webhook.repoOwner).toEqual('taujenis');
      });
    });

    describe('#repoName', () => {
      it('returns the github repository name', () => {
        expect($.webhook.repoName).toEqual('test');
      });
    });

    describe('#url', () => {
      it('returns the github release url', () => {
        expect($.webhook.url).toEqual('https://github.com/taujenis/test/releases/tag/1.2.3');
      });
    });

    describe('#title', () => {
      it('returns undefined', () => {
        expect($.webhook.title).toEqual(undefined);
      });
    });
  });
});
