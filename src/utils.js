const assert = require('assert');
const https = require('https');

// simple version of lodash memoize
const memoize = (fnc) => {
	const cache = {};
	return (...args) => {
		const key = args[0];
		if (key in cache) {
			return cache[key];
		}

		cache[key] = fnc.apply(this, args);
		return cache[key];
	};
};

const apiMethod = (method, fullUrl, headers, payload, expectJson) => {
	return new Promise((resolve, reject) => {
		const url = new URL(fullUrl);

		const getOptions = {
			host: url.host,
			port: url.port || (url.protocol === 'https:' ? 443 : 80),
			path: url.pathname + url.search + url.hash,
			method: method,
			headers: headers || {}
		};

		let post_data = null;
		
		if (payload) {
			post_data = JSON.stringify(payload);
			
			getOptions.headers['Content-Length'] = Buffer.byteLength(post_data);
			getOptions.headers['Content-Type'] = 'application/json;charset=utf-8';
		}

		const req = https.request(getOptions, async (res) => {
			try {
				res.setEncoding('utf-8');
				let body = '';
				for await (const chunk of res) {
					body += chunk;
				}
				if (expectJson) {
					resolve(JSON.parse(body || '{}'));
				}
				else {
					resolve(body);
				}
			} catch (err) {
				console.error("FAILED", method, fullUrl);
				reject(err);
			}
		});

		if (post_data) {
			req.write(post_data);
		}
		
		// close the request, starting the response
		req.end();
	});
};

module.exports = {
	memoize: memoize,
	apiMethod: apiMethod,
	getJson: (fullUrl, opts) => {
		return apiMethod('GET', fullUrl, opts.headers, null, true);
	},
	postJson: (fullUrl, json, opts) => {
		return apiMethod('POST', fullUrl, opts.headers, json, true);
	},
	putJson: (fullUrl, json, opts) => {
		return apiMethod('PUT', fullUrl, opts.headers, json, true);
	},
	patchJson: (fullUrl, json, opts) => {
		return apiMethod('PATCH', fullUrl, opts.headers, json, false);
	},
	deleteJson: (fullUrl, opts) => {
		return apiMethod('DELETE', fullUrl, opts.headers, null, false);
	}
};

// Testing memoize
let incr = 0;
const incrementer = memoize(() => incr++);
incrementer('a');
incrementer('b');
assert.equal(incr, 2);
incrementer('a');
incrementer('b');
assert.equal(incr, 2);

// Testing postJson
// const url = new URL("https://www.github.com/nho.sh/bot-playground/?query#hash");
// console.log(url);
