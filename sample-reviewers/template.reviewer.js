module.exports = {
	filter: async (pr) => {
		// can also resolve here
		return true;
	},
	review: async (pr) => {
		// await pr.resolvePatch();
		// await pr.resolveReviews();
		// await pr.resolveStatus();
		// await pr.resolveReviews();
		
		// return [{ action: 'approve' }];
		// return [{ action: 'close' }];
		// return [{ action: 'comment', comment: 'I like this' }];
		// return [{ action: 'label', labels: ['A', 'B'] }];
		// return [{ action: 'unlabel', label: 'A'}];
		
		return []; // do nothing
	}
}
