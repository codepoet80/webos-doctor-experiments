# Pinned CA bundle

`ca-certificates.crt` is the trust store baked into the CE image
(`/etc/ssl/certs/ca-certificates.crt` on the device). It is **pinned here on
purpose**: it used to be copied from whatever the build host happened to have
installed, which made the image's trust store depend on the build machine's
`ca-certificates` package version at build time — the same image built on two
machines would trust different roots.

- Source: Debian/Ubuntu `ca-certificates` on the build host
- Captured: 2026-08-18 (121 certificates, 182140 bytes)

To refresh deliberately: replace this file, note the date above, and re-bake.
`CA_BUNDLE=/path/to/other.crt` still overrides it for a one-off build.
