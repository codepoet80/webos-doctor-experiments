#!/bin/sh
# bt-a2dp-fix — make Bluetooth A2DP media actually stream on the webOS 3.0.5 TouchPad.
#
# Root cause (see memory note bluetooth-a2dp-media-mute): audiod DOES route media to the pulse `a2dp`
# sink, but the BT stack's A2DP stream only reaches "Connected Open" (and then "Connected Streaming")
# on a DEVICE-INITIATED connect. HEADSET-INITIATED reconnects (turn the headset off/on, auto-reconnect)
# stall at "Connected" — the AVDTP stream endpoint never opens — so music is written to the a2dp FIFO
# and goes nowhere (silent), while system sounds stay on the speaker.
#
# Confirmed working recipe (sound verified through an H800):
#   1. a fresh BT stack does a device-initiated connect -> reaches "Connected Open"
#   2. luna-send palm://com.palm.bluetooth/a2dp/play {"address":...} -> "Connected Streaming" -> audio
# (a2dp/audioActivity {"active":true} alone does NOT start it; a2dp/play is the trigger, and only once
#  the stream is already "Connected Open".)
#
# This daemon polls the A2DP state (from /var/log/bt.log, the only place the fine AVDTP sub-states show)
# and:
#   - when A2DP stalls at "Connected" for STALL_SECS without opening -> restarts the BT stack (an upstart
#     `respawn` job, so it comes back fresh and device-initiates the connect -> "Connected Open").
#     Guarded by MIN_RESTART_GAP so it can never storm.
#   - when A2DP is "Connected Open" and media is actually routed to the a2dp sink -> issues a2dp/play so
#     it advances to "Connected Streaming".
#
# NOTE: restarting the BT stack briefly drops ALL Bluetooth (incl. HID). It only fires on a genuine
# A2DP stall (i.e. right after you turn a headset on), never on a healthy connect, and is rate-limited.

BTLOG=/var/log/bt.log
STATEDIR=/tmp/bt-a2dp-fix
STALL_SECS=6            # a device-initiated connect reaches Open in <1s; a stall sits at Connected forever
MIN_RESTART_GAP=45      # never restart the BT stack more often than this (anti-storm guard)
POLL=2

mkdir -p "$STATEDIR"
log() { echo "$(date '+%Y-%m-%dT%H:%M:%S') bt-a2dp-fix: $*"; }

# address of the currently-A2DP-connected device (from the latest EnumStates line)
a2dp_addr() {
	grep -oE '"a2dp":\[\{"address":"[0-9A-Fa-f:]{17}"' "$BTLOG" 2>/dev/null | tail -1 | grep -oE '[0-9A-Fa-f:]{17}'
}

# latest A2DP AVDTP state token: "Connected" | "Connected Open" | "Connected Streaming" | "Disconnected" | ...
a2dp_state() {
	grep -oE '\[A2DP\]: Current State: \([^)]*\) , New State: \(([^)]*)\)' "$BTLOG" 2>/dev/null \
		| tail -1 | sed -r 's/.*New State: \(([^)]*)\)/\1/'
}

# is media actually flowing to the pulse `a2dp` sink right now (a non-corked sink-input on it)?
media_on_a2dp() {
	idx=$(pactl list sinks 2>/dev/null | awk '/^Sink #/{n=$0} /Name: a2dp$/{print n}' | grep -oE '[0-9]+' | head -1)
	[ -n "$idx" ] || return 1
	pactl list sink-inputs 2>/dev/null | awk -v idx="$idx" '
		/^Sink Input #/{s="";c=""}
		/Sink: /{s=$2}
		/Corked: /{c=$2; if(s==idx && c=="no") found=1}
		END{exit(found?0:1)}'
}

start_streaming() {
	a=$(a2dp_addr)
	[ -n "$a" ] || return
	log "Connected Open -> a2dp/play $a (advance to Streaming)"
	luna-send -n 1 palm://com.palm.bluetooth/a2dp/play "{\"address\":\"$a\"}" >/dev/null 2>&1
}

# Is a VoIP call active right now? The IM transport plays call audio via ALSA, which appears as an
# "ALSA plug-in [imlibpurpletransport]" sink-input. NB: check by that app name, NOT by the pvoip sink
# index - audiod/module-palm-policy ROUTES the stream to the physical sink (pcm_output) for the active
# scenario, so its "Sink:" shows pcm_output, not pvoip. Protocol-agnostic (WhatsApp/Telegram/Signal/...).
call_active() {
	pactl list sink-inputs 2>/dev/null | grep -qi "imlibpurpletransport"
}

restart_stack() {
	now=$1
	if call_active; then
		log "A2DP stalled but a VoIP call is active - NOT restarting the BT stack (would drop the call)"
		return 1
	fi
	last=$(cat "$STATEDIR/last_restart" 2>/dev/null || echo 0)
	if [ $((now - last)) -lt $MIN_RESTART_GAP ]; then
		log "A2DP stalled but within ${MIN_RESTART_GAP}s restart guard - not restarting"
		return 1
	fi
	echo "$now" > "$STATEDIR/last_restart"
	log "A2DP stalled at Connected (never opened) -> restarting BT stack to force a device-initiated connect"
	kill $(pidof PmBtEngine PmBtStack BluetoothMonitor) 2>/dev/null
	return 0
}

log "started (poll ${POLL}s, stall ${STALL_SECS}s, restart-gap ${MIN_RESTART_GAP}s)"
prev_state=""
connected_since=0
in_call=""
while true; do
	st=$(a2dp_state)
	now=$(date +%s)
	# During a VoIP call, YIELD the headset to audiod. audiod is designed to pause A2DP and switch the
	# headset to SCO (phone_bluetooth_sco) when a call is active - but our a2dp/play workaround (for the
	# media-streaming bug) fights that and starves the call's Bluetooth audio (media_a2dp out-competes
	# phone_bluetooth_sco). So on a call: pause A2DP ONCE and stand down until the call ends; do NOT touch
	# A2DP again. Lets audiod do its built-in A2DP<->SCO handoff. (call_active() = a stream on the pvoip
	# sink; could be swapped for a com.palm.phonecall db8 watch - the more webOS-native signal.)
	if call_active; then
		if [ "$in_call" != "1" ]; then
			in_call=1
			a=$(a2dp_addr)
			[ -n "$a" ] && luna-send -n 1 palm://com.palm.bluetooth/a2dp/pause "{\"address\":\"$a\"}" >/dev/null 2>&1
			log "VoIP call active -> paused A2DP; standing down so audiod owns the headset for the call"
		fi
		prev_state="$st"; sleep $POLL; continue
	fi
	if [ "$in_call" = "1" ]; then in_call=""; log "call ended -> resuming A2DP media management"; fi
	case "$st" in
		"Connected")
			# entered Connected? start the stall clock
			[ "$prev_state" = "Connected" ] || connected_since=$now
			if [ $((now - connected_since)) -ge $STALL_SECS ]; then
				restart_stack "$now"          # may be a no-op if within the guard window
				connected_since=$now          # re-arm: wait another STALL_SECS before re-attempting (no spam)
			fi
			;;
		"Connected Open")
			# Stream endpoint is open -> advance it to "Connected Streaming" with a2dp/play. Do this
			# UNCONDITIONALLY (once, on entering the state), NOT gated on media already being on the a2dp
			# sink: audiod only routes media to the a2dp sink once A2DP is actually streaming, so gating on
			# media-present would deadlock (no play until media, no media until play). This mirrors the proven
			# manual recipe. Firing once per Open entry avoids re-issuing every poll.
			if [ "$prev_state" != "Connected Open" ]; then start_streaming; fi
			;;
		*)
			: # Connected Streaming (good) / Disconnected / Activating / etc. - nothing to do
			;;
	esac
	prev_state="$st"
	sleep $POLL
done
