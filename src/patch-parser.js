const assert = require('assert');

const parsePatch = (raw) => {
	// First split the patch header from the diff section
	const [header, ...diffs] = raw.split('diff --git ');
	
	return {
		raw: raw,
		header: header,
		diffs: diffs.map(diff => {
			const [ diffHeader, ...hunks ] = diff.split('\n@@');
			const diffLines = diffHeader.split('\n');
			return {
				sourceFile: diffLines.find(l => l.startsWith('--- a/')).substr('--- a/'.length),
				targetFile: diffLines.find(l => l.startsWith('+++ b/')).substr('+++ b/'.length),
				hunks: hunks.map(hunk => {
					const endOfChanges = hunk.indexOf(' @@');
					const lineChanges = hunk.substr(0, endOfChanges).trim();
					const rawChanges = hunk.substr(endOfChanges + ' @@'.length);
					const rawLines = rawChanges.split('\n');
					return {
						lineChanges: lineChanges,
						rawChanges: rawChanges,
						addedLines: rawLines.filter(l => l[0] === '+').map(l => l.substr(1)),
						removedLines: rawLines.filter(l => l[0] === '-').map(l => l.substr(1)),
						linesAdded: rawLines.filter(l => l[0] === '+').length,
						linesRemoved: rawLines.filter(l => l[0] === '-').length,
					};
				})
			}
		})
	};
};

module.exports = parsePatch;

// Sample taken from dependabot working on dependabot
// https://github.com/dependabot/dependabot-core/commit/d3c422beb34ce7e93567876111f82b1bf484f46c.patch
const patch1 = `From d3c422beb34ce7e93567876111f82b1bf484f46c Mon Sep 17 00:00:00 2001
From: "dependabot[bot]" <49699333+dependabot[bot]@users.noreply.github.com>
Date: Wed, 25 May 2022 06:10:20 +0000
Subject: [PATCH] build(deps-dev): bump phpstan/phpstan in /composer/helpers/v2

Bumps [phpstan/phpstan](https://github.com/phpstan/phpstan) from 1.6.8 to 1.7.1.
- [Release notes](https://github.com/phpstan/phpstan/releases)
- [Changelog](https://github.com/phpstan/phpstan/blob/1.7.x/CHANGELOG.md)
- [Commits](https://github.com/phpstan/phpstan/compare/1.6.8...1.7.1)

---
updated-dependencies:
- dependency-name: phpstan/phpstan
  dependency-type: direct:development
  update-type: version-update:semver-minor
...

Signed-off-by: dependabot[bot] <support@github.com>
---
 composer/helpers/v2/composer.json |  2 +-
 composer/helpers/v2/composer.lock | 12 ++++++------
 2 files changed, 7 insertions(+), 7 deletions(-)

diff --git a/composer/helpers/v2/composer.json b/composer/helpers/v2/composer.json
index 58a9737013b..524c8726df3 100644
--- a/composer/helpers/v2/composer.json
+++ b/composer/helpers/v2/composer.json
@@ -6,7 +6,7 @@
     },
     "require-dev": {
         "friendsofphp/php-cs-fixer": "^3.0",
-        "phpstan/phpstan": "~1.6.4"
+        "phpstan/phpstan": "~1.7.1"
     },
     "autoload": {
         "psr-4": {
diff --git a/composer/helpers/v2/composer.lock b/composer/helpers/v2/composer.lock
index fa608909bea..4a490bca340 100644
--- a/composer/helpers/v2/composer.lock
+++ b/composer/helpers/v2/composer.lock
@@ -4,7 +4,7 @@
         "Read more about it at https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies",
         "This file is @generated automatically"
     ],
-    "content-hash": "f009496780e9f8a7f35fbdda5f7f00b6",
+    "content-hash": "fe0332e314087c171ff618dd3d67d8d9",
     "packages": [
         {
             "name": "composer/ca-bundle",
@@ -2108,16 +2108,16 @@
         },
         {
             "name": "phpstan/phpstan",
-            "version": "1.6.8",
+            "version": "1.7.1",
             "source": {
                 "type": "git",
                 "url": "https://github.com/phpstan/phpstan.git",
-                "reference": "d76498c5531232cb8386ceb6004f7e013138d3ba"
+                "reference": "e3baed2ee2ef322e0f9b8fe8f87fdbe024c7c719"
             },
             "dist": {
                 "type": "zip",
-                "url": "https://api.github.com/repos/phpstan/phpstan/zipball/d76498c5531232cb8386ceb6004f7e013138d3ba",
-                "reference": "d76498c5531232cb8386ceb6004f7e013138d3ba",
+                "url": "https://api.github.com/repos/phpstan/phpstan/zipball/e3baed2ee2ef322e0f9b8fe8f87fdbe024c7c719",
+                "reference": "e3baed2ee2ef322e0f9b8fe8f87fdbe024c7c719",
                 "shasum": ""
             },
             "require": {
@@ -2159,7 +2159,7 @@
                     "type": "tidelift"
                 }
             ],
-            "time": "2022-05-10T06:54:21+00:00"
+            "time": "2022-05-24T09:05:09+00:00"
         },
         {
             "name": "psr/cache",
`;

const parsed1 = parsePatch(patch1);
assert.equal(parsed1.header.length, 904);
assert.equal(parsed1.diffs.length, 2);
assert.equal(parsed1.diffs[0].sourceFile, parsed1.diffs[0].targetFile);
assert.equal(parsed1.diffs[0].hunks.length, 1);

assert.equal(parsed1.diffs[0].hunks[0].lineChanges, '-6,7 +6,7');
assert.equal(parsed1.diffs[0].hunks[0].linesAdded, 1);
assert.equal(parsed1.diffs[0].hunks[0].linesRemoved, 1);

assert.equal(parsed1.diffs[1].hunks[0].linesAdded, 1);
assert.equal(parsed1.diffs[1].hunks[0].addedLines.length, 1);
assert.equal(parsed1.diffs[1].hunks[0].linesRemoved, 1);
assert.equal(parsed1.diffs[1].hunks[0].removedLines.length, 1);

assert.equal(parsed1.diffs[1].hunks[1].linesAdded, 4);
assert.equal(parsed1.diffs[1].hunks[1].addedLines.length, 4);
assert.equal(parsed1.diffs[1].hunks[1].linesRemoved, 4);
assert.equal(parsed1.diffs[1].hunks[1].removedLines.length, 4);

assert.equal(parsed1.diffs[1].hunks[2].linesAdded, 1);
assert.equal(parsed1.diffs[1].hunks[2].addedLines.length, 1);
assert.equal(parsed1.diffs[1].hunks[2].linesRemoved, 1);
assert.equal(parsed1.diffs[1].hunks[2].removedLines.length, 1);
