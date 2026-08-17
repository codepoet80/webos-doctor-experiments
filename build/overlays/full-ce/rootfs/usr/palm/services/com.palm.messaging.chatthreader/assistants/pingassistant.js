/*
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

var PingCommandAssistant = Class.create({
    run: function(future) {
        future.result = { reply: "pong" };
    }
});


