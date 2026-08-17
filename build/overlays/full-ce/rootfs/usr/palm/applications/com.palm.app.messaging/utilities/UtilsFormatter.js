//Formatter Utilities for the Messaging App
//Holds the enyo g11n formatter object here so it doesn't have to be created and GC'ed
//all the time

Utils = {};


//Pre-creating default formatter with respect to system region and time settings
Utils._shortTimeFmt = new enyo.g11n.DateFmt({time: "short"});
Utils._shortDateFmt = new enyo.g11n.DateFmt({date: "short"});


//format short time
Utils.formatShortTime = function(date){
	if (!date){
		return "";
	}
	
	return Utils._shortTimeFmt.format(date);
};

//format short date
Utils.formatShortDate = function(date){
	if (!date){
		return "";
	}
	
	return Utils._shortDateFmt.format(date);
};