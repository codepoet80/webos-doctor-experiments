/*global _, console, Activity, DBModels, include, Class, App, Mojo, mapReduce, MojoDbIds, clearTimeout, setTimeout, MessagingDB, MessagingUtils, MessagingMojoService, ChatFlags, BucketDateFormatter, CONSTANTS, MojoDB, Future, PalmCall*/
/*jslint white: false, onevar: false, nomen:false, plusplus: false*/

/*
 * This assistant is needed to update the groupAvailability field in com.palm.imbuddystatus.
 * The groupAvailability field is the concatination of the buddy group with the most available
 * availability of that person across all it's IM accounts.  The app will render and order the 
 * buddy list according to this field.
 */
var ChangedAvailabilityCommandAssistant = Class.create({
    run: function(future) {
		this.revision = this.controller.args.revision || 0;
		console.log("Starting ChangedAvailabilityCommandAssistant rev=" + this.revision);
		
		// Query for changes in availability
		future.now(this, function(future) {
			future.nest(DBModels.BuddyStatus.findNewAvailability(this.revision));
		});

		// Retrieved a list of imbuddystatus records
		future.then(this, function(future) {
			var results = future.result ? future.result.results : [];
			if( results.length > 0 ) {
				var mapFunc = _.bind(this.updateAvailability, this);
				future.nest(mapReduce({map:mapFunc}, results));
			} else {
				console.log("No results imbuddystatus records.");
				future.result = true;
			}
		});
	},

	// Complete the activity with restart
	complete: function(activity) {
		console.info("ChangedAvailabilityCommandAssistant:complete activity " + activity._activityId + ", rev="+this.revision);
		var restartParams = {
			activityId: activity._activityId,
			restart: true,
			trigger: {
				method: "palm://com.palm.tempdb/watch",
				key: "fired",
				params: DBModels.BuddyStatus.getAvailabilityWatchQuery(this.revision)
			},
			callback: {
				method: "palm://com.palm.messaging.chatthreader/changedAvailability",
				params: { revision: this.revision }
			}
		};
		return PalmCall.call(activity._service, "complete", restartParams);
	},
	
	// Loop through each result and update the groupAvailability orderby field
	updateAvailability: function(buddy) {
		if (buddy.availabilityRevSet > this.revision) {
			this.revision = buddy.availabilityRevSet;
		}
		return DBModels.BuddyStatus.updatePersonAvailability(buddy);
	}
});
