(function(tim){

	var _ = {};
	ajax = tim.helper.get('ajax');

	_.getName = function(){
		return "sync";
	};

	_.init = function(){
		ajax.addOpenListener(catchPatch);
		ajax.addSendListener(logPatch);
	};

	var catchPatch = function(method, url, ajax, xhr){
		if(method != 'PATCH' || !url.match(new RegExp(tim.config.expa.base) )) return;
		console.log("catch patch");
		xhr.isPatch = true;
		xhr.patchUrl = url;
	};

	var logPatch = function(data, xhr){
		if(xhr.isPatch){
			console.log("log patch");
			/*ajax.post('//testspace.aiesec.de/log/', {log:{
				url: xhr.patchUrl,
				data: data
			}});*/
		}
	};

	tim.helper.add(_);

})(aigTim);
