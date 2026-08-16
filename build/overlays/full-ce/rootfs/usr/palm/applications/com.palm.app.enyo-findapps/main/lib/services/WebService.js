enyo.kind({
    name: "findApps.WebService",
    kind: enyo.WebService,
    create: function() {
        this.inherited(arguments);
        this.cacheUtil = findApps.CacheUtil.getInstance("com.hp.app.findApps.WebService.", AppCatalog.Config.CacheConfig.persistent);
        this.cacheUtil.setEnabled(AppCatalog.Config.CacheConfig.enabled);
    }
    ,
    dispatchResponse: function(inDelegate, inRequest, errors) {
        if(inDelegate && inDelegate.scope){
            this.dispatch(inDelegate.scope, inDelegate.handler, [inRequest.response, inRequest, inDelegate.props, errors]);
        }else{
            this.dispatch(this.owner, inDelegate, [inRequest.response, inRequest]);
        }
    }
    ,
    setRequestProps: function(props){
        this.setUrl(props.url);
        this.setMethod(props.method);
        this.setHandleAs(props.handleAs);
        this.setContentType(props.contentType);
        this.setSync(props.sync);
        this.setHeaders(props.headers);
        this.setUsername(props.username);
        this.setPassword(props.password);
    }
    ,
    sendRequest: function(props) {
        this.setRequestProps(props);
        
        this.log(
            "Service:", props.service,
            "URL:", props.url,
            "Method:", props.method,
            "Headers:", props.headers,
            "Body:", props.body,
            "Expires:", this.expires
            );
        
        if(props.expires){
            var key = findApps.WebService._generateKey(props);
            var cached = this.cacheUtil.get(key);
            if(cached){
                if(props.scope && props.scope.corelationId){
                    var req = cached.inRequest.params;
                    req = req?(enyo.isString(req)?JSON.parse(req):req):{};
                    req.corelationId = props.scope.corelationId;
                    cached.inRequest.params = JSON.stringify(req);
                }
                cached.inRequest.onSuccess = {
                    handler: props.onSuccess, 
                    scope: props.scope,
                    props: props
                };
                this.log("RESPONSE OBTAINED FROM "+(AppCatalog.Config.CacheConfig.persistent?"PERSISTENT":"MEMORY")+" CACHE");
                this.responseSuccess(cached.inRequest, true);
                return;
            } else {
                this.cacheUtil.set(key, props.expires);
            }
        }
        
        this.call(props.body, {
            onSuccess: props.onSuccess?{
                handler: props.onSuccess, 
                scope: props.scope,
                props: props
            }:"",
            onFailure: props.onFailure?{
                handler: props.onFailure, 
                scope: props.scope,
                props: props
            }:"",
            onResponse: props.onResponse?{
                handler: props.onResponse, 
                scope: props.scope,
                props: props
            }:""
        });
    }
    ,
    //
    // Any error caught in gotSuccess will be redirected to the failure handler
    //
    responseSuccess: function(inRequest, fromCache) {
        var resp = inRequest.response;
        var props = inRequest.onSuccess.props;
        var errors = [];
        var responseStatusCode = findApps.WebService.parseStatusCode(resp);
        var serverException = findApps.WebService.parseServerException(resp);
        var xhrStatusCode = findApps.WebService.parseXhrStatusCode(inRequest);
        
        if (serverException) {
            errors.push(serverException);
            errors.push("RESP0002");
        }
        if (xhrStatusCode !== 200) {
            this.error("xhrStatusCode:", xhrStatusCode);
            errors.push("RESP0001");
        }
        if (resp === "") { // documented in APPC-7726
            if (inRequest.didTimeout) {
                errors.push("RESP0003");
            } else {
                errors.push("RESP0004");
            }
        }
        if (responseStatusCode !== "OK" && responseStatusCode !== "") {
            this.error("responseStatusCode: ", responseStatusCode);
            errors.push("RESP0005");
        }
        findApps.WebService.local_testing(errors, this, inRequest);
        
        var key = "";
        if(!fromCache){
            key = findApps.WebService._generateKey(props);
        }
        
        if (errors.length === 0) {
            if(!fromCache){
                this.log("Service: ", (props?props.service:""), "URL: ", inRequest.url, "response:", resp, "responseStatusCode:", responseStatusCode, "xhrStatusCode:", xhrStatusCode, "latency:", inRequest.latency, "timeoutjob:", inRequest.timeoutJob);
            }
            
            if(key){
                // if key exists then update value of cache entry
                // no entry will be created since expires param is null
                // but the value of the already existing cache entry will be updated
                this.cacheUtil.set(key, null, {
                    inRequest: {
                        response: resp,
                        url: inRequest.url,
                        method: inRequest.method,
                        params: inRequest.params,
                        xhr: {
                            status: findApps.WebService.parseXhrStatusCode(inRequest)
                        }
                    }
                });
            }
            this.dispatchResponse(inRequest.onSuccess, inRequest);
        } else {
            if(key){
                this.cacheUtil.clear(key);
            }
            this.responseFailure(inRequest, errors);
        }
    }
    ,
    responseFailure: function(inRequest, errors) {
        var resp = inRequest.response;
        var props = inRequest.onFailure.props;
        errors = errors || [];
        var responseStatusCode = findApps.WebService.parseStatusCode(resp);
        var serverException = findApps.WebService.parseServerException(resp);
        var xhrStatusCode = findApps.WebService.parseXhrStatusCode(inRequest);
        if (serverException) {
            errors.push(serverException);
            errors.push("RESP0009");
        }
        if (xhrStatusCode !== 200) {
            this.error("xhrStatusCode:", xhrStatusCode);
            errors.push("RESP0010");
        }
        if (resp === "") { // documented in APPC-7726
            if (inRequest.didTimeout) {
                errors.push("RESP0011");
            } else {
                errors.push("RESP0012");
            }
        }
        if (responseStatusCode !== "OK" && responseStatusCode !== "") {
            this.error("responseStatusCode: ", responseStatusCode);
            errors.push("RESP0013");
        }
        errors.push("RESP0006");
        this.error("Service: ", (props?props.service:""), "URL: ", inRequest.url, "response: ", resp, "serverException:", serverException, "responseStatusCode:", responseStatusCode, "xhrStatusCode:", xhrStatusCode, "latency:", inRequest.latency, "timeoutjob:", inRequest.timeoutJob, "errors", errors.toString());
        this.dispatchResponse(inRequest.onFailure, inRequest, errors);
    }
    ,
    response: function(inRequest) {
        var resp = inRequest.response;
        var props = inRequest.onResponse.props;
        var errors = [];
        var statusCode = findApps.WebService.parseStatusCode(resp);
        var serverException = findApps.WebService.parseServerException(resp);
        var xhrStatusCode = findApps.WebService.parseXhrStatusCode(inRequest);
        this.log("Service: ", (props?props.service:""), "URL: ", inRequest.url, "statusCode", statusCode, "response: ", resp, "serverException", serverException, "xhrStatusCode", xhrStatusCode);
        if (xhrStatusCode !== 200) {
            errors.push("RESP0007");
        }
        if (serverException) {
            errors.push(serverException);
            errors.push("RESP0008");
        }
        if (resp === "" && inRequest.didTimeout) {
            errors.push("RESP0011");
        }
        // Added local testing support in gotResponse as well
        findApps.WebService.local_testing(errors, this, inRequest);
        this.dispatchResponse(inRequest.onResponse, inRequest, errors);
    }
});

enyo.mixin(findApps.WebService, {
    parseServerException: function(inResponse) {
        var result = "";
        if (inResponse) {
            if (inResponse.results && inResponse.results.body && inResponse.results.body.error) {
                result = inResponse.results.body.error; //APPCAT_
            } else if (inResponse.JSONException) {
                result = inResponse.JSONException.errorCode //PMT
                || inResponse.JSONException.errorCodes; //DISC_
            }
        }
        if (typeof result === "undefined") {
            result = "";
        }
        return result;
    }
    ,
    parseStatusCode: function(inResponse) {
        return (inResponse && (inResponse.statusCode || (inResponse.results && inResponse.results.statusCode))) || "";
    }
    ,
    parseXhrStatusCode: function(inRequest) {
        return inRequest && inRequest.xhr && inRequest.xhr.status || -1;
    }
    ,
    _generateKey: function(props){
        if(!props) return "";
        
        var url = props.url;
        var method = props.method;
        var body = props.body;
        var bodyObj = {};
        if(body){
            bodyObj = enyo.isString(body)?JSON.parse(body):body;
            if(props.scope){
                props.scope.corelationId = bodyObj.corelationId;
            }
            if(bodyObj.corelationId){
                bodyObj.corelationId = "";
            }
        }
        var rawKey = url + method + (enyo.json.stringify(bodyObj));
        return findApps.Utilities.getHashCode(rawKey);
    }
    ,
    local_testing: function (errors, inSender, inRequest) {
        //For testing purposes only
        // We can short circuit the services by putting the service name into /tmp/service
        if (AppCatalog.Config.testServerErrors) {
            var xmlhttp = new XMLHttpRequest();
            //echo "BrowseAppsService" > /tmp/service
            xmlhttp.open("GET", "/tmp/service", false);
            xmlhttp.send();
            var val = xmlhttp.responseText.trim() || "";
            var service = (inSender && inSender.service) ? (inSender.service) : (inRequest.id);
            console.error("local_testing(): received response for:", service, ": but blocking only:", val);
            if (service === val) {
                errors.push("TEST0001");
                errors.push("TEST0002");
                errors.push("TEST0003");
                errors.push("TEST0004");
                errors.push("TEST0005");
                errors.push("TEST0006");
                errors.push("TEST0007");
                errors.push("TEST0008");
                errors.push("TEST0009");
                errors.push("TEST0010");
                errors.push("TEST0011");
                errors.push("TEST0012");
                errors.push("TEST0013");
                errors.push("TEST0014");
                errors.push("TEST0015");
            }
        }
    }
    ,
    getInstance: function(){
        findApps.WebService._singleton = findApps.WebService._singleton || new findApps.WebService();
        return findApps.WebService._singleton;
    },
    
    destroy: function() {
    	findApps.WebService._singleton = null;
    	this.cacheUtil = null;
    	findApps.CacheUtil.destroy();
    	
    }
});
