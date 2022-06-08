const path = require('path');
const fs = require("fs");
const { memoize } = require("./utils.js");

const findReviewerFiles = memoize((folder) => {
	const files = fs
		.readdirSync(folder)
		.filter((f) => f.endsWith(".reviewer.js"));
	return files;
});

const loadReviewer = (folder, file) => {
	// Require outside this repo,
	// into the specified folder
	const reviewer = require(path.join(process.cwd(), folder, file));

	// generator some fields if not specified
	reviewer.name = reviewer.name || file;
	reviewer.path = reviewer.path || folder + file;
	reviewer.filter = reviewer.filter || (() => true); // default all prs
	reviewer.review =
		reviewer.review ||
		((pr) => {
			console.warn("Reviewer does nothing: " + reviewer.path);
			return [];
		});

	return reviewer;
};

const loadReviewers = memoize((folder) => {
	const files = findReviewerFiles(folder);
	return files.map((f) => loadReviewer(folder, f));
});

const review = async ({ reviewer, pr }) => {
	const okayOrReason = await reviewer.filter(pr);
	if (okayOrReason !== true) {
		return okayOrReason || 'n/a'; // nothing desired
	}

	try {
		return await reviewer.review(pr);
	} catch (err) {
		console.warn(
			`Reviewer ${reviewer.name} failed on ${pr.pr.number} with error: ${err.stack}`
		);
		if (process.env.DEBUG) {
			throw err;
		}

		return [];
	}
};

module.exports = {
	loadReviewers,
	review,
};
