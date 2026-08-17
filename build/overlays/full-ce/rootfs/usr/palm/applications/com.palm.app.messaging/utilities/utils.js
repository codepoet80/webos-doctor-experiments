enyo.messaging = {
	MAX_BOTTOM_HEIGHT_FOR_SNAP: 300,
    CONSTANTS : {
        NO_SEARCH_RESULTS: $L("No search results found.")
    },
	im: {
		availability: {
			AVAILABLE: 0,
			BUSY: 2,
			INVISIBLE: 3,
			OFFLINE: 4,
			NO_PRESENCE: 4 //Note, this used to be 6 because we differentiated between none and offline
		},
		availabilityCaptions: {
			"available": $L("Available"),
			"away": $L("Busy"),
			"invisible": $L("Invisible"),			
			"offline": $L("Offline")
		},
		availabilities: {
			"available": 0,
			"available-partial": 1,
			"away": 2,
			"invisible": 3,
			"offline": 4
		},
		buddyAvailabilities: {
			"6": "nopresence",
			"5": "pending",
			"4": "offline",
			"3": "invisible",
			"2": "away",
			"1": "mobile",
			"0": "available"
		},
		availabilityClasses: ["available", "available-partial", "away", "invisible", "offline"]
	},
	buddyAvailability_TRANSIENT_MESSAGES_Template: {
			"6": $L("#{name} is offline"),
			"5": $L("#{name} is offline"),
			"4": $L("#{name} is offline"),
			"3": $L("#{name} is offline"),
			"2": $L("#{name} is busy"),
			"1": $L("#{name} is mobile"),
			"0": $L("#{name} is available")
	},
 	imLoginState: {
		dbKind: "com.palm.imloginstate:1",
		TRANSPORT_STATE: {
			OFFLINE: "offline",
			LOGGING_ON:"logging-on",
			RETRIEVING_DATA:"retrieving-buddies",
			ONLINE:"online",
			LOGGING_OUT:"logging-out"
		},
		// collapse a set of loginStates into a single 'best representation' state
		// (function included in unit testing)
		getAggregatedLoginState: function(loginStates) {
			if (!loginStates || !loginStates.length) {
				// no IM account exists
				return undefined;
			}
			//
			var state = {
				bestAvailability: enyo.messaging.im.availability.OFFLINE,
				identicalStates: true,
				identicalAvailabilities: true,
			    identicalCustomMessages: true,
				hasOffline: false,
				hasPending: false,
				customMessage: undefined
			};
			var currState = undefined;
			var currAvailability = undefined;
			var currCustomMessage = undefined;
			
			// Normalize the custom message attribute to
			// help determine if they are identical.
			for (var i=0; i < loginStates.length; i++) {
				if (!loginStates[i].customMessage) {
					loginStates[i].customMessage = "";
				}
			}
			
			for (var i=0; i < loginStates.length; i++) {
				var loginState = loginStates[i];
				var transportState = loginState.state;
				var availability = loginState.availability;
				var customMessage = loginState.customMessage;
				
				if (currState === undefined) {
					currState = transportState;
				} else if (currState !== transportState) {
					state.identicalStates = false;
				}

				if (currAvailability === undefined) {
					currAvailability = availability;
				} else if (currAvailability !== availability) {
					state.identicalAvailabilities = false;
				}
				
				if (currCustomMessage === undefined) {
					currCustomMessage = customMessage;
				} else if (currCustomMessage !== customMessage) {
					state.identicalCustomMessages = false;
				}
				
				if (transportState === this.TRANSPORT_STATE.ONLINE || transportState === this.TRANSPORT_STATE.RETRIEVING_DATA) {
					// webOS: RETRIEVING_DATA (retrieving-buddies) means the account is CONNECTED - messages
					// already send/receive; it is only still syncing the buddy list, which is slow for large
					// accounts (hundreds of contacts). Treat it as online for the status indicator so it shows
					// the real availability ("Available") instead of being stuck on "Signing in..." for
					// minutes (and then force-marked Offline by the 90s login timer in ImStatus) while the
					// account is actually usable. Only LOGGING_ON/LOGGING_OUT below stay "pending".
					if (loginState.availability < state.bestAvailability) {
						state.bestAvailability = loginState.availability;
					}
				} else if (transportState === this.TRANSPORT_STATE.OFFLINE) {
					state.hasOffline = true;
				} else if (loginState.availability !== enyo.messaging.im.availability.OFFLINE) {
					var pendingStates = [this.TRANSPORT_STATE.LOGGING_ON, this.TRANSPORT_STATE.LOGGING_OUT];
					for (var j=0; j < pendingStates.length; j++) {
						if (transportState === pendingStates[j]) {
							state.hasPending = true;
							break;
						}
					}
				}
			}
			
			if (state.identicalCustomMessages) {
				state.customMessage = loginStates[0].customMessage;
			} else {
				state.customMessage = undefined;
			}
			//enyo.error("final best state: ", state);
			return state;
		},
		getAvailability: function(loginState) {
			return loginState.state === this.TRANSPORT_STATE.OFFLINE ? enyo.messaging.im.availability.OFFLINE : loginState.availability;
		}
	},
	message: {
		dbKind: "com.palm.message:1",
		FOLDERS: {
			INBOX: "inbox",
			OUTBOX: "outbox",
			DRAFTS: "drafts",
			TRANSIENT: "transient",
			SYSTEM: "system"
		},
		SMS: {
			dbKind: "com.palm.smsmessage:1"
		},
		MMS: {
			dbKind: "com.palm.mmsmessage:1"
		},
		SOUND_CLASSES: {
//			SENT: "sink",
//			RECEIVED: "pnotifications",
			SYSTEM: "notification",
			VIBRATE: "vibrate",
			RINGTON: "alerts"
		},
		SOUND_PATHS: {
			SENT: "audios/sent.mp3",
			RECEIVED: "audios/received.mp3"
		},
		MESSAGE_STATUS: {
			SUCCESS: "successful",
			PENDING: "pending",
			FAILED: "failed",
			UNDELIVERABLE: "permanent-fail",
			WAITING_FOR_DATA_TO_CONNECT: "waiting-for-connection",
			DELAYED_DELIVERY: "delayed",
			RETRIEVING_CONTENT: "retrieving"
			
		},	
		ERROR_CATEGORIES: {
			//SMS Errors
			//			"genericsmserror"  : $L("Could not send your message. Try again."),
			"unknownscaddress": $L("Unknown service center address. Contact your carrier."),
			"smsnetworkerror": $L("Could not send your message due to a network error. Try again. #{networkErrorCode}"),
			"fdnrestricted": $L("Number is FDN restricted"),
			//MMS Errors
			//NOTE text for 15 and 16 are verizon required strings for those errors
			"mmsErrorUnspecified": $L("Unknown error while downloading the message."),
			"mmsErrorMessageTooLarge": $L("The attachment is too large."),
			"mmsErrorMessageNotFound": $L("Message not found on server."),
			"mmsErrorNetwork": $L("A network error occurred."),
			"mmsErrorExpired": $L("Message expired or not available."),
			"mmsErrorCorrupt": $L("Message is corrupt."),
			"mmsErrorBadUrl": $L("Unable to connect to MMS server."),
			"mmsErrorDbError": $L("Database failure."),
			"mmsErrorRejected": $L("Message content rejected."),
			"mmsErrorServiceNotInitialized": $L("Message transport not initialized."),
			"mmsErrorUnsupportedMessage": $L("Unknown error while sending the message."),
			"mmsErrorContentCorrupt": $L("Message content is corrupt."),
			"mmsOutOfMediaMemory": $L("Device is full. Delete files to clear space."),
			"mmsErrorServiceDenied": $L("Service not activated on network."),
			"mmsErrorSendingAddressUnresolved": $L("Invalid destination address."),
			"mmsErrorAttachmentTooLarge": $L("Attachment file size exceeds the maximum allowed."),
			//IM Errors
			// TODO come up with new errors, if any
			"error: unable to message a non-buddy": $L("Unable to send messages to screen names that are not in the buddy list.")
		},
		// (function included in unit testing)
		getMessageErrorFromCode: function(errorCode, messageData){
			if (this.ERROR_CATEGORIES[errorCode] === undefined) {
				if (messageData.status === "permanent-fail") {
					return $L("Could not send your message.");
				}
				else {
					return $L("Could not send your message. Try again.");
				}
			}
			else {
				if (messageData === undefined) {
					return this.ERROR_CATEGORIES[errorCode];
				}
				else {
					return new enyo.g11n.Template(this.ERROR_CATEGORIES[errorCode]).evaluate(messageData);
				}
			}
		},
		// (function included in unit testing)
		isVisible: function(rawMessage){
			if (rawMessage.flags && rawMessage.flags.visible === false) {
				return false;
			}
			return true;
		},
		// (function included in unit testing)
		isUnread: function(rawMessage){
			return (rawMessage.folder === "inbox" &&
			(rawMessage.flags === undefined ||
			(rawMessage.flags.read !== true && rawMessage.flags.visible !== false)));
		},
		// (function included in unit testing)
		isReplacementMessage: function(rawMessage){
			// SMS types of 0x41 to 0x47 indicate replacement messages.
			// When a replacement message comes in the smsservice locates the message to replace
			// and makes changes accordingly.  The app and chatthreader don't have to do anything
			// when replacement messages come in.
			if (!rawMessage) {
				enyo.warn("isReplacementMessage() invoked with invalid parameter!!");
				return false;
			} else {
				return (rawMessage.smsType >= 0x41 && rawMessage.smsType <= 0x47);
			}
		},
		// (function included in unit testing)
		isMMSMessage: function(message) {
			return message ? message._kind === enyo.messaging.message.MMS.dbKind : false;
		},
		
		getMMSDisplayMessage: function() {
			return $L("New MMS on your phone");
		},
		// (function included in unit testing)
		isMMSThread: function(thread) {
			return thread ? thread.replyService === "mms" : false;
		},
		
		getMMSThreadSummary: function() {
			return $L("MMS received on phone");
		},
		// (function included in unit testing)
		getMessageText: function(rawMessage){
			var messageText;
			if (rawMessage) {
				if (rawMessage.subject) {
					messageText = rawMessage.subject;
				} else if (rawMessage.serviceName === "mms") {
					// MMS messages do not keep their body in the messageText field
					// Instead the body is a text attachment
					// The first text attachment is going to be interpreted as the message body
					if (rawMessage.attachments) {
						for (var i = 0; i < rawMessage.attachments.length; i++) {
							if (rawMessage.attachments[i].mimeType === "text/plain" && rawMessage.attachments[i].partText) {
								messageText = rawMessage.attachments[i].partText;
								break;
							}
						}
					}
				} else {
					messageText = rawMessage.messageText;
				}
			} else {
				enyo.warn("getMessageText() invoked with invalid parameter!");
			}
			
			return messageText ? messageText:"";
		},
		
		// Returns an array of CommunicationAddress objects
		// (function included in unit testing)
		getAddressesForThreading: function(rawMessage){
			var addresses;
			// For group chat, the address to use is the groupChatName
			if (rawMessage) {
				if (rawMessage.groupChatName) {
					addresses = [{
						addr: rawMessage.groupChatName
					}];
				} else if (rawMessage.folder === "outbox") {
					addresses = rawMessage.to;
				} else if (rawMessage.from !== undefined) {
					addresses = [rawMessage.from];
				}
			} else {
				enyo.warn("getAddressesForThreading() invoked with invalid parameter!");
			}
			
			if (addresses === undefined) {
				addresses = [];
			}
			//enyo.log("Messaging.Message.getAddressesForThreading: folder=", message.folder, ", address=", addresses);
			return addresses;
		},
		_scriptsRe: new RegExp("<script[^>]*>([\\S\\s]*?)<\/script>", "gim"),
		_tagsRe: new RegExp(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi),
		// (function included in unit testing)
		removeHtml: function(inHtml) {
			// use the logic from enyo.string.removeHtml() except the part that 
			// escape the resulting string before returning it.
			return inHtml.replace(enyo.messaging.message._scriptsRe, "").replace(enyo.messaging.message._tagsRe, "");
		},
		// (function included in unit testing)
		unescapeText: function(inText) {
			return inText && inText.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
		},
		// --- Unicode emoji as inline images ---------------------------------------------
		// No device font covers the astral-plane emoji (U+1F300-1FAFF, e.g. 😭), so they
		// render as tofu rectangles. The native runTextIndexer only maps ASCII emoticons
		// (":)") to /usr/palm/emoticons images. We do the same trick for real Unicode emoji
		// using the bundled EmojiOne set (chosen to match the webOS smiley look).
		// Absolute URL to the bundled emoji dir, derived from the document location so it
		// resolves regardless of the app's document base (main is nowindow.html, no <base>).
		_emojiBase: null,
		getEmojiBase: function() {
			var m = enyo.messaging.message;
			if (m._emojiBase === null) {
				var h = (window.location && window.location.href) || "";
				m._emojiBase = h.replace(/[?#].*$/, "").replace(/[^\/]*$/, "") + "images/emoji/";
			}
			return m._emojiBase;
		},
		// One emoji "cluster": a flag (two regional indicators), or a base emoji (BMP symbol
		// range or astral surrogate pair) plus optional variation selector, skin-tone
		// modifier, and ZWJ-joined continuation parts.
		_emojiRe: new RegExp(
			"[\\uD83C][\\uDDE6-\\uDDFF][\\uD83C][\\uDDE6-\\uDDFF]" +
			"|(?:(?:[\\u2600-\\u27BF\\u2300-\\u23FF\\u2B00-\\u2BFF\\u2B50\\u2B55]" +
			"|[\\uD83C-\\uDBFF][\\uDC00-\\uDFFF])" +
			"(?:\\uFE0F|\\uFE0E)?(?:[\\uD83C][\\uDFFB-\\uDFFF])?" +
			"(?:\\u200D(?:[\\u2600-\\u27BF]|[\\uD83C-\\uDBFF][\\uDC00-\\uDFFF])(?:\\uFE0F)?(?:[\\uD83C][\\uDFFB-\\uDFFF])?)*)",
			"g"),
		// Image key for a matched cluster: its code points (dropping the FE0F/FE0E variation
		// selectors) as lowercase hex joined with '-', which matches the bundled filenames.
		_emojiKey: function(cluster) {
			var keys = [], i = 0, cp;
			while (i < cluster.length) {
				cp = cluster.charCodeAt(i);
				if (cp >= 0xD800 && cp <= 0xDBFF && i + 1 < cluster.length) {
					cp = (cp - 0xD800) * 0x400 + (cluster.charCodeAt(i + 1) - 0xDC00) + 0x10000;
					i += 2;
				} else {
					i += 1;
				}
				if (cp === 0xFE0F || cp === 0xFE0E) { continue; }
				keys.push(cp.toString(16));
			}
			return keys.join("-");
		},
		// Replace Unicode emoji in an (already HTML-ready) string with inline <img> tags.
		// Only call this on text that is rendered with allowHtml:true. Unmapped emoji fall
		// back to their original character via the onerror handler, so nothing shows a
		// broken-image icon.
		// Turn a code point into a JS string (old WebKit lacks String.fromCodePoint).
		_fromCodePoint: function(cp) {
			if (cp <= 0xFFFF) { return String.fromCharCode(cp); }
			cp -= 0x10000;
			return String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF));
		},
		// Decode numeric HTML entities in the emoji/symbol range (&#128557; / &#x1f62d;) back to
		// characters, leaving ASCII entities (&lt; etc.) intact. The transport stores astral emoji
		// as numeric entities (they can't survive the device's JS runtimes as raw UTF-8), so this
		// turns them back into real code points. Used by emojify() and by plain-text notifications.
		decodeNumericEntities: function(text) {
			if (!text) { return text; }
			var m = enyo.messaging.message;
			return text.replace(/&#(?:x([0-9a-fA-F]+)|(\d+));/g, function(ent, hex, dec) {
				var cp = hex ? parseInt(hex, 16) : parseInt(dec, 10);
				if (cp >= 0x2000 && cp <= 0x1FFFFF) {
					try { return m._fromCodePoint(cp); } catch (e) { return ent; }
				}
				return ent;
			});
		},
		emojify: function(inHtml) {
			if (!inHtml) { return inHtml; }
			var m = enyo.messaging.message;
			var base = m.getEmojiBase();
			// Decode numeric emoji entities to real code points first so the matcher sees them.
			inHtml = m.decodeNumericEntities(inHtml);
			return inHtml.replace(m._emojiRe, function(cluster) {
				var key = m._emojiKey(cluster);
				if (!key) { return cluster; }
				return '<img class="emoji" src="' + base + key + '.png" alt="' +
					cluster + '" onerror="enyo.messaging.message.emojiFallback(this)">';
			});
		},
		// onerror: swap a missing emoji image back to its text so unmapped emoji degrade to
		// the original character instead of a broken-image icon.
		emojiFallback: function(img) {
			try {
				var t = document.createTextNode(img.getAttribute("alt") || "");
				img.parentNode.replaceChild(t, img);
			} catch (e) {}
		},
		// Inline voice-note player helpers. The <audio> in a .msg-audio-player carries these as inline
		// event handlers (old WebKit renders no native controls) so playback drives a custom progress
		// bar + M:SS time readout. Called as enyo.messaging.message.audioX(this) - `this` is the module.
		audioFmt: function(s) {
			s = (s && isFinite(s)) ? Math.floor(s) : 0;
			var m = Math.floor(s / 60), r = s % 60;
			return m + ":" + (r < 10 ? "0" : "") + r;
		},
		audioMeta: function(a) {
			try {
				var t = a.parentNode.getElementsByClassName("msg-audio-time")[0];
				if (t) { t.innerHTML = enyo.messaging.message.audioFmt(a.duration); }
			} catch (e) {}
		},
		audioTime: function(a) {
			try {
				var p = a.parentNode, m = enyo.messaging.message,
					f = p.getElementsByClassName("msg-audio-fill")[0],
					t = p.getElementsByClassName("msg-audio-time")[0];
				if (f && a.duration) { f.style.width = (a.currentTime / a.duration * 100) + "%"; }
				if (t) { t.innerHTML = m.audioFmt(a.currentTime) + " / " + m.audioFmt(a.duration); }
			} catch (e) {}
		},
		// An inline message <img> finished loading. The FlyweightDbList measured the row at text height
		// before the (async) image had its real size, so the row is too short and a last-message image
		// gets clipped / can't be scrolled to. Tell the active conversation list to re-measure and, if
		// we're near the bottom, re-snap so the whole image is revealed. DOM-only fallback: nothing.
		imageLoaded: function(a) {
			var key = "";
			try { key = (a && (a.getAttribute("data-open") || a.src)) || ""; } catch (e) {}
			try {
				// Old WebKit reserves the FULL aspect-ratio height for an <img> that CSS max-height caps,
				// leaving phantom empty space below the painted image - a visible gap between an inline
				// photo and the caption rendered under it. Compute the real displayed size (fit within the
				// bubble width AND the 320px cap, preserving aspect ratio, never upscaling) and lock the
				// element box to it in px so no phantom height remains. Runs before the row re-measure.
				var maxH = 320; // keep in sync with .message-image max-height in stylesheets/conversation.css
				var contW = (a && a.parentNode && a.parentNode.clientWidth) || (a && a.clientWidth) || 0;
				if (a && contW > 10 && a.naturalWidth > 0 && a.naturalHeight > 0) {
					var w = Math.min(contW, a.naturalWidth);
					var h = w * a.naturalHeight / a.naturalWidth;
					if (h > maxH) { h = maxH; w = h * a.naturalWidth / a.naturalHeight; }
					w = Math.round(w); h = Math.round(h);
					a.style.width = w + "px";
					a.style.height = h + "px";
					// Remember the locked size per image URL so buildImageTag can emit it directly on the
					// NEXT flyweight render -> the measured row height matches the painted image (no phantom
					// height, no residual gap). Without this the measurement node's fresh <img> reserves the
					// phantom height again and the row settles taller than what's drawn.
					if (key) {
						if (!this._imgDims) { this._imgDims = {}; }
						this._imgDims[key] = { w: w, h: h };
					}
				}
			} catch (e) {}
			try {
				var cl = enyo.messaging.activeConversationList;
				if (cl && cl.noteInlineImageLoaded) {
					// Re-measure only ONCE per image URL. punt()/reset() re-renders the flyweight row, which
					// creates a fresh <img> whose onload fires AGAIN; without this guard imageLoaded ->
					// relayout -> reload -> imageLoaded loops every ~120ms and the row jitters 1-2px forever
					// (the reported "message keeps jumping in height"). One relayout is enough now that the
					// locked size is baked into the row HTML above.
					if (!cl._relaidOutImages) { cl._relaidOutImages = {}; }
					if (!key || !cl._relaidOutImages[key]) {
						if (key) { cl._relaidOutImages[key] = true; }
						cl.noteInlineImageLoaded();
					}
				}
			} catch (e) {}
		},
		videoEnded: function(a) {
			// Keep fullscreen open (if it was) but drop "playing" so the play button reappears - the
			// user can replay or close with the X. Otherwise reset to the inline preview.
			try {
				a.pause();
				var p = a.parentNode;
				if (p) { p.className = (p.className.indexOf("fullscreen") >= 0) ? "msg-video-player fullscreen" : "msg-video-player"; }
			} catch (e) {}
		},
		audioEnded: function(a) {
			try {
				// Pause first: seeking currentTime while still "playing" makes old WebKit resume and
				// loop. Leave the position at the end; the play button re-seeks to 0 on the next tap.
				a.pause();
				var p = a.parentNode,
					b = p.getElementsByClassName("msg-audio-btn")[0],
					f = p.getElementsByClassName("msg-audio-fill")[0],
					t = p.getElementsByClassName("msg-audio-time")[0];
				if (b) { b.className = "msg-audio-btn"; }
				if (f) { f.style.width = "0%"; }
				if (t) { t.innerHTML = enyo.messaging.message.audioFmt(a.duration); }
			} catch (e) {}
		},
		// Emoji-render a plain-text NAME/label (buddy/thread/server/channel names, status).
		// Names aren't HTML-sanitized and can contain <, >, & so we decode emoji entities to
		// characters, HTML-escape the rest, THEN imageify the emoji. Use on allowHtml:true
		// fields only. Names whose emoji were already destroyed to U+FFFD (pre-fix data) just
		// keep the tofu - the information is gone and can't be recovered here.
		emojifyEscaped: function(text) {
			if (!text) { return text; }
			var m = enyo.messaging.message;
			return m.emojify(enyo.string.escapeHtml(m.decodeNumericEntities(text)));
		},
		// For plain-text contexts that can't show inline images (native notification banners):
		// drop emoji entirely instead of leaving tofu or a literal "&#128557;". Decodes emoji
		// entities to characters, removes astral code points / lone surrogates / U+FFFD, then
		// tidies the whitespace and stray punctuation spacing left behind.
		stripEmojiForPlainText: function(text) {
			if (!text) { return text; }
			text = enyo.messaging.message.decodeNumericEntities(text);
			text = text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
				.replace(/[\uD800-\uDFFF]/g, "")
				.replace(/�/g, "");
			return text.replace(/[ \t]{2,}/g, " ").replace(/\s+([.,!?;:])/g, "$1").replace(/^\s+|\s+$/g, "");
		},
		// Replace a bare media URL (or local attachment path) in a message body with a friendly label,
		// so previews/notifications show "🎤 Voice message" etc. instead of a raw file:// / http URL.
		// If there's real text alongside the URL, keep the text and drop the URL. Shared by the thread
		// list (ThreadItem) and the notification banner/dashboard (DashboardManager.getDisplayText) - in
		// the plain-text banner the emoji is then stripped by stripEmojiForPlainText, leaving the label.
		summarizeMedia: function(text) {
			if (!text) { return text; }
			var re = /(?:https?|file):\/\/[^\s<>"']+?\.(jpg|jpeg|png|gif|webp|bmp|mp3|m4a|aac|ogg|oga|opus|flac|wav|amr|mp4|m4v|mov|webm|mkv|3gp|data|pdf|doc|docx|xls|xlsx|ppt|pptx)(?:\?[^\s<>"']*)?/gi;
			var m = re.exec(text);
			if (!m) { return text; }
			var stripped = text.replace(re, "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
			if (stripped) { return stripped; }
			var ext = m[1].toLowerCase();
			if (/^(jpg|jpeg|png|gif|webp|bmp)$/.test(ext)) { return "📷 " + $L("Photo"); }
			if (/^(mp4|m4v|mov|webm|mkv|3gp)$/.test(ext)) { return "🎥 " + $L("Video"); }
			if (/^(mp3|m4a|aac|ogg|oga|opus|flac|wav|amr|data)$/.test(ext)) { return "🎤 " + $L("Voice message"); }
			if (/^(pdf|docx?|xlsx?|pptx?)$/.test(ext)) { return "📄 " + $L("Document received"); }
			return "📎 " + $L("Attachment");
		}
	},
	person: {
		// Used when getting a person data from the DB.
		selectAttributes : [ "_id",			
			                 "_kind",
			                 "favorite",
			                 "contactIds",
			                 "name",
			                 "names",
			                 "nickname",
			                 "organization",
			                 "emails",
			                 "phoneNumbers",
			                 "ims",
			                 "photos.squarePhotoPath"	
		],
		getDisplayName: function(person){
			return person ? new ContactsLib.Person(person).generateDisplayName() :  "";
		},
		// (function included in unit testing)
		isNotBlank: function(str) {
			return str && str.length > 0;
		},
		// (function included in unit testing)
		getDisplayNameFromAccounts: function(accnts) {
			var value = "";		
			if (accnts && accnts.length > 0 && accnts[0].value) {
				value = accnts[0].value;
			}			
			return value;
		},
		getDisplayImage: function(inPerson) {
			var image = "images/list-avatar-default.png";
			if (inPerson && inPerson.photos && inPerson.photos.squarePhotoPath) {
				if (palmGetResource(inPerson.photos.squarePhotoPath)) {
					image = inPerson.photos.squarePhotoPath;
				} else {
					var palmService = new enyo.PalmService();
					palmService.importProps({
						service: "palm://com.palm.service.contacts",
						method: "refetchPhoto"
					});
					
					// image doesn't exist, so request to load the image again
					var fetchContactPhoto = function(contactId) {
						//enyo.log("--------###### utils.person.getDisplayImage(), fetching photo for contact: ", contactId);
						palmService.call({
							params: {
								contactId: contactId
							}
						});
					}
					
					inPerson.contactIds.forEach(fetchContactPhoto);
				}
			}
			return image;
		},
		// (function included in unit testing)
		hasMessagingAccounts: function(person) {
			if (person) {
				return (person.ims && person.ims.length > 0);
			} else {
				enyo.warn("hasMessagingAccounts() invoked with invalid parameter!!");
			}
			return false;
		},
		// (function included in unit testing)
		hasSMSAccounts: function(person) {
			if (person) {
			    return person.phoneNumbers && person.phoneNumbers.length > 0;
			} else {
				enyo.warn("hasSMSAccounts() invoked with invalid parameter!!");
			}
			return false;	
		}
	},
	thread: {
		dbKind: "com.palm.chatthread:1",
		
		create: function(inProps){
			var rawChatThread = inProps;
			if (rawChatThread) {
				this._rawChatThread = rawChatThread;
			} else {
				this._rawChatThread = {
					_kind: this.dbKind,
					unreadCount: 0
				};
			}
			return this;
		},
		
		/**
		 * Does a db.merge (if _id is set) or a db.put.
		 */
		save: function(){
			if (this._rawChatThread) {
			    var db;
				if (this._rawChatThread._id) {
					    db = new enyo.DbService({
						dbKind: this.dbKind,
						method: "merge"
					});
					db.call({
						objects: [this._rawChatThread]
					});
				} else if (this._rawChatThread._kind) {
					    db = new enyo.DbService({
						dbKind: this.dbKind,
						method: "put"
					});
					db.call({
						objects: [this._rawChatThread]
					});
				}
			}
		},
		
		/**
		 * Updates the chatthread with to reflect a newly added message
		 * (function included in unit testing)
		 */
		updateFromNewMessage: function(rawMessage, addressObj){
			var rawChatThread = this._rawChatThread;
			
			// Ignore messages that shouldn't change the chatthread: ones that are invisible or
			// in a folder other than "inbox" or "outbox".
			if (!rawMessage || (rawMessage.folder !== "outbox" && rawMessage.folder !== "inbox") ||				
			    !enyo.messaging.message.isVisible(rawMessage)) {
				return rawChatThread;
			}
			
			if (rawChatThread) {
				if (!rawChatThread.flags) {
					rawChatThread.flags = {};
				}
				rawChatThread.flags.outgoing = (rawMessage.folder === "outbox");
				rawChatThread.flags.visible = true; // since a new message was added, ensure the thread is visible
			} else {
				// Assume we're creating a new chat thread
				rawChatThread = {
					_kind: this.dbKind,
					unreadCount: 0,
					flags: {
						outgoing: (rawMessage.folder === "outbox")
					}
				};
			}
			
			rawChatThread.timestamp = rawMessage.localTimestamp || Date.now();
			rawChatThread.summary = enyo.messaging.message.getMessageText(rawMessage);
			rawChatThread.replyService = rawMessage.serviceName;
			
			if (!addressObj) {
				var addressList = enyo.messaging.message.getAddressesForThreading(rawMessage);
				var address;
				if (addressList && addressList[0]) {
					address = addressList[0].addr;
				} else {
					address = enyo.messaging.utils.kMissingAddress;
				}
				
				addressObj = {
					addr: address,
					normalizedAddress: enyo.messaging.utils.normalizeAddress(address, rawMessage.serviceName)
				};
			}
			
			if (!addressObj.normalizedAddress) {
				addressObj.normalizedAddress = enyo.messaging.utils.normalizeAddress(addressObj.addr, rawMessage.serviceName);
			}
			
			rawChatThread.replyAddress = addressObj.addr;
			rawChatThread.normalizedAddress = addressObj.normalizedAddress;
			
			if (enyo.messaging.message.isUnread(rawMessage)) {
				// NOTE:
				// We are handling replacement messages by preventing the unreadCount
				// from being updated upon replacement.  This could also be done by
				// having the chatthreader watch for deletes and decrement the
				// unread count on delete.
				// This method is less robust but allows us to avoid another watch on the DB
				if (enyo.messaging.message.isReplacementMessage(rawMessage)) {
					enyo.log("Ignoring replacement message for unreadCount");
				} else {
					var unreadCount = rawChatThread.unreadCount || 0;
					rawChatThread.unreadCount = unreadCount + 1;
				}
			}
						
			return rawChatThread;
		}
	},
	utils: {
		phoneNumberLabels: {
			"type_mobile": $L("Mobile"),
			"type_home": $L("Home"),
			"type_home2": $L("Home 2"),
			"type_work": $L("Work"),
			"type_work2": $L("Work 2"),
			"type_main": $L("Main"),
			"type_personal_fax": $L("Fax"),
			"type_work_fax": $L("Fax"),
			"type_pager": $L("Pager"),
			"type_personal": $L("Personal"),
			"type_sim": $L("SIM"),
			"type_assistant": $L("Assistant"),
			"type_car": $L("Car"),
			"type_radio": $L("Radio"),
			"type_company": $L("Company"),
			"type_other": $L("Other")
		},
		_phoneTypeServiceNames: {
			"sms": true,
			"mms": true,
			"type_home": true,
			"type_work": true,
			"type_mobile": true,
			"type_home_fax":   true,
			"type_business":   true,
			"type_car":	   true,
			"type_pager":  true,
			"type_work_fax": true,
			"type_sim":true,
			"type_primary":  true,
			"type_other":  true,
			"type_home2":   true,
			"type_home_fax2":   true,
			"type_work2":   true,
			"type_business2":   true,
			"type_mobile2": true,
			"type_car2":	   true,
			"type_pager2":  true,
			"type_work_fax2": true,
			"type_sim2":true,
			"type_primary2":  true,
			"type_other2":  true
		},
		kDefaultBuddyGroup: $L("Buddies"),
		kMissingAddress: $L("No Recipient"),
		cleanPhoneNumberRegex: /[^0-9\+\*\#]*/gi,
		
		/**
		 * Returns true if the service is a SMS/MMS type
		 * (function included in unit testing)
		 */
		isTextMessage: function(serviceName){
			return (serviceName === undefined || serviceName === "" || this._phoneTypeServiceNames[serviceName] === true);
		},
		/**
		 * Returns a formatted version of the address to be used for display. This is primarily used for phone numbers.
		 * (function included in unit testing)
		 */
		formatAddress: function(address, serviceName){
			var formattedAddress = address;
			if (!address) {
				enyo.warn("Messaging.Utils.formatAddress address is empty. Using kMissingAddress");
				formattedAddress = this.kMissingAddress;
			} else {
				if (this.isTextMessage(serviceName) && address.indexOf("@") === -1) {
					var numberObj = new enyo.g11n.PhoneNumber(address);
					// If subscriber number wasn't found, the phone number isn't valid
					if (numberObj.subscriberNumber) {
						var phonefmt = new enyo.g11n.PhoneFmt({style: "default"});
						formattedAddress = phonefmt.format(numberObj);
					}
				} else {
					// webOS: WhatsApp/Signal are phone-based, but the stored value is the routable id -
					// a WhatsApp JID "<phone>@s.whatsapp.net" or a Signal E.164/UUID. Show the human phone
					// number instead of the internal address. If no phone can be recovered (WhatsApp
					// "<id>@lid", a Signal UUID), leave the value untouched.
					var phone = this.phoneFromImAddress(address, serviceName);
					if (phone) {
						formattedAddress = phone;
					}
				}
			}
			return formattedAddress;
		},
		// webOS: recover a human-readable "+<country><number>" from a phone-based IM routable id, or
		// return "" when the id carries no phone (WhatsApp @lid, Signal UUID). Display-only - the stored
		// value / replyAddress keeps the routable id so sending is unaffected.
		phoneFromImAddress: function(address, serviceName){
			if (serviceName !== "type_whatsapp" && serviceName !== "type_signal") {
				return "";
			}
			var s = String(address).toLowerCase();
			var at = s.indexOf("@");
			if (at !== -1) {
				// WhatsApp JID: only "<phone>@s.whatsapp.net" carries a number; "<id>@lid" does not.
				if (s.substring(at) !== "@s.whatsapp.net") {
					return "";
				}
				s = s.substring(0, at);
			}
			// A Signal UUID (e.g. "8f2c...-...-...") contains dashes/hex letters - not a phone number.
			if (/[a-z\-]/.test(s)) {
				return "";
			}
			var digits = s.replace(/[^0-9]/g, "");
			if (digits.length < 7) {
				return "";  // too short to be a real phone number
			}
			var e164 = "+" + digits;
			try {
				var numberObj = new enyo.g11n.PhoneNumber(e164);
				if (numberObj.subscriberNumber) {
					return (new enyo.g11n.PhoneFmt({style: "default"})).format(numberObj);
				}
			} catch (e) { /* fall through to plain e164 */ }
			return e164;
		},
		// (function included in unit testing)
		normalizeAddress: function(address, serviceName){
			// first trim leading and trailing whitespace
			if (!address) {
				enyo.warn("messaging.utils.Conversations.normalizeAddress missing address");
				address = this.kMissingAddress;
			}
			//
			if (typeof address === "object") {
				enyo.warn("normalizeAddress was passed an object for the address!!! Can I handle this???");
				if (address.addr) {
					enyo.warn("Yes, I can handle it. address.addr ain't so bad");
					address = address.addr;
				} else if (address.value) {
						enyo.warn("Yes, I can handle it. address.value ain't so bad");
						address = address.value;
					} else {
						enyo.warn("No, I can't handle it :( Why did you give me " + JSON.stringify(address));
						address = this.kMissingAddress;
					}
			}
			//
			var normalizedAddress = address.replace(/^\s*/, "").replace(/\s*$/, "");
			if (this.isTextMessage(serviceName) && (address.indexOf("@") === -1)) {
				var normalizedShortcode = this.normalizeShortcode(normalizedAddress);
				if (normalizedShortcode !== false) {
					normalizedAddress = normalizedShortcode;
				} else {
					var numberObj = new enyo.g11n.PhoneNumber(normalizedAddress);
					normalizedAddress = numberObj.subscriberNumber || normalizedAddress;
				}
			} else {
				// Ignore email addresses
				// TODO: Strip out '.'s from email addresses, trim whitespace,
				normalizedAddress = normalizedAddress.toLowerCase();
			}
			// webOS WhatsApp: unify the address variants so an outgoing "+<phone>" and an incoming
			// "<phone>@s.whatsapp.net" (and a bare "<phone>") match the SAME conversation instead of
			// splitting. The opaque "<id>@lid" (a LinkedID with no phone) is left as-is. Must mirror
			// the messaging.library framework copy the chatthreader uses to key threads.
			if (serviceName === "type_whatsapp") {
				var waAddr = normalizedAddress.toLowerCase();
				var waAt = waAddr.indexOf("@");
				if (waAt !== -1 && waAddr.substring(waAt) === "@s.whatsapp.net") {
					waAddr = waAddr.substring(0, waAt);
				}
				if (waAddr.charAt(0) === "+") {
					waAddr = waAddr.substring(1);
				}
				normalizedAddress = waAddr;
			}
			//enyo.log("***normalizeAddress after ", normalizedAddress);
			return normalizedAddress;
		},
		// (function included in unit testing)
		normalizeShortcode: function(shortcode){
			if (shortcode) {
				// strip out all non-numeric characters.
				var normalizedShortcode = shortcode.replace(/\D*/g, "");
				// TODO this is valid for a lot of countries, but not all. Need to use the
				// Globalization library API once it is ready.
				if (normalizedShortcode.length > 1 && normalizedShortcode.length < 7) {
					return normalizedShortcode;
				}
			}
			return false;
		},
		// (function included in unit testing)
		isEmail: function(addr) {
			return addr ? addr.indexOf("@") !== -1 : false;
		},
		// (function included in unit testing)
		cleanPhoneNumber: function(value, type){
			var cleanPhoneNumber = value;
			if (value) {
				if (type === "phone" && !this.isEmail(value)) {
					cleanPhoneNumber = value.replace(enyo.messaging.utils.cleanPhoneNumberRegex, "");
				}
			}
			return cleanPhoneNumber;
		},
		getAppRootPath: function() {
			return enyo.fetchAppRootPath().replace("file://", "");
		},
		// (function included in unit testing)
		joinData: function(data, inData, inSource, inTarget, inField) {
			// assemble look up data
			var r = inData, lookUp = {};
			for (var i=0, d; d=r[i]; i++) {
				lookUp[d[inSource]] = d;
			}
			// join inData to data
			r = data.results;
			for (i=0, d; d=r[i]; i++) {
				d[inField] = lookUp[d[inTarget]];
			}
		}
	},
	keyboard: {
		setKeyboardAutoMode: function(){
			if (enyo.keyboard.isManualMode()) {
				enyo.keyboard.setManualMode(false);
			}
		},
		setKeyboardMannualMode: function(){
			if (!enyo.keyboard.isManualMode()) {
				enyo.keyboard.setManualMode(true);
			}
			enyo.keyboard.show(enyo.keyboard.typeText);
		}
	}
};