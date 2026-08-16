#! /bin/sh
#
# usbctl-jsservice -- self-contained launcher for the USB Settings JS service.
#
# This is a thin wrapper around STOCK webOS 3.0.5 components (node + the stock
# jsservicelauncher bootstrap). It is functionally equivalent to the homebrew
# `run-homebrew-js-service`, but shipping our own copy means this package has NO
# dependency on an external JS-service-framework feed package -- everything it
# references is present on a bare device.
#
FRAMEWORKS_PATH=/usr/palm/frameworks
NODE_ADDONS=/usr/palm/nodejs
NODE=/bin/node
BOOTSTRAP=/usr/palm/services/jsservicelauncher/bootstrap-node.js

SERVICE_PATH=$1
cd "$SERVICE_PATH" || exit 1

if [ -f /usr/lib/libmemcpy.so ] ; then
	export LD_PRELOAD="/usr/lib/libmemcpy.so:${LD_PRELOAD}"
fi
export NODE_PATH="$FRAMEWORKS_PATH:$NODE_ADDONS"

exec "$NODE" --notimeout_script_execution "$BOOTSTRAP" -- /var/palm/ls2
