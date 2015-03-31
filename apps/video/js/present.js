(function(exports) {
  var videodb = new MediaDB('videos', null,
	                         {excludeFilter: /DCIM\/\d{3}MZLLA\/\.VID_\d{4}\.3gp$/});

  var hash = window.location.hash;

  dump('hash: ' + hash);

  var video = JSON.parse(decodeURIComponent(hash.substring(1)));

  var dom = {};
  dom.player = document.getElementById('player');
  dom.videoContainer = document.getElementById('video-container');

  videodb.onready = function() {
  	dom.player.preload = 'metadata';
    if ('name' in video) {
	  videodb.getFile(video.name, function(file) {
	    var url = URL.createObjectURL(file);
	    dump('Video: ' + JSON.stringify(url));
	    dom.player.src = url;
	  });
	} else if ('url' in video) {
       dom.player.src = url;
    }
    //dom.player.play();

    dom.player.addEventListener('loadedmetadata', function onloaded() {
      dump('loadedmetadata');
      dom.player.removeEventListener('loadedmetadata', onloaded);
      VideoUtils.fitContainer(dom.videoContainer, dom.player, 0);
      dom.player.hidden = false;
      dom.player.currentTime = 0;
      dom.player.play();
    });
  };

})(window);


