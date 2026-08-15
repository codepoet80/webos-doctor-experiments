// webOS CE OOBE card sequence for the community first-use app.
//
// Stock 3.0.5 ran: language, palm, signin, restoreComponent, google,
// namedevice, updates. CE drops the cards whose backends no longer exist:
//   - restoreComponent  (HP backup restore — dead, and its cleanup path wiped
//                        devices; nothing to restore from a community account)
//   - google            (Google location-service consent — service defunct)
//   - updates           (stock OTA check hangs; CE updates arrive via the CE
//                        OTA path after setup)
// The kept cards: pick a language, accept the community TOS (this doubles as
// the HTTPS-readiness/connectivity gate), sign in to or create a webOS
// Account, and name the device (assignDeviceName is served by device.php).
FirstUse.config = [
	{name: "language", requires:{data: false}},
	{name: "palm", requires:{data: true}},
	{name: "signin", requires:{data: true}},
	{name: "namedevice", requires:{data: true}},
];
