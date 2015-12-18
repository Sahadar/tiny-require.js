(function() {
	'use strict';

	require.config({
		baseUrl : '../',
		paths: {
			'test1' : 'files/one',
			'test2' : 'files/two',
			'path_part' : 'files'
		},
		environment : 'dev',
		tag : (Math.random()*10000).toString().split('.')[0]
	});

	QUnit.module('tiny-deferred', {
		beforeEach : function() {
			require.cleanUp();
		}
	});

	asyncTest("Basics", function() {
		require(['files/one'], function(oneValue) {
			deepEqual(oneValue, {one : 'one_foo'}, 'Proper value for one.js file');
			start();
		});
	});

	asyncTest("More files", function() {
		require(['files/one', 'files/two'], function(oneValue, twoValue) {
			deepEqual(oneValue, {one : 'one_foo'}, 'Proper value for one.js file');
			deepEqual(twoValue, {two : 'two_foo'}, 'Proper value for two.js file');
			start();
		});
	});

	asyncTest("Define function", function() {
		require(['files/one', 'files/two'], function(oneValue, twoValue) {
			deepEqual(oneValue, {one : 'one_foo'}, 'Proper value for one.js file');
			deepEqual(twoValue, {two : 'two_foo'}, 'Proper value for two.js file');
			start();
		});
	});

	asyncTest("Path", function() {
		require(['test1'], function(oneValue) {
			deepEqual(oneValue, {one : 'one_foo'}, 'Proper value for one.js file');
			start();
		});
	});

	asyncTest("Path - multi files", function() {
		require(['test1', 'test2'], function(oneValue, twoValue) {
			deepEqual(oneValue, {one : 'one_foo'}, 'Proper value for one.js file');
			deepEqual(twoValue, {two : 'two_foo'}, 'Proper value for two.js file');
			start();
		});
	});

	asyncTest("Path part", function() {
		require(['files/one', 'path_part/two'], function(oneValue, twoValue) {
			deepEqual(oneValue, {one : 'one_foo'}, 'Proper value for one.js file');
			deepEqual(twoValue, {two : 'two_foo'}, 'Proper value for two.js file');
			start();
		});
	});

	asyncTest("Nesting", function() {
		require(['files/three'], function(threeValue) {
			deepEqual(threeValue, {one : 'one_foo', two : 'two_foo'}, 'Proper value for three.js file');
			start();
		});
	});
})();