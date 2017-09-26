(function(tim, $){

	var _ = {},
		cache = {},
		xhrReplaced = false,		
		readystatechangeListener = [],
		openListener = [],
		sendListener = [],
		api,
		xhrCachedProps = ["readyState","response","responseText","responseType","responseURL","status","statusText"];

	_.getName = function(){
		return 'ajax';
	};

	_.init = function(){
		api = _.newApi();
		_.get = api.get;
		_.post = api.post;
		_.patch = api.patch;
		_.delete = api.delete;
	};

	var getListener = function(method, url, ajax, xhr){
		//only listen to GET requests for caching
		if(method.toUpperCase() != "GET") {
			// on other calls clear cache
			_.cleanCache();
			return;
		}

		var oldSend = xhr.send;
		xhr.send = function(data){
			// if no data to send and data in cache, return cached results
			if(!data && cache[url]){
				populateFromCache(xhr, url);

				// if not async return result
				if(typeof ajax == 'boolean' && !ajax) return xhr;
				
				// if async return and emit event
				setTimeout(()=>{
					emitReadystatechangeOn(xhr);
				}, 0);
				return;
			// else if no data, provide annotation for cacheListener to cache the answer
			} else if(!data){
				xhr._cacheResult = true;
			// if data, clean cache
			} else {
				_.cleanCache();
			}
			return oldSend.apply(xhr, arguments);
		};
	};

	var populateFromCache = function(xhr, url){
		tim.log("From cache: " + url);
		// make xhr properties writable
		xhrCachedProps.forEach(prop =>{
			Object.defineProperty(xhr, prop, {
	            writable: true,
	            configurable: true
	        });
		});
		// write from cached object
		$.extend(xhr, cache[url]);
		// fixes bug in zonejs https://github.com/angular/zone.js/commit/1401d60cae10565bba018811250aa29ee015173d#diff-f5e084bcb7c43d977d56c3b791bbca2d
		xhr.removeAttribute = ()=>{};
	};

	var emitReadystatechangeOn = function(xhr){
		// notify readystatechange listeners
		xhr.dispatchEvent(new Event('readystatechange'));
		xhr.dispatchEvent(new Event('load'));
		if(typeof xhr.onreadystatechange == 'function') xhr.onreadystatechange();
		if(typeof xhr.onload == 'function') xhr.onload();
		// invoke zonejs eventtasks
		if(xhr.__zone_symbol__eventTasks) {
			xhr.__zone_symbol__eventTasks.forEach((task)=>{
				if(task.source == "XMLHttpRequest.addEventListener:readystatechange"
					|| task.source == "XMLHttpRequest.addEventListener:load") {
					task.invoke();
				}
			});
		}
	};

	// on successfull requests check, if result can be cached
	var cacheListener = function(xhr){
		if(xhr._cacheResult && xhr.readyState == 4 && xhr.responseURL && xhr.status == 200){
			_.addToCache(xhr);
		}
	};

	_.getCache = function(){
		return cache;
	};

	_.addToCache = function(xhr){
		cache[xhr.responseURL] = {};
		xhrCachedProps.forEach(prop =>{
			cache[xhr.responseURL][prop] = xhr[prop];
		});
		return _;
	};

	_.cleanCache = function(){
		cache = {};
		return _;
	};

	/**
	 * create an api with a given baseUrl
	 * @param  {string} baseUrl the baseUrl to the api
	 * @param  {string} [accessToken] optional accessToken for the api
	 * @return {Object}         containing a get, post, patch and delete function
	 */
	_.newApi = function(baseUrl, accessToken){

		var ajax = function(url, params, hiddenLoader, noCache) {
			if(!hiddenLoader){
				loader.show();
			}
			
			if(url.indexOf('//') < 0){
				if(url.charAt(0) == '/') {
					url = baseUrl + url.substr(1);
				} else {
					url = baseUrl + url;
				}
			}
			
			if(typeof accessToken == 'string'){
				url += '?access_token=' + accessToken;
			}

			if(typeof noCache == 'boolean' && noCache === true){
				delete cache[url];
			}

			return $.ajax(url, params)
			.then(( data, textStatus, xhr )=>{
				// try parsing json
    			try{
    				return $.Deferred().resolve(JSON.parse(data), textStatus, xhr);
				// if no json return response itself
    			} catch(e) {
    				return $.Deferred().resolve(data, textStatus, xhr);
    			}
			})
			.always(function(){
				if(!hiddenLoader){
					loader.hide();
				}
			});
		};

		var methodFunction = function(method){
			return function(url, data, hiddenLoader, noCache){
				var params = {};
				params.data = data;
				params.method = method;
				return ajax(url, params, hiddenLoader, noCache);
			};
		};

		return {
			get: methodFunction('get'),
			post: methodFunction('post'),
			patch: methodFunction('patch'),
			delete: methodFunction('delete'),
			getAccessToken: function(){
				return accessToken;
			}
		};
	};

	/**
	 * loader to display activity
	 */
	var loader = (function() {
		var requestsInProgress = 0,
			modal;

		/**
		 * show the loader (append if necessary)
		 * @memberOf aigTim.loader
		 * @return {aigTim} tim for chaining
		 */
		var show = function(){
			requestsInProgress++;
			if(!modal){
				modal = tim.modal({
					template: tim.template.get('#expa-loader').getDom(),
					backdrop: 'static'
				});
			}
			return tim;
		};
		/**
		 * hide the loader
		 * @memberOf aigTim.loader
		 * @return {aigTim} tim for chaining
		 */
		var hide = function(){
			requestsInProgress--;
			if(modal && requestsInProgress < 1) {
				modal.close();	
				modal = null;
			}
			return tim;
		};
		return {
			show: show,
			hide: hide
		};
	})();

	/**
	 * add a readystatechangelistener to all ajax requests
	 * @param {function} listener a listener called on every readystatechange with the current xhr object
	 */
	_.addReadystatechangeListener = function(listener){
		readystatechangeListener.push(listener);
		return _;
	};

	/**
	 * add a listener for the open function call on all ajax requests
	 * @param {function} listener function receiving (method:string, url:string, ajax:bool, xhr:object)
	 */
	_.addOpenListener = function(listener){
		openListener.push(listener);
		return _;
	};

	/**
	 * add a listener for the send function call on all ajax requests
	 * @param {function} listener function receiving (data:object, xhr:object)
	 * the data with which send is called and the xhr object itself
	 */
	_.addSendListener = function(listener){
		sendListener.push(listener);
		return _;
	};

	var replaceXHR = function() {
		if(xhrReplaced) return;
		xhrReplaced = true;

		var oldSend = window.XMLHttpRequest.prototype.send;
        window.XMLHttpRequest.prototype.send = function(data){
        	var xhr = this;

        	for(let i = 0; i < sendListener.length; i++ ){
        		sendListener[i](data, xhr);
        	}

        	xhr.addEventListener("readystatechange", function(e) {
	        	for(let i = 0;  i < readystatechangeListener.length; i++) {
	        		readystatechangeListener[i](xhr);
	        	}
	        }, false);
        	return oldSend.apply(xhr, arguments);
        };

	    var oldOpen = window.XMLHttpRequest.prototype.open;
	    window.XMLHttpRequest.prototype.open = function(method, url, ajax){
            for(let i = 0;  i < openListener.length; i++) {
        		openListener[i](method, url, ajax, this);
        	}
            return oldOpen.apply(this, arguments);
        };
	};

	/**
	 * add self to tim as ajax ApiHelper
	 */
	tim.helper.add(_);
	replaceXHR();
	_.addOpenListener(getListener);
	_.addReadystatechangeListener(cacheListener);

})(aigTim, jQuery);
