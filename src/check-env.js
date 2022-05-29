// const noEnv = (err) => throw new Error(err);

const GITHUB_PASS = process.env.GITHUB_PASS || '';
const GITHUB_USER = process.env.GITHUB_USER || '';

const GITHUB_REPO = process.env.GITHUB_REPO || '';
const REVIEWER_FOLDER = process.env.REVIEWER_FOLDER || '';
const DRY_RUN = !!(process.env.DRY_RUN || process.env.DRYRUN || '');

if (!GITHUB_PASS || !GITHUB_USER) {
	throw new Error("Missing REVIEWER_GITHUB_USER/REVIEWER_GITHUB_PASS env");
}

if (!GITHUB_REPO) {
	throw new Error("Missing GITHUB_REPO env, dont know which github.com repo to hit");
}

if (!REVIEWER_FOLDER) {
	throw new Error("Missing REVIEWER_FOLDER env, dont know local reviewer files to use");
}

module.exports = {
	DRY_RUN,
	GITHUB_REPO,
	GITHUB_PASS,
	GITHUB_USER,
	REVIEWER_FOLDER,
};
