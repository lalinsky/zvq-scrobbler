function injected() {

	var updateNowPlayingEvent = document.createEvent('Event');
	updateNowPlayingEvent.initEvent('updateNowPlaying', true, true);

	var scrobbleEvent = document.createEvent('Event');
	scrobbleEvent.initEvent('scrobble', true, true);

	function fireEvent(evt, data) {
		var div = document.getElementById('zvq_scrobbler_div');
		div.innerText = JSON.stringify(data);
		div.dispatchEvent(evt);
	}

	var Scrobbler = function() {
	};

	Scrobbler.prototype.onTrackPlay = function(trackId, t) {
		//console.log("onTrackPlay", trackId, t);
		var track = {
			'id': t.id,
			'timestamp': Math.floor(new Date().getTime() / 1000),
			'track': t.name,
			'artist': t.artist,
			'album': t.release,
			'duration': t.duration,
			'trackNumber': t.number
		};
		fireEvent(updateNowPlayingEvent, track);
		this.onTrackStop();
		var delay = Math.min(t.duration * 500, 4 * 60 * 1000);
		s = this;
		this.timerId = setTimeout(function() {
			if (trackId == s.getCurrentTrackId()) {
				fireEvent(scrobbleEvent, track);
			}
		}, delay);
	};

	Scrobbler.prototype.onTrackStop = function() {
		//console.log("onTrackStop");
		if (this.timerId) {
			clearTimeout(this.timerId);
			this.timerId = 0;
		}
	};

	Scrobbler.prototype.getCurrentTrackId = function() {
		var text = document.getElementsByTagName('title')[0].innerText;
		if (text.match(/^► /)) {
			text = text.substring(2);
		}
		return text;
	}

	Scrobbler.prototype.onPlayerChange = function() {
		var isPlaying = z.player.isPlaying();
		//console.log("onPlayerChange", isPlaying, wasPlaying);
		if (isPlaying) {
			var currentTrackId = this.getCurrentTrackId();
			console.log("currentTrackId", currentTrackId);
			if (currentTrackId && (!this.currentTrackId || currentTrackId != this.currentTrackId)) {
				var track = z.player.getCurrentTrack();
				track.artist = currentTrackId.split(" — ")[0];
				this.currentTrackId = currentTrackId;
				this.onTrackPlay(currentTrackId, track);
			}
		}
		else {
			this.onTrackStop();
			delete this.currentTrackId;
		}
	}

	var scrobbler = new Scrobbler();

	function onPlayerChange() {
		setTimeout(function() { scrobbler.onPlayerChange(); }, 500);
	}
	document.getElementsByClassName('topPanel_playerPlayback_playered_name')[0].addEventListener("DOMNodeInserted", onPlayerChange);
	document.getElementsByTagName('title')[0].addEventListener("DOMSubtreeModified", onPlayerChange);
}

var port = chrome.extension.connect({name: "zvq_scrobbler"});

var div = document.createElement('div');
div.id = 'zvq_scrobbler_div';
div.style.display = 'none';
document.body.appendChild(div);

div.addEventListener('updateNowPlaying', function() {
	port.postMessage({'action': 'updateNowPlaying', 'data': JSON.parse(div.innerText)});
});

div.addEventListener('scrobble', function() {
	port.postMessage({'action': 'scrobble', 'data': JSON.parse(div.innerText)});
});

window.addEventListener('load', function() {
	var script = document.createElement('script');
	script.appendChild(document.createTextNode('('+ injected +')();'));
	document.body.appendChild(script);
});

