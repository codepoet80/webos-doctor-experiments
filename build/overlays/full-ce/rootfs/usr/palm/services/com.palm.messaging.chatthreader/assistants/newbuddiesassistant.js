/*global console, Activity, DBModels, include, Class, App, Mojo, $L, $H, $break, MojoDbIds, clearTimeout, setTimeout, MessagingDB, MessagingUtils, MessagingMojoService, ChatFlags, BucketDateFormatter, CONSTANTS, MojoDB, Future, ContactsLib, Person, PalmCall*/
/*jslint white: false, onevar: false, nomen:false, plusplus: false*/

/*
 * This assistant is needed to link new buddies to their respective record in com.palm.person. 
 * This assistant looks for records with an empty displayName field.  If it finds one, it will
 * look up the person for it and update the personId and displayName.  This assistant will also
 * take care of the situation where a person doesn't have a displayName and is returning an
 * empty string.  In that case, the account username will be used as the displayName.
 */
var NewBuddiesCommandAssistant = Class.create({
    run: function(future) {
		console.log("Starting NewBuddiesCommandAssistant");
		var buddy = {};
		
		// Query for imbuddystatus records with an empty displayName
		future.now(this, function(future) {
			future.nest(DBModels.BuddyStatus.findNewBuddies());
		});

		// Retrieved a list of imbuddystatus records
		future.then(this, function(future) {
			var results = future.result ? future.result.results : [];
			if( results.length > 0 ) {
				buddy = results[0];
				var params = {
					personType:ContactsLib.PersonType.RAWOBJECT,
					returnAllMatches: true
				};
				future.nest(Person.findByIM(buddy.username, buddy.serviceName, params));
			} else {
				future.result = [];
			}
		});
		
		future.then(this, function(future) {
			if (future.result.length > 0) {
				if (future.result.length > 1) {
					console.warn("NewBuddiesCommandAssistant.findNewBuddies "+future.result.length+" persons. Need to deal with this case!");
				}
				// For now just assume it is the first person
				var person = future.result[0];
				future.nest(DBModels.BuddyStatus.updateFromPerson(buddy, person));
				//Also update the buddy object with the personId so it can be used later
				buddy.personId = person._id;
			} else {
				// no person yet exists for this buddy. We'll assume the contact.plugin will handle this.
				// but just to make sure, update the name so it isn't blank to prevent continually firing
				// the watch.
				var dummyPerson = {nickname:buddy.username || ".", name:{familyName: "", givenName: ""}};
				future.nest(DBModels.BuddyStatus.updateFromPerson(buddy, dummyPerson, true));
			}
		});
		
		// Need to make it update the personAvailability to handle the case where the buddy is
		// one of several buddies associated with a person.
		future.then(this, function(future) {
			future.nest(DBModels.BuddyStatus.updatePersonAvailability(buddy));
		});
	},

	// Complete the activity with restart
	complete: function(activity) {
		var restartParams = {
			activityId: activity._activityId,
			restart: true
		};
		return PalmCall.call(activity._service, "complete", restartParams);
	}
});
