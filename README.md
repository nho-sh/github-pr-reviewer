# Github PR Reviewer

A nodejs based Github PR Reviewer which can be easily turned into a bot. This bot works on a GitHub repo, by finding PR's
and taking actions on them.

## Setup

It assumes that:

- you have ENV variables:
  - GITHUB_USER
  - GITHUB_PASS
  - GITHUB_REPO
    like `account/repo`
  - REVIEWER_FOLDER
    local folder with `*.reviewer.js` files adhering to the contract
  - DRY_RUN (or DRYRUN)
    set value to not affect PRs, just to trial run it
    This means GH will be contacted and PR details will be fetched,
    but when it's time to update PR's, nothing really happens,
    and we just print out what should happen
  - MOCK (for development)
    This is to mock GH api calls during development and speeding up
    testing cycles. You probably don't want this

## Testing

The code is as much self-testing as possible,
using in-file asserts.

No integration tests exist atm, but use the DRY_RUN on real
repositories to safely try out your reviewers.
