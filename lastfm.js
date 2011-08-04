LastfmClient = function() {
    this.baseUrl = 'http://ws.audioscrobbler.com/2.0/';
	this.apiKey = '9e67f8f048254916634cb70b6f5a3910';
	this.apiKeySecret = '1e9bdc429a69ba22c7286d8c9687861e';
}

LastfmClient.prototype.getSessionKey = function() {
	return localStorage['lastfmSessionKey'];
}

LastfmClient.prototype.setSessionKey = function(sessionKey) {
	localStorage['lastfmSessionKey'] = sessionKey;
}

LastfmClient.prototype.encodeParams = function(params) {
	params['format'] = 'json';
	params['api_key'] = this.apiKey;
	var keys = [];
	for (var name in params) {
		keys.push(name);
	}
	keys.sort();
	var encoded = [];
	var signature = [];
	for (var i = 0; i < keys.length; i++) {
		var name = keys[i];
		var value = params[name];
		if (name == 'sk') {
			value = this.getSessionKey();
		}
		var encodedValue = encodeURIComponent(value);
		encoded.push(name + '=' + encodedValue);
		if (name != 'format') {
			signature.push(name, value);
		}
	}
	signature.push(this.apiKeySecret);
	encoded.push('api_sig=' + hex_md5(signature.join('')));
	return encoded.join('&');
}

LastfmClient.prototype.sendRequest = function(params, callback) {
	var xhr = new XMLHttpRequest();
	var data = this.encodeParams(params);
	xhr.open("POST", this.baseUrl, true);
	if (callback) {
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				callback(JSON.parse(xhr.responseText));
			}
		}
	}
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send(data);
}

