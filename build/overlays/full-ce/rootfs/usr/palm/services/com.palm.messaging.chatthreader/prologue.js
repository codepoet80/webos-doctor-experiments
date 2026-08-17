/*global IMPORTS, _, Foundations, ContactsLib */
/*
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

var _ = IMPORTS.underscore._;
var Foundations = IMPORTS.foundations;
var ContactsLib = IMPORTS.contacts;
var Messaging = IMPORTS['messaging.library'].Messaging;

var Class = Foundations.Class;
var Future = Foundations.Control.Future;
var Activity = Foundations.Control.Activity;
var mapReduce = Foundations.Control.mapReduce;
var MojoDB = Foundations.Data.DB;
var TempDB = Foundations.Data.TempDB;
var PalmCall = Foundations.Comms.PalmCall;
var Person = ContactsLib.Person;
