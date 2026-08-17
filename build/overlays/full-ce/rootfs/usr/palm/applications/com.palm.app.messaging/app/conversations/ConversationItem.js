/*globals enyo */

enyo.kind({
	name: "ConversationItem",
	kind: "enyo.SwipeableItem",
	confirmCaption: $L("Delete"),
	layoutKind: "enyo.HFlexLayout",
	align: "start",
	published: {
		message: ""
	},
	events: {
		onError: "",
		onSelectSender: "",
		onOpenAttachment: "",
		// Fired for a SHORT right-swipe on a message (react). Left / long-right swipes still fire
		// onConfirm (delete) via the inherited SwipeableItem confirm prompt. See dragfinishHandler.
		onReact: ""
	},
	// Swipe distance bands (fraction of row width). Right swipe: short => react, long => delete.
	// Left swipe of any length => delete. See dragfinishHandler.
	reactMinPx: 45,
	deleteRatio: 0.55,
	components: [
		{name: "imageContainer", className:"conversationContactImage", components: [
			{className: "contact-image-border"},
			{name: "contactImage", kind: "Image", className: "contact-image"}
		]},
		{name: "messageContainer", flex: 1, components:[
			{name: "message", components:[
				// Sender name for incoming group/channel messages (Telegram groups, Discord channels).
				// Hidden for 1:1 IMs and outgoing messages. See updateSenderName().
				{name: "senderName", className: "chat-sender-name", allowHtml: true, showing: false, onclick: "senderTapped"},
				{name: "messageText", allowHtml:true, onclick: "messageTapped"},
				{layoutKind: "HLayout", components:[
					{name: "messageTime", className: "message-time"},
					// Delivery/read receipt tick for OUTGOING messages: single check = delivered,
					// double check = read. Populated from message.deliveryStatus (see updateDeliveryStatus).
					{name: "receiptIcon", kind: "Image", className: "message-receipt", showing: false},
					{name: "errorIcon", kind: "Image", src: "images/header-warning-icon.png", className:"erroricon", onclick: "showError"}
				]}	,
					{name: "invitationButtons", layoutKind: "HLayout", className:"accept-decline-box", components: [
						{name: "declineButton", kind: "IconButton", className: "enyo-button-negative", icon: "images/icon-decline.png", onclick: "declinedBuddy"},
						{name: "acceptButton", kind: "IconButton", className: "enyo-button-affirmative", icon: "images/icon-accept.png", onclick: "acceptedBuddy"}
					]}
			]}
		]}, 
		{name: "inviteService", kind: "InviteResponseService"}
	],
	create: function() {
		this.inherited(arguments);
		this.messageChanged();
		this.addClass("chat-balloon");
	},
	// Override SwipeableItem's finish (which fires delete on any swipe past ~35% width) to add
	// distance bands: SHORT right swipe => react (onReact); LONG right swipe or ANY left swipe =>
	// delete (the inherited confirm prompt via handleSwipe). Tiny drags snap back. this.index and
	// this.handlingDrag are set by the inherited dragstartHandler.
	dragfinishHandler: function(inSender, inEvent) {
		if (!this.handlingDrag) {
			return this.fire("ondragfinish", inEvent);
		}
		var dx = this.getDx(inEvent);
		var w = (this.getBounds && this.getBounds().width) || 0;
		var deletePx = Math.floor(w * this.deleteRatio);
		inEvent.preventClick();
		this.handlingDrag = false;
		this.resetPosition();
		if (dx <= -this.reactMinPx || dx >= deletePx) {
			this.handleSwipe();            // left swipe, or long right swipe -> delete confirm
		} else if (dx >= this.reactMinPx) {
			this.doReact(this.index);      // short right swipe -> react
		}
		return true;
	},
	messageChanged: function() {
		this.updateSenderName(this.message);
		this.updateMessageText(this.message, this.message.folder !== enyo.messaging.message.FOLDERS.OUTBOX && this.message.folder !== enyo.messaging.message.FOLDERS.INBOX);
		this.updateContactImage(this.message.personImage);
		this.updateSentReceived(this.message.folder);
		this.updateTime(this.message.localTimestamp);
		this.updateMessageStatus(this.message.status, this.message.errorCategory);
		this.updateDeliveryStatus(this.message.deliveryStatus, this.message.folder);
		this.updateInvite(this.message);
		this.updatePriority(this.message);
	},
	updatePriority: function(message){
		// 0 = normal priority
		// 1 = interactive
		// 2 = urgent
		// 3 = emergency
		// 4 = low priority
		if (message.priority && (message.priority === 2 || message.priority === 3)) {
			this.$.message.addClass("high-priority");
		}
	},
	updateMessageStatus: function(inStatus, errorCategory){
		if (inStatus !== "successful") {
			this.$.message.setClassName("enyo-item chat-balloon-error");
		} 
		// Show/hide the error (!) icon WITHOUT toggling canGenerate: on a recycled flyweight row a
		// canGenerate=false leaves the node ungenerated, so a later show() renders nothing and tapping
		// the ! does nothing after the first time (same trap as the receipt icon -- see
		// updateDeliveryStatus). Keep the node generated; just show/hide it.
		if(errorCategory && (inStatus === enyo.messaging.message.MESSAGE_STATUS.FAILED || inStatus === enyo.messaging.message.MESSAGE_STATUS.UNDELIVERABLE)){
			this.$.errorIcon.show();
		}
		else{
			this.$.errorIcon.hide();
		}
	},
	// Show who sent an incoming group/channel message. The transport writes the sender's display
	// name onto from.name for group messages (Telegram groups, Discord channels); 1:1 IMs and
	// outgoing messages have no per-message sender label (the conversation is already one person).
	updateSenderName: function(inMessage) {
		var isIncoming = inMessage.folder === enyo.messaging.message.FOLDERS.INBOX;
		var isGroup = !!(inMessage.channelName || inMessage.chatType === "groupchat");
		var sender = (inMessage.from && inMessage.from.name) ? inMessage.from.name : "";
		if (isIncoming && isGroup && sender) {
			// from.name may carry astral-emoji entities (&#NNNNN;) from the transport; neutralise tags
			// but keep the entities so emojify() can turn them into inline emoji images.
			var safe = String(sender).replace(/</g, "&lt;").replace(/>/g, "&gt;");
			this.$.senderName.setContent(enyo.messaging.message.emojify(safe));
			this.$.senderName.canGenerate = true;
			this.$.senderName.setShowing(true);
		} else {
			this.$.senderName.canGenerate = false;
			this.$.senderName.setShowing(false);
		}
	},
	updateMessageText: function(inMessage, skipTextIndexer) {
		var raw = inMessage.messageText || "";
		var inText = raw;
		if (enyo.messaging.message.isMMSMessage(inMessage)) {
			this.$.messageText.setContent(enyo.messaging.message.getMMSDisplayMessage());
			return;
		} else if (inMessage.folder === enyo.messaging.message.FOLDERS.INBOX) {
			// purple's strdup_withhtml stores each newline as "<br />\n" - the tag AND the literal
			// newline. Without dropping that trailing newline first, the pass below would convert it to
			// a SECOND <br>, doubling every line break (a big gap in multi-line posts, e.g. link
			// previews). So collapse a newline that directly follows a break tag, then convert any
			// remaining (genuine) newlines to <br>.
			inText = inText.replace(/(<br\s*\/?>)[\r\n]+/gi, "$1").replace(/\r|\n|\\r|\\n/g, "<br>");
		} else if (inMessage.folder === enyo.messaging.message.FOLDERS.OUTBOX) {
			// outgoing message needs to be sanitized since the incoming ones
			// are already sanitized before they are written into database.
			inText = enyo.string.escapeHtml(inText);
		}

		// Render media that Discord/Telegram/etc. deliver as URLs in the body (or a local attachment
		// file): images inline as <img>, audio/video/other as a tappable attachment chip that opens
		// in the associated app (Atlas plays ogg/opus/mp4 etc). The raw URL is stripped from the text
		// so we show "text + [image]/[chip]" instead of "text + long-url + [image]/[chip]".
		var media = this.extractMediaUrls(raw);
		var imagesHtml = "", chipsHtml = "";
		for (var i = 0; i < media.length; i++) {
			if (media[i].kind === "image") { imagesHtml += this.buildImageTag(media[i].url); }
			else { chipsHtml += this.buildAttachmentChip(media[i]); }
		}

		// Attachment send: an outgoing message can carry a local file path (the file we just sent).
		// Image files preview inline (mirroring received images); other files show as a chip.
		var localAttachmentHtml = "";
		if (inMessage.filePath) {
			if (this.isImagePath(inMessage.filePath)) {
				localAttachmentHtml = this.buildLocalImageHtml(inMessage.filePath);
			} else {
				localAttachmentHtml = this.buildAttachmentChip({
					url: inMessage.filePath, kind: this.mediaKind(inMessage.filePath),
					name: this.mediaName(inMessage.filePath)
				});
			}
		}

		// Pure-media message (body was only media URLs): show just the media, no text line.
		if (media.length > 0 && this.isOnlyMedia(raw)) {
			this.$.messageText.setContent(this.buildQuote(inMessage) + imagesHtml + chipsHtml + localAttachmentHtml + this.buildReactions(inMessage));
			return;
		}

		// Drop the matched media URLs from the displayed text (they're now an image/chip below).
		inText = inText.replace(this.mediaUrlRe(), "").replace(/(?:\s|<br>)+$/g, "");
		if (!skipTextIndexer) {
			inText = this.linkifyPreservingUrls(inText);
		}
		// Media on top, caption BELOW it (WhatsApp/native convention): render the image/chip first,
		// then the remaining caption text directly under it. .message-image is display:block, so the
		// caption naturally flows onto the next line with NO extra separator. The caption often keeps
		// a LEADING <br> where the stripped media URL sat (the plugin sends "url\ncaption", and the
		// \n becomes <br>) - strip that so there's no blank line between the image and the caption.
		// Also strip the media's own leading <br> so the bubble doesn't open with a blank line.
		var mediaHtml = imagesHtml + chipsHtml + localAttachmentHtml;
		if (mediaHtml) {
			// NB: the break can be <br>, <br/> or <br /> - the plugin sends "url\ncaption", purple's
			// strdup_withhtml turns the \n into "<br />" AND leaves the \n, which updateMessageText's
			// line-break pass then turns into a second <br>. Match all break spellings so BOTH go.
			inText = inText.replace(/^(?:\s|<br\s*\/?>)+/i, "");
			inText = (mediaHtml + inText).replace(/^(?:<br\s*\/?>)+/i, "");
		}
		// Render real Unicode emoji (😭 etc.) as inline images - no device font covers them,
		// so otherwise they show as tofu rectangles. Runs last so it operates on the final
		// HTML (after linkification) and messageText has allowHtml:true.
		this.$.messageText.setContent(this.buildQuote(inMessage) + enyo.messaging.message.emojify(inText) + this.buildReactions(inMessage));
	},
	// webOS replies: render the structured quoted-original as an inline quote card ABOVE the reply body,
	// instead of the raw "> ..."/HTML the networks fold into the text. quotedText/quotedFrom/quotedId are
	// set on the immessage row by the transport from each prpl's native reply metadata (mirrors reactions).
	// quotedId == the original message's serviceMessageId, so a tap can look it up (data-quoted-id).
	// Returns "" when the message isn't a reply.
	buildQuote: function(inMessage) {
		var qt = inMessage && inMessage.quotedText;
		if (!qt) { return ""; }
		var safeText = enyo.string.escapeHtml(String(qt)).replace(/\r|\n|\\r|\\n/g, "<br>");
		var from = inMessage.quotedFrom ? enyo.string.escapeHtml(String(inMessage.quotedFrom)) : "";
		var idAttr = inMessage.quotedMessageId ?
			' data-quoted-id="' + String(inMessage.quotedMessageId).replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '"' : '';
		return '<div class="reply-quote"' + idAttr + '>' +
			(from ? '<span class="reply-quote-from">' + from + '</span>' : '') +
			'<span class="reply-quote-text">' + enyo.messaging.message.emojify(safeText) + '</span></div>';
	},
	// webOS reactions: render the message's `reactions` array (merged onto the row by the transport's
	// ReactionHandler) as small inline badges on the bubble - one per distinct emoji with a count,
	// instead of a separate "reacted with X" message. Returns "" when there are no reactions.
	buildReactions: function(inMessage) {
		var rx = inMessage && inMessage.reactions;
		if (!rx || !rx.length) { return ""; }
		var counts = {}, order = [], mine = {};
		for (var i = 0; i < rx.length; i++) {
			var e = rx[i] && rx[i].emoji;
			if (!e) { continue; }
			if (counts[e] === undefined) { counts[e] = 0; order.push(e); }
			// per-sender entries ({emoji,sender}) count as 1; aggregated entries ({emoji,count}, e.g.
			// Telegram) carry the total directly.
			counts[e] += (rx[i].count > 0 ? rx[i].count : 1);
			// a reaction I placed (optimistic sender "me") -> tag the badge so it's highlighted and a
			// tap on it removes it (see ConversationList.handleMessageTap -> toggleMyReaction).
			if (rx[i].sender === "me") { mine[e] = true; }
		}
		if (!order.length) { return ""; }
		var html = "";
		for (var j = 0; j < order.length; j++) {
			var em = order[j];
			// data-reaction carries the exact stored emoji so a tap can toggle it. Escape it for the
			// attribute (it holds &#NNNNN; entities) so getAttribute round-trips the same string.
			var attr = String(em).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
			// emojify each reaction so astral emoji render as inline images (no device font covers them).
			html += '<span class="reaction-badge' + (mine[em] ? ' reaction-mine' : '') + '" data-reaction="' + attr + '">' +
				enyo.messaging.message.emojify(em) +
				(counts[em] > 1 ? '<span class="reaction-count">' + counts[em] + '</span>' : '') + '</span>';
		}
		return '<div class="message-reactions">' + html + '</div>';
	},
	// Linkify body text WITHOUT letting a URL get torn apart. The native runTextIndexer
	// (PalmSystem/LunaSysMgr) turns URLs, phone numbers and emails into links, but it also
	// matches the long digit run inside a URL's query/fragment - e.g. the metronieuws.nl share
	// link "...?utm_source=WhatsApp#Echobox=1785054101" - as a PHONE NUMBER, which splits the
	// URL into a half-link plus a separate "phone" link that wraps to its own line. To prevent
	// that we pull whole web URLs out first (swapping each for a private-use-char placeholder the
	// indexer leaves alone - no digits, so its phone matcher can't touch it), run the indexer on
	// what's left (real phone numbers/emails still linkify), then restore each URL as one <a>.
	// The message tap handler opens any <a href> via doOpenAttachment, so a plain anchor is enough.
	_webUrlRe: function() { return /(?:https?:\/\/|www\.)[^\s<>"']+/gi; },
	// index -> placeholder using letters a-j for digits 0-9 (never digits, so the phone matcher
	// can't grab the token), wrapped in private-use sentinels U+E000/U+E001.
	_urlToken: function(i) {
		var s = String(i), out = "";
		for (var k = 0; k < s.length; k++) { out += String.fromCharCode(97 + (s.charCodeAt(k) - 48)); }
		return "" + out + "";
	},
	linkifyPreservingUrls: function(inText) {
		var urls = [], self = this;
		var stashed = inText.replace(this._webUrlRe(), function(m) {
			// Keep trailing sentence punctuation out of the link (., ), ] etc.).
			var trail = "", mm = /[.,;:!?)\]]+$/.exec(m);
			if (mm) { trail = mm[0]; m = m.slice(0, m.length - trail.length); }
			var idx = urls.length;
			urls.push(m);
			return self._urlToken(idx) + trail;
		});
		var indexed = enyo.string.runTextIndexer(stashed);
		// Restore each stashed URL as a single anchor. The captured text is already HTML-safe
		// (& is &amp;: incoming text is pre-sanitized, outgoing was escapeHtml'd above) and the
		// regex excludes < > " ' so it is safe inside both href="..." and the anchor body.
		return indexed.replace(/([a-j]+)/g, function(tok, letters) {
			var num = "";
			for (var k = 0; k < letters.length; k++) { num += String.fromCharCode(48 + (letters.charCodeAt(k) - 97)); }
			var u = urls[parseInt(num, 10)];
			if (u === undefined) { return ""; }
			var href = (u.indexOf("www.") === 0) ? ("http://" + u) : u;
			return '<a href="' + href + '" target="_blank">' + u + '</a>';
		});
	},
	// Media file extensions we recognise, by kind. Discord/Telegram URLs carry the real extension
	// in the path (before the ?signed-params), so extension matching classifies them correctly.
	_imageExt: "jpg|jpeg|png|gif|webp|bmp|avif",
	_audioExt: "mp3|m4a|aac|ogg|oga|opus|flac|wav|wma|amr",
	_videoExt: "mp4|m4v|mov|webm|ogv|wmv|3gp|mkv|ts",
	// Documents: rendered as a typed icon chip (PDF/Word/Excel/PowerPoint) that opens in the associated
	// app via the system resource handler. Otherwise they'd show as a raw "file:///...pdf" link.
	_docExt: "pdf|doc|docx|xls|xlsx|ppt|pptx",
	// A fresh global regex matching http(s)/file media URLs by extension (with optional query string),
	// PLUS local ".data" files: WhatsApp voice notes arrive as "file://<hash>.data" (the gowhatsapp
	// plugin does not always map the audio mimetype to an extension), so surface those as a chip too.
	mediaUrlRe: function() {
		var exts = this._imageExt + "|" + this._audioExt + "|" + this._videoExt + "|" + this._docExt;
		return new RegExp(
			"(?:https?|file):\\/\\/[^\\s<>\"']+?\\.(?:" + exts + ")(?:\\?[^\\s<>\"']*)?" +
			"|file:\\/\\/[^\\s<>\"']+?\\.data(?:\\?[^\\s<>\"']*)?",
			"gi");
	},
	// Pull media URLs out of a body, classified {url, kind, name}. url is un-escaped (real &).
	extractMediaUrls: function(text) {
		var re = this.mediaUrlRe(), urls = [], seen = {}, m;
		while ((m = re.exec(text)) !== null) {
			var url = m[0].replace(/&amp;/g, "&");
			if (seen[url]) { continue; }
			seen[url] = true;
			urls.push({ url: url, kind: this.mediaKind(url), name: this.mediaName(url) });
		}
		return urls;
	},
	// True when the body is only media URLs (plus whitespace) - i.e. a pure media message.
	isOnlyMedia: function(text) {
		return text.replace(this.mediaUrlRe(), "").replace(/\s|<br>|\\r|\\n|\r|\n/g, "") === "";
	},
	// Classify a URL/path by its file extension.
	mediaKind: function(url) {
		var ext = this.urlExt(url).toLowerCase();
		// WhatsApp voice notes come through with an unmapped ".data" extension - treat as audio so
		// they get the play-icon chip (until the plugin maps the mimetype to .ogg).
		if (ext === "data") { return "audio"; }
		if (new RegExp("^(?:" + this._imageExt + ")$", "i").test(ext)) { return "image"; }
		if (new RegExp("^(?:" + this._audioExt + ")$", "i").test(ext)) { return "audio"; }
		if (new RegExp("^(?:" + this._videoExt + ")$", "i").test(ext)) { return "video"; }
		// Documents get their own kind so the chip shows the right app icon (see the .msg-attachment-*
		// CSS) and openAttachment routes them to their viewer.
		if (ext === "pdf") { return "pdf"; }
		if (ext === "doc" || ext === "docx") { return "doc"; }
		if (ext === "xls" || ext === "xlsx") { return "xls"; }
		if (ext === "ppt" || ext === "pptx") { return "ppt"; }
		return "file";
	},
	urlExt: function(url) {
		var p = String(url).split("?")[0].split("#")[0];
		var dot = p.lastIndexOf(".");
		return dot >= 0 ? p.substring(dot + 1) : "";
	},
	// Human filename for the chip label (last path segment, URL-decoded).
	mediaName: function(url) {
		var p = String(url).split("?")[0].split("#")[0];
		var slash = p.lastIndexOf("/");
		var name = slash >= 0 ? p.substring(slash + 1) : p;
		try { name = decodeURIComponent(name); } catch (e) {}
		// A bare "<hash>.<ext>" attachment (WhatsApp media with no real filename - the hash IS the
		// name) has nothing meaningful to show, so label it by kind instead of a raw hash: audio ->
		// "Voice message", video -> "Video", else a generic "Attachment". A named file (e.g. a
		// document "report.pdf") isn't pure-hash and falls through to show its real name.
		if (/^[0-9a-f]{16,}\.[a-z0-9]+$/i.test(name)) {
			if (/\.(mp4|3gp|3gpp|mov|m4v|webm|mkv|avi)$/i.test(name)) { return $L("Video"); }
			if (/\.(ogg|opus|mp3|m4a|aac|amr|wav|data)$/i.test(name)) { return $L("Voice message"); }
			// Hash-named documents (e.g. a WhatsApp PDF "<hash>.pdf") have no real name, so label them by
			// type instead of a generic "Attachment".
			if (/\.pdf$/i.test(name)) { return $L("PDF document"); }
			if (/\.docx?$/i.test(name)) { return $L("Word document"); }
			if (/\.xlsx?$/i.test(name)) { return $L("Excel spreadsheet"); }
			if (/\.pptx?$/i.test(name)) { return $L("PowerPoint presentation"); }
			return $L("Attachment");
		}
		// Legacy: a bare "<hash>.data" WhatsApp voice note that isn't pure-hash-named.
		if (/\.data$/i.test(name)) { return $L("Voice message"); }
		if (!name) { return $L("Attachment"); }
		// Cap long names (e.g. Discord filenames) so the chip stays tidy, keeping the extension.
		if (name.length > 28) {
			var dot = name.lastIndexOf(".");
			var ext = (dot > 0 && name.length - dot <= 6) ? name.substring(dot) : "";
			name = name.substring(0, 25 - ext.length) + "…" + ext;
		}
		return name;
	},
	// Inline <img> for an image URL. Local file:// images render bare; remote ones stay tappable.
	buildImageTag: function(url) {
		var u = url.replace(/"/g, "%22");
		var onload = ' onload="enyo.messaging.message.imageLoaded(this)"';
		var sz = this.imageSizeStyle(u);
		if (u.indexOf("file://") === 0) {
			// data-open/data-kind make a tap open the image in the Photos app (messageTapped ->
			// openAttachment), instead of doing nothing / opening the react row.
			return '<br><img class="message-image" src="' + u + '"' + sz + onload + ' data-open="' + u + '" data-kind="image"/>';
		}
		return '<br><a href="' + u + '" target="_blank"><img class="message-image" src="' + u + '"' + sz + onload + '/></a>';
	},
	// Inline size (px) for an image whose real dimensions imageLoaded already measured this session.
	// Baking it into the row HTML makes the flyweight measure the row at the PAINTED height instead of
	// old WebKit's phantom aspect-ratio height, so the re-measure settles immediately (no 1-2px jitter,
	// no gap under the photo). Keyed by the same string imageLoaded stores (data-open / src == u).
	imageSizeStyle: function(u) {
		try {
			var m = enyo.messaging.message;
			var d = m && m._imgDims && m._imgDims[u];
			if (d && d.w > 0 && d.h > 0) {
				return ' style="width:' + d.w + 'px;height:' + d.h + 'px"';
			}
		} catch (e) {}
		return '';
	},
	// A tappable attachment chip (audio/video/other). data-open carries the target; messageTapped()
	// reads it and opens it in the associated app (see ConversationList.openAttachment).
	buildAttachmentChip: function(item) {
		var open = (/^(?:https?|file):/i.test(item.url)) ? item.url : ("file://" + item.url);
		var openAttr = open.replace(/&/g, "&amp;").replace(/"/g, "%22");
		var name = enyo.string.escapeHtml(item.name);
		// Audio (voice notes) plays INLINE in the bubble via an HTML5 <audio> element (the app webview
		// is a file:// origin, same-origin as the local note, and the system pipeline now has Opus).
		// The old WebKit doesn't render native <audio controls> (just a blank box), so we draw our own
		// play/pause button; messageTapped toggles the hidden <audio>. No navigation = no crash.
		// Video plays INLINE too (same media path as audio: WebKit's MediaPlayerPrivatePalm hands the
		// URI to the media server, which decodes it). libWebKitLuna's supportsType() list was binary-
		// patched to add video/webm (repurposed the dead video/x-ms-wmv slot), so WebKit's engine now
		// loads webm directly; the media server (decodebin + the vp8/vp9 gst-0.10 backport + autoplug
		// shim) typefinds the real bytes and decodes WebM/VP9. mkv rides the same video/webm type (the
		// media server sniffs the container regardless). mp4-family declares its true type -> fullscreen.
		if (item.kind === "video") {
			var vext = this.urlExt(item.url).toLowerCase();
			var vtype = /^(?:webm|mkv)$/.test(vext) ? "video/webm"
				: /^(?:3gp|3gpp)$/.test(vext) ? "video/3gpp"
				: /^(?:mov)$/.test(vext) ? "video/quicktime"
				: "video/mp4";
			// First-view preview: the plugin drops the sender's embedded JPEG thumbnail next to a local
			// video as "<base>.jpg". poster= loads it as a plain image (independent of the clip's own
			// data, so preload="none" stays crash-safe) -> a preview from the first render. Local
			// file:// videos only; if the .jpg is absent WebKit just shows no poster (no error).
			var poster = (/^file:/i.test(openAttr) && vext) ? openAttr.slice(0, -vext.length) + "jpg" : "";
			return '<div class="msg-video-player" data-video-toggle="1" data-open="' + openAttr + '">' +
				'<video class="msg-video" preload="none"' + (poster ? ' poster="' + poster + '"' : '') +
					' onended="enyo.messaging.message.videoEnded(this)">' +
					'<source src="' + openAttr + '" type="' + vtype + '"></source>' +
				'</video>' +
				'<div class="msg-video-btn"></div></div>';
		}
		if (item.kind === "audio") {
			// WebKit won't load a bare src it can't type: a WhatsApp voice note is "file://<hash>.data"
			// (no mapped extension), so WebKit has no MIME to infer and never hands it to the media server
			// -> silent. An explicit <source type> fixes that: WebKit trusts the declared type, loads the
			// bytes, and the media server typefinds the real codec regardless of the filename. WhatsApp
			// voice notes are Opus-in-Ogg, so ".data" (and ogg/oga/opus) map to audio/ogg.
			// NOTE the declared type must be one WebKit's supportsType gate ACCEPTS (canPlayType != "") or
			// the <source> is rejected and the element stalls at "waiting" -- WebKit never hands it to the
			// media server. On this device canPlayType("audio/mp4") == "" (BLOCKED) but "audio/aac" ==
			// "maybe", so a Teams voice note (AAC-in-MP4, .m4a) MUST be declared audio/aac, not audio/mp4:
			// WebKit then loads the bytes and the media server typefinds the real MP4/AAC and plays it.
			// (Verified with a canPlayType probe in an app-context page: mp4=[] aac=[maybe] wav/ogg ok.)
			var aext = this.urlExt(item.url).toLowerCase();
			var atype = /^(?:ogg|oga|opus|data)$/.test(aext) ? "audio/ogg"
				: /^(?:mp3)$/.test(aext) ? "audio/mpeg"
				: /^(?:m4a|aac|mp4)$/.test(aext) ? "audio/aac"
				: /^(?:wav)$/.test(aext) ? "audio/wav" : "audio/ogg";
			return '<div class="msg-audio-player">' +
				'<div class="msg-audio-btn" data-audio-toggle="1"></div>' +
				'<div class="msg-audio-body">' +
					'<div class="msg-audio-track"><div class="msg-audio-fill"></div></div>' +
					'<div class="msg-audio-time">0:00</div>' +
				'</div>' +
				// preload="none" (like the video player above): preload="metadata" spawns a
				// media-pipeline process PER voice note on render, so a thread with several voice notes
				// storms media-pipeline until it runs out of fds and SIGABRTs (media-pipeline/WebAppMgr
				// crashes). With "none" the pipeline is only created when the user actually taps play;
				// the duration fills in then (0:00 until first play), same trade-off the video makes.
				'<audio class="msg-audio" preload="none"' +
					' onloadedmetadata="enyo.messaging.message.audioMeta(this)"' +
					' ontimeupdate="enyo.messaging.message.audioTime(this)"' +
					' onended="enyo.messaging.message.audioEnded(this)">' +
					'<source src="' + openAttr + '" type="' + atype + '"></source>' +
				'</audio></div>';
		}
		return '<div class="msg-attachment" data-open="' + openAttr + '" data-kind="' + item.kind + '">' +
			'<div class="msg-attachment-icon msg-attachment-' + item.kind + '"></div>' +
			'<div class="msg-attachment-name">' + name + '</div></div>';
	},
	// Attachment send: is this local path an image we can preview inline?
	isImagePath: function(path) {
		return new RegExp("\\.(?:" + this._imageExt + ")$", "i").test(path || "");
	},
	// Attachment send: inline <img> for a local (just-sent) image file. path is an absolute device
	// path; turn it into a file:// URL for the WebKit <img> src.
	buildLocalImageHtml: function(path) {
		var url = (path.indexOf("file://") === 0) ? path : ("file://" + path);
		url = url.replace(/"/g, "%22");
		return '<br><img class="message-image" src="' + url + '"' + this.imageSizeStyle(url) + ' onload="enyo.messaging.message.imageLoaded(this)" data-open="' + url + '" data-kind="image"/>';
	},
	// Tap on the message body. If an attachment chip OR a link (<a href>) was hit, open its target
	// via the system handler and SWALLOW the tap. Critically, we cancel the native navigation:
	// letting the message webview follow a file:// link (especially a binary .data attachment) or a
	// remote page loads it inside the app card and crashes LunaSysMgr. Plain-text taps bubble through
	// so the row context-menu (handleMessageTap) still works.
	messageTapped: function(inSender, inEvent) {
		var node = inEvent && (inEvent.target || (inEvent.domEvent && inEvent.domEvent.target));
		var root = this.hasNode();
		while (node && node !== root) {
			if (node.getAttribute) {
				var name = (node.nodeName || node.tagName || "").toUpperCase();
				// Inline video play/pause: toggle the <video> sibling; the button hides while playing.
				// Tap a video. mp4-family plays FULLSCREEN in the stock video player (media server
				// handles those); WebM/MKV plays inline (the media server can't decode those, and
				// fullscreen isn't possible in this webview - <video> renders on a hardware layer
				// behind the webview and there's no working HTML5 fullscreen API here).
				if (node.getAttribute("data-video-toggle")) {
					var vtarget = node.getAttribute("data-open");
					if (vtarget && /^(?:mp4|m4v|mov|3gp|avi)$/i.test(this.urlExt(vtarget))) {
						var de = (inEvent && inEvent.preventDefault) ? inEvent : (inEvent && inEvent.domEvent);
						if (de && de.preventDefault) { de.preventDefault(); }
						this.doOpenAttachment({ target: vtarget.replace(/&amp;/g, "&"), kind: "video" });
						return true;
					}
					var video = node.getElementsByTagName ? node.getElementsByTagName("video")[0] : null;
					if (video) {
						if (video.paused) {
							if (video.ended || (video.duration && video.currentTime >= video.duration - 0.15)) {
								try { video.currentTime = 0; } catch (e) {}
							}
							try { video.play(); } catch (e) {}
							node.className = "msg-video-player playing";
						} else {
							try { video.pause(); } catch (e) {}
							node.className = "msg-video-player";
						}
					}
					return true;
				}
				// Inline voice-note play/pause: toggle the <audio> sibling in this player box.
				if (node.getAttribute("data-audio-toggle")) {
					var box = node.parentNode;
					var audio = box && box.getElementsByTagName ? box.getElementsByTagName("audio")[0] : null;
					if (audio) {
						if (audio.paused) {
							// Replay from the start if it had finished (we leave the position at the end).
							if (audio.ended || (audio.duration && audio.currentTime >= audio.duration - 0.15)) {
								try { audio.currentTime = 0; } catch (e) {}
							}
							audio.play();
							node.className = "msg-audio-btn playing";
						} else {
							audio.pause();
							node.className = "msg-audio-btn";
						}
					}
					return true;
				}
				var target = node.getAttribute("data-open") || (name === "A" ? node.getAttribute("href") : null);
				if (target) {
					// Cancel the browser's own navigation to the href before handing off.
					var de = (inEvent && inEvent.preventDefault) ? inEvent : (inEvent && inEvent.domEvent);
					if (de && de.preventDefault) { de.preventDefault(); }
					var kind = node.getAttribute("data-kind") || this.mediaKind(target);
					this.doOpenAttachment({ target: target.replace(/&amp;/g, "&"), kind: kind });
					return true;
				}
			}
			node = node.parentNode;
		}
		return false;
	},
	updateContactImage: function(personImage) {
		this.$.contactImage.setAttribute("src", personImage);
	},
	updateTime: function(localTimestamp) {
		this.$.messageTime.setContent(this.formatTime(new Date(localTimestamp)));
	},
	formatTime: function(date){
		if (!date) {
			return "";
		}
		
		
		return Utils.formatShortTime(date);
	},
	updateSentReceived: function(inFolder) {
		if (inFolder === enyo.messaging.message.FOLDERS.INBOX) {
			this.$.message.setClassName("enyo-item chat-balloon-received");
			this.$.imageContainer.canGenerate = true; 
			this.$.imageContainer.show();
		} else if(inFolder === enyo.messaging.message.FOLDERS.OUTBOX){
			this.$.message.setClassName("enyo-item chat-balloon-sent");
			this.$.imageContainer.canGenerate = false; 
		} else {
			this.$.message.setClassName("enyo-item chat-balloon-system");
			this.$.imageContainer.canGenerate = false; 
		}
	},
	// Delivery/read receipt tick. Only OUTGOING messages get one: deliveryStatus "delivered" shows a
	// single check, "read" a double check; anything else (incl. incoming) shows nothing. The transport's
	// ReceiptHandler stamps deliveryStatus on the Outbox row from prpl receipts. Rows are flyweight-
	// recycled, so this resets both ways.
	updateDeliveryStatus: function(status, folder) {
		var isOutgoing = folder === enyo.messaging.message.FOLDERS.OUTBOX;
		// NOTE: only show()/hide() here - do NOT toggle canGenerate. The receiptIcon is generated up
		// front (hidden via showing:false); flipping canGenerate on a flyweight-recycled row can leave
		// the node ungenerated, so a later show() renders nothing - which is why a batch-applied status
		// (e.g. a Telegram read/delivered watermark) showed on live-updated rows but not on freshly
		// opened conversations.
		if (isOutgoing && (status === "read" || status === "delivered")) {
			this.$.receiptIcon.setSrc(status === "read" ? "images/msg-read.png" : "images/msg-delivered.png");
			this.$.receiptIcon.show();
		} else {
			this.$.receiptIcon.hide();
		}
	},
	updateInvite: function(message) {
		var showInvite = this.message._kind === "com.palm.iminvitation:1" && this.message.accepted === "pending";
		
		// update invite buttons
		this.updateInviteButtons(showInvite);	
		// update style
		if (showInvite) {
			this.$.message.setClassName("enyo-item chat-balloon-error");
			this.$.imageContainer.canGenerate = false; 
		}
	},
	updateInviteButtons: function(show) {
		this.$.invitationButtons.canGenerate = show;
		this.$.invitationButtons.setShowing (show);
	},
	showError: function(inSender, inEvent){
		this.doError(this.message);
		return true;
	},
	// Tapping the sender name on a group message opens a 1:1 with that person. Bubble the click (it
	// carries the flyweight rowIndex) up to the list, and return true so the normal message-tap
	// (context menu) does not also fire.
	senderTapped: function(inSender, inEvent){
		this.doSelectSender(inEvent);
		return true;
	},
	acceptedBuddy: function(inSender, inEvent) {
		this.setResponseInvitation(true);
		return true;
	},
	declinedBuddy: function(inSender, inEvent) {
		this.setResponseInvitation(false);
		return true;
	},
	setResponseInvitation: function(accepted) {
		this.$.inviteService.responseToInvite(this.message, accepted);
	}
});