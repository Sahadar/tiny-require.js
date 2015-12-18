(function() {
	'use strict';

	require.config({
		baseUrl : './',
		paths: {
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
			console.log(oneValue);
			start();
		});
	});
})();