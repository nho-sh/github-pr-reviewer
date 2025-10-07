module.exports = {
	filter: async (pr) => {
		if (pr.age.hours < pr.age.days) {
			// noop, never the case, just testing
			return 'This reason will never be visible';
		}
		
		if (pr.pr.number % 2 === 0) {
			return true; // yes, even PRs get a random review
		}
		else {
			return 'Nah, this code doesnt like uneven PRs'
		}
	},
	review: async (pr) => {
		// await pr.resolvePatch();
		// await pr.resolveReviews();
		// console.log(pr.reviews);
		
		await pr.resolveStatus();
		await pr.resolveReviews();
		await pr.resolveFiles();
		// console.log(pr.status);
		
		const allActions = [
			{ action: 'approve' },
			{ action: 'close' },
			{ action: 'comment', comment: 'I like this' },
			{ action: 'label', labels: ['A', 'B'] },
			{ action: 'unlabel', label: 'A'},
			{ action: 'create-status', sha: 'abc...', context: 'My custom status', status: 'pending', description: 'Waiting for results to be added', targetUrl: 'https://my-server' },
			{ action: 'request-changes', changes: 'This looks fuky'},
			{ action: 'review-comment', comment: 'Better change this, i mean, come-on!', path: pr.files[0], line: 1},
			{ action: 'after-review', handler: async (pr) => {
				console.log(`I have a pr? ${!!pr}`);
			}},
		];

		return [allActions[Math.floor(Math.random() * allActions.length)]];
	}
}
