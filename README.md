# Github PR Reviewer

> Why do a 10 minute task, when you can automate it in 10 days?
>
> — a programmer

A `nodejs` based Github PR Reviewer which can be easily turned into a bot. This works on a GitHub repo, by finding (open) PR's
and taking actions on them.

Github PR Reviewer makes it very easy to interact with pull requests, allowing you to focus fully on automating checks. Every PR will be passing through your own rule-set, and where needed, the actions you define will be executed for each PR.

## Installation

```sh
wget https://github.com/nho-sh/github-pr-reviewer/archive/refs/heads/main.zip -O github-pr-reviewer.zip ; \
unzip github-pr-reviewer.zip ; \
cd github-pr-reviewer-main/
```

## Running

It assumes that you have ENV variables:

| ENV Variable | Description |
| --- | --- |
| `GITHUB_USER` | Your (bot) github username |
| `GITHUB_PASS` | Your (bot) password. Use a Github Personal Access Token |
| `GITHUB_REPO` | The name of the repo to review, in the form of `<account>/<repo>` |
| `REVIEWER_FOLDER` | Local folder with `*.reviewer.js` files adhering to the definition |
| `DRY_RUN` (or `DRYRUN`) | If set to `true`, the PR's will not receive any real updates (handy for debugging). This means GH will be contacted and PR details will be fetched, but when it's time to update PR's, nothing really happens, and we just print out what should happen. |
| `MOCK` (for development) | This is to mock GH api calls during development and speeding up testing cycles. You probably don't want to use this. |

For example, the follow command will run all reviewer files in the folder `my-reviewers`.

```sh
GITHUB_PASS=ghp_... \
GITHUB_USER=nho-sh \
GITHUB_REPO=nho-sh/github-pr-reviewer \
REVIEWER_FOLDER=~/my-github-reviewers/ \
node index.js
```

### Arguments

| Argument | Docs |
| -------- | ---- |
| `--pr-number=123,500` <br>(Optional) | PR number or numbers \(comma seperated\)<br> Alternatively, you can pass it via ENV `PR_NUMBER`. |
| `--pr-state=open` <br>(Optional) | State of the PRs, can be 'open', 'closed' or 'all'. Default: 'open'<br>  Alternatively, you can pass it via ENV `PR_NUMBER`. |

## Implementing a PR reviewer

A reviewer is a collection of Javascript files inside a folder. It's recommended to make a folder per project or repository you plan to review.

### Defining a reviewer

1. Create a file with the following naming:
   `<your-reviewer-name>.reviewer.js`
2. Implement the template according to your needs. If you want to leverage existing packages, other files, etc, just require them as you would with any other .js file.

```js
module.exports = {
  filter: async (pr) => {
    // optionally fetch more PR details (increases api calls to GH)
    // (see Resolving additional PR details)

    // if this reviewer applies
    return true; 

    // OR
    
    // Log out a reason why this reviewer does not apply
    return 'A string with the reason why not';
  },
  review: async (pr) => {
    // optionally fetch more PR details (increases api calls to GH)
    // (see Resolving additional PR details)

    // an array of actions that have to be taken
    // (see Take actions on PR's)
    return [ ... actions ... ]; 
    
    // OR

    // an empty array if no action is needed
    return []; 
  }
}
```

### Take actions on PR's

Actions are taken by returning one or more action definitions from the `review(pr) { ... }`
function. If conflicting actions need to be taken on a PR, a error will occur and the PR
is skipped.

| Action | Spec | Docs |
| -------- | ---- | ---- |
| Approving | `{ action: 'approve' }` | The user running the reviewer will approve the PR |
| Closing | `{ action: 'close' }` | The user running the reviewer will close the PR |
| Adding a comment | `{ action: 'comment', comment: '...' }` | A message will be added to the PR (not to the files). |
| Labeling a PR | `{ action: 'label', labels: [ 'A', 'B' ] }` | Add one or more labels to the PR. Non-existing labels will automatically be created by Github |
| Unlabeling a PR | `{ action: 'unlabel', label: 'A'}` | Remove a single label from a PR. Note that you cannot use an array for this action. |
| Merge a PR | `{ action: 'merge', method?: 'merge\|squash\|rebase' }` | The user will attempt to merge (which might fail if some repo requirements are not met). Use the `method` value to choose the merge strategy, or omit for the default `merge`. |
| Request changes | `{ action: 'request-changes', changes: '... please do so and so ...' }` | Request changes to be made. Use the description field to summarize what is wrong. |
| Review by adding a comment | `{ action: 'review-comment', comment: 'Please ...', path: 'relative path of the file to change', line: 1}` | This will begin or continue a review of a PR and will expect it to be Resolved. Use the required `path` + `line` to specify where the problem originates. |
| Update branch | `{ action: 'update-branch' }` | Update your pull request with all the changes from the base branch, by merging it in. This is best used with `await pr.behindOnBase()` to avoid updating the PR branch with empty commits.  |

### Avoiding repeated reviewing

Note about avoiding the same actions: Github PR Reviewer does NOT keep any state on previously taken actions.
It's up to you to implement persistence, if desired, into the `*.reviewer.js` files.

However, a simple state can also be kept on the PR itself, by first retrieving information from the PR,
and checking if a previous action is taken. For example, by add a comment with
a magic word in it, and later, skipping PR's with that expected magic word in a comment (use `resolveComments`). This has the drawback that changes do not invalidate previous reviews, but works fine for simple cases.

### Resolving additional PR details

When Github is contacted for PR information, the default behaviour is to return some basic set of data on every PR.
To avoid API limits, and speed up the reviewing, resolving additional data is opt-in.

<table>
<tr>
  <th>Resolver</th>
  <th>Spec</th>
  <th>Description</th>
</tr>
<tr>
  <td>Base Branch</td>
  <td><code>await pr.resolveBaseBranch()</code></td>
  <td>This will populate the PR data <code>pr.base_branch</code>, which is a object describing the Github the branch you provide. For full specification, check the Github specification at https://docs.github.com/en/rest/branches/branches#get-a-branch.</td>
</tr>
<tr>
  <td>Checks</td>
  <td><code>await pr.resolveChecks()</code></td>
  <td>This will populate the PR data <code>pr.checks</code>, which is an array of Github checks on the last commit sha of the PR branch. For full specification, check the Github check run specification at https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#list-check-runs-for-a-git-reference.<br />If it returns <code>true</code>, it can be called again to fetch another page, <code>false</code> means the end was reached.</td>
</tr>
<tr>
  <td>Commits</td>
  <td><code>await pr.resolveCommits()</code></td>
  <td>This will populate the PR data <code>pr.commits</code>, which is an array of Github commits on the branch. For full specification, check the Github commit specification at https://docs.github.com/en/rest/issues/comments#get-an-issue-comment.<br />If it returns <code>true</code>, it can be called again to fetch another page, <code>false</code> means the end was reached.</td>
</tr>
<tr>
  <td>Comments</td>
  <td><code>await pr.resolveComments()</code></td>
  <td>This will populate the PR data <code>pr.comments</code>, which is an array of Github comment objects. For full specification, check the Github comment specification at https://docs.github.com/en/rest/pulls/pulls#list-commits-on-a-pull-request.<br />If it returns <code>true</code>, it can be called again to fetch another page, <code>false</code> means the end was reached.</td>
</tr>
<tr>
  <td>Files</td>
  <td><code>await pr.resolveFiles()</code></td>
  <td>This will populate the PR data <code>pr.files</code>, which is a array of relative file paths (strings).<br />If it returns <code>true</code>, it can be called again to fetch another page, <code>false</code> means the end was reached.</td>
</tr>
<tr>
  <td>Patch / Diff</td>
  <td><code>await pr.resolvePatch()</code></td>
  <td>

This will populate the PR data <code>pr.patch</code>, which contains both the original git-diff content, but also a parsed version for easier investigation.

```js
{
  raw: 'From d3c...46c Mon Sep 17 00:00:00 2001...',
  header: 'parsed patch header',
  diffs: [
    {
      sourceFile: 'package.json', // Empty string if it's a new file
      targetFile: 'package.json-backup', // Empty string if it's a deleted file
      hunks: [
        {
          linesAdded: 1,
          linesRemoved: 1,
          lineChanges: 2,
          rawChanges: '...',
          addedLines: [ '  "main": "index.js"' ],
          removedLines: [ '  "main": "entry.js"' ]
        }
      ]
    }
  ]
}
```

  </td>
</tr>
<tr>
  <td>Reviews</td>
  <td><code>await pr.resolveReviews()</code></td>
  <td>This will populate the PR data <code>pr.reviews</code>, which is an array of objects.<br />If it returns <code>true</code>, it can be called again to fetch another page, <code>false</code> means the end was reached.</td>
</tr>
<tr>
  <td>Status</td>
  <td><code>await pr.resolveStatus()</code></td>
  <td>This will populate the PR data <code>pr.status</code>, which is an object. For full specification, check the Github commit status specification at https://docs.github.com/en/rest/commits/statuses#get-the-combined-status-for-a-specific-reference</td>
</tr>
</table>

### Extra helpers available on PRs

These methods are available during reviewer execution:

<table>
<tr>
  <th>Method</th>
  <th>Description</th>
</tr>
<tr>
  <td><code>await pr.behindOnBase()</code></td>
  <td>Returns <code>true</code> if the PR is not fully up-to-date with the base branch. This combines well with the <code>update-branch</code> action, which by default in GH, will always update, creating empty merge commits. Use this method to detect if something is really not included yet.</td>
</tr>
<tr>
  <td><code>await pr.statusAndChecksOkay()</code></td>
  <td>Returns <code>null</code> if the PR is checks and statuses are all succesful. If something is failing or not yet finished, this function returns a string summary of the first found issue. (this internally calls `resolveStatus` and `resolveChecks`.</td>
</tr>
</table>

### Testing your reviewer before putting it live

No integration tests exist atm, but set the `DRY_RUN`/`DRYRUN` ENV variable on real
repositories to safely try out your reviewers. It will summarize what would happen,
without actually performing the action.

```sh
DRY_RUN=true \
... \
node index.js
```

alternatively, pass `--dryrun=true` or `--dry-run=true`