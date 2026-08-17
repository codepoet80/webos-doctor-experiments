enyo.kind({
	name: "BaseList",
	kind: "Repeater",
	drawerItemOpenStateMgr: null,

	create: function() {
		this.inherited(arguments);
		this.drawerItemOpenStateMgr = new DrawerItemOpenStateManager();
	},
	destroy: function() {
		this.drawerItemOpenStateMgr = null;
		this.inherited(arguments);
	},

	onDrawerStateChanged: function(inSrc, inbOpened) {
		inSrc.parent.parent.drawerItemOpenStateMgr.ToggleOpenedDrawerItem(inSrc, inbOpened);
	},
	
	getLastOpenedDrawerItemId: function() {
		return this.drawerItemOpenStateMgr.itemId;
	},
});
