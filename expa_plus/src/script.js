//init local dev mode
chrome.storage.sync.get(['local'], function(items) {
	if(items.local) {
		var tim = document.createElement('script');
		tim.innerText = 'window.localDev = true;';
		tim.onload = () => {tim.remove();};
		(document.head || document.documentElement).appendChild(tim);
	}
});

//disable tim
chrome.storage.sync.get(['disable'], function(items) {
	if(items.disable) {
		var tim = document.createElement('script');
		tim.innerText = 'window.disableTim = true;';
		tim.onload = () => {tim.remove();};
		(document.head || document.documentElement).appendChild(tim);
	}
});

//init tim locally
chrome.storage.sync.get(['timinit'], function(items) {
	if(items.timinit) {
		let s = document.createElement('script');
		s.src = 'https://tim.aiesec.dev/timInit.js';
		s.onload = () => {s.remove();};
		(document.head || document.documentElement).appendChild(s);
	}
});