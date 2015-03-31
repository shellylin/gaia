'use strict';
(function() {
  function debug(str) {
    window.dump(' -*- System-Remote.js: ' + str + '\n');
  }

  var systemRemote = {
    _started: false,
    hasStarted: function systemRemote_hasStarted() {
      return this._started;
    },

    // The window.screen.width and window.screen.height is not reliable yet.
    // Use this object to get the actual screen width and height.
    screen: {},

    start: function systemRemote_start() {
      debug('---- Starting system remote! ----');
      this._started = true;

      this.cursor = document.getElementById('cursor');

      this.screen.width = this.cursor.offsetLeft * 2;
      this.screen.height = this.cursor.offsetTop * 2;

      this.cursorX = this.centerX = this.screen.width / 2;
      this.cursorY = this.centerY = this.screen.height / 2;

      this.logger = document.getElementById('log');
      this.logger2 = document.getElementById('log2');

      this.bc = new window.BroadcastChannel('multiscreen');
      this.bc.addEventListener('message', this);
      this.bc.postMessage('remote-system-started');

      this.displayId = window.location.hash ? window.location.hash.substring(1)
                                            : undefined;

      this.cursor.style.display = 'none';

      var remoteAppFrame = this.createAppFrame('about:blank', null);
      this.contentBrowser = container.appendChild(remoteAppFrame);
      this.contentBrowser.style.visibility = 'hidden';
    },

    _handle_touchstart: function(data) {
      this._handle_touch(data);
    },

    _handle_touchmove: function(data) {
      this._handle_touch(data);
    },

    _handle_touchend: function(data) {
      this._handle_touch(data);
    },

    _handle_volumedown: function() {

    },

    _handle_touch: function(data) {
      var touch = data.touch;
      var ox = touch.pageX;
      var oy = touch.pageY;
      var ow = touch.width;
      var oh = touch.height;
      var nw = this.screen.width;
      var nh = this.screen.height;
      var ny = nh*oy/oh;
      var nx = ny;
      if (this.DEBUG) {
        this.logger2.innerHTML = 'x='+nx+',y='+ny;
      }
      switch (data.type) {
        case 'touchstart':
          this._startX = nx;
          this._startY = ny;
          this._StartTime = Date.now();
          break;
        case 'touchmove':
          this.updateCursor(nx - this._startX, ny - this._startY);
          break;
        case 'touchend':
          this.cursorX = this.cursorX + nx - this._startX;
          this.cursorY = this.cursorY + ny - this._startY;
          break;
      }

      function dist(x0, y0, x1, y1) {
        var dx = x0 - x1;
        var dy = y0 - y1;
        return Math.sqrt(dx * dx + dy * dy);
      }

      var CLICK_DISTANCE_THRESHOLD = 15;
      var CLICK_TIME_THRESHOLD_MS = 500;

      if (data.type === 'touchend' &&
          dist(this._startX, this._startY, nx, ny) < CLICK_DISTANCE_THRESHOLD &&
          Date.now() - this._StartTime < CLICK_TIME_THRESHOLD_MS) {
        if (this.contentBrowser) {
          this.contentBrowser.sendMouseEvent('mousedown', this.cursorX, this.cursorY, 0, 1, 0);
          this.contentBrowser.sendMouseEvent('mouseup', this.cursorX, this.cursorY, 0, 1, 0);
        }
      }

    },

    updateCursor: function(x, y) {
      this.showCursor();
      x = this.cursorX - this.centerX + x;
      y = this.cursorY - this.centerY + y;
      this.cursor.style.MozTransform = 'translateX(' + x + 'px) translateY(' + y + 'px)';
    },

    showCursor: function() {
      this.cursor.style.display = 'inline-block';
      this.cursor.classList.add('visible');
    },

    handleEvent: function(evt) {
      var container = document.getElementById('container');

      if (typeof evt.data !== 'object') {
        return;
      }

      if ('type' in evt.data) {
        if (this.DEBUG) {
          this.logger.innerHTML = JSON.stringify(evt.data);
        }
        this['_handle_' + evt.data.type](evt.data);
        return;
      }

      debug('this.displayId: ' + JSON.stringify(this.displayId));
      debug('evt.data: ' + JSON.stringify(evt.data));

      if ('displayId' in evt.data &&
          this.displayId !== (evt.data.displayId + '')) {
        debug('This event is for ' + evt.data.displayId + ' but I am '+ this.displayId);
        return;
      }

      var contentURL = evt.data.url;
      var manifestURL = evt.data.manifestURL;

      if (this.contentBrowser) {
        var frameToRemove = this.contentBrowser;
        var remoteAppFrame = this.createAppFrame(contentURL, manifestURL);
        this.contentBrowser = container.appendChild(remoteAppFrame);

        // Remove the previous app until the new frame is loaded to
        // avoid blinking.
        var self = this;
        this.contentBrowser.addEventListener('mozbrowserloadend',
                                             function onloadend() {
          container.removeChild(frameToRemove);
          frameToRemove = null; // Hope this would help clean the garbage faster.
          self.contentBrowser.removeEventListener('mozbrowserloadend', onloadend);
        });

        return;
      }
    },

    createAppFrame: function(url, manifestURL) {
      var remoteAppFrame = document.createElement('iframe');
      remoteAppFrame.setAttribute('id', 'remoteapp');
      remoteAppFrame.setAttribute('remote', 'true');
      remoteAppFrame.setAttribute('mozbrowser', 'true');
      if (manifestURL) {
        remoteAppFrame.setAttribute('mozapp', manifestURL);
      }
      remoteAppFrame.setAttribute('allowfullscreen', 'true');
      remoteAppFrame.setAttribute('style',
        'overflow: hidden; height: 100%; width: 100%; border: none; ' +
        'position: absolute; left: 0; top: 0; right: 0; bottom: 0; ' +
        'max-height: 100%;');
      remoteAppFrame.src = url;
      return remoteAppFrame;
    },

    stop: function shellRemote_stop() {
      this._started = false;
      this.bc && this.bc.close();
    }
  };

  window.onload = function() {
    if (systemRemote.hasStarted() === false) {
      systemRemote.start();
    }
  };
}());
