(function($){

	$.whenAll = function(deferreds){
		var defs = deferreds.map(function(def) {
		    var deferred = $.Deferred();
		    $.when(def).always(deferred.resolve);
			return deferred;
		});
		return $.when.apply($, defs);
	};

})(jQuery);