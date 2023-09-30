module.exports = class PullRequest {
	constructor(prData) {
		// Raw data
		this.pr = prData;
		
		// Resolvers
		// Functions that will be added later
		// for every specific PR
		this.resolveBaseBranch = null;
		this.resolveChecks = null;
		this.resolveChecksPage = 1;
		this.resolveComments = null;
		this.resolveCommentsPage = 1;
		this.resolveCommits = null;
		this.resolveCommitsPage = 1;
		this.resolveFiles = null;
		this.resolveFilesPage = 1;
		this.resolvePatch = null;
		this.resolveReviews = null;
		this.resolveReviewsPage = 1;
		this.resolveStatus = null;

		// Placeholders
		this.base_branch = null;
		this.checks = null;
		this.comments = null;
		this.commits = null;
		this.files = null;
		this.diff = null;
		this.reviews = null;
		this.status = null;

		// Parse the PR info to get age information,
		// a useful decider when reviewing PRs
		const ageMilli =
			new Date().getTime() - new Date(prData.created_at).getTime();
		this.age = {
			millis: ageMilli,
			hours: ageMilli / (1000 * 60 * 60),
			days: ageMilli / (1000 * 60 * 60 * 24),
		};
	}

	/**
	 * When the PR is behind from its target and not all commits
	 * are included, this function will return true
	 * 
	 * @returns {Boolean} Returns true if behind, false if not
	 */
	async behindOnBase() {
		await this.resolveBaseBranch();
		await this.resolveCommits();

		const baseSha = this.base_branch.commit.sha;
		
		const latestBaseCommitInCommitsOrParents = this.commits.some((c) => {
			return c.sha === baseSha
				|| c.parents.some(p => p.sha === baseSha)
		});
		
		return !latestBaseCommitInCommitsOrParents;
	}

	async statusAndChecksOkay() {
		await this.resolveStatus();

		if (this.status.state !== 'success') {
			return `Status not okay: ${this.status.state}`;
		}

		while (await this.resolveChecks()) {
		}

		const firstBad = this.checks.find(c =>  c.conclusion !== 'success');

		if (firstBad) {
			return `Github check not okay: ${firstBad.name} = ${firstBad.conclusion} ${firstBad.html_url}`;
		}

		return null;
	}
}
