(function(exports) {
  var loaded = false;
  function metadataParserWrapper(file, onsuccess, onerror, bigFile) {
    if (loaded) {
      metadataParser(file, onsuccess, onerror, bigFile);
      return;
    }

    LazyLoader.load(['js/metadata_scripts.js',
                     'shared/js/media/crop_resize_rotate.js'], function() {
      loaded = true;
      metadataParser(file, onsuccess, onerror, bigFile);
    });
  }

  var photodb = new MediaDB('pictures', metadataParserWrapper, {
    version: 2,
    autoscan: false,     // We're going to call scan() explicitly
    batchHoldTime: 2000, // Batch files during scanning
    batchSize: 3         // Max batch size when scanning
  });

  photodb.onready = () => {
    var frame = new MediaFrame('mainframe', true, window.CONFIG_MAX_IMAGE_PIXEL_SIZE);

	//var imageFileName = '/sdcard/downloads/clifflee1000_spring_1_4ba7x9ou_xs5hya1m@2x.jpg.jpeg';
	var hash = window.location.hash;
	var info = decodeURIComponent(hash.substring(1)).split(',');

	dump(JSON.stringify(info));

	var fileinfo = {
	  filename: info[0],
	  metadata: {
	    width: info[1],
	    height: info[2],
	    preview: null,
	    rotation: false,
	    mirrored: false,
	    video: null
	  }
	};

	photodb.getFile(fileinfo.filename, function(imagefile) {
	  if (fileinfo.metadata.video) {
	    // If this is a video, then the file we just got is the poster image
	    // and we still have to fetch the actual video
	    getVideoFile(fileinfo.metadata.video, function(videofile) {
	      frame.displayVideo(videofile, imagefile,
	                         fileinfo.metadata.width,
	                         fileinfo.metadata.height,
	                         fileinfo.metadata.rotation || 0);
	    });
	  }
	  else {
	    // Otherwise, just display the image
	    frame.displayImage(
	      imagefile,
	      fileinfo.metadata.width,
	      fileinfo.metadata.height,
	      fileinfo.metadata.preview,
	      fileinfo.metadata.rotation,
	      fileinfo.metadata.mirrored);
	  }
	});
  }

  exports.isPhone = true; // for MetadataParser.js

})(window);


