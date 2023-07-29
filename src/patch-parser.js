
			// Alternative source/target file detection fallback,
			// in case the main method fails (this method has ambiguity issues)
			const { a, b } = gitDiffLineParser(diffLines[0]);
			
			const sourceLine =
				// Parse files changed/added/deleted
				diffLines.find(l => l.startsWith('--- '))
				||
				// Or just a file rename
				diffLines.find(l => l.startsWith('rename from '))
				||
				// No reference to the source file is found,
				// probably a 'new file mode', 'deleted file mode'
				undefined;
			let sourceFile = null;
			if (sourceLine === undefined) {
				sourceFile = a;
			}
			else if (sourceLine.startsWith('rename from ')) {
				sourceFile = sourceLine.substring('rename from '.length);
				sourceFile = sourceLine.substr('--- '.length)
				
				if (sourceFile === '/dev/null') {
					// New file, source is ''
					sourceFile = '';
				}
				else {
					sourceFile = sourceFile.substring('a/'.length);
				}
			
			const targetLine =
				// Parse files changed/added/deleted
				diffLines.find(l => l.startsWith('+++ '))
				// Or just a file rename
				||
				diffLines.find(l => l.startsWith('rename to '))
				||
				// No reference to the target file is found,
				// probably a 'new file mode', 'deleted file mode'
				undefined;
			
			let targetFile = null;
			if (targetLine === undefined) {
				targetFile = b;
			}
			else if (targetLine.startsWith('rename to ')) {
				targetFile = targetLine.substring('rename to '.length);
				targetFile = sourceLine?.substr('+++ '.length);
				
				if (targetFile === '/dev/null') {
					// Deleted file, target is ''
					targetFile = '';
				}
				else {
					targetFile = targetFile.substring('b/'.length);
				}
			
// Parse a line like:
// diff --git a/my/file/path.txt b/my/file/path.txt
// There are various issues with the format of this line, and file paths that contain spaces
// + a/b, like ' a' or ' b' are simply not possible to unambigously to parse
// Making the most it without going too crazy
// For reference, some interesting puzzles:
// https://github.com/go-gitea/gitea/issues/14812#issuecomment-787059880
function gitDiffLineParser(line) {
	const [a, ...b] = line.split(' b/');
	return { a: a.substring(2), b: b.join(' b/') };
}

assert.equal(gitDiffLineParser('a/my/file.txt b/my/file.txt').a, 'my/file.txt');
assert.equal(gitDiffLineParser('a/my/file.txt b/my/file.txt').b, 'my/file.txt');
assert.equal(gitDiffLineParser('a/my/file.txt b/my/new-file.txt').a, 'my/file.txt');
assert.equal(gitDiffLineParser('a/my/file.txt b/my/new-file.txt').b, 'my/new-file.txt');
assert.equal(gitDiffLineParser('a/my/file b/file.txt b/my/file.txt').a, 'my/file');
assert.equal(gitDiffLineParser('a/my/file b/file.txt b/my/file.txt').b, 'file.txt b/my/file.txt');


const patch2 = `From bf593d996624a4a7581ea7d97f899e1829381553 Mon Sep 17 00:00:00 2001
From: nhosh <info@nho.sh>
Date: Thu, 01 Jun 2021 19:00:44 +0200
Subject: [PATCH] Moved files

---
 LICENSE => LICENSE-new     | 0
 README.md => README-new.md | 0
 2 files changed, 0 insertions(+), 0 deletions(-)
 rename LICENSE => LICENSE-new (100%)
 rename README.md => README-new.md (100%)

diff --git a/LICENSE b/LICENSE-new
similarity index 100%
rename from LICENSE
rename to LICENSE-new
diff --git a/README.md b/README-new.md
similarity index 100%
rename from README.md
rename to README-new.md
`;

const parsed2 = parsePatch(patch2);
assert.equal(parsed2.header.length, 364);
assert.equal(parsed2.diffs.length, 2);

assert.equal(parsed2.diffs[0].sourceFile, 'LICENSE');
assert.equal(parsed2.diffs[0].targetFile, 'LICENSE-new');
assert.equal(parsed2.diffs[0].hunks.length, 0);

assert.equal(parsed2.diffs[1].sourceFile, 'README.md');
assert.equal(parsed2.diffs[1].targetFile, 'README-new.md');
assert.equal(parsed2.diffs[1].hunks.length, 0);


const patch3 = `From bf593d996624a4a7581ea7d97f899e1829381553 Mon Sep 17 00:00:00 2001
From: nhosh <info@nho.sh>
Date: Thu, 01 Jun 2021 19:00:44 +0200
Subject: [PATCH] Moved files

---
my/file.js | 0
my/other-file.js | 0

diff --git a/my/file.js b/my/file.js
new file mode 100644
index 00000000000..e69de29bb2d
diff --git a/my/other-file.js b/my/other-file.js
deleted file mode 100644
index 00000000000..e69de29bb2d
`;

const parsed3 = parsePatch(patch3);
assert.equal(parsed3.header.length, 206);
assert.equal(parsed3.diffs.length, 2);

assert.equal(parsed3.diffs[0].sourceFile, 'my/file.js');
assert.equal(parsed3.diffs[0].targetFile, 'my/file.js');
assert.equal(parsed3.diffs[0].hunks.length, 0);

assert.equal(parsed3.diffs[1].sourceFile, 'my/other-file.js');
assert.equal(parsed3.diffs[1].targetFile, 'my/other-file.js');
assert.equal(parsed3.diffs[1].hunks.length, 0);