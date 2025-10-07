# Github PR Reviewer

> If you’re doing something more than twice, automate it.

A `nodejs` based Github PR Reviewer which can be easily turned into a bot. This works on a GitHub repo, by checking open PR's
and taking actions on them.

Github PR Reviewer makes it very easy to interact with pull requests, allowing you to focus fully on automating checks.
Every PR will be passing through your own rule-set, and where needed, the actions you define will be executed for each PR.

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
  },
};
```

### Resolving additional PR details

When Github is contacted for PR information, the default behaviour is to return basic PR data.
To avoid API limits, and speed up the reviewing, resolving additional data is opt-in.

<table>

<tr>
  <th>Resolver</th>
  <th>Description</th>
</tr>

<tr>
  <td>Standard fields</td>
  <td>These fields are available on every pull request.

```js
module.exports = {
  filter: async (pr) => {

    // contains the raw PR data from GitHub
    pr.pr = {
      base: {
        ref: 'main',
      },
      head: {
        ref: 'my-feature',
      },
      labels: [
        name: 'feature',
      ],
      user: {
        login: 'user-name',
      },
      updated_at: '2022-08-10T12:00:54Z',
    };
   
    // For convenience, the age of the PR is provided as numbers
    pr.age = {
      millis: 86400000,
      hours: 24.0
      days: 1.0,
    };
  },
  review: async (pr) => {
    return [
      // ... See below for actions
    ];
  },
};

```
  </td>
</tr>

<tr>
  <td>Base Branch</td>
  <td>

```js
await pr.resolveBaseBranch()
```

   This will populate the PR data <code>pr.base_branch</code>, which is a object describing the Github the branch you provide. For full specification, check the <a href="https://docs.github.com/en/rest/branches/branches#get-a-branch">Github specification</a>.
   </td>
</tr>

<tr>
  <td>Checks</td>
  <td>

```js
await pr.resolveChecks()
```

  This will populate the PR data <code>pr.checks</code>, which is an array of Github checks on the last commit sha of the PR branch. For full specification, check the <a href="https://docs.github.com/en/rest/checks/runs?apiVersion=2022-11-28#list-check-runs-for-a-git-reference">Github Check run specification</a>.<br />If it returns <code>true</code>, it can be called again to fetch another page, <code>false</code> means the end was reached.
  </td>
</tr>

<tr>
  <td>Commits</td>
  <td>

```js
await pr.resolveCommits()
```

  This will populate the PR data <code>pr.commits</code>, which is an array of Github commits on the branch. For full specification, check the <a href="https://docs.github.com/en/rest/issues/comments#get-an-issue-comment">Github commit specification</a>.<br />If it returns <code>true</code>, it can be called again to fetch another page, <code>false</code> means the end was reached.
  </td>
</tr>

<tr>
  <td>Comments</td>
  <td>

```js
await pr.resolveComments()
```

   This will populate the PR data <code>pr.comments</code>, which is an array of Github comment objects. For full specification, check the <a href="https://docs.github.com/en/rest/pulls/pulls#list-commits-on-a-pull-request">Github comment specification</a>.<br />If it returns <code>true</code>, it can be called again to fetch another page, <code>false</code> means the end was reached.

```js
pr.comments = [
  {
    // ...
    user: {
      login: 'user-name',
    },
    body: 'What user-name wrote',
      // ...
  }
];
```
  </td>
</tr>

<tr>
  <td>Files</td>
  <td>

```js
await pr.resolveFiles()
```

  This will populate the PR data <code>pr.files</code>, which is a array of relative file paths (strings).<br />If it returns <code>true</code>, it can be called again to fetch another page, <code>false</code> means the end was reached.

```js
pr.files = [
  'package.json',
  'package-lock.json'
];
```
  </td>
</tr>

<tr>
  <td>Diff</td>
  <td>

```js
await pr.resolveDiff();
```

  This will populate the PR data <code>pr.diff</code>, which contains both the original git-diff content as <code>raw</code>, but also a parsed version for easier investigation.

```js
pr.diff = {
  raw: 'From d3c...46c Mon Sep 17 00:00:00 2001...',
  header: 'parsed diff header',
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
};
```

  </td>
</tr>

<tr>
  <td>Patch</td>
  <td>

```js
await pr.resolvePatch();
```

  This will populate the PR data <code>pr.patch</code>, which contains both the original git-patch content as <code>raw</code>, but also a parsed version for easier investigation.

```js
pr.patch = {
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
};
```

  </td>
</tr>

<tr>
  <td>Reviews</td>
  <td>

```js
await pr.resolveReviews()
```

  This will populate the PR data <code>pr.reviews</code>, which is an array of objects.<br />If it returns <code>true</code>, it can be called again to fetch another page, <code>false</code> means the end was reached.

```js
pr.reviews = [
  {
    // ...
    user: {
      login: 'user-name',
    }
    state: 'APPROVED',
      // ...
  }
]
```
  </td>
</tr>

<tr>
  <td>Status</td>
  <td>

```js
await pr.resolveStatus()
```

  This will populate the PR data <code>pr.status</code>, which is an object. For full specification, check the <a href="https://docs.github.com/en/rest/commits/statuses#get-the-combined-status-for-a-specific-reference">Github commit status specification</a>.
  </td>
</tr>

</table>

### Take actions on PR's

Actions are taken by returning one or more action definitions from the `review(pr) { ... }`
function. If conflicting actions need to be taken on a PR, an error will occur and the PR
is skipped.

<table>
<tr>
  <th>Action</th>
  <th>Spec and docs</th>
</tr>

<tr>
  <td>Approving</td>
  <td>

```js
{
  action: 'approve'
}
```

The user running the reviewer will approve the PR
  </td>
</tr>

<tr>
  <td>Closing</td>
  <td>

```js
{
  action: 'close'
}
```

The user running the reviewer will close the PR
  </td>
</tr>

<tr>
  <td>Adding a comment</td>
  <td>

```js
{
  action: 'comment',
  comment: '...'
}
```

A message will be added to the PR (not to the files).
  </td>
</tr>

<tr>
  <td>Adding a label</td>
  <td>

```js
{
  action: 'label',
  labels: [ 'A', 'B' ]
}
```

Add one or more labels to the PR. Non-existing labels will automatically be created by Github
  </td>
</tr>

<tr>
  <td>Remove a label</td>
  <td>

```js
{
  action: 'unlabel',
  label: 'A'
}
```

Remove a single label from a PR. Note that you cannot use an array for this action.
   </td>
</tr>

<tr>
  <td>Create/update a status</td>
  <td>

```js
{
  action: 'create-status',
  sha: '<commit-sha>',
  description: '<optional further details>',
  context: '<context name>',
  targetUrl: '<optional link>',
  state: 'success|failure|pending|error'
}
```

Create or replace a status of a PR. Use this to block PRs from merging until your custom checks are satisfied. Note that previous statuses with the same context name will be overwritten.
   </td>
</tr>

<tr>
  <td>Merge a PR</td>
  <td>

```js
{
  action: 'merge',
  method: 'merge|squash|rebase'
}
```

The user will attempt to merge (which might fail if some repo requirements are not met). Use the <code>method</code> value to choose the merge strategy, or omit for the default <code>merge</code>.
   </td>
</tr>

<tr>
  <td>Request changes</td>
  <td>

```js
{
  action: 'request-changes',
  changes: '... please do so and so ...'
}
```

Request changes to be made. Use the description field to summarize what is wrong.
  </td>
</tr>

<tr>
  <td>Review by adding a comment</td>
  <td>

```js
{
  action: 'review-comment',
  comment: 'Please ...',
  path:
    'relative path of the file to change',
  line: 1
}
```

This will begin or continue a review of a PR and will expect it to be Resolved. Use the required <code>path</code> + <code>line</code> to specify where comment belongs.
  </td>
</tr>

<tr>
  <td>Update branch</td>
  <td>

```js
{
  action: 'update-branch'
}
```

Update your pull request with all the changes from the base branch, by merging it in. This is best used with <code>await pr.behindOnBase()</code> to avoid updating the PR branch with empty commits.
  </td>
</tr>

<tr><td></td><td></td></tr>

<tr>
  <td>After review handler</td>
  <td>

```js
{
  action: 'after-review',
  handler: async (pr, { actionsTaken }) => {
    /**/
  }
}
```

Details on `actionsTaken`

```js
{
  labelsAdded: [ 'A' ],
  labelsRemoved: [ 'B' ],
  commentsAdded:
    '.. all ... comments .. combined',
  approved: false,
  closed: false,
  merged: 'merge|squash|rebase', // or null
  changesRequested: [ 'change1' ],
  reviewComments: [ 'comment1' ],
  updateBranch: false
}
```

After all reviewers processed a PR and all desired actions have been taken (best effort), you can still take post-action steps. This is happens synchronously before moving to the next PR. In this <code>async</code> after-review handler, you can chain follow-up commands, add artificial delays, ... Although you can still access PR details (see below how <code>PR</code> is exposing details), the state of <code>PR</code> in memory is likely stale and does not reflect the state in Github. To facilitate decision making, each handler is called with a summary of the combined reviewers outcomes via the parameters <code>actionsTaken</code>.
  </td>
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
  <td>Returns <code>null</code> if the PR is checks and statuses are all succesful. If something is failing or not yet finished, this function returns a string summary of the first found issue. (this internally calls <code>resolveStatus</code> and <code>resolveChecks</code>.</td>
</tr>
</table>

### Avoiding repeated reviewing

Note about avoiding the same actions: Github PR Reviewer does NOT keep any state on previously taken actions.
It's up to you to implement state, if desired, into the `*.reviewer.js` files.

However, state can also be kept on the PR itself, by first retrieving information from the PR,
and checking if a previous action is taken. For example, by adding a comment with
a magic word in it, and later, skipping PR's with that expected magic word in a comment (use `resolveComments`). (This has the drawback that changes do not invalidate previous reviews, but works fine for simple cases.)

### Ideas and suggestions

- Automatically merge package upgrade branches
- Sync all open branches at night
- Add a label if a test is missing
- Merge a PR after CI passes

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
