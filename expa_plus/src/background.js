/* 
 * --------------------------------------------------
 * Keep list of tabs outside of request callback
 * --------------------------------------------------
 */
var tabs = {};

// Get all existing tabs
chrome.tabs.query({}, function(results) {
    results.forEach(function(tab) {
        tabs[tab.id] = tab;
    });
});

var settings;
function syncSettings() {
	chrome.storage.sync.get(['mockApi', 'mockServer'], function(items) {
		settings = items;
	});	
}
syncSettings();
chrome.storage.onChanged.addListener(syncSettings);




// Create tab event listeners
function onUpdatedListener(tabId, changeInfo, tab) {
    tabs[tab.id] = tab;
}
function onRemovedListener(tabId) {
    delete tabs[tabId];
}

// Subscribe to tab events
chrome.tabs.onUpdated.addListener(onUpdatedListener);
chrome.tabs.onRemoved.addListener(onRemovedListener);


/* 
 * --------------------------------------------------
 * Request callback
 * --------------------------------------------------
 */
chrome.webRequest.onBeforeRequest.addListener(
	(details)=>{
		if(settings.mockApi && details.url.indexOf('gis-api.aiesec.org') > -1) {
			redirectUri = details.url
			.replace('gis-api.aiesec.org', 'gis-api.aiesec.dev')
			.replace('v2/', '');
			return {redirectUrl: redirectUri};
		}

		if(settings.mockServer && (details.url.indexOf('experience.aiesec.org') > -1 
			|| details.url.indexOf('cdn-expa.aiesec.org') > -1) ) {
			redirectUri = details.url
			.replace('experience.aiesec.org', 'experience.aiesec.dev')
			.replace('cdn-expa.aiesec.org', 'experience.aiesec.dev');
			return {redirectUrl: redirectUri};
		}
		
	},
	 {urls: ["*://*.aiesec.org/*"]}, //filter
	['blocking'] //opt_info
);


chrome.webRequest.onHeadersReceived.addListener(
 	(details) => {
 		if(!settings.mockServer) return;
 		for (var i = details.responseHeaders.length - 1; i >= 0; i--) {
 			if(details.responseHeaders[i].name == "Access-Control-Allow-Origin") {
 				details.responseHeaders[i].value = "*";
 			}
 		}
 		
	    return {responseHeaders: details.responseHeaders};
 	},
    {urls: ["*://*.aiesec.de/*"] },
    ["blocking", "responseHeaders"]
);