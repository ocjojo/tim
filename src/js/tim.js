/**
 * Tim module providing basic functionality for extending EXPA.
 * @namespace aigTim
 * @author Lukas Ehnle
 */
var aigTim = (function(){

	'use strict';

	var _ = {},
		tim = _,
		_debug = false,
		_listenerActive = false,
		_isOp,
		_helper = {},
		_scripts = [],
		_activeScripts = [],
		$injector;

	/**
	 * Interface for script to be added to {@link aigTim}.
	 * @Interface Script
	 * @prop {string} name a name mainly for debugging purposes
	 * @prop {string} route the route on which the script should be called
	 * @prop {function} script the script to be called on a matched route
	 */
	function Script(definition) {
		var _ = {},
			_name = definition.name,
			_route = definition.route,
			_script = definition.script,
			_destroy = definition.destroy;

		/**
		 * matches the scripts route to the url provided
		 * @param  {String} url should be window.location.href
		 * @return {bool} did route match the internal route
		 */
		_.matchRoute = function(url){
			//remove potential parameters from url
			url = url.replace(/\?.*/, '');
			 //match only exact routes
			return url.match('^' + _route + '$') !== null;
		};
		/**
		 * supplies parameters and runs the script with angulars $injector.invoke
		 * @return {object} the return value of the script run
		 */
		_.run = function(){
			tim.log("Run Script: " + _name);
			$injector.invoke(_script, _, _helper);
			return _;
		};

		/**
		 * calls destroy function on script, when its route is left
		 */
		_.destroy = function(){
			if(typeof _destroy == 'function') _destroy();
		};

		return _;
	}

	/**
	 * log text to console if debug mode is enabled.
	 * @memberOf aigTim
	 * @param  {string} text the text to log.
	 * @return {aigTim} tim for chaining
	 */
	_.log = function() {
		if(_debug) console.debug.apply(this, arguments);
		return _;
	};

	/**
	 * start tim
	 * initialize helpers, start HashListener, run scripts for current route
	 * @memberOf aigTim
	 * @param  {Object} user may be provided with a current_user
	 * @return {aigTim} tim for chaining
	 */
	_.start = function(user) {
		_.log("start tim");
		_isOp = window.location.href.split('/')[2] == "aiesec.org";
		addMenu();
		_polyfillAngular();
		_replaceAngularInjector();
		_pushStateNotifier();
		_initHelper()
		.then(_addStates)
		.then(_.template.addAngularTemplates)
		.then(_startRouteListener);

		return _;
	};

	/**
	 * Returns a function, that, as long as it continues to be invoked, will not
	 * be triggered. The 'function' will be called after it stops being called for
	 * 'wait' milliseconds
	 * @memberOf aigTim
	 * @param  {function} function to debounce
	 * @param  {Integer} milliseconds to wait
	 * @return {function} debounced function
	 */
	_.debounce = function(func, wait) {
	    var timeout;
	    return function() {
	        var context = this,
	            args = arguments;
	        var later = function() {
	            timeout = null;
                func.apply(context, args);
	        };

	        clearTimeout(timeout);
	        timeout = setTimeout(later, wait || 100);
	    };
	};

	var addMenu = function() {
		if(!_isOp) {
			document.querySelector('.navbar > ul').appendChild(_.template.get('#aig-nav-tim'));
		}
	};

	/**
	 * Takes a querySelector and returns a promise. It is resolved with the elements after they are found
	 * or rejected after 15 tries.
	 * @memberOf aigTim
	 * @param  {String} querySelector
	 * @return {Promise}
	 */
	_.find = function(selector){
		var elements = document.querySelectorAll(selector);
		var y = yapl();
		y.selector = selector;
		y.tries = 0;
		if(elements.length) {
			y.resolve(elements);
		} else {
			_viewListener.push(y).observe();
		}
		return y;
	};

	var _viewListener = (function(){
		var viewListenerPromises = [];
		//internal use only!
		var _observer = [];
		var observing = false;

		var checkViewListeners = function() {
			for(var i in viewListenerPromises){
				var y = viewListenerPromises[i];
				var elements = document.querySelectorAll(y.selector);
				if(elements.length > 0) {
					// resolve promise if found
					y.resolve(elements);
					viewListenerPromises.splice(i, 1);
				} else if (y.tries > 14) {
					// reject if not found after 15 tries
					y.reject('tim.find took too long: ' + y.selector);
					viewListenerPromises.splice(i, 1);
				}
				y.tries++;
			}

			//internal!
			for(i in _observer){
				_observer[i]();
			}
		};

		var observer = new MutationObserver( _.debounce( checkViewListeners ) );

		return {
			_subscribe: function(listener){
				_observer.push(listener);
				return this;
			},
			observe: function(){
				if(!observing){
					observing = true;
					observer.observe(document.querySelector('body'), {
						childList: true,
						subtree: true
					});
				}
				return this;
			},
			push: function(promise){
				viewListenerPromises.push(promise);
				return this;
			}
		};
	})();

	/**
	 * Takes an object, an attribute name and returns a promise. It is resolved with the object after the attribute is found
	 * or rejected after 15 tries.
	 * @memberOf aigTim
	 * @param  {Object} object
	 * @param  {String} attribute
	 * @return {Promise}
	 */
	_.wait = function(object, attribute){
		var y = yapl();
		y.object = object;
		y.attribute = attribute;
		y.tries = 0;
		if(object.hasOwnProperty(attribute)) {
			y.resolve(object);
		} else {
			_objectListener.push(y).observe();
		}
		return y;
	};

	var _objectListener = (function(){
		var objectListenerPromises = [];
		var observer;
		var observing = false;

		var checkObjectListeners = function() {
			if(objectListenerPromises.length === 0) {
				observing = false;
				clearInterval(observer);
			}

			for(var i in objectListenerPromises){
				var y = objectListenerPromises[i];
				if(y.object.hasOwnProperty(y.attribute)) {
					// resolve promise if found
					y.resolve(y.object);
					objectListenerPromises.splice(i, 1);
				} else if (y.tries > 35) {
					// reject if not found after 15 tries
					y.reject('tim.wait took too long: ' + y.attribute);
					objectListenerPromises.splice(i, 1);
				}
				y.tries++;
			}
		};

		return {
			observe: function(){
				if(!observing){
					observing = true;
					observer = setInterval(checkObjectListeners, 300);
				}
				return this;
			},
			push: function(promise){
				objectListenerPromises.push(promise);
				return this;
			}
		};
	})();

	var _polyfillAngular = function(){
		if(typeof window.angular != "object"){
			window.angular = getHelper('miniNg');
			_helper.$compile = window.angular.compile;
			_helper.$rootScope = window.angular.rootScope;
		}
	};

	var _replaceAngularInjector = function() {
		$injector = angular.element(document.querySelector('html')).injector();

		var oldInvoke = $injector.invoke;
		$injector.invoke = function(fn, self, locals){
			locals = Object.assign({},locals, _helper);
			return oldInvoke(fn, self, locals);
		};

		var oldInstatiate = $injector.instantiate;
		$injector.instantiate = function(fn, locals){
			locals = Object.assign({},locals, _helper);
			return oldInstatiate(fn, locals);
		};
	};

	// see https://gist.github.com/rudiedirkx/fd568b08d7bffd6bd372
	var _pushStateNotifier = function(){
		var _wr = function(type) {
			var orig = history[type];
			return function() {
				var rv = orig.apply(this, arguments);
				var e = new Event(type);
				e.arguments = arguments;
				window.dispatchEvent(e);
				return rv;
			};
		};
		history.pushState = _wr('pushState');
		history.replaceState = _wr('replaceState');

		window.addEventListener('pushState', function(e){
			console.log("state", e);
		});
	};

	var _startRouteListener = function(){
		if(_listenerActive) return;
		_.log("Start Route Listener");

		_viewListener._subscribe(function(){
			var url = window.location.href.split('?')[0];
			_updateRouteHistory(url);
			runScriptsForRoute(url);
		}).observe();

		if(_isOp){
			runScriptsForRoute(window.location.href.split('?')[0]);
		}

		_listenerActive = true;
	};

	var _updateRouteHistory = function(url) {
		if(_isOp) return;
		sessionStorage.setItem('aigTimHistoryUrl', url);
	};

	var _changeStateToHistory = function() {
		if(_isOp) return;
		var url = sessionStorage.getItem('aigTimHistoryUrl');
		if(url) {
			_.log('RouteHistory: ' + url);
			if(window.location.href.split('?')[0] == url) {
				_.log('Reload state');	// to get template overwrites
				getHelper('$state').reload();
			} else {
				window.location.href = url;
			}
		} else {
			_.log('Reload state');	// to get template overwrites
			getHelper('$state').reload();
		}
	};

	var _activeRoute;
	var runScriptsForRoute = function(route) {
		if(route == _activeRoute) return;
		_activeRoute = route;
		while(_activeScripts.length){
			_activeScripts.pop().destroy();

		}
		_.log("Run scripts for " + route);
		for(var i in _scripts){
			if(_scripts[i].matchRoute(route)){
				_activeScripts.push(_scripts[i].run());
			}
		}
	};

	/**
	 * add a script to be called on a specific route in EXPA
	 * @function add
	 * @memberOf! aigTim.script
	 * @param {Script} definition containing a script definition
	 * @return {aigTim | false} aigTim for chaining or false if definition does not have expected properties
	 */
	var addScript = function(definition) {
		if(typeof definition.name != "string" || definition.name === ""
			|| typeof definition.route != "string"
			|| (typeof definition.script != "function" && !Array.isArray(definition.script)) ) return false;
		_.log("Add Script: " + definition.name);
		_scripts.push(new Script(definition));
		return _;
	};

	/**
	 * add state to EXPA. This utilizes angular and is really powerful.
	 * @function addState
	 * @memberOf! aigTim
	 * @param {Object | Array} state containing a state definition or an array with multiple state definitions
	 * that can be passed to [stateProvider.state](http://angular-ui.github.io/ui-router/site/#/api/ui.router.state.$stateProvider)
	 * use state and config as paramNames as the call is wrapped by expa
	 * @return {aigTim} aigTim for chaining
	 */
	var _states = [];
	_.addState = function(state) {
		//hack into expa state manager...
		// see ui.router for params
		if(Array.isArray(state)){
			_states.push.apply(this, state);
		} else {
			_.log('Add State: ' + state.state);
			_states.push(state);
		}
	};
	var _addStates = function(){
		if(_isOp) return;
		getHelper("routerHelper").configureStates(_states);
	};

	/**
	 * add a script to be called on its *own* route in EXPA
	 * @function addWithOwnRoute
	 * @memberof aigTim.script
	 * @param {Script} definition containing a script definition
	 * @return {aigTim | false} aigTim for chaining or false if definition does not have expected properties
	 */
	var addScriptWithOwnRoute = function(definition){

		if(!addScript(definition)) return;

		var route = definition.route.match("#(.*)")[1];
		var stateName = route.replace(/^\//, "").replace(/\//g, "-");

		var newState = {
			state: stateName,
            config: {
                url: route,
                template: definition.template
            }
		};
		_.log('Add state: ' + stateName);
		_.addState(newState);

		return _;
	};

	/**
	 * add a button that is inserted on a specific route (Wrapper for {@link aigTim.script.add} to make code more descriptive)
	 * @memberof aigTim
	 * @param {Script} definition containing a script definition
	 * @return {aigTim} tim for chaining or false if definition does not have expected properties
	 */
	_.addButton = function(definition) {
		definition.script = definition.initButton;
		return addScript(definition);
	};

	/**
	 * set debug mode
	 * @function setDebug
	 * @memberOf aigTim
	 * @param {Boolean} bool sets the debug mode
	 * @return {aigTim} tim for chaining
	 */
	_.setDebug = function(bool) {
		bool = typeof bool == 'undefined' ? true : bool;
		_debug = bool;
		var callerLine = (new Error()).stack.split("\n")[2];
		_.log("TIM Debugging Mode enabled " + callerLine);
		return _;
	};

	/**
	 * Interface for helper
	 * @interface Helper
	 */
	/**
	 * get the name of the helper
	 * @function getName
	 * @memberOf Helper
	 * @returns {string} the name
	 */
	/**
	 * *optional* init is called via angulars $injector service after {@link aigTim} is initialized.
	 * It may return a promise for which TIM will wait to resolve before it runs the first scripts
	 * @function init
	 * @memberOf Helper
	 */

	/**
	 * add a helper to tim
	 * @function add
	 * @memberOf aigTim.helper
	 * @param {Helper} helper the helper to be added
	 * @return {aigTim} tim for chaining
	 */
	var addHelper = function(helper) {
		_helper[helper.getName()] = helper;
		return _;
	};

	/**
	 * returns a previously added helper from tim or a service from angular via getHelper
	 * @function get
	 * @memberOf aigTim.helper
	 * @param  {string} name the name of a helper/service to be retrieved
	 * @return {Helper | null} returns the helper/service if found or null
	 */
	var getHelper = function(name) {
		try{
			return _helper[name] || $injector.get(name);
		} catch(e){
			return null;
		}

	};

	_.call = function(func, locals){
		return $injector.invoke(func, _, locals);
	};

	var _initHelper = function() {
		var promises =[];
		for(var i in _helper){
			if(typeof _helper[i].getName != 'function') continue;

			_.log("Init Helper:" + _helper[i].getName());
			if(typeof _helper[i].init == 'function') {
				promises.push($injector.invoke(_helper[i].init));
			}
		}
		return Promise.all(promises);
	};

	/**
	 * Interface for template.
	 * @interface Template
	 */
	/**
	 * reference to the angular scope of the template (only available after using {@link Template.compile})
	 * @prop scope
	 * @memberOf Template
	 */
	/**
	 * get DocumentNode from HTMLFragment, so you can keep reference after appending to DOM.
	 * @function getDom
	 * @memberOf Template
	 * @returns {Object} the DocumentNode
	 */
	/**
	 * compiles a tempalte using angular's $compile and a new scope.
	 * @function compile
	 * @memberOf Template
	 * @param  {Object} [scope] an angular scope to use for the compiled element
	 * @returns {Object} the DocumentNode
	 */

	/**
	 * provides templating functions
	 * @namespace template
	 * @memberof aigTim
	 */
	_.template = (function(){
		var _documentRoot;

		/**
		 * Sets the document root from which to obtain the templates.
		 * @memberOf aigTim.template
		 * @param {Object} doc document
		 * @return {aigTim} tim for chaining
		 */
		var setDocumentRoot = function(doc){
			_documentRoot = doc;
			return _;
		};

		/**
		 * Get the document root from which templates are obtained.
		 * @memberOf aigTim.template
		 * @return {Object} document
		 */
		var getDocumentRoot = function(){
			return _documentRoot;
		};

		var _getDom = function(){
			var scope = this.scope;
			var dom = [].slice.call(this.childNodes, 0)[1];
			dom.scope = scope;
			return dom;
		};

		var _compile = function(scope) {
			scope = scope ? scope : getHelper('$rootScope').$new();
			var source = typeof this.substring == 'function' ? this.toString() : this;

			var compiled = getHelper("$compile")(source)(scope);
			var element = compiled[0];
			element.scope = scope;

			return element;
		};

		var addAngularTemplates = function() {
			var templates = _documentRoot.querySelectorAll('template[type="text/ng-template"]');
			for(var i = 0; i < templates.length; i++){
				getHelper('$templateCache').put(templates[i].id, templates[i].innerHTML);
			}
		};

		/**
		 * compiles a String with angular's compile and a new scope.
		 * @memberOf aigTim.template
		 * @param  {HTMLString|documentFragment} element
		 * @param  {Object} [scope] an angular scope to use for the compiled element
		 * @return {Template} the compiled element
		 */
		var compile = function(element, scope) {
			var template = _compile.call(element, scope);
			return template;
		};

		/**
		 * get a HTML template by name, compiled with angular's $compile
		 * @memberOf aigTim.template
		 * @param  {string} name the ID of the template to obtain
		 * @return {Template} the template
		 */
		var get = function(name){
			_.log("Get Template: " + name);
			var node = _documentRoot.querySelector(name);
			if(node === null) return console.error("Template not found");

			var content = node.content;

			if(typeof node === 'undefined') {
				var temp = document.createElement('template');
				temp.innerHTML = _documentRoot.querySelector(name).innerHTML;
				content = temp.content;
			}

			var template = document.importNode(content, true);
			template.getDom = _getDom;
			template.compile = _compile;

			return template;
		};

		return {
			setDocumentRoot: setDocumentRoot,
			getDocumentRoot: getDocumentRoot,
			get: get,
			compile: compile,
			addAngularTemplates: addAngularTemplates
		};

	})();

	/**
	 * creates a dismissable popup to show a message for the user
	 * @function popup
	 * @memberOf aigTim
	 * @param  {Node | String} html
	 * a [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node) containing content of the popup
	 * or a (HTML-)String
	 */
	_.popup = function(html){
		var popup = _.template.get('#aig-popup').compile().getDom();

		if(typeof html === 'string') popup.querySelector('.content').innerHTML = html;
		else popup.querySelector('.content').appendChild(html);

		return _.modal(popup);
	};

	_.page = function(html){
		var page = _.template.get('#aig-page').getDom();

		if(typeof html === 'string') page.innerHTML = html;
		else page.appendChild(html);

		return _.modal(page);
	};

	/**
	 * creates a modal
	 * @param  {Object | Node} html a Node or a Object containing options for $uibModal
	 */
	_.modal = function(html) {
		var modal,
			$uibModal = getHelper('$uibModal');

		if(typeof html.template == 'undefined' && typeof html.templateUrl == 'undefined'){
			html = {
				template: html
			};
		}

		if($uibModal) {
			if(!html.controller){
				html.controller = function($scope){
					$scope.close = modal.close;
				};
				html.controller.$inject = ['$scope'];
			}
			modal = $uibModal.open(html);
		} else {
			modal = html.template;
			//define close function, is done by uibModal in ng1
			modal.close = function(){
				document.querySelector('body').removeChild(modal);
			};
			if(typeof modal.scope != 'undefined'){
				modal.scope.close = modal.close;
			}
			document.querySelector('body').appendChild(modal);
		}

		//wrap close function to remove class from body
		var oldClose = modal.close;
		modal.close = function(){
			document.querySelector('body').classList.remove('page-open');
			oldClose();
		};

		document.querySelector('body').classList.add('page-open');
		//remove modal on navigation
		window.addEventListener('pushState', function(e){
			console.log("state", e);
			modal.close();
		}, {
			once: true
		});

		return modal;
	};

	/**
	 * @namespace script
	 * @memberof aigTim
	 */
	_.script = {
		add: addScript,
		addWithOwnRoute: addScriptWithOwnRoute
	};
	/**
	 * @namespace helper
	 * @memberof aigTim
	 * @type {Object}
	 */
	_.helper = {
		add: addHelper,
		get: getHelper
	};

	return _;

})();
