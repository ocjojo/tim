/**
 * helper for scope
 * provides some helper functions to access the scope
 * @module scope
 * @implements Helper
 */
(function(tim, $){
	var _name = 'scope';

	/**
	 * get an angular property from the associated scope of an element.
	 * @param  {Object} property    the property
	 * @param  {string} [context] 	an optional css selector string that specifies the dom element with the scope.
	 * if not specified '[ui-view="section"]' and '[ui-view="root"]' will be checked in that order.
	 * @return {Promise} returns a promise that resolves with the property.
	 */
	var get = function(property, context){
		if(typeof context == 'string'){
			context = angular.element($(context)).scope();
		} else if(typeof context != 'object'){
			if($('[ui-view="section"]').length){
				context = angular.element($('[ui-view="section"]')).scope();	
			} else if($('[ui-view="root"]').length){
				context = angular.element($('[ui-view="root"]')).scope();	
			}
		}
		return tim.helper.get('$parse')(property)(context);
	};

	/**
	 * get an angular property from the associated scope of an element.
	 * The element does not yet need to be included in the dom, but will be at some point.
	 * @param  {Object} property    the property
	 * @param  {string} context a css selector string that specifies the dom element with the scope to wait for
	 * @return {Promise} returns a promise that resolves with the property.
	 */
	var	delayedGet = function(property, context){
		var y = $.Deferred();
		if(typeof context != "string") return y.reject("provide context to wait for");

		tim.find(context).then(function(el){
			y.resolve(get(property, angular.element(el).scope()));
		}, y.reject);

		return y;
	};
	/**
	 * add self to tim as expa ApiHelper
	 */
	tim.helper.add({
		getName: function(){
			return _name;
		},
		get: get,
		delayedGet: delayedGet
	});

})(aigTim, jQuery);