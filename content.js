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
		this.timerId = undefined;
	};

	Scrobbler.prototype.onTrackPlay = function(evt) {
		var t = evt.track;
		console.log(t);
		console.log(this.timerId);
		var track = {
			'id': t.id,
			'timestamp': Math.floor(new Date().getTime() / 1000),
			'track': t.name,
			'artist': t.artist.getSimpleName(),
			'album': t.release.name,
			'albumArtist': t.release.artist.getSimpleName(),
			'duration': t.duration,
			'trackNumber': t.number
		};
		fireEvent(updateNowPlayingEvent, track);
		this.onTrackStop();
		var delay = Math.min(t.duration * 500, 4 * 60 * 1000);
		this.timerId = setTimeout(function() {
			var playing = zvqApp.queue.getPlaying();
			var currentTrack = playing.tracksMap[playing.currentTrackUid];
			if (track.id == currentTrack.id) {
				fireEvent(scrobbleEvent, track);
			}
		}, delay);
	};

	Scrobbler.prototype.onTrackStop = function(evt) {
		if (this.timerId) {
			clearTimeout(this.timerId);
			this.timerId = 0;
		}
	};

	var scrobbler = new Scrobbler();

	goog.events.listen(zvqApp.queue, [
		zvq.managers.player.EventType.TRACK_PLAY],
		scrobbler.onTrackPlay, false, scrobbler);
	goog.events.listen(zvqApp.queue, [
		zvq.managers.player.EventType.TRACK_FINISH,
		zvq.managers.player.EventType.TRACK_PAUSE,
		zvq.managers.player.EventType.TRACK_STOP],
		scrobbler.onTrackStop, false, scrobbler);
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

