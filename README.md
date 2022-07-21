# Github PR Reviewer

A nodejs based Github PR Reviewer which can be easily turned into a bot. This bot works on a GitHub repo, by finding open PR's
and taking actions on them.

Github PR Reviewer makes it very easy to interact with open pull requests, allowing you to focus fully on automating checks. Every PR will be passing through your own rule-set, and where needed, the actions you define will be executed for each PR.

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
| `--pr-number=123,500` <br>(Optional) | PR number or numbers \(comma seperated\)<br> |

## Implementing a PR reviewer

A reviewer is a collection of Javascript files inside a folder. It's recommended to make a folder per project or repository you plan to review.

### Defining a reviewer

1. Create a file with the following naming:
   `<your-reviewer-name>.reviewer.js`
2. Implement the template according to your needs. If you want to leverage existing packages, other files, etc, just require them as you would with any other .js file.

```js
module.exports = {
  filter: async (pr) => {
    // optionally fetch more PR details
    // (see Fetching Details)

    // if this reviewer applies
    return true; 

    // OR
    
    // Log out a reason why this reviewer does not apply
    return 'A string with the reason why not';
  },
  review: async (pr) => {
    // optionally fetch more PR details
    // (see Fetching Details)

    // an array of actions that have to be taken
    // (See Actions)
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
| Labelling a PR | `{ action: 'label', labels: [ 'A', 'B' ] }` | Add one or more labels to the PR. Non-existing labels will automatically be created by Github |
| Unlabelling a PR | `{ action: 'unlabel', label: 'A'}` | Remove a single label from a PR. Note that you cannot use an array for this action. |
| Merge a PR | `{ action: 'merge' }` | The user will attempt to merge (which might fail if some repo requirements are not met) |
| Request changes | `{ action: 'request-changes', changes: '... please do so and so ...' }` | Request changes to be made. Use the description field to summarize what is wrong. |
| Review by adding a comment | `{ action: 'review-comment', comment: 'Please ...', path: 'relative path of the file to change', line: 1}` | This will begin or continue a review of a PR and will expect it to be Resolved. Use the required `path` + `line` to specify where the problem originates. |

### Avoiding repeated reviewing

Note about avoiding the same actions: the reviewer does NOT keep any state on previously taken actions.
It's up to the implementor to code persistence, if desired, into the `*.reviewer.js` files.

However, a simple state can also be kept on the PR itself, by first retrieving information from the PR,
and checking if a previous action is taken. For example, by authoring a comment with
a magic word in it, and later, skipping PR's with that expected magic word. This has the drawback that changes do not invalidate previous reviews.

### Resolving additional PR details

When Github is contacted for PR information, the default behaviour is to return some basic set of data on every open PR.
To avoid API limits, and speed up the reviewing, resolving additional data is opt-in.

<table>
<tr>
  <th>Resolver</th>
  <th>Spec</th>
  <th>Effect</th>
</tr>
<tr>
  <td>Comments</td>
  <td><code>await pr.resolveComments()</code></td>
  <td>This will populate the PR data <code>pr.comments</code>, which is an array of Github comment objects. For full specification, check the Github comment specification at https://docs.github.com/en/rest/issues/comments#get-an-issue-comment</td>
</tr>
<tr>
  <td>Files</td>
  <td><code>await pr.resolveFiles()</code></td>
  <td>This will populate the PR data <code>pr.files</code>, which is a array of relative file paths (strings)</td>
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
      sourceFile: 'package.json',
      targetFile: 'package.json-backup',
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
  <td>This will populate the PR data <code>pr.reviews</code>, which is an array of objects.</td>
</tr>
<tr>
  <td>Status</td>
  <td><code>await pr.resolveStatus()</code></td>
  <td>This will populate the PR data <code>pr.status</code>, which is an object. For full specification, check the Github commit status specification at https://docs.github.com/en/rest/commits/statuses#get-the-combined-status-for-a-specific-reference</td>
</tr>
</table>

### Testing your reviewer before putting it live

No integration tests exist atm, but use the DRY_RUN on real
repositories to safely try out your reviewers.
