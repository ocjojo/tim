/**
 * helper for noob
 * provides some higher level functions so you do not have to deal with accessTokens, etc.
 * @module noob
 * @implements Helper
 */
(function(tim, $){
	var _ = {},
		_name = 'noob';

	/**
	 * initialzes the helper
	 * with some basic values
	 * @function init
	 * @static
	 */
	_.init = function(utility){
		var accessToken;
		if(window.location.href.split('/')[2] == "aiesec.org"){
			var cookie = utility.getCookie('aiesec_token');
			var json = JSON.parse(cookie);
			accessToken = json.token.access_token;
		} else {
			accessToken = tim.helper.get('UserToken').getToken();
		}
		api = tim.helper.get('ajax').newApi(
			tim.config.noob.base,
			accessToken
		);
		_.get = api.get;
		_.post = api.post;
		_.patch = api.patch;
		_.delete = api.delete;
		_.getAccessToken = api.getAccessToken;
	};
	_.init.$inject = ['utility'];

	/**
	 * get the name of the helper
	 * @function getName
	 * @static
	 * @return {string} the helper name
	 */
	_.getName = function(){
		return _name;
	};

	/**
	 * send GET request to NOOB
	 * @function get
	 * @static
	 * @param  {string} url [url = `https://noob.aiesec.de/ + url`] if no base provided
	 * @param  {Object} [data = {}] the data to send
	 * @param  {Object} [hiddenLoader = false] hide the loader
	 * @return {Object} [jQuery.Deferred()](https://api.jquery.com/category/deferred-object/)
	 */

	/**
	 * send POST request to NOOB
	 * @function post
	 * @static
	 * @param  {string} url [url = `https://noob.aiesec.de/ + url`] if no base provided
	 * @param  {Object} [data = {}] the data to send
	 * @param  {Object} [hiddenLoader = false] hide the loader
	 * @return {Object} [jQuery.Deferred()](https://api.jquery.com/category/deferred-object/)
	 */

	/**
	 * send PATCH request to NOOB
	 * @function patch
	 * @static
	 * @param  {string} url [url = `https://noob.aiesec.de/ + url`] if no base provided
	 * @param  {Object} [data = {}] the data to send
	 * @param  {Object} [hiddenLoader = false] hide the loader
	 * @return {Object} [jQuery.Deferred()](https://api.jquery.com/category/deferred-object/)
	 */

	/**
	 * get the access_token
	 * @function getAccessToken
	 * @static
	 * @return {string} the token
	 */

	/**
	 * add self to tim as expa ApiHelper
	 */
	tim.helper.add(_);

})(aigTim, jQuery);
