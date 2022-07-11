const { apiMethod, getJson, deleteJson, postJson, patchJson, putJson } = require('./utils.js');
const PullRequest = require('./pull-request');
const patchParser = require('./patch-parser');

const ghHeaders = (user, pass) => {
	const basicAuth = Buffer.from(`${user}:${pass}`).toString('base64');

	return {
		authorization: `Basic ${basicAuth}`,
		"user-agent": "curl/7.68.0"
	};
}

const processGhResponse = (response) => {
	if (response.message) {
		console.log(response.message);
	}

	if (response.errors) {
		console.log('Error:\n' + response.errors.join('\n'));
	}
};

const fetchPrFiles = async ({ repo, user, pass }, prID) => {
	
	const headers = ghHeaders(user, pass);
	
	const pr = await getJson(
		`https://api.github.com/repos/${repo}/pulls/${prID}/files`,
		{
			headers: headers
		}
	);
	processGhResponse(pr);

	return pr.map(f => f.filename);
};

const fetchPrPatch = async ({ repo, user, pass }, prID) => {

	// SPEC http://git-scm.com/docs/git-format-patch
	//      https://git-scm.com/docs/diff-format
	//      http://git-scm.com/docs/git-diff
	//      https://www.gnu.org/software/diffutils/manual/html_node/Detailed-Unified.html#Detailed%20Unified
	//      https://stackoverflow.com/questions/2529441/how-to-read-the-output-from-git-diff
	const headers = ghHeaders(user, pass);
	headers['Accept'] = 'application/vnd.github.v3.patch';

	const prDiff = await apiMethod(
		'GET',
		`https://api.github.com/repos/${repo}/pulls/${prID}`,
		headers,
		null,
		false
	);

	return prDiff;
};

const fetchPrReviews = async ({ repo, user, pass }, prID) => {

	const headers = ghHeaders(user, pass);
	headers['Accept'] = 'application/vnd.github.v3+json';

	const prReviews = await apiMethod(
		'GET',
		`https://api.github.com/repos/${repo}/pulls/${prID}/reviews`,
		headers,
		null,
		true
	);

	return prReviews;
};

const fetchComments = async ({ repo, user, pass }, prID) => {
	const headers = ghHeaders(user, pass);
	headers["Accept"] = "application/vnd.github.v3+json";

	const prReviews = await apiMethod(
		"GET",
		`https://api.github.com/repos/${repo}/issues/${prID}/comments`,
		headers,
		null,
		true
	);

	return prReviews;
};


const fetchPrStatus = async ({ repo, user, pass }, commitID) => {

	const headers = ghHeaders(user, pass);
	headers['Accept'] = 'application/vnd.github.v3+json';

	const prDiff = await apiMethod(
		'GET',
		`https://api.github.com/repos/${repo}/commits/${commitID}/status`,
		headers,
		null,
		true
	);

	return prDiff;
};

const listOpenPRs = async ({ repo, user, pass }) => {
	
	if (process.env.MOCK) {
		return [];
	}
	
	const prs = await getJson(`https://api.github.com/repos/${repo}/pulls`, {
		headers: ghHeaders(user, pass)
	});
	processGhResponse(prs);
	
	const resultPrs = [];
	for (const pr of prs) {
		// console.log(pr);
		const prObj = new PullRequest({
			id: pr.id,
			url: pr.url,
			number: pr.number,
			title: pr.title,
			body: pr.body,
			labels: pr.labels,
			state: pr.state,
			locket: pr.locked,
			head: pr.head,
			created_at: pr.created_at, // ISO timestamp, like 2022-04-20T21:25:48Z
			updated_at: pr.updated_at, // ISO timestamp, like 2022-04-20T21:25:48Z
			draft: pr.draft,
			user: {
				login: pr.user.login
			},
			commit_id: pr.head.sha
		});
		
		prObj.resolveComments = async () => {
			prObj.comments = await fetchComments({ repo, user, pass }, prObj.pr.number);
			prObj.resolveComments = function() {};
		};
		prObj.resolveFiles = async () => {
			prObj.files = await fetchPrFiles({ repo, user, pass }, prObj.pr.number);
			prObj.resolveFiles = function() {};
		};
		prObj.resolvePatch = async () => {
			const patch = await fetchPrPatch({ repo, user, pass }, prObj.pr.number);
			prObj.patch = patchParser(patch);
			prObj.resolvePatch = function () { };
		};
		prObj.resolveReviews = async () => {
			prObj.reviews = await fetchPrReviews({ repo, user, pass }, prObj.pr.number);
			prObj.resolveReviews = function () { };
		};
		prObj.resolveStatus = async () => {
			prObj.status = await fetchPrStatus({ repo, user, pass }, prObj.pr.commit_id);
			prObj.resolveStatus = function () { };
		};
		
		resultPrs.push(prObj);
	}
	
	return resultPrs;
};

const approvePR = async ({ repo, user, pass }, {
	prNumber,
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const reqData = {
		event: "APPROVE"
	};
	
	const response = await postJson(
		`https://api.github.com/repos/${repo}/pulls/${prNumber}`,
		reqData,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

const commentPR = async ({ repo, user, pass }, {
	prNumber,
	body
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const reqData = {
		body: body
	};

	const response = await postJson(
		`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`,
		reqData,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

const requestChanges = async ({ repo, user, pass }, {
	prNumber,
	body
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const reqData = {
		event: 'REQUEST_CHANGES',
		body: body,
		comment: []
	};

	const response = await postJson(
		`https://api.github.com/repos/${repo}/pulls/${prNumber}/reviews`,
		reqData,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

const labelPR = async ({ repo, user, pass }, {
	prNumber,
	labels
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const reqData = {
		labels: labels
	};

	const response = await postJson(
		`https://api.github.com/repos/${repo}/issues/${prNumber}/labels`,
		reqData,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

const unlabelPR = async ({ repo, user, pass }, {
	prNumber,
	label
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const response = await deleteJson(
		`https://api.github.com/repos/${repo}/issues/${prNumber}/labels/${label}`,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

const mergePR = async ({ repo, user, pass }, {
	prNumber
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const response = await putJson(
		`https://api.github.com/repos/${repo}/pulls/${prNumber}/merge`,
		{},
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

const closePR = async ({ repo, user, pass }, {
	prNumber
}) => {
	if (process.env.MOCK) {
		return true;
	}
	const reqData = {
		state: 'closed'
	};
	
	const response = await patchJson(
		`https://api.github.com/repos/${repo}/issues/${prNumber}`,
		reqData,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

module.exports = {
	commentPR,
	labelPR,
	unlabelPR,
	listOpenPRs,
	fetchPrPatch,
	fetchComments,
	mergePR,
	closePR,
	approvePR,
	requestChanges,
};
