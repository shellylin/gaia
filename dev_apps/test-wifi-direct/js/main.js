'use strict';

(function() {
  var list = document.querySelector('section ul');
  var listView = new WifiP2pPeerListView(list);
  var wifiP2pManager = new WifiP2pManager(listView);

  wifiP2pManager.init();
}());
