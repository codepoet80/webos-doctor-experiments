# `getPreferences` is not implemented on the account server

**For: the webOS Community Account / App Catalog server project.**
**Not a system-image issue** — nothing here is fixed by changing the Doctor or
the rootfs. It is written from the device side because that is where the
evidence is, and handed over so the fix can happen on the server.

Observed on webOS CE 3.1.0, BUILDMARK 600070, 2026-08-30, during a deliberate
account sign-out and sign-in on real hardware.

---

## What happens

`com.palm.service.palmprofile` calls the account server's `getPreferences`
method. The server does not implement it and answers `UNKNOWN_METHOD`, which the
stock Palm client turns into an exception and logs as a "SET ERROR":

```
{palmprofile/accountservices}: Sending regular request (curl/https) to:
    https://appcatalog.webosarchive.org/WebService/device.php?m=
{palmprofile/accountservices}: Sending regular request to server with method: getPreferences
{palmprofile/accountservices}: ---------- PALMPROFILE exception log ---------"UNKNOWN_METHOD"
{palmprofile/accountservices}: ---------- PALMPROFILE JSONException (getPreferences) ---------
{palmprofile/accountservices}: ---------- PALMPROFILE SET ERROR ---------
```

Five calls during one sign-out/sign-in cycle: four returned `UNKNOWN_METHOD`,
one failed earlier in boot with `Could not resolve host: appcatalog.webosarchive.org`
— that one is an unrelated transient, the network simply was not up yet.

**It is currently harmless.** The account is created and persists, `listAccounts`
returns it, db8 answers, and both sign-out and sign-in complete. The lines are
logged at `user.info`, not error level; the shouty banner is just how that stock
code formats itself. It is documented in the image's `KNOWN-ISSUES.md` as #12
purely so nobody greps the log after an unrelated bug and thinks they have found
the cause.

---

## The exact request to implement

Built by `postRequestInternal` in
`/usr/palm/services/com.palm.service.palmprofile/utils/palm_profile_util.js`:

```
POST https://appcatalog.webosarchive.org/WebService/device.php?m=getPreferences
Content-Type: application/json
Connection: close
```

The URL is the base with the method name appended — the base already ends in
`?m=`, so the method becomes the query value.

**Request body** (from `handlers/PreferencesCommandAssistant.js`):

```json
{
  "InPreferences": {
    "preferenceKey": "APPLICATIONS, <appName>",
    "category": "<category, or empty string>"
  }
}
```

`appName` is required by the client — it raises `NULL_APP_NAME` locally before
sending if it is missing. `preferenceKey` is literally the string
`"APPLICATIONS, "` concatenated with the app name, comma and space included.

**Response the client expects:**

```json
{ "OutParameterInfo": { ... } }
```

The client does exactly this:

```js
var result = prefsFuture.result.responseJSON;
if (result && result.OutParameterInfo) {
    future.result = result.OutParameterInfo;
} else {
    PalmProfileUtil.sendError(future, "NO_PREFERENCES", "Could not get preferences");
}
```

So the minimum viable implementation is a 200 with a JSON body carrying an
`OutParameterInfo` object. An empty object is a legitimate answer for "this app
has no stored preferences" — note that returning **no** `OutParameterInfo` key
is a different outcome (`NO_PREFERENCES`) than returning an empty one.

---

## Who calls it

Four call sites, all in `com.palm.service.palmprofile/handlers`:

| Caller | When |
|---|---|
| `PreferencesCommandAssistant.js` | the `getPreferences` service method itself |
| `PostLoginSettingsCommandAssistant.js` (two call sites) | after login; one is the SMS/messaging settings path |
| `ChangePasswordCommandAssistant.js` | during a password change |

Only the post-login path is exercised today, which is why the failure is
currently invisible to users. **The password-change path is the one to watch:**
if that flow is ever wired up, it will hit the same missing method at a point
where the user is waiting on a result rather than idling after login.

---

## What already works

`getAccountToken` is implemented and healthy — `GetTokenCommandAssistant` ran 12
times in the same session with no exception. So the transport, TLS, and request
format are all fine; this is specifically a missing method, not a broken client.

Worth knowing on the server side: the image already patches
`palm_profile_util.js` to POST via `/usr/bin/curl` (OpenSSL 1.1.1w) instead of
node 0.4.12's TLS, because the stock stack cannot complete a handshake with the
Cloudflare origin. Request and response bodies go through temp files to avoid
shell-escaping the JSON.

The handlers that already carry a `.stock` sibling — i.e. that CE has adapted
for the community server — are `GetAccountInfoAggregateAssistant`,
`GetTermsAndConditionsCommandAssistant`, `GetTokenCommandAssistant`,
`IsEmailAvailableCommandAssistant`, and `LoginProfileCommandAssistant`, plus
`services.json` and `palm_profile_util.js`.

---

## Other methods the client can call

Not currently observed failing, but these handlers exist and will hit the server
if their flows are ever driven. Listing them so the server side knows the full
surface rather than discovering it one `UNKNOWN_METHOD` at a time:

`AssignDeviceName`, `AuthFromQuestion`, `ChangeAccountPassword`, `ChangeEmail`,
`ChangePassword`, `CreateProfile`, `DissociateDevice`, `GetAccountInfo`,
`GetAccountSecurityQuestion`, `GetAllQuestions`, `GetServerUrl`,
`GetTermsAndConditions`, `GetURLForTerms`, `GetWaitPeriods`, `IsDeviceInUse`,
`IsEmailAvailable`, `IsUserValid`, `LoginProfile`, `PasswordResetEmail`,
`PostLoginSettings`, `ProcessMessage`, `RefreshJabberInfo`,
`ResendVerificationEmail`, `SignOut`, `SyncDeviceName`, `UpdateAccount`,
`UpdateChallengeQuestion`, `UpdateDeviceProps`, `UpdateUsername`.

A worthwhile server-side change independent of `getPreferences`: return a
distinguishable response for a genuinely unimplemented method, so the next gap
is obvious in a log rather than surfacing as a generic client-side "SET ERROR".

---

## Reproducing it

On a CE device with an account signed in:

```
# sign out and back in through Settings, then:
grep -c 'PALMPROFILE SET ERROR' /var/log/messages
grep -o 'PALMPROFILE exception log ---------.*' /var/log/messages | sort | uniq -c
grep -o 'Sending regular request to server with method: [a-zA-Z]*' /var/log/messages | sort | uniq -c
```

`/var/log/messages` rotates at ~2 MB — roughly every 13 minutes on this hardware
— so check soon after the operation or the evidence will have rolled off.
