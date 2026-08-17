#!/bin/sh
# Keep the IM transport resident (respawned by upstart) so it isn't hub-idle-reaped and can
# receive pushed messages. Mirrors the exact invocation the LS2 .service uses (see
# ../sysbus/com.palm.imlibpurple.service.in Exec line): -c <log config> <device args>.
#
# IM_RESIDENT tells the transport it is the resident daemon so it does NOT self-terminate on idle
# (IMServiceHandler::OkToShutdown). Without this the transport's idle self-shutdown + this respawn
# fight each other in a ~30s churn loop that reloads every prpl (incl. purple-signal's JVM) each
# cycle and never lets slow accounts connect. The on-demand .service path leaves it unset.
export IM_RESIDENT=1
# Log at "info", not "debug": this is a RESIDENT daemon, so debug-level logging (every libpurple
# prpl_debug_misc line - tdlib "Displaying message", HTTP request tracing, "Incoming update", ...)
# streams continuously to imstdout.log at tens of MB/hour and fills /media/internal. "info" keeps
# the useful operational lines (connect/login/incoming-message) and drops the prpl debug flood.
# Bump back to "debug" temporarily when actively debugging a specific connector; to also get the
# libpurple prpl debug (tdlib "Displaying message", HTTP tracing, ...) add: export IM_PURPLE_DEBUG=1

# SELF-HEAL the PmLog init semaphore. libPmLogLib opens /dev/shm/sem.PmLogLib and takes a one-time
# init lock on it; if a transport is killed mid-init (a kill -9 on a running system, OR the process
# being reaped during the boot ordering) the sem stays LOCKED, and every subsequent transport then
# blocks forever on its first PmLog call -- 1 thread, no log output, no LS2 hub connect, no accounts,
# "no messages come in", and upstart eventually hits its respawn limit. Already-running services that
# inited PmLog earlier are unaffected, so ONLY the (re)started transport hangs. A tmpfs /dev/shm is
# cleared on boot, but the corruption also happens DURING boot, so clear it on every launch: unlinking
# the name is harmless (sem_open recreates a fresh, unlocked one; other holders keep their handle).
# See the imtransport-pmlog-sem-hang note. This is the durable fix for the recurring startup hang.
rm -f /dev/shm/sem.PmLogLib

exec /var/imwrap.sh -c '{"log":{"appender":{"type":"stdout"},"levels":{"imlibpurple":"info"}}}' PalmPre Palm-Pre/1.5
