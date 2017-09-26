/**
 * helper for expa
 * provides some higher level functions so you do not have to deal with accessTokens, etc.
 * @module expa
 * @implements Helper
 */
(function(tim, $){
	var _ = {},
		name = 'expa',
		api,
		currentUser,
		ajaxListenerCallbacks = [];

	/**
	 * initialzes the helper
	 * with some basic values
	 * @function init
	 * @static
	 */
	_.init = function(utility){
		var accessToken;
		var serverBase;
		if(window.location.href.split('/')[2] == "aiesec.org"){
			var cookie = utility.getCookie('aiesec_token');
			var json = JSON.parse(cookie);
			accessToken = json.token.access_token;
			serverBase = tim.config.expa.base;
		} else {
			accessToken = tim.helper.get('UserToken').getToken();
			currentUser = tim.helper.get('User');
			serverBase = tim.helper.get('API_BASE');
		}

		var ajax = tim.helper.get('ajax');
		api = ajax.newApi(
			serverBase,
			accessToken
		);
		ajax.addReadystatechangeListener(ajaxListener);

		_.get = api.get;
		_.post = api.post;
		_.patch = api.patch;
		_.delete = api.delete;
		_.getAccessToken = api.getAccessToken;
	};
	_.init.$inject=['utility'];

	var ajaxListener = function(xhr){
		if(xhr.readyState == 4) {
        	for(var i = 0; i < ajaxListenerCallbacks.length; i++) {
        		if(xhr.responseURL.match(ajaxListenerCallbacks[i].route)
        			&& xhr.status == ajaxListenerCallbacks[i].statusCode){
        			// try parsing json
        			try{
        				ajaxListenerCallbacks[i].script.call(this, JSON.parse(xhr.response));
    				// if no json return response itself
        			} catch(e) {
        				ajaxListenerCallbacks[i].script.call(this, xhr.response);
        			}
        		}
        	}
    	}
	};

	/**
	 * send GET request to EXPA
	 * @function get
	 * @static
	 * @param  {string} url [url = `https://gis-api.aiesec.org/v2/ + url`] if no base provided.
	 * Also allows for relative v1 links like `v1/people.json`.
	 * @param  {Object} [data = {}] the data to send
	 * @param  {Object} [hiddenLoader = false] hide the loader
	 * @return {Object} [jQuery.Deferred()](https://api.jquery.com/category/deferred-object/)
	 */

	/**
	 * send DELETE request to EXPA
	 * @function remove
	 * @static
	 * @param  {string} url [url = `https://gis-api.aiesec.org/v2/ + url`] if no base provided.
	 * Also allows for relative v1 links like `v1/people.json`.
	 * @param  {Object} [data = {}] the data to send
	 * @param  {Object} [hiddenLoader = false] hide the loader
	 * @return {Object} [jQuery.Deferred()](https://api.jquery.com/category/deferred-object/)
	 */

	/**
	 * send POST request to EXPA
	 * @function post
	 * @static
	 * @param  {string} url [url = `https://gis-api.aiesec.org/v2/ + url`] if no base provided.
	 * Also allows for relative v1 links like `v1/people.json`.
	 * @param  {Object} [data = {}] the data to send
	 * @param  {Object} [hiddenLoader = false] hide the loader
	 * @return {Object} [jQuery.Deferred()](https://api.jquery.com/category/deferred-object/)
	 */

	/**
	 * send PATCH request to EXPA
	 * @function patch
	 * @static
	 * @param  {string} url [url = `https://gis-api.aiesec.org/v2/ + url`] if no base provided.
	 * @param  {Object} [data = {}] the data to send
	 * @param  {Object} [hiddenLoader = false] hide the loader
	 * @return {Object} [jQuery.Deferred()](https://api.jquery.com/category/deferred-object/)
	 */

	/**
	 * get the name of the helper
	 * @function getName
	 * @static
	 * @return {string} the helper name
	 */
	_.getName = function(){
		return name;
	};

	/**
	 * get the current EXPA User
	 * @function getUser
	 * @static
	 * @return {Object} the EXPA User
	 */
	_.getUser = function() {
		if(!currentUser || !currentUser.id) {
			return api.get('current_person.json');
		} else {
			return $.Deferred().resolve(currentUser);
		}
	};

	_.setUser = function(user){
		currentUser = user;
	};

	/**
	 * get the access_token of the current user
	 * @function getAccessToken
	 * @static
	 * @return {string} the token
	 */

	/**
	 * get EP data from EXPA for the specified IDs.
	 * This function gets Data from the [people.json endpoint](http://apidocs.aies.ec/#!/people/GET_version_people_format_get_1),
	 * so it is faster than {@link expa.getPersonDetailsFromIds}, but contains less detailed information.
	 * Check for yourself which data you need.
	 * @function getPersonsFromIds
	 * @static
	 * @param  {Array | Object} ids the ids to get data for
	 * @param {Object} [filters] object with filters for the [people endpoint](http://apidocs.aies.ec/#!/people/GET_version_people_format_get_1).
	 * filtering for programs might be a good idea to reduce the number of calls.
	 * @return {Object} [jQuery.Deferred()](https://api.jquery.com/category/deferred-object/)
	 */
	_.getPersonsFromIds = function(ids, filters) {
		if(typeof filters !== 'object') filters = {};
		if(Array.isArray(ids) && typeof ids[0].id !== 'undefined') ids = arrayToObject(ids, 'id');
		else if (Array.isArray(ids)) ids = arrayToObject(ids);

		var deferred = $.Deferred();
		filters.per_page = filters.per_page ? filters.per_page : 200;

		var retryAttempts = 0;
		var retry = function(out, pageToGet) {
			tim.popup("EXPA seems slower than usual. We will keep trying a couple of times. But maybe you should come back later.");
			tim.log("Retry page " + pageToGet);
			if(retryAttempts < 10) {
				recFunc(out, pageToGet);
				retryAttempts++;
			} else {
				deferred.reject({
					message: "too many failed get requests"
				});
			}
		};

		//helper function that gets eps page by page and compares to the ids to get
		var recFunc = function(out, pageToGet, expaPage) {
			if(typeof expaPage !== 'undefined') {
				// for each dataset check if id is requested
				// if so add to out and remove from ids to check
				for(var i in expaPage.data) {
					var id = expaPage.data[i].id;
					if(ids.hasOwnProperty(id)) {
						out[id] = $.extend({}, expaPage.data[i], ids[id]);
						delete ids[id];
					}
				}
			}

			//if no more IDs to get data for, call cb with data
			if(!Object.keys(ids).length) return deferred.resolve(out);
			// hardcoded limit to prevent endless loop
			if(pageToGet > 20
				|| (expaPage && expaPage.paging.current_page == expaPage.paging.total_pages))
				return deferred.reject({
				message: "not all IDs found",
				missingIDs: ids,
				found: out
			});
			// get next page
			filters.page = pageToGet;
			api.get('people.json', filters)
			.then(
				recFunc.bind(this, out, pageToGet+1),
				retry.bind(this, out, pageToGet)
			);
		};

		recFunc({}, 1);

		return deferred.promise();
	};

	/**
	 * get EP data from EXPA for the specified IDs.
	 * This function gets Data from the [people/{person_id}.json endpoint](http://apidocs.aies.ec/#!/people/GET_version_people_person_id_format_get_7),
	 * so it is much slower than {@link expa.getPersonsFromIds}, but contains more detailed information.
	 * You cannot call it for more than 50 IDs at once.
	 * Check for yourself which data you need.
	 * @function getPersonDetailsFromIds
	 * @static
	 * @param  {Array | Object} ids the ids to get data for
	 * @return {Object} [jQuery.Deferred()](https://api.jquery.com/category/deferred-object/)
	 */
	_.getPersonDetailsFromIds = function(ids) {
		if(Array.isArray(ids) && typeof ids[0].id !== 'undefined') ids = arrayToObject(ids, 'id');
		else if (Array.isArray(ids)) ids = arrayToObject(ids);

		var deferred = $.Deferred();
		if(Object.keys(ids).length > 100){
			deferred.reject("too many ids");
			return deferred;
		}

		var recoverFailedPerson = function(err){
			tim.log("couldn't get person", ids[i], err);
			ids[i].detailsFailed = true;
			return $.Deferred().resolve([ids[i]]);
		};

		var requests = [];
		for(var i in ids) {
			requests.push(
				api.get('people/' + i +'.json').then(null, recoverFailedPerson)
			);
		}
		$.when.apply($, requests).done(function() {
			for(var i in arguments) {
				var person = arguments[i][0];
				ids[person.id] = $.extend({}, person, ids[person.id]);

			}
			deferred.resolve(ids);
		}).fail(deferred.reject);

		return deferred.promise();
	};

	/**
	 * format DateTime string to 'yyyy-mm-dd'
	 * @function formatDate
	 * @static
	 * @param  {string} date the DateTime string
	 * @return {string | null} the formatted date string
	 */
	_.formatDate = function(date){
		if(date instanceof Date) return date.toISOString().split('T')[0];
		if(typeof date != 'string') return null;
		return date.replace(/T.*/, '');
	};

	/**
	 * add a listener to ajax requests that calls a script on responses for the specified route
	 * @function addAjaxListener
	 * @static
	 * @param {Object} obj containing definition
	 * @param {string} obj.route the route to sniff in ajax calls
	 * @param {function} obj.script function that is called with the ajax response
	 * @param {Integer} [obj.statusCode] the status code for which to return listeners, default: 200
	 */
	_.addAjaxListener = function(obj) {
		if(ajaxListenerCallbacks.indexOf(obj) > -1) return;
		ajaxListenerCallbacks.push(obj);
		obj.statusCode = Number.parseInt(obj.statusCode);
		if(isNaN(obj.statusCode)) obj.statusCode = 200;
	};

	/**
	 * add an infinite scrolling thingy to expa for an ajax route
	 * @function addInfiniteScroll
	 * @static
	 * @deprecated use {@link expa.addAjaxListener} instead
	 * @param {Object} obj containing definition
	 * @param {string} obj.route the route to sniff in ajax calls
	 * @param {function} obj.script function that is called with the ajax response
	 */
	_.addInfiniteScroll = function(obj) {
		_.addAjaxListener(obj);
	};



	/**
	 * retunrs the Name of the LC by the Committee ID
	 * @function getCommitteeById
	 * @static
	 * @param  {int} Expa-ID of the LC
	 * @return {String} Name of the LC
	 */
	_.getCommitteeById = function(committeeId) {
		var committees = {
			'1596': '[MC] AIESEC in Germany',
			'709': '[closed Spring 2014] Rostock',
			'1844': '[closed Spring 2015] Brühl',
			'1433': '[closed Spring 2015] Duisburg-Essenn',
			'625': '[closed Spring 2015] Oldenburg',
			'469': '[closed Spring 2015] ULM',
			'624': '[closed Spring 2015] WUPPERTAL',
			'1465': '[closed Spring 2016] BAMBERG',
			'1653': '[closed Spring 2016] Freiburg',
			'1439': '[closed Spring 2016] TUEBINGEN-REUTLINGEN',
			'713': 'Aachen',
			'686': 'Augsburg',
			'1454': 'Bayreuth',
			'680': 'Berlin HU',
			'708': 'Berin TU',
			'664': 'Bielefeld',
			'1442': 'Bochum',
			'693': 'Bonn',
			'678': 'Braunschweig',
			'665': 'Bremen',
			'667': 'Darmstadt',
			'677': 'Dresden',
			'1448': 'Duesseldorf',
			'657': 'Frankfurt',
			'1420': 'Giessen-Marburg',
			'1415': 'Goettingen',
			'757': 'Halle',
			'1523': 'Hamburg',
			'1441': 'Hannover',
			'699': 'Heidelberg',
			'696': 'Jena',
			'1533': 'Kaiserslautern',
			'643': 'Karlsruhe',
			'1438': 'Kiel',
			'1421': 'Koeln',
			'1410': 'Leipzig',
			'1414': 'Lueneburg',
			'1447': 'Magdeburg',
			'60': 'Mainz-Wiesbaden',
			'1520': 'Mannheim',
			'1394': 'Muenchen',
			'1484': 'Muenster',
			'1440': 'Nuernberg',
			'663': 'Paderborn',
			'1403': 'Passau',
			'648': 'Regensburg',
			'647': 'Stuttgart',
			'1443': 'Wuerzburg'
		};

		return committees[committeeId];
	};

	/*
	 * add self to tim as expa ApiHelper
	 */
	tim.helper.add(_);

})(aigTim, jQuery);
