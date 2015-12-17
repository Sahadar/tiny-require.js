'use strict';

var qunit = require("qunit");

qunit.run({
    code: {
    	path : "tiny-require.js",
    	namespace : 'require'
    },
    tests: "test/test.js"
});