// const noEnv = (err) => throw new Error(err);

const args = process.argv.slice(2);
const getArg = (name) => {
	const candidates = args.filter((a) => a.startsWith("--" + name + "="));
	if (candidates.length === 0) {
		return null;
	}
	else if (candidates.length > 1) {
		throw new Error(`Argument --${name}= is passed multiple times`);
	}
	else {
		return candidates[0].substring(`--${name}=`.length);
	}
};

const PR_NUMBER = (
	getArg('pr-number') || process.env.PR_NUMBER || ''
)
  .split(',')
  .filter(v => !!v)
  .map(v => parseInt(v, 10));

const PR_STATE = (
	getArg('pr-state') || process.env.PR_STATE || 'open'
);

const GITHUB_PASS = getArg('github-pass') || process.env.GITHUB_PASS || '';
const GITHUB_USER = getArg('github-user') || process.env.GITHUB_USER || '';

const GITHUB_REPO = getArg('github-repo') || process.env.GITHUB_REPO || '';
const REVIEWER_FOLDER = getArg('reviewer-folder') ||process.env.REVIEWER_FOLDER || '';
const DRY_RUN = !!(getArg('dry-run') || getArg('dryrun') || process.env.DRY_RUN || process.env.DRYRUN || '');

if (!GITHUB_PASS || !GITHUB_USER) {
	throw new Error("Missing REVIEWER_GITHUB_USER/REVIEWER_GITHUB_PASS env");
}

if (!GITHUB_REPO) {
	throw new Error("Missing GITHUB_REPO env, dont know which github.com repo to hit");
}

if (!REVIEWER_FOLDER) {
	throw new Error("Missing REVIEWER_FOLDER env, dont know local reviewer files to use");
}

if (!['open', 'closed', 'all'].includes(PR_STATE)) {
	throw new Error("Invalid --pr-state or ENV PR_STATE : should be 'open', 'closed' or 'all'");
}

module.exports = {
	PR_NUMBER,
	PR_STATE,
	DRY_RUN,
	GITHUB_REPO,
	GITHUB_PASS,
	GITHUB_USER,
	REVIEWER_FOLDER,
};
