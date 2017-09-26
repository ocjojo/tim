/**
 * stubs angular
 * @module miniAngular
 * @implements Helper
 */
(function(tim, $){
 	var _name = 'miniNg',
 		_injector,
 		_directives = {};

	var getName = function(){
		return _name;
	};

	function ngIf(node){
		var exp = node.getAttribute('ng-if');
		if(!exp || exp === "") return;

		var originalNode = node;
		var currentNode = node;
		var commentNode = document.createComment(exp);

		function watcher(val){
			if(val && currentNode == commentNode){
				currentNode.parentNode.replaceChild(originalNode, currentNode);
				currentNode = originalNode;
			} else if(!val && currentNode == originalNode) {
				currentNode.parentNode.replaceChild(commentNode, currentNode);
				currentNode = commentNode;
			}
		}
		watcher.exp = exp;
		return watcher;
	}
	_directives['ng-if'] = ngIf;

	function ngClick(node){
		var exp = node.getAttribute('ng-click');
		if(!exp || exp.indexOf('(') < 1) return;
		var callback = parse(exp);
		return function(val, scope){ //val is undefined b/c no expression attached to watcher func
			node.addEventListener('click', function(event){
				callback(scope, {$event: event});
			});
		};
	}
	_directives['ng-click'] = ngClick;

	function ngSrc(node){
		var exp = node.getAttribute('ng-src');
		if(!exp) return;
		var intFunc = _interpolate(exp);
		var attr = node.tagName.toUpperCase() == 'A' ? 'href' : 'src';
		if(!intFunc){
			node.setAttribute(attr, exp);
			return;
		}
		// replace double mustaches with actual value
		function watcher(val){
			var currSrc = intFunc(val);
			if(typeof currSrc == 'string' && currSrc !== ""){
				node.setAttribute(attr, currSrc);
			} else {
				node.removeAttribute(attr);
			}
		}
		watcher.exp = intFunc.exp;
		return watcher;
	}
	_directives['ng-src'] = ngSrc;

	/**
	 * interpolates a textNode and returns a linkFunction or undefined if no doubleMustaches are contained
	 * @param  {textNode} textNode a DOM textNode
	 * @return {function|undefined}
	 */
	function _interpolateTextNode(textNode){
		var intFunc = _interpolate(textNode.nodeValue);
		if(!intFunc) return;

		function watcher(val){
			textNode.nodeValue = intFunc(val);
		}
		watcher.exp = intFunc.exp;
		return watcher;
	}

	/**
	 * returns array with param names to be injected into fn
	 * @param  {Function|Array} fn the function, either has to have fn.$inject = ["di1", "di2", ...] or is ["di1", "di2", ..., "diX", fn]
	 * @return {[String]} Array of Strings with the dependencies of fn
	 */
	function _annotate(fn) {
		var $inject,
		last;

		if (typeof fn === 'function') {
			if (!($inject = fn.$inject)) {
				$inject = [];
			}
		} else if (Array.isArray(fn)) {
			last = fn.length - 1;
			if(typeof fn[last] != 'function'){
				throw new Error('No function to invoke provided');
			}
			$inject = fn.slice(0, last);
		} else {
			throw new Error('No function to invoke provided');
		}
		return $inject;
	}

	/**
	 * returns an array of dependencies in the corrent order to inject fn
	 * @param  {Function} fn the function that will be injected
	 * @param  {Object} locals Object containing all possible services to be injected in fn
	 * @return {[any]}
	 */
	function _injectionArgs(fn, locals) {
		var args = [],
		$inject = _annotate(fn);
		for (var i = 0, length = $inject.length; i < length; i++) {
			var key = $inject[i];
			if (typeof key !== 'string') {
				throw new Error('Incorrect injection token! Expected service name as string, got {0}', key);
			}
			args.push(locals && locals.hasOwnProperty(key) ? locals[key] : null);
		}
		return args;
	}

	/**
	 * returns an injector object with different methods to call functions/classes and inject dependecies in them
	 * @return {Object}
	 */
	function injector(){
		if(!_injector){
			_injector = {
				invoke: function(fn, self, locals){
					var args = _injectionArgs(fn, locals);
					if (Array.isArray(fn)) {
						fn = fn[fn.length - 1];
					}

					return fn.apply(self, args);
				},
				instantiate: function(Type, locals){
					// Check if Type is annotated and use just the given function at n-1 as parameter
					// e.g. someModule.factory('greeter', ['$window', function(renamed$window) {}]);
					var ctor = (Array.isArray(Type) ? Type[Type.length - 1] : Type);
					var args = _injectionArgs(Type, locals);
					// Empty object at position 0 is ignored for invocation with `new`, but required.
					args.unshift(null);
					return new (Function.prototype.bind.apply(ctor, args))();
				},
				get: function(di){
					return tim.helper.get(di);
				}
			};
		}
		return _injector;
	}


	/**
	 * creates a jQuery Wrapper around a DOM Element extended with some angular specific functions
	 * @param  {String|DomElement|jQueryObject} el querySelector
	 * @return {jQueryObject} 
	 */
	function element(el){
		var $el = $(el);
		$el.injector = injector;
		$el.scope = function(){
			return Array.isArray(el) ? el[0].scope : el.scope;
		};
		return $el;
	}

	/**
	 * returns a value searched for in an object via an address array or the function value returned from address
	 * Example: object = {a: {b: [1, 2, 3]}} and address of ["a", "b", 2] would return 3.
	 * @param  {Array|Function} address
	 * @param  {Object} object against which to evaluate, typically a scope.
	 * Can be accessed via $scope, if address is a function.
	 * @param  {Object} local context that can also be accessed, if exp is a function
	 * @return {any}
	 */
	function _getValue(address, object, locals) {
		if(typeof address == 'function') return address();
		if(typeof address == 'string'){
			var parens = address.indexOf('(');
			if(parens > -1){
				address = address.slice(0, parens);
			}
			if(object.hasOwnProperty(address) && typeof object[address] == 'function'){
				return _injector.invoke(object[address], null, $.extend({
					$scope: object
				}, locals));
			} else {
				address = address.split('.');
			}
		}
		if(Array.isArray(address)){
			var value = object;
			for (var i = 0; i < address.length; i++) {
				var prop = address[i];
				value = value[prop];
			}
			return value;
		}
	}

	/**
	 * Converts miniNg expression into a function.
	 * @param  {String}} exp
	 * @return {function} function(context, locals) which represents the compiled expression
	 */
	function parse(exp){
		return _getValue.bind(this, exp);
	}

	function newScope(){
		var $$watchers = [];

		var watch = function(exp, listener){
			if(typeof exp != 'function' && typeof exp != 'string'){
				console.error('can only watch function or string', exp);
				return;
			}
			$$watchers.push({
				exp: exp,
				last: _getValue(exp, scope),
				listener: listener
			});
		};

		var digest = function(){
			for(var i in $$watchers){
				var $watch = $$watchers[i];
				var val = _getValue($watch.exp, scope);
				if($watch.last != val){
					$watch.listener(val, $watch.last);
					$watch.last = val;
				}
			}
		};

		var apply = function(exp){
			try {
				return exp(scope);	
			} catch(e) {
				console.error(e);
			} 
			finally {
				digest();
			}
			
		};

		var scope = {
			$watch: watch,
			$digest: digest,
			$apply: apply
		};

		return scope;
	}
	/**
	 * stubs angulars $rootScope
	 * @type {Object}
	 */
	var rootScope = {
		$new: newScope
	};

	function _replaceFromToWithValue(string, index, count, value){
		return string.slice(0, index) + value + string.slice(index + count);
	}

	// Regex to get content in double mustaches.
	var regex = /{{\s*([\w\.\^]+)\s*}}/;
	/**
	 * returns interpolation function to replace double mustaches in string
	 * needs to be exactly zero or one double mustache in string!
	 * @param  {string} string String that may contain double mustaches
	 * @return {function|undefined} returns a function(val) which replaces the double mustaches with val.
	 * function.exp contains the value in the double mustache for creating a $watch.
	 * returns undefined if no double mustaches were contained
	 */
	function _interpolate(string){
		var match = regex.exec(string);
		// Find double mustache in string.
		if(match === null) {
			//if no double mustaches return early
			return;
		}
		var originalValue = string;
		// replace double mustaches with actual value
		function interpolation(val){
			return _replaceFromToWithValue(originalValue, match.index, match[0].length, val);
		}
		interpolation.exp = match[1];
		return interpolation;
	}

	function _addDirectives(node){
		var directives = [];
		for(var i = 0; i < node.attributes.length; i++){
			var attr = node.attributes[i];
			if(attr.name.indexOf('ng') === 0 && _directives[attr.name]){
				var dir = _directives[attr.name](node);
				if(typeof dir == 'function') {
					directives.push(dir);
				}
			}
		}
		return directives;
	}

	function _compileNodes(nodes, directives){
		// walk over nodes which might be a jQueryObject or a childNodes NodeList
		for(var i = 0; i < nodes.length; i++){
			switch(nodes[i].nodeType){
				case Node.TEXT_NODE:
					var intFunc = _interpolateTextNode(nodes[i]);
					if(typeof intFunc == 'function'){
						directives.push(intFunc);
					}
					continue;
				case Node.ELEMENT_NODE:
					var dirs = _addDirectives(nodes[i]);
					directives.push.apply(directives, dirs);
					break;
				default:
					break;
			}
			if(nodes[i].childNodes.length){
				_compileNodes(nodes[i].childNodes, directives);
			}
		}
	}

	/**
	 * stubs angulars $compile service. compiles a string to a template, which can be linked with a scope.
	 * @param  {String|jQueryObject} source the html string
	 * @return {function} returns a template function which can compile the template with a scope
	 */
	function compile(source){
		//compile to domTree with jQuery
		var nodes = $(source);
		var directives = [];

		_compileNodes(nodes, directives);

		return function(scope){
			if(typeof scope != 'object' || typeof scope.$watch != 'function'){
				console.error('no angular scope provided');
				return;
			}
			for(var i in directives){
				var directive = directives[i];
				directive(_getValue(directive.exp, scope), scope);
				//if directive has a watch.exp, also register that
				if(directive.exp){
					scope.$watch(directive.exp, directive);
				}
			}
			return nodes;
		};
	}


	/**
	 * add self to tim as expa ApiHelper
	 */
	tim.helper.add({
		getName: getName,
		element: element,
		injector: injector,
		rootScope: rootScope,
		compile: compile,
		parse: parse
	});

})(aigTim, jQuery);