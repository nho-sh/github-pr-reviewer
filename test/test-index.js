#!/usr/bin/env node

process.env.GITHUB_PASS = process.env.REVIEWER_BOT_PASS;
process.env.GITHUB_USER = process.env.REVIEWER_BOT_USER;

process.env.GITHUB_REPO = 'nho-sh/bot-playground';
process.env.REVIEWER_FOLDER = './botplayground-reviewers/';
// process.env.DRY_RUN = '1';

require('../src/index.js')
