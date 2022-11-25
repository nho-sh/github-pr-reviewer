module.exports = class PullRequest {
	constructor(prData) {
		// Raw data
		this.pr = prData;
		
		// Resolvers
		// Functions that will be added later
		// for every specific PR
		this.resolveBaseBranch = null;
		this.resolveComments = null;
		this.resolveCommits = null;
		this.resolveFiles = null;
		this.resolvePatch = null;
		this.resolveReviews = null;
		this.resolveStatus = null;

		// Placeholders
		this.base_branch = null;
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
}
