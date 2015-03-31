/* global BaseModule, BroadcastChannel */
'use strict';

(function() {
  var MultiScreenController = function() {};
  MultiScreenController.SUB_MODULES = [
    'RemoteTouchPanel'
  ];
  MultiScreenController.SERVICES = [
    'remoteTouchStart',
    'remoteTouchMove',
    'remoteTouchEnd'
  ];
  MultiScreenController.EVENTS = [
    'message'
  ];
  BaseModule.create(MultiScreenController, {
    name: 'MultiScreenController',
    DEBUG: true,
    remoteTouchStart: function(evt) {
      var touch = evt.touches[0];
      this.broadcast({
        type: 'touchstart',
        touch: {
          pageX: touch.pageX,
          pageY: touch.pageY,
          identifier: touch.identifier,
          radiusX: touch.radiusX,
          radiusY: touch.radiusY,
          rotationAngle: touch.rotationAngle,
          force: touch.force,
          width: screen.width,
          height: screen.height
        }
      });
    },
    broadcast: function(data) {
      this.bc && this.bc.postMessage(data);
    },
    remoteTouchMove: function(evt) {
      var touch = evt.touches[0];
      this.broadcast({
        type: 'touchmove',
        touch: {
          pageX: touch.pageX,
          pageY: touch.pageY,
          identifier: touch.identifier,
          radiusX: touch.radiusX,
          radiusY: touch.radiusY,
          rotationAngle: touch.rotationAngle,
          force: touch.force,
          width: screen.width,
          height: screen.height
        }
      });
    },
    remoteTouchEnd: function(evt) {
      var touch = evt.changedTouches[0];
      this.broadcast({
        type: 'touchend',
        touch: {
          pageX: touch.pageX,
          pageY: touch.pageY,
          identifier: touch.identifier,
          radiusX: touch.radiusX,
          radiusY: touch.radiusY,
          rotationAngle: touch.rotationAngle,
          force: touch.force,
          width: screen.width,
          height: screen.height
        }
      });
    },
    _start: function() {
      this.bc = new BroadcastChannel('multiscreen');
      this.bc.addEventListener('message', this);
    },
    _handle_message: function(evt) {
      if (evt.data === 'remote-system-started') {
        // window.addEventListener('volumedown', this);
      }
    }
  });
}());