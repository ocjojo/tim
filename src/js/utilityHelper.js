/**
 * utility helper
 * provides some helper functions
 * @module utility
 * @implements Helper
 */
(function(tim, $){
	var _name = 'utility';

	/**
	 * get the name of the helper
	 * @function getName
	 * @static
	 * @return {string} the helper name
	 */
	var getName = function() {
		return _name;
	};

	/**
	 * turn an array-like object in an array
	 * @function objectToArray
	 * @static
	 * @param {Object} object Array-like object to turn to array
	 * @return {Array} the array
	 */
	var objectToArray = function(object) {
		if(!Array.isArray(object)) {
			var tmp = [];
			for(var i in object) {
				tmp.push(object[i]);
			}
			object = tmp;
		}
		return object;
	};

	/**
	 * turn an array in an array-like object using the "key"-property of the contained objects as object key.
	 * if no key is provided the array values are used as object keys, in case they are String or Number.
	 * else the index is used as object key.
	 * @function arrayToObject
	 * @static
	 * @param {Array} array array to turn to object
	 * @param {String} [key] a property name whose value should be used as object key, only applicable, if the array contains objects
	 * @return {Object} the array-like object
	 */
	var arrayToObject = function(array, key) {
		if( !Array.isArray(array) ) return array;
		return array.reduce(function(prev, cur, i){
			if(typeof key !== 'undefined') objectKey = cur[key];
			if(objectKey) {}
			else if (typeof cur == 'string' || typeof cur == 'number') objectKey = cur;
			else objectKey = i;
			prev[objectKey] = cur;
			return prev;
		}, {});
	};

	var arrayContains = function(arr, propName, propVal){
		for(var i in arr) {
			if(arr[i][propName] && arr[i][propName] == propVal) return true;
		}
		return false;
	};

	function getCookie(cname) {
		var name = cname + "=";
		var decodedCookie = decodeURIComponent(document.cookie);
		var ca = decodedCookie.split(';');
		for(var i = 0; i <ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) === 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

	/**
	 * converts an array of objects to csv
	 * @param  {Object} args the data or an object with data and additional config parameters
	 * @param  {string} [args.data] the data to convert
	 * @param  {string} [args.columnDelimiter = ','] the delimiter
	 * @param  {string} [args.lineDelimiter = '\n'] the line delimiter
	 * @return {string}      the csv string
	 */
	function convertArrayOfObjectsToCSV(args) {  
        var result, ctr, keys, columnDelimiter, lineDelimiter, data;

        data = Array.isArray(args) ? args : args.data || null;
        if (data === null || !data.length) {
            return null;
        }

        columnDelimiter = args.columnDelimiter || ',';
        lineDelimiter = args.lineDelimiter || '\n';

        keys = Object.keys(data[0]);

        result = '';
        result += keys.join(columnDelimiter);
        result += lineDelimiter;

        data.forEach(function(item) {
            ctr = 0;
            keys.forEach(function(key) {
                if (ctr > 0) result += columnDelimiter;

                result += item[key];
                ctr++;
            });
            result += lineDelimiter;
        });

        return result;
    }

    
    function downloadCSV(args) { 
        var data, filename, link;
        arr = Array.isArray(args) ? args : args.data || null;

        var csv = convertArrayOfObjectsToCSV({
            data: arr
        });

        if (csv === null) return;

        filename = args.filename || 'export.csv';

        if (!csv.match(/^data:text\/csv/i)) {
            csv = 'data:text/csv;charset=utf-8,' + csv;
        }
        data = encodeURI(csv);

        link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', filename);
        link.click();
    }

	/*
	 * add self to tim as utility Helper
	 */
	tim.helper.add({
		getName: getName,
		objectToArray: objectToArray,
		arrayToObject: arrayToObject,
		arrayContains: arrayContains,
		getCookie: getCookie,
		downloadCSV: downloadCSV
	});

})(aigTim, jQuery);