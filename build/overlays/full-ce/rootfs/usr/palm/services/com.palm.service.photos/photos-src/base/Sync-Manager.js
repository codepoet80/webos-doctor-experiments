//For JSLint to ignore globals


/*global console: true */
/*global MojoService: true */
/*global IMPORTS: true */
/*global require: true */
/*global setTimeout: true */
/*global serviceHandle: true */
/*global Promise: true */
/*global createCheckForDir: true */
/*global PromiseSet: true */
/*global checkIfTaskAlreadyInHash: true */
/*global ThumbProcessTask: true */
/*global taskQueue: true */
/*global taskHash: true */
/*global clone: true */
/*global deleteDirOrFile: true */
/*global clearTimeout: true */
/*global exports: true */
/*global mergeEntryToDb: true */
/*global removeAlbum: true */
/*global removePhoto: true */
/*global AccountsCapability:true*/
/*global getRemoteSyncType:true*/
/*global parseUrl:true*/
/*global generateCapabilityForAccounts:true*/
/*global NonCssParams:true*/
/*global CacheGenerateAssistant:true */
/*global inDebugMode: true */
/*global inMSMMode: true */
/*global DbgTimeAssistant: true */
/*global createFileWithContentAndLog:true */

var cacheLoc = "/media/internal/.photosApp";
//for jasmine

var clone =exports.clone;
if(!clone){
	clone = require('base/Utils').clone;
}


// check to see if NOV-108635 is fixed yet

var node_fs = require('fs');
var node_path = require('path');
var node_http = require('http');
var node_url = require('url');


// Responsible for syncing remote accounts.  Eg:
// - finding list of albums in an account
// - finding list of photos in an album
// - download photos, and create DB entries for photos/albums
//   - diff against server, to avoid downloading photos that we already have
// Downloaded photos/videos, and generated thumbs, go into /media/internal/.photosApp

function SyncRemoteAlbumsAssistant() { 
	this.logLevel = 1;//{"0":No Logging, "1":Minimal Logging, "2":Full Logging}
}

SyncRemoteAlbumsAssistant.prototype.log=function(msg,level)
{
	var lg = level || 2;
	if (lg <= this.logLevel && this.logLevel > 0){
		console.log(msg);
	}
};

// Main entry-point.
SyncRemoteAlbumsAssistant.prototype._doAccountWork=function(acctItem)
{

	this.log("!!!!!!!!!!!!!!!! Requesting an account item for :"+acctItem.username+",templateId:"+acctItem.templateId);
	var that=this;
	
	var accountPromise = Promise();
	
	//first create the required folder structure for accounts
	var needReqDirectory = this._createCheckRequiredDirs(acctItem.templateId);
	
	needReqDirectory.whenFulfilled(function(){
		
		//now we query for the albums for the account
		var queryPromise =that._queryRemoteAlbumsForAccount(acctItem);
		
		queryPromise.whenFulfilled(function(rAlbumList){
			//console.info("********* received remote album list:"+JSON.stringify(rAlbumList));
			//now we try creating a directory for the account
			var accPath = cacheLoc+"/"+acctItem.templateId+"/"+acctItem.username;
			var albumPromiseSet=[];	
			var accPathCreatePromise = createCheckForDir(accPath,that.dbgTime);
			accPathCreatePromise.whenFulfilled(function(){
				if (deleted_accounts_hash[acctItem.accountId]){
					accountPromise.breakk("*#*#*#*#*#*#*#**#* SyncRemoteAlbumsAssistant._doAccountWork will not sync a DELETED Account "+ acctItem.accountId);
					return;
				}
				else 
				{
					//we first get the changes between the local and remote albums
				
					//@todo handle multiple pages of albums
					var dbResponse =function(response)
					{
						if(response.returnValue){
							var localList = response.results;
					
							var changes = that._compareAlbumResult(rAlbumList,localList);
						
							//do the deletes
							changes.toDelete.forEach(function(album){
								that.log("* * * * _doAccountWork removeAlbum for "+ album.name +" * * * * ");
								albumPromiseSet.push(removeAlbum(album,that.dbgTime));
							});
							//do the updates
							changes.toUpdate.forEach(function(album){
								that.log("* * * * _doAccountWork updateAlbum for "+ album.name +" * * * * ");
								albumPromiseSet.push(that.mergeAlbum(album));
							});
							//do the adds
							var finAddsPassed = [];
							var finAddsFailed = [];
							changes.toAdd.forEach(function(album){								
								var albPrm = that.addAlbum(album,acctItem);
								albPrm.whenFulfilled(function(){
									finAddsPassed.push(album.name);
									that.log("* * * * _doAccountWork addAlbum PASS for "+ album.name +" "+finAddsPassed.length+"/"+changes.toAdd.length+" are  Passing of " +(finAddsPassed.length+finAddsFailed.length) +" Recieved "+JSON.stringify(finAddsPassed)+" * * * *");
								});
								albPrm.whenBroken(function(){
									finAddsFailed.push(album.name);
									that.log("* * * * _doAccountWork addAlbum FAIL for "+ album.name+" "+finAddsFailed.length+"/"+changes.toAdd.length+" are  Failing of " +(finAddsPassed.length+finAddsFailed.length) +" Recieved "+JSON.stringify(finAddsFailed)+"* * * *");
								});
								albumPromiseSet.push(albPrm);
							});
							if(albumPromiseSet.length >0){
								accountPromise.fulfill(PromiseSet(albumPromiseSet,true));
							}else{
								accountPromise.fulfill(true);
							}
						}else{
							accountPromise.breakk("Not able to make a dbQuery for albumList:"+JSON.stringify(response));
						}
					};
					var localAlbReq = _dbFind(
							{
								'query': {
									'from':'com.palm.media.image.album:1', 
									'where':[{'prop':'accountId','op':'=','val':acctItem.accountId}]
								}
							},
							dbResponse
						);
				}
			});
			
			accPathCreatePromise.whenBroken(function(errMsg){
				////console.info("Syncing interrupted!!!! "+errMsg);
				accountPromise.breakk(errMsg);
			});
		});
		
		queryPromise.whenBroken(function(errMsg){
			accountPromise.breakk(errMsg);
		});
	
	});
	
	needReqDirectory.whenBroken(function(errMsg){
		accountPromise.breakk("Failed to create required directories!!!! "+errMsg);
	});
	
	return accountPromise;
};

SyncRemoteAlbumsAssistant.prototype.mergeAlbum = function(album){
	var that=this;
	var mergepromise =Promise();
	if(album.dirty)
	{
		//this is the case when something changed in album details
		delete album.dirty;
		var mergeToDbpromise = mergeEntryToDb(album,"album",true,that.dbgTime);
		
		mergeToDbpromise.whenFulfilled(function(){
			mergepromise.fulfill(that._doAlbumWork(album,false));
		});
	
		mergeToDbpromise.whenBroken(function(errMsg){
			mergepromise.breakk("Merging Album Failed for:"+album.name+" error:"+errMsg);
		});
	}else{
		//this is the case when nothing about the album details changed, But we still
		//want to check if there are any additional pictures added to this album
		mergepromise.fulfill(that._doAlbumWork(album,false));
	}

	return mergepromise;
};

SyncRemoteAlbumsAssistant.prototype._queryRemoteAlbumsForAccount = function(acctItem){
 	var resultPromise = Promise();
	var timeout = 60000;//30 secs
	var retries = 3;
	var alarm = undefined;
	var photoRequest = undefined;
	var failMsg ="Tried querying Account for Albums "+acctItem.username+ " 3 times and failed, quitting!!!";
	var serviceAPI= AccountsCapability[acctItem.templateId].serviceName+"/listAlbums";
	var params ={'accountId': acctItem.accountId};
	var that = this;
	var cloudResponse = function(response){
		//Stop Current Monitor
		clearTimeout(alarm);
		//if failed and retries less than x, retry x times 
		if (response.returnValue){
			that.log("* * * * * _queryRemoteAlbumsForAccount Remote Account " +acctItem.username + " Succeeded !!!! "+retries + "left",1);
			resultPromise.fulfill(response.albums);
		}
		else {
			// The request didn't succeed... should we try again?
			if (retries-- > 0) {
				that.log("* * * * * _queryRemoteAlbumsForAccount Remote Account " +acctItem.username + " Failed !!!! "+retries + "left",1);
				makeCloudRequest();
				monitorRequest();
			}
			else {
				resultPromise.breakk(failMsg);
			}
		}
	};
	
	var alarmFired = function(){
		that.log("* * * * * _queryRemoteAlbumsForAccount Remote Account " +acctItem.username + " Timeout Reached !!!! "+retries + "left",1);
		photoRequest.cancel();
		if (retries-- > 0){
			makeCloudRequest();
			monitorRequest();
		}
		else {
			resultPromise.breakk(failMsg);
		}
	};
	
	var makeCloudRequest = function(){
		photoRequest=serviceHandle.request(serviceAPI, params, cloudResponse);
	};
	
	var monitorRequest = function(){
		alarm = setTimeout(alarmFired,timeout);
	};
	
	makeCloudRequest();
	monitorRequest();
	
	return resultPromise;
};



SyncRemoteAlbumsAssistant.prototype.addAlbum =function(albumItem,acctItem)
{
	var dirPromise = Promise();
	var that=this;

	//remove any "/" characters as they are not allowed in folder names
	//see bug DFISH-6521

	var albnameEscaped=albumItem.name.replace(/[^0-9A-Za-z.\-]/ig,"x");
	
	//the reason we are appending aid to the album folder name is 
	//a remote sync source may have two albums with the same name
	//eg: facebook can have two mobile uploads folder
	
	var albString=albumItem.aid+"-"+albnameEscaped;
	//replacing all % characters with an _ as while
	//trying to render this image browser unescapes those chars
	//which causes the image to not render in the app.
	//this is bug DFISH-9495
	
	
	var finalAlbString=albString.replace(/%/g,"_");
	
	//now we try creating a directory for the album
	var albPath = cacheLoc+"/"+acctItem.templateId+"/"+acctItem.username+"/"+finalAlbString;
	
	var albPathCreatePromise = createCheckForDir(albPath,that.dbgTime);
	
	albPathCreatePromise.whenFulfilled(function(resp){
		//console.info("Response for album path creation:"+JSON.stringify(resp));
		albumItem.path=albPath;
		//we first make an entry into mojodb
		var albEntryPromise = that._addAlbumToDb(albumItem,acctItem);
		
		albEntryPromise.whenFulfilled(function(albItem){
			dirPromise.fulfill(that._doAlbumWork(albItem,true));
		});		
		
		albEntryPromise.whenBroken(function(msgg){
			//remove the folder from the file system
			var delPromise =deleteDirOrFile(albPath,true,that.dbgTime);
			delPromise.whenFulfilled(function(msg){
				//console.info("Removing folder success:"+msg);
			});
			delPromise.whenBroken(function(msg){
				//console.info("Removing folder failed:"+msg);
			});
			dirPromise.breakk(msgg);
		});
	});
	
	albPathCreatePromise.whenBroken(function(errMsg){
		////console.info("Syncing interrupted!!!! "+errMsg);
		dirPromise.breakk(errMsg);
	});
	
	dirPromise.whenBroken(function(){
		that.log("* * * * * addAlbum() FAILED for Album: "+albumItem.name+" * * * * *" );
	});
	
	return dirPromise;
};

// returns a promise that will resolve to true if there were any items
// that were cached (i.e. there were some uncached items to cache), and false if the album had no
// uncached items.
SyncRemoteAlbumsAssistant.prototype._albumHasUncachedEntries = function(albumId) {
	var promise = Promise();
	var that = this;
	//check if this album has anything uncached and if yes,
	//tag on to the caching queue
	var dbResponse=function(results){
		if(results.count>0)
		{
			//we still want to tag on to syncing in the album
			//as we have not yet cached all images for this
			//specific album
			promise.fulfill(true);

		}else{
			//we fulfill the promise immediately as no need to trigger caching on this one
			that.log("Nothing changed, no need to trigger caching");
			promise.fulfill(false);
		}
	};
	var reqForUnCached = serviceHandle.request(
			'com.palm.db/find',
			{
				"query":{
					"from":"com.palm.media.image.file:1",
					"where":[{"prop":"albumId","op":"=","val":albumId},{"prop":"appCacheComplete","op":"=","val":"unattempted"}],
					"limit":1
				},
				"count":true
			},
			dbResponse
		);
	return promise;
};


//this function compares the photos in remote list and mojoDB list to figure
//if new photos were added to the album
SyncRemoteAlbumsAssistant.prototype._doAlbumWork = function(albumItem,isNew)
{
	//console.info("Doing album work for :"+JSON.stringify(albumItem));
	var albumPromise = Promise();
	var that=this;
	var photoPromiseSet=[];
	//console.info("Querying for photos for:"+JSON.stringify(albumItem.name));
	if(!AccountsCapability[albumItem.type].getPhotos) {
		var msg ="Photos Download Not supported by :"+albumItem.type;
		// Photos download is not supported by this account type. So we need to skip this
		this.log(msg);
		albumPromise.fulfill(msg);
	}
	else {
		if (deleted_accounts_hash[albumItem.accountId])
		{
			deleted_albums_hash[albumItem._id] = albumItem;
			albumPromise.breakk("*#*#*#*#*#*#*#**#* SyncRemoteAlbumsAssistant._doAlbumWork will not sync a DELETED Album " + albumItem._id);
			return albumPromise;
		}
		
		var queryPromise = this.sequentialRemotePhotosQuery(albumItem);
		
		queryPromise.whenFulfilled(function(photoList){
			that.log("* * * * *  _doAlbumWork sequentialRemotePhotosQuery Fulfilled for Album: \""+albumItem.name+"\" * * * * *");
			var interimPromise =Promise();
			//console.info("Getting photos:"+JSON.stringify(photoList));
			//update the album to have the right number of images and video count
			if(AccountsCapability[albumItem.type].computeNumFiles)
			{
				var total;
				var  needUpdate =true;
				//we donot want this task to stop the service to continue downloading images so lets just update this parallely
				//@todo consider simplifying the code by not doing a special case for when videoDownload is not supported...
				//      it seems like the speedup would be negligible, and not pay for the extra code complexity
				if(AccountsCapability[albumItem.type].videoDownload)
				{
					//need to go through the list and figure out 
					//how many images and videos
					var imageCount=0;
					var videoCount=0;
					photoList.forEach(function(photo){
						if(photo.type=="image")
						{
							++imageCount;
						}
						else
						{
							++videoCount;
						}
					});
					if((albumItem.total && (albumItem.total.images !== imageCount || albumItem.total.videos !== videoCount)) || !albumItem.total)
					{
						that.log("Generating a album total");
						total={"images":imageCount,"videos":videoCount};
					
					}
					else
					{
						needUpdate=false;
					}
				}
				else
				{	
					if((albumItem.total && albumItem.total.images !== photoList.length) || !albumItem.total)
					{
						total ={"images":photoList.length,"videos":0};
					}else{
						//we save an unnecessary update to album
						needUpdate =false;
					}
				}
				if(needUpdate)
				{
					//console.info("****************merging");
					var mergeAlbum ={
							"_id"  :albumItem._id,
							"total":total
					};
					albumItem.total=total;
					var promise = mergeEntryToDb(mergeAlbum,"album",false,that.dbgTime);
					promise.whenFulfilled(function(){
						//console.info("Album count successfully updated for "+albumItem.name);
					});
					promise.whenBroken(function(err){
						that.log(" _doAlbumWork Album count failed to update for \""+albumItem.name+"\"");
					});			
				}
				
			}
			
			if(isNew) {
				// We don't want to download all photos in the album simulaneously, because we were
				// seeing problems when we opened too many concurrent HTTP connections.  Instead,
				// wait until the previous download completed before starting the next.
				that.log("* * * * * * _doAlbumWork \""+ albumItem.name +"\" is new Album, interim used _sequencing_photo_work * * * * * ");
				that._sequencing_photo_work(photoList,albumItem,interimPromise);
			}
			else {
				//we generate the changes between local and remote
				//only when we know this album existed earlier
				//if it is new then we dont need to to this
				//@todo handle multiple pages of photos
				var  dbResponse= function(response){
					if(!response.returnValue) {
						albumPromise.breakk("Unable to query the db for list of photos for album:\""+albumItem.name+"\", error:"+JSON.stringify(response));
						return;  // from dbResponse();
					}
					else {
						var localPhotoResult =response.results;
						//var ind= albumItem.type.lastIndexOf('.');
						//var transportProp = albumItem.type.substr(ind+1);
						var changes = that._comparePhotoResult(photoList,localPhotoResult,albumItem.type);
						//do the deletes
						changes.toDelete.forEach(function(photo){
							photoPromiseSet.push(removePhoto(photo,that.dbgTime));
						});
						//do the updates
						changes.toUpdate.forEach(function(photo){
							photoPromiseSet.push(mergeEntryToDb(photo,"photo",false,that.dbgTime));
						});
						//do the adds
						//adding photos in a sequence now rather than parallely to avoid parallel image downloads
						//which could potentially cause problems.
						
						var promise =Promise(); 
						that._sequencing_photo_work(changes.toAdd,albumItem,promise);
						photoPromiseSet.push(promise);
						//changes.toAdd.forEach(function(photo){
						//	photoPromiseSet.push(that._doPhotoWork(photo,albumItem));
						//});
						//photopromise set is zero whenever we have finished downloading all 
						//the pictures and we have a photodbEntry for each of the images
						//but this does not mean we have all the images cached for those entries
				
						if(photoPromiseSet.length===0)
						{
							//Check if the album has pictures
							//that still needs thumbnail caching and hence have not shown up 
							//in the app yet.
							//If there are such pictures, we want to tag on to a global caching promise
							//and do not let the status on the account (in accounts manager in photos service) to go idle, until the images 
							//have been cached.  We do this by fulfilling "interimPromise" with "true"
							//eg: 
							//    1. Add facebook account
							//    2. this would trigger download of imges for the account's albums
							//    3. After images for one album is finished downloading, we ask to be tagged on to the caching promise if it already exists/ if not we start caching and create a new caching promise
							//    5. Put device on msm mode in this state
							//    6. This stops the service and hence stops caching
							//    7. next time service starts up (say the app resubscribes to the service for sync status)
							//    8. we start syncing all the accounts and also start caching what is not yet cached 
							//    9. at this point a fresh sync of the facebok account will start and the photoPromiseSet size will be zero (as all images were downloaded and db Entries made in the previous sync)
							//    10. But the caching is not yet complete, so we should not be fulfilling the albumPromise yet (so that the spinner is on until all images for this album get cached)
							//    11. so we check if an album has uncached images even though there are no images that have been downloaded and thumbnails generated for it and if yes we tag on to a global caching promise
							//        if it already exists.
							interimPromise.fulfill(that._albumHasUncachedEntries(albumItem._id));
						}
						else
						{
							interimPromise.fulfill(PromiseSet(photoPromiseSet,false));
						}
					}
				};
				var reqForPhotos = _dbFind(
						{
							'query': {
								'from':'com.palm.media.types:1', 
								'where':[{'prop':'albumId','op':'=','val':albumItem._id}]
							}
						},
						dbResponse
					);
				
			}
			
			interimPromise.whenFulfilled(function(needCaching){
				
				if (deleted_accounts_hash[albumItem.accountId])
				{
					albumPromise.breakk("*#*#*#*#*#*#*#**#* SyncRemoteAlbumsAssistant._doAlbumWork will not sync a DELETED Album " + albumItem._id);
					return;
				}
				
				that.log("* * * * *  _doAlbumWork Interim Fulfilled!!!  for Album: "+albumItem.name+" * * * * *");
				
				if(!needCaching){
					that.log("**** _doAlbumWork No need caching \""+albumItem.name +"\" so just fulfill the album promise");
					albumPromise.fulfill(true);
				}else
				{
					var cacheAssistant= new CacheGenerateAssistant();
					if(inDebugMode){
						cacheAssistant.dbgTime = DbgTimeAssistant();
					}
					//we are telling cache generator we want to attach to the global 
					//promise (which we know exists) as we want the spinner to spin until all images are cached
					var finishPromise=cacheAssistant.checkAndGenCache(true);
					if (deleted_accounts_hash[albumItem.accountId]){
						deleted_accounts_hash[albumItem.accountId].interimSync = true;
					}
					finishPromise.whenFulfilled(function(msg){
						that.log("******* _doAlbumWork Finished caching:"+msg);
						if(cacheAssistant.dbgTime)
						{
							that.log("Broken down timing:"+JSON.stringify(cacheAssistant.dbgTime.getDbgPropertyValues()));
						}
					});
					finishPromise.whenBroken(function(msg){
						that.log("******* _doAlbumWork Caching Failed!!:"+msg);
						if(cacheAssistant.dbgTime){
							that.log("Broken down timing:"+JSON.stringify(cacheAssistant.dbgTime.getDbgPropertyValues()));
						}
					});
					that.log("* * * * _doAlbumWork Attaching Album \""+albumItem.name +"\" Promise to Global Cache Promise");
					albumPromise.fulfill(finishPromise);
					
				}
			});
			
			interimPromise.whenBroken(function(errmsg){
				that.log("* * * * *  _doAlbumWork Interim BROKE!!!  for Album: \""+albumItem.name+"\" " +errmsg+" * * * * *",1);
				albumPromise.breakk(errmsg);
			});
		});
		
		queryPromise.whenBroken(function(errmsg){
			that.log("* * * * *  _doAlbumWork sequentialRemotePhotosQuery BROKE for Album: \""+albumItem.name+"\" " +errmsg+" * * * * *",1);
			albumPromise.breakk(errmsg);
		});
		
	}

	return albumPromise;
	
};

SyncRemoteAlbumsAssistant.prototype._sequencing_photo_work = function(photoList,albumItem,interimPromise){
	var error=null;
	var that=this;
	var downloadNextPhoto = function(index){
		var photo=photoList[index];
		
		if (photo && deleted_albums_hash[albumItem._id]){
			interimPromise.breakk("*#*#*#*#*#*#*#**#* SyncRemoteAlbumsAssistant._sequencing_photo_work will not download an Image for a DELETED Album " + albumItem._id);
			return;
		}
		if(index < photoList.length){
			var prom =that._doPhotoWork(photo,albumItem);
			++index;
			that.log("* * * * _sequencing_photo_work \""+albumItem.name+"\" "+index+"/"+photoList.length);
			prom.whenBroken(function(msg){
				downloadNextPhoto(index);
				if(!error){
					error=msg;
				}
			});
			prom.whenFulfilled(function(){
				downloadNextPhoto(index);
			});
		}else{
			
			if(error)
			{
				that.log("* * * * _sequencing_photo_work Completed for \""+albumItem.name+"\" With Failures "+error);
				interimPromise.breakk(error);
			}else
			{
				that.log("* * * * _sequencing_photo_work Completed for \""+albumItem.name+"\" All Downloaded!!! * * * * ");
				interimPromise.fulfill(true);
			}
		}
	};
	downloadNextPhoto(0);
};

SyncRemoteAlbumsAssistant.prototype.photos_service_request_stack = [];
SyncRemoteAlbumsAssistant.prototype.photos_service_request_busy = false;

SyncRemoteAlbumsAssistant.prototype.sequentialRemotePhotosQuery = function(albumItem){
	var that = this;
	var reqPromise = Promise();
	var processNext = undefined;
	//console.log("* * * * * * * * sequentialRemotePhotosQuery for "+albumItem.name + " * * * * * * * *");
	that.photos_service_request_stack.push({alb: albumItem, prm: reqPromise});

	
	var processRequests = function(){
		
		if (!that.photos_service_request_busy){
			
			that.photos_service_request_busy = true;
			
			processNext = function(){
				if (that.photos_service_request_stack.length > 0){
					var currentRequest = that.photos_service_request_stack.pop();
					
					that.log("* * * * * * * * Current Remote Request for \""+currentRequest.alb.name + "\" type: "+ currentRequest.alb.type +" * * * * * * * *");
					
					var queryItemPromise= that._queryRemotePhotosForAlbum(currentRequest.alb);

					//Notify us of completion so we can move on to next stack item
					queryItemPromise.whenFulfilled(processNext);
					queryItemPromise.whenBroken(processNext);

					//Respond to caller
					currentRequest.prm.fulfill(queryItemPromise);
				}
				else {
					that.photos_service_request_busy = false;
				}
			};
			//Kick off Processing of Items in stack			
			processNext();
		}
	};
	
	processRequests();
	
	return reqPromise;
};



SyncRemoteAlbumsAssistant.prototype._queryRemotePhotosForAlbum = function(albumItem){
 	var resultPromise = Promise();
	var timeout = 60000;//1 minute
	var retries = 3;
	var alarm = undefined;
	var photoRequest = undefined;
	var failMsg ="Tried querying photos for "+albumItem.name+ " 3 times and failed, quitting!!!";
	var serviceAPI= AccountsCapability[albumItem.type].serviceName+"/listPhotos";
	var params ={'accountId': albumItem.accountId,"aid":albumItem.aid};
	var that = this;
	//--remove this-------this needs to be removed as service in snapfish needs to change to use "aid"
	if(albumItem.type === "com.palm.snapfish")
	{
		params.albumId=albumItem.aid;
	}
	
	var cloudResponse = function(response){
		//Stop Current Monitor
		clearTimeout(alarm);
		//if failed and retries less than x, retry x times 
		if (response.returnValue){
			that.log("* * * * * _queryRemotePhotosForAlbum Remote Album \"" +albumItem.name + "\" Succeeded !!!! "+retries + "left");
			resultPromise.fulfill(response.photos);
		}
		else {
			// The request didn't succeed... should we try again?
			that.log("* * * * * _queryRemotePhotosForAlbum Remote Album \"" +albumItem.name + "\" FAILED !!!! "+retries + "left",1);
			if (retries-- > 0) {
				makeCloudRequest();
				monitorRequest();
			}
			else {
				resultPromise.breakk(failMsg);
			}
		}
	};
	
	var alarmFired = function(){
		that.log("* * * * * _queryRemotePhotosForAlbum Remote Album \"" +albumItem.name + "\" Timeout Reached !!!! "+retries + "left",1);
		photoRequest.cancel();
		if (retries-- > 0){
			makeCloudRequest();
			monitorRequest();
		}
		else {
			resultPromise.breakk(failMsg);
		}
	};
	
	var makeCloudRequest = function(){
		photoRequest=serviceHandle.request(serviceAPI, params, cloudResponse);
	};
	
	var monitorRequest = function(){
		alarm = setTimeout(alarmFired,timeout);
	};
	
	makeCloudRequest();
	monitorRequest();
	
	return resultPromise;
};

SyncRemoteAlbumsAssistant.prototype._addAlbumToDb = function(albumItem,accountItem){
	//console.info("Adding album to db:"+JSON.stringify(albumItem));
	var addToDbPromise =Promise();
	var that = this;
	var D = new Date();
	var albumEntry={
			"_kind"    : "com.palm.media.image.album:1",
			"name"     :albumItem.name,
			"path"     : albumItem.path,
			"total"    :albumItem.size,
			"type"     :accountItem.templateId,
			"aid"      : albumItem.aid,
			"accountId":accountItem.accountId,
			"showAlbum":true ,
			"modifiedTime": Math.floor((new Date(D.getUTCFullYear(), D.getUTCMonth(), D.getUTCDate(), D.getUTCHours(),
			    D.getUTCMinutes(), D.getUTCSeconds()).getTime())/1000)
			};
	if(albumItem.size)
	{
		//sometimes remote sync may not send us this value
		albumEntry.total=albumItem.size;
	}
	var albumReply=function(response){
		if(response.returnValue){
			albumEntry._id =response.results[0].id;
			addToDbPromise.fulfill(albumEntry);
		}else{
			var msg ="MOJODB FAILED!!!!!!!!:"+JSON.stringify(response);
			that.log(msg);
			addToDbPromise.breakk(msg);			
		}
	};

	var albumAddRequest=serviceHandle.request('com.palm.db/put', {
		"objects":[albumEntry]
	}, albumReply);
	
	return addToDbPromise;
};


//the photo item is what we get from karen's service {pid:"","src_big":"","src_small":"","type":""}
//the albumItem is what we have in mojoDb for that album

SyncRemoteAlbumsAssistant.prototype._doPhotoWork = function(photo,albumItem){
	//console.info("*******************************Doing photo work for :"+JSON.stringify(photo));
	var that=this;
	var photoPromise = Promise();
	var urlObj={"host":"","path":"","fileName":""};
	parseUrl(photo.src_big,urlObj);
	// Providers may supply the real filename explicitly (e.g. Dropbox temporary links
	// end in an opaque token, not a name.ext) - prefer it so the local file keeps its
	// name and extension, which the thumbnail/extractfs pass relies on.
	if (photo.fileName) { urlObj.fileName = photo.fileName; }
	var destUrl=albumItem.path+"/"+urlObj.fileName;
	//node_path.exists(destUrl, function(exists) {
	//	if(exists){
			//console.info("!!!!!!!!!!Image already Exists for:"+destUrl);
	//		photoPromise.fulfill("!!!!!!!!!!Image already Exists for:"+destUrl);
	//	}else{
	//it is possible photo might have been downloaded while in the middle of pulling 
	//battery out
	//so we download the whole image again
	
	photoPromise.fulfill(that._downloadAndUpdateDb(
				urlObj.host, //domain
				urlObj.path, //downloadFrom
				destUrl,		 //downloadTo
				photo,		 //photo
				albumItem    //albumUrl
			));
		
	//	}
	//});
	return photoPromise;
};

/*
 * _downloadImage: given the domain name, download from url, and download to paths
 *  this function will download an image into the path specified
 *  
 *  type: private
 */


SyncRemoteAlbumsAssistant.prototype._downloadAndUpdateDb=function(domain,downloadFrom,downloadTo,photo,albumItem){
	//console.info("Download and updateDb called for: "+JSON.stringify(photo));
	//for files we sync remotely we donot want to add the file name as
	//file names have weird crap in them which makes the web browser to 
	//unescape these characters while rendering. this makes the url invalid
	//and hence the images don't show up in the app
	//check bug DFISH-5034 or DFISH-9495 for examples of weird file names.
	
	downloadTo=downloadTo.replace(/%/g,"_");
	
	var that=this;
	var wait = 130000; //curl gets --max-time 120; give the wrapper a little more
	var timeout = null;
	var finishedPromise =Promise();
	var start = new Date();
	var downloadError = null;
	// Synergy-revival: the device node is OpenSSL 0.9.8 and node_http.createClient(80,..)
	// is plain HTTP - it cannot fetch modern-TLS cloud URLs (e.g. Dropbox temporary links).
	// Shell out to the SYSTEM curl /usr/bin/curl (a wrapper that sets its own
	// LD_LIBRARY_PATH + CURL_CA_BUNDLE; curl 7.88.1/OpenSSL 1.1.1w) with photo.src_big. After the
	// bytes land locally (_addPhotoToDb, thumbnails, rendering) is unchanged and TLS-free.
	var SYS_CURL   = "/usr/bin/curl";
	var SYS_CAINFO = "/etc/ssl/certs/ca-certificates.crt";
	var startDownload = function(){
		try {
			var node_cp = require('child_process');
			var srcUrl = photo.src_big; //full https URL (temp link); split domain/path assumed port 80
			// --create-dirs: make the album directory hierarchy if missing (node's
			// createWriteStream would not, and curl exit 23 = cannot open output file).
			var child = node_cp.spawn(SYS_CURL,
				["-sS","-L","--fail","--create-dirs","--max-time","120","--cacert",SYS_CAINFO,"-o",downloadTo,srcUrl]);
			var stderr = "";
			child.stderr.on('data', function(d){ stderr += d; });
			child.on('error', function(err){
				if (downloadError!==null) { return; }
				downloadError = "curl spawn error: "+err;
				that.log("* * * curl spawn error for "+downloadTo+": "+err,1);
				clearTimeout(timeout);
				finishedPromise.breakk(downloadError);
			});
			child.on('exit', function(code){
				if (downloadError!==null) { return; }
				if (code===0){
					if(that.dbgTime){ that.dbgTime.addTimeToDbgProperty(((new Date())-start),'ImgDownload'); }
					clearTimeout(timeout);
					finishedPromise.fulfill(that._addPhotoToDb(downloadTo,photo,albumItem));
				} else {
					downloadError = "curl exit "+code+" :: "+stderr;
					that.log("* * * curl download failed for "+downloadTo+": "+downloadError,1);
					clearTimeout(timeout);
					finishedPromise.breakk(downloadError);
				}
			});
		}
		catch(e){
			that.log("*#*#*#*#* Exception spawning curl "+JSON.stringify(e),1);
			finishedPromise.breakk(JSON.stringify(e));
		}
	};
	startDownload();
	timeout = setTimeout(function(){
		if(downloadError===null){
			var msg = "* * * * * _downloadAndUpdateDb TIMEDOUT !!! \"" +albumItem.name +"\"";
			downloadError = msg;
			that.log(msg,1);
			finishedPromise.breakk(msg);
		}
	},wait);
	return finishedPromise;
};

SyncRemoteAlbumsAssistant.prototype._addPhotoToDb = function(downloadTo,photo,albumItem)
{
	//console.info("Adding phototo db: "+JSON.stringify(photo));
	var photoEntryPromise =Promise();
	var that=this;
	var typeProp = albumItem.type;
	//now adding path and apporiginal instead of thumbnail
	//we are downloading src_big for DFISH-6555
	var D = new Date();
	var photoEntry={
			"_kind": "com.palm.media.image.file:1",
			"albumId":albumItem._id,
			"mediaType":"image",
			"accountId":albumItem.accountId,
			"albumPath":albumItem.path,
			"type":albumItem.type,
			"appCacheComplete":"unattempted",
			"path":downloadTo,
			"appOriginal":downloadTo,
			"createdTime": Math.floor((new Date(D.getUTCFullYear(), D.getUTCMonth(), D.getUTCDate(), D.getUTCHours(),
			    D.getUTCMinutes(), D.getUTCSeconds()).getTime())/1000)
		   };
	photoEntry[typeProp]=photo;
	
	var dbAlbumReply =function(dbPhoto,downloadTo,response)
	{
		if(response.returnValue){
			var msg ="MOJODB PASSED!!!!!!!!!!! **** pushed photo Entry for :"+JSON.stringify(dbPhoto);
			//console.info(msg);
			photoEntryPromise.fulfill(msg);
			
			
			//we donot want to do the caching here. 
			//We are leaving it to the cache generator
			//which we will call into when atleast one album 
			//is finished with downloading
			
			/*dbPhoto._id =response.results[0].id;
			var promiseSet=[];
			//queue a request for appGridThumbnail and an appStripThumbnail;
			that.reqArgs.forEach(function(entry){
				var taskId = entry.thumbType+"-"+dbPhoto._id;
				var task = checkIfTaskAlreadyInHash(taskId);
				if (!task) {
					var ph = clone(dbPhoto);
					//console.info("Original entry:"+JSON.stringify(dbPhoto)+ ",Cloned phEntry:"+JSON.stringify(ph));
					ph.height =entry.height;
					ph.width = entry.width;
					
					ph.propToAdd =entry.thumbType;
					task = new ThumbProcessTask(ph);
					taskHash[taskId] = task;
				}
				//console.info("*******Scheduling :"+taskId+","+JSON.stringify(ph));
				promiseSet.push(task.resultPromise);
				taskQueue.schedule(task);
				
			});
			var cachedPromise = Promise();
			cachedPromise.fulfill(PromiseSet(promiseSet,false));
			cachedPromise.whenFulfilled(function(){
				var dbEntry={
						_id:dbPhoto._id,
						appCacheComplete:true
				};
				mergeEntryToDb(dbEntry,"photo");
			});
			
			cachedPromise.whenBroken(function(){
				var dbEntry={
						_id:dbPhoto._id,
						appCacheComplete:false
				};
				mergeEntryToDb(dbEntry,"photo");
			});*/
				
		}else{
			var msgg ="MOJODB FAILED!!!!!!!! for downloadTo:"+JSON.stringify(response);
			//console.info(msgg);
			photoEntryPromise.breakk(msgg);
			
			//remove the file from the file system
			var delPromise =deleteDirOrFile(photo.path,false,that.dbgTime);
				delPromise.whenFulfilled(function(msg){
					//console.info("Removing photo File: "+msg);
				});
				delPromise.whenBroken(function(msg){
					//console.info("Removing photo File: "+msg);
				});
		}
	};
	//console.info("Adding photoEntry:"+JSON.stringify(photoEntry));
	if(inMSMMode){
		that.log("!!!!!!!!!!!!!!!!!!in MSM Mode, dont update db Entry");
		photoEntryPromise.breakk("In MSMMode not processing photos");
	}else{
		var reformatPromise = formatAndRenameImage(downloadTo);
		reformatPromise.whenFulfilled(function(newPath){
			photoEntry.path = newPath;
			photoEntry.appOriginal = newPath;
			var photoAddRequest=serviceHandle.request('com.palm.db/put', {
				"objects":[photoEntry]
			}, dbAlbumReply.bind(that,photoEntry,downloadTo));
		});
		reformatPromise.whenBroken(function(msg){
			photoEntry.appCacheComplete = false;
			if(inMSMMode){
				photoEntry.appCacheComplete = "unattempted";
			}
			that.log(JSON.stringify(msg));
			var photoAddRequest=serviceHandle.request('com.palm.db/put', {
				"objects":[photoEntry]
			}, dbAlbumReply.bind(that,photoEntry,downloadTo));
		});
		
	}
	
	return photoEntryPromise;
};


SyncRemoteAlbumsAssistant.prototype._createCheckRequiredDirs =function(remoteSyncType)
{
	this.log("*****************_createCheckRequiredDirs:for "+remoteSyncType);
	var dirPromise = Promise();
	
	dirPromise.fulfill(createCheckForDir(cacheLoc+"/"+remoteSyncType,this.dbgTime));

	return dirPromise;
};

SyncRemoteAlbumsAssistant.prototype._generateChanges=function(remoteResult,localResult,property,mappingFnc)
{
	var that=this;
	var remoteMapRes = mappingFnc(remoteResult,property,"remote");
	var localMapRes  =  mappingFnc(localResult,property,"local");

	//determine the deleted items
	var delItems=[];

	localResult.forEach(function(lItem){
		
		if(!remoteMapRes[lItem[property]])
		{
			delItems.push(clone(lItem));
		}
	});
	
	
	var addItems=[];
	var updateItems=[];
	remoteResult.forEach(function(rItem){
		var localItem =localMapRes[rItem[property]];
		//console.info("LocalItem is:"+JSON.stringify(localItem));
		if(!localItem)
		{
			//determine the added items
			addItems.push(clone(rItem));
		}else{
			
			var dirty =false;
			//console.info("****Local Item:"+JSON.stringify(localItem)+",*****remote Item:"+JSON.stringify(rItem));
			//the remote item exists locally so 
			//check if we need to update anything
			if(property==="aid"){
				
				if (localItem.name !== rItem.name)
				{
					localItem.name =rItem.name;
					dirty=true;
				}
				if(that.needShowAlbum && (localItem.showAlbum !== that.needShowAlbum))
				{
					localItem.showAlbum = that.needShowAlbum;
					dirty=true;
					
				}
				if(!AccountsCapability[localItem.type].computeNumFiles)
				{
					//we do this only if by default remote album passes the size
					//otherwise we anyway update the album size everytime
					if(localItem.total.images !==rItem.size.images)
					{
						localItem.total.images =rItem.size.images;
						dirty =true;
					}
					if(localItem.total.videos !==rItem.size.videos)
					{ 
						localItem.total.videos =rItem.size.videos;
						dirty=true;
					}
				}
			}else{
				//console.info("Update Check for photo: "+JSON.stringify(localItem)+"\n"+JSON.stringify(rItem));
				if(localItem.caption != rItem.caption)
				{
					//console.info("remote photo is dirty");
					localItem.caption = rItem.caption;
					dirty=true;
				}
			}
			if(property === "pid" && dirty)
			{
				//we want to remove the rev property while merging 
				//to avoid merge error
				delete localItem._rev;
				delete localItem.pid;
				updateItems.push(clone(localItem));
				
			}
			else if(property ==="aid")
			{
				if(dirty){
					localItem.dirty =true;
				}
				//we want to remove the rev property while merging 
				//to avoid merge error
				delete localItem._rev;
				updateItems.push(clone(localItem));
				
			}
		}

	});
	
	var result ={"toDelete":delItems,"toAdd":addItems,"toUpdate":updateItems};
	
	return result;
};

SyncRemoteAlbumsAssistant.prototype._compareAlbumResult=function(remoteAlbumResult,localAlbumResult)
{
	var mappingFnc =function(itemArray,property)
	{
		var res ={};
		itemArray.forEach(function(item){
			res[item[property]]=item;
		});
		return res;
	};
	var result = this._generateChanges(remoteAlbumResult, localAlbumResult, "aid", mappingFnc);
	//console.info("ALbum compare Result:"+JSON.stringify(result));
	return result;
};


SyncRemoteAlbumsAssistant.prototype._comparePhotoResult=function(remotePhotoResult,localPhotoResult,transportProp)
{
	//get the local photo result
	var mappingFnc =function(itemArray,property,type)
	{
		
		var res ={};
		itemArray.forEach(function(item){
			if (type==="remote"){
				res[item[property]]=item;
			}else{
				
				var t=item[transportProp];
				var p=t[property];
				//we are doing this so that _generateChanges can be generic
				item[property] = p;
				res[p]=item;
			}
		});
		
		return res;
	};
	var result = this._generateChanges(remotePhotoResult, localPhotoResult, "pid", mappingFnc);
	this.log("Photos compare Result:"+JSON.stringify(result));
	return result;
};



//for jasmine

exports.SyncRemoteAlbumsAssistant = SyncRemoteAlbumsAssistant;