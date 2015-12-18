(function(scope) {
	'use strict';

	var requiredScripts = {};

	// Loader
	function loader(fileName, callback) {
		var xhttp = new XMLHttpRequest();

		xhttp.onreadystatechange = function() {
			if (xhttp.readyState === 4 && xhttp.status === 200) {
				callback(xhttp.responseText);
			}
		};
		xhttp.open("GET", fileName, true);
		xhttp.send();
	}
	// Minimalistic deferred taken from: https://github.com/Sahadar/tiny-deferred.js
	// Didn't want to have any dependencies
	// I will not force anybody to use this deferred
	function isPromise(obj) {
		return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
	}

	function Deferred() {
		var self = this;
		var awaiting = [];

		function promise(win, fail) {
			return promise.then(win, fail);
		}
		promise.then = function(win, fail) {
			var defer = createDeferred();

			if(typeof win !== 'function' && typeof fail !== 'function') {
				return promise;
			}
			if(promise.resolved) {
				if(typeof win === 'function') {
					defer.resolve(win(promise.value));
				} else {
					defer.resolve(promise.value);
				}
			} else if(promise.failed) {
				if(typeof fail === 'function') {
					fail(promise.value);
				// fail not handled = put error into console
				} else if(window && console && typeof console.error === 'function') {
					console.error(promise.value);
				}
				defer.reject(promise.value);
			} else {
				awaiting.push({
					defer : defer,
					method : 'then',
					args : arguments
				});
			}
			return defer.promise;
		};
		promise.done = function() {};
		promise.map = function(callback) {
			var defer = createDeferred();

			if(promise.resolved) {
				defer.resolve(createDeferred.map(promise.value, callback));
			} else if(promise.failed) {
				defer.reject(promise.value);
			} else {
				awaiting.push({
					defer : defer,
					method : 'map',
					args : arguments
				});
			}

			return defer.promise;
		};
		promise.valueOf = function() {return promise.value;};
		promise.value = null;
		promise.resolved = false;
		promise.failed = false;
		promise.settled = false;

		this.promise = promise;
		this.resolve = function(resolveValue) {
			if(promise.settled) {
				return promise;
			}

			if(isPromise(resolveValue)) {
				resolveValue.then(function(val) {
					self.resolve(val);
				});
			} else {
				promise.resolved = true;
				promise.settled = true;
				promise.value = resolveValue;

				while(awaiting.length) {
					(function() {
						var data = awaiting.shift();
						var defer = data.defer;
						var method = data.method;
						var win = data.args[0];

						if(method === 'then') {
							defer.resolve(win(promise.value));
						} else if(method === 'map') {
							defer.resolve(createDeferred.map(promise.value, win));
						} else if(method === 'reduce') {
							defer.resolve(createDeferred.reduce(promise.value, win));
						}
					})();
				}
			}

			return promise;
		};
		this.reject = function(rejectValue) {
			// we cannot reject resolved promise
			if(promise.settled) {
				return promise;
			}

			promise.value = rejectValue;
			promise.failed = true;
			promise.settled = true;

			while(awaiting.length) {
				(function() {
					var data = awaiting.shift();
					var defer = data.defer;
					var fail = data.args[1];

					if(typeof fail === 'function') {
						fail(promise.value);
					}
					defer.reject(promise.value);
				})();
			}

			return promise;
		};
	}

	function createDeferred(value) {
		return new Deferred(value);
	}

	createDeferred.map = function(collection, callback) {
		var mapDefer = createDeferred();
		var collectionLength = collection.length;
		var result = [];
		var resolved = 0;

		if(isPromise(collection)) {
			collection.then(function(properCollection) {
				mapDefer.resolve(createDeferred.map(properCollection, callback));
			});
			return mapDefer.promise;
		}
		if(!Array.isArray(collection)) {
			mapDefer.reject(new Error("First map argument should be an array"));
			return mapDefer.promise;
		}
		collection.forEach(function(collectionValue, index) {
			var defer = createDeferred();

			defer.promise.then(function(value) {
				result[index] = value;
				resolved++;

				if(resolved === collectionLength) {
					mapDefer.resolve(result);
				}
			});
			result.push(defer.promise);
			defer.resolve(callback(collectionValue));
		});

		return mapDefer.promise;
	};

	// require.js implementation
	function require(fileNames, callback) {
		if(typeof require.config === 'function') {
			console.error('You have to specify config for require.js');
			return;
		}
		var loaderConfig = require.config;
		var environment = require.config.environment;
		// var head = jQuery('head');

		createDeferred.map(fileNames, function(fileName) {
			var defer = createDeferred();
			var originName = fileName;
			var filenameSplit = fileName.split('/');
			var firstName = filenameSplit[0];
			var scriptDefer = null;
			var url = '';

			if(loaderConfig.paths[fileName]) {
				fileName = loaderConfig.paths[fileName];
			// first path name has translation
			} else if(loaderConfig.paths[firstName]) {
				fileName = loaderConfig.paths[firstName];
				filenameSplit.shift();
				fileName += '/'+filenameSplit.join('/');
			}

			if(requiredScripts[fileName]) {
				scriptDefer = requiredScripts[fileName].defer;
				scriptDefer.promise.then(function() {
					defer.resolve(fileName);
				});
			} else {
				scriptDefer = createDeferred();
				requiredScripts[fileName] = {
					defer : scriptDefer,
					result : null
				};

				// download content - in dev mode, in prod wait for "define"
				if(environment === 'dev' || loaderConfig.pathPackages.indexOf(firstName) >= 0) {
					if(environment !== 'dev' && fileName.match(/\/main$/g)) {
						url = require.config.baseUrl+fileName.replace(/\/main$/g, '')+'.js?'+require.config.tag;
					} else {
						url = require.config.baseUrl+fileName+'.js?v='+require.config.tag;
					}

					loader(url, function(script) {
						console.log('script: ', script);
					});
					// jQuery.ajax({
					// 	url : url,
					// 	dataType : 'html',
					// 	success : function(script) {
					// 		lastLoadedScript = fileName;
					// 		head.append('<script>'+script+'</script>');

					// 		if(loaderConfig.shim[originName]) {
					// 			requiredScripts[fileName].result = window[loaderConfig.shim[originName].exports];
					// 			scriptDefer.resolve();
					// 		}
					// 		scriptDefer.promise.then(function() {
					// 			defer.resolve(fileName);
					// 		});
					// 	}
					// });
				} else {
					scriptDefer.promise.then(function() {
						defer.resolve(fileName);
					});
				}
			}

			return defer.promise;
		}).then(function(fileNames) {
			console.log('fileNames: ', fileNames);
			// var results = [];

			// // console.log('fileNames: ', fileNames);
			// fileNames.forEach(function(fileName) {
			// 	// console.log('result: ', fileName, requiredScripts[fileName].result);
			// 	results.push(requiredScripts[fileName].result);
			// });

			// callback.apply(window, results);
		});
	}
	// this method will be replaced by its argument
	require.config = function(config) {
		require.config = config;
	};
	require.cleanUp = function() {
		requiredScripts = {};
		console.log('cleanUp');
	};

	function define() {
	// 	var environment = self.config.core.environment;
	// 	var fileName = (environment === 'dev') ? lastLoadedScript : arguments[0];
	// 	var requires = (environment === 'dev') ? arguments[0] : arguments[1];
	// 	var callback = (environment === 'dev') ? arguments[1] : arguments[2];
	// 	var requireResults = [];
	// 	var scriptDefer = null;

	// 	// no requires
	// 	if(typeof callback === 'undefined') {
	// 		callback = requires;
	// 		requires = [];
	// 	}

	// 	if(requiredScripts[fileName]) {
	// 		scriptDefer = requiredScripts[fileName].defer;
	// 	} else {
	// 		scriptDefer = createDeferred();
	// 		requiredScripts[fileName] = {
	// 			defer : scriptDefer,
	// 			result : null
	// 		};
	// 	}

	// 	if(requires.length > 0) {
	// 		require(requires, function() {
	// 			requiredScripts[fileName].result = callback.apply(window, arguments);

	// 			scriptDefer.resolve();
	// 		});
	// 	} else if(typeof callback === 'function') {
	// 		requiredScripts[fileName].result = callback();
	// 		scriptDefer.resolve();
	// 	} else {
	// 		requiredScripts[fileName].result = callback;
	// 		scriptDefer.resolve();
	// 	}
	}

	if(typeof window === 'object') {
		window.require = require;
		window.define = define;

		if(window !== scope) {
			scope.require = require;
			scope.define = define;
		}
	}
})(this);