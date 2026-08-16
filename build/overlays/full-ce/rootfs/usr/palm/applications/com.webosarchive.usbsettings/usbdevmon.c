/* usbdevmon.c -- USB Settings device monitor (ships with com.webosarchive.usbsettings)
 *
 * Runs as root while the USB Settings panel is open (the watch daemon starts and
 * stops it based on a keepalive file). It surfaces, into a small JSON file the
 * jailed app reads, the two things a user needs while troubleshooting a USB
 * device on the TouchPad:
 *
 *   1. WHAT is connected -- enumerated input devices (name + type from evdev)
 *      and USB devices that are attached but UNCONFIGURED ("needs power": the
 *      root hub rejected their power draw, so they have no input node yet).
 *
 *   2. Whether input is actually FLOWING -- we read the input nodes (SHARED, no
 *      EVIOCGRAB, so we never lock the device away from a game) and flag a device
 *      "active" for ~1.2s after any event. That turns the invisible question
 *      "is the pad wedged, or is the game broken?" into a visible signal: press a
 *      button, watch for "input received". No press -> nothing lights up, which
 *      is itself the answer. (A wedged pad enumerates fine but delivers zero
 *      events, indistinguishable from an idle one until you press.)
 *
 * Output: /media/internal/.usbctl-devices, e.g.
 *   {"devices":[{"name":"Logitech Precision","type":"gamepad","state":"ok","active":true},
 *               {"name":"Wireless Controller","type":"generic","state":"needspower","active":false}]}
 * Written only when it changes (press edges), to spare the flash.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <sys/time.h>
#include <time.h>
#include <dirent.h>
#include <poll.h>
#include <sys/ioctl.h>
#include <linux/input.h>

#ifndef BTN_GAMEPAD
#define BTN_GAMEPAD  0x130
#endif
#ifndef BTN_JOYSTICK
#define BTN_JOYSTICK 0x120
#endif
#ifndef BTN_MOUSE
#define BTN_MOUSE    0x110
#endif

#define OUTFILE   "/media/internal/.usbctl-devices"
#define ACTIVE_MS 1500          /* "input received" window; > app poll so 1Hz catches it */
#define POLL_MS   200
#define RESCAN_MS 700           /* snappy pickup of a freshly-enumerated node */
#define MAXIN     12
#define MAXNP     8

static long now_ms(void)
{
    /* MONOTONIC, not wall clock: ntpdate-sync jumps the wall clock after boot,
     * and a backward jump made every (t - last_*) gate go negative -- the scan
     * loop silently stopped rescanning for minutes ("list empty but the node
     * exists" while a freshly-started instance worked). Uptime can't jump. */
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (long)ts.tv_sec * 1000 + ts.tv_nsec / 1000000;
}

/* Transition log to tmpfs (no flash wear, cleared at reboot). Records device
 * add/drop/open-failure with errno -- the evidence for any "list is empty but
 * the node exists" report. Quiet in steady state. */
#include <stdarg.h>
static void dlog(const char *fmt, ...)
{
    FILE *f = fopen("/tmp/usbdevmon.log", "a");
    va_list ap;
    struct timeval tv;
    if (!f) return;
    gettimeofday(&tv, NULL);
    fprintf(f, "%ld.%03ld ", (long)tv.tv_sec % 100000, (long)tv.tv_usec / 1000);
    va_start(ap, fmt); vfprintf(f, fmt, ap); va_end(ap);
    fputc('\n', f);
    fclose(f);
}

static int has_key(int fd, int code)
{
    unsigned long bits[(KEY_MAX / (8 * sizeof(long))) + 1];
    memset(bits, 0, sizeof(bits));
    if (ioctl(fd, EVIOCGBIT(EV_KEY, sizeof(bits)), bits) < 0) return 0;
    return (bits[code / (8 * sizeof(long))] >> (code % (8 * sizeof(long)))) & 1UL;
}

/* device type strings the UI maps to an icon */
static const char *classify(int fd)
{
    if (has_key(fd, BTN_GAMEPAD) || has_key(fd, BTN_JOYSTICK)) return "gamepad";
    if (has_key(fd, KEY_A) && has_key(fd, KEY_Z))             return "keyboard";
    if (has_key(fd, BTN_MOUSE))                               return "mouse";
    return "generic";
}

/* ---- open input devices we're watching ---- */
typedef struct {
    int  idx;                 /* /dev/input/eventN */
    int  fd;
    char name[80];
    const char *type;
    long last_active;         /* ms, 0 = never */
} indev_t;
static indev_t in[MAXIN];
static int nin = 0;

static int is_builtin(const char *n)
{
    return !strcmp(n, "gpio-keys") || !strcmp(n, "pmic8058_pwrkey") ||
           !strcmp(n, "headset");
}

static int have_idx(int idx)
{
    int i;
    for (i = 0; i < nin; i++) if (in[i].idx == idx) return 1;
    return 0;
}

static void drop_in(int i)
{
    if (in[i].fd >= 0) close(in[i].fd);
    if (i < nin - 1) memmove(&in[i], &in[i + 1], (nin - i - 1) * sizeof(indev_t));
    nin--;
}

/* (re)scan /dev/input for input devices we don't already hold */
static void scan_input(void)
{
    char path[32], name[80];
    int i;
    for (i = 0; i < 16 && nin < MAXIN; i++) {
        int fd;
        if (have_idx(i)) continue;
        snprintf(path, sizeof(path), "/dev/input/event%d", i);
        fd = open(path, O_RDONLY | O_NONBLOCK);
        if (fd < 0) {
            if (errno != ENOENT) dlog("open %s FAILED errno=%d", path, errno);
            continue;
        }
        name[0] = 0;
        ioctl(fd, EVIOCGNAME(sizeof(name)), name);
        if (is_builtin(name)) { close(fd); continue; }
        /* Read SHARED -- do NOT EVIOCGRAB. This restores the design stated at the
         * top of this file, which a later change quietly broke.
         *
         * An earlier version grabbed here, justified as "hidd holds the input
         * stream when no app has grabbed the device, so a non-grabbing reader
         * sees zero events". That premise is almost certainly a
         * misattribution: the likely observation was zero events while a GAME
         * held the grab, not hidd. Evidence against it -- a game's own grab of
         * the same node succeeds, which is impossible if hidd already held one.
         *
         * The cost of being wrong the other way is severe and was paid in full:
         * EVIOCGRAB is EXCLUSIVE, so while this monitor ran, every other reader
         * got ZERO events with no error -- just silence. A user who opened this
         * panel to check their controller and then launched a game found a dead
         * pad that still enumerated and identified perfectly. That is a
         * system-wide side effect for the sake of a diagnostic indicator, and no
         * amount of lifecycle gating makes it safe: any missed teardown, orphaned
         * process or lost focus event leaves a controller silently broken.
         *
         * Escape hatch for diagnosis only: USBDEVMON_GRAB=1 restores the grab.
         * If the "input received" indicator ever stops working without it, that
         * means the old premise was right after all -- fix it some other way
         * (e.g. grab only while the panel is genuinely frontmost AND release on
         * every teardown path), do not just turn this back on. */
        {
            const char *g = getenv("USBDEVMON_GRAB");
            if (g && *g == '1') { int one = 1; ioctl(fd, EVIOCGRAB, &one); }
        }
        in[nin].idx = i;
        in[nin].fd = fd;
        snprintf(in[nin].name, sizeof(in[nin].name), "%s", name[0] ? name : "input device");
        in[nin].type = classify(fd);
        in[nin].last_active = 0;
        dlog("ADD event%d fd=%d '%s' %s (nin=%d)", i, fd, in[nin].name, in[nin].type, nin + 1);
        nin++;
    }
}

/* ---- unconfigured USB devices ("needs power") ---- */
/* USB devices that are DETECTED but not (yet) producing an input node. On this
 * TouchPad the HID interrupt endpoint frequently wedges: the device enumerates
 * and configures within ~1s but never gets an eventN, so waiting on the input
 * node leaves the list empty for a long time. We surface these fast -- gray
 * "connecting", escalating to "no input" (a Reset-USB hint) if the input node
 * never shows -- rather than showing nothing. (Contrast USB storage, which uses
 * BULK endpoints and comes up fine; only INTERRUPT-driven HID pads wedge here.) */
#define CONNECTING_MS 4000       /* detected this long with no input node -> "noinput" */
typedef struct {
    char sysdir[16];             /* e.g. "1-1" -- stable identity across scans */
    char name[80];
    int  configured;
    int  is_hid;                 /* HID iface present: expected to make an input node */
    int  is_storage;             /* mass-storage iface: never makes one; don't flag */
    int  seen;                   /* set each scan; unseen entries are dropped */
    long first_seen;             /* ms, for connecting -> noinput escalation */
} pending_t;
static pending_t np[MAXNP];
static int nnp = 0;

static void read_trim(const char *path, char *buf, int n)
{
    int fd, r; char *p;
    buf[0] = 0;
    fd = open(path, O_RDONLY);
    if (fd < 0) return;
    r = read(fd, buf, n - 1);
    close(fd);
    if (r < 0) r = 0;
    buf[r] = 0;
    for (p = buf + r - 1; p >= buf && (*p == '\n' || *p == '\r' || *p == ' '); p--) *p = 0;
}

/* Walk a USB device's interface dirs (<base>/<sysdir>:i.j/) and report:
 *   has_input -- usbhid bound (an "input" subdir exists)
 *   is_hid    -- any interface is class 03 (HID: SHOULD produce an input node;
 *                if it doesn't, that's the wedge worth flagging "no input")
 *   is_storage-- any interface is class 08 (mass storage: NEVER produces an
 *                input node; the USB Storage section handles it -- must NOT be
 *                escalated to "no input -> Reset USB", which would tell the
 *                user to reset a perfectly healthy drive) */
static void usb_ifaces(const char *base, int *has_input, int *is_hid, int *is_storage)
{
    DIR *d;
    struct dirent *e;
    *has_input = 0; *is_hid = 0; *is_storage = 0;
    d = opendir(base);
    if (!d) return;
    while ((e = readdir(d))) {
        char p[256], cls[8];
        if (!strchr(e->d_name, ':')) continue;      /* interface dirs contain ':' */
        snprintf(p, sizeof(p), "%s/%s/input", base, e->d_name);
        if (access(p, F_OK) == 0) *has_input = 1;
        snprintf(p, sizeof(p), "%s/%s/bInterfaceClass", base, e->d_name);
        read_trim(p, cls, sizeof(cls));
        if (!strcmp(cls, "03")) *is_hid = 1;
        if (!strcmp(cls, "08")) *is_storage = 1;
    }
    closedir(d);
}

static int np_find(const char *sysdir)
{
    int i;
    for (i = 0; i < nnp; i++) if (!strcmp(np[i].sysdir, sysdir)) return i;
    return -1;
}
static void np_drop(int i)
{
    if (i < nnp - 1) memmove(&np[i], &np[i + 1], (nnp - i - 1) * sizeof(pending_t));
    nnp--;
}

/* Persistent scan of USB devices that don't yet have an input node. Preserves
 * each device's first_seen across calls (so we can escalate connecting->noinput)
 * and drops any that vanished or finally got an input node. */
static void scan_usb_pending(long t)
{
    DIR *d;
    struct dirent *e;
    int i;
    for (i = 0; i < nnp; i++) np[i].seen = 0;
    d = opendir("/sys/bus/usb/devices");
    if (!d) return;
    while ((e = readdir(d))) {
        char base[128], path[192], cv[16], nc[16], name[80];
        int idx, has_input, is_hid, is_storage;
        /* real USB *devices* look like "1-1"; skip root hubs and interfaces */
        if (!strchr(e->d_name, '-') || strchr(e->d_name, ':')) continue;
        snprintf(base, sizeof(base), "/sys/bus/usb/devices/%s", e->d_name);
        usb_ifaces(base, &has_input, &is_hid, &is_storage);
        if (has_input) continue;                    /* shown via /dev/input already */
        snprintf(path, sizeof(path), "%s/bNumConfigurations", base);
        read_trim(path, nc, sizeof(nc));
        if (atoi(nc) < 1) continue;                 /* not a functional device */

        idx = np_find(e->d_name);
        if (idx < 0) {                              /* newly detected */
            if (nnp >= MAXNP) continue;
            idx = nnp++;
            snprintf(np[idx].sysdir, sizeof(np[idx].sysdir), "%s", e->d_name);
            np[idx].first_seen = t;
            snprintf(path, sizeof(path), "%s/product", base);
            read_trim(path, name, sizeof(name));
            if (!name[0]) { snprintf(path, sizeof(path), "%s/manufacturer", base);
                            read_trim(path, name, sizeof(name)); }
            if (!name[0]) snprintf(name, sizeof(name), "USB device");
            snprintf(np[idx].name, sizeof(np[idx].name), "%s", name);
            dlog("PENDING %s '%s' hid=%d storage=%d", e->d_name, np[idx].name, is_hid, is_storage);
        }
        snprintf(path, sizeof(path), "%s/bConfigurationValue", base);
        read_trim(path, cv, sizeof(cv));
        np[idx].configured = (cv[0] && strcmp(cv, "0"));   /* "1".."n" configured */
        np[idx].is_hid = is_hid;
        np[idx].is_storage = is_storage;
        np[idx].seen = 1;
    }
    closedir(d);
    for (i = 0; i < nnp; ) if (!np[i].seen) np_drop(i); else i++;
}

/* ---- JSON output (only when changed) ---- */
static void json_escape(const char *s, char *o, int on)
{
    int j = 0;
    while (*s && j < on - 2) {
        if (*s == '"' || *s == '\\') { o[j++] = '\\'; o[j++] = *s; }
        else if (*s >= 32) o[j++] = *s;
        s++;
    }
    o[j] = 0;
}

static char last_out[2048];
static long last_write = 0;

static void write_devices(long t)
{
    char buf[2048], esc[96];
    int i, len = 0;
    len += snprintf(buf + len, sizeof(buf) - len, "{\"devices\":[");
    for (i = 0; i < nin; i++) {
        int active = in[i].last_active && (t - in[i].last_active) < ACTIVE_MS;
        json_escape(in[i].name, esc, sizeof(esc));
        len += snprintf(buf + len, sizeof(buf) - len,
            "%s{\"name\":\"%s\",\"type\":\"%s\",\"state\":\"ok\",\"active\":%s}",
            (len > 12 ? "," : ""), esc, in[i].type, active ? "true" : "false");
    }
    for (i = 0; i < nnp; i++) {
        /* Storage never produces an input node -- it is simply "detected" (the
         * USB Storage section owns mount actions); flagging it "no input ->
         * Reset USB" would tell users to reset a healthy drive. Only HID-class
         * devices escalate to "noinput" (they SHOULD have made an input node). */
        const char *type  = np[i].is_storage ? "storage" : "generic";
        const char *state = !np[i].configured                      ? "needspower"
                          : np[i].is_storage                       ? "ok"
                          : (t - np[i].first_seen) < CONNECTING_MS ? "connecting"
                          : np[i].is_hid                           ? "noinput"
                          : "ok";
        json_escape(np[i].name, esc, sizeof(esc));
        len += snprintf(buf + len, sizeof(buf) - len,
            "%s{\"name\":\"%s\",\"type\":\"%s\",\"state\":\"%s\",\"active\":false}",
            (len > 12 ? "," : ""), esc, type, state);
    }
    len += snprintf(buf + len, sizeof(buf) - len, "]}");

    /* Write on change, and at least every ~2s otherwise so the file's mtime
     * stays fresh -- getStatus discards a stale list (that's how it knows the
     * monitor stopped when the panel closed), so a running monitor must keep
     * touching it or a resting device would "disappear" from the app. */
    if (!strcmp(buf, last_out) && (t - last_write) < 2000) return;
    strncpy(last_out, buf, sizeof(last_out) - 1);
    last_write = t;
    {
        char tmp[64]; int fd;
        snprintf(tmp, sizeof(tmp), "%s.tmp", OUTFILE);
        fd = open(tmp, O_WRONLY | O_CREAT | O_TRUNC, 0644);
        if (fd >= 0) { write(fd, buf, len); close(fd); rename(tmp, OUTFILE); }
    }
}

/* Record our pid so the watch daemon can stop us WITHOUT walking /proc.
 * That matters: the daemon's teardown sits on its 1 Hz loop, and anything
 * fork-per-process there re-creates the fork storm that used to steal frames
 * from games. /tmp is tmpfs, so this costs no flash. */
#define PIDFILE "/tmp/usbdevmon.pid"

static void write_pidfile(void)
{
    FILE *f = fopen(PIDFILE, "w");
    if (!f) return;
    fprintf(f, "%d\n", (int)getpid());
    fclose(f);
}

int main(void)
{
    long last_scan = 0;
    write_pidfile();
    scan_input();
    scan_usb_pending(now_ms());

    for (;;) {
        struct pollfd pfd[MAXIN];
        int i, np_n, r;
        long t = now_ms();

        if (t - last_scan >= RESCAN_MS) {   /* hotplug: drop vanished, add new */
            last_scan = t;
            /* Drop stale devices. This USB re-enumerates constantly (wedge /
             * host toggles / replugs), often re-using the SAME eventN index for
             * a NEW device -- so access()-by-name can't tell the dead old device
             * from the live new one. A read on the fd is definitive: a removed
             * device returns ENODEV/EIO (not EAGAIN), even though the node name
             * exists. Drop on that (or EOF or node-name-gone) so scan_input then
             * re-opens the fresh node. Any bytes read count as activity so we
             * don't lose a press to this probe. */
            for (i = 0; i < nin; ) {
                struct input_event pev[8];
                int pr = read(in[i].fd, pev, sizeof(pev));
                char p[32];
                if (pr > 0) { in[i].last_active = t; i++; continue; }
                if (pr == 0) { dlog("DROP event%d (EOF)", in[i].idx); drop_in(i); continue; }
                if (errno != EAGAIN && errno != EINTR) {
                    dlog("DROP event%d (read errno=%d)", in[i].idx, errno);
                    drop_in(i); continue;
                }
                snprintf(p, sizeof(p), "/dev/input/event%d", in[i].idx);
                if (access(p, F_OK) != 0) { dlog("DROP event%d (node gone)", in[i].idx); drop_in(i); }
                else i++;
            }
            scan_input();
            scan_usb_pending(t);
        }

        np_n = nin;
        for (i = 0; i < nin; i++) {
            pfd[i].fd = in[i].fd;
            pfd[i].events = POLLIN;
            pfd[i].revents = 0;
        }
        r = poll(np_n ? pfd : NULL, np_n, POLL_MS);
        t = now_ms();
        if (r > 0) {
            for (i = 0; i < nin; i++) {
                if (pfd[i].revents & POLLIN) {
                    struct input_event ev[32];
                    int n = read(in[i].fd, ev, sizeof(ev));
                    if (n > 0) in[i].last_active = t;     /* any traffic = alive */
                } else if (pfd[i].revents & (POLLHUP | POLLERR | POLLNVAL)) {
                    close(in[i].fd); in[i].fd = -1;       /* node died */
                }
            }
            for (i = 0; i < nin; )                        /* compact dead nodes */
                if (in[i].fd < 0) drop_in(i); else i++;
        }
        write_devices(t);
    }
    return 0;
}
