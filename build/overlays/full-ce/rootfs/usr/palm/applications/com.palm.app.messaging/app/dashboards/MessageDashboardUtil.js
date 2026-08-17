/**
 * A utility class that merges the new layers into existing layers.  The new layers
 * that are passed into this class should be ordered so that the layer with the
 * oldest message is placed at the beginning of the list and the layer with the 
 * newest message is at the end.
 * 
 * After all the layers are merged, the layers that are set into dashboard are 
 * ordered by read revision.  The layer with the latest read revision, which is
 * the latest message, will be placed at the end of the list.  The layer with oldest 
 * read revision will be at the beginning of the list.
 * 
 * Each layer in dashboard represents a chat thread.  When the chat thread is 
 * not found in the existing dashboard layers, the layer with new chat thread is
 * added to the end of the list immediately.  When there are multiple new
 * messages are sent to a chat thread, these new messages are merged into one single 
 * layer.  A counter will be used to indicate how many new messages are in the 
 * layer this chat thread.  And the layer will show the latest message text.    
 */
enyo.kind({
	name: "MessageDashboardUtil",
	addLayers: function(dashboard, newLayers) {
		if (newLayers) {
			try {
				var currentLayers = dashboard.getLayers() || [];
				for (var i = 0; i < newLayers.length; i++) {
					var layer = newLayers[i];
					if (enyo.messaging.message.isMMSMessage(layer._message)) {
						// update layer's title and text for MMS message layer
						layer = this.getMMSMessageLayer(layer);
					}
					
					this.pushLayer(currentLayers, layer);
				}
				//TODO: need to hide personal data in the logging below
				//enyo.log("In MessageDashboard, new layers in dashboard", currentLayers);
				dashboard.setLayers(currentLayers);
			} catch (e) {
				// got error, most likely from framework or other logic error
				enyo.error("Unable to add dashboard messages");
			}
		}
	},
	// unit tested functions
	getMMSMessageLayer: function(layer) {
		var mmsLayer = layer;
		mmsLayer._from = mmsLayer.title = layer._from;
		mmsLayer.text = enyo.messaging.message.getMMSDisplayMessage();
		
		return mmsLayer;
	},
	pushLayer: function(currentLayers, layer) {
		var ndx = this.findExistingLayerIndex(currentLayers, layer);
		
		if (ndx === undefined) {
			// this is a new layer
			this.addNewLayer(currentLayers, layer);
		} else {
			enyo.log("******* found existing layer at location ", ndx, " in array of ", currentLayers.length, " elements");
			
			if (layer._message.readRevSet > currentLayers[ndx]._message.readRevSet) {
				// only update existing layer if new layer has a newer timestamp
				var newLayer = this.getUpdatedLayer(currentLayers[ndx], layer);
				
				if (ndx !== currentLayers.length - 1) {
					this.moveToLatestLayer(currentLayers, newLayer, ndx);
				} else {
					this.mergeLatestLayer(currentLayers, newLayer, ndx);
				}
			}
		}
	},
	findExistingLayerIndex: function(currentLayers, newLayer) {
		var layer;
		for (var i = 0; i < currentLayers.length; i++) {
			layer = currentLayers[i];
			
			if (enyo.messaging.message.isMMSMessage(newLayer._message) && enyo.messaging.message.isMMSMessage(layer._message)) {
				return i;
			} else {
				newThreads = newLayer._message.conversations;
				existingThreads = layer._message.conversations;
				
				//enyo.log("******* is new layer ", newLayer, " a mms message: ", enyo.messaging.message.isMMSMessage(newLayer._message));
				//enyo.log("******* do current layer ", layer._message._id, " and new layer ", newLayer._message._id, " have same threads: ", this.areThreadsMatched(existingThreads, newThreads));
				
				// The same thread with sms and mms messages are not considered 
				// as the same layer in dashboard.  They are placed in two separate
				// layers.  Based on the current design, all MMS messages are always  
				// placed in the same layer.
				if (!enyo.messaging.message.isMMSMessage(newLayer._message) && this.areThreadsMatched(existingThreads, newThreads, layer, newLayer)) {
					return i;
				}
			}
		}
		
		return undefined;
	},
	areThreadsMatched: function(threads1, threads2, layer1, layer2) {
		if (!threads1 || !threads2) {
			// THIS SCENARIO SHOULD NOT HAPPEN
			// if one of the threads are not defined, then the threads are not matched.
			enyo.warn("Dashboard layer for message ", (!threads1 ? (layer1._message._id + (!threads2 ? (" and " + layer2._message._id) : "")) : layer2._message._id), " doesn't belong to a chat thread.");
			return false;
		} else if (threads1.length === 0 && threads2.length === 0) {
			enyo.warn("Dashboard layer for message ", layer1._message._id, "and ", layer2._message._id, " doesn't belong to a chat thread.");
			// THIS SCENARIO SHOULD NOT HAPPEN
			// if both threads are empty, they are not considered as matched either 
			// since messages in dashboard notification should have an associated chat thread. 
			return false;
		}
		
		var match = threads1.length === threads2.length;
		if (match) {
			for (var n = 0; n < threads1.length && n < threads2.length; n++) {
				if (threads1[n] !== threads2[n]) {
					match = false;
					break;
				}
			}
		}
		
		return match;
	},
	addNewLayer: function(currentLayers, layer) {
		currentLayers.push(layer);
		if (currentLayers.length > 1) {
			this.updateIcon(layer, true);
		}
	},
	moveToLatestLayer: function(currentLayers, newLayer, ndx) {
		// if existing layer is not the last element, we need to 
		// reshavel elements in the array to make the elements sort
		// by timestamp.
		var sortIdx;
		
		enyo.log("*********** move existing layer to the end of the list");
		for (sortIdx = ndx; sortIdx < currentLayers.length && newLayer._message.readRevSet > currentLayers[sortIdx]._message.readRevSet; sortIdx++) {
		}
		// remove existing layer from its original location
		currentLayers.splice(ndx, 1);
		// add it back to the new location
		currentLayers.splice(sortIdx, 0, newLayer);
					
		if (currentLayers.length > 1 && sortIdx > 0) {
			// Always change existing layer to represent multi-layers since 
			// there are more than one layer in the dashbarod.
			this.updateIcon(newLayer, true);
			
			if (ndx === 0) {
				// change the new first element's icon to represent single layer.
				this.updateIcon(currentLayers[0], false);
			}
		}
	},
	mergeLatestLayer: function(currentLayers, newLayer, ndx) {
		this.updateIcon(newLayer, currentLayers.length > 1);
		// layer's position is not changed.
		currentLayers[ndx] = newLayer;
		enyo.log("************* merged latest layer: ", currentLayers[ndx]);
	},
	getUpdatedLayer: function(existingLayer, newLayer) {
		var layer = newLayer;
		
		// increment unread new message count
		layer._messageCount = existingLayer._messageCount + 1;
		// only need to check one of the layers since both layers are representing the same thread or same kind of messages
		if (!enyo.messaging.message.isMMSMessage(existingLayer._message)) {
			layer.title = newLayer._from + " (" + layer._messageCount + ")";
		}
		//enyo.log("In MessageDashboard, updated existing layer: ", layer);
		
		return layer;
	},
	updateIcon: function(layer, isMultiple) {
		if (layer) {
			layer.icon = isMultiple ? "images/notification-large-messaging-mult.png" : "images/notification-large-messaging.png";
		}
	}
});
