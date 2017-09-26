(function(){
    if(window.aigTimScriptInit) return;
    //only process initScript once
    window.aigTimScriptInit = true;

    var ajaxCallCaught = false;
    var isOp = window.location.href.split('/')[2] == 'aiesec.org';
    var germanLcIds = [713,686,1465,1454,680,708,664,1442,693,678,665,667,677,1448,657,1653,1420,1415,757,1523,1441,699,696,1533,643,1438,1421,1410,1414,1447,60,1520,1394,1484,1440,625,663,1403,648,647,1443,1844, 1596];
    var user;

    /**
     * loads the javascript throuhgh appending to body
     * @param {string} url    the url of the js file
     * @param {function} [onload]  an optional onload function to be run onload event of the js file.
     */
    function addScriptIntoPage(url, onload){
        var jsCode = document.createElement('script');
        jsCode.setAttribute('src',url);
        if(typeof onload == 'function') jsCode.onload = onload;
        document.body.appendChild(jsCode);
    }

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
     * catch calls to window.XMLHttpRequest.open and listen for calls to current_person
     * calls callback with response and sets ajaxCallCaught to true.
     */
    function listenToXHR(callback){
        var oldOpen = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function(method, url){
            if(!ajaxCallCaught && url.match("https://gis-api.aiesec.org/v2/current_person.json")){
                ajaxCallCaught = true;
                var realXHR = this;
                realXHR.addEventListener("readystatechange", function() {
                    if(realXHR.readyState == 4) {
                        callback(realXHR.response);
                    }
                }, false);
            }

            oldOpen.apply(this, arguments);
        };
    }

    /**
     * returns access_token if logged in or "" else
     * @return {string} the access_token
     */
    function getAccessToken() {
        if(isOp) {
            var cookie = getCookie('aiesec_token');
            if(cookie === "") return "";
            var json = JSON.parse(cookie);
            return json.token.access_token;
        } else {
            return getCookie('expa_token');
        }
    }

    /**
     * get country either by catching ajax call to current_user or checking IP address
     * callback to checkCountry
     */
    function getCountry(){
        var accessToken = getAccessToken();
        // if not logged in return
        if(accessToken === "") return;

        listenToXHR(checkCountry);

        //use ip to lookup country, if no ajaxCall to current user caught after 3 secs
        setTimeout(ipBasedLocation, 3000);
        // retry getCurrentPerson simultaneously
        setTimeout(retryGetPerson(accessToken), 3000);
    }

    function ipBasedLocation(){
        addScriptIntoPage('//freegeoip.net/json/?callback=checkCountry');
    }

    // only works on expa, at the moment not necessary for OP
    function retryGetPerson(accessToken){
        return function(){
            // if already caught and just not returned yet, don't make call again
            if(ajaxCallCaught) return;
            if(isOp === true){}
            else {
                xhr = new XMLHttpRequest();
                xhr.open('GET', "https://gis-api.aiesec.org/v2/current_person.json?access_token=" + accessToken);
                xhr.send();
            }
        };
    }

    /**
     * parses the response of the country checks and inits the bookmark with the country
     * may call initBookmark multiple times, with different countries, e.g. if IP is in different country than user home_office
     * @param  {json|string} json json object containing the country or json string containing current_user object
     */
    function checkCountry(json){
        if(typeof json == 'string'){
            user = JSON.parse(json);
            //getUserCountry
            initBookmark(user.person.home_lc.country);

            for(var i = 0; i < user.current_offices.length; i++){
                if(germanLcIds.indexOf(user.current_offices[i].id) > -1) {
                    initBookmark('Germany');
                    return;
                }
            }

            if(typeof user.person == 'object'
                && typeof user.person.home_lc == 'object'
                && user.person.home_lc.id
                && germanLcIds.indexOf(user.person.home_lc.id) > -1){
                initBookmark('Germany');
            }

        } else if(typeof json == 'object' && typeof json.country_name == 'string') {
            initBookmark(json.country_name);
        }
    }
    // make globally available for jsonp callback
    window.checkCountry = checkCountry;

    // call init scripts based on country -> allows for other countries to use similar scripts to tim
    function initBookmark(country){
        switch(country) {
            case "Germany":
                timInit();
                break;
            default:
                break;
        }
    }

    function timInit() {
        //only process timInit once
        if(window.aigTimInit) return;
        window.aigTimInit = true;
        var server = "//bookmarks.aiesec.de/tim/";
        if(window.localDev) {
            console.log("Local Dev Mode");
            server = "//tim.aiesec.dev/";
        }

        function loadTim(){
            addScriptIntoPage(server + 'main.min.js', loadWebComponents);

            var style = document.createElement('link');
            style.setAttribute('rel', 'stylesheet');
            style.setAttribute('href', server + 'style.css');
            document.head.appendChild(style);
        }

        function loadWebComponents(){
            var html = isOp ? 'op.html' : 'expa.html';
            var templates = document.createElement('link');
            templates.setAttribute('rel', 'import');
            templates.setAttribute('href', server + html);
            templates.onload = function(){
                aigTim.template.setDocumentRoot(this.import);
                aigTim.start(user);
                if(typeof user == 'object'){
                    aigTim.helper.get('expa').setUser(user);
                }
            };
            document.head.appendChild(templates);
        }

        //load jQuery on OP
        if(isOp) addScriptIntoPage('https://code.jquery.com/jquery-3.1.1.min.js', loadTim);
        else loadTim();
    }

    if(window.disableTim) return;
    // if dev mode, skip country check and init tim
    if (window.localDev){
        initBookmark('Germany');
    } else {
        getCountry();
    }

})();
