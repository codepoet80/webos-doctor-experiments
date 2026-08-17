enyo.kind({
	name: "DrawerItemOpenStateManager",
	kind: enyo.Object,
	curOpenDrawerItem: null,
	bOpenPreviouslyOpenedItem: true,
	ToggleOpenedDrawerItem: function(inSrc, inbOpened) {		
		if (this.bOpenPreviouslyOpenedItem == false)
			return;

		if (inSrc == this.curOpenDrawerItem || this.curOpenDrawerItem == null) {
			this.setCurOpenDrawerItem(inbOpened ? inSrc : null);
		}
		else if (inSrc != this.curOpenDrawerItem && this.curOpenDrawerItem) {
			if (inbOpened == true) {
				// try and catch around this.curOpenDrawerItem.setOpen to handle the case when the list is refreshed.
				// TODO: Remove the try and catch by resetting
				try { this.curOpenDrawerItem.setOpen(false); } catch (err) { }
				this.setCurOpenDrawerItem(inSrc);
			}
			else {
				this.curOpenDrawerItem = null;
			}
		}
	},
	setCurOpenDrawerItem: function(drawerItem) {
		this.curOpenDrawerItem = drawerItem;
		if (this.curOpenDrawerItem) {
			this.itemId = (this.curOpenDrawerItem) ? this.curOpenDrawerItem.getItemId() : null;
		}
		else {
			this.itemId = null;
		}	
	},
});