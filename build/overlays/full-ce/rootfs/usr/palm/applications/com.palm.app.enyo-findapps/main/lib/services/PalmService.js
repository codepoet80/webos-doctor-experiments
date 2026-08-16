/* Copyright 2009 Palm, Inc.  All rights reserved. */
enyo.kind({
    name: "findApps.PalmService",
    kind: enyo.PalmService,
    dispatchResponse: function(inDelegate, inRequest) {
        if(inDelegate && inDelegate.scope){
            this.dispatch(inDelegate.scope, inDelegate.handler, [inRequest.response, inRequest, inDelegate.props]);
        }else{
            this.dispatch(this.owner, inDelegate, [inRequest.response, inRequest]);
        }
    }
    ,
    sendRequest: function(inParams, inProps){
        this.call(inParams, enyo.mixin(inProps, {
            onSuccess: inProps.onSuccess?{
                handler: inProps.onSuccess, 
                scope: inProps.scope,
                props: inProps
            }:"",
            onFailure: inProps.onFailure?{
                handler: inProps.onFailure, 
                scope: inProps.scope,
                props: inProps
            }:"",
            onResponse: inProps.onResponse?{
                handler: inProps.onResponse, 
                scope: inProps.scope,
                props: inProps
            }:""
        }));
    }
});

findApps.PalmService.addCallbackProps = function(inProps, successCallback, failureCallback, scope){
    return enyo.mixin(inProps, {
        onSuccess: scope?{
            handler:successCallback, 
            scope:scope,
            props: inProps
        }:successCallback,
        onFailure: scope?{
            handler:failureCallback, 
            scope:scope,
            props: inProps
        }:failureCallback
    });
}