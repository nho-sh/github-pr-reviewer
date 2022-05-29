module.exports = class PullRequest {
	constructor(prData) {
		// Raw data
		this.pr = prData;
		
		// Functions that will be added later
		// for every specific PR
		this.resolvePatch = null;
		this.resolveFiles = null;
		this.resolveReviews = null;
		this.resolveStatus = null;

		// Placeholders
		this.comments = null;
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
}
