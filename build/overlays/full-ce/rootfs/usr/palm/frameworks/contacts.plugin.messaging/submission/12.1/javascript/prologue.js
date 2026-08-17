/*global MojoLoader*/
/**
 * Copyright 2010 Palm, Inc.  All rights reserved.
 */

var IMPORTS =  MojoLoader.require(
	{ name: "foundations", version: "1.0" },
	{ name: "underscore", version: "1.0" },
	{ name: "contacts", version: "1.0" },
	{ name: "globalization", version: "1.0" }
);

var _ = IMPORTS.underscore._;
var Foundations = IMPORTS.foundations;
var Contacts = IMPORTS.contacts;
var Globalization = IMPORTS.globalization.Globalization;

var DB = Foundations.Data.DB;
var TempDB = Foundations.Data.TempDB;
var Future = Foundations.Control.Future;
