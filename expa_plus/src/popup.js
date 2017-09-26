function save_options() {
	var api = document.getElementById('api').checked;
	var server = document.getElementById('server').checked;
	var local = document.getElementById('local').checked;
	var timinit = document.getElementById('timinit').checked;
	var disable = document.getElementById('disable').checked;

	chrome.storage.sync.set({
		"mockApi": api,
		"mockServer": server,
		"local": local,
		"timinit": timinit,
		"disable": disable
	});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
	chrome.storage.sync.get(['mockApi', 'mockServer', 'local', 'timinit', 'disable'], function(items) {
		document.getElementById('api').checked = items.mockApi;
		document.getElementById('server').checked = items.mockServer;
		document.getElementById('local').checked = items.local;
		document.getElementById('timinit').checked = items.timinit;
		document.getElementById('disable').checked = items.disable;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('api').addEventListener('change', save_options);
document.getElementById('server').addEventListener('change', save_options);
document.getElementById('local').addEventListener('change', save_options);
document.getElementById('timinit').addEventListener('change', save_options);
document.getElementById('disable').addEventListener('change', save_options);
