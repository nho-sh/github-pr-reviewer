#!/usr/bin/env node

if (process.env.MOCK) {
	console.warn("MOCK enabled, no network calls at all");
}

// Fetch the ENV variables after checking them
const {
	PR_NUMBER,
	DRY_RUN,
	GITHUB_REPO,
	GITHUB_PASS,
	GITHUB_USER,
	REVIEWER_FOLDER
} = require('./check-env.js');

if (DRY_RUN) {
	console.warn("DRY_RUN enabled, will not affect PRs");
}

const { review, loadReviewers } = require('./review-runner');

const {
	approvePR,
	closePR,
	commentPR,
	labelPR,
	listOpenPRs,
	mergePR,
	requestChanges,
	reviewCommentPR,
	unlabelPR,
	updateBranch,
} = require("./gh-client.js");

const algo = async () => {
	
	const ghAuth = {
		repo: GITHUB_REPO, user: GITHUB_USER, pass: GITHUB_PASS
	};

	// See if the limit of open PRs is reached
	const prs = await listOpenPRs(ghAuth);
	if (prs.length === 0) {
		console.warn(`Skipping run, nothing to review (PR list is empty)`);
		return;
	}
	else {
		console.log(`Found ${prs.length} open PRs to review`);
	}
	if (PR_NUMBER.length) {
		console.log(`But will only check PRs:`, PR_NUMBER);
	}
	
	const reviewers = loadReviewers(REVIEWER_FOLDER);
	console.log(`With ${reviewers.length} reviewer(s)\n -`, reviewers.map(r => r.name).join('\n - '));
	
	for (const pr of prs) {
		const prNum = pr.pr.number;
		
		// Want to check just 1 PR with --pr-number= or PR_NUMBER= ?
		if (PR_NUMBER.length && !PR_NUMBER.includes(prNum)) {
			continue;
		}
		
		console.log(`\nChecking PR ${prNum}`);

		try {
			let allActions = [];
			let reasonsWhyNot = [];
			
			for (const reviewer of reviewers) {
				const newActions = await review({ reviewer, pr });
				if (typeof newActions === 'string') {
					reasonsWhyNot.push(reviewer.name + ": " + newActions);
				}
				else {
					allActions = [...allActions, ...newActions];
				}
			}
			
			if (allActions.length === 0 && reasonsWhyNot.length > 0) {
				// Print out a summary why the PR was not getting any actions
				console.log(' No action, because...');
				console.log(' - ' + reasonsWhyNot.join('\n - '));
			}

			// Scan the resulting actions for processing
			const addLabels = allActions.filter(a => a.action === 'label');
			const removeLabels = allActions.filter(a => a.action === 'unlabel').map(l => l.label);
			const comments = allActions.filter(a => a.action === 'comment');
			const approve = allActions.find(a => a.action === 'approve');
			const changesRequested = allActions.filter((a) => a.action === "request-changes");
			const reviewComments = allActions.filter((a) => a.action === "review-comment");
			const merge = allActions.find(a => a.action === 'merge');
			const close = allActions.find(a => a.action === 'close');
			const shouldUpdateBranch = allActions.find(a => a.action === 'update-branch');
			
			// Group all the labels we want to add
			const allAddLabels = addLabels.map(l => l.labels).flat();
			
			// TODO: detect unknown actions
			
			// Detect conflicting labels,
			// that need to be added while deleted at the same time
			const uniqueLabels = new Set([...allAddLabels, ...removeLabels]);
			if (uniqueLabels.size != allAddLabels.length + removeLabels.length)
				throw new Error(
					"Asked to add labels, while also asked to remove them: "
					+ JSON.stringify(allAddLabels) + " vs " + JSON.stringify(removeLabels)
				);
			
			if (allAddLabels.length) {
				console.log(` - adding labels: ` + allAddLabels);
				// merge all labels
				DRY_RUN || await labelPR(ghAuth, {
					prNumber: prNum,
					labels: allAddLabels
				});
			}
			
			for (const label of removeLabels) {
				console.log(` - removing label: ` + label);
				DRY_RUN || await unlabelPR(ghAuth, { prNumber: prNum, label: label });
			}
			
			if (comments.length) {
				const fullBody = comments.map(c => c.comment).join('\n- - -\n');
				console.log(` - adding comment:`, fullBody);
				DRY_RUN || await commentPR(ghAuth, { prNumber: prNum, body: fullBody });
			}
			
			for (const rc of reviewComments) {
				console.log(` - reviewing with a comment:`, rc.comment, `\n   path:`, rc.path, `Ln:`, rc.line);
				DRY_RUN ||
					(await reviewCommentPR(ghAuth, {
						prNumber: prNum,
						commit_id: pr.pr.commit_id,
						body: rc.comment,
						path: rc.path,
						line: rc.line,
					}));
			}
			
			for (const change of changesRequested) {
				console.log(` - requesting changes:`, change.changes);
				DRY_RUN ||
					(await requestChanges(ghAuth, { prNumber: prNum, body: change.changes }));
			}
			
			if (shouldUpdateBranch) {
				console.log(` - updating branch with base`);
				DRY_RUN || await updateBranch(ghAuth, { prNumber: prNum });
			}
			
			if (approve) {
				console.log(` - approving`);
				DRY_RUN || await approvePR(ghAuth, { prNumber: prNum });
			}
			
			if (merge && close) {
				throw new Error("conflicting reviews: both want approve and close");
			}
			else if (merge) {
				console.log(` - merging`);
				DRY_RUN || await mergePR(ghAuth, { prNumber: prNum });
			}
			else if (close) {
				console.log(` - closing, do not want`);
				DRY_RUN || await closePR(ghAuth, { prNumber: prNum });
			}
		}
		catch (err) {
			console.log(` - Wrapping up PR ${prNum} after error`, err.stack);
		}
	}
};

module.exports = {
	algo: algo
};
