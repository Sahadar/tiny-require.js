(function(scope) {
	'use strict';


	//node.js
	if(typeof module === 'object' && module.exports) {
		module.exports = null;
	}

	if(typeof window === 'object') {
		window.deferred = null;

		if(window !== scope) {
			scope.deferred = null;
		}
	}
})(this);