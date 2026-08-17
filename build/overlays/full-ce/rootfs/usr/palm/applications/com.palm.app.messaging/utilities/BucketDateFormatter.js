/*global Mojo, $L*/
/* Copyright 2010 Palm, Inc.  All rights reserved. */

BucketDateFormatter = {
	CONST: {
	    LAST_WEEK : $L("Last week"),
	    TWO_WEEKS_AGO : $L("2 weeks ago"),
	    THREE_WEEKS_AGO : $L("3 weeks ago"),
		TOMORROW : $L("Tomorrow"),
	    NEXT_WEEK : $L("Next week"),
	    TWO_WEEKS_FROM_NOW : $L("2 weeks from now"),
	    THREE_WEEKS_FROM_NOW : $L("3 weeks from now"),
	    DAYS_PER_WEEK : 7, 
	    DAY_IN_MS : 1000*60*60*24
	},
	
	// (function included in unit testing)
	createNewDateWithClearedTime: function(d) {
		var newDate = new Date();
		newDate.setTime(d.getTime());
		this.wipeTime(newDate);
		return newDate;
	},
	
	/**
	 * Given a date, this method returns the "bucket" which that date falls into:
	 * 
	 * Buckets are similar to Outlook:
	 * Present: Today 
	 * Past: Yesterday, Day of Week: {Sat - Sun}, Last Week, 2 Weeks Ago, 3 Weeks Ago, 
	 * Month/Year.
	 * Future: Tomorrow, Day of Week: {Sat - Sun}, Next Week, 2 Weeks From Now, 
	 * 3 Weeks From Now, Month/Year
	 * 
	 * @param date
	 * @param appendTime - boolean - true: append the time to date buckets where it makes sense
	 * @param showTodayTimeOnly - boolean - true: when "Today" is encountered, only show the time
	 * @return
	 * 
	 * (function included in unit testing)
	 */  
	getDateBucket: function(date, shouldAppendTime, showTodayTimeOnly) {
		var currentDay = this.createNewDateWithClearedTime(new Date());
		var localDate = this.createNewDateWithClearedTime(date);
		var appendTime = "";
		if(shouldAppendTime) {  
			//appendTime = enyo.date(date,"shortTime");
		}
		
		return this.getDateBucketFromInstant(date, localDate, currentDay, appendTime, showTodayTimeOnly);
	},	
	// (function included in unit testing)
	getDateBucketFromInstant: function(date, localDate, referencePointDate, appendTime, showTodayTimeOnly) {
		var result = "";
		var days;

		var differenceInDays =  Math.floor((this.subtract(referencePointDate.getTime(), localDate.getTime()))/(this.CONST.DAY_IN_MS));
		var differenceInDayOfMonth = Math.abs(referencePointDate.getDate() - localDate.getDate());

		if(differenceInDays == 0 && differenceInDayOfMonth == 0) {
			if (showTodayTimeOnly) {
				result = appendTime;
			} else {
				result = new enyo.g11n.DateFmt().formatRelativeDate(date) + " " + appendTime;
			}

		} else if(differenceInDays > 0 || (differenceInDays == 0 && differenceInDayOfMonth > 0)){
			//the date is in the past
			//if(differenceInDays == 1 || (differenceInDays == 0 && differenceInDayOfMonth > 0)) {
			//	result = new Template($L("#{yesterday} #{time}")).evaluate({yesterday:this.CONST.YESTERDAY,time:appendTime});
			//} else {
				// getDay() 0 to 6 == Sunday to Saturday
				days = referencePointDate.getDay();

				//get the week boundaries - these represent the end of the given week - so lastWeek means
				//that everything before this time was last week.
				var lastWeek = referencePointDate.getTime() - (days*this.CONST.DAY_IN_MS);
				var twoWeeksAgo = referencePointDate.getTime() - ((days + this.CONST.DAYS_PER_WEEK)*this.CONST.DAY_IN_MS);
				var threeWeeksAgo = referencePointDate.getTime() - ((days + (2*this.CONST.DAYS_PER_WEEK))*this.CONST.DAY_IN_MS);
				var oneMonthAgo = referencePointDate.getTime() - ((days + (3*this.CONST.DAYS_PER_WEEK))*this.CONST.DAY_IN_MS);

				//if the localDate is after lastWeek, return the day of the week
				if (this.isAfter(localDate.getTime(), lastWeek) || this.isEqual(localDate.getTime(), lastWeek)){
					result = this.getDayOfWeek(localDate);
				}
				//if we got here, the localDate is before lastWeek so if it's after twoWeeksAgo, return LAST_WEEK
				else if (this.isAfter(localDate.getTime(), twoWeeksAgo) || this.isEqual(localDate.getTime(), twoWeeksAgo)){
					result = this.CONST.LAST_WEEK;
				} 
				//if we got here, the localDate is before twoWeeksAgo so if it's after threeWeeksAgo, return TWO_WEEKS_AGO
				else if (this.isAfter(localDate.getTime(), threeWeeksAgo) || this.isEqual(localDate.getTime(), threeWeeksAgo)){
					result = this.CONST.TWO_WEEKS_AGO;
				}
				//if we got here, the localDate is before threeWeeksAgo so if it's after oneMonthAgo, return THREE_WEEKS_AGO
				else if (this.isAfter(localDate.getTime(), oneMonthAgo) || this.isEqual(localDate.getTime(), oneMonthAgo)){
					result = this.CONST.THREE_WEEKS_AGO;
				}
				//if we got here the localDate is before oneMonthAgo, so return the month, year
				else {
					result = this.getMonthOfYear(localDate);
				}
			//}
		} else {
			//the date is in the future
			if(differenceInDays == -1)//tomorrow
				result = this.CONST.TOMORROW;
			else {
				// getDay() 0 to 6 == Sunday to Saturday
				days = referencePointDate.getDay();

				//get the week boundaries - these represent the start of the given week - so nextWeek means
				//that everything after this time is next week.
				var nextWeek = referencePointDate.getTime() + ((this.CONST.DAYS_PER_WEEK - days)*this.CONST.DAY_IN_MS);
				var twoWeeksFuture = referencePointDate.getTime() + ((this.CONST.DAYS_PER_WEEK - days + this.CONST.DAYS_PER_WEEK)*this.CONST.DAY_IN_MS);
				var threeWeeksFuture = referencePointDate.getTime() + ((this.CONST.DAYS_PER_WEEK - days + 2*this.CONST.DAYS_PER_WEEK)*this.CONST.DAY_IN_MS);
				var oneMonthFuture = referencePointDate.getTime() + ((this.CONST.DAYS_PER_WEEK - days + 3*this.CONST.DAYS_PER_WEEK)*this.CONST.DAY_IN_MS);
				
				//if the localDate is before nextWeek, return the day of the week
				if(this.isBefore(localDate.getTime(), nextWeek)){
					result = this.getDayOfWeek(localDate);
				}
				//if we got here, the localDate is after nextWeek so if it's before twoWeeksFuture, return NEXT_WEEK
				else if (this.isBefore(localDate.getTime(), twoWeeksFuture)){
					result = this.CONST.NEXT_WEEK;
				} 
				//if we got here, the localDate is after twoWeeksFuture so if it's before threeWeeksFuture, return TWO_WEEKS_FROM_NOW
				else if (this.isBefore(localDate.getTime(), threeWeeksFuture)){
					result = this.CONST.TWO_WEEKS_FROM_NOW;
				}
				//if we got here, the localDate is after threeWeeksFuture so if it's before oneMonthFuture, return THREE_WEEKS_FROM_NOW
				else if (this.isBefore(localDate.getTime(), oneMonthFuture)){
					result = this.CONST.THREE_WEEKS_FROM_NOW;
				}
				//if we got here the localDate is after oneMonthFuture, so return the month, year
				else {
					result = this.getMonthOfYear(localDate);
				}
			}
		}
		
		return result ? result.toUpperCase() : result;
	},
	// (function included in unit testing)
	subtract: function(d1, d2) {
		return d1 - d2;    
	},
	// (function included in unit testing)
	isAfter: function(d1, d2) {
		return d1 > d2;
	},
	// (function included in unit testing)
	isBefore: function(d1, d2) {  
		return d1 < d2;
	},
	// (function included in unit testing)  
	isEqual: function(d1, d2) {
		return d1 === d2;
	},  
	// (function included in unit testing)
	wipeTime: function(d) {
		d.setHours(0);
		d.setMinutes(0);
		d.setSeconds(0);
		d.setMilliseconds(0);
	}, 
	// (function included in unit testing)
	isNumber: function(x) {
		return ( (typeof x === typeof 1) && (null !== x) && isFinite(x) );
	},
	// (function included in unit testing)
	getDayOfWeek: function(localDate) {
		var fmt = new enyo.g11n.DateFmt({format: "EEEE"});
		return fmt.format(localDate);
	},
	// (function included in unit testing)
	getMonthOfYear: function(localDate) {
		var fmt = new enyo.g11n.DateFmt({format: "MMMM yyyy"});
		return fmt.format(localDate);
	}
};
