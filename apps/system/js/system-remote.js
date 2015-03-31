'use strict';
(function() {
  function debug(str) {
    window.dump(' -*- System-Remote.js: ' + str + '\n');
  }

  var systemRemote = {
    DEBUG: false,
    CURSOR_OFFSET_X: -15,
    CURSOR_OFFSET_Y: -8,
    _started: false,
    hasStarted: function systemRemote_hasStarted() {
      return this._started;
    },

    getCursorX: function(x) {
      return this.cursorX + this.CURSOR_OFFSET_X;
    },

    getCursorY: function(y) {
      return this.cursorY + this.CURSOR_OFFSET_Y;
    },

    start: function systemRemote_start() {
      debug('---- Starting system remote! ----');
      this._started = true;

      this.cursor = document.getElementById('cursor');
      this.cursorX = this.centerX = screen.width / 2;
      this.cursorY = this.centerY = screen.height / 2;
      this.logger = document.getElementById('log');
      this.logger2 = document.getElementById('log2');
      if (this.DEBUG) {
        this.logger.classList.add('visible');
        this.logger2.classList.add('visible');
      }

      this.bc = new window.BroadcastChannel('multiscreen');
      this.bc.addEventListener('message', this);
      this.bc.postMessage('remote-system-started');

      this.displayId = window.location.hash ? window.location.hash.substring(1)
                                            : undefined;
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

    sendMouseMove: function() {
      this.contentBrowser &&
      this.contentBrowser.sendMouseEvent(
        'mousemove', this.getCursorX(), this.getCursorY(), 0, 0, 0);
      window.dispatchEvent(new CustomEvent('mozContentEvent', {
        detail: {
          type: 'mouse',
          detail: ['mousemove', this.getCursorX(), this.getCursorY(), 0, 0, 0]
        }
      }));
    },

    sendMouseUp: function() {
      this.contentBrowser &&
      this.contentBrowser.sendMouseEvent(
        'mouseup', this.getCursorX(), this.getCursorY(), 0, 1, 0);
      window.dispatchEvent(new CustomEvent('mozContentEvent', {
        detail: {
          type: 'mouse',
          detail: ['mouseup', this.getCursorX(), this.getCursorY(), 0, 1, 0]
        }
      }));
    },

    sendMouseDown: function() {
      this.contentBrowser &&
      this.contentBrowser.sendMouseEvent(
        'mousedown', this.getCursorX(), this.getCursorY(), 0, 1, 0);
      window.dispatchEvent(new CustomEvent('mozContentEvent', {
        detail: {
          type: 'mouse',
          detail: ['mousedown', this.getCursorX(), this.getCursorY(), 0, 1, 0]
        }
      }));
    },

    sendTouchEvent: function(data) {
      var touch = data.touch;
      this.contentBrowser &&
      this.contentBrowser.sendTouchEvent(data.type, [touch.identifier],
                                    [this.getCursorX()], [this.getCursorY()],
                                    [touch.radiusX], [touch.radiusY],
                                    [touch.rotationAngle], [touch.force], 1, 0);

      window.dispatchEvent(new CustomEvent('mozContentEvent', {
        detail: {
          type: 'touch',
          detail: [[touch.identifier],
                                    [this.getCursorX()], [this.getCursorY()],
                                    [touch.radiusX], [touch.radiusY],
                                    [touch.rotationAngle], [touch.force], 1, 0]
        }
      }));
    },

    _handle_touch: function(data) {
      var touch = data.touch;
      var ox = touch.pageX;
      var oy = touch.pageY;
      var ow = touch.width;
      var oh = touch.height;
      var nw = screen.width;
      var nh = screen.height;
      var nx = nw*ox/ow;
      var ny = nh*oy/oh;
      switch (data.type) {
        case 'touchstart':
          this._startX = nx;
          this._startY = ny;
          break;
        case 'touchmove':
          this.updateCursor(nx - this._startX, ny - this._startY);
          break;
        case 'touchend':
          this.cursorX = this.cursorX + nx - this._startX;
          this.cursorY = this.cursorY + ny - this._startY;
          var deltaX = Math.abs(nx - this._startX);
          var deltaY = Math.abs(ny - this._startY);
          
          if (this.contentBrowser && deltaX <= 5 && deltaY <= 5) {
            this.sendMouseMove();
            this.sendMouseDown();
            this.sendMouseUp();
          }
          break;
      }
      this.sendTouchEvent(data);
    },

    updateCursor: function(x, y) {
      this.showCursor();
      x = this.cursorX - this.centerX + x;
      y = this.cursorY - this.centerY + y;
      this.cursor.style.MozTransform = 'translateX(' + x + 'px) translateY(' + y + 'px)';
    },

    showCursor: function() {
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

      var remoteAppFrame = this.createAppFrame(contentURL, manifestURL);
      this.contentBrowser = container.appendChild(remoteAppFrame);
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
