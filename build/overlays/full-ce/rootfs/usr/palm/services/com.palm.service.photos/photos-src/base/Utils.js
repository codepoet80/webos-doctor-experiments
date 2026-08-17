/*global  require: true*/
/*global console: true*/ 
/*global Promise: true*/
/*global taskHash: true */
/*global serviceHandle: true */
/*global Params: true */
/*global exports: true */
/*global PromiseSet: true */
/*global AccountsCapability: true */
/*global Capability: true */
/*global globalCachePromise: true */
/*global AccountsManager: true */
/*global deleteDirOrFile: true */
/*global ERROR: true */
//for jasmine
var Params =exports.Params;
var ImageFormats =exports.ImageFormats;
var Promise = exports.Promise;
if(!Params){
	Params = require('base/Params').Params;
}
if(!ImageFormats)
{
	ImageFormats =require('base/Params').ImageFormats;
}
if(!Promise)
{
	Promise= require('base/Promise').Promise;
}


var node_fs = require('fs');
var node_path = require('path');
var node_http = require('http');
var node_url = require('url');
var CACHE_PATH="/media/internal/.photosApp/";


/*
 * General Utility Calls
 */


//Should be called when a failure occurs
function clearAllDashboardNotifications(callback){
	console.log("* # * # * # * # * calling clearAllDashboardNotifications * # * # * # * #");
	
	var accList = AccountsManager.getAccountsList();
	var accIds = [];

	for (var accId in accList){
		if (accId !== "local")
			accIds.push(accId);
	}
	console.log("* * * * * * Available Account Ids "+ JSON.stringify(accIds)+" * * * * * * ");
	var deleteNotificationForAccount = function(response){
		if (response){
			console.log("* * * * * * * clearAllDashboardNotifications Responses "+ JSON.stringify(response));
		}
		
		if (accIds.length > 0){
			var currAccId = accIds.pop();
			console.log("Attempting To Remove Notification for "+ accList[currAccId].username + " for accountType " + accList[currAccId].templateId);
			var rmNotifications = serviceHandle.request(
					'com.palm.tempdb/del',{'query': {'from':'com.palm.account.syncstate:1', 'where':[{'prop':'accountId','op':'=','val':currAccId}]}},
					deleteNotificationForAccount
				);
		}
		else if (callback){
			console.log("* * * * * * * * * clearAllDashboardNotifications complete callback called * * * * * * * *");
			callback();
		}
		else {
			console.log("* * * * * * * * * clearAllDashboardNotifications complete No callback provided * * * * * * * *");
		}
	};
	
	deleteNotificationForAccount();
}

function parseUrl(url,urlObj)
{
	var parsedUrl =node_url.parse(url, false);
	urlObj.host = parsedUrl.hostname;
	urlObj.path = parsedUrl.pathname;
	var ind= url.lastIndexOf('/');
	urlObj.fileName = url.substr(ind+1);

}

function getFileName(url)
{
	var ind;
	var finalInd = url.lastIndexOf('/');
	ind =finalInd;
	var ind1=url.lastIndexOf('-');
	if(ind1 >ind)
	{
		finalInd =ind1;
	}
	return url.substr(finalInd+1);
	
}

function reportRdxLog(cause,detail,file)
{
	//file is a mandatory parameter. otherwise
	//rdx_reporter will wait for stdin input.
	var promise = Promise();
	var component ="com.palm.service.photos";
	var causeMsg = cause; //keep this short <mandatory>
	var detailMsg = detail; //keep this short <mandatory>
	var filePath =file; //put all elaborate logging into this file <mandatory> 
	
	var spawn = require('child_process').spawn;
	var rdx_report  = spawn('rdx_reporter', ['-C',component,'-c',causeMsg,'-d',detailMsg ,'-f',filePath]);
	
	rdx_report.on('exit', function (code) {
	
		if (code !== 0) {
			console.info("Error in rdx Reporting:"+code);
			//we attempted reporting atleast
			promise.fulfill(true);
		}
		else {
			//reported the problem
			promise.fulfill(true);
		}
	});
	
	return promise;
}

function getModificationTimeForFileOrDir(path){
	var promise = Promise();
	node_fs.stat(path,function(err,stats){
		
		var parseStatTime = function(stat_time){
			var arr_utc_date;
			try {
				if (stat_time)
					arr_utc_date = [stat_time.getUTCFullYear(), stat_time.getUTCMonth(), stat_time.getUTCDate(), stat_time.getUTCHours(),
					    stat_time.getUTCMinutes(), stat_time.getUTCSeconds()];
				else
					throw "stat_time is falsy";
			}
			catch(e){
				var D = new Date();
				arr_utc_date = [D.getUTCFullYear(), D.getUTCMonth(), D.getUTCDate(), D.getUTCHours(),
				    D.getUTCMinutes(), D.getUTCSeconds()];
				console.info("Exception: "+JSON.stringify(e));
			}
			return Math.floor(((new Date(arr_utc_date[0], arr_utc_date[1], arr_utc_date[2], arr_utc_date[3],arr_utc_date[4], arr_utc_date[5]).getTime())/1000));
		};
		
		if (err)
			console.log("Error: Parsing UTC Time of album "+JSON.stringify(err));

		promise.fulfill(parseStatTime(err ? false :stats.mtime));
	});
	
	return promise;
}

function _dbFind(query_params, callback){
	var find_promise = Promise();
	var results = [];
	
	var findResponse = function(response){
		if (response.returnValue){
			console.log("*#*#**#*#*#*# _dbFind successful");
			results = results.concat(response.results);
			if (response.next){
				query_params.query.page = response.next;
				find_func();
			}
			else {
				response.results = results;
				callback(response);
			}
				
		}
		else {
			console.log("*#*#**#*#*#*# _dbFind Failed");
			callback(response);
		}
	};
	
	var find_func = function(){
		var findReq = serviceHandle.request(
				'com.palm.db/find',
				 query_params,
				 findResponse
		);
	};
	
	find_func();
	
}

// The DB Merge must happen synchronously otherwise there's a slim possibility of a race condition
// 1) If we respond to a service shutdown request before the account albums are marked
function markAllAlbumsForRemoval(accountId)
{
	var mergePromise = Promise();
	//Merge all albums for removal
	var mergeResponse = function(response)
	{
		if(response.returnValue)
		{
			console.info("***** Successfully Marked Albums for removal");
			mergePromise.fulfill(true);
		}
		else
		{
			console.info("***** Failed to Mark Albums for removal");
			mergePromise.breakk("Unable to Merge");
		}
	};
	var albReq = serviceHandle.request(
			'com.palm.db/merge',
			{
				'props':{"toBeDeleted":true},
				'query': {
					'from':'com.palm.media.image.album:1', 
					'where':[{'prop':'accountId','op':'=','val':accountId}]
				}
			},
			mergeResponse
		);
	return mergePromise;
}

function getRemoteSyncType(templateId)
{
	var ind =templateId.lastIndexOf('.');
	return templateId.substr(ind+1);
}

function generateBigImageCachePath(type)
{
	//we changed to download big images always on intial sync so wedonot
	//want to create a new directory with the type
	//for bug-/DFISH-6555
	return CACHE_PATH+"/Generated/";
}

function generateExtractFsUrl(path,width,height,type,optionalFormat,optionalCropMode)
{
	//construct the extractfspath
	// bitmaps:
	// /var/luna/data/extractfs/[full path]:[offset]:[size]:[width]:[height]:[crop]
	// jpegs:
	// /var/luna/data/extractfs/[full path]::3:[original_width]:[original_height]:[h_padding]:[v_padding]:[output_format]:[offset]:[size]:[width]:[height]:[crop]
	//using offset and size to be 0 to force extractfs to use the full image
	// There are currently 6 formats accepted by extractfs:
	//		REQUEST_FORMAT_BITMAP = 0,
	//		REQUEST_FORMAT_JPEG = 1,
	//		REQUEST_FORMAT_PNG = 2,
	//		REQUEST_FORMAT_JSON = 3,
	//		REQUEST_FORMAT_IDENTITY = 4,
	//		REQUEST_FORMAT_JPEG_FORCE_BILINEAR = 5,
	// extractfs also supports 3 crop modes (grep the extractfs source for more details):
	//		CONVERT_RESIZE_OUTSIDE_FAST = 2
	//		CONVERT_RESIZE_INSIDE = 3
	//		CONVERT_RESIZE_OUTSIDE = 4
	//@todo need to get the right image size from a preference
	
	if(!path)
	{
		//this may be the case when video entry has no thumbnail embedded
		return null;
	}
	
	var embeddedOffset = 0;
	var embeddedLength = 0;
	var outputFormat = 0; // bitmap by default
	var realPath = path;
	var cropMode = optionalCropMode || 3;  // use CONVERT_RESIZE_INSIDE by default
	
	var format = optionalFormat || Params.THUMBNAIL_FORMAT;  // use default if none is specified.

	// Determine extractfs output format
	switch(format) {
		case ImageFormats.FORMAT_JPEG:
			outputFormat = 5; // REQUEST_FORMAT_JPEG_FORCE_BILINEAR
			break;
		case ImageFormats.FORMAT_BITMAP:
			outputFormat = 0; // REQUEST_FORMAT_BITMAP
			break;
		case ImageFormats.FORMAT_JSON:
			outputFormat = 3; // REQUEST_FORMAT_JSON
			break;						
		default:
			throw new Error("Unknown format:"+format);		
	}

	// If it's a video, we munge through the path to find the embedded-thumbnail offset/length.
	if(type==="video") {
		var fInd = path.indexOf(':');
		var lInd = path.lastIndexOf(':');
		realPath = path.substring(0,fInd);
		embeddedOffset = path.substring(fInd+1,lInd);
		embeddedLength =  path.substr(lInd+1);
	}
	realPath = "/var/luna/data/extractfs/" + realPath;
	return [realPath, ":3:0:0:0:0", outputFormat, embeddedOffset, embeddedLength, width, height, cropMode].join(":");
}

function clone(obj){
	if(obj === null || typeof(obj) !== 'object')
	{
        return obj;
    }

    var temp = obj.constructor(); // changed

    for(var key in obj)
    {
		if(obj.hasOwnProperty(key))
		{
			temp[key] = clone(obj[key]);
		}
    }
    return temp;
}

function generateCapabilityForAccounts(promise){

	var accountsCapability={};
	
	//generate a local accounts capability as we always
	//want to have that by default
	
	accountsCapability.local = new Capability();
	//relevant properties
	accountsCapability.local.photoUpload =true; //can add photos to the album
	accountsCapability.local.videoUpload =true; //can add videos to the album
	accountsCapability.local.createAlbum =true;//can create new local albums
	accountsCapability.local.deleteAlbum =true;//can delete albums in local account
	accountsCapability.local.deletePhoto =true;//can delete photos from a local album
	//irrelevant properties for local account- applicable only to remote.
	accountsCapability.local.getAlbums =false;
	accountsCapability.local.getPhotos	=false;
	accountsCapability.local.getCaptions =false;
	accountsCapability.local.addCaption	=false; //add a caption while adding a new photo
	accountsCapability.local.updateCaption=false;
	accountsCapability.local.getComments =false;
	accountsCapability.local.updateComments =false;	
	accountsCapability.local.videoDownload =false;
	accountsCapability.local.getUserInfo =false;
	accountsCapability.local.computeNumFiles=false;
	
	
	var queryReq;

	var request={
			'query': {"from":"com.palm.account:1",
				"where":[{"prop": "capabilityProviders.capability","op": "=","val": ["PHOTO.UPLOAD"]},
				         {"prop": "beingDeleted","op": "=","val": false}
						]},
			'watch' :true
		};
	var accountsReply = function(response){
		if(response.returnValue)
		{
			if(response.fired)
			{
				//once we have fulfilled we donot want to keep fulfilling
				//it for every subscription response that comes back
				//since this is a watch query we must have fulfilled the promise
				//before
				//the reason i am doing here instead after it gets fulfilled is
				//not sure if the promise needs to be alive a little longer after it is 
				//fulfilled for the whenFulFIlled callbacks to happen.
				//@todo revisit this
				
				promise=undefined;
				console.info("response fired");
				queryReq =serviceHandle.requestSubscribe(
						'com.palm.db/find',
						request,
						accountsReply
					);
			}
			else
			{
				var accountsList=[];
				response.results.forEach(function(account){
						accountsCapability[account.templateId]=new Capability();
						switch(account.templateId)
						{
							case "com.palm.facebook":
								accountsCapability[account.templateId].videoDownload=false;
								accountsCapability[account.templateId].serviceName ="com.palm.service.photos.facebook";
		
							break;
							
							case "com.palm.photobucket":
								accountsCapability[account.templateId].getComments    =false;
								accountsCapability[account.templateId].updateComments =false;
								accountsCapability[account.templateId].getUserInfo    =false;
								accountsCapability[account.templateId].serviceName    ="com.palm.service.photos.photobucket";
		
							break;
							
							case "com.palm.snapfish":
								accountsCapability[account.templateId].getComments      =false;
								accountsCapability[account.templateId].updateComments   =false;
								accountsCapability[account.templateId].getUserInfo      =false;
								accountsCapability[account.templateId].addCaption       =false; 
								accountsCapability[account.templateId].videoDownload    =false;
								accountsCapability[account.templateId].serviceName      ="com.palm.service.photos.snapfish";
								accountsCapability[account.templateId].computeNumFiles  =true;
		
							break;
							
							default:
								// Synergy-revival: ANY PHOTO.UPLOAD account not matched by an explicit case
								// above is a cloud connector whose listAlbums/listPhotos live in a bus-registered
								// service com.palm.service.<templateId suffix>. Derive serviceName DYNAMICALLY so
								// a NEW connector needs NO patch here - just ship its com.palm.service.<x>.
								accountsCapability[account.templateId]=new Capability();
								accountsCapability[account.templateId].getComments      =false;
								accountsCapability[account.templateId].updateComments   =false;
								accountsCapability[account.templateId].getUserInfo      =false;
								accountsCapability[account.templateId].videoDownload    =false;
								accountsCapability[account.templateId].deletePhoto     =true;
								accountsCapability[account.templateId].serviceName      =
									account.templateId.replace(/^com\.palm\./, "com.palm.service.");
							break;
						}	
						var accountEntry ={"accountId":account._id,"username":account.username,"templateId":account.templateId};
						//because we will not even get the account with the capability disabled
						//in this accounts list from the db query
						// so the ones that are returned are definitely those with the photo capability enabled.
						accountEntry.isEnabled=true;
					
						accountsList.push(accountEntry);
				});
				//add accounts to the Accounts Manager
				if(accountsList.length>0){
					AccountsManager.addAccount(accountsList);
				}
				AccountsCapability =accountsCapability;
				if(promise)
				{
					promise.fulfill(AccountsCapability);

				}
				console.info("Generated Capability:"+JSON.stringify(AccountsCapability));
			}
			
			
		}
		else
		{
			var msg="ERROR!!!!!!!!!!!! Accounts service returned error while setting up capabilities: "+JSON.stringify(response);
			console.error(msg);
			if(promise)
			{
				promise.breakk(msg);
			}
			AccountsCapability =null;
		}
	};
	try{
		queryReq =serviceHandle.requestSubscribe(
				'com.palm.db/find',
				request,
				accountsReply
			);

	}catch(e){
		var msg ="ERROR!!!!!!!!!!!! Unable to query accounts service for setting up capabilities:"+JSON.stringify(e);
		console.error(msg);
		if(promise)
		{
			promise.breakk(msg);
		}
		AccountsCapability=null;
	}
	
}

/*
 * MojoDb specific calls
 */
function addEntryToDb(entry,dbgTime)
{
	var start;
	
	var saveToDbPromise = Promise();
	
	var dbAlbumReply=function(response){
		
		if(dbgTime)
		{
			dbgTime.addTimeToDbgProperty(((new Date())-start),'DBWrite');
		}
		
		console.info("Add Response:"+JSON.stringify(response));
		if(response.returnValue)
		{
			console.info("Add entry to db successful"+response.results[0].id);
			saveToDbPromise.fulfill(response.results[0].id);
		}else
		{
			saveToDbPromise.breakk({"error":ERROR[3],"details":JSON.stringify(entry),"errorCode":3});
		}
	};
	try{
		
		if(dbgTime)
		{
			start = new Date();
		}
		
		//console.info("Add entry to db");
		var addRequest=serviceHandle.request('com.palm.db/put', {
			"objects":[entry]
		}, dbAlbumReply);
	}catch(e)
	{
		
		if(dbgTime)
		{
			dbgTime.addTimeToDbgProperty((new Date())-start,'DBWrite');
		}
		
		saveToDbPromise.breakk({"error":ERROR[1],"details":JSON.stringify(e),"errorCode":1});
	}
	return saveToDbPromise;
}


function mergeEntryToDb(entry,type,changeModifiedTime,dbgTime){
	var start;
	
//@todo: something like this... otherwise we won't properly handle an array of albums
//@todo: even better, would be good to not require special-case handling for albums (modifiedTime)
/*	
	var mergelist;
	if (entryOrArray.length !== undefined) {
		mergelist = [].concat(entryOrArray);
	}
	else {
		mergelist = [entryOrArray];		
	}
	mergelist.forEach(function(entry) {
		if(type==="album" && changeModifiedTime)
		{
			//this is only done when remote changes
			//for this album is synced down
			entry.modifiedTime = (new Date().getTime())/1000;
		}		
	});
	
	// everything below here is the same...
	var saveToDbPromise = Promise();
*/	
	
	var mergelist = [];
	if(entry.length)
	{
		//this is currently used for albums
		//while turning the account's photo capability
		//on or off in the accounts app
		mergelist=mergelist.concat(entry);
	}
	else
	{
		if(type==="album" && changeModifiedTime)
		{
			//this is only done when remote changes
			//for this album is synced down
			var D = new Date();
			entry.modifiedTime = Math.floor((new Date(D.getUTCFullYear(), D.getUTCMonth(), D.getUTCDate(), D.getUTCHours(),
			    D.getUTCMinutes(), D.getUTCSeconds()).getTime())/1000);
		}
		mergelist.push(entry);
	}
	var saveToDbPromise = Promise();
	
	//make a mojodb request to add this photo entry
	var dbAlbumReply=function(response){
		if(dbgTime)
		{
			//console.info("---->end db merge");
			dbgTime.addTimeToDbgProperty((new Date())-start,'DBMerge');
		}
		if(response.returnValue){
			//console.info("MOJODB PASSED!!!!!!!!!!! **** pushed Entry for "+type+":" +response.results[0].id);
			saveToDbPromise.fulfill("MOJODB PASSED!!!!!!!!!!! **** pushed Entry :"+response.results[0].id);	
			
		}else{
			console.info("MOJODB FAILED!!!!!!!! to merge , the response is " +JSON.stringify(response));
			saveToDbPromise.breakk({"error":ERROR[2],"details":JSON.stringify(response),"errorCode":2});
				
		}		
	};

	if(mergelist.length===0)
	{
		saveToDbPromise.fulfill(true);
		//no need to merge nothing to merge
		return saveToDbPromise;
	}
	try{
		if(dbgTime){
			//console.info("---->start db merge");
			start = new Date();
		}
		
		var mergeRequest=serviceHandle.request('com.palm.db/merge', {
			"objects":mergelist
		}, dbAlbumReply);
	}catch(e){
		if(dbgTime)
		{
			dbgTime.addTimeToDbgProperty((new Date())-start,'DBMerge');
		}
		
		saveToDbPromise.breakk({"error":ERROR[1],"details":JSON.stringify(e),errorCode:1});
	}
	
	return saveToDbPromise;
}

function delEntryFromDb(dbId,dbgTime){
	var start;
	var delPromise = Promise();
	
	//make a mojodb request to add this photo entry
	var dbdelReply=function(response){
		if(dbgTime)
		{
			dbgTime.addTimeToDbgProperty((new Date())-start,'DBDel');
		}
		
		if(response.returnValue){
			var msg="MOJODB Del Successful!!!!!!!!!!! **** deleted Entry :"+dbId;
			//console.info(msg);
			delPromise.fulfill(msg);	
			
		}else{
			var msg1={"error":ERROR[4],"details":JSON.stringify(response),"errorCode":4};
			console.info(msg1);
			delPromise.breakk(msg1);		
		}	
	};

	try{
		if(dbgTime)
		{
			start= new Date();
		}
		var dbDelRequest=serviceHandle.request('com.palm.db/del', {
			"ids":[dbId]
		}, dbdelReply);
	}catch(e){
		if(dbgTime)
		{
			dbgTime.addTimeToDbgProperty((new Date())-start,'DBDel');
		}
		
		delPromise.breakk({"error":ERROR[1],"details":JSON.stringify(e),"errorCode":1});
	}
	
	return delPromise;
}

function getDbEntries(ids,dbgTime)
{
	var start;
	var getPromise=Promise();
	var dbdelReply= function(response){
		if(dbgTime)
		{
			//console.info("---->end db read");
			dbgTime.addTimeToDbgProperty((new Date())-start,'DBRead');
		}
		
		if(response.returnValue)
		{
			console.info(" Successfuly got the required db entries");
			getPromise.fulfill(response.results);
		}else{
			getPromise.breakk({"error":ERROR[5],"details":JSON.stringify(response),"errorCode":5});
		}
	};
	try{
		if(dbgTime)
		{
			//console.info("---->start db read");
			start = new Date();
		}
		
		var dbgetRequest=serviceHandle.request('com.palm.db/get', {
			"ids":ids
		}, dbdelReply);
	}catch(e)
	{
		if(dbgTime)
		{
			dbgTime.addTimeToDbgProperty((new Date())-start,'DBRead');
		}
		getPromise.breakk({"error":ERROR[1],"details":JSON.stringify(e),"errorCode":1});
	}
	
	return getPromise;
}

function parseFile(path){
	var promise = Promise();
	var timeout = 0;
	var elapsed = false;
	function tooLate(){
		if (!elapsed){
			elapsed = true;
			promise.breakk("Fileparserd Took too long to Respond");
		}
	}
	timeout = setTimeout(tooLate,10000);
	var parserdReply = function(response){
		if (!elapsed){
			elapsed = true;
			if (response.returnValue){
				promise.fulfill(response.files[0]);
			}
			else
				promise.breakk("Failure connecting to fileparserd "+JSON.stringify(response));
		}
	};
	try{
		var parserRequest = serviceHandle.request('com.palm.fileparserd/parse',{"files":[path]},parserdReply);
	}catch(e){
		promise.breakk("Could not call fileparserd service");
	}
	return promise;
}

//Returns appropriate extension if its a supported Image Type
function isValidImage(exif_obj){
	var extension = false;
	try {
		switch(exif_obj.data.subtype.toLowerCase())
		{
			case "jpeg":
				extension = "jpg";
				break;
			case "png":
				extension = "png";
				break;
			case "bmp":
				extension = "bmp";
				break;
			default:
				break;
		}
	}
	catch(e){
		console.info("Unable to create get extension");
	}
	
	if (!extension){
		console.log("# # # # # # Unsupported Remote Image Exif " + JSON.stringify(exif_obj) +  " # # # # #");
	}
	return extension;
}

//Extension is either a string or bool false
function formatImagePath(file_path,ext){
	if (ext){
		var lsh = file_path.lastIndexOf("/");
		console.log(lsh);
		var ldx = -1;
		if (lsh > 0)
			ldx = file_path.indexOf(".",lsh);
		if (ldx <= 0)
			return (file_path + "." + ext);
		
		return file_path.substr(0,ldx) + "." + ext;
	}
	return false;
}


function moveFile(fromPath, toPath){
	var promise = Promise();
	
	var spawn = require('child_process').spawn;
	
	var mv = spawn("mv",[ fromPath, toPath]);
	var msg ="";
	
	mv.stderr.on('data', function(data){
		msg += data;
	});
	
	mv.on('exit', function (code){
		if (code !== 0){
			var log ="Error in moving file :"+toPath+"from :"+fromPath+" \nError Msg:"+msg;
			console.info(log);
			var errorObj={
					"error":ERROR[9],
					"details":msg+"\nerror moving file:code:"+code+" ,dstPath:"+toPath,
					"errorCode":9
			};
			promise.breakk(errorObj);
		}
		else
			promise.fulfill(toPath);
	});
	
	return promise;
}

//Try to Parsefile 3 times 5 seconds apart then fail
function formatAndRenameImage(path){
	var finalPromise = Promise();
	var retries = 3;
	var timeoutObj = undefined;
	var parserDPromise = undefined;
	var runParserD = function(){
		parserDPromise = parseFile(path);
		parserDPromise.whenFulfilled(function(parse_obj){
			var newPathName = formatImagePath(path,isValidImage(parse_obj));
			if (!newPathName){
				if (retries-- > 0){
					console.log(retries +" Retries left for "+path);
					timeoutObj = setTimeout(runParserD,5000);
				}
				else
					finalPromise.breakk("Image format not supported "+path);
			}
			else {
				finalPromise.fulfill(moveFile(path, newPathName));
			}
		});
		parserDPromise.whenBroken(function(msg){
			if (retries-- > 0){
				console.log(retries +" Retries left for "+path);
				timeoutObj = setTimeout(runParserD,5000);
			}
			else
				finalPromise.breakk(msg);
		});
	};
	runParserD();
	return finalPromise;
}

function updateAlbumCount(albumId, type,imageCount,videoCount,albumModified,dbgTime)
{
	var updatePromise = Promise();
	var getAlbumEntry = getDbEntries([albumId],dbgTime);
	getAlbumEntry.whenFulfilled(function(entries){
		var album=entries[0];
		// if (album.type === "local"){
		// 			updatePromise.fulfill("No need to update a local album");
		// 			return;
		// 		}
		console.info("Updating "+ album.name + " Album Count vids: "+videoCount+" imgs: "+imageCount);
		if((!imageCount || imageCount===0) && (!videoCount || videoCount ===0)){
			updatePromise.fulfill("Count is 0, nothing to update");
		}else{
			if(type==="add"){
				if(imageCount){
					album.total.images =album.total.images+ imageCount;
				}
				if(videoCount){
					album.total.videos =album.total.videos+ videoCount;
				}
			}else{
				if(imageCount && album.total.images>=imageCount){
					album.total.images =album.total.images- imageCount;
				}
				if(videoCount && album.total.videos>=videoCount){
					album.total.videos =album.total.videos- videoCount;
				}
			}
			console.info("Total is:"+JSON.stringify(album.total));
			var updateEntry ={
					"_id":album._id,
					"total":album.total		
			};
			var mergePromise =mergeEntryToDb(updateEntry,"album",albumModified,dbgTime);
			mergePromise.whenFulfilled(function(){
				var msg= "Successfully updated album:"+album.name+" with :"+JSON.stringify(album.total);
				updatePromise.fulfill(msg);
			});
			mergePromise.whenBroken(function(msg){
				var Emsg= "Failed to update album:"+album.name+" with :"+JSON.stringify(album.total)+" . Error:"+JSON.stringify(msg);
				updatePromise.breakk(Emsg);
			});
		}
	});
	getAlbumEntry.whenBroken(function(msg){
		var errMsg ="Unable to get the album for albumId:"+albumId+" , to update the numImage count, ErrMsg:"+JSON.stringify(msg);
		console.info(errMsg);
		updatePromise.breakk(errMsg);
	});
	
	return updatePromise;
}

function dbgetPhotoListReply (photoIds,getListPromise,start,dbgTime,response){
	//console.info("PhotoIds:"+JSON.stringify(photoIds));
	//console.info("Response:"+JSON.stringify(response));
	if(response.returnValue){
		if(dbgTime)
		{
			dbgTime.addTimeToDbgProperty((new Date())-start,'DBRead');
		}
		var exclusionList=[];
		for(var p=0;p<response.results.length;p++){
			var photo=response.results[p];
			if(photoIds.length <=0)
			{
				//console.info("Pushing index:"+photo._id);
				exclusionList.push(photo);
				continue;
			}
			
			var excludeFromDelete =false;
			for(var i=0;i<photoIds.length;i++)
			{
				//console.info("comparing:"+photo._id +", and "+photoIds[i]);
				if(photo._id === photoIds[i])
				{
					//console.info("Excluding index:"+photo._id);
					excludeFromDelete=true;
					break;
				}
			}
			if(excludeFromDelete){
				//now we can remove that entry from the comparison list
				//as we have already encountered that photo in the album list
				//and will not occur again in the existing list
				photoIds.splice(i, 1);
				//console.info("Latest photoIds list:"+JSON.stringify(photoIds));
			}
			else{
				//console.info("Pushing index:"+photo._id);
				exclusionList.push(photo);
			}
		}
		getListPromise.fulfill(exclusionList);
	}else{
		getListPromise.breakk({"error":ERROR[5],"details":JSON.stringify(response),"errorCode":5});
	}
}

function getExclusionPhotoList(photoIds,albumId,dbgTime)
{
	var start=0;
	var getListPromise = Promise();
	var genExclusionList =function(photoIds,albumId)
	{
		try
		{
			if(dbgTime)
			{
				start= new Date();
			}
			var getPhotosQuery = _dbFind(
				{"query":
					{	
						"from":"com.palm.media.types:1",
						"where":[{"prop":"albumId","op":"=","val":albumId}]
					}
				}, 
				dbgetPhotoListReply.bind(this,photoIds,getListPromise,start,dbgTime));
		}catch(e)
		{
			if(dbgTime)
			{
				dbgTime.addTimeToDbgProperty((new Date())-start,'DBRead');
			}
			getListPromise.breakk({"error":ERROR[1],"details":JSON.stringify(e),"errorCode":1});
		}
	};
	if(albumId)
	{
		genExclusionList(photoIds,albumId);
	}
	else
	{
		var ids=[];
		ids.push(photoIds[0]);
		var getPhoto =getDbEntries(ids,dbgTime);
		getPhoto.whenFulfilled(function(list){
			albumId =list[0].albumId;	
			genExclusionList(photoIds,albumId);
			
		});
		getPhoto.whenBroken(function(errMsg){
			getListPromise.breakk(errMsg);
		});
	}

	return getListPromise;
}

/*
 * Task Queue specific Utility functions
 */

function cleanUpWhenTasksFinished()
{
	//console.info("*** Cleanup when task is finished");
	taskHash={};

}

function checkIfTaskAlreadyInHash(id)
{
	if(taskHash[id])
	{
		return taskHash[id];
	}else
	{
		return null;
	}
}

function putTaskInHash(id,task)
{
	taskHash.id =task;
	
}

/*
 * File I/O utility calls
 */

function createFileWithContentAndLog(cause,detail,content)
{
	var promise=Promise();
	var dumpFile ="/tmp/log-"+(new Date().getTime());
	node_fs.open(dumpFile, "w", 666, function(err,fd) {
		if (err) { 
			console.info("Unable to create file, so no rdx logging"); 
			promise.breakk("Unable to create file, so no rdx logging");
		}
		else {
			node_fs.write(fd, content, null, null, function(err, written) {
				if (err) { 
					console.info("failed to write rdx report"); 
					promise.breakk("failed to write rdx report");
				}
				else { 
					var fn= function(){
						promise.fulfill(true);
						node_fs.close(fd);
						//delete the generated file to avoid using extra space
						deleteDirOrFile(dumpFile,false);
					};
					var promiseLog =reportRdxLog(cause,detail,dumpFile);
					promiseLog.whenFulfilled(fn);
					promiseLog.whenBroken(fn);
				}
				
			});
		}
	});
	return promise;
}


function copyFile(srcPath, dstPath,dbgTime){
	var promise = Promise();
	var start;

	// extractfs is failing to give proper filesizes when statting with an output format of
	// jpeg, until that is fixed spawn a process to do the copy
	if(!srcPath)
	{
		//we have nothing to copy so just fulfill it with null
		//this may be the case when video does not have 
		//any embedded thumbnail
		promise.fulfill("No path");
		
	}
	else
	{
		if(dbgTime)
		{
			//console.info("---->start extractfs");
			start=new Date();
		}
		var spawn = require('child_process').spawn;
		var cp  = spawn('ionice',['-c3','cp',srcPath, dstPath]);
		
		var msg="";
		cp.stderr.on('data', function (data) {
			 msg += data ;
		});
		
		cp.on('exit', function (code) {
			if(dbgTime)
			{
				//console.info("---->end extractfs");
				dbgTime.addTimeToDbgProperty((new Date())-start,'ExtractFs');
			}
			if (code !== 0) {
				var log ="Error in generating cache image:"+dstPath+"from :"+srcPath+" \nError Msg:"+msg;
				console.info(log);
				var errorObj={
						"error":ERROR[9],
						"details":msg+"\nerror writing:code:"+code+" ,dstPath:"+dstPath,
						"errorCode":9
				};
				promise.breakk(errorObj);
				
				//we also log this as an rdx report so that we can look at this later on
				//on rdx.palm.com !!!!! No More RDX Logging
				//createFileWithContentAndLog("CopyFailure","Copy Failed",log);			
			}
			else {
				promise.fulfill(dstPath);
			}
		});
	}

	
	return promise;
}

function createCheckForDir(albumPath,dbgTime)
{
	var start;
	var resPromise = Promise();
	//console.info("CreateCheckForDir:"+albumPath);
	if(dbgTime)
	{
		//console.info("---->start file read in check dir");
		start=new Date();
	}
	 node_path.exists(albumPath, function(exists) {
		 if(dbgTime)
			{
			// console.info("---->end file read in check dir");
			 dbgTime.addTimeToDbgProperty((new Date())-start,'FileIO');
			}
			if(exists)
			{
				resPromise.fulfill({"exists":true});
			}
			else{
				if(dbgTime)
				{
					//console.info("---->start file read in check dir");
					start=new Date();
				}
				node_fs.mkdir(albumPath,666,function(err){
					if(dbgTime)
					{
						//console.info("---->end file read in check dir");
						dbgTime.addTimeToDbgProperty((new Date())-start,'FileIO');
					}
					if(err)
					{
						var errMsg ="Error creating directory :"+albumPath+" error:"+err;
						//console.info(errMsg);
						resPromise.breakk(errMsg);
					}else{
						//console.info("Made directory:"+albumPath);
						resPromise.fulfill({"exists":false});
					}
				});
			}
		});
	 return resPromise;
}

function deleteDirOrFile(path,isDir,dbgTime)
{
	var start;
	var delPromise = Promise();
	if(dbgTime)
	{
		start= new Date();
	}
	node_path.exists(path, function(exists) {
		if(dbgTime)
		{
			dbgTime.addTimeToDbgProperty((new Date())-start,'FileIO');
		}
		if(exists){
			if(isDir){
				if(dbgTime)
				{
					start= new Date();
				}
				node_fs.rmdir(path,function(err){
					if(dbgTime)
					{
						dbgTime.addTimeToDbgProperty((new Date())-start,'FileIO');
					}
					if(!err){
						console.info("deletion successful for directory :"+path);
						delPromise.fulfill("deletion successful for directory :"+path);
					}
					else{
						console.info("deletion failed for directory:"+path+","+err);
						delPromise.breakk("deletion failed for directory:"+path+","+err);
					}
				});
			}else{
				if(dbgTime)
				{
					start=new Date();
				}
				node_fs.unlink(path, function(err) {
					if(dbgTime)
					{
						dbgTime.addTimeToDbgProperty((new Date())-start,'FileIO');
					}
					if(!err)
					{
						console.info("**** delete of file path fulfilled:"+path);
						delPromise.fulfill("deletion successful:"+path);
					}
					else
					{
						//there seems to be a weird bug in checking if the path exists. Looks like 
						//even though the file already deleted, node_path.exists seems to return a true.
						//this happens if you try to delete the same file in a sequence without waiting for 
						//the previous delete to complete.ENOENT means the file does not exist anymore
						var ind =err.indexOf("ENOENT",0);
						if(ind === -1)
						{
							console.info("**** delete of file path failed for: "+path);
							delPromise.breakk("deletion failed:"+path+","+err);
						}else{

							
							console.info("****file seems to be deleted already so just fulfilling the delete: "+path);
							delPromise.fulfill("deletion successful:"+path);
						}
					}
				});
			}
		}else{
			console.info("**** delete Dir or file path: not needed, path does not exist"+path);
			delPromise.fulfill("deletion not needed:"+path+",does not exist");
		}
	 });
	return delPromise;
}


/*
 * Album specific Utility calls 
 */
function removePhoto (photo,dbgTime)
{
	var delPhotoPromise =Promise();

	// webos-synergy-revival: for a synced CLOUD photo (has accountId + type=templateId +
	// nested photo[type].pid from listPhotos), delete the remote file FIRST via
	// <serviceName>/deletePhoto. Only on success do we clear the local cache/DB - a remote
	// failure aborts so the photo stays visible instead of orphaning the cloud file. Local
	// (My TouchPad) photos have no accountId and take the original path unchanged.
	function doLocalRemoval()
	{
		var delCache = Promise();
		var delImgpromiseset =[];
		if(photo.path){ delImgpromiseset.push(deleteDirOrFile(photo.path,false,dbgTime)); }
		if(photo.appScreenNail){ delImgpromiseset.push(deleteDirOrFile(photo.appScreenNail.path,false,dbgTime)); }
		if(photo.appGridThumbnail){ delImgpromiseset.push(deleteDirOrFile(photo.appGridThumbnail.path,false,dbgTime)); }
		if(photo.appStripThumbnail){ delImgpromiseset.push(deleteDirOrFile(photo.appStripThumbnail.path,false,dbgTime)); }
		if(photo.appFullScreenImg){ delImgpromiseset.push(deleteDirOrFile(photo.appFullScreenImg.path,false,dbgTime)); }
		delCache.fulfill(PromiseSet(delImgpromiseset,false));
		delCache.whenFulfilled(function(){
			delPhotoPromise.fulfill(delEntryFromDb(photo._id,dbgTime));
		});
		delCache.whenBroken(function(errMsg){
			delPhotoPromise.breakk("Remove Photo Failed for photoId:"+photo._id+", error: "+errMsg);
		});
	}

	var tmpl = photo.type;
	var nested = tmpl && photo[tmpl];
	var cap = (typeof AccountsCapability !== "undefined") && tmpl && AccountsCapability[tmpl];
	if(photo.accountId && nested && nested.pid && cap && cap.serviceName)
	{
		console.info("removePhoto: deleting REMOTE "+cap.serviceName+" pid="+nested.pid);
		serviceHandle.request(cap.serviceName+"/deletePhoto",
			{accountId: photo.accountId, pid: nested.pid},
			function(resp){
				if(resp && resp.returnValue){ doLocalRemoval(); }
				else {
					console.info("removePhoto: REMOTE deletePhoto FAILED, keeping local: "+JSON.stringify(resp));
					delPhotoPromise.breakk("Remote deletePhoto failed: "+JSON.stringify(resp));
				}
			});
	}
	else { doLocalRemoval(); }

	return delPhotoPromise;
}




function removeAlbum(album,dbgTime,obj_shouldForce)
{
	var start;
	var removeAlbumPromise = Promise();

	var interimPromise =Promise();
	var delPhotoSet = [];
	var dbgetPhotoReplyFnc = function(response){
		if(dbgTime)
		{
			dbgTime.addTimeToDbgProperty((new Date())-start,'DBRead');
		}
		console.info("response size:"+ response.results.length);
		response.results.forEach(function(photo){
				delPhotoSet.push(removePhoto(photo,dbgTime));	
			});
		console.info("Size of del photo set:"+delPhotoSet.length);
		interimPromise.fulfill(PromiseSet(delPhotoSet,true));
		
		//All photos have been deleted for this album
		interimPromise.whenFulfilled(function(){
			console.info("Interim promise fulfilled in removealbum");
			//we have cleared the photos
			//now we need to remove the directory for this album
			console.info("removed pictures in the album, now removing the album folder");
			var removeAlbumDir = (obj_shouldForce && obj_shouldForce.forceDir) ? forceRmDir(album.path) : deleteDirOrFile(album.path,true,dbgTime);
			removeAlbumDir.whenFulfilled(function(){
				console.info("remove dir fulfilled");
				removeAlbumPromise.fulfill(delEntryFromDb(album._id,dbgTime));
			});
			removeAlbumDir.whenBroken(function(errMsg){
				if (obj_shouldForce && obj_shouldForce.forceDb){
					removeAlbumPromise.fulfill(delEntryFromDb(album._id,dbgTime));
				}
				else {
					removeAlbumPromise.breakk("Unable to remove Album:"+album._id+",error:"+errMsg);
				}
			});		
		
		});
		interimPromise.whenBroken(function(errMsg){
			removeAlbumPromise.breakk("Unable to remove Album:"+album._id+",error:"+errMsg);
		});
	};
	if(dbgTime)
	{
		start=new Date();
	}
	var getPhotosQuery = _dbFind( 
			{"query":
				{	
					"from":"com.palm.media.types:1",
					"where":[{"prop":"albumId","op":"=","val":album._id}]
				}
			}, 
		    dbgetPhotoReplyFnc);
	

	return removeAlbumPromise;
}

var node_spawn = require('child_process').spawn;

function forceRmDir(path){
	var rmDirPromise = Promise();

	var rm  = node_spawn('rm', ['-rf', path]);
	//sandbox.error("****************spawned a child process:"+rm.pid);
	
	rm.on('exit', function (code) {
		if (code !== 0) {
			rmDirPromise.breakk("removing directory failed");
		}
		else {
			//sandbox.error("*************** removing directory passed");
			rmDirPromise.fulfill(true);	
		}
	});
	
	return rmDirPromise;
}

//specific to photos 
//we need a /media/internal/.photosApp/Generated to put all our cached stuff into
function createCacheDirectories(dbgTime)
{
	var promise =Promise();
	 //function checks if .photosApp is present and if not
	 //creates it
	 var checkForPhotosDir= function(){
		 var resPromise = Promise();
		 var albumPath = "/media/internal/.photosApp";
		var interimPromise =createCheckForDir(albumPath,dbgTime);
		interimPromise.whenFulfilled(function(){
//			console.info("interimPromise fulfilled, fulfill resPromise");
			resPromise.fulfill(true);
		});
		interimPromise.whenBroken(function(errMsg){
			resPromise.breakk(errMsg);
		});
		return resPromise;
	};
	 //function checks if .photosAppDir/Generated is present and if not
	 //creates it
	var checkForGeneratedDir =function(){
		
		//console.log("calling into checkForGeneratedDir");
		var resPromise = Promise();
		var photosDirPromise = checkForPhotosDir();
	
		photosDirPromise.whenFulfilled(function() {
//			console.info("In fulfilling promise that the required directories exist");
			//create or check for existing directory 
			var albumPath = "/media/internal/.photosApp/Generated";
			var intPromise =createCheckForDir(albumPath,dbgTime);
			intPromise.whenFulfilled(function(){
//				console.info("both direcotires present");
				
				resPromise.fulfill(true);
			});
			intPromise.whenBroken(function(errMsg){
				console.info("Not able to create /media/internal/.photosApp/Generated to put cache files in:"+errMsg);
				resPromise.breakk(errMsg);
			});
		});
		photosDirPromise.whenBroken(function(errMsg) { 
			resPromise.breakk(errMsg); 
		});
		return resPromise;
	}; 
	promise.fulfill(checkForGeneratedDir());
	return promise;
}
function setGlobalPromiseForCache(promise)
{
	var msg ="*****setGlobalPromiseForCache:";
	msg=(promise)?(msg+"valid promise "):(msg+":null");
	console.info(msg);
	globalCachePromise =promise;
}
function getGlobalPromiseForCache()
{
	console.info("*****getGlobalPromiseForCache");
	return globalCachePromise;
}

function filterNameForValidChar(name){
	var validName;
	
	//trim leading and trailing spaces
	validName= name.replace(/^\s+|\s+$/g, '');

	//replace / with %
	validName= validName.replace(/\//g,"%2F");
	
	//replace % with _ as while rendering browser does not know how to handle this
	validName=validName.replace(/%/g,"_");

	return validName;
	
}
//for jasmine
exports.parseUrl = parseUrl;
exports.generateExtractFsUrl= generateExtractFsUrl;
exports.copyFile = copyFile;
exports.clone= clone;
exports.cleanUpWhenTasksFinished= cleanUpWhenTasksFinished;
exports.dbgetPhotoListReply = dbgetPhotoListReply;
exports.filterNameForValidChar =filterNameForValidChar;