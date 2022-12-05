module.exports = {
	filter: async (pr) => {
		console.log(pr);
		
		// can also resolve here
		return true;
	},
	review: async (pr) => {
		console.log(pr);

		// await pr.resolveComments();
		// await pr.resolveFiles();
		// await pr.resolvePatch();
		// await pr.resolveReviews();
		// await pr.resolveStatus();
		
		// return [{ action: 'approve' }];
		// return [{ action: 'close' }];
		// return [{ action: 'comment', comment: 'I like this' }];
		// return [{ action: 'label', labels: ['A', 'B'] }];
		// return [{ action: 'unlabel', label: 'A'}];
		
		return []; // do nothing
	}
}
