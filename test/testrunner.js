'use strict';

var qunit = require("qunit");

qunit.run({
	deps : [{
		path : "node_modules/is-promise/index.js",
		namespace : 'isPromise'
	}],
    code: {
    	path : "tiny-require.js",
    	namespace : 'require'
    },
    tests: "test/test.js"
});