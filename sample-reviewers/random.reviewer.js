module.exports = {
	filter: async (pr) => {
		if (pr.age.hours < pr.age.days) {
			// noop, never the case, just testing
			return false;
		}
		
		return pr.pr.number % 2 === 0; // even PRs
	},
	review: async (pr) => {
		// await pr.resolvePatch();
		// await pr.resolveReviews();
		// console.log(pr.reviews);
		
		await pr.resolveStatus();
		await pr.resolveReviews();
		// console.log(pr.status);
		
		const allActions = [
			[{ action: 'approve' }],
			[{ action: 'close' }],
			[{ action: 'comment', comment: 'I like this' }],
			[{ action: 'label', labels: ['A', 'B'] }],
			[{ action: 'unlabel', label: 'A'}],
			[{ action: 'request-changes', changes: 'This looks fuky'}],
		];
		return allActions[Math.floor(Math.random() * allActions.length)];
	}
}
