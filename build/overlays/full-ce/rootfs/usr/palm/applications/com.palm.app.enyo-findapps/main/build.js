// lib/analytics/google-analytics.js

function GoogleAnalytics(a) {
function e(a) {
c ? _gaq.push(a) : d.push(a);
}
function f(a, b, c) {
a != undefined && typeof a != c && console.error("GoogleAnalytics#trackEvent: " + b + " must be a " + c + " - event will not be tracked");
}
var b = {}, c = !1, d = [];
return b.accountId = a, b.trackPageview = function(a) {
e([ "_trackPageview", a ]);
}, b.setAccountId = function(a) {
b.accountId = a, e([ "_setAccount", b.accountId ]), e([ "_trackPageview", "/" ]);
}, b.trackEvent = function() {
var a = [ "_trackEvent" ];
a.push.apply(a, arguments), e(a), f(arguments[2], "label", "string"), f(arguments[3], "value", "number");
}, b.setInternetConnection = function(a) {
c = a, c && d.length > 0 && d.forEach(function(a) {
console.log("GoogleAnalytics#setInternetConnection: FLUSHED ITEM [%s, %s]", a[0], a[1]), _gaq.push(a);
});
}, b.hasInternetConnection = function() {
return c;
}, b;
}

// lib/analytics/app-metrics.js

function AppMetrics(a) {
var b = {}, c = new GoogleAnalytics(a);
return b.setInternetConnection = function(a) {
c.setInternetConnection(a);
}, b.setAccountId = function(a) {
c.setAccountId(a);
}, b.trackEvent = function() {
c.trackEvent.apply(c, arguments);
}, b.trackLaunch = function(a) {
c.trackEvent("Launch", "Version", a);
}, b.trackNewScene = function(a) {
c.trackPageview(a);
}, b.trackRegistration = function(a) {
if (!localStorage) return;
var c = localStorage.getItem("com.palm.app.findapps.RegistrationKey");
c != a && (b.trackEvent("Registration", a), localStorage.setItem("com.palm.app.findapps.RegistrationKey", a)), AppMetrics.registrationKey = c;
}, b;
}

AppMetrics.registrationKey = "AppMetrics__Registration";

// lib/analytics/ga/ga.js

(function() {
function M() {
var a = window[b], c = d;
if (a && typeof a.push == "function") {
c = a.constructor == Array;
if (!c) return;
}
window[b] = L, c && L.push.apply(L, a);
}
var a = "_gat", b = "_gaq", c = !0, d = !1, e = undefined, f = "4.6.5", g = "length", h = "cookie", i = "location", j = "&", k = "=", l = "__utma=", m = "__utmb=", n = "__utmc=", o = "__utmk=", p = "__utmv=", q = "__utmz=", r = "__utmx=", s = "GASO=", t = function(a) {
return e == a || "-" == a || "" == a;
}, u = function(a) {
return a[g] > 0 && " \n\r\t".indexOf(a) > -1;
}, v = function(a, b, c) {
var d = "-", e;
return !t(a) && !t(b) && !t(c) && (e = a.indexOf(b), e > -1 && (c = a.indexOf(c, e), c < 0 && (c = a[g]), d = E(a, e + b.indexOf(k) + 1, c))), d;
}, w = function(a) {
var b = d, e = 0, f, h;
if (!t(a)) {
b = c;
for (f = 0; f < a[g]; f++) h = a.charAt(f), e += "." == h ? 1 : 0, b = b && e <= 1 && (0 == f && "-" == h || ".0123456789".indexOf(h) > -1);
}
return b;
}, x = function(a, b) {
var c = encodeURIComponent;
return c instanceof Function ? b ? encodeURI(a) : c(a) : escape(a);
}, y = function(a, b) {
var c = decodeURIComponent, d;
a = a.split("+").join(" ");
if (c instanceof Function) try {
d = b ? decodeURI(a) : c(a);
} catch (e) {
d = unescape(a);
} else d = unescape(a);
return d;
}, z = function(a, b) {
return a.indexOf(b) > -1;
}, A = function(a, b) {
a[a[g]] = b;
}, B = function(a) {
return a.toLowerCase();
}, C = function(a, b) {
return a.split(b);
}, D = function(a, b) {
return a.indexOf(b);
}, E = function(a, b, c) {
return c = e == c ? a[g] : c, a.substring(b, c);
}, F = function(a, b) {
return a.join(b);
}, G = function(a) {
var b = 1, c = 0, d;
if (!t(a)) {
b = 0;
for (d = a[g] - 1; d >= 0; d--) c = a.charCodeAt(d), b = (b << 6 & 268435455) + c + (c << 14), c = b & 266338304, b = c != 0 ? b ^ c >> 21 : b;
}
return b;
}, H = function() {
var a = window, b = e;
return a && a.gaGlobal && a.gaGlobal.hid ? b = a.gaGlobal.hid : (b = I(), a.gaGlobal = a.gaGlobal ? a.gaGlobal : {}, a.gaGlobal.hid = b), b;
}, I = function() {
return Math.round(Math.random() * 2147483647);
}, J = {
Ha: function(a, b) {
this.bb = a, this.nb = b;
},
ib: d,
_gasoDomain: e,
_gasoCPath: e
};
J.Gb = function() {
function a(a) {
return new f(a[0], a[1]);
}
function b(b) {
var c = [];
b = b.split(",");
var d;
for (d = 0; d < b.length; ++d) c.push(a(b[d].split(":")));
return c;
}
var c = this, f = J.Ha;
c.Ia = "utm_campaign", c.Ja = "utm_content", c.Ka = "utm_id", c.La = "utm_medium", c.Ma = "utm_nooverride", c.Na = "utm_source", c.Oa = "utm_term", c.Pa = "gclid", c.ba = 0, c.z = 0, c.Ta = 15768e6, c.sb = 18e5, c.v = 63072e6, c.ta = [], c.va = [], c.nc = "cse", c.oc = "q", c.ob = 5, c.T = b("daum:q,eniro:search_word,naver:query,images.google:q,google:q,yahoo:p,msn:q,bing:q,aol:query,aol:encquery,lycos:query,ask:q,altavista:q,netscape:query,cnn:query,about:terms,mamma:query,alltheweb:q,voila:rdata,virgilio:qs,live:q,baidu:wd,alice:qs,yandex:text,najdi:q,aol:q,mama:query,seznam:q,search:q,wp:szukaj,onet:qt,szukacz:q,yam:k,pchome:q,kvasir:q,sesam:q,ozu:q,terra:query,mynet:q,ekolay:q,rambler:words"), c.t = e, c.lb = d, c.h = "/", c.U = 100, c.oa = "/__utm.gif", c.ga = 1, c.ha = 1, c.u = "|", c.fa = 1, c.da = 1, c.Ra = 1, c.b = "auto", c.I = 1, c.ra = 1e3, c.Jc = 10, c.Pb = 10, c.Kc = .2, c.o = e, c.a = document, c.e = window;
}, J.Hb = function(a) {
function b(a, b, c, d) {
var e = "", f = 0;
e = v(a, "2" + b, ";");
if (!t(e)) {
a = e.indexOf("^" + c + ".");
if (a < 0) return [ "", 0 ];
e = E(e, a + c[g] + 2), e.indexOf("^") > 0 && (e = e.split("^")[0]), c = e.split(":"), e = c[1], f = parseInt(c[0], 10), !d && f < i.r && (e = "");
}
return t(e) && (e = ""), [ e, f ];
}
function d(a, b) {
return "^" + F([ [ b, a[1] ].join("."), a[0] ], ":");
}
function e(a, b) {
j.a[h] = a + "; path=" + j.h + "; " + b + i.fb();
}
function f(a) {
var b = new Date;
return a = new Date(b.getTime() + a), "expires=" + a.toGMTString() + "; ";
}
var i = this, j = a;
i.r = (new Date).getTime();
var k = [ l, m, n, q, p, r, s ];
i.k = function() {
var a = j.a[h];
return j.o ? i.Wb(a, j.o) : a;
}, i.Wb = function(a, c) {
var d = [], e, f;
for (e = 0; e < k[g]; e++) f = b(a, k[e], c)[0], t(f) || (d[d[g]] = k[e] + f + ";");
return d.join("");
}, i.l = function(a, b, c) {
var d = c > 0 ? f(c) : "";
j.o && (b = i.kc(j.a[h], a, j.o, b, c), a = "2" + a, d = c > 0 ? f(j.v) : ""), e(a + b, d);
}, i.kc = function(a, e, f, g, h) {
var k = "";
return h = h || j.v, g = d([ g, i.r + h * 1 ], f), k = v(a, "2" + e, ";"), t(k) ? g : (a = d(b(a, e, f, c), f), k = F(k.split(a), ""), k = g + k);
}, i.fb = function() {
return t(j.b) ? "" : "domain=" + j.b + ";";
};
}, J.$ = function(a) {
function b(a) {
return a = a instanceof Array ? a.join(".") : "", t(a) ? "-" : a;
}
function f(a, b) {
var c = [];
if (!t(a)) {
c = a.split(".");
if (b) for (a = 0; a < c[g]; a++) w(c[a]) || (c[a] = "-");
}
return c;
}
function h(a, b, c) {
var d = C.M, e, f;
for (e = 0; e < d[g]; e++) f = d[e][0], f += t(b) ? b : b + d[e][4], d[e][2](v(a, f, c));
}
var i, k, u, x, y, z, B, C = this, D, E = a;
C.j = new J.Hb(a), C.kb = function() {
return e == D || D == C.P();
}, C.k = function() {
return C.j.k();
}, C.ma = function() {
return y ? y : "-";
}, C.vb = function(a) {
y = a;
}, C.za = function(a) {
D = w(a) ? a * 1 : "-";
}, C.la = function() {
return b(z);
}, C.Aa = function(a) {
z = f(a);
}, C.Vb = function() {
C.j.l(p, "", -1);
}, C.lc = function() {
return D ? D : "-";
}, C.fb = function() {
return t(E.b) ? "" : "domain=" + E.b + ";";
}, C.ja = function() {
return b(i);
}, C.tb = function(a) {
i = f(a, 1);
}, C.C = function() {
return b(k);
}, C.ya = function(a) {
k = f(a, 1);
}, C.ka = function() {
return b(u);
}, C.ub = function(a) {
u = f(a, 1);
}, C.na = function() {
return b(x);
}, C.wb = function(a) {
x = f(a);
for (a = 0; a < x[g]; a++) a < 4 && !w(x[a]) && (x[a] = "-");
}, C.fc = function() {
return B;
}, C.Dc = function(a) {
B = a;
}, C.Sb = function() {
i = [], k = [], u = [], x = [], y = e, z = [], D = e;
}, C.P = function() {
var a = "", b;
for (b = 0; b < C.M[g]; b++) a += C.M[b][1]();
return G(a);
}, C.ua = function(a) {
var b = C.k(), e = d;
return b && (h(b, a, ";"), C.za(C.P()), e = c), e;
}, C.zc = function(a) {
h(a, "", j), C.za(v(a, o, j));
}, C.Hc = function() {
var a = C.M, b = [], c;
for (c = 0; c < a[g]; c++) A(b, a[c][0] + a[c][1]());
return A(b, o + C.P()), b.join(j);
}, C.Nc = function(a, b) {
var c = C.M, d = E.h;
C.ua(a), E.h = b;
for (a = 0; a < c[g]; a++) t(c[a][1]()) || c[a][3]();
E.h = d;
}, C.Cb = function() {
C.j.l(l, C.ja(), E.v);
}, C.Ea = function() {
C.j.l(m, C.C(), E.sb);
}, C.Db = function() {
C.j.l(n, C.ka(), 0);
}, C.Ga = function() {
C.j.l(q, C.na(), E.Ta);
}, C.Eb = function() {
C.j.l(r, C.ma(), E.v);
}, C.Fa = function() {
C.j.l(p, C.la(), E.v);
}, C.Oc = function() {
C.j.l(s, C.fc(), 0);
}, C.M = [ [ l, C.ja, C.tb, C.Cb, "." ], [ m, C.C, C.ya, C.Ea, "" ], [ n, C.ka, C.ub, C.Db, "" ], [ r, C.ma, C.vb, C.Eb, "" ], [ q, C.na, C.wb, C.Ga, "." ], [ p, C.la, C.Aa, C.Fa, "." ] ];
}, J.Kb = function(a) {
var b = this, c = a, d = new J.$(c), e = function() {}, h = function(a) {
var b = (new Date).getTime(), d;
return d = (b - a[3]) * (c.Kc / 1e3), d >= 1 && (a[2] = Math.min(Math.floor(a[2] * 1 + d), c.Pb), a[3] = b), a;
};
b.H = function(a, g, j, k, l, m) {
var n, o = c.I, p = c.a[i];
d.ua(j), n = C(d.C(), ".");
if (n[1] < 500 || k) {
l && (n = h(n));
if (k || !l || n[2] >= 1) {
!k && l && (n[2] = n[2] * 1 - 1), n[1] = n[1] * 1 + 1, a = "?utmwv=" + f + "&utmn=" + I() + (t(p.hostname) ? "" : "&utmhn=" + x(p.hostname)) + (c.U == 100 ? "" : "&utmsp=" + x(c.U)) + a;
if (0 == o || 2 == o) k = 2 == o ? e : m || e, b.$a(c.oa + a, k);
if (1 == o || 2 == o) a = ("https:" == p.protocol ? "https://ssl.google-analytics.com/__utm.gif" : "http://www.google-analytics.com/__utm.gif") + a + "&utmac=" + g + "&utmcc=" + b.ac(j), K && (a += "&gaq=1"), b.$a(a, m);
}
}
d.ya(n.join(".")), d.Ea();
}, b.$a = function(a, b) {
var c = new Image(1, 1);
c.src = a, c.onload = function() {
c.onload = null, (b || e)();
};
}, b.ac = function(a) {
var b = [], c = [ l, q, p, r ], e, f = d.k(), h;
for (e = 0; e < c[g]; e++) {
h = v(f, c[e] + a, ";");
if (!t(h)) {
if (c[e] == p) {
h = C(h.split(a + ".")[1], "|")[0];
if (t(h)) continue;
h = a + "." + h;
}
A(b, c[e] + h + ";");
}
}
return x(b.join("+"));
};
}, J.n = function() {
var a = this;
a.Y = [], a.hb = function(b) {
var c, d = a.Y, e;
for (e = 0; e < d.length; e++) c = b == d[e].q ? d[e] : c;
return c;
}, a.Ob = function(b, c, d, f, g, h, i, j) {
var k = a.hb(b);
return e == k ? (k = new J.n.Mb(b, c, d, f, g, h, i, j), A(a.Y, k)) : (k.Qa = c, k.Ab = d, k.zb = f, k.xb = g, k.Xa = h, k.yb = i, k.Za = j), k;
};
}, J.n.Lb = function(a, b, c, d, e, f) {
var g = this;
g.Bb = a, g.Ba = b, g.D = c, g.Va = d, g.pb = e, g.qb = f, g.Ca = function() {
return "&" + [ "utmt=item", "tid=" + x(g.Bb), "ipc=" + x(g.Ba), "ipn=" + x(g.D), "iva=" + x(g.Va), "ipr=" + x(g.pb), "iqt=" + x(g.qb) ].join("&utm");
};
}, J.n.Mb = function(a, b, c, d, f, g, h, i) {
var j = this;
j.q = a, j.Qa = b, j.Ab = c, j.zb = d, j.xb = f, j.Xa = g, j.yb = h, j.Za = i, j.R = [], j.Nb = function(a, b, c, d, f) {
var g = j.gc(a), h = j.q;
e == g ? A(j.R, new J.n.Lb(h, a, b, c, d, f)) : (g.Bb = h, g.Ba = a, g.D = b, g.Va = c, g.pb = d, g.qb = f);
}, j.gc = function(a) {
var b, c = j.R, d;
for (d = 0; d < c.length; d++) b = a == c[d].Ba ? c[d] : b;
return b;
}, j.Ca = function() {
return "&" + [ "utmt=tran", "id=" + x(j.q), "st=" + x(j.Qa), "to=" + x(j.Ab), "tx=" + x(j.zb), "sp=" + x(j.xb), "ci=" + x(j.Xa), "rg=" + x(j.yb), "co=" + x(j.Za) ].join("&utmt");
};
}, J.Fb = function(a) {
function b() {
var a, b, c;
b = "ShockwaveFlash";
var d = "$version", h = f.d ? f.d.plugins : e;
if (h && h[g] > 0) for (a = 0; a < h[g] && !c; a++) b = h[a], z(b.name, "Shockwave Flash") && (c = b.description.split("Shockwave Flash ")[1]); else {
b = b + "." + b;
try {
a = new ActiveXObject(b + ".7"), c = a.GetVariable(d);
} catch (j) {}
if (!c) try {
a = new ActiveXObject(b + ".6"), c = "WIN 6,0,21,0", a.AllowScriptAccess = "always", c = a.GetVariable(d);
} catch (k) {}
if (!c) try {
a = new ActiveXObject(b), c = a.GetVariable(d);
} catch (l) {}
c && (c = C(c.split(" ")[1], ","), c = c[0] + "." + c[1] + " r" + c[2]);
}
return c ? c : i;
}
var c = a, d = c.e, f = this, i = "-";
f.V = d.screen, f.Sa = !f.V && d.java ? java.awt.Toolkit.getDefaultToolkit() : e, f.d = d.navigator, f.W = i, f.xa = i, f.Wa = i, f.qa = i, f.pa = 1, f.eb = i, f.bc = function() {
var a;
if (d.screen) f.W = f.V.width + "x" + f.V.height, f.xa = f.V.colorDepth + "-bit"; else if (f.Sa) try {
a = f.Sa.getScreenSize(), f.W = a.width + "x" + a.height;
} catch (e) {}
f.qa = B(f.d && f.d.language ? f.d.language : f.d && f.d.browserLanguage ? f.d.browserLanguage : i), f.pa = f.d && f.d.javaEnabled() ? 1 : 0, f.eb = c.ha ? b() : i, f.Wa = x(c.a.characterSet ? c.a.characterSet : c.a.charset ? c.a.charset : i);
}, f.Ic = function() {
return j + "utm" + [ "cs=" + x(f.Wa), "sr=" + f.W, "sc=" + f.xa, "ul=" + f.qa, "je=" + f.pa, "fl=" + x(f.eb) ].join("&utm");
}, f.$b = function() {
var a = c.a, b = d.history[g];
a = f.d.appName + f.d.version + f.qa + f.d.platform + f.d.userAgent + f.pa + f.W + f.xa + (a[h] ? a[h] : "") + (a.referrer ? a.referrer : "");
for (var e = a[g]; b > 0; ) a += b-- ^ e++;
return G(a);
};
}, J.m = function(a, b, f, h) {
function m(a) {
var b = "";
return a = B(a.split("://")[1]), z(a, "/") && (a = a.split("/")[1], z(a, "?") && (b = a.split("?")[0])), b;
}
function n(a) {
var b = "";
return b = B(a.split("://")[1]), z(b, "/") && (b = b.split("/")[0]), b;
}
var o = h, p = this;
p.c = a, p.rb = b, p.r = f, p.ic = function(a) {
var b = p.gb();
return new J.m.w(v(a, o.Ka + k, j), v(a, o.Na + k, j), v(a, o.Pa + k, j), p.Q(a, o.Ia, "(not set)"), p.Q(a, o.La, "(not set)"), p.Q(a, o.Oa, b && !t(b.K) ? y(b.K) : e), p.Q(a, o.Ja, e));
}, p.jb = function(a) {
var b = n(a), e = m(a);
if (z(b, "google")) {
a = a.split("?").join(j);
if (z(a, j + o.oc + k) && e == o.nc) return c;
}
return d;
}, p.gb = function() {
var a, b = p.rb, c, d, f = o.T;
if (!(t(b) || "0" == b || !z(b, "://") || p.jb(b))) {
a = n(b);
for (c = 0; c < f[g]; c++) {
d = f[c];
if (z(a, B(d.bb))) {
b = b.split("?").join(j);
if (z(b, j + d.nb + k)) return a = b.split(j + d.nb + k)[1], z(a, j) && (a = a.split(j)[0]), new J.m.w(e, d.bb, e, "(organic)", "organic", a, e);
}
}
}
}, p.Q = function(a, b, c) {
return a = v(a, b + k, j), c = t(a) ? t(c) ? "-" : c : y(a);
}, p.uc = function(a) {
var b = o.ta, c = d, e;
if (a && "organic" == a.S) {
a = B(y(a.K));
for (e = 0; e < b[g]; e++) c = c || B(b[e]) == a;
}
return c;
}, p.hc = function() {
var a = "", b = "";
a = p.rb;
if (!(t(a) || "0" == a || !z(a, "://") || p.jb(a))) return a = a.split("://")[1], z(a, "/") && (b = E(a, a.indexOf("/")), b = b.split("?")[0], a = B(a.split("/")[0])), 0 == a.indexOf("www.") && (a = E(a, 4)), new J.m.w(e, a, e, "(referral)", "referral", e, b);
}, p.Xb = function(a) {
var b = "";
return o.ba && (b = a && a.hash ? a.href.substring(a.href.indexOf("#")) : "", b = "" != b ? b + j : b), b += a.search, b;
}, p.dc = function() {
return new J.m.w(e, "(direct)", e, "(direct)", "(none)", e, e);
}, p.vc = function(a) {
var b = d, c, e = o.va;
if (a && "referral" == a.S) {
a = B(x(a.X));
for (c = 0; c < e[g]; c++) b = b || z(a, B(e[c]));
}
return b;
}, p.L = function(a) {
return e != a && a.mb();
}, p.cc = function(a, b) {
var c = "", d = "-", e, f = 0, g, h, m = p.c;
if (!a) return "";
h = a.k(), c = p.Xb(o.a[i]);
if (o.z && a.kb()) {
d = a.na();
if (!t(d) && !z(d, ";")) return a.Ga(), "";
}
d = v(h, q + m + ".", ";"), e = p.ic(c);
if (p.L(e)) {
c = v(c, o.Ma + k, j);
if ("1" == c && !t(d)) return "";
}
if (!p.L(e)) {
e = p.gb();
if (!t(d) && p.uc(e)) return "";
}
if (!p.L(e) && b) {
e = p.hc();
if (!t(d) && p.vc(e)) return "";
}
return p.L(e) || t(d) && b && (e = p.dc()), p.L(e) ? (t(d) || (f = d.split("."), g = new J.m.w, g.Zb(f.slice(4).join(".")), g = B(g.Da()) == B(e.Da()), f = f[3] * 1), !g || b ? (b = v(h, l + m + ".", ";"), h = b.lastIndexOf("."), b = h > 9 ? E(b, h + 1) * 1 : 0, f++, b = 0 == b ? 1 : b, a.wb([ m, p.r, b, f, e.Da() ].join(".")), a.Ga(), j + "utmcn=1") : j + "utmcr=1") : "";
};
}, J.m.w = function(a, b, c, d, e, f, h) {
var i = this;
i.q = a, i.X = b, i.ea = c, i.D = d, i.S = e, i.K = f, i.Ya = h, i.Da = function() {
var a = [], b = [ [ "cid", i.q ], [ "csr", i.X ], [ "gclid", i.ea ], [ "ccn", i.D ], [ "cmd", i.S ], [ "ctr", i.K ], [ "cct", i.Ya ] ], c, d;
if (i.mb()) for (c = 0; c < b[g]; c++) t(b[c][1]) || (d = b[c][1].split("+").join("%20"), d = d.split(" ").join("%20"), A(a, "utm" + b[c][0] + k + d));
return a.join("|");
}, i.mb = function() {
return !(t(i.q) && t(i.X) && t(i.ea));
}, i.Zb = function(a) {
var b = function(b) {
return y(v(a, "utm" + b + k, "|"));
};
i.q = b("cid"), i.X = b("csr"), i.ea = b("gclid"), i.D = b("ccn"), i.S = b("cmd"), i.K = b("ctr"), i.Ya = b("cct");
};
}, J.Ib = function(a, b, e, f) {
function h(a, b, c) {
var d;
if (!t(c)) {
c = c.split(",");
for (var e = 0; e < c[g]; e++) d = c[e], t(d) || (d = d.split(l), d[g] == 4 && (b[d[0]] = [ d[1], d[2], a ]));
}
}
var i = this, j = b, l = k, m = a, n = f;
i.O = e, i.sa = "", i.p = {}, i.tc = function() {
var a;
a = C(v(i.O.k(), p + j + ".", ";"), j + ".")[1], t(a) || (a = a.split("|"), h(1, i.p, a[1]), i.sa = a[0], i.Z());
}, i.Z = function() {
i.Qb();
var a = i.sa, b, c, d = "";
for (b in i.p) (c = i.p[b]) && 1 === c[2] && (d += b + l + c[0] + l + c[1] + l + 1 + ",");
t(d) || (a += "|" + d), t(a) ? i.O.Vb() : (i.O.Aa(j + "." + a), i.O.Fa());
}, i.Ec = function(a) {
i.sa = a, i.Z();
}, i.Cc = function(a, b, e, f) {
1 != f && 2 != f && 3 != f && (f = 3);
var h = d;
return b && e && a > 0 && a <= m.ob && (b = x(b), e = x(e), b[g] + e[g] <= 64 && (i.p[a] = [ b, e, f ], i.Z(), h = c)), h;
}, i.mc = function(a) {
if ((a = i.p[a]) && 1 === a[2]) return a[1];
}, i.Ub = function(a) {
var b = i.p;
b[a] && (delete b[a], i.Z());
}, i.Qb = function() {
n._clearKey(8), n._clearKey(9), n._clearKey(11);
var a = i.p, b, c;
for (c in a) if (b = a[c]) n._setKey(8, c, b[0]), n._setKey(9, c, b[1]), (b = b[2]) && 3 != b && n._setKey(11, c, "" + b);
};
}, J.N = function() {
function a(a, b, c, d) {
e == k[a] && (k[a] = {}), e == k[a][b] && (k[a][b] = []), k[a][b][c] = d;
}
function b(a, b) {
if (e != k[a] && e != k[a][b]) {
k[a][b] = e, b = c;
var f;
for (f = 0; f < n[g]; f++) if (e != k[a][n[f]]) {
b = d;
break;
}
b && (k[a] = e);
}
}
function f(a) {
var b = "", f = d, i, j;
for (i = 0; i < n[g]; i++) j = a[n[i]], e != j ? (f && (b += n[i]), b += h(j), f = d) : f = c;
return b;
}
function h(a) {
var b = [], c, d;
for (d = 0; d < a[g]; d++) e != a[d] && (c = "", d != u && e == a[d - 1] && (c += d + "" + r), c += i(a[d]), A(b, c));
return o + b.join(q) + p;
}
function i(a) {
var b = "", c, d, f;
for (c = 0; c < a[g]; c++) d = a.charAt(c), f = t[d], b += e != f ? f : d;
return b;
}
var j = this, k = {}, l = "k", m = "v", n = [ l, m ], o = "(", p = ")", q = "*", r = "!", s = "'", t = {};
t[s] = "'0", t[p] = "'1", t[q] = "'2", t[r] = "'3";
var u = 1;
j.qc = function(a) {
return e != k[a];
}, j.G = function() {
var a = "", b;
for (b in k) e != k[b] && (a += b + "" + f(k[b]));
return a;
}, j.Ac = function(a) {
if (a == e) return j.G();
var b = a.G(), c;
for (c in k) e != k[c] && !a.qc(c) && (b += c + "" + f(k[c]));
return b;
}, j._setKey = function(b, e, f) {
return typeof f != "string" ? d : (a(b, l, e, f), c);
}, j._setValue = function(b, f, g) {
return (typeof g == "number" || e != Number && g instanceof Number) && Math.round(g) == g && g != NaN && g != Infinity ? (a(b, m, f, g + ""), c) : d;
}, j._getKey = function(a, b) {
return e != k[a] && e != k[a][l] ? k[a][l][b] : e;
}, j._getValue = function(a, b) {
return e != k[a] && e != k[a][m] ? k[a][m][b] : e;
}, j._clearKey = function(a) {
b(a, l);
}, j._clearValue = function(a) {
b(a, m);
};
}, J.Jb = function(a, b) {
var c = this;
c.Qc = b, c.xc = a, c._trackEvent = function(a, d, e) {
return b._trackEvent(c.xc, a, d, e);
};
}, J.aa = function(a, b) {
function h() {
if ("auto" == M.b) {
var a = M.a.domain;
"www." == E(a, 0, 4) && (a = E(a, 4)), M.b = a;
}
M.b = B(M.b);
}
function k() {
var a = M.b, b = a.indexOf("www.google.") * a.indexOf(".google.") * a.indexOf("google.");
return b || "/" != M.h || a.indexOf("google.org") > -1;
}
function o(a, b, c) {
return t(a) || t(b) || t(c) ? "-" : (a = v(a, l + K.c + ".", b), t(a) || (a = a.split("."), a[5] = a[5] ? a[5] * 1 + 1 : 1, a[3] = a[4], a[4] = c, a = a.join(".")), a);
}
function p() {
return !0;
}
function q(a) {
if (!a || "" == a) return "";
for (; u(a.charAt(0)); ) a = E(a, 1);
for (; u(a.charAt(a[g] - 1)); ) a = E(a, 0, a[g] - 1);
return a;
}
function r(a, b, c, d) {
t(a()) || (b(d ? y(a()) : a()), z(a(), ";") || c());
}
function w(a) {
var b, c = "" != a && M.a[i].host != a;
if (c) for (b = 0; b < M.t[g]; b++) c = c && D(B(a), B(M.t[b])) == -1;
return c;
}
var K = this, L = e, M = new J.Gb, Q = d, R = e;
K.e = window, K.r = Math.round((new Date).getTime() / 1e3), K.s = a || "UA-XXXXX-X", K.ab = M.a.referrer, K.ia = e, K.f = e, K.B = e, K.F = d, K.A = e, K.Ua = "", K.g = e, K.cb = e, K.c = e, K.i = e, M.o = b ? x(b) : e, K.wc = function() {
var a = d;
return K.B && (a = K.B.match(/^[0-9a-z-_.]{10,1200}$/i)), a;
}, K.jc = function() {
return I() ^ K.A.$b() & 2147483647;
}, K.ec = function() {
return !M.b || "" == M.b || "none" == M.b ? (M.b = "", 1) : (h(), M.Ra ? G(M.b) : 1);
}, K.Yb = function(a, b) {
return t(a) ? a = "-" : (b += M.h && "/" != M.h ? M.h : "", b = a.indexOf(b), a = b >= 0 && b <= 8 ? "0" : "[" == a.charAt(0) && "]" == a.charAt(a[g] - 1) ? "-" : a), a;
}, K.wa = function(a) {
var b = "", c = M.a;
return b += M.fa ? K.A.Ic() : "", b += M.da ? K.Ua : "", b += M.ga && !t(c.title) ? "&utmdt=" + x(c.title) : "", b += "&utmhid=" + H() + "&utmr=" + x(K.ia) + "&utmp=" + x(K.Bc(a)), b;
}, K.Bc = function(a) {
var b = M.a[i];
return a = e != a && "" != a ? x(a, c) : x(b.pathname + b.search, c);
}, K.Lc = function(a) {
if (K.J()) {
var b = "";
K.g != e && K.g.G()[g] > 0 && (b += "&utme=" + x(K.g.G())), b += K.wa(a), L.H(b, K.s, K.c);
}
}, K.Tb = function() {
var a = new J.$(M);
return a.ua(K.c) ? a.Hc() : e;
}, K._getLinkerUrl = function(a, b) {
var c = a.split("#"), d = a, e = K.Tb();
if (e) if (b && 1 >= c[g]) d += "#" + e; else if (!b || 1 >= c[g]) 1 >= c[g] ? d += (z(a, "?") ? j : "?") + e : d = c[0] + (z(a, "?") ? j : "?") + e + "#" + c[1];
return d;
}, K.Fc = function() {
var a;
K.wc() && (K.i.Dc(K.B), K.i.Oc(), J._gasoDomain = M.b, J._gasoCPath = M.h, a = M.a.createElement("script"), a.type = "text/javascript", a.id = "_gasojs", a.src = "https://www.google.com/analytics/reporting/overlay_js?gaso=" + K.B + j + I(), M.a.getElementsByTagName("head")[0].appendChild(a));
}, K.pc = function() {
var a = K.r, b = K.i, f = b.k(), g = K.c + "", h = M.e, k = h ? h.gaGlobal : e, p, q = z(f, l + g + "."), s = z(f, m + g), u = z(f, n + g), w, x = [], y = "", A = d;
f = t(f) ? "" : f, M.z && (p = M.a[i] && M.a[i].hash ? M.a[i].href.substring(M.a[i].href.indexOf("#")) : "", M.ba && !t(p) && (y = p + j), y += M.a[i].search, !t(y) && z(y, l) && (b.zc(y), b.kb() || b.Sb(), w = b.ja()), r(b.ma, b.vb, b.Eb, !0), r(b.la, b.Aa, b.Fa)), t(w) ? q ? !s || !u ? (w = o(f, ";", a), K.F = c) : (w = v(f, l + g + ".", ";"), x = C(v(f, m + g, ";"), ".")) : (w = F([ g, K.jc(), a, a, a, 1 ], "."), A = K.F = c) : t(b.C()) || t(b.ka()) ? (w = o(y, j, a), K.F = c) : (x = C(b.C(), "."), g = x[0]), w = w.split("."), h && k && k.dh == g && !M.o && (w[4] = k.sid ? k.sid : w[4], A && (w[3] = k.sid ? k.sid : w[4], k.vid && (a = k.vid.split("."), w[1] = a[0], w[2] = a[1]))), b.tb(w.join(".")), x[0] = g, x[1] = x[1] ? x[1] : 0, x[2] = e != x[2] ? x[2] : M.Jc, x[3] = x[3] ? x[3] : w[4], b.ya(x.join(".")), b.ub(g), t(b.lc()) || b.za(b.P()), b.Cb(), b.Ea(), b.Db();
}, K.rc = function() {
L = new J.Kb(M);
}, K._initData = function() {
var a;
Q || (K.A || (K.A = new J.Fb(M), K.A.bc()), K.c = K.ec(), K.i = new J.$(M), K.g = new J.N, R = new J.Ib(M, K.c, K.i, K.g), K.rc()), p() && (K.pc(), R.tc()), Q || (p() && (K.ia = K.Yb(K.ab, M.a.domain), M.da && (a = new J.m(K.c, K.ia, K.r, M), K.Ua = a.cc(K.i, K.F))), K.cb = new J.N, Q = c), J.ib || K.sc();
}, K._visitCode = function() {
K._initData();
var a = v(K.i.k(), l + K.c + ".", ";");
return a = a.split("."), a[g] < 4 ? "" : a[1];
}, K._cookiePathCopy = function(a) {
K._initData(), K.i && K.i.Nc(K.c, a);
}, K.sc = function() {
var a = M.a[i].hash;
a && 1 == a.indexOf("gaso=") ? a = v(a, "gaso=", j) : a = (a = M.e.name) && 0 <= a.indexOf("gaso=") ? v(a, "gaso=", j) : v(K.i.k(), s, ";"), a[g] >= 10 && (K.B = a, K.Fc()), J.ib = c;
}, K.J = function() {
return K._visitCode() % 1e4 < M.U * 100;
}, K.Gc = function() {
var a, b, e = M.a.links;
M.lb || (a = M.a.domain, "www." == E(a, 0, 4) && (a = E(a, 4)), M.t.push("." + a));
for (a = 0; a < e[g] && (M.ra == -1 || a < M.ra); a++) b = e[a], w(b.host) && (b.gatcOnclick || (b.gatcOnclick = b.onclick ? b.onclick : K.yc, b.onclick = function(a) {
var b = !this.target || this.target == "_self" || this.target == "_top" || this.target == "_parent";
return b = b && !K.Rb(a), K.Mc(a, this, b), b ? d : this.gatcOnclick ? this.gatcOnclick(a) : c;
}));
}, K.yc = function() {}, K._trackPageview = function(a) {
p() && (K._initData(), M.t && K.Gc(), K.Lc(a), K.F = d);
}, K._trackTrans = function() {
var a = K.c, b = [], d, e, f;
K._initData();
if (K.f && K.J()) {
for (d = 0; d < K.f.Y[g]; d++) {
e = K.f.Y[d], A(b, e.Ca());
for (f = 0; f < e.R[g]; f++) A(b, e.R[f].Ca());
}
for (d = 0; d < b[g]; d++) L.H(b[d], K.s, a, c);
}
}, K._setTrans = function() {
var a = M.a, b, c, d;
a = a.getElementById ? a.getElementById("utmtrans") : a.utmform && a.utmform.utmtrans ? a.utmform.utmtrans : e, K._initData();
if (a && a.value) {
K.f = new J.n, d = a.value.split("UTM:"), M.u = !M.u || "" == M.u ? "|" : M.u;
for (a = 0; a < d[g]; a++) {
d[a] = q(d[a]), b = d[a].split(M.u);
for (c = 0; c < b[g]; c++) b[c] = q(b[c]);
"T" == b[0] ? K._addTrans(b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[8]) : "I" == b[0] && K._addItem(b[1], b[2], b[3], b[4], b[5], b[6]);
}
}
}, K._addTrans = function(a, b, c, d, e, f, g, h) {
return K.f = K.f ? K.f : new J.n, K.f.Ob(a, b, c, d, e, f, g, h);
}, K._addItem = function(a, b, c, d, e, f) {
var g;
K.f = K.f ? K.f : new J.n, (g = K.f.hb(a)) || (g = K._addTrans(a, "", "", "", "", "", "", "")), g.Nb(b, c, d, e, f);
}, K._setVar = function(a) {
a && "" != a && k() && (K._initData(), R.Ec(x(a)), K.J() && L.H("&utmt=var", K.s, K.c));
}, K._setCustomVar = function(a, b, c, d) {
return K._initData(), R.Cc(a, b, c, d);
}, K._deleteCustomVar = function(a) {
K._initData(), R.Ub(a);
}, K._getVisitorCustomVar = function(a) {
return K._initData(), R.mc(a);
}, K._setMaxCustomVariables = function(a) {
M.ob = a;
}, K._link = function(a, b) {
M.z && a && (K._initData(), M.a[i].href = K._getLinkerUrl(a, b));
}, K._linkByPost = function(a, b) {
M.z && a && a.action && (K._initData(), a.action = K._getLinkerUrl(a.action, b));
}, K._setXKey = function(a, b, c) {
K.g._setKey(a, b, c);
}, K._setXValue = function(a, b, c) {
K.g._setValue(a, b, c);
}, K._getXKey = function(a, b) {
return K.g._getKey(a, b);
}, K._getXValue = function(a, b) {
return K.g.getValue(a, b);
}, K._clearXKey = function(a) {
K.g._clearKey(a);
}, K._clearXValue = function(a) {
K.g._clearValue(a);
}, K._createXObj = function() {
return K._initData(), new J.N;
}, K._sendXEvent = function(a) {
var b = "";
K._initData(), K.J() && (b += "&utmt=event&utme=" + x(K.g.Ac(a)) + K.wa(), L.H(b, K.s, K.c, d, c));
}, K._createEventTracker = function(a) {
return K._initData(), new J.Jb(a, K);
}, K._trackEvent = function(a, b, c, f) {
var g = K.cb;
return e != a && e != b && "" != a && "" != b ? (g._clearKey(5), g._clearValue(5), (a = g._setKey(5, 1, a) && g._setKey(5, 2, b) && (e == c || g._setKey(5, 3, c)) && (e == f || g._setValue(5, 1, f))) && K._sendXEvent(g)) : a = d, a;
}, K.Mc = function(a, b, f) {
K._initData();
if (K.J()) {
var g = new J.N;
g._setKey(6, 1, b.href);
var h = f ? function() {
K.db(a, b);
} : e;
L.H("&utmt=event&utme=" + x(g.G()) + K.wa(), K.s, K.c, d, c, h);
if (f) {
var i = this;
M.e.setTimeout(function() {
i.db(a, b);
}, 500);
}
}
}, K.db = function(a, b) {
a || (a = M.e.event);
var d = c;
b.gatcOnclick && (d = b.gatcOnclick(a));
if (d || typeof d == "undefined") !b.target || b.target == "_self" ? M.e[i] = b.href : b.target == "_top" ? M.e.top.document[i] = b.href : b.target == "_parent" && (M.e.parent.document[i] = b.href);
}, K.Rb = function(a) {
a || (a = M.e.event);
var b = a.shiftKey || a.ctrlKey || a.altKey;
return b || a.modifiers && M.e.Event && (b = a.modifiers & M.e.Event.CONTROL_MASK || a.modifiers & M.e.Event.SHIFT_MASK || a.modifiers & M.e.Event.ALT_MASK), b;
}, K.Pc = function() {
return M;
}, K._setDomainName = function(a) {
M.b = a;
}, K._addOrganic = function(a, b, c) {
M.T.splice(c ? 0 : M.T.length, 0, new J.Ha(a, b));
}, K._clearOrganic = function() {
M.T = [];
}, K._addIgnoredOrganic = function(a) {
A(M.ta, a);
}, K._clearIgnoredOrganic = function() {
M.ta = [];
}, K._addIgnoredRef = function(a) {
A(M.va, a);
}, K._clearIgnoredRef = function() {
M.va = [];
}, K._setAllowHash = function(a) {
M.Ra = a ? 1 : 0;
}, K._setCampaignTrack = function(a) {
M.da = a ? 1 : 0;
}, K._setClientInfo = function(a) {
M.fa = a ? 1 : 0;
}, K._getClientInfo = function() {
return M.fa;
}, K._setCookiePath = function(a) {
M.h = a;
}, K._setTransactionDelim = function(a) {
M.u = a;
}, K._setCookieTimeout = function(a) {
K._setCampaignCookieTimeout(a * 1e3);
}, K._setCampaignCookieTimeout = function(a) {
M.Ta = a;
}, K._setDetectFlash = function(a) {
M.ha = a ? 1 : 0;
}, K._getDetectFlash = function() {
return M.ha;
}, K._setDetectTitle = function(a) {
M.ga = a ? 1 : 0;
}, K._getDetectTitle = function() {
return M.ga;
}, K._setLocalGifPath = function(a) {
M.oa = a;
}, K._getLocalGifPath = function() {
return M.oa;
}, K._setLocalServerMode = function() {
M.I = 0;
}, K._setRemoteServerMode = function() {
M.I = 1;
}, K._setLocalRemoteServerMode = function() {
M.I = 2;
}, K._getServiceMode = function() {
return M.I;
}, K._setSampleRate = function(a) {
M.U = a;
}, K._setSessionTimeout = function(a) {
K._setSessionCookieTimeout(a * 1e3);
}, K._setSessionCookieTimeout = function(a) {
M.sb = a;
}, K._setAllowLinker = function(a) {
M.z = a ? 1 : 0;
}, K._setAllowAnchor = function(a) {
M.ba = a ? 1 : 0;
}, K._setCampNameKey = function(a) {
M.Ia = a;
}, K._setCampContentKey = function(a) {
M.Ja = a;
}, K._setCampIdKey = function(a) {
M.Ka = a;
}, K._setCampMediumKey = function(a) {
M.La = a;
}, K._setCampNOKey = function(a) {
M.Ma = a;
}, K._setCampSourceKey = function(a) {
M.Na = a;
}, K._setCampTermKey = function(a) {
M.Oa = a;
}, K._setCampCIdKey = function(a) {
M.Pa = a;
}, K._getAccount = function() {
return K.s;
}, K._setAccount = function(a) {
K.s = a;
}, K._setNamespace = function(a) {
M.o = a ? x(a) : e;
}, K._getVersion = function() {
return f;
}, K._setAutoTrackOutbound = function(a) {
M.t = [], a && (M.t = a);
}, K._setTrackOutboundSubdomains = function(a) {
M.lb = a;
}, K._setHrefExamineLimit = function(a) {
M.ra = a;
}, K._setReferrerOverride = function(a) {
K.ab = a;
}, K._setCookiePersistence = function(a) {
K._setVisitorCookieTimeout(a);
}, K._setVisitorCookieTimeout = function(a) {
M.v = a;
};
}, J._getTracker = function(a, b) {
return new J.aa(a, b);
};
var K = d, L = {
ca: {},
_createAsyncTracker: function(a, b) {
return b = b || "", a = new J.aa(a), L.ca[b] = a, K = c, a;
},
_getAsyncTracker: function(a) {
a = a || "";
var b = L.ca[a];
return b || (b = new J.aa, L.ca[a] = b, K = c), b;
},
push: function() {
for (var a = arguments, b = 0, c = 0; c < a[g]; c++) try {
if (typeof a[c] == "function") a[c](); else {
var d = "", e = a[c][0], f = e.lastIndexOf(".");
f > 0 && (d = E(e, 0, f), e = E(e, f + 1));
var h = L._getAsyncTracker(d);
h[e].apply(h, a[c].slice(1));
}
} catch (i) {
b++;
}
return b;
}
};
window[a] = J, M();
})();

// lib/services/WebService.js

enyo.kind({
name: "findApps.WebService",
kind: enyo.WebService,
create: function() {
this.inherited(arguments), this.cacheUtil = findApps.CacheUtil.getInstance("com.hp.app.findApps.WebService.", AppCatalog.Config.CacheConfig.persistent), this.cacheUtil.setEnabled(AppCatalog.Config.CacheConfig.enabled);
},
dispatchResponse: function(a, b, c) {
a && a.scope ? this.dispatch(a.scope, a.handler, [ b.response, b, a.props, c ]) : this.dispatch(this.owner, a, [ b.response, b ]);
},
setRequestProps: function(a) {
this.setUrl(a.url), this.setMethod(a.method), this.setHandleAs(a.handleAs), this.setContentType(a.contentType), this.setSync(a.sync), this.setHeaders(a.headers), this.setUsername(a.username), this.setPassword(a.password);
},
sendRequest: function(a) {
this.setRequestProps(a), this.log("Service:", a.service, "URL:", a.url, "Method:", a.method, "Headers:", a.headers, "Body:", a.body, "Expires:", this.expires);
if (a.expires) {
var b = findApps.WebService._generateKey(a), c = this.cacheUtil.get(b);
if (c) {
if (a.scope && a.scope.corelationId) {
var d = c.inRequest.params;
d = d ? enyo.isString(d) ? JSON.parse(d) : d : {}, d.corelationId = a.scope.corelationId, c.inRequest.params = JSON.stringify(d);
}
c.inRequest.onSuccess = {
handler: a.onSuccess,
scope: a.scope,
props: a
}, this.log("RESPONSE OBTAINED FROM " + (AppCatalog.Config.CacheConfig.persistent ? "PERSISTENT" : "MEMORY") + " CACHE"), this.responseSuccess(c.inRequest, !0);
return;
}
this.cacheUtil.set(b, a.expires);
}
this.call(a.body, {
onSuccess: a.onSuccess ? {
handler: a.onSuccess,
scope: a.scope,
props: a
} : "",
onFailure: a.onFailure ? {
handler: a.onFailure,
scope: a.scope,
props: a
} : "",
onResponse: a.onResponse ? {
handler: a.onResponse,
scope: a.scope,
props: a
} : ""
});
},
responseSuccess: function(a, b) {
var c = a.response, d = a.onSuccess.props, e = [], f = findApps.WebService.parseStatusCode(c), g = findApps.WebService.parseServerException(c), h = findApps.WebService.parseXhrStatusCode(a);
g && (e.push(g), e.push("RESP0002")), h !== 200 && (this.error("xhrStatusCode:", h), e.push("RESP0001")), c === "" && (a.didTimeout ? e.push("RESP0003") : e.push("RESP0004")), f !== "OK" && f !== "" && (this.error("responseStatusCode: ", f), e.push("RESP0005")), findApps.WebService.local_testing(e, this, a);
var i = "";
b || (i = findApps.WebService._generateKey(d)), e.length === 0 ? (b || this.log("Service: ", d ? d.service : "", "URL: ", a.url, "response:", c, "responseStatusCode:", f, "xhrStatusCode:", h, "latency:", a.latency, "timeoutjob:", a.timeoutJob), i && this.cacheUtil.set(i, null, {
inRequest: {
response: c,
url: a.url,
method: a.method,
params: a.params,
xhr: {
status: findApps.WebService.parseXhrStatusCode(a)
}
}
}), this.dispatchResponse(a.onSuccess, a)) : (i && this.cacheUtil.clear(i), this.responseFailure(a, e));
},
responseFailure: function(a, b) {
var c = a.response, d = a.onFailure.props;
b = b || [];
var e = findApps.WebService.parseStatusCode(c), f = findApps.WebService.parseServerException(c), g = findApps.WebService.parseXhrStatusCode(a);
f && (b.push(f), b.push("RESP0009")), g !== 200 && (this.error("xhrStatusCode:", g), b.push("RESP0010")), c === "" && (a.didTimeout ? b.push("RESP0011") : b.push("RESP0012")), e !== "OK" && e !== "" && (this.error("responseStatusCode: ", e), b.push("RESP0013")), b.push("RESP0006"), this.error("Service: ", d ? d.service : "", "URL: ", a.url, "response: ", c, "serverException:", f, "responseStatusCode:", e, "xhrStatusCode:", g, "latency:", a.latency, "timeoutjob:", a.timeoutJob, "errors", b + ""), this.dispatchResponse(a.onFailure, a, b);
},
response: function(a) {
var b = a.response, c = a.onResponse.props, d = [], e = findApps.WebService.parseStatusCode(b), f = findApps.WebService.parseServerException(b), g = findApps.WebService.parseXhrStatusCode(a);
this.log("Service: ", c ? c.service : "", "URL: ", a.url, "statusCode", e, "response: ", b, "serverException", f, "xhrStatusCode", g), g !== 200 && d.push("RESP0007"), f && (d.push(f), d.push("RESP0008")), b === "" && a.didTimeout && d.push("RESP0011"), findApps.WebService.local_testing(d, this, a), this.dispatchResponse(a.onResponse, a, d);
}
}), enyo.mixin(findApps.WebService, {
parseServerException: function(a) {
var b = "";
return a && (a.results && a.results.body && a.results.body.error ? b = a.results.body.error : a.JSONException && (b = a.JSONException.errorCode || a.JSONException.errorCodes)), typeof b == "undefined" && (b = ""), b;
},
parseStatusCode: function(a) {
return a && (a.statusCode || a.results && a.results.statusCode) || "";
},
parseXhrStatusCode: function(a) {
return a && a.xhr && a.xhr.status || -1;
},
_generateKey: function(a) {
if (!a) return "";
var b = a.url, c = a.method, d = a.body, e = {};
d && (e = enyo.isString(d) ? JSON.parse(d) : d, a.scope && (a.scope.corelationId = e.corelationId), e.corelationId && (e.corelationId = ""));
var f = b + c + enyo.json.stringify(e);
return findApps.Utilities.getHashCode(f);
},
local_testing: function(a, b, c) {
if (AppCatalog.Config.testServerErrors) {
var d = new XMLHttpRequest;
d.open("GET", "/tmp/service", !1), d.send();
var e = d.responseText.trim() || "", f = b && b.service ? b.service : c.id;
console.error("local_testing(): received response for:", f, ": but blocking only:", e), f === e && (a.push("TEST0001"), a.push("TEST0002"), a.push("TEST0003"), a.push("TEST0004"), a.push("TEST0005"), a.push("TEST0006"), a.push("TEST0007"), a.push("TEST0008"), a.push("TEST0009"), a.push("TEST0010"), a.push("TEST0011"), a.push("TEST0012"), a.push("TEST0013"), a.push("TEST0014"), a.push("TEST0015"));
}
},
getInstance: function() {
return findApps.WebService._singleton = findApps.WebService._singleton || new findApps.WebService, findApps.WebService._singleton;
},
destroy: function() {
findApps.WebService._singleton = null, this.cacheUtil = null, findApps.CacheUtil.destroy();
}
});

// lib/services/PalmService.js

enyo.kind({
name: "findApps.PalmService",
kind: enyo.PalmService,
dispatchResponse: function(a, b) {
a && a.scope ? this.dispatch(a.scope, a.handler, [ b.response, b, a.props ]) : this.dispatch(this.owner, a, [ b.response, b ]);
},
sendRequest: function(a, b) {
this.call(a, enyo.mixin(b, {
onSuccess: b.onSuccess ? {
handler: b.onSuccess,
scope: b.scope,
props: b
} : "",
onFailure: b.onFailure ? {
handler: b.onFailure,
scope: b.scope,
props: b
} : "",
onResponse: b.onResponse ? {
handler: b.onResponse,
scope: b.scope,
props: b
} : ""
}));
}
}), findApps.PalmService.addCallbackProps = function(a, b, c, d) {
return enyo.mixin(a, {
onSuccess: d ? {
handler: b,
scope: d,
props: a
} : b,
onFailure: d ? {
handler: c,
scope: d,
props: a
} : c
});
};

// lib/services/BaseServer.js

enyo.kind({
name: "findApps.BaseServer",
kind: enyo.Object,
getAuthHeaders: function() {
return findApps.BaseServer._authHeaders == null && (findApps.BaseServer._authHeaders = findApps.UserSession._token && findApps.UserSession._deviceId && findApps.UserSession._email ? {
Authorization: "PalmAuth token=" + findApps.UserSession._token,
"X-Palm-Device-Id": findApps.UserSession._deviceId,
"X-Palm-Profile-Email": findApps.UserSession._email,
"X-Palm-AppCat-Caller-ID": "acc",
"X-Palm-AppCat-Caller-Version": findApps.UserSession._callerVersion
} : null), findApps.BaseServer._authHeaders;
},
callServer: function(a, b) {
var c = a.url, d = a.body, e = a.service, f = a.expires;
this.log("ACS1 server call: URL: ", c, "Service: ", e, "Request: ", d), findApps.WebService.getInstance().sendRequest(enyo.mixin({
contentType: "application/json",
method: "POST",
handleAs: "json",
url: c,
body: enyo.json.stringify(d),
timeout: AppCatalog.Config.wsTimeout,
service: e,
expires: f
}, b));
},
callServer1: function(a, b) {
var c = a.url, d = a.body, e = a.service, f = a.expires, g = a.httpMethod;
this.log("ACS2 server call: URL: ", c, "Service: ", e, "Request: ", d);
var h = this.getAuthHeaders();
findApps.WebService.getInstance().sendRequest(enyo.mixin({
contentType: "application/json",
method: d ? g || "POST" : "GET",
handleAs: "json",
url: c,
headers: h,
body: d ? enyo.json.stringify(d) : null,
timeout: AppCatalog.Config.wsTimeout,
service: e,
expires: f
}, b));
},
callServer3: function(a, b) {
var c = a.url, d = a.service, e = a.wapProxy, f = a.headers;
this.log("server call through proxy: URL: ", c, "Service: ", d, "wapProxy: ", e, "headers: ", f), findApps.WebService.getInstance().sendRequest(enyo.mixin({
contentType: "application/xml",
method: "POST",
url: c,
headers: f,
timeout: AppCatalog.Config.wsTimeout,
service: d
}, b));
},
fetchAccountParams: function(a, b, c) {
var d = enyo.application.paramsFetcher = enyo.application.paramsFetcher || new findApps.AccountParamsFetcher, e = Array.prototype.slice.apply(b);
d.fetchAccountParams({
scope: a,
methodName: c,
params: e,
onError: "handleAccountParamsError",
onErrorParams: [ b.service, b.inProps ]
});
},
getMethodName: function(a) {
return a.split(".").pop().replace("()", "");
}
}), enyo.mixin(findApps.BaseServer, {
_categoriesMap: null,
buildCategoriesMap: function() {
var a = findApps.UserSession._session.categories, b = {};
for (var c in a) {
b[a[c].categoryId] = a[c];
var d = a[c].subcategories;
for (var e in d) b[d[e].categoryId] = d[e], b[d[e].categoryId].parentId = a[c].categoryId;
}
this._categoriesMap = b;
},
isPurchased: function(a) {
return findApps.UserSession._session && findApps.UserSession._session.purchasedApplications && findApps.UserSession._session.purchasedApplications.apps ? findApps.UserSession._session.purchasedApplications.apps.indexOf(a) == -1 ? !1 : !0 : !1;
},
getCategoryItem: function(a) {
return this._categoriesMap[a];
},
getCategoryInfo: function(a) {
if (a == "") return {
label: $L("All results"),
icon: ""
};
var b = this.getCategoryItem(a);
if (b) {
var c = this.getCategoryItem(b.parentId);
return c ? {
label: enyo.macroize("{$par} / {$item}", {
par: c.label,
item: b.label
}),
icon: "images/" + (b.iconLocation || c.iconLocation || "category-icons/home/") + "category-selector.png"
} : {
label: b.label,
icon: "images/" + (b.iconLocation || "category-icons/home/") + "category-selector.png"
};
}
return null;
},
getRelevantSearchCategories: function(a) {
var b = [];
for (var c in a) {
var d = this.getCategoryItem(a[c].id);
d && !d.parentId && b.unshift(a[c]);
}
return b;
},
getACServer: function() {
return findApps.BaseServer._ACServer = findApps.BaseServer._ACServer || new findApps.ACServer, findApps.BaseServer._ACServer;
},
getPMTServer: function() {
return findApps.BaseServer._PMTServer = findApps.BaseServer._PMTServer || new findApps.PMTServer, findApps.BaseServer._PMTServer;
},
destroy: function() {
findApps.WebService.destroy(), findApps.BaseServer._PMTServer = null, findApps.BaseServer._ACServer = null, this._categoriesMap = null;
}
});

// lib/services/ACServer.js

enyo.kind({
name: "findApps.ACServer",
kind: "findApps.BaseServer",
getSession: function(a, b) {
var c = "user/session";
if (!findApps.UserSession.getSession()) {
var d = this.isAccountParamsAvail();
if (d) {
var e = {
url: findApps.UserSession._server2Url + enyo.g11n.currentLocale().toISOString() + "/" + c,
service: "SessionService"
};
this.callServer1(e, b);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
setCountryCode: function(a, b, c) {
var d = this.isAccountParamsAvail();
if (d) {
var e = "user/profile/devices/" + findApps.UserSession._deviceId, f = {
url: findApps.UserSession._server2Url + e,
body: a,
service: b
};
this.callServer1(f, c);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
},
getCountryList: function(a, b) {
var c = this.isAccountParamsAvail();
if (c) {
var d = "support/firstUseCountryList", e = {
url: findApps.UserSession._server2Url + d,
service: a
};
this.callServer1(e, b);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
},
getApplicationDetails: function(a, b, c, d, e, f) {
var g = this.isAccountParamsAvail();
if (g) {
var h = "appDetail_ext2", i = {
InGetAppDetailV2: {
accountTokenInfo: findApps.UserSession.getAccountToken(),
packageId: b,
locale: c,
appId: a ? a : undefined
}
}, j = new Date((new Date).getTime() + AppCatalog.Config.CacheConfig.longTermTTL), k = {
url: findApps.UserSession._serverUrl + h,
body: i,
service: d,
expires: e ? undefined : j
};
this.callServer(k, f);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
},
getMyRating: function(a, b, c, d) {
var e = this.isAccountParamsAvail();
if (e) {
var f = "getMyRating", g = {
InGetMyRating: {
accountTokenInfo: findApps.UserSession.getAccountToken(),
publicApplicationId: b
}
}, h = {
url: findApps.UserSession._serverUrl + f,
body: g,
service: c
};
this.callServer(h, d);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
},
getAppReviewsList: function(a, b, c, d, e, f, g) {
var h = this.isAccountParamsAvail();
if (h) {
var i = "/apps/" + b + "/reviews/?sign=" + c + "&offset=" + d + "&count=" + e, j = new Date((new Date).getTime() + AppCatalog.Config.CacheConfig.shortTermTTL), k = {
url: findApps.UserSession._server2Url + enyo.g11n.currentLocale().toISOString() + "/" + i,
service: f,
expires: j
};
this.callServer1(k, g);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
},
updateReviewOfReview: function(a, b, c, d, e, f, g) {
var h = this.isAccountParamsAvail();
if (h) {
var i = "/apps/" + b + "/reviews/" + d, j = {
usefulToMe: e,
packageId: b,
version: c,
reviewId: d
}, k = {
url: findApps.UserSession._server2Url + enyo.g11n.currentLocale().toISOString() + "/" + i,
body: j,
service: f
};
this.callServer1(k, g);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
},
getAppList: function(a, b, c) {
var d = this.isAccountParamsAvail();
if (d) {
var e = "appList_ext2", f = {
InGetAppListV2: {
accountTokenInfo: findApps.UserSession.getAccountToken(),
queryStr: a.queryStr || "",
queryFragment: a.queryFragment || "",
qid: a.qid || "",
listId: a.listId || "",
categoryid: a.categoryid || "",
tagName: a.tagName || "",
provides: a.provides || "",
startPosition: a.startPosition || 0,
count: a.count || AppCatalog.Config.defaultPageSize,
sort: a.sort || "DATE_DESC",
locale: a.locale || enyo.g11n.currentLocale().toISOString(),
includeImages: a.includeImages || "true",
includeCategoryBreakdown: a.includeCategoryBreakdown || "false",
packageIds: a.packageIds || [],
filterBadges: a.appFilterType || "all"
},
corelationId: a.corelationId || ""
};
a.developerId && a.developerId != 0 && (f.InGetAppListV2.developerId = a.developerId);
var g = new Date((new Date).getTime() + AppCatalog.Config.CacheConfig.longTermTTL), h = {
url: findApps.UserSession._serverUrl + e,
body: f,
service: b,
expires: g
};
this.callServer(h, c);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
},
addUserReview: function(a, b, c, d, e, f, g, h, i) {
var j = this.isAccountParamsAvail();
if (j) {
var k = {
packageId: b,
version: c,
locale: d,
creator: g,
comments: e,
rating: f
}, l = "/apps/" + b + "/reviews/", m = {
url: findApps.UserSession._server2Url + enyo.g11n.currentLocale().toISOString() + "/" + l,
body: k,
service: h,
httpMethod: "PUT"
};
this.callServer1(m, i);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
},
updateUserReview: function(a, b, c, d, e, f, g, h, i, j) {
var k = this.isAccountParamsAvail();
if (k) {
var l = {
id: e,
packageId: b,
version: c,
locale: d,
creator: h,
comments: f,
rating: g
}, m = "/apps/" + b + "/reviews/" + e, n = {
url: findApps.UserSession._server2Url + enyo.g11n.currentLocale().toISOString() + "/" + m,
body: l,
service: i,
httpMethod: "PUT"
};
this.callServer1(n, j);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
},
reportProblem: function(a, b, c, d, e, f, g, h, i, j, k) {
var l = this.isAccountParamsAvail();
if (l) {
var m = "addUserRating", n = {
InAddUserRating: {
userRatingItem: {
score: Math.round(d),
comment: c,
accountId: f || "",
locale: e,
isAnonymous: g,
isInappropriate: h,
appId: a,
publicApplicationId: b,
complaintType: i
},
accountTokenInfo: findApps.UserSession.getAccountToken()
}
}, o = {
url: findApps.UserSession._serverUrl + m,
body: n,
service: j
};
this.callServer(o, k);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
},
getListOfUpdatableApps: function(a, b, c) {
var d = this.isAccountParamsAvail();
if (d) {
var e = "getListOfUpdatableApps", f = {
InGetUpdatableApps: {
accountTokenInfo: findApps.UserSession.getAccountToken(),
packageIds: a
}
}, g = {
url: findApps.UserSession._serverUrl + e,
body: f,
service: b
};
this.callServer(g, c);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
},
handleAccountParamsError: function(a, b) {
this.error("handleAccountParamsError: Failed to fetch account parameters. Returning failure status for service ", a);
var c = [ "LOC07006" ], d = {
JSONException: {
errorCode: "LOC07006"
}
}, e = [ this, d, null, b, c ];
b.scope[b.onFailure].apply(b.scope, e);
},
isAccountParamsAvail: function() {
return findApps.UserSession.getAccountToken() && findApps.UserSession._serverUrl ? !0 : !1;
}
});

// lib/services/PMTServer.js

enyo.kind({
name: "findApps.PMTServer",
kind: "findApps.BaseServer",
getCCTypes: function(a, b, c, d) {
if (d) this.handleNullPaymentServerUrl(b, c, [ "LOC02034" ]); else {
var e = this.isAccountParamsAvail();
if (e) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var f = "getCCTypes", g = {
InGetCCTypes: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId,
billToCountry: a
}
}, h = {
url: findApps.UserSession._paymentServerUrl + f,
body: g,
service: b
};
this.callServer(h, c);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
setDefaultPaymentInfo: function(a, b, c, d) {
if (d) this.handleNullPaymentServerUrl(b, c, [ "LOC02035" ]); else {
var e = this.isAccountParamsAvail();
if (e) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var f = "setDefaultPaymentInfo", g = {
InSetDefaultPaymentInfo: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId,
paymentInfoId: a
}
}, h = {
url: findApps.UserSession._paymentServerUrl + f,
body: g,
service: b
};
this.callServer(h, c);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
setInvoiceEmail: function(a, b, c, d) {
if (d) this.handleNullPaymentServerUrl(b, c, [ "LOC02036" ]); else {
var e = this.isAccountParamsAvail();
if (e) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var f = "setUserInfo", g = {
InSetUserInfo: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId,
invoiceEmail: a
}
}, h = {
url: findApps.UserSession._paymentServerUrl + f,
body: g,
service: b
};
this.callServer(h, c);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
_gotCarrierInfo: function(a, b, c, d, e) {
this.log("getPaymentTypes gotCarrierInfo: ", b);
if (e) this.handleNullPaymentServerUrl(d.successProps.service, d.successProps.props, [ "LOC02037" ]); else {
var f = this.isAccountParamsAvail();
if (f) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var g = "getPaymentTypes", h = {
InGetPaymentTypes: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId
}
};
b && b.results[0] && b.results[0].mcc && b.results[0].mnc && b.results[0].qOperatorShortName && (h.InGetPaymentTypes.mcc = b.results[0].mcc, h.InGetPaymentTypes.mnc = b.results[0].mnc, h.InGetPaymentTypes.carrier = b.results[0].qOperatorShortName);
var i = {
url: findApps.UserSession._paymentServerUrl + g,
body: h,
service: d.successProps.service
};
this.callServer(i, d.successProps.props);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
_getCarrierFailure: function(a, b, c, d) {
this.log("getPaymentTypes getCarrierFailure ", b), this.handleNullPaymentServerUrl(d.successProps.service, d.successProps.props, [ "LOC02038" ]);
},
getPaymentTypes: function(a, b) {
findApps.DeviceProfile.getInstance().getCarrierIdentification({
onSuccess: "_gotCarrierInfo",
onFailure: "_getCarrierFailure",
scope: this,
successProps: {
service: a,
props: b
}
});
},
getBillToCountries: function(a, b, c) {
if (c) this.handleNullPaymentServerUrl(a, b, [ "LOC02039" ]); else {
var d = this.isAccountParamsAvail();
if (d) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var e = "getBillToCountries", f = {
InGetBillToCountries: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId
}
}, g = {
url: findApps.UserSession._paymentServerUrl + e,
body: f,
service: a
};
this.callServer(g, b);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
verifyPaymentSetup: function(a, b, c) {
if (c) this.handleNullPaymentServerUrl(a, b, [ "LOC02040" ]); else {
var d = this.isAccountParamsAvail();
if (d) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var e = "getPaymentInfos", f = {
InGetPaymentInfos: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId
}
}, g = {
url: findApps.UserSession._paymentServerUrl + e,
body: f,
service: a
};
this.callServer(g, b);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
addAccount: function(a, b, c, d, e) {
if (e) this.handleNullPaymentServerUrl(c, d, [ "LOC02041" ]); else {
var f = this.isAccountParamsAvail();
if (f) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var g = "addCCPaymentInfo", h = {
InAddCCPaymentInfo: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId,
billTo: a,
creditCard: b
}
}, i = {
url: findApps.UserSession._paymentServerUrl + g,
body: h,
service: c
};
this.callServer(i, d);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
_addOBAccountOnCarrierInfo: function(a, b, c, d, e) {
if (e) this.handleNullPaymentServerUrl(d.sucessProps.service, d.sucessProps.props, [ "LOC02042" ]); else {
var f = this.isAccountParamsAvail();
if (f) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var g = "addOBPaymentInfo", h = {
InAddOBPaymentInfo: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId,
address: d.successProps.address,
mcc: b.results[0] && b.results[0].mcc,
mnc: b.results[0] && b.results[0].mnc,
carrier: b.results[0] && b.results[0].qOperatorShortName
}
}, i = {
url: findApps.UserSession._paymentServerUrl + g,
body: h,
service: d.successProps.service
};
this.callServer(i, d.successProps.props);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
_addOBAccountOnCarrierInfoFail: function() {
this.error("_addOBAccountOnCarrierInfoFail for service ", inProps.successProps.service), this.handleNullPaymentServerUrl(inProps.successProps.service, inProps.successProps.props, [ "LOC02069" ]);
},
addOBAccount: function(a, b, c) {
findApps.DeviceProfile.getInstance().getCarrierIdentification({
onSuccess: "_addOBAccountOnCarrierInfo",
onFailure: "_addOBAccountOnCarrierInfoFail",
scope: this,
successProps: {
address: a,
service: b,
props: c
}
});
},
getOBCountries: function(a, b, c) {
if (c) this.handleNullPaymentServerUrl(a, b, [ "LOC02043" ]); else {
var d = this.isAccountParamsAvail();
if (d) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var e = "getOBCountries", f = {
InGetOBCountries: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId
}
}, g = {
url: findApps.UserSession._paymentServerUrl + e,
body: f,
service: a
};
this.callServer(g, b);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
updateAccount: function(a, b, c, d, e) {
if (e) this.handleNullPaymentServerUrl(c, d, [ "LOC02044" ]); else {
var f = this.isAccountParamsAvail();
if (f) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var g = "updateCCPaymentInfo", h = {
InUpdateCCPaymentInfo: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId,
paymentInfoId: b.paymentInfoId,
billTo: a,
creditCard: b
}
}, i = {
url: findApps.UserSession._paymentServerUrl + g,
body: h,
service: c
};
this.callServer(i, d);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
updateOBAccount: function(a, b, c, d, e) {
if (e) this.handleNullPaymentServerUrl(c, d, [ "LOC02045" ]); else {
var f = this.isAccountParamsAvail();
if (f) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var g = "updateOBPaymentInfo", h = {
InUpdateOBPaymentInfo: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId,
paymentInfoId: b,
address: a
}
}, i = {
url: findApps.UserSession._paymentServerUrl + g,
body: h,
service: c
};
this.callServer(i, d);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
_getOBInfosOnCarrierInfo: function(a, b, c, d, e) {
if (e) this.handleNullPaymentServerUrl(d.successProps.service, d.successProps.props, [ "LOC02046" ]); else {
var f = this.isAccountParamsAvail();
if (f) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var g = "getOBInfos", h = {
InGetOBInfos: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId,
mcc: b.results[0] && b.results[0].mcc,
mnc: b.results[0] && b.results[0].mnc,
carrier: b.results[0] && b.results[0].qOperatorShortName
}
}, i = {
url: findApps.UserSession._paymentServerUrl + g,
body: h,
service: "GetOnInfoService"
};
this.callServer(i, d.successProps.props);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
getOBInfos: function(a, b) {
findApps.DeviceProfile.getInstance().getCarrierIdentification({
onSuccess: "_getOBInfosOnCarrierInfo",
onFailure: "_getOBInfosOnCarrierInfoFail",
scope: this,
successProps: {
service: a,
props: b
}
});
},
_getOBInfosOnCarrierInfoFail: function(a, b, c, d) {
this.error("_getOBInfosOnCarrierInfoFail for service ", d.successProps.service), this.handleNullPaymentServerUrl(d.successProps.service, d.successProps.props, [ "LOC02070" ]);
},
removeAccount: function(a, b, c, d, e) {
if (e) this.handleNullPaymentServerUrl(c, d, [ "LOC02047" ]); else {
var f = this.isAccountParamsAvail();
if (f) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var g = b ? "InRemoveCCPaymentInfo" : "InRemoveOBPaymentInfo", h = b ? "removeCCPaymentInfo" : "removeOBPaymentInfo", i = {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId,
paymentInfoId: a
}, j = {};
j[g] = i;
var k = {
url: findApps.UserSession._paymentServerUrl + h,
body: j,
service: c
};
this.callServer(k, d);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
capturePayment: function(a, b, c, d) {
if (d) this.handleNullPaymentServerUrl(b, c, [ "LOC02048" ]); else {
var e = this.isAccountParamsAvail();
if (e) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
a.obSessionId || delete a.obSessionId;
var f = "capturePayment", g = {
InCapturePayment: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId,
order: a
}
}, h = {
url: findApps.UserSession._paymentServerUrl + f,
body: g,
service: b
};
this.callServer(h, c);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
getOrderStatus: function(a, b, c, d) {
if (d) this.handleNullPaymentServerUrl(b, c, [ "LOC02049" ]); else {
var e = this.isAccountParamsAvail();
if (e) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var f = "getOrderStatus", g = {
InGetOrderStatus: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId,
orderNo: a
}
}, h = {
url: findApps.UserSession._paymentServerUrl + f,
body: g,
service: b
};
this.callServer(h, c);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
getEmbargoedEmailExtensions: function(a, b, c) {
if (c) this.handleNullPaymentServerUrl(a, b, [ "LOC02050" ]); else {
var d = this.isAccountParamsAvail();
if (d) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var e = "getEmbargoedEmailExtensions", f = {
InGetEmbargoedEmailExtensions: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId
}
}, g = {
url: findApps.UserSession._paymentServerUrl + e,
body: f,
service: a
};
this.callServer(g, b);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
getCodeInfos: function(a, b, c, d) {
if (d) this.handleNullPaymentServerUrl(b, c, [ "LOC02051" ]); else {
var e = this.isAccountParamsAvail();
if (e) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var f = "getPromoCodeInfos", g = {
InGetPromoCodeInfos: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId,
code: a
}
}, h = {
url: findApps.UserSession._paymentServerUrl + f,
body: g,
service: b
};
this.callServer(h, c);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
checkPromoCodeStatus: function(a, b, c, d, e, f) {
if (f) this.handleNullPaymentServerUrl(d, e, [ "LOC02052" ]); else {
var g = this.isAccountParamsAvail();
if (g) if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var h = "checkPromoCodeStatus", i = {
InCheckPromoCodeStatus: {
authToken: findApps.UserSession._token,
accountAlias: findApps.UserSession._email,
deviceId: findApps.UserSession._deviceId,
code: a,
id: b,
version: c
}
}, j = {
url: findApps.UserSession._paymentServerUrl + h,
body: i,
service: d
};
this.callServer(j, e);
} else this.fetchAccountParams(this, arguments, this.getMethodName(arguments.callee.nom));
}
},
initOBSession: function(a, b, c, d) {
if (d) this.handleNullPaymentServerUrl(b, c, [ "LOC02066" ]); else if (!findApps.UserSession._paymentServerUrl) this.getPaymentServerUrl(arguments, this.getMethodName(arguments.callee.nom)); else {
var e = a.wapProxy, f = {}, g = enyo.application.connectionManager.isWanSvcConnected, h = enyo.application.connectionManager.ipAddress, i = enyo.application.connectionManager.wanInterface, j = !0;
if (e && g && h) {
this.log("isWanSvcConnected", g, "ipAddress ", h), f = {
"X-webOS-NetworkInterface": h
};
var k = e, l = /^http:\/\/([A-Za-z0-9\.-]+):([0-9]+)$/, m = l.exec(k);
f["X-webOS-proxyaddr"] = m[1], f["X-webOS-proxyport"] = m[2];
} else i ? f = {
"X-webOS-NetworkInterface": enyo.application.connectionManager.wanInterface
} : j = !1;
if (j === !0) {
var n = {
url: a.initSession.URL,
service: b,
wapProxy: a.wapProxy,
headers: f
};
this.callServer3(n, c);
} else this.handleNoWanConnection(b, c);
}
},
handleNoWanConnection: function(a, b) {
var c = [ "nowan" ], d = [ this, null, null, b, c ];
b.scope[b.onFailure].apply(b.scope, d);
},
handleNullPaymentServerUrl: function(a, b, c) {
var d = {
JSONException: {
errorCode: "PMT_catchAll"
}
};
c.push("LOC02053");
var e = [ this, d, null, b, c ];
b.scope[b.onFailure].apply(b.scope, e);
},
_gotPaymentUrl: function(a, b, c, d) {
findApps.UserSession._paymentServerUrl = b.parameterInfos.value, this[d.callback].apply(this, d.args);
},
_gotPaymentUrlError: function(a, b, c, d) {
this.error("Error in getting payment server url", b);
var e = Array.prototype.slice.apply(d.args);
e.push(!0), this[d.callback].apply(this, e);
},
getPaymentServerUrl: function(a, b) {
findApps.AccountServices.getInstance().getPaymentServerUrl({
onSuccess: "_gotPaymentUrl",
onFailure: "_gotPaymentUrlError",
scope: this,
args: a,
callback: b
});
},
handleAccountParamsError: function(a, b) {
var c = [ "LOC07007" ], d = {
JSONException: {
errorCode: "LOC07007"
}
}, e = [ this, d, null, b, c ];
b.scope[b.onFailure].apply(b.scope, e);
},
isAccountParamsAvail: function() {
return findApps.UserSession.getAccountToken() ? !0 : !1;
}
});

// lib/services/appinstallservice.js

enyo.kind({
name: "findApps.AppInstallService",
kind: "PalmService",
service: "palm://com.palm.appInstallService/",
install: function(a, b, c) {
this.subscribe = !1;
var d = (new Date).getTime(), e = {
catalogId: a.id,
id: a.publicApplicationId,
title: a.title,
version: a.serverVersion,
vendor: a.vendor,
vendorUrl: a.vendorUrl,
iconUrl: a.iconUrl,
ipkUrl: a.packageUrl,
authToken: findApps.UserSession._token,
deviceId: findApps.UserSession._deviceId,
email: findApps.UserSession._email,
noApp: a.appType === "app" ? !1 : !0,
services: a.services,
accounts: a.accounts,
dockMode: a.dockMode,
universalSearch: a.universalSearch,
loc_name: a.title,
transactionId: "" + d
}, f = {
method: "install",
onSuccess: b,
onFailure: c
};
this.log("appinstallservice: install: params ", e, " props: ", f), this.call(e, f);
},
status: function(a, b) {
this.subscribe = !0;
var c = {}, d = {
method: "status",
onSuccess: a,
onFailure: b
};
this.log("appinstallservice: status: params ", c, " props: ", d), this.call(c, d);
},
pause: function(a, b, c) {
this.subscribe = !1;
var d = {
id: a
}, e = {
method: "pause",
onSuccess: b,
onFailure: c
};
this.log("appinstallservice: pause: params ", d, " props: ", e), this.call(d, e);
},
resume: function(a, b, c) {
this.subscribe = !1;
var d = {
id: a
}, e = {
method: "resume",
onSuccess: b,
onFailure: c
};
this.log("appinstallservice: resume: params ", d, " props: ", e), this.call(d, e);
},
cancel: function(a, b, c) {
this.subscribe = !1;
var d = {
id: a
}, e = {
method: "cancel",
onSuccess: b,
onFailure: c
};
this.log("appinstallservice: cancel: params ", d, " props: ", e), this.call(d, e);
},
remove: function(a, b, c) {
this.subscribe = !1;
var d = {
id: a
}, e = {
method: "remove",
onSuccess: b,
onFailure: c
};
this.log("appinstallservice: remove: params ", d, " props: ", e), this.call(d, e);
},
installLocal: function(a, b, c) {
this.subscribe = !1;
var d = {
id: a.id,
version: a.version,
title: a.loc_name,
ipkUrl: a.ipkgUrl,
iconUrl: a.iconUrl,
vendor: a.vendor
}, e = {
method: "installLocal",
onSuccess: b,
onFailure: c
};
this.log("appinstallservice: installLocal: params ", d, " props: ", e), this.call(d, e);
}
});

// lib/services/applicationmanager.js

enyo.kind({
name: "findApps.ApplicationManager",
kind: findApps.PalmService,
service: "palm://com.palm.applicationManager/",
getInstalledApplications_V2: function(a, b, c) {
this.subscribe = !1;
var d = {}, e = {
method: "listPackages"
};
this.call(d, findApps.PalmService.addCallbackProps(e, a, b, c));
},
openApplication: function(a, b, c, d, e, f) {
this.subscribe = !1;
var g = b;
g || (g = {});
var h = {
id: a,
params: g
}, i = {
method: "open"
};
this.call(h, findApps.PalmService.addCallbackProps(i, d, e, f));
},
launchApplication: function(a, b, c, d, e) {
this.subscribe = !1;
var f = {
id: a,
params: b
}, g = {
method: "launch"
};
this.call(f, findApps.PalmService.addCallbackProps(g, c, d, e));
},
launchPointChanges: function(a, b, c) {
this.subscribe = !0;
var d = {}, e = {
method: "launchPointChanges",
subscribe: !0
};
this.call(d, findApps.PalmService.addCallbackProps(e, a, b, c));
},
openBrowserPage: function(a, b, c, d) {
this.subscribe = !1, this.openApplication("com.palm.app.browser", '{"target": "' + a + '"}', !0, b, c, d);
}
}), findApps.ApplicationManager.getInstance = function() {
return findApps.ApplicationManager._singleton = findApps.ApplicationManager._singleton || new findApps.ApplicationManager, findApps.ApplicationManager._singleton;
}, findApps.ApplicationManager.destroy = function() {
findApps.ApplicationManager._singleton = null;
};

// lib/services/applicationinstaller.js

enyo.kind({
name: "findApps.ApplicationInstaller",
kind: "PalmService",
service: "palm://com.palm.appinstaller/",
validateInstall: function(a, b, c, d, e) {
if (enyo.application.onBrowser) {
var f = this.owner;
f[d].call(f, f, {
result: 0
});
return;
}
var c = c && c != 0 ? Math.ceil(c / 1024) : undefined, b = Math.ceil(b / 1024), g = {
appId: a,
size: b,
uncompressedSize: c
}, h = {
method: "queryInstallCapacity",
onSuccess: d,
onFailure: e
};
this.log("appinstaller: validateInstall: params ", g, " props: ", h), this.call(g, h);
}
});

// lib/services/accountservices.js

enyo.kind({
name: "findApps.AccountServices",
kind: findApps.PalmService,
service: "palm://com.palm.accountservices/",
getServerUrl: function(a) {
if (AppCatalog.Config.DummyConfig) {
a.scope[a.onSuccess].call(a.scope, this, {
serverUrl: AppCatalog.Config.DummyConfig._env._serverUrl
}, {}, a);
return;
}
var b = {};
a = enyo.mixin(a ? a : {}, {
service: this.service,
method: "getServerUrl"
}), this.sendRequest(b, a);
},
getPaymentServerUrl: function(a) {
if (AppCatalog.Config.DummyConfig) {
a.scope[a.onSuccess].call(a.scope, this, {
parameterInfos: {
value: AppCatalog.Config.DummyConfig._env._paymentServerUrl
}
}, {}, a);
return;
}
if (findApps.UserSession._paymentServerUrl == null) {
var b = {
appName: "PAYMENT"
};
a = enyo.mixin(a ? a : {}, {
service: this.service,
method: "getPreferences"
}), this.sendRequest(b, a);
}
},
getAccountToken: function(a) {
if (AppCatalog.Config.DummyConfig) {
a.scope[a.onSuccess].call(a.scope, this, {
token: AppCatalog.Config.DummyConfig._token,
accountAlias: AppCatalog.Config.DummyConfig._email
}, {}, a);
return;
}
var b = {};
a = enyo.mixin(a ? a : {}, {
service: this.service,
method: "getAccountToken"
}), this.sendRequest(b, a);
},
getAccountInfo: function(a) {
if (findApps.UserSession.getAccountInfo() != null) return findApps.UserSession.getAccountInfo();
var b = {};
a = enyo.mixin(a ? a : {}, {
service: this.service,
method: "getAccountInfo"
}), this.sendRequest(b, a);
},
updateAccountInfo: function(a, b, c, d, e, f, g) {
var h = {
firstName: firstName,
lastName: b,
password: c,
email: d,
languageCode: e,
countryCode: f
};
g = enyo.mixin(g ? g : {}, {
service: this.service,
method: "updateAccountInfo"
}), this.sendRequest(h, g);
},
getGoogleAnalyticsWebPropertyID: function(a) {
var b = {
appName: [ "APP_DISCO" ]
};
a = enyo.mixin(a ? a : {}, {
service: this.service,
method: "getPreferences"
}), this.sendRequest(b, a);
},
notifyAuthenticationFailure: function(a) {
var b = {};
a = enyo.mixin(a ? a : {}, {
service: this.service,
method: "notifyAuthenticationFailure"
}), this.sendRequest(b, a);
},
isUserValid: function(a, b, c, d) {
var e = {
email: a,
password: b,
deviceId: c
};
d = enyo.mixin(d ? d : {}, {
service: this.service,
method: "isUserValid"
}), this.sendRequest(e, d);
},
getLocale: function(a) {
var b = {
keys: [ "locale" ]
};
a = enyo.mixin(a ? a : {}, {
service: this.service,
method: "getPreferences"
}), this.sendRequest(b, a);
},
getAllSecurityQuestions: function(a, b) {
var c = {
subscribe: !1,
locale: a
};
b = enyo.mixin(b ? b : {}, {
service: this.service,
method: "getAllSecurityQuestions"
}), this.sendRequest(c, b);
},
getAccountSecurityQuestions: function(a, b, c) {
var d = {
email: a,
locale: b
};
c = enyo.mixin(c ? c : {}, {
service: this.service,
method: "getAccountSecurityQuestion"
}), this.sendRequest(d, c);
},
resendVerificationEmail: function(a) {
var b = {};
a = enyo.mixin(a ? a : {}, {
service: this.service,
method: "requestResendVerificationEmail"
}), this.sendRequest(b, a);
},
requestPasswordResetEmail: function(a, b) {
var c = {
email: a,
subscribe: !1
};
b = enyo.mixin(b ? b : {}, {
service: this.service,
method: "requestPasswordResetEmail"
}), this.sendRequest(c, b);
},
authenticateAccountFromSecurityQuestion: function(a, b, c, d) {
var e = {
email: a,
questionId: b,
response: c
};
d = enyo.mixin(d ? d : {}, {
service: this.service,
method: "authenticateAccountFromSecurityQuestion"
}), this.sendRequest(e, d);
},
changeEmail: function(a, b) {
var c = {
email: a
};
b = enyo.mixin(b ? b : {}, {
service: this.service,
method: "changeEmail"
}), this.sendRequest(c, b);
},
changePassword: function(a, b, c, d, e, f) {
var g = {
newPassword: a,
questionId: b,
answer: c,
idToken: d,
isResetPassword: e
};
f = enyo.mixin(f ? f : {}, {
service: this.service,
method: "changePassword"
}), this.sendRequest(g, f);
},
authenticateAccount: function(a, b, c) {
var d = {
email: a,
password: b,
application: "ASClient"
};
c = enyo.mixin(c ? c : {}, {
service: this.service,
method: "authenticateAccount"
}), this.sendRequest(d, c);
}
}), enyo.mixin(findApps.AccountServices, {
getInstance: function() {
return findApps.AccountServices._singleton = findApps.AccountServices._singleton || new findApps.AccountServices, findApps.AccountServices._singleton;
},
destroy: function() {
findApps.AccountServices._singleton = null;
}
});

// lib/services/deviceprofile.js

enyo.kind({
name: "findApps.DeviceProfile",
kind: findApps.PalmService,
getDeviceId: function(a) {
if (AppCatalog.Config.DummyConfig) {
a.scope[a.onSuccess].call(a.scope, this, {
deviceId: AppCatalog.Config.DummyConfig._deviceId
}, {}, a);
return;
}
var b = {};
a = enyo.mixin(a ? a : {}, {
service: "palm://com.palm.deviceprofile/",
method: "getDeviceId"
}), this.sendRequest(b, a);
},
getCarrierIdentification: function(a) {
if (AppCatalog.Config.DummyConfig) {
a.scope[a.onSuccess].call(a.scope, this, {
results: [ {
mcc: AppCatalog.Config.DummyConfig._carrier._mcc,
mnc: AppCatalog.Config.DummyConfig._carrier._mnc,
qOperatorShortName: AppCatalog.Config.DummyConfig._carrier._shortName
} ]
}, {}, a);
return;
}
var b = {
query: {
from: "com.palm.carrierdb.settings.current:1"
}
};
a = enyo.mixin(a ? a : {}, {
service: "palm://com.palm.db/",
method: "find"
}), this.sendRequest(b, a);
},
getDeviceProfile: function(a) {
if (AppCatalog.Config.DummyConfig) {
a.scope[a.onSuccess].call(a.scope, this, {
deviceInfo: {
softwareBuildBranch: AppCatalog.Config.DummyConfig._softwareBuildBranch
}
}, {}, a);
return;
}
var b = {};
a = enyo.mixin(a ? a : {}, {
service: "palm://com.palm.deviceprofile/",
method: "getDeviceProfile"
}), this.sendRequest(b, a);
}
}), findApps.DeviceProfile.getInstance = function() {
return findApps.DeviceProfile._singleton = findApps.DeviceProfile._singleton || new findApps.DeviceProfile, findApps.DeviceProfile._singleton;
}, findApps.DeviceProfile.destroy = function() {
findApps.DeviceProfile._singleton = null;
};

// lib/services/accountparamsfetcher.js

enyo.kind({
name: "findApps.AccountParamsFetcher",
kind: enyo.Object,
constructor: function() {
this.fetchInProgress = !1, this._listeners = [], this.inherited(arguments);
},
addToListeners: function(a) {
this._listeners.push(a);
},
sendEventToListeners: function(a) {
if (this._listeners) for (var b in this._listeners) {
var c = this._listeners[b];
this.returnCall(c, a);
}
},
returnCall: function(a, b) {
b === !0 ? a.scope[a.methodName].apply(a.scope, a.params) : a.scope[a.onError].apply(a.scope, a.onErrorParams);
},
fetchAccountParams: function(a) {
if (this.fetchInProgress === !0) {
this.addToListeners(a);
return;
}
if (findApps.UserSession._token && findApps.UserSession._email && findApps.UserSession._serverUrl && findApps.UserSession._server2Url && findApps.UserSession._deviceId) this.returnCall(a, !0); else {
this.fetchInProgress = !0, this.addToListeners(a), findApps.UserSession._callerVersion = enyo.fetchAppInfo().version, this.requiredParams = 3;
var b = this, c = function() {
!findApps.UserSession._token || !findApps.UserSession._email ? findApps.AccountServices.getInstance().getAccountToken({
onSuccess: "gotTokenAndEmail",
onFailure: "gotTokenAndEmailError",
scope: b
}) : (b.requiredParams--, b.sendParamsReady("tokenemail"));
}, d = function() {
!findApps.UserSession._serverUrl || !findApps.UserSession._server2Url ? findApps.AccountServices.getInstance().getServerUrl({
onSuccess: "gotUrl",
onFailure: "gotUrlError",
scope: b
}) : (b.requiredParams--, b.sendParamsReady("serverurl"));
}, e = function() {
findApps.UserSession._deviceId ? (b.requiredParams--, b.sendParamsReady("deviceid")) : findApps.DeviceProfile.getInstance().getDeviceId({
onSuccess: "gotDeviceId",
onFailure: "gotDeviceIdError",
scope: b
});
};
c(), d(), e(), this.getDeviceProfile();
}
},
sendParamsReady: function() {
if (this.requiredParams > 0) return;
this.fetchInProgress = !1, findApps.UserSession._token && findApps.UserSession._email && findApps.UserSession._serverUrl && findApps.UserSession._server2Url && findApps.UserSession._deviceId ? this.sendEventToListeners(!0) : this.sendEventToListeners(!1);
},
getDeviceProfile: function() {
findApps.UserSession._softwareBuildBranch || findApps.DeviceProfile.getInstance().getDeviceProfile({
onSuccess: "gotDeviceProfile",
onFailure: "deviceprofileFailure",
scope: this
});
},
deviceprofileFailure: function(a, b) {
this.error("Device Profile command failed");
},
gotTokenAndEmail: function(a, b) {
findApps.UserSession._token = b.token, findApps.UserSession._email = b.accountAlias, findApps.UserProfile.email = b.accountAlias, this.requiredParams--, this.sendParamsReady("tokenemail");
},
gotTokenAndEmailError: function(a, b) {
this.error("Could not fetch token and email"), this.requiredParams--, this.sendParamsReady("tokenemail");
},
gotUrl: function(a, b) {
findApps.UserSession._serverUrl = b.serverUrl;
var c = /([^&]*):\/\/([^&/]*)\/([^&]*)/.exec(findApps.UserSession._serverUrl);
findApps.UserSession._server2Url = c[1] + "://" + c[2] + "/appcatalog/2.0/", this.requiredParams--, this.sendParamsReady("serverurl");
},
gotUrlError: function(a, b) {
this.error("Could not fetch server url"), this.requiredParams--, this.sendParamsReady("serverurl");
},
gotDeviceId: function(a, b) {
findApps.UserSession._deviceId = b.deviceId, this.requiredParams--, this.sendParamsReady("deviceid");
},
gotDeviceIdError: function(a, b) {
this.error("Could not fetch device id"), this.requiredParams--, this.sendParamsReady("deviceid");
},
gotDeviceProfile: function(a, b) {
findApps.UserSession._softwareBuildBranch = b.deviceInfo.softwareBuildBranch;
}
});

// lib/services/connectionmanager.js

enyo.kind({
name: "findApps.ConnectionManager",
kind: enyo.Component,
events: {
onSuccess: "",
onError: ""
},
components: [ {
name: "connMan",
kind: "PalmService",
service: "palm://com.palm.connectionmanager/",
subscribe: !0
}, {
name: "massStorageMan",
kind: "PalmService",
service: "palm://com.palm.bus/signal/",
method: "addmatch",
onSuccess: "msmSuccess",
onFailure: "msmFailure"
} ],
_online: undefined,
_1x: undefined,
_waiting: [],
_started: !1,
gotStatus: function(a, b) {
this.log("connectionmanager: gotStatus: ", b), this._1x = b.wan.network == "1x" && b.wifi.state != "connected", this.wanInterface = b && b.wan && b.wan.interfaceName, this._stateChanged(b.isInternetConnectionAvailable == 1 ? !0 : !1), this.doSuccess(b);
},
handleError: function(a, b) {
this.error("connection manager error ", b);
if (enyo.application.onBrowser) return;
this._stateChanged(!1), this.doError();
},
getStatus: function() {
var a = {
method: "getstatus",
onSuccess: "gotStatus",
onFailure: "handleError"
}, b = {
subscribe: !0
};
this.$.connMan.call(b, a);
},
_startup: function(a) {
this._started = !0;
var b = {
category: "/storaged",
method: "MSMProgress",
subscribe: !0
};
this.$.massStorageMan.call(b), this.getStatus();
},
msmSuccess: function(a, b) {
this.log("connectionmanager: msmSuccess: ", b), this._MSMnotification(b);
},
msmError: function(a, b) {
this.error("msm error ", b), this._MSMnotification(b);
},
_MSMnotification: function(a) {
if (!a) return;
a.stage == "attempting" && (this._MSMmodeActive = !0, findApps.ViewLibrary._container.$.error.cancelOfflineDialog());
},
_stateChanged: function(a) {
if (this._online != a) {
this._online = a;
var b = this._waiting;
this._waiting = [];
for (var c = 0; c < b.length; c++) {
var d = b[c];
d.online === undefined || d.online === a ? b[c].callback(a) : this._waiting.push(d);
}
this._online && (this._MSMmodeActive = !1);
}
},
getDataService: function() {
findApps.DeviceProfile.getInstance().getCarrierIdentification({
onSuccess: "ConnectOnCarrierInfo",
onFailure: "ConnectOnCarrierFailure",
scope: this
});
},
ConnectOnCarrierInfo: function(a, b, c, d) {
this.log("getCarrierIdentification", b);
if (b.results[0] && b.results[0].mcc == 310 && b.results[0] && b.results[0].mnc == 410) {
this.gotDataService = function(a, b, c) {
b && (this.log("getDataService success response", b), undefined != b.returnValue ? b.returnValue || (this.isWanSvcConnected = !1, this.ipAddress = null) : b.status && ("connected" === b.status && b.ipAddress ? (this.isWanSvcConnected = !0, this.ipAddress = b.ipAddress) : "retrying" === b.status ? (this.isWanSvcConnected = !1, this.ipAddress = null) : "disconnected" === b.status && (this.isWanSvcConnected = !1, this.ipAddress = null)));
}, this.gotDataServiceError = function(a, b, c) {
this.error("Error getting proxy service", b), this.isWanSvcConnected = !1, this.ipAddress = null;
};
var e = {
method: "connectCellularDataService",
onSuccess: "gotDataService",
onFailure: "gotDataServiceError"
}, f = {
service: "proxy",
subscribe: !0
};
this.cellSvcConnectRequest = this.$.connMan.call(f, e);
}
},
ConnectOnCarrierFailure: function(a, b, c, d) {
this.error("No MCC/MNC: Either device is only wifi device or no wan connection available "), this.isWanSvcConnected = !1, this.ipAddress = null;
},
disconnectDataService: function() {
this.cellSvcConnectRequest ? (this.cellSvcConnectRequest.cancel(), this.cellSvcConnectRequest = null) : this.log("wanDisconnectServiceRequest already disconnected");
},
monitor: function() {
this._started || this._startup();
},
isOnline: function() {
if (enyo.application.onBrowser) return !0;
if (this._online === undefined) throw new Error("ConnectionManager is not monitoring status");
return this._online;
},
isOn1x: function() {
return this._1x;
},
cleanup: function() {},
destroy: function() {
this.disconnectDataService(), this.inherited(arguments);
}
});

// lib/services/systemproperties.js

enyo.kind({
name: "findApps.SystemProperties",
kind: "PalmService",
service: "palm://com.palm.preferences/systemProperties/",
getCarrier: function(a, b) {
var c = {
key: "com.palm.properties.DMCARRIER"
}, d = {
method: "Get",
onSuccess: a,
onFailure: b
};
this.log("systemProperties: getCarrier: params ", c, " props: ", d), this.call(c, d);
}
});

// lib/hacks.js

var HACKS = {
HACK_ENYO_DEFAULT_GUI_EVENT_HANDLER: function a(a) {
var b = enyo.master, c = a && b.getComponents(), d = c ? c.length : 0, e = -1;
while (++e < d && c[e] != a) b.removeComponent(c[e]), b.addComponent(c[e]);
}
};

// lib/download/appdownloadmanager.js

enyo.kind({
name: "findApps.AppDownloadManager",
kind: enyo.Component,
APP_ADDED: 0,
APP_DELETED: 1,
APP_UPDATED: 2,
MYAPPS_ALL: 3,
UPDATELIST_ALL: 4,
components: [ {
name: "registerServerStatus",
kind: "PalmService",
service: "palm://com.palm.bus/signal/"
}, {
name: "appinstallservice",
kind: "findApps.AppInstallService"
}, {
name: "downloadService",
kind: "PalmService"
}, {
name: "appStates_Initial",
kind: "findApps.AppState.Initial"
}, {
name: "appStates_Pausing",
kind: "findApps.AppState.Pausing"
}, {
name: "appStates_InitiatingDownload",
kind: "findApps.AppState.InitiatingDownload"
}, {
name: "appStates_Resuming",
kind: "findApps.AppState.Resuming"
}, {
name: "appStates_Removing",
kind: "findApps.AppState.Removing"
}, {
name: "appStates_Canceling",
kind: "findApps.AppState.Canceling"
}, {
name: "appStates_Download",
kind: "findApps.AppState.Download"
}, {
name: "appStates_Downloading",
kind: "findApps.AppState.Downloading"
}, {
name: "appStates_Paused",
kind: "findApps.AppState.Paused"
}, {
name: "appStates_DownloadFailed",
kind: "findApps.AppState.DownloadFailed"
}, {
name: "appStates_Purchasing",
kind: "findApps.AppState.Purchasing"
}, {
name: "appStates_Purchased",
kind: "findApps.AppState.Purchased"
}, {
name: "appStates_PurchaseFailed",
kind: "findApps.AppState.PurchaseFailed"
}, {
name: "appStates_PurchasePending",
kind: "findApps.AppState.PurchasePending"
}, {
name: "appStates_Installing",
kind: "findApps.AppState.Installing"
}, {
name: "appStates_Installed",
kind: "findApps.AppState.Installed"
}, {
name: "appStates_UpdateAvailable",
kind: "findApps.AppState.UpdateAvailable"
}, {
name: "appStates_InstallFailed",
kind: "findApps.AppState.InstallFailed"
}, {
name: "downloadStateManager",
kind: "findApps.DownloadStateManager"
} ],
create: function() {
this.inherited(arguments), this._myApps = new Object, this._revertableApps = new Object, this._activeQueue = new Object, this._observers = [], this._allow1xDownload = !1, this._myAppsListIsReady = 2;
},
destroy: function() {
this._myApps = null, this._revertableApps = null, this._activeQueue = null, this._observers = null, this.inherited(arguments);
},
init: function() {
this.$.registerServerStatus.call({
serviceName: "com.palm.appInstallService"
}, {
onSuccess: "_appInstallerServiceSignalCB",
onFailure: "genericFailure"
}), this.$.registerServerStatus.call({
serviceName: "com.palm.applicationManager"
}, {
onSuccess: "_appManagerServiceSignalCB",
onFailure: "genericFailure"
}), this.$.registerServerStatus.call({
serviceName: "com.palm.downloadmanager"
}, {
onSuccess: "_appDownloadServiceSignalCB",
onFailure: "genericFailure"
});
},
start: function() {
this._myApps = new Object, this._revertableApps = new Object, this._myAppsListIsReady = 2, findApps.ApplicationManager.getInstance().getInstalledApplications_V2("getInstalledApplicationsSuccess", "genericFailure", this);
},
_appInstallerServiceSignalCB: function(a, b) {
b.connected == 1 ? this.start() : b.connected != 0;
},
_appManagerServiceSignalCB: function(a, b) {
b.connected == 1 ? findApps.ApplicationManager.getInstance().launchPointChanges("launchPointChangesSuccess", "genericFailure", this) : b.connected != 0;
},
launchPointChangesSuccess: function(a, b) {
this._updateInstalledQueue(b);
},
genericFailure: function(a, b) {
this.error("appdownloadmanager: service failed: ", a, b);
},
_appDownloadServiceSignalCB: function(a, b) {
b.connected == 1 ? this._allow1xDownload && this.allow1xDownload(!0) : b.connected != 0;
},
getInstalledApplicationsSuccess: function(a, b) {
this.log("getInstalledApplicationsSuccess ", b);
var c = [], d = this;
this.$.appinstallservice.status("_appInstallServiceStatusCB", "genericFailure");
var e = b.packages;
e = e ? e instanceof Array ? e : [ e ] : [], this.createComponent({
kind: "WebService"
}), this.$.webService.call(null, {
url: "/usr/palm/ipkgs/manifest.json",
handleAs: "json",
onResponse: "manifestLoaded"
}), this.manifestLoaded = function(a, b) {
c = b || [], d.$.webService.destroy();
for (var f = 0; f < c.length; f++) d._revertableApps[c[f].id] = c[f];
for (var f = 0; f < e.length; f++) if (e[f].userInstalled || e[f].apps[0] && e[f].apps[0].userInstalled || d._revertableApps[e[f].id]) {
var g = d.getAppDownload(e[f].id);
g.updateFromInstalledAppsList(e[f]);
}
d._sendMyAppsListIsReady();
for (var f = 0; f < d._observers.length; f++) d._observers[f].updateInstalledApps && d._observers[f].updateInstalledApps();
};
},
myAppsListIsReady: function() {
return this._myAppsListIsReady == 0;
},
_sendMyAppsListIsReady: function() {
this._myAppsListIsReady--;
if (this._myAppsListIsReady == 0) for (var a = 0; a < this._observers.length; a++) this._observers[a].updateMyApps && this._observers[a].updateMyApps(null, this.MYAPPS_ALL);
},
getAppDownload: function(a, b) {
var c = this._myApps[a];
c || (c = this._activeQueue[a]);
if (!c) {
var c = this.createComponent({
kind: findApps.AppDownload,
owner: this,
publicApplicationId: a
});
c.attach(this), this._activeQueue[a] = c;
}
return b && c.attach(b), c;
},
releaseAppDownload: function(a, b) {
var c = this._myApps[a];
c || (c = this._activeQueue[a]), c.detach(b), c == this._activeQueue[a] && c._observers.length == 1 && delete this._activeQueue[a];
},
_updateInstalledQueue: function(a) {
if (a && (a.change == "added" || a.change == "removed" || a.change == "updated")) {
var b = this._myApps[a.packageId];
b && b.updateFromInstallNotification(a);
}
},
getInstalledApp: function(a) {
var b = this._myApps[a];
return b && b.installedVersion ? b : null;
},
getMyApps: function() {
return this._myApps;
},
attach: function(a) {
this._observers.push(a);
},
detach: function(a) {
for (var b = 0; b < this._observers.length; b++) this._observers[b] === a && this._observers.splice(b, 1);
},
updateDownloadState: function(a) {
var b = null;
a.saveToMyApps() && !this._myApps[a.publicApplicationId] ? (this._myApps[a.publicApplicationId] = a, b = this.APP_ADDED, delete this._activeQueue[a.publicApplicationId]) : a.removeFromMyApps() && this._myApps[a.publicApplicationId] ? (delete this._myApps[a.publicApplicationId], b = this.APP_DELETED, a._observers.length > 1 && (this._activeQueue[a.publicApplicationId] = a)) : this._myApps[a.publicApplicationId] && (b = this.APP_UPDATED);
if (b != null) for (var c = 0; c < this._observers.length; c++) this._observers[c].updateMyApps && this._observers[c].updateMyApps(a, b);
},
_appInstallServiceStatusCB: function(a, b) {
this.log("appdownloadmanager: _appInstallServiceStatusCB ", b);
var c = undefined, d = undefined, e = [];
b.status && b.status.apps ? (c = !0, d = !1, e = b.status.apps) : (c = !0, d = !0, e = [ b ]);
if (!c) return;
for (var f = 0; f < e.length; f++) {
var g = this.getAppDownload(e[f].id);
g.updateFromStatus(e[f].id, e[f].details);
}
d || this._sendMyAppsListIsReady();
},
belongToMyApp: function(a) {
return this._myApps[a];
},
isRevertable: function(a) {
return this._revertableApps[a] ? !0 : !1;
},
getDetailsRevertableApp: function(a) {
return this._revertableApps[a];
},
allow1xDownload: function(a, b) {
var c = this;
this.onSuccess = function(d, e) {
c._allow1xDownload = a, b && b(!0);
}, this.onFailure = function(a, c) {
this.error("AppDownloadManager.allow1xDownload failed ", c), b && b(!1);
}, this.$.downloadService.setService("palm://com.palm.downloadmanager/"), this.$.downloadService({
value: a
}, {
method: "allow1x",
OnSuccess: "onSuccess",
OnFailure: "onFailure"
});
},
canAllow1xDownload: function() {
return this._allow1xDownload;
},
cleanup: function() {
this._allow1xDownload && this.allow1xDownload(!1);
}
});

// lib/download/applists.js

enyo.kind({
name: "findApps.AppLists",
kind: enyo.Component,
ADDED: 0,
DELETED: 1,
UPDATED: 2,
MYAPPS_ALL: 3,
UPDATELIST_ALL: 4,
ERROR: 5,
create: function() {
this.inherited(arguments), this._apps = new Object, this._other = new Object, this._updates = new Object, this._myUpdates = new Object, this._observers = [], this.appdownloadmgr = enyo.application.appdownloadManager, this.appdownloadmgr.attach(this), this._allListsReady = 1, this._updateListReady = 1, this._updateListError = 1, this._initMyApps();
},
destroy: function() {
this.appdownloadmgr && this.appdownloadmgr.detach(this), this._observers = null, this._apps = null, this._other = null, this._updates = null, this._myAppsHash = null, this._myUpdates = null, this.inherited(arguments);
},
_initMyApps: function() {
this._other.items = [], this._apps.items = [], this._myUpdates.items = [];
if (!this.appdownloadmgr.myAppsListIsReady()) return;
this._myAppsHash = this.appdownloadmgr.getMyApps();
for (var a in this._myAppsHash) this._myAppsHash[a].appType === "app" ? this._apps.items.push(this._myAppsHash[a]) : this._other.items.push(this._myAppsHash[a]);
this._apps.items.sort(function(a, b) {
return a.title.toLowerCase() == b.title.toLowerCase() ? 0 : a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
}), this._other.items.sort(function(a, b) {
return a.title.toLowerCase() == b.title.toLowerCase() ? 0 : a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
}), this._sendAllListsReady(), this._fetchUpdates();
},
allListsReady: function() {
return this._allListsReady == 0;
},
updateListReady: function() {
return this._updateListReady == 0;
},
updateListError: function() {
return this._updateListError == 0;
},
getAppsList: function() {
return this._apps;
},
getOtherList: function() {
return this._other;
},
getUpdatesList: function() {
return this._myUpdates;
},
_sendAllListsReady: function() {
this._allListsReady--;
if (this._allListsReady == 0) for (var a = 0; a < this._observers.length; a++) this._observers[a].updateLists && this._observers[a].updateLists(null, this.MYAPPS_ALL);
},
_sendUpdateListReady: function() {
this._updateListReady--;
if (this._updateListReady == 0) for (var a = 0; a < this._observers.length; a++) this._observers[a].updateLists && this._observers[a].updateLists("updates", this.UPDATELIST_ALL);
},
_sendError: function() {
this.error("Error in getting updates"), this._updateListError--;
if (this._updateListError == 0) for (var a = 0; a < this._observers.length; a++) this._observers[a].updateLists && this._observers[a].updateLists("updates", this.ERROR);
},
updatescb: function(a, b, c, d, e) {
if (!e || e.length == 0) {
var f = [];
if (b && b.OutUpdateInfoList) {
var g = b.OutUpdateInfoList.appSummaryForUpdates;
f = g ? g instanceof Array ? g : [ g ] : [];
}
for (var h = 0; h < f.length; h++) this._myAppsHash[f[h].publicApplicationId] && this._myAppsHash[f[h].publicApplicationId].updateFromServerUpdatesList(f[h]);
this._sendUpdateListReady();
} else this._sendError();
},
_fetchUpdates: function() {
var a = [];
for (var b in this._myAppsHash) this._myAppsHash[b].isInstalled() && a.push(b);
if (a.length == 0) return;
var c = {
onResponse: "updatescb",
scope: this
};
findApps.BaseServer.getACServer().getListOfUpdatableApps(a, "appupdatesService", c);
},
updateMyApps: function(a, b) {
if (!this.appdownloadmgr.myAppsListIsReady()) return;
b == this.appdownloadmgr.APP_ADDED ? a.appType == "app" ? this.addApp(a, this._apps, "app") : this.addApp(a, this._other, "other") : b == this.appdownloadmgr.APP_DELETED ? a.appType == "app" ? this.deleteApp(a, this._apps, "app") : this.deleteApp(a, this._other, "other") : b == this.appdownloadmgr.APP_UPDATED ? a.appType == "app" ? this.updateApp(a, this._apps, "app") : this.updateApp(a, this._other, "other") : b == this.appdownloadmgr.MYAPPS_ALL && this._initMyApps();
},
addApp: function(a, b, c) {
var d = this.binarySearch(b.items, a, !0);
if (d >= 0) if (b.items.length == d || b.items[d].publicApplicationId != a.publicApplicationId) {
b.items.splice(d, 0, a);
var e = this._observers.length;
for (var f = 0; f < e; f++) this._observers[f].updateLists && this._observers[f].updateLists(c, this.ADDED, a, d);
}
},
deleteApp: function(a, b, c) {
var d = this.binarySearch(b.items, a, !1);
if (d >= 0) {
b.items.splice(d, 1);
for (var e = 0; e < this._observers.length; e++) this._observers[e].updateLists && this._observers[e].updateLists(c, this.DELETED, a, d);
}
c != "updates" && this._updateMyUpdatesQueue(a);
},
updateApp: function(a, b, c) {
var d = this.binarySearch(b.items, a, !1);
if (d >= 0) {
for (var e = 0; e < this._observers.length; e++) this._observers[e].updateLists && this._observers[e].updateLists(c, this.UPDATED, a, d);
c != "updates" && this._updateMyUpdatesQueue(a);
}
},
binarySearch: function(a, b, c) {
if (b.title) {
var d = a.length - 1, e = 0, f, g = b.title.toLowerCase();
while (e <= d) {
f = e + d >> 1;
if (a[f].title.toLowerCase() < g) e = f + 1; else {
if (a[f].title.toLowerCase() == g) {
if (a[f].publicApplicationId == b.publicApplicationId) return f;
var h = f - 1;
while (h >= 0 && a[h].title == b.title) {
if (a[h].publicApplicationId == b.publicApplicationId) return h;
h--;
}
var h = f + 1;
while (h < a.length && a[h].title == b.title) {
if (a[h].publicApplicationId == b.publicApplicationId) return h;
h++;
}
return c ? f : -1;
}
d = f - 1;
}
}
return c ? e : -1;
}
return -1;
},
serialSearch: function(a, b) {
for (var c = 0; c < a.length; c++) if (a[c].publicApplicationId === b) return c;
},
_updateMyUpdatesQueue: function(a) {
var b = a.stateToString(), c = this.binarySearch(this._myUpdates.items, a, !1);
a.canInstallUpdate() && c < 0 ? this.addApp(a, this._myUpdates, "updates") : c >= 0 && (b == "findApps.AppState.Installed" || b == "findApps.AppState.InstallFailed" || b == "findApps.AppState.DownloadFailed" || b == "findApps.AppState.Download") ? this.deleteApp(a, this._myUpdates, "updates") : c >= 0 && this.updateApp(a, this._myUpdates, "updates");
},
attach: function(a) {
this._observers.push(a);
},
detach: function(a) {
for (var b = 0; b < this._observers.length; b++) this._observers[b] === a && this._observers.splice(b, 1);
}
});

// lib/download/appdownload.js

enyo.kind({
name: "findApps.AppDownload",
kind: enyo.Component,
_defaultState: "findApps.AppState.Initial",
create: function() {
this.inherited(arguments), this._observers = [], this._progressPillModel = {}, this.enableSave = !0, this._setState(this._defaultState);
},
destroy: function() {
this._observers = null, this.inherited(arguments);
},
updateFromServer: function(a) {
var b;
a.attributes && !a.attributes.provides.noApp ? b = "app" : b = "other";
var c = {
id: a.id,
publicApplicationId: a.publicApplicationId,
title: a.title,
iconUrl: a.appIcon,
purchasedVersion: a.purchasedVersion,
serverVersion: a.version,
packageSize: a.appSize,
installSize: a.installSize,
isEncrypted: a.isEncrypted,
currency: a.currency,
priceType: a.priceType,
price: a.price,
sku: a.sku,
paymentCategory: a.paymentCategory,
vendor: a.creator,
vendorid: a.vendorid,
vendorUrl: a.homeURL,
vendorCity: a.vendorCity,
vendorRegion: a.vendorRegion,
vendorCountry: a.vendorCountry,
islocationbased: a.islocationbased,
packageUrl: a.appLocation,
appType: b,
services: a.attributes && a.attributes.provides.services,
dockMode: a.attributes && a.attributes.provides.dockMode,
universalSearch: a.attributes.provides.universalSearch,
accounts: a.attributes.provides.connectors
};
enyo.mixin(this, c), this._state.updateFromServer && this._state.updateFromServer(this);
},
updateFromInstalledAppsList: function(a) {
var b, c = !1, d = !1;
if (a.apps && a.apps.length > 0) {
b = "app";
for (var e = 0; e < a.apps.length; e++) a.apps[e].dockMode && (c = !0), a.apps[e].universalSearch && (d = !0);
} else b = "other";
var f = a.loc_name ? a.loc_name : a.apps.length > 0 ? a.apps[0].title : undefined, g = a.icon ? a.icon : a.apps.length > 0 ? a.apps[0].icon : undefined, h = a.vendor ? a.vendor : a.apps.length > 0 ? a.apps[0].vendor : undefined, i = {
publicApplicationId: a.id,
title: f,
installedVersion: a.version,
icon: g ? g : this.icon,
appType: b,
installSize: a.size,
vendor: h,
services: a.services,
accounts: a.accounts,
dockMode: c,
universalSearch: d
};
enyo.mixin(this, i), this._state.updateFromInstalledAppsList && this._state.updateFromInstalledAppsList(this);
},
updateFromServerUpdatesList: function(a) {
var b = {
id: a.id,
serverVersion: a.appVersion,
packageUrl: a.packageUrl,
vendor: a.vendor,
vendorUrl: a.homeURL,
iconUrl: a.appIcon,
packageSize: a.appSize,
installSize: a.installSize
};
enyo.mixin(this, b), this._state.updateFromServerUpdatesList && this._state.updateFromServerUpdatesList(this);
},
updateFromInstallNotification: function(a) {
if (a.change == "added" || a.change == "updated" && a.version && this.installedVersion != a.version) {
if (!this.installSize) var b = {
installSize: a.size
};
enyo.mixin(this, b), this.setState(this._state + "");
}
},
updateFromStatus: function(a, b) {
var c, d = b.state;
this.log("appdownload: updateFromStatus: new state and app id ", d, a);
if (d == "removing" || d == "unknown") return;
if (d == "installed") {
var e = {
publicApplicationId: a,
installedVersion: b.version
};
enyo.mixin(this, e);
} else if (d == "removed") {
this._state._remove && this._state._remove(this);
return;
}
if (d == "icon download complete" || d == "icon download current") b.progress = 0;
d == "ipk download complete" && (b.progress = 100), d == "install failed" ? this.errorCode = b.reason : d == "download failed" ? this.errorCode = b.errorCode + "" : this.errorCode = b.errorCode, b.noApp && b.noApp === !0 ? c = "other" : c = "app";
var e = {
publicApplicationId: a,
title: b.title,
progress: b.progress,
serverVersion: b.version,
vendor: b.vendor,
vendorUrl: b.vendorUrl,
icon: this.icon ? this.icon : b.iconUrl,
appType: c,
dockMode: b.dockMode,
universalSearch: b.universalSearch,
services: b.services,
accounts: b.accounts
};
enyo.mixin(this, e);
if (d == "canceled" || d == "remove failed") this._state._reset && this._state._reset(this); else {
if (this._state._allowTransition && !this._state._allowTransition(d)) return;
this.setState(findApps.AppDownload.map2AppState(d));
}
},
updateFromAppList: function(a) {
var b = {};
a.publicApplicationId && (b.publicApplicationId = a.publicApplicationId), a.price && (b.price = a.price), a.title && (b.title = a.title), enyo.mixin(this, b);
},
setState: function(a, b) {
this._setState(a, b);
for (var c = 0; c < this._observers.length; c++) this._observers[c].updateDownloadState && this._observers[c].updateDownloadState(this);
},
_setState: function(a, b) {
var c = a.slice(a.lastIndexOf(".") + 1);
this._state = this.owner.$["appStates_" + c], this._state.init(this, b);
},
getProgressPillModel: function() {
return this._progressPillModel;
},
getFormattedPrice: function() {
var a = this.price;
if (a == "n/a" || a == "N/A") return a;
if (a === "Free" || findApps.BaseServer.isPurchased(this.publicApplicationId)) return $L("FREE");
var b = parseFloat(a), c = findApps.UserSession.getActivationCountry();
return findApps.Utilities.Formatter.formatCurrency(b, c);
},
attach: function(a) {
this._observers.push(a);
},
detach: function(a) {
for (var b = 0; b < this._observers.length; b++) this._observers[b] === a && this._observers.splice(b, 1);
},
install: function() {
this._state.install && this._state.install(this);
},
installUpdate: function() {
this._state.installUpdate && this._state.installUpdate(this);
},
canInstallUpdate: function() {
return this._state.installUpdate ? !0 : !1;
},
cancelDownload: function() {
this._state.cancelDownload && this._state.cancelDownload(this);
},
pauseDownload: function() {
this._state.pauseDownload && this._state.pauseDownload(this);
},
cancelPausedDownload: function() {
this._state.cancelPausedDownload && this._state.cancelPausedDownload(this);
},
resumeDownload: function() {
this._state.resumeDownload && this._state.resumeDownload(this);
},
launch: function() {
this._state.launch && this._state.launch(this);
},
uninstall: function() {
this._state.uninstall && this._state.uninstall(this);
},
defaultAction: function() {
this._state.defaultAction && this._state.defaultAction(this);
},
myAppsDefaultAction: function() {
this._state.myAppsDefaultAction && this._state.myAppsDefaultAction(this);
},
isInstalled: function() {
var a = this.owner.getInstalledApp(this.publicApplicationId);
return a ? !0 : !1;
},
stateToString: function() {
return this._state + "";
},
toString: function() {
return "id:" + this.id + "enableSave:" + this.enableSave + " publicApplicationId:" + this.publicApplicationId + ", state:" + this.stateToString() + ", title:" + this.title + ", serverVersion:" + this.serverVersion + ", installedVersion:" + this.installedVersion + ", purchasedVersion:" + this.purchasedVersion + ", errorCode:" + this.errorCode + ", icon:" + this.icon + ", updateClass:" + this.updateClass + ", activeClass:" + this.activeClass + ", resumeClass:" + this.resumeClass + ", pauseClass:" + this.pauseClass + " warningClass:" + this.warningClass + ", packageSize:" + this.packageSize + " installSize: " + this.installSize + " appType: " + this.appType + "services" + this.servcies + "accounts" + this.accounts + "dockMode" + this.dockMode + "universalSearch" + this.universalSearch;
},
saveToMyApps: function() {
return this._state.saveToMyApps ? this._state.saveToMyApps() : !1;
},
removeFromMyApps: function() {
return this._state.removeFromMyApps ? this._state.removeFromMyApps() : !1;
},
getAppDeleteDialogInfo: function() {
var a, b, c, d, e = [];
this.appType !== undefined && this.appType == "app" ? (b = $L("Delete application?"), a = "application") : (b = $L("Delete this item?"), a = "item");
if (this.owner.isRevertable(this.publicApplicationId) || this.removable === "false") d = !1, a === "application" ? c = $L("This application cannot be deleted from your phone.") : c = $L("This item cannot be deleted from your phone."); else {
this.accounts !== undefined && this.accounts instanceof Array && this.accounts.length > 0 && (e[e.length] = $L("\u2022Related accounts & data")), this.dockMode !== undefined && this.dockMode === !0 && (e[e.length] = $L("\u2022Dock components")), this.universalSearch !== undefined && this.universalSearch !== !1 && (this.universalSearch === !0 || this.universalSearch !== "") && (e[e.length] = $L("\u2022Universal Search plugins"));
if (e.length < 1) a === "application" ? c = $L("Are you sure you want to delete this application from your phone?") : c = $L("Are you sure you want to delete this item from your phone?"); else {
d = !0;
if (a === "application") {
c = $L("Deleting #{appName} also removes:").interpolate({
appName: this.title
}) + "<br>";
for (var f = 0; f < e.length; f++) c += e[f] + "<br>";
} else {
c = $L("Deleting this item removes:") + "<br>";
for (var f = 0; f < e.length; f++) c += e[f] + "<br>";
}
}
}
return {
deleteTitle: b,
deleteMessage: c,
removable: d
};
},
setPromoLink: function(a) {
this.promoLink = a;
}
}), findApps.AppDownload.map2AppState = function(a) {
var b = "findApps.AppState.Initial";
switch (a) {
case "icon download current":
b = "findApps.AppState.Downloading";
break;
case "icon download complete":
b = "findApps.AppState.Downloading";
break;
case "icon download paused":
b = "findApps.AppState.Paused";
break;
case "ipk download current":
b = "findApps.AppState.Downloading";
break;
case "ipk download complete":
b = "findApps.AppState.Downloading";
break;
case "ipk download paused":
b = "findApps.AppState.Paused";
break;
case "installing":
b = "findApps.AppState.Installing";
break;
case "installed":
b = "findApps.AppState.Installed";
break;
case "removing":
b = "findApps.AppState.Removing";
break;
case "removed":
b = "findApps.AppState.Download";
break;
case "canceled":
b = "findApps.AppState.Download";
break;
case "download failed":
b = "findApps.AppState.DownloadFailed";
break;
case "install failed":
b = "findApps.AppState.InstallFailed";
}
return b;
};

// lib/download/DownloadStateManager.js

enyo.kind({
name: "findApps.DownloadStateManager",
kind: enyo.Control,
components: [ {
name: "appinstallservice",
kind: "findApps.AppInstallService"
}, {
name: "applicationinstaller",
kind: "findApps.ApplicationInstaller"
}, {
name: "userAuthenticator",
kind: "findApps.UserAuthenticator"
} ],
_1xCarrierDialog: function(a) {
var b = "";
return a ? a == "sprint" && (b = this._createPopup($L("No 3G Data Network"), $L("The app will download slowly because a high-speed network is not available. You can download later when you have a 3G or Wi-Fi data connection. If you paid for the app, you will not be charged again."), $L("Download Now"), $L("Download Later"))) : b = this._createPopup($L("No 3G Data Network"), $L("You will be unable to receive phone calls while the application is downloading. You can download later when you have a 3G or Wi-Fi data connection. If you paid for the app, you will not be charged again."), $L("Download Now"), $L("Download Later")), b;
},
create: function() {
this.inherited(arguments);
var a = findApps.ViewLibrary._container;
a && a.registerObserver && a.registerObserver("resize", this);
},
update: function(a) {
a == "resize" && this.$.promocodeeditor && this.$.promocodeeditor.isOpen && this.$.promocodeeditor.resizeHandler();
},
_createPopup: function(a, b, c, d) {
var e = findApps.Utilities.getRandNumber();
return this.createComponent({
kind: "ModalDialog",
modal: !0,
scrim: !0,
name: "popupPrompt" + e,
components: [ {
className: "",
content: a,
className: "enyo-text-header",
style: "text-align:center;"
}, {
className: "",
content: b,
className: "enyo-paragraph"
}, {
kind: "VFlexBox",
style: "padding-top: 6px;",
components: [ {
kind: "Button",
className: "enyo-button-affirmative",
value: "submit",
caption: c,
onclick: "submit" + e
}, {
kind: "Button",
className: "enyo-button-light",
value: "cancel",
caption: d,
onclick: "submit" + e
} ]
} ],
owner: this
}), e;
},
_verifyPaymentSetupSuccess: function(a, b, c, d) {
findApps.UserProfile.validPayment = b, d.callback(!0, b);
},
_verifyPaymentSetupFailure: function(a, b, c, d, e) {
d.callback(!1, b, e);
},
_verifyPaymentSetup: function(a) {
findApps.BaseServer.getPMTServer().verifyPaymentSetup("DsVerifyPaymentSvc", {
onSuccess: "_verifyPaymentSetupSuccess",
onFailure: "_verifyPaymentSetupFailure",
scope: this,
callback: a
});
},
_getPromoFromDBExt: function(a) {
a(!0, enyo.getCookie("findapps.promocode"));
},
_savePromoFromDBExt: function(a) {
enyo.setCookie("findapps.promocode", a);
},
_capturePaymentPromoSuccess: function(a, b, c, d) {
var e = d.app;
e.setState("findApps.AppState.Purchased", {
version: e.serverVersion,
transitional: !0
}), b && b.OutCapturePayment && b.OutCapturePayment.promoCodeStatus == "R" && enyo.setCookie("findapps.promocode", ""), d.callback(!0);
},
_capturePaymentPromoFailure: function(a, b, c, d, e) {
var f = d.app;
f.setState("findApps.AppState.PurchaseFailed", {
errorStack: e
});
},
_purchaseWithPromoCode: function(a, b, c, d) {
var e = a, f = new Date, g = "" + f.getMilliseconds();
while (g.length < 3) g = "0" + g;
var h = findApps.Utilities.Formatter.serverTimeFormat(f) + g, i = {
timestamp: h,
currency: e.currency,
items: [ {
type: e.priceType,
promoCode: b,
quantity: "1",
sku: e.sku,
unitPrice: e.price
} ]
};
a.setState("findApps.AppState.Purchasing"), findApps.BaseServer.getPMTServer().capturePayment(i, "DsCapturePaymentSvc", {
onSuccess: "_capturePaymentPromoSuccess",
onFailure: "_capturePaymentPromoFailure",
scope: this,
app: a,
callback: d
});
},
_gotoPromoCodeDialog: function(a, b, c, d, e, f) {
var g = this;
this.promoCodeConfirmed = function(b, c) {
c.promoCodeValid ? g.owner.$.downloadStateManager._purchaseWithPromoCode(a, c.promoCode, d, f) : g.owner.$.downloadStateManager._makePurchase(a, d, e, f), i.close(), i.destroy();
}, this.promoCodeCanceled = function() {
i.close(), i.destroy(), a.setState("findApps.AppState.Download"), f(!1);
};
var h = {
appid: a.publicApplicationId,
version: a.serverVersion,
title: a.title,
promoCode: b,
errCode: c
};
this.$.promocodeeditor == undefined && this.createComponent({
lazy: !1,
name: "promocodeeditor",
kind: "findApps.PromoCodePrompt",
onPromoCodeConfirmed: "promoCodeConfirmed",
onPromoCodeCanceled: "promoCodeCanceled",
owner: this
});
var i = this.$.promocodeeditor;
i.setParams(h), i.render(), i.openAtCenter(), i.focusPromoInput();
},
_checkPromoCodeStatusSuccess: function(a, b, c, d) {
var e = d.app, f = d.force, g = d.callback, h = d.promoCode, i = d.errorCode, j = d.gotoPromoCodeEditor, k = d.delPromoCode;
if (b && b.OutCheckPromoCodeStatus) if (b.OutCheckPromoCodeStatus.valid == "true") this.owner.$.downloadStateManager._purchaseWithPromoCode(e, h, b, g); else if (b.OutCheckPromoCodeStatus.valid == "false") {
j = !0, i = b.OutCheckPromoCodeStatus.errorCode;
if (i == "PMTPROMO70101" || i == "PMTPROMO70102" || i == "PMTPROMO70103" || i == "PMTPROMO70104") k = !0;
}
j && this.owner.$.downloadStateManager._gotoPromoCodeDialog(e, h, i, b, f, g), k && this.owner.$.downloadStateManager._savePromoFromDBExt("");
},
_checkPromoCodeStatusFailure: function(a, b, c, d, e) {
var f = d.app, g = d.force, h = d.callback, i = d.promoCode, j = d.errorCode;
b.JSONException && b.JSONException.errorCode && (j = b.JSONException.errorCode), this.owner.$.downloadStateManager._gotoPromoCodeDialog(f, i, j, b, g, h), this.owner.$.downloadStateManager._savePromoFromDBExt("");
},
_verifyPromoCode: function(a, b, c, d) {
var e = this, f = !1, g = !1, h = "", i = "";
e.owner.$.downloadStateManager._getPromoFromDBExt(function(j, k) {
i = k, i != undefined && i != "" ? findApps.BaseServer.getPMTServer().checkPromoCodeStatus(i, a.publicApplicationId, a.serverVersion, "DsCheckPromoCodeSvc", {
onSuccess: "_checkPromoCodeStatusSuccess",
onFailure: "_checkPromoCodeStatuscbFailure",
scope: e,
app: a,
force: c,
callback: d,
promoCode: i,
errorCode: h,
gotoPromoCodeEditor: f,
delPromoCode: g
}) : (i = "", h = "", e.owner.$.downloadStateManager._gotoPromoCodeDialog(a, i, h, b, c, d));
});
},
_makePurchase: function(a, b, c, d) {
var e = this, f = b.OutGetPaymentInfos.ccPaymentInfos && b.OutGetPaymentInfos.ccPaymentInfos.length > 0 ? b.OutGetPaymentInfos.ccPaymentInfos[0] : null, g = b.OutGetPaymentInfos.obPaymentInfos && b.OutGetPaymentInfos.obPaymentInfos.length > 0 ? b.OutGetPaymentInfos.obPaymentInfos[0] : null;
c && (c == "cc" ? g = null : f = null), f && g && (f["default"] ? g = null : f = null);
if (f) a.paymentType = "cc"; else if (g) a.paymentType = "ob"; else {
a.setState("findApps.AppState.Download"), d(!1);
return;
}
if (!enyo.application.connectionManager.isOnline()) {
a.setState("findApps.AppState.Download"), d(!1);
return;
}
var h = f ? "credit card" : "carrier account", i = findApps.Utilities.getRandNumber();
this["confirmPurchase" + i] = function() {
e.$["purchaseconfirm" + i].close(), e.cleanupInMakePurchase(i), a.setState("findApps.AppState.Purchasing"), g ? e._startOBPayment(a, g, d) : e._capturePayment(a, f, d);
}, this["confirmPromo" + i] = function() {
e.$["purchaseconfirm" + i].close(), e.cleanupInMakePurchase(i), e.owner.$.downloadStateManager._verifyPromoCode(a, b, c, d);
}, this["cancelDialog" + i] = function() {
e.$["purchaseconfirm" + i].close(), e.cleanupInMakePurchase(i), a.setState("findApps.AppState.Download"), d(!1);
}, this.cleanupInMakePurchase = function(a) {
e.$["purchaseconfirm" + a] && e.$["purchaseconfirm" + a].destroy(), findApps.Utilities.delFunc(e, "confirmPurchase", a), findApps.Utilities.delFunc(e, "confirmPromo", a), findApps.Utilities.delFunc(e, "cancelDialog", a);
}, this.createComponent({
lazy: !1,
name: "purchaseconfirm" + i,
kind: "findApps.PurchaseConfirmPrompt",
account: h,
title: a.title,
onPurchase: "confirmPurchase" + i,
onPromo: "confirmPromo" + i,
onCancel: "cancelDialog" + i,
owner: this
}), this.$["purchaseconfirm" + i].render(), this.$["purchaseconfirm" + i].openAtCenter();
},
_initOBSessionSuccess: function(a, b, c, d) {
var e = d.app, f = d.ob, g = d.callback, h = d.obInfos;
this.log("xml", b);
var i = new DOMParser, j = i.parseFromString(b, "text/xml");
f.obSessionId = j.getElementsByTagName("session")[0].getAttribute("id"), f.devicePoll = h.devicePoll, this._capturePayment(e, f, g);
},
_initOBSessionFailure: function(a, b, c, d, e) {
var f = d.app, g, h;
b && b.getElementsByTagName && b.getElementsByTagName("error") && (g = b.getElementsByTagName("error")[0].getAttribute("code")), g && (e.push(g), g === 2045 || g === 2126 ? h = "PMT05213" : h = g ? "PMTINIT" + g : undefined, e.push("errCode:" + g), h && e.push(h)), f.setState("findApps.AppState.PurchaseFailed", {
errorStack: e
});
},
_getOBInfosSuccess: function(a, b, c, d) {
var e = d.app, f = d.ob, g = d.callback, h = b.OutGetOBInfos;
findApps.BaseServer.getPMTServer().initOBSession(h, "initOBSessioncb", {
onSuccess: "_initOBSessionSuccess",
onFailure: "_initOBSessionFailure",
scope: this,
app: e,
ob: f,
callback: g,
obInfos: h
});
},
_getOBInfosFailure: function(a, b, c, d, e) {
d.app.setState("findApps.AppState.PurchaseFailed", {
errorStack: e
});
},
_startOBPayment: function(a, b, c) {
findApps.BaseServer.getPMTServer().getOBInfos("", {
onSuccess: "_getOBInfosSuccess",
onFailure: "_getOBInfosFailure",
scope: this,
app: a,
ob: b,
callback: c
});
},
cleanupInCapturePayment: function(a) {
this.$["paymentserver" + a] && this.$["paymentserver" + a].destroy(), findApps.Utilities.delFunc(this, "capturePaymentFailure", a), findApps.Utilities.delFunc(this, "capturePaymentSuccess", a), this.$["temperror" + a] && this.$["temperror" + a].destroy(), findApps.Utilities.delFunc(this, "OnCancel", a);
},
_capturePaymentSuccess: function(a, b, c, d) {
var e = d.app, f = d.paymentInfo, g = d.callback;
if (f.devicePoll) {
var h = b.OutCapturePayment.orderNo, i = (new Date).getTime() + f.devicePoll.timeout * 1e3, j = f.devicePoll.period * 1e3;
this._pollForOrderStatus(e, h, i, j, g);
} else e.setState("findApps.AppState.Purchased", {
version: e.serverVersion,
transitional: !0
}), g(!0);
},
_capturePaymentFailure: function(a, b, c, d, e) {
var f = d.app;
e = [ "LOC04007" ];
var g = b && b.JSONException && b.JSONException.errorCode ? b.JSONException.errorCode : b;
g !== "" && e.push(g);
if (g === "PMT03037") {
f.setState("findApps.AppState.Purchased", {
version: f.serverVersion,
transitional: !0
}), f.install();
var h = findApps.Utilities.getRandNumber(), i = this;
this["OnCancel" + h] = function() {
i.cleanupInCapturePayment(h);
}, this.createComponent({
name: "temperror" + h,
kind: "findApps.Error",
onCancel: "OnCancel" + h,
owner: this
}).displayError(e);
} else f.setState("findApps.AppState.PurchaseFailed", {
errorStack: e
});
},
_capturePayment: function(a, b, c) {
var d = a, e = new Date, f = "" + e.getMilliseconds();
while (f.length < 3) f = "0" + f;
var g = findApps.Utilities.Formatter.serverTimeFormat(e) + f, h = {
paymentInfoId: b.paymentInfoId,
obSessionId: b.obSessionId,
timestamp: g,
currency: d.currency,
items: [ {
type: d.priceType,
quantity: "1",
sku: d.sku,
unitPrice: d.price
} ]
};
findApps.BaseServer.getPMTServer().capturePayment(h, "", {
onSuccess: "_capturePaymentSuccess",
onFailure: "_capturePaymentFailure",
scope: this,
app: a,
paymentInfo: b,
callback: c
});
},
cleanupPollForOrderStatus: function(a) {
this.$["paymentserver" + a] && this.$["paymentserver" + a].destroy(), findApps.Utilities.delFunc(this, "getOrderStatuscb", a), findApps.Utilities.delFunc(this, "getOrderStatuscbFailure", a);
},
_getOrderStatusSuccess: function(a, b, c, d) {
var e = d.app, f = d.orderNo, g = d.pollingEnds, h = d.pollingInterval, i = d.callback, j = [];
switch (b.OutGetOrderStatus.status) {
case "NEW":
case "RENEWED":
(new Date).getTime() < g ? setTimeout(this._pollForOrderStatus.bind(this, e, f, g, h, i), h) : (j.push("LOC04016"), e.setState("findApps.AppState.PurchasePending", {
errorStack: j
}), i(!1));
break;
case "CLOSED":
e.setState("findApps.AppState.Purchased", {
version: e.serverVersion,
transitional: !0
}), i(!0);
break;
case "DECLINED":
j.push("LOC04017"), j.push(b.OutGetOrderStatus.code || b), e.setState("findApps.AppState.PurchaseFailed", {
errorStack: j
});
break;
default:
j.push("LOC04018"), e.setState("findApps.AppState.PurchasePending", {
errorStack: j
});
}
},
_getOrderStatusFailure: function(a, b, c, d, e) {
var f = d.app;
e.push("LOC04019"), f.setState("findApps.AppState.PurchasePending", {
errorStack: e
});
},
_pollForOrderStatus: function(a, b, c, d, e) {
findApps.BaseServer.getPMTServer().getOrderStatus(b, "", {
onSuccess: "_getOrderStatusSuccess",
onFailure: "_getOrderStatusFailure",
scope: this,
app: a,
orderNo: b,
pollingEnds: c,
pollingInterval: d,
callback: e
});
},
_handleVerifyPayment: function(a, b, c, d) {
var e = this, f = d;
this.owner.$.downloadStateManager._verifyPaymentSetup(function(g, h, i) {
if (g) if (h.OutGetPaymentInfos.ccPaymentInfos && h.OutGetPaymentInfos.ccPaymentInfos.length > 0 || h.OutGetPaymentInfos.obPaymentInfos && h.OutGetPaymentInfos.obPaymentInfos.length > 0) b ? e.owner.$.downloadStateManager._makePurchase(a, h, null, d) : (e.owner.$.downloadStateManager.$.userAuthenticator.setNextView(undefined), e.owner.$.downloadStateManager.$.userAuthenticator.setCallback(function(b) {
b.passwordValid ? e.owner.$.downloadStateManager._makePurchase(a, h, c, d) : d(!1);
}), e.owner.$.downloadStateManager.$.userAuthenticator.showProfilePassword()); else if (findApps.UserProfile.promoLink) {
e.okHandler = function() {
j.close(), j.destroy(), findApps.UserProfile.promoLink = !1, this.showPaymentSetup(a, d, null);
};
var j = e.createComponent({
lazy: !1,
name: "promoCodeConfirm",
kind: "findApps.PromoCodeConfirmPrompt",
title: a.title,
onOK: "okHandler",
owner: e
});
j.render(), j.openAtCenter();
} else {
var k = findApps.ViewLibrary.getView("PREFERENCES");
k.setShowPaymentSetup(!0), k.setCallback(function(b) {
b.accountValid ? e.owner.$.downloadStateManager._handleVerifyPayment(a, !0, null, d) : d(!1);
});
} else {
e.owner.$.downloadStateManager.OnCancel = function(a, b) {
e.owner.$.downloadStateManager.$.temperror.destroy(), b == "help" && findApps.ApplicationManager.getInstance().openApplication("com.palm.app.help", {
target: enyo.application.connectionManager.isOnline() ? "http://help.palm.com/app_catalog/appcatalog_download_error.html" : "no-network"
});
}, e.owner.$.downloadStateManager.createComponent({
name: "temperror",
kind: "findApps.Error",
onSubmit: "OnCancel",
onCancel: "OnCancel",
owner: e.owner.$.downloadStateManager
}), i.push("LOC04006");
var l = "";
h.JSONException && h.JSONException.errorCode && (l = h.JSONException.errorCode, i.push(l)), e.owner.$.downloadStateManager.$.temperror.displayError(i), f(!1);
}
});
},
cleanupInHandleEmbargoAcc: function(a) {
this.$["temperror" + a] && this.$["temperror" + a].destroy(), findApps.Utilities.delFunc(this, "OnSubmit", a), findApps.Utilities.delFunc(this, "OnCancel", a);
},
_handleEmbargoAcc: function(a, b) {
var c = this, d = findApps.Utilities.getRandNumber();
if (findApps.UserProfile.isEmbargoed) {
var e = [ "LOC04008" ];
c["OnSubmit" + d] = function() {
findApps.ApplicationManager.getInstance().openApplication("com.palm.app.help", {
target: enyo.application.connectionManager.isOnline() ? "http://help.palm.com/app_catalog/appcatalog_download_error.html" : "no-network"
}), c.cleanupInHandleEmbargoAcc(d);
}, c["OnCancel" + d] = function() {
c.cleanupInHandleEmbargoAcc(d);
}, c.createComponent({
name: "temperror" + d,
kind: "findApps.Error",
onSubmit: "OnSubmit" + d,
onCancel: "OnCancel" + d,
owner: c
}).displayError(e), b(!1);
} else b(!0);
},
cleanupInCheckNotEmbargoed: function(a) {
this.$["paymentserver" + a] && this.$["paymentserver" + a].destroy(), findApps.Utilities.delFunc(this, "embargolistcb", a), findApps.Utilities.delFunc(this, "embargolistcbFailure", a), this.$["temperror" + a] && this.$["temperror" + a].destroy(), findApps.Utilities.delFunc(this, "OnCancel", a);
},
_embargolistSuccess: function(a, b, c, d) {
var e = d.app, f = d.callback, g = d.ext;
findApps.AccountServices.embargoedList = b.OutGetEmbargoedEmailExtensions.embargoedEmailExtensions, findApps.UserProfile.isEmbargoed = findApps.AccountServices.embargoedList.indexOf(g) !== -1, this._handleEmbargoAcc(e, f);
},
_embargolistFailure: function(a, b, c, d, e) {
e.push("LOC04005");
var f = findApps.Utilities.getRandNumber(), g = this;
this["OnCancel" + f] = function() {
g.cleanupInCheckNotEmbargoed(f);
}, this.createComponent({
name: "temperror" + f,
kind: "findApps.Error",
onCancel: "OnCancel" + f,
owner: this
}).displayError(e), d.callback(!1);
},
_checkNotEmbargoed: function(a, b) {
if (a.price > 0 || a.isEncrypted) if (findApps.UserProfile.isEmbargoed !== undefined) this._handleEmbargoAcc(a, b); else {
var c = findApps.UserProfile.email.substring(findApps.UserProfile.email.lastIndexOf(".") + 1);
findApps.AccountServices.embargoedList ? (findApps.UserProfile.isEmbargoed = findApps.AccountServices.embargoedList.indexOf(c) !== -1, this._handleEmbargoAcc(a, b)) : findApps.BaseServer.getPMTServer().getEmbargoedEmailExtensions("DSEmbargoedExtnsSvc", {
onSuccess: "_embargolistSuccess",
onFailure: "_embargolistFailure",
scope: this,
app: a,
callback: b,
ext: c
});
} else b(!0);
},
_forcePaymentType: function(a, b) {
var c = this, d = function(b) {
b ? c.owner.$.downloadStateManager._install(a) : a.setState("findApps.AppState.Download");
};
a.setState("findApps.AppState.Download"), b == "cc" ? findApps.UserProfile.validPayment.OutGetPaymentInfos.ccPaymentInfos && findApps.UserProfile.validPayment.OutGetPaymentInfos.ccPaymentInfos.length > 0 ? this._makePurchase(a, findApps.UserProfile.validPayment, "cc", d) : this.showPaymentSetup(a, d, "cc") : findApps.UserProfile.validPayment.OutGetPaymentInfos.obPaymentInfos && findApps.UserProfile.validPayment.OutGetPaymentInfos.obPaymentInfos.length > 0 ? this._makePurchase(a, findApps.UserProfile.validPayment, "ob", d) : this.showPaymentSetup(a, d, "ob");
},
showPaymentSetup: function(a, b, c) {
var d = findApps.ViewLibrary.getView("PREFERENCES");
d.setShowPaymentSetup(!0);
var e = this;
d.setCallback(function(d) {
d.accountValid ? e._handleVerifyPayment(a, !0, c, b) : b(!1);
});
},
cleanupInLocationServices: function(a) {
this.$["popupPrompt" + a] && this.$["popupPrompt" + a].destroy(), findApps.Utilities.delFunc(this, "submit", a);
},
_handleLocationServices: function(a, b) {
var c = this;
if (a.islocationbased) {
var d = this._createPopup($L("Location Services"), $L("This application will request your current location for some functions."), $L("Continue"), $L("Cancel"));
this["submit" + d] = function(a, e) {
c.$["popupPrompt" + d].close(), a.value == "submit" ? b(!0) : a.value == "cancel" && b(!1), c.cleanupInLocationServices(d);
}, this.$["popupPrompt" + d].render(), this.$["popupPrompt" + d].openAtCenter();
} else b(!0);
},
cleanupInValidateInstallSpace: function(a) {
findApps.Utilities.delFunc(this, "validateInstallSuccess", a), findApps.Utilities.delFunc(this, "validateInstallFailure", a), this.$["temperror" + a] && this.$["temperror" + a].destroy(), findApps.Utilities.delFunc(this, "OnSubmit", a), findApps.Utilities.delFunc(this, "OnCancel", a);
},
validateInstallSpace: function(a, b, c) {
var d = this, e = findApps.Utilities.getRandNumber();
d["validateInstallSuccess" + e] = function(a, b) {
d.log("In validateInstallSuccess ", b.result), b.result == 0 || b.result == 4 || enyo.application.onBrowser ? (c(!0), d.cleanupInValidateInstallSpace(e)) : d["validateInstallFailure" + e](a, b);
}, d["validateInstallFailure" + e] = function(a, f) {
d.error("validInstallFailure ", f);
var g;
f && f.spaceNeededInKB ? (g = parseInt(f.spaceNeededInKB), g = g >= 1024 ? findApps.Utilities.Formatter.formatRound2(g / 1024) + " " + $L("MB") : g + " " + $L("KB")) : g = $L("unknown MB"), d["OnSubmit" + e] = function() {
var a = enyo.application.connectionManager.isOnline();
findApps.ApplicationManager.getInstance().openApplication("com.palm.app.help", {
target: a ? "http://help.palm.com/basics/manage_applications/basics_delete_app_from_launcher.html" : "no-network"
}), d.cleanupInValidateInstallSpace(e);
}, d["OnCancel" + e] = function() {
d.cleanupInValidateInstallSpace(e);
};
var h = [];
h.push(b), d.createComponent({
name: "temperror" + e,
kind: "findApps.Error",
onSubmit: "OnSubmit" + e,
onCancel: "OnCancel" + e,
owner: d
}).displayError(h, {
installSize: g
}), c(!1);
}, d.$.applicationinstaller.validateInstall(a.publicApplicationId, a.packageSize, a.installSize, "validateInstallSuccess" + e, "validateInstallFailure" + e);
},
validateDownloadConnectionCleanup: function(a) {
this.$["popupPrompt" + a] && this.$["popupPrompt" + a].destroy(), findApps.Utilities.delFunc(this, "submit", a);
},
validateDownloadConnection: function(a) {
if (enyo.application.connectionManager.isOn1x()) if (this.owner.canAllow1xDownload()) a(!0); else {
var b = this, c = this._1xCarrierDialog(findApps.UserProfile.carrier);
this["submit" + c] = function(d, e) {
b.$["popupPrompt" + c].close(), d.value == "submit" ? b.owner.allow1xDownload(!0, function(b) {
a(b);
}) : d.value == "cancel" && a(!1), b.validateDownloadConnectionCleanup(c);
}, this.$["popupPrompt" + c].render(), this.$["popupPrompt" + c].openAtCenter();
} else enyo.application.connectionManager.isOnline() ? a(!0) : a(!1);
},
_install: function(a) {
var b = this;
this.owner.$.downloadStateManager.validateDownloadConnection(function(c) {
var d = a.stateToString();
c && (a.setState("findApps.AppState.InitiatingDownload"), b.installcb = function(a, b) {}, b.installfail = function(b, c) {
a.stateToString() == "findApps.AppState.InitiatingDownload" && a.setState(d);
}, b.$.appinstallservice.install(a, "installcb", "installfail"));
});
},
_revert: function(a, b) {
this.revertcb = function(a, b) {}, this.$.appinstallservice.installLocal(b, null, "revertcb");
},
_pause: function(a) {
var b = a.stateToString();
a.setState("findApps.AppState.Pausing"), this.pausecb = function(c, d) {
a.stateToString() == "findApps.AppState.Pausing" && a.setState(b);
}, this.$.appinstallservice.pause(a.publicApplicationId, null, "pausecb");
},
_resume: function(a) {
var b = this;
b.owner.$.downloadStateManager.validateDownloadConnection(function(c) {
if (c) {
var d = a.stateToString();
a.setState("findApps.AppState.Resuming"), b.resumecb = function(b, c) {
a.stateToString() == "findApps.AppState.Resuming" && a.setState(d);
}, b.$.appinstallservice.resume(a.publicApplicationId, null, "resumecb");
}
});
},
_cancel: function(a) {
var b = this, c = a.stateToString();
a.setState("findApps.AppState.Canceling"), this.cancelcb = function(b, d) {
a.stateToString() == "findApps.AppState.Canceling" && a.setState(c);
}, this.$.appinstallservice.cancel(a.publicApplicationId, null, "cancelcb");
},
_uninstall: function(a) {
var b = this, c = a.stateToString();
a.setState("findApps.AppState.Removing"), this.uninstallremovecb = function(b, d) {
a.stateToString() == "findApps.AppState.Removing" && a.setState(c);
}, this.$.appinstallservice.remove(a.publicApplicationId, null, "uninstallremovecb");
},
_restore: function(a) {
var b = this;
if (a.errorCode == "FAILED_IPKG_INSTALL") {
var c = a.stateToString();
this.removecb = function(b, d) {
a.stateToString() == "findApps.AppState.InstallFailed" && a.setState(c);
}, b.$.appinstallservice.remove(a.publicApplicationId, null, "removecb");
} else b.owner.$.downloadStateManager._cancel(a);
},
_reset: function(a) {
a.installedVersion ? a.serverVersion && findApps.Utilities.VersionCheck.compare(a.installedVersion, a.serverVersion) == -1 ? a.setState("findApps.AppState.UpdateAvailable") : a.setState("findApps.AppState.Installed") : a.price && a.price > 0 ? a.setState("findApps.AppState.Purchased") : a.setState("findApps.AppState.Download");
},
_remove: function(a) {
a.installedVersion = null, a.pendingRevert ? (a.pendingRevert = !1, a.setState("findApps.AppState.Download"), this.owner.$.downloadStateManager._revert(null, this.owner.getDetailsRevertableApp(a.publicApplicationId))) : a.price && a.price > 0 ? a.setState("findApps.AppState.Purchased") : a.setState("findApps.AppState.Download");
},
cleanupInFetchAppDetails: function(a) {
this.$["catalogServer" + a] && this.$["catalogServer" + a].destroy(), findApps.Utilities.delFunc(this, "detailscb", a), this.$["temperror" + a] && this.$["temperror" + a].destroy(), findApps.Utilities.delFunc(this, "OnCancel", a);
},
detailscb: function(a, b, c, d, e) {
if (e && e.length && e.length > 0) {
e.push("LOC04004");
var f = findApps.Utilities.getRandNumber(), g = this;
this["OnCancel" + f] = function() {
g.cleanupInFetchAppDetails(f);
}, this.createComponent({
kind: "findApps.Error",
name: "temperror" + f,
onCancel: "OnCancel" + f,
owner: g
}).displayError(e), d.callback(!1);
} else d.app.updateFromServer(b.OutGetAppDetailV2.appDetail), d.callback(!0);
},
_fetchAppDetails: function(a, b) {
findApps.BaseServer.getACServer().getApplicationDetails(null, a.publicApplicationId, enyo.g11n.currentLocale().toISOString(), "GDBAppDetailsSvc", !0, {
onResponse: "detailscb",
scope: this,
app: a,
callback: b
});
}
});

// lib/download/AppStates.js

enyo.kind({
name: "findApps.AppState.Initial",
kind: enyo.Control,
init: function(a, b) {
a._progressPillModel.state = "initial", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = undefined, a._progressPillModel.image = undefined, a._progressPillModel.value = undefined, a._progressPillModel.title = a.getFormattedPrice();
if (a.price == 0 || !a.price) a._progressPillModel.title = $L("FREE");
a.enableSave = !0, a.disabledClass = null, a.updateClass = null, a.activeClass = null, a.resumeClass = null, a.pauseClass = null, a.warningClass = null;
},
updateFromServer: function(a) {
this._update(a);
},
updateFromInstalledAppsList: function(a) {
this._update(a);
},
_update: function(a) {
var b = "findApps.AppState.Download";
a.purchasedVersion && (b = "findApps.AppState.Purchased"), a.installedVersion && (b = "findApps.AppState.Installed", a.serverVersion && findApps.Utilities.VersionCheck.compare(a.installedVersion, a.serverVersion) == -1 && (b = "findApps.AppState.UpdateAvailable")), a.setState(b);
},
toString: function() {
return "findApps.AppState.Initial";
},
defaultAction: function(a) {
a.setState("findApps.AppState.Download"), a.defaultAction();
},
removeFromMyApps: function() {
return !0;
}
}), enyo.kind({
name: "findApps.AppState.InitiatingDownload",
kind: enyo.Control,
init: function(a) {
a._progressPillModel.state = "initiating_download", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = undefined, a._progressPillModel.image = undefined, a._progressPillModel.title = $L("Downloading..."), a._progressPillModel.value = 0, a.enableSave = !1, a.disabledClass = "disabled", a.updateClass = null, a.activeClass = "active", a.resumeClass = null, a.pauseClass = null, a.warningClass = null;
},
_reset: function(a) {
this.owner.$.downloadStateManager._reset(a);
},
_remove: function(a) {
this.owner.$.downloadStateManager._remove(a);
},
saveToMyApps: function() {
return !0;
},
toString: function() {
return "findApps.AppState.InitiatingDownload";
}
}), enyo.kind({
name: "findApps.AppState.Pausing",
kind: enyo.Control,
init: function(a) {
a._progressPillModel.state = "pausing", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = undefined, a._progressPillModel.image = undefined, a._progressPillModel.title = $L("Pausing..."), a.enableSave = !1, a.disabledClass = "disabled";
},
_allowTransition: function(a) {
return a == "findApps.AppState.Downloading" ? !1 : !0;
},
_reset: function(a) {
this.owner.$.downloadStateManager._reset(a);
},
_remove: function(a) {
this.owner.$.downloadStateManager._remove(a);
},
saveToMyApps: function() {
return !0;
},
toString: function() {
return "findApps.AppState.Pausing";
}
}), enyo.kind({
name: "findApps.AppState.Resuming",
kind: enyo.Control,
init: function(a) {
a._progressPillModel.state = "resuming", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = undefined, a._progressPillModel.image = undefined, a._progressPillModel.title = $L("Resuming..."), a.enableSave = !1, a.disabledClass = "disabled";
},
_reset: function(a) {
this.owner.$.downloadStateManager._reset(a);
},
_remove: function(a) {
this.owner.$.downloadStateManager._remove(a);
},
saveToMyApps: function() {
return !0;
},
toString: function() {
return "findApps.AppState.Resuming";
}
}), enyo.kind({
name: "findApps.AppState.Removing",
kind: enyo.Control,
init: function(a) {
a._progressPillModel.state = "removing", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = undefined, a._progressPillModel.image = undefined, a._progressPillModel.title = $L("Removing..."), a._progressPillModel.value = 1, a.enableSave = !1, a.disabledClass = "disabled", a.updateClass = null, a.activeClass = null, a.resumeClass = null, a.pauseClass = null, a.warningClass = null;
},
_allowTransition: function(a) {
return a == "findApps.AppState.Downloading" ? !1 : !0;
},
_reset: function(a) {
this.owner.$.downloadStateManager._reset(a);
},
_remove: function(a) {
this.owner.$.downloadStateManager._remove(a);
},
saveToMyApps: function() {
return !0;
},
toString: function() {
return "findApps.AppState.Removing";
}
}), enyo.kind({
name: "findApps.AppState.Canceling",
kind: enyo.Control,
init: function(a) {
a._progressPillModel.state = "canceling", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = undefined, a._progressPillModel.image = undefined, a._progressPillModel.title = $L("Canceling..."), a.enableSave = !1, a.disabledClass = "disabled";
},
_allowTransition: function(a) {
return a == "findApps.AppState.Downloading" ? !1 : !0;
},
_reset: function(a) {
this.owner.$.downloadStateManager._reset(a);
},
_remove: function(a) {
this.owner.$.downloadStateManager._remove(a);
},
saveToMyApps: function() {
return !0;
},
toString: function() {
return "findApps.AppState.Canceling";
}
}), enyo.kind({
name: "findApps.AppState.Download",
kind: enyo.Control,
init: function(a, b) {
a._progressPillModel.state = "download", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = undefined, a._progressPillModel.image = undefined, a._progressPillModel.value = undefined, a._progressPillModel.title = a.getFormattedPrice(), a.enableSave = !0;
var c = enyo.getCookie("findapps.promocode");
findApps.UserProfile.promoLink && a.price != 0 && c && c.length > 0 && (a._progressPillModel.icon = undefined, a._progressPillModel.image = undefined);
if (a.price == 0 || !a.price) a._progressPillModel.title = $L("FREE");
a.progress = 0, a.disabledClass = null, a.updateClass = null, a.activeClass = null, a.resumeClass = null, a.pauseClass = null, a.warningClass = null;
},
updateFromInstalledAppsList: function(a) {
a.installedVersion && (a.serverVersion && findApps.Utilities.VersionCheck.compare(a.installedVersion, a.serverVersion) == -1 ? a.setState("findApps.AppState.UpdateAvailable") : a.setState("findApps.AppState.Installed"));
},
updateFromServer: function(a) {
var b = "findApps.AppState.Download";
a.purchasedVersion && (b = "findApps.AppState.Purchased"), a.installedVersion && (b = "findApps.AppState.Installed", findApps.Utilities.VersionCheck.compare(a.installedVersion, a.serverVersion) == -1 && (b = "findApps.AppState.UpdateAvailable")), a.setState(b);
},
removeFromMyApps: function() {
return !0;
},
defaultAction: function(a) {
a.install();
},
processAppDetails: function(a) {
var b = this;
this.owner.$.downloadStateManager._checkNotEmbargoed(a, function(c) {
c ? b.owner.$.downloadStateManager._handleLocationServices(a, function(c) {
c ? b.owner.$.downloadStateManager.validateInstallSpace(a, "validate_space_default_single", function(c) {
c ? b.owner.$.downloadStateManager.validateDownloadConnection(function(c) {
c ? a.price > 0 ? b.owner.$.downloadStateManager._handleVerifyPayment(a, !findApps.UserPreferences.isLoginTimedOut(), null, function(c) {
c ? b.owner.$.downloadStateManager._install(a) : a.setState("findApps.AppState.Download");
}) : b.owner.$.downloadStateManager._install(a) : a.setState("findApps.AppState.Download");
}) : a.setState("findApps.AppState.Download");
}) : a.setState("findApps.AppState.Download");
}) : a.setState("findApps.AppState.Download");
});
},
install: function(a) {
var b = this;
if (!a.price || a.price != "n/a" && a.price != "N/A") a.price && a.price > 0 && !findApps.BaseServer.isPurchased(a.publicApplicationId) ? a.setState("findApps.AppState.Purchasing") : a.setState("findApps.AppState.InitiatingDownload"), !a.packageSize || !a.installSize || a.islocationbased === undefined || !a.title ? this.owner.$.downloadStateManager._fetchAppDetails(a, function(c) {
if (c) {
var d = "";
a.purchasedVersion && (d = "findApps.AppState.Purchased"), a.installedVersion && (d = "findApps.AppState.Installed", a.serverVersion && findApps.Utilities.VersionCheck.compare(a.installedVersion, a.serverVersion) == -1 && (d = "findApps.AppState.UpdateAvailable")), d !== "" ? (a.setState(d), a.defaultAction()) : b.processAppDetails(a);
} else a.setState("findApps.AppState.Initial");
}) : this.processAppDetails(a); else return;
},
toString: function() {
return "findApps.AppState.Download";
}
}), enyo.kind({
name: "findApps.AppState.Downloading",
kind: enyo.Control,
init: function(a, b) {
a._progressPillModel.state = "downloading", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = "images/download-indicator-pause.png", a._progressPillModel.image = "images/download-indicator-pause.png", a._progressPillModel.title = $L("Downloading..."), a.enableSave = !1, a._progressPillModel.value = a.progress / 100, a.disabledClass = null, a.updateClass = null, a.activeClass = "active", a.resumeClass = null, a.pauseClass = "show", a.warningClass = null;
},
updateFromServer: function(a) {
a.setState("findApps.AppState.Downloading");
},
updateFromInstalledAppsList: function(a) {
a.setState("findApps.AppState.Downloading");
},
defaultAction: function(a) {
this.pauseDownload(a);
},
myAppsDefaultAction: function(a) {
this.pauseDownload(a);
},
pauseDownload: function(a) {
this.owner.$.downloadStateManager._pause(a);
},
cancelDownload: function(a) {
this.owner.$.downloadStateManager._cancel(a);
},
uninstall: function(a) {
this.owner.$.downloadStateManager._uninstall(a);
},
_reset: function(a) {
this.owner.$.downloadStateManager._reset(a);
},
_remove: function(a) {
this.owner.$.downloadStateManager._remove(a);
},
saveToMyApps: function() {
return !0;
},
toString: function() {
return "findApps.AppState.Downloading";
}
}), enyo.kind({
name: "findApps.AppState.Paused",
kind: enyo.Control,
init: function(a, b) {
a._progressPillModel.state = "paused", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = "images/download-indicator-resume.png", a._progressPillModel.value = a.progress / 100, a._progressPillModel.image = undefined, a._progressPillModel.title = $L("Resume"), a.enableSave = !1, a.disabledClass = null, a.updateClass = null, a.activeClass = "active", a.resumeClass = "show", a.pauseClass = null, a.warningClass = null;
},
updateFromServer: function(a) {
a.setState("findApps.AppState.Paused");
},
updateFromInstalledAppsList: function(a) {
a.setState("findApps.AppState.Paused");
},
myAppsDefaultAction: function(a) {
a.resumeDownload();
},
defaultAction: function(a) {
a.resumeDownload();
},
cleanupInResumeDownload: function(a) {
this.$["temperror" + a] && this.$["temperror" + a].destroy(), findApps.Utilities.delFunc(this, "OnCancel", a), this.$["catalogServer" + a] && this.$["catalogServer" + a].destroy(), findApps.Utilities.delFunc(this, "detailscb", a);
},
detailscb: function(a, b, c, d, e) {
var f = this;
if (e && e.length && e.length > 0) {
var g = findApps.Utilities.getRandNumber();
f["OnCancel" + g] = function() {
f.cleanupInResumeDownload(g);
}, f.createComponent({
name: "temperror" + g,
kind: "findApps.Error",
onCancel: "OnCancel" + g,
owner: f
}).displayError(e);
} else d.app.updateFromServer(b.OutGetAppDetailV2.appDetail), this.owner.$.downloadStateManager.validateInstallSpace(d.app, "validate_space_default_single", function(a) {
a && f.owner.$.downloadStateManager._resume(d.app);
});
},
resumeDownload: function(a) {
var b = this;
a.packageSize != undefined && a.installSize != undefined ? b.owner.$.downloadStateManager.validateInstallSpace(a, "validate_space_default_single", function(c) {
c && b.owner.$.downloadStateManager._resume(a);
}) : findApps.BaseServer.getACServer().getApplicationDetails(a.id, a.publicApplicationId, enyo.g11n.currentLocale().toISOString(), "DSDownloadFailedAppDetails", !0, {
onResponse: "detailscb",
scope: this,
app: a
});
},
cancelPausedDownload: function(a) {
this.owner.$.downloadStateManager._cancel(a);
},
uninstall: function(a) {
this.owner.$.downloadStateManager._uninstall(a);
},
_reset: function(a) {
this.owner.$.downloadStateManager._reset(a);
},
_remove: function(a) {
this.owner.$.downloadStateManager._remove(a);
},
saveToMyApps: function() {
return !0;
},
toString: function() {
return "findApps.AppState.Paused";
}
}), enyo.kind({
name: "findApps.AppState.DownloadFailed",
kind: enyo.Control,
components: [ {
name: "appinstallservice",
kind: "findApps.AppInstallService"
} ],
init: function(a) {
a._progressPillModel.state = "download_failed", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = "images/icon-warning.png", a._progressPillModel.image = undefined, a._progressPillModel.value = undefined, a._progressPillModel.title = $L("Failed"), a.enableSave = !0, a.progress = 0, a.disabledClass = null, a.updateClass = null, a.activeClass = "warning", a.resumeClass = null, a.pauseClass = null, a.warningClass = "show";
},
updateFromServer: function(a) {
a.setState("findApps.AppState.DownloadFailed");
},
updateFromInstalledAppsList: function(a) {
a.setState("findApps.AppState.DownloadFailed");
},
defaultAction: function(a) {
this._defaultAction(a);
},
myAppsDefaultAction: function(a) {
this._defaultAction(a);
},
cleanupInDefaultActionDF: function(a) {
this.$["temperror" + a] && this.$["temperror" + a].destroy(), findApps.Utilities.delFunc(this, "OnSubmit", a), findApps.Utilities.delFunc(this, "OnCancel", a);
},
cleanupInInstall: function(a) {
this.$["catalogServer" + a] && this.$["catalogServer" + a].destroy(), findApps.Utilities.delFunc(this, "detailscb", a);
},
_defaultAction: function(a) {
var b = this, c = findApps.Utilities.getRandNumber(), d = [];
d.push("LOC04015"), b["OnSubmit" + c] = function() {
a.install(), b.cleanupInDefaultActionDF(c);
}, b["OnCancel" + c] = function() {
b.owner.$.downloadStateManager._cancel(a), b.cleanupInDefaultActionDF(c);
}, b.createComponent({
name: "temperror" + c,
kind: "findApps.Error",
onSubmit: "OnSubmit" + c,
onCancel: "OnCancel" + c,
owner: b
}).displayError(d, {
errCode: a.errorCode
});
},
cancelDownload: function(a) {
this.owner.$.downloadStateManager._cancel(a);
},
uninstall: function(a) {
this.owner.$.downloadStateManager._uninstall(a);
},
_reset: function(a) {
this.owner.$.downloadStateManager._reset(a);
},
_remove: function(a) {
this.owner.$.downloadStateManager._remove(a);
},
detailscb: function(a, b, c, d, e) {
var f = this;
if (e && e.length && e.length > 0) {
var g = findApps.Utilities.getRandNumber();
d.app.setState(d.oldState), e.push("LOC04002"), f["OnCancel" + g] = function() {
f.cleanupInInstall(g);
}, f.createComponent({
name: "temperror" + g,
kind: "findApps.Error",
onCancel: "OnCancel" + g,
owner: f
}).displayError(e);
} else d.app.updateFromServer(b.OutGetAppDetailV2.appDetail), this.owner.$.downloadStateManager.validateInstallSpace(d.app, "validate_space_default_single", function(a) {
a ? f.owner.$.downloadStateManager.validateDownloadConnection(function(a) {
a ? (f.installcb = function(a, b) {}, f.failurecb = function(a, b) {
d.app.stateToString() == "findApps.AppState.InitiatingDownload" && d.app.setState(d.oldState);
}, f.$.appinstallservice.install(d.app, "installcb", "failurecb")) : d.app.setState(d.oldState);
}) : d.app.setState(d.oldState);
});
},
install: function(a) {
var b = a.stateToString();
a.setState("findApps.AppState.InitiatingDownload"), findApps.BaseServer.getACServer().getApplicationDetails(a.id, a.publicApplicationId, enyo.g11n.currentLocale().toISOString(), "DSFailedAppDetails", !0, {
onResponse: "detailscb",
scope: this,
app: a,
oldState: b
});
},
saveToMyApps: function() {
return !0;
},
toString: function() {
return "findApps.AppState.DownloadFailed";
}
}), enyo.kind({
name: "findApps.AppState.Purchasing",
kind: enyo.Control,
init: function(a, b) {
a._progressPillModel.state = "purchasing", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = undefined, a._progressPillModel.image = undefined, a._progressPillModel.value = undefined, a._progressPillModel.title = $L("Purchasing..."), a.enableSave = !0;
},
toString: function() {
return "findApps.AppState.Purchasing";
},
saveToMyApps: function() {
return !0;
}
}), enyo.kind({
name: "findApps.AppState.Purchased",
kind: enyo.Control,
init: function(a, b) {
a._progressPillModel.state = "purchased";
if (!b || b && !b.transitional) a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = undefined, a._progressPillModel.image = undefined, a._progressPillModel.value = undefined, a._progressPillModel.title = $L("FREE"), a.enableSave = !0;
a.progress = 0, b && b.version && (a.purchasedVersion = b.version);
},
updateFromServer: function(a) {},
updateFromInstalledAppsList: function(a) {
a.installedVersion && (a.serverVersion && findApps.Utilities.VersionCheck.compare(a.installedVersion, a.serverVersion) == -1 ? a.setState("findApps.AppState.UpdateAvailable") : a.setState("findApps.AppState.Installed"));
},
saveToMyApps: function() {
return !0;
},
defaultAction: function(a) {
a.install();
},
install: function(a) {
var b = this;
this.owner.$.downloadStateManager.validateInstallSpace(a, "validate_space_default_single", function(c) {
c && b.owner.$.downloadStateManager._install(a);
});
},
toString: function() {
return "findApps.AppState.Purchased";
}
}), enyo.kind({
name: "findApps.AppState.PurchaseFailed",
kind: enyo.Control,
init: function(a, b) {
a._progressPillModel.state = "purchase_failed", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = "images/icon-warning.png", a._progressPillModel.image = undefined, a._progressPillModel.value = undefined, a._progressPillModel.title = $L("Failed"), a.enableSave = !0, a.errorStack = [], b && b.errorStack && (enyo.isArray(b.errorStack) ? a.errorStack = b.errorStack : a.errorStack.push(b.errorStack + "")), a.displayErrorCode = a.errorStack.length > 0 && a.errorStack[a.errorStack.length - 1] || "";
},
updateFromServer: function(a) {},
cleanupInDefaultActionPF: function(a) {
this.$["temperror" + a] && this.$["temperror" + a].destroy(), findApps.Utilities.delFunc(this, "OnSubmit", a), findApps.Utilities.delFunc(this, "OnCancel", a);
},
defaultAction: function(a) {
var b = this, c = findApps.Utilities.getRandNumber(), d = "", e = a.errorStack;
switch (a.paymentType) {
case "ob":
d = "cc", e.push("LOC04012");
break;
case "cc":
findApps.UserProfile.obEnabled && (d = "ob", e.push("LOC04013"));
break;
default:
e.push("LOC04014");
}
b["OnSubmit" + c] = function() {
b.cleanupInDefaultActionPF(c), d && b.owner.$.downloadStateManager._forcePaymentType(a, d);
}, b["OnCancel" + c] = function() {
b.cleanupInDefaultActionPF(c), b._reset(a);
}, b.createComponent({
name: "temperror" + c,
kind: "findApps.Error",
onSubmit: "OnSubmit" + c,
onCancel: "OnCancel" + c,
owner: b
}).displayError(e, {
errCode: a.displayErrorCode
});
},
_reset: function(a) {
a.setState("findApps.AppState.Download");
},
_remove: function(a) {
a.setState("findApps.AppState.Download");
},
toString: function() {
return "findApps.AppState.PurchaseFailed";
}
}), enyo.kind({
name: "findApps.AppState.PurchasePending",
kind: "findApps.AppState.PurchaseFailed",
init: function(a, b) {
a._progressPillModel.state = "purchase_pending", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = "images/icon-warning.png", a._progressPillModel.image = undefined, a._progressPillModel.value = undefined, a._progressPillModel.title = $L("Pending"), a.enableSave = !0, a.errorStack = [], b && b.errorStack && (enyo.isArray(b.errorStack) ? a.errorStack = b.errorStack : a.errorStack.push(b.errorStack + "")), a.displayErrorCode = a.errorStack.length > 0 && a.errorStack[a.errorStack.length - 1] || "", this.defaultAction(a);
},
defaultAction: function(a) {
var b = findApps.Utilities.getRandNumber(), c = a.errorStack;
c.push("LOC04011");
var d = this;
this["OnClick" + b] = function() {
d.$["temperror" + b] && d.$["temperror" + b].destroy(), findApps.Utilities.delFunc(d, "OnClick", b);
}, this.createComponent({
name: "temperror" + b,
kind: "findApps.Error",
onSubmit: "OnClick",
onCancel: "OnClick",
owner: this
}).displayError(c, {
errCode: a.displayErrorCode
});
},
toString: function() {
return "findApps.AppState.PurchasePending";
}
}), enyo.kind({
name: "findApps.AppState.Installing",
kind: enyo.Control,
init: function(a, b) {
a._progressPillModel.state = "installing", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = undefined, a._progressPillModel.image = undefined, a._progressPillModel.value = 1, a._progressPillModel.title = $L("Installing..."), a.progress = 100, a.enableSave = !1, a.disabledClass = null, a.updateClass = null, a.activeClass = "active", a.resumeClass = null, a.pauseClass = null, a.warningClass = null;
},
updateFromInstalledAppsList: function(a) {
a.setState("findApps.AppState.Installing");
},
_reset: function(a) {
this.owner.$.downloadStateManager._reset(a);
},
_remove: function(a) {
this.owner.$.downloadStateManager._remove(a);
},
saveToMyApps: function() {
return !0;
},
toString: function() {
return "findApps.AppState.Installing";
}
}), enyo.kind({
name: "findApps.AppState.Installed",
kind: enyo.Control,
init: function(a, b) {
a._progressPillModel.state = "installed", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = undefined, a._progressPillModel.image = undefined, a._progressPillModel.value = undefined, a._progressPillModel.title = $L("Launch"), a.enableSave = !1, a.disabledClass = null, a.updateClass = null, a.activeClass = null, a.resumeClass = null, a.pauseClass = null, a.warningClass = null;
},
updateFromServer: function(a) {
this._update(a);
},
updateFromServerUpdatesList: function(a) {
this._update(a);
},
_update: function(a) {
a.serverVersion && findApps.Utilities.VersionCheck.compare(a.installedVersion, a.serverVersion) == -1 ? a.setState("findApps.AppState.UpdateAvailable") : a.setState("findApps.AppState.Installed");
},
saveToMyApps: function() {
return !0;
},
defaultAction: function(a) {
a.launch();
},
launchcb: function(a, b) {},
launchfailurecb: function(a, b) {},
launch: function(a) {
var b = this;
findApps.ApplicationManager.getInstance().openApplication(a.publicApplicationId, undefined, !0, "launchcb", "launchfailurecb", this);
},
uninstall: function(a) {
this.owner.$.downloadStateManager._uninstall(a);
},
_reset: function(a) {
this.owner.$.downloadStateManager._reset(a);
},
_remove: function(a) {
this.owner.$.downloadStateManager._remove(a);
},
toString: function() {
return "findApps.AppState.Installed";
}
}), enyo.kind({
name: "findApps.AppState.UpdateAvailable",
kind: enyo.Control,
components: [ {
name: "appinstallservice",
kind: "findApps.AppInstallService"
} ],
init: function(a, b) {
a._progressPillModel.state = "update_available", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = undefined, a._progressPillModel.image = undefined, a._progressPillModel.value = undefined, a._progressPillModel.title = $L("Update"), a.enableSave = !1, a.disabledClass = null, a.updateClass = "update", a.activeClass = null, a.resumeClass = null, a.pauseClass = null, a.warningClass = null;
},
saveToMyApps: function() {
return !0;
},
defaultAction: function(a) {
a.install();
},
myAppsDefaultAction: function(a) {
a.install();
},
install: function(a) {
var b = this;
b.owner.$.downloadStateManager.validateInstallSpace(a, "validate_space_default_single", function(c) {
c ? b.owner.$.downloadStateManager._install(a) : a.setState("findApps.AppState.UpdateAvailable");
});
},
installUpdate: function(a) {
var b = this, c = a.stateToString();
a.setState("findApps.AppState.InitiatingDownload"), b.installcb = function(a, b) {}, b.failurecb = function(b, d) {
a.stateToString() == "findApps.AppState.InitiatingDownload" && a.setState(c);
}, b.$.appinstallservice.install(a, "installcb", "failurecb");
},
updateFromInstalledAppsList: function(a) {
this._update(a);
},
updateFromServerUpdatesList: function(a) {
this._update(a);
},
_update: function(a) {
a.serverVersion && findApps.Utilities.VersionCheck.compare(a.installedVersion, a.serverVersion) == -1 ? a.setState("findApps.AppState.UpdateAvailable") : a.setState("findApps.AppState.Installed");
},
uninstall: function(a) {
this.owner.$.downloadStateManager._uninstall(a);
},
_reset: function(a) {
this.owner.$.downloadStateManager._reset(a);
},
_remove: function(a) {
this.owner.$.downloadStateManager._remove(a);
},
toString: function() {
return "findApps.AppState.UpdateAvailable";
}
}), enyo.kind({
name: "findApps.AppState.InstallFailed",
kind: enyo.Control,
components: [ {
name: "appinstallservice",
kind: "findApps.AppInstallService"
} ],
init: function(a) {
a._progressPillModel.state = "install_failed", a._progressPillModel.titleRight = undefined, a._progressPillModel.icon = "images/icon-warning.png", a._progressPillModel.image = undefined, a._progressPillModel.value = undefined, a._progressPillModel.title = $L("Failed"), a.enableSave = !1, a.disabledClass = null, a.updateClass = null, a.activeClass = "warning", a.resumeClass = null, a.pauseClass = null, a.warningClass = "show";
},
updateFromServer: function(a) {},
updateFromInstalledAppsList: function(a) {
a.setState("findApps.AppState.InstallFailed");
},
defaultAction: function(a) {
this._defaultAction(a);
},
myAppsDefaultAction: function(a) {
this._defaultAction(a);
},
_defaultAction: function(a) {
var b = this, c = findApps.Utilities.getRandNumber(), d;
a.installSize ? (d = a.installSize / 1048576 + 1, d = findApps.Utilities.Formatter.formatRound2(d) + " " + $L("MB")) : d = $L("unknown MB");
var e = this.owner.getDetailsRevertableApp(a.publicApplicationId);
b.cleanup = function(a) {
b.$["catalogServer1" + a] && b.$["catalogServer1" + a].destroy(), findApps.Utilities.delFunc(b, "OnRevert", a), findApps.Utilities.delFunc(b, "OnCancel", a), findApps.Utilities.delFunc(b, "OnRetry", a);
}, b["OnRevert" + c] = function() {
a.pendingRevert = !0, b.owner.$.downloadStateManager._restore(a), b.cleanup(c);
}, b["OnCancel" + c] = function() {
b.owner.$.downloadStateManager._cancel(a), b.cleanup(c);
}, b["OnRetry" + c] = function() {
a.install(), b.cleanup(c);
};
var f = [];
a.errorCode && f.push(a.errorCode), e ? (f.push("LOC04009"), b.createComponent({
name: "temperror" + c,
kind: "findApps.Error",
onSubmit: "OnRevert" + c,
onCancel: "OnCancel" + c,
owner: b
}).displayError(f, {
installSize: d,
title: a.title
})) : (f.push("LOC04010"), b.createComponent({
name: "temperror" + c,
kind: "findApps.Error",
onSubmit: "OnRetry" + c,
onCancel: "OnCancel" + c,
owner: b
}).displayError(f, {
installSize: d
}));
},
cancelDownload: function(a) {
this.owner.$.downloadStateManager._cancel(a);
},
uninstall: function(a) {
this.owner.$.downloadStateManager._uninstall(a);
},
_reset: function(a) {
this.owner.$.downloadStateManager._reset(a);
},
_remove: function(a) {
this.owner.$.downloadStateManager._remove(a);
},
detailscb: function(a, b, c, d, e) {
var f = this;
if (e && e.length && e.length > 0) {
var g = findApps.Utilities.getRandNumber();
d.app.setState(d.oldState), e.push("LOC04003"), this["OnCancel" + g] = function() {
f.$["temperror" + g] && f.$["temperror" + g].destroy(), findApps.Utilities.delFunc(f, "OnCancel", g);
}, this.createComponent({
name: "temperror" + g,
kind: "findApps.Error",
onCancel: "OnCancel" + g,
owner: this
}).displayError(e);
} else d.app.updateFromServer(b.OutGetAppDetailV2.appDetail), this.owner.$.downloadStateManager.validateInstallSpace(d.app, "validate_space_default_single", function(a) {
a ? f.owner.$.downloadStateManager.validateDownloadConnection(function(a) {
a ? (f.installcb = function(a, b) {}, f.failurecb = function(a, b) {
d.app.stateToString() == "findApps.AppState.InitiatingDownload" && d.app.setState(d.oldState);
}, f.$.appinstallservice.install(d.app, "installcb", "failurecb")) : d.app.setState(d.oldState);
}) : d.app.setState(d.oldState);
});
},
install: function(a) {
var b = a.stateToString();
a.setState("findApps.AppState.InitiatingDownload"), findApps.BaseServer.getACServer().getApplicationDetails(a.id, a.publicApplicationId, enyo.g11n.currentLocale().toISOString(), "DSInstallFailedAppDetails", !0, {
onResponse: "detailscb",
scope: this,
app: a,
oldState: b
});
},
saveToMyApps: function() {
return !0;
},
toString: function() {
return "findApps.AppState.InstallFailed";
}
});

// lib/download/model.js

enyo.kind({
name: "findApps.Model",
kind: enyo.Object,
constructor: function() {
this._observers = [], this.inherited(arguments);
},
attach: function(a) {
this._observers.push(a);
},
detach: function(a) {
for (var b = 0; b < this._observers.length; b++) this._observers[b] === a && this._observers.splice(b, 1);
},
notify: function(a, b) {
for (var c = 0; c < this._observers.length; c++) {
var d = this._observers[c];
d && d[a] && d[a].apply(d, b);
}
}
});

// lib/stars/Stars.js

enyo.kind({
name: "enyo.Stars",
kind: enyo.Control,
published: {
stars: 2.5,
starWidth: 18
},
chrome: [ {
name: "redStars",
className: " enyo-stars-red"
} ],
className: "enyo-ib enyo-stars",
create: function() {
this.inherited(arguments), this.starsChanged();
},
starsChanged: function() {
var a = Math.floor(this.stars * this.starWidth) + "px";
this.$.redStars.applyStyle("width", a);
}
});

// source/model/preferences.js

findApps.UserPreferences = {
_timeout: 144e5,
getPaymentLogin: function() {
return enyo.getCookie("findapps.paymentPref") || "timeout";
},
setPaymentLogin: function(a) {
enyo.setCookie("findapps.paymentPref", a);
},
setLoginTime: function() {
enyo.setCookie("findapps.loginTime", (new Date).getTime());
},
isLoginTimedOut: function() {
var a = enyo.getCookie("findapps.paymentPref");
if (a && a == "Every Purchase") return !0;
var b = enyo.getCookie("findapps.loginTime") || 0, c = (new Date).getTime();
return c - b > this._timeout ? !0 : !1;
}
};

// source/model/statemodel.js

findApps.States = {
_statesUS: [ {
caption: $L("State..."),
value: "STATE"
}, {
caption: $L("Alabama"),
value: "AL"
}, {
caption: $L("Alaska"),
value: "AK"
}, {
caption: $L("American Samoa"),
value: "AS"
}, {
caption: $L("Arizona"),
value: "AZ"
}, {
caption: $L("Arkansas"),
value: "AR"
}, {
caption: $L("AF Americas"),
value: "AA"
}, {
caption: $L("AF Europe"),
value: "AE"
}, {
caption: $L("AF Pacific"),
value: "AP"
}, {
caption: $L("California"),
value: "CA"
}, {
caption: $L("Colorado"),
value: "CO"
}, {
caption: $L("Connecticut"),
value: "CT"
}, {
caption: $L("Delaware"),
value: "DE"
}, {
caption: $L("District of Columbia"),
value: "DC"
}, {
caption: $L("Federated Micronesia"),
value: "FM"
}, {
caption: $L("Florida"),
value: "FL"
}, {
caption: $L("Georgia"),
value: "GA"
}, {
caption: $L("Guam"),
value: "GU"
}, {
caption: $L("Hawaii"),
value: "HI"
}, {
caption: $L("Idaho"),
value: "ID"
}, {
caption: $L("Illinois"),
value: "IL"
}, {
caption: $L("Indiana"),
value: "IN"
}, {
caption: $L("Iowa"),
value: "IA"
}, {
caption: $L("Kansas"),
value: "KS"
}, {
caption: $L("Kentucky"),
value: "KY"
}, {
caption: $L("Louisiana"),
value: "LA"
}, {
caption: $L("Maine"),
value: "ME"
}, {
caption: $L("Marshall Islands"),
value: "MH"
}, {
caption: $L("Maryland"),
value: "MD"
}, {
caption: $L("Massachusetts"),
value: "MA"
}, {
caption: $L("Michigan"),
value: "MI"
}, {
caption: $L("Minnesota"),
value: "MN"
}, {
caption: $L("Mississippi"),
value: "MS"
}, {
caption: $L("Missouri"),
value: "MO"
}, {
caption: $L("Montana"),
value: "MT"
}, {
caption: $L("Nebraska"),
value: "NE"
}, {
caption: $L("Nevada"),
value: "NV"
}, {
caption: $L("New Hampshire"),
value: "NH"
}, {
caption: $L("New Jersey"),
value: "NJ"
}, {
caption: $L("New Mexico"),
value: "NM"
}, {
caption: $L("New York"),
value: "NY"
}, {
caption: $L("North Carolina"),
value: "NC"
}, {
caption: $L("North Dakota"),
value: "ND"
}, {
caption: $L("N. Mariana Islands"),
value: "MP"
}, {
caption: $L("Ohio"),
value: "OH"
}, {
caption: $L("Oklahoma"),
value: "OK"
}, {
caption: $L("Oregon"),
value: "OR"
}, {
caption: $L("Palau"),
value: "PW"
}, {
caption: $L("Pennsylvania"),
value: "PA"
}, {
caption: $L("Puerto Rico"),
value: "PR"
}, {
caption: $L("Rhode Island"),
value: "RI"
}, {
caption: $L("South Carolina"),
value: "SC"
}, {
caption: $L("South Dakota"),
value: "SD"
}, {
caption: $L("Tennessee"),
value: "TN"
}, {
caption: $L("Texas"),
value: "TX"
}, {
caption: $L("Utah"),
value: "UT"
}, {
caption: $L("Vermont"),
value: "VT"
}, {
caption: $L("Virgin Islands"),
value: "VI"
}, {
caption: $L("Virginia"),
value: "VA"
}, {
caption: $L("Washington"),
value: "WA"
}, {
caption: $L("West Virginia"),
value: "WV"
}, {
caption: $L("Wisconsin"),
value: "WI"
}, {
caption: $L("Wyoming"),
value: "WY"
} ],
_statesCA: [ {
caption: $L("Province/Territory..."),
value: "STATE"
}, {
caption: $L("Alberta"),
value: "AB"
}, {
caption: $L("British Columbia"),
value: "BC"
}, {
caption: $L("Manitoba"),
value: "MB"
}, {
caption: $L("New Brunswick"),
value: "NB"
}, {
caption: $L("Newfoundland and Labrador"),
value: "NL"
}, {
caption: $L("Northwest Territories"),
value: "NT"
}, {
caption: $L("Nova Scotia"),
value: "NS"
}, {
caption: $L("Nunavut"),
value: "NU"
}, {
caption: $L("Ontario"),
value: "ON"
}, {
caption: $L("Prince Edward Island"),
value: "PE"
}, {
caption: $L("Quebec"),
value: "QC"
}, {
caption: $L("Saskatchewan"),
value: "SK"
}, {
caption: $L("Yukon"),
value: "YT"
} ],
_statesAU: [ {
caption: $L("State..."),
value: "STATE"
}, {
caption: $L("Australian Capital Territory"),
value: "ACT"
}, {
caption: $L("New South Wales"),
value: "NSW"
}, {
caption: $L("Northern Territory"),
value: "NT"
}, {
caption: $L("Queensland"),
value: "QLD"
}, {
caption: $L("South Australia"),
value: "SA"
}, {
caption: $L("Tasmania"),
value: "TAS"
}, {
caption: $L("Victoria"),
value: "VIC"
}, {
caption: $L("Western Australia"),
value: "WA"
} ],
getStates: function(a) {
var b = undefined;
switch (a) {
case "US":
b = this._statesUS;
break;
case "CA":
b = this._statesCA;
break;
case "AU":
b = this._statesAU;
break;
default:
}
return b;
}
};

// source/main/savedList.js

enyo.kind({
name: "findApps.SavedList",
kind: findApps.Model,
_list: [],
constructor: function() {
this.inherited(arguments), this.init();
},
init: function() {
this._list = JSON.parse(localStorage.getItem("com.palm.findapps.appList")) || [];
},
saveApp: function(a) {
this.isSaved(a) || (this._list.push(a), localStorage.setItem("com.palm.findapps.appList", JSON.stringify(this._list)), this.notify("saveListChanged", [ a, "add", this._list.length ]));
},
updateList: function(a) {
this._list = a, localStorage.setItem("com.palm.findapps.appList", JSON.stringify(this._list)), this.notify("saveListChanged", [ null, "update", this._list.length ]);
},
getList: function() {
return this._list;
},
removeApp: function(a, b) {
var c = this._list.indexOf(a);
c != -1 && (this._list.splice(c, 1), localStorage.setItem("com.palm.findapps.appList", JSON.stringify(this._list)), this.notify("saveListChanged", [ a, "remove", this._list.length ]), this._list.length === 0 && !b && this.notify("saveListEmpty", []));
},
isSaved: function(a) {
return this._list.indexOf(a) != -1;
}
});

// source/main/Categories.js

enyo.kind({
name: "findApps.Categories",
published: {
categories: [],
currentSelectRowIndex: 0
},
events: {
onCategoryClick: ""
},
currentSelectRowIndex: 0,
kind: "VFlexBox",
flex: 1,
horizontal: !1,
autoHorizontal: !1,
components: [ {
className: "top-shadow"
}, {
className: "right-shadow"
}, {
name: "category_scroller",
kind: "Scroller",
flex: 1,
components: [ {
name: "category_list",
className: "category-list",
kind: "VirtualRepeater",
onSetupRow: "categorySetupRow",
components: [ {
kind: "Item",
layoutKind: "HFlexLayout",
tapHighlight: "true",
onclick: "itemClick",
components: [ {
name: "category_icon",
kind: "Image"
}, {
name: "category_name",
style: "line-height:32px;margin-left:8px;overflow:hidden;text-overflow:ellipsis;"
} ]
} ]
} ]
} ],
refresh: function() {
this.$.category_list.render();
},
currentSelectRowIndexChanged: function(a) {
if (this.currentSelectRowIndex === a) return;
this.refresh();
},
categoriesChanged: function(a) {
if (this.categories === a) return;
this.refresh();
},
categorySetupRow: function(a, b) {
var c = this.categories[b];
if (c) {
this.$.category_icon.setSrc("images/" + (c.iconLocation || "category-icons/home/") + "category-selector.png"), b == 0 ? this.$.category_name.setContent($L("All Apps")) : this.$.category_name.setContent(c.name || c.label);
var d = b == this.currentSelectRowIndex;
return d ? this.$.item.addClass("enyo-held") : this.$.item.removeClass("enyo-held"), !0;
}
},
itemClick: function(a, b) {
this.doCategoryClick(b.rowIndex);
}
});

// source/main/SaveButton.js

enyo.kind({
name: "findApps.SaveButton",
kind: "CustomButton",
className: "enyo-button enyo-button-light twin-button",
components: [ {
className: "twin-inner"
} ],
events: {
onRemoveItem: ""
},
processAction: function(a) {
enyo.application.savedList.isSaved(a.publicApplicationId) ? this.removeApp(a) : this.saveApp(a);
},
saveApp: function(a) {
enyo.application.savedList.saveApp(a.publicApplicationId), this.setButton(a);
},
removeApp: function(a, b) {
enyo.application.savedList.removeApp(a.publicApplicationId, b), this.setButton(a);
},
setButton: function(a) {
this.appId = a.publicApplicationId, enyo.application.savedList.isSaved(a.publicApplicationId) ? this.addClass("enyo-button-depressed") : this.removeClass("enyo-button-depressed");
}
});

// source/main/AppItem.js

enyo.kind({
name: "findApps.AppItem",
kind: "Item",
tapHighlight: !0,
isSaveList: !1,
layoutKind: "HLayout",
components: [ {
name: "app_icon",
height: "64px",
width: "64px",
kind: "Image"
}, {
kind: "Control",
flex: 2,
style: "padding-left: 10px;",
components: [ {
name: "app_title",
style: "margin-left:0px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
}, {
name: "app_author",
style: "font-size: 14px; color:#40454c;margin-left:0px;white-space:nowrap;text-overflow: ellipsis;overflow:hidden;"
}, {
kind: "HFlexBox",
style: "margin-left:0px;white-space:nowrap;text-overflow: ellipsis;overflow:hidden;",
className: "item-box",
align: "baseline",
components: [ {
layoutKind: "HLayout",
components: [ {
kind: enyo.Image,
name: "avgRatingImg1",
width: "12px",
height: "12px"
}, {
kind: enyo.Image,
name: "avgRatingImg2",
width: "12px",
height: "12px"
}, {
kind: enyo.Image,
name: "avgRatingImg3",
width: "12px",
height: "12px"
}, {
kind: enyo.Image,
name: "avgRatingImg4",
width: "12px",
height: "12px"
}, {
kind: enyo.Image,
name: "avgRatingImg5",
width: "12px",
height: "12px"
} ]
}, {
name: "app_reviews",
style: "color:#363636;font-size: 14px; padding-left: 10px;"
} ]
}, {
name: "app_summary",
showing: !1,
style: "font-size: 14px;"
} ]
}, {
kind: "Control",
style: "height: 85px; width: 185px; position: absolute; right: 8px; top: 0px; padding-left: 10px; overflow: hidden;",
components: [ {
name: "badges",
style: "position: absolute; bottom: 48px; right: 0px; text-align:right; margin-right:9px",
className: "enyo-subtext"
}, {
kind: "HFlexBox",
style: "position: absolute; bottom: 8px; padding-left: 10px;",
className: "item-buttons",
align: "center",
components: [ {
name: "app_save_parent",
components: [ {
name: "app_save",
kind: "findApps.SaveButton",
onclick: "saveApp",
toggling: !0
} ]
}, {
flex: 1,
components: [ {
name: "app_price",
kind: "findApps.ProgressPill",
onTap: "_handleDownloadBar",
onCancel: "_progressCancelled"
} ]
} ]
} ]
} ],
create: function() {
this.inherited(arguments);
},
saveApp: function(a, b) {
this.saveClick = !0, this.tapHighlight = !1;
},
setAppItem: function(a) {
enyo.application.appcatwindow._orientation == "portrait" ? this.$.app_title.applyStyle("width", "325px") : enyo.application.appcatwindow._orientation == "landscape" && this.$.app_title.applyStyle("width", "575px"), this.$.app_title.content = a.title, this.$.app_author.content = a.author;
var b = a.badges;
b && (b = b instanceof Array ? b : [ b ]), b && findApps.Utilities.contains(b, "touchpad_exclusive") && (this.$.badges.content = $L("For TouchPad"));
var c = a.ratingCount;
if (c == 0) this.$.app_reviews.setContent($L("No Reviews")); else {
var d;
c > 1 ? d = new enyo.g11n.Template($L("#{num} reviews")) : d = new enyo.g11n.Template($L("#{num} review")), this.$.app_reviews.setContent(d.evaluate({
num: c
}));
}
var e = findApps.Utilities.array2Map(a.images, "imageKey"), f = findApps.Utilities.findFirstMatch(e, [ "icon/64x64", "icon/48x48" ]), g = f ? f.uri : a.appIcon;
this.$.app_icon.setSrc(g), a.averageRating || (a.averageRating = 0);
var h = a.averageRating * 2;
this.$.avgRatingImg1.setSrc("images/stars/star-" + findApps.Utilities.formatStar(h, 0) + ".png"), this.$.avgRatingImg2.setSrc("images/stars/star-" + findApps.Utilities.formatStar(h, 1) + ".png"), this.$.avgRatingImg3.setSrc("images/stars/star-" + findApps.Utilities.formatStar(h, 2) + ".png"), this.$.avgRatingImg4.setSrc("images/stars/star-" + findApps.Utilities.formatStar(h, 3) + ".png"), this.$.avgRatingImg5.setSrc("images/stars/star-" + findApps.Utilities.formatStar(h, 4) + ".png"), this.updateDowloadButton(a), this.updateSaveButton(a), this.appId = a.publicApplicationId;
},
updateDowloadButton: function(a) {
a._appDownload ? this.$.app_price.setParams(a._appDownload._progressPillModel) : this.$.app_price.setParams({
value: 0,
title: this.formatPrice(a.publicApplicationId, a.price)
});
},
updateSaveButton: function(a) {
a._appDownload && !a._appDownload.enableSave ? this.$.app_save_parent.hide() : (this.$.app_save_parent.show(), this.$.app_save.setButton(a));
},
formatPrice: function(a, b) {
if (b == "n/a") return b;
if (b == 0 || b == "Free" || findApps.BaseServer.isPurchased(a)) return $L("FREE");
var c = parseFloat(b), d = findApps.UserSession.getActivationCountry();
return findApps.Utilities.Formatter.formatCurrency(c, d);
},
_progressCancelled: function(a) {
this.progressCancelled = !0, this.tapHighlight = !1;
},
_handleDownloadBar: function(a, b) {
this.buyClick = !0, this.tapHighlight = !1;
}
});

// source/main/AppList.js

enyo.kind({
name: "findApps.AppList",
kind: "VFlexBox",
isSaveList: !1,
searchListType: null,
events: {
onAcquirePage: "",
onSaveListEmpty: ""
},
published: {
appList: [],
myAppList: []
},
components: [ {
name: "app_list",
className: "app-list",
kind: "VirtualList",
flex: 1,
accelerated: !0,
onSetupRow: "getAppItem",
onAcquirePage: "nextPage",
components: [ {
name: "app_item",
kind: "findApps.AppItem",
onclick: "appItemClick",
onUpdateList: "refreshItem"
} ]
} ],
create: function() {
this.appdownloadmgr = enyo.application.appdownloadManager, this.appdownloadmgr.attach(this), enyo.application.savedList.attach(this), this.init(), this.inherited(arguments), this.isSaveList && (this.$.app_item.isSaveList = !0), this.selectedCategoryIndex = undefined, this.$.app_list.$.scroller.displayBuffer.acquirePage = function(a) {
var b = this.pages[a];
b && (b.style.display = "", this.heights[a] || (this.heights[a] = 90), this.height += this.heights[a]);
};
},
destroy: function() {
this.appdownloadmgr && this.appdownloadmgr.detach(this), enyo.application.savedList != null && enyo.application.savedList.detach(this), this.inherited(arguments);
},
saveListChanged: function(a, b) {
var c = this.serialSearch(this.appList, a);
c >= 0 && this.$.app_list.updateRow(c);
},
saveListEmpty: function() {
this.doSaveListEmpty();
},
updateMyApps: function(a, b) {
if (b == this.appdownloadmgr.MYAPPS_ALL) this.init(); else {
var c = a.publicApplicationId, d = this.serialSearch(this.appList, c);
d >= 0 && (this.$.app_list.updateRow(d), b == this.appdownloadmgr.APP_DELETED ? this.appList[d]._appDownload = null : this.appList[d]._appDownload = a), a.enableSave || enyo.application.savedList.removeApp(c, !0);
}
},
init: function() {
if (!this.appdownloadmgr.myAppsListIsReady()) return;
this.getAppDownload(this.appList);
},
getAppDownload: function(a) {
for (var b in a) if (a[b]) {
var c = this.appdownloadmgr.belongToMyApp(a[b].publicApplicationId);
c && (a[b]._appDownload = c);
}
},
appendToList: function(a) {
this.appList = this.appList.concat(a), this.appListUpdated();
},
serialSearch: function(a, b) {
if (!a) return -1;
for (var c = 0; c < a.length; c++) {
if (a[c] === undefined) continue;
if (a[c].publicApplicationId === b) return c;
}
return -1;
},
nextPage: function(a, b) {
if (this.appList.length > 0) {
var c = b * a.pageSize;
c > 0 && !this.appList[c] && this.doAcquirePage(c);
}
},
appItemClick: function(a, b) {
var c = this.appList[b.rowIndex];
return a.buyClick && c._appDownload ? c._appDownload.defaultAction() : a.saveClick ? (a.$.app_save.processAction(c), this.isSaveList && (this.appList.splice(b.rowIndex, 1), this.appListUpdated())) : a.appClick ? a.$.app_save.processAction(c) : a.buyClick ? this.processDownload(a, c) : a.progressCancelled || this.showAppDetails(c, this.searchListType), a.appClick = !1, a.saveClick = !1, a.buyClick = !1, a.progressCancelled = !1, a.tapHighlight = !0, !0;
},
processDownload: function(a, b) {
b._appDownload = this.appdownloadmgr.getAppDownload(b.publicApplicationId);
if (b._appDownload.price === undefined) {
var c = {
publicApplicationId: b.publicApplicationId,
price: b.price,
title: b.title
};
b._appDownload.updateFromAppList(c);
}
b._appDownload.defaultAction();
},
showAppDetails: function(a, b) {
var c = findApps.ViewLibrary.getView("APPDETAILS");
c.setAppItem(a), c.setSource(b);
},
getAppItem: function(a, b) {
if (!this.appList || this.appList.length == 0) return !1;
var c = (new Date).getTime();
if (b >= 0) {
var d = this.appList[b];
if (d) {
if (b % 2 == 1) {
var e = this.$.app_item.getClassName();
this.$.app_item.setClassName(e + " app-list-even");
}
return d._appDownload || (d._appDownload = this.appdownloadmgr.belongToMyApp(d.publicApplicationId)), this.$.app_item.setAppItem(d, this.isSaveList), !0;
}
}
},
appListChanged: function() {
this.refresh(!0);
},
appListUpdated: function() {
this.refresh();
},
resizeHandler: function() {
var a = this.getBounds();
if (a.width == 0 || a.height == 0) return;
if (this.oldBounds && this.oldBounds.height == a.height && this.oldBounds.width == a.width) return;
this.oldBounds = a, enyo.application.appcatwindow.orientationChangeHandler(), this.inherited(arguments);
},
refresh: function(a) {
var b = this;
setTimeout(function() {
b._refresh.call(b, a);
}, 50);
},
_refresh: function(a) {
a ? this.$.app_list.punt() : this.$.app_list.resized();
}
});

// source/main/Apps.js

enyo.kind({
name: "findApps.Apps",
kind: "VFlexBox",
published: {
topCategory: 0,
storedQuery: {}
},
events: {
onShowScrim: "",
onHideScrim: "",
onAppItemClick: "",
onGotError: ""
},
components: [ {
kind: "HFlexBox",
className: "enyo-header acc-header-listselector",
components: [ {
kind: "ListSelector",
className: "",
name: "sub_categories",
onChange: "subCategorySelected"
}, {
kind: "Spacer",
flex: 1
}, {
kind: "ListSelector",
name: "app_filter_selector",
onChange: "appFilterChanged",
className: "appFilterSearch",
items: [ {
caption: $L("All"),
value: "all"
}, {
caption: $L("TouchPad"),
value: "touchpad_exclusive"
}, {
caption: $L("Phone"),
value: "phone_exclusive"
} ]
} ]
}, {
className: "apps-shadow"
}, {
name: "app_list1",
kind: "findApps.AppList",
flex: 1,
onAcquirePage: "acquireListPage"
} ],
create: function() {
this.inherited(arguments), this.appMetrics = enyo.application.appMetrics;
},
setAppFilter: function() {
var a = findApps.UserSession.getSession();
a != null && a.supportInfo && (this.appFilterOn = a.supportInfo.appFilterOn, this.appFilterOn && this.appFilterOn === !0 ? (this.appFilterType = enyo.getCookie("findapps.appFilterTypeBrowser") || "all", this.$.app_filter_selector.setValue(this.appFilterType)) : this.$.app_filter_selector.setShowing(!1));
},
appFilterChanged: function(a, b, c) {
b !== c && (this.appFilterType = b, enyo.setCookie("findapps.appFilterTypeBrowser", this.appFilterType), this.refresh(!0));
},
refreshList: function() {
this.$.app_list1.resized();
},
refresh: function(a) {
this.totalAppsCount = 0, a || (this.selectedSubCategory = null);
if (this.topCategory && this.storedQuery) {
var b = this.topCategory.id;
this.selectedSubCategory != null && (b = this.selectedSubCategory), this.getApps({
categoryid: b,
qid: this.storedQuery.queryId,
queryFragment: this.storedQuery.queryFragment,
sort: "DATE_DESC"
}, "BrowseAppsService");
} else this.error("Category or stored query not selected");
},
renderSubCategories: function() {
var a = [], b = "";
this.topCategory.subcategories && (a = this.topCategory.subcategories.map(function(a) {
return {
caption: a.name || a.label,
value: a.id
};
})), this.topCategory.id == 0 ? (a.unshift({
caption: $L("All Apps"),
icon: "images/" + (this.topCategory.iconLocation || "category-icons/home/") + "category-selector.png",
value: this.topCategory.categoryId
}), this.$.sub_categories.setItems(a), this.$.sub_categories.setValue(this.topCategory.categoryId), this.$.sub_categories.setHideArrow(!0), this.$.sub_categories.disabled = !0, this.$.sub_categories.removeClass("showIcon"), this.$.sub_categories.addStyles("background: ;")) : (b = "images/" + (this.topCategory.iconLocation || "category-icons/home/") + "category-selector.png", a.unshift({
caption: this.topCategory.label,
icon: b,
value: this.topCategory.categoryId
}), this.$.sub_categories.items && this.$.sub_categories.items.length > 0 && this.$.sub_categories.setValue(this.$.sub_categories.items[0].value), this.$.sub_categories.setItems(a), !this.selectedSubCategory || this.selectedSubCategory == null ? this.$.sub_categories.setValue(this.topCategory.categoryId) : this.$.sub_categories.setValue(this.selectedSubCategory), this.$.sub_categories.setHideArrow(!1), this.$.sub_categories.disabled = !1, this.$.sub_categories.addClass("showIcon"), this.$.sub_categories.addStyles("background: url(" + b + ") 4px no-repeat;")), this.$.sub_categories.render();
},
subCategorySelected: function(a, b, c) {
this.totalAppsCount = 0, this.selectedSubCategory = b, this.appMetrics && this.appMetrics.trackEvent("subcategory/" + b), this.getApps({
categoryid: b,
qid: this.storedQuery.queryId,
queryFragment: this.storedQuery.queryFragment,
sort: "DATE_DESC"
}, "BrowseAppsService");
},
acquireListPage: function(a, b) {
if (b > 0 && b < this.totalAppsCount) {
if (this.endPosition && this.endPosition > b) return;
var c = AppCatalog.Config.defaultPageSize, d, e = this.totalAppsCount - b + 1;
e < c ? d = e : d = c, this.getMoreApps({
categoryid: this.$.sub_categories.getValue(),
qid: this.storedQuery.queryId,
queryFragment: this.storedQuery.queryFragment,
startPosition: b,
count: d,
sort: "DATE_DESC"
}), this.endPosition = b + d;
}
},
isEmpty: function() {
return this.endPosition === -1 || this.totalAppsCount === 0 || this.$.app_list1.appList === [];
},
getApps: function(a) {
this.doShowScrim(), this.totalAppsCount = 0, this.endPosition = -1, this.appFilterOn === !0 && (a.appFilterType = this.appFilterType), findApps.BaseServer.getACServer().getAppList(a, "BrowseAppsService", {
onSuccess: "handleServerResponseInApps",
onFailure: "handleServerFailureInApps",
scope: this
});
},
getMoreApps: function(a) {
a.startPosition > 0 && (this.appFilterOn === !0 && (a.appFilterType = this.appFilterType), findApps.BaseServer.getACServer().getAppList(a, "GetMoreAppsService", {
onSuccess: "handleServerResponseInApps",
onFailure: "handleServerFailureInApps",
scope: this
}));
},
handleServerResponseInApps: function(a, b, c, d) {
var e = b.OutGetAppList.appList;
switch (d.service) {
case "GetMoreAppsService":
b.OutGetAppList && (this.doHideScrim(), e.appSummary && this.$.app_list1.appendToList(e.appSummary.length > 1 ? e.appSummary : [ e.appSummary ]));
break;
case "BrowseAppsService":
b.OutGetAppList && (this.doHideScrim(), e.appSummary ? (e.totalCount && (this.totalAppsCount = e.totalCount), this.endPosition = e.appSummary.length, this.$.app_list1.setAppList(e.appSummary.length > 1 ? e.appSummary : [ e.appSummary ])) : this.$.app_list1.setAppList([]), this.renderSubCategories());
}
},
handleServerFailureInApps: function(a, b, c, d, e) {
switch (d.service) {
case "GetMoreAppsService":
e.push("LOC06001"), this.doGotError(e);
break;
case "BrowseAppsService":
e.push("LOC06002"), this.doGotError(e);
}
}
});

// source/main/SearchApps.js

enyo.kind({
name: "findApps.SearchApps",
kind: "VFlexBox",
published: {
params: {},
categories: [],
storedQueries: null,
storedCategoryId: "",
storedQuery: {
queryId: "",
queryFragment: ""
}
},
events: {},
components: [ {
kind: "Scrim",
name: "scrim",
layoutKind: "VFlexLayout",
align: "center",
pack: "center",
animateShowing: !1,
components: [ {
kind: "SpinnerLarge",
name: "spinner",
showing: !1
} ]
}, {
kind: "findApps.Error",
onSubmit: "submitError",
onCancel: "cancelError"
}, {
name: "searchHeader",
className: "enyo-header",
components: [ {
style: "margin-top:6px;",
components: [ {
kind: "SearchInput",
name: "search_field",
width: "448px",
style: "margin:0px auto 6px auto;",
hint: $L("Type search terms here..."),
changeOnInput: "true",
onchange: "searchInputChange",
onkeypress: "onKeyPress",
onSearch: "searchHandler",
autoCapitalize: "lowercase",
spellcheck: !1,
autocorrect: !1,
onCancel: "cancelSearch"
}, {
name: "searchTitleHeader",
kind: "HFlexBox",
pack: "center",
align: "center",
style: "text-align: center; line-height: 38px;",
components: [ {
name: "headerIcon",
style: "margin-right: 10px",
showing: !1,
kind: enyo.Image
}, {
name: "headerTitle",
kind: enyo.Control
} ]
} ]
} ]
}, {
name: "emptyInstructions",
height: "1024px",
showing: !0,
style: "text-align:center;background-color:#e7e7e7;",
components: [ {
className: "top-shadow",
style: "width:100%"
}, {
kind: "VFlexBox",
width: "560px",
style: "margin:auto;color:#46484b;",
components: [ {
name: "bigSearchIcon",
style: "margin:168px 0 0 0;",
kind: enyo.Image,
src: "images/empty-scene-search-icon.png"
}, {
name: "description",
content: $L("Type here to search for apps in App Catalog")
} ]
} ]
}, {
name: "search_info",
height: "50px",
className: "search-info",
showing: !1,
style: "",
content: $L("")
}, {
kind: "Pane",
name: "pane",
flex: 1,
className: "pane",
components: [ {
name: "search_result",
kind: "HFlexBox",
horizontal: !1,
autoHorizontal: !1,
showing: !1,
components: [ {
className: "top-shadow"
}, {
className: "right-shadow"
}, {
name: "search_categories",
className: "category-list",
kind: "VirtualList",
onSetupRow: "setupCategoriesRow",
width: "240px",
components: [ {
name: "categoryItem",
kind: "Item",
tapHighlight: !0,
style: "",
components: [ {
kind: "HFlexBox",
onclick: "categoryClicked",
align: "center",
components: [ {
name: "category_icon",
kind: "Image"
}, {
name: "category_name",
className: "search-category-name",
flex: 1
}, {
name: "category_count",
className: "search-category-count"
} ]
} ]
} ]
}, {
kind: "VFlexBox",
flex: 1,
components: [ {
kind: "HFlexBox",
components: [ {
kind: "VFlexBox",
align: "center",
pack: "center",
className: "radiohead",
flex: 1,
components: [ {
kind: "RadioGroup",
name: "stored_queries",
onChange: "storedQuerySelected",
width: "315px",
components: [ {
label: $L("Recommended")
}, {
label: $L("Newest")
}, {
label: $L("All")
} ]
} ]
}, {
kind: "ListSelector",
className: "radiohead",
name: "app_filter_selector",
onChange: "appFilterChanged",
showing: !1,
items: [ {
caption: $L("All"),
value: "all"
}, {
caption: $L("TouchPad"),
value: "touchpad_exclusive"
}, {
caption: $L("Phone"),
value: "phone_exclusive"
} ]
} ]
}, {
className: "apps-shadow"
}, {
name: "noFoundInstructions",
flex: 1,
showing: !1,
style: "text-align:center;background-color:#e7e7e7;",
components: [ {
kind: "VFlexBox",
width: "500px",
style: "margin:auto;color:#46484b;",
components: [ {
style: "margin:20px 0 0 0;",
kind: enyo.Image,
src: "images/empty-scene-search-icon.png"
}, {
content: $L("Sorry, the search did not find any matching apps. Check your spelling or try a new entry.")
} ]
} ]
}, {
flex: 1,
name: "app_list1",
kind: "findApps.AppList",
onAcquirePage: "acquireNextPage"
} ]
} ]
} ]
} ],
create: function() {
this.inherited(arguments), this.selectedCategoryIndex = 0;
},
appFilterChanged: function(a, b, c) {
b !== c && (this.appFilterType = b, enyo.setCookie("findapps.appFilterTypeSearch", this.appFilterType), this.resetCategorySelection(), this.launchSearch(null, null));
},
receiveResponse: function(a, b, c) {
a === "userSession" && (enyo.application.sessionManager.removeListener(this, "userSession"), b ? (this.reset(), this.entryPointMethod()) : (c.push("LOC08000"), this.displayError(c)));
},
setupCategoriesRow: function(a, b) {
var c = this.fetchCategoryItem(b);
if (c) {
var d = findApps.BaseServer.getCategoryInfo(c.id);
if (d) {
this.$.category_name.setContent(d.label), this.$.category_icon.setSrc(d.icon), this.$.category_count.setContent(c.count);
var e = b == this.selectedCategoryIndex;
return e ? this.$.categoryItem.addClass("enyo-held") : this.$.categoryItem.removeClass("enyo-held"), !0;
}
}
},
fetchCategoryItem: function(a) {
return this.categories ? this.categories[a] : null;
},
executeSearch: function(a) {
if (a) {
this.$.scrim.show(), this.$.spinner.setShowing(!0), this.searchParams = {
includeCategoryBreakdown: !0
}, this.searchParams = enyo.mixin(this.searchParams, a), this.connectors != "" && (this.searchParams.provides = this.connectors), this.searchParams.sort || (this.searchParams.sort = "NAME_ASC"), this.lastServerCallTimestamp = (new Date).getTime(), this.searchParams.corelationId = this.lastServerCallTimestamp, this.totalCount = 0, this.endPosition = -1, this.appFilterOn === !0 && (this.searchParams.appFilterType = this.appFilterType);
var b = {};
b = enyo.mixin(b, this.searchParams), findApps.BaseServer.getACServer().getAppList(b, "SearchAppsService", {
onSuccess: "gotApps",
onFailure: "gotError",
scope: this
});
}
},
reset: function() {
if (this.autoSearchDelay === undefined && findApps.UserSession._session != null && findApps.UserSession._session.supportInfo) {
this.autoSearchDelay = findApps.UserSession._session.supportInfo.autoSearchDelay, this.autoSearchEnabled = findApps.UserSession._session.supportInfo.autoSearchEnabled;
if (this.autoSearchDelay === undefined || this.autoSearchDelay === null) this.autoSearchDelay = 100;
if (this.autoSearchEnabled === undefined || this.autoSearchEnabled === null) this.autoSearchEnabled = !0;
this.autoSearchEnabled && this.$.search_field.setKeypressInputDelay(this.autoSearchDelay);
}
this.appFilterOn === undefined && findApps.UserSession._session != null && findApps.UserSession._session.supportInfo && (this.appFilterOn = findApps.UserSession._session.supportInfo.appFilterOn, this.appFilterOn && this.appFilterOn === !0 && (this.$.newLabel.setShowing(!1), this.$.freeLabel.removeClass("enyo-middle"), this.$.freeLabel.addClass("enyo-last"), this.$.app_filter_selector.setShowing(!0), this.appFilterType = enyo.getCookie("findapps.appFilterTypeSearch") || "all", this.$.app_filter_selector.setValue(this.appFilterType)));
if (this.storedQueries == null) {
var a = findApps.UserSession.getSession();
a != null && a.queryButtons && a.queryButtons.DEFAULT && (this.$.stored_queries.setValue(0), this.storedQueries = a.queryButtons.DEFAULT, this.storedQueriesType = "DEFAULT", this.storedQuery = this.getQueryByButtonIndex());
}
this.$.app_list1.refresh(), this.$.search_categories.refresh(), enyo.string.trim(this.$.search_field.getValue()).length == 0 && this.$.search_field.forceFocus();
},
refresh: function() {
var a = findApps.UserSession.getSession();
a != null && this.$.search_field.getValue() && (this.resetCategorySelection(), this.launchSearch(this, {
rowIndex: -1
}));
},
searchInputChange: function(a, b) {
this.autoSearchEnabled && (this.resetCategorySelection(), this.launchSearch(a, b));
},
onKeyPress: function(a, b) {
b.charCode == 13 && (this.searchInputChange(a, b), this.$.search_field.forceBlur());
},
cancelSearch: function(a, b) {
this.$.stored_queries.setValue(0), this.resetCategorySelection(), this.launchSearch(a, b);
},
searchHandler: function(a, b) {
this.resetCategorySelection(), this.launchSearch(a, b), a.forceBlur();
},
launchSearch: function(a, b) {
var c;
this.hideNoApp();
if (this.searchFieldSearch == 1) {
if (enyo.string.trim(this.$.search_field.getValue()).length == 0) {
this.$.search_result.hide(), this.$.search_field.setHint($L("Type search terms here...")), this.$.emptyInstructions.show();
return;
}
c = {
queryStr: enyo.string.trim(this.$.search_field.getValue()),
qid: this.storedQuery.queryId,
queryFragment: this.storedQuery.queryFragment,
categoryid: this.storedCategoryId
};
} else c = {}, c = enyo.mixin(c, this.params), c.categoryid = this.storedCategoryId, c.qid || (c.qid = this.storedQuery.queryId), c.queryFragment || (c.queryFragment = this.storedQuery.queryFragment);
this.$.scrim.show(), this.$.spinner.setShowing(!0), this.executeSearch(c);
},
categoriesChanged: function() {
this.totalCount >= 0 && this.categories.unshift({
id: "",
count: this.totalCount
}), this.$.search_categories.punt();
},
paramsChanged: function() {
this.hideNoApp(), this.$.scrim.show(), this.$.spinner.setShowing(!0);
var a = enyo.application.sessionManager.triggerInitSession(this);
if (a && a.status === "inprogress") return;
this.entryPointMethod();
},
update: function(a, b) {
a == "resize" && (this.$.app_list1.resized(), this.$.search_categories.resized(), this.$.app_list1.refresh(), this.$.search_categories.refresh());
},
listResized: function() {
this.$.app_list1.resized(), this.$.search_categories.resized(), this.$.app_list1.refresh(), this.$.search_categories.refresh();
},
entryPointMethod: function() {
this.$.scrim && (this.$.scrim.hide(), this.$.spinner.setShowing(!1));
var a = !0;
this.connectors = "", this.selectedCategoryIndex = 0, this.categorySearch = !1;
if (this.params.hideSearchField && this.params.hideSearchField == 1 || this.params.type && this.params.type == "connector") {
this.searchFieldSearch = !1, this.$.search_field.hide(), this.params.title ? this.$.headerTitle.setContent(this.params.title) : this.$.headerTitle.setContent("");
if (this.params.type && this.params.type == "connector") {
var b = $L("Synergy Services");
this.params.connectorInfo && this.params.connectorInfo.searchBarTitle && this.params.connectorInfo.searchBarTitle != "" && (b = this.params.connectorInfo.searchBarTitle), this.$.headerTitle.setContent(b);
var c = "images/appcatalog.png";
this.params.connectorInfo && this.params.connectorInfo.searchBarIcon && this.params.connectorInfo.searchBarIcon != "" && (c = this.params.connectorInfo.searchBarIcon), this.$.headerIcon.setSrc(c);
if (this.params.connectorInfo && this.params.connectorInfo.types) {
for (var d = 0; d < this.params.connectorInfo.types.length; d++) {
var e = this.params.connectorInfo.types[d];
e !== "noApp" && e !== "dockMode" && e !== "universalSearch" && (this.params.connectorInfo.types[d] = "connector/" + this.params.connectorInfo.types[d].toUpperCase());
}
this.connectors = this.params.connectorInfo.types.join(",");
}
}
this.storedCategoryId = "", this.params.categoryid = "", this.$.headerTitle.getContent() === "" ? this.$.searchHeader.hide() : (this.$.searchTitleHeader.show(), this.$.searchHeader.show());
} else this.$.search_field.show(), this.$.searchHeader.show(), this.storedCategoryId = this.userSelectedCategoryId || "", this.storedQuery = this.userSelectedStoredQuery, this.params.type && this.params.type == "query" && (this.params.queryStr = decodeURIComponent(this.params.search)), this.params.queryStr ? this.$.search_field.setValue(this.params.queryStr) : (this.params.queryStr = this.$.search_field.getValue(), this.params.categoryid = this.userSelectedCategoryId || "", this.params.qid = this.userSelectedStoredQuery ? this.userSelectedStoredQuery.queryId : undefined, this.params.queryFragment = this.userSelectedStoredQuery ? this.userSelectedStoredQuery.queryFragment : undefined, enyo.string.trim(this.$.search_field.getValue()) == "" ? (this.$.search_result.hide(), this.$.search_field.setHint($L("Type search terms here...")), this.$.emptyInstructions.show(), a = !1) : this.searchFieldSearch == 1 && (a = !1)), this.$.searchTitleHeader.hide(), this.searchFieldSearch = !0;
this.params.comingFrom && this.params.comingFrom == "details" ? this.$.app_list1.searchListType = "devappssearch" : this.$.app_list1.searchListType = "directsearch";
var f = this.params, g = this.getButtonIndexByQId(f.qid);
this.$.stored_queries.setValue(g);
var h = findApps.UserSession.getSession();
h != null && h.queryButtons && h.queryButtons.DEFAULT && (this.storedQueries = h.queryButtons.DEFAULT, this.storedQueriesType = "DEFAULT", this.storedQuery = this.getQueryByButtonIndex(), f.qid || (f.qid = this.storedQuery.queryId), f.queryFragment || (f.queryFragment = this.storedQuery.queryFragment)), this.searchFieldSearch == 1 && (this.userSelectedCategoryId = "", this.userSelectedStoredQuery = this.storedQuery), a == 1 && this.executeSearch(f);
},
gotApps: function(a, b, c, d) {
if (c && c.params) {
var e = JSON.parse(c.params), f = e.corelationId;
if (f && f != this.lastServerCallTimestamp) return;
}
if (b.OutGetAppList) {
this.$.scrim.hide(), this.$.spinner.setShowing(!1);
if (d.service && d.service == "SearchAppsService") {
this.totalCount = b.OutGetAppList.appList.totalCount, this.displaySearchedResult(), b.OutGetAppList.appList.appSummary && (this.endPosition = b.OutGetAppList.appList.appSummary.length), b.OutGetAppList.appList.appSummary ? this.$.app_list1.setAppList(b.OutGetAppList.appList.appSummary.length > 1 ? b.OutGetAppList.appList.appSummary : [ b.OutGetAppList.appList.appSummary ]) : this.$.app_list1.setAppList([]);
if (!this.categorySearch || this.categorySearch == 0) this.categories = findApps.BaseServer.getRelevantSearchCategories(b.OutGetAppList.categories) || [], this.categoriesChanged();
} else b.OutGetAppList.appList.appSummary && this.$.app_list1.appendToList(b.OutGetAppList.appList.appSummary.length > 1 ? b.OutGetAppList.appList.appSummary : [ b.OutGetAppList.appList.appSummary ]);
this.categorySearch = !1;
}
},
gotError: function(a, b, c, d, e) {
this.categorySearch = !1, this.categories = null, this.$.scrim.hide(), this.$.spinner.setShowing(!1), this.$.emptyInstructions.hide(), e.push("LOC08002"), this.displayError(e);
},
displaySearchedResult: function() {
this.totalCount || (this.totalCount = 0);
var a = new enyo.g11n.Template($L('#{count} Results for "#{queryStr}" were found'));
this.searchFieldSearch == 1 ? this.$.search_info.setContent(a.evaluate({
count: this.totalCount,
queryStr: this.$.search_field.getValue()
})) : (a = new enyo.g11n.Template($L("#{count} Results were found")), this.$.search_info.setContent(a.evaluate({
count: this.totalCount
}))), this.searchFieldSearch == 1 && this.$.search_field.getValue() == "" ? (this.$.emptyInstructions.show(), this.$.search_result.hide()) : (this.$.emptyInstructions.hide(), this.$.search_result.show(), this.totalCount == 0 && this.showNoApp());
},
showNoApp: function() {
this.$.app_list1.hide(), this.$.noFoundInstructions.show();
},
hideNoApp: function() {
this.$.app_list1.show(), this.$.noFoundInstructions.hide();
},
acquireNextPage: function(a, b) {
if (b > 0 && b < this.totalCount) {
if (this.endPosition && this.endPosition > b) return;
var c = AppCatalog.Config.defaultPageSize, d, e = this.totalCount - b + 1;
e < c ? d = e : d = c;
var f = {
startPosition: b,
count: d
};
f = enyo.mixin(f, this.searchParams), this.lastServerCallTimestamp = (new Date).getTime(), f.corelationId = this.lastServerCallTimestamp, this.appFilterOn === !0 && (f.appFilterType = this.appFilterType), findApps.BaseServer.getACServer().getAppList(f, "SearchMoreAppsService", {
onSuccess: "gotApps",
onFailure: "gotError",
scope: this
}), this.endPosition = b + d;
}
},
displayError: function(a) {
findApps.ViewLibrary._container.isTopView(this.owner) && this.$.error.displayError(a);
},
submitError: function() {
this.$.error.cancel();
},
cancelError: function() {
this.$.error.cancel();
},
categoryClicked: function(a, b) {
var c = this.fetchCategoryItem(b.rowIndex), d = c ? c.id : "";
this.storedCategoryId = d, this.searchFieldSearch == 1 && (this.userSelectedCategoryId = d), this.categorySearch = !0, this.selectedCategoryIndex = b.rowIndex, this.$.search_categories.refresh(), this.launchSearch(a, b);
},
resetCategorySelection: function() {
this.storedCategoryId = "", this.searchFieldSearch == 1 && (this.userSelectedCategoryId = ""), this.categorySearch = !1, this.selectedCategoryIndex = 0;
},
storedQuerySelected: function(a) {
this.hideNoApp(), this.resetCategorySelection(), this.storedQuery = this.getQueryByButtonIndex(), this.searchFieldSearch == 1 && (this.userSelectedStoredQuery = this.storedQuery);
var b;
if (this.searchFieldSearch == 1) {
if (enyo.string.trim(this.$.search_field.getValue()).length == 0) {
this.$.search_result.hide(), this.$.search_field.setHint($L("Type search terms here...")), this.$.emptyInstructions.show();
return;
}
b = {
queryStr: enyo.string.trim(this.$.search_field.getValue()),
qid: this.storedQuery.queryId,
queryFragment: this.storedQuery.queryFragment,
categoryid: this.storedCategoryId
};
} else b = {
categoryid: this.storedCategoryId
}, b = enyo.mixin(b, this.params), b.qid = this.storedQuery.queryId, b.queryFragment = this.storedQuery.queryFragment;
this.$.scrim.show(), this.$.spinner.setShowing(!0), this.executeSearch(b);
},
getQueryByButtonIndex: function() {
var a = [ "HOME-DartfishQuery1", "HOME-DartfishQuery2", "HOME-DartfishQuery3", "HOME-DartfishQuery4" ], b = [ "DEFAULT-DartfishQuery5", "DEFAULT-DartfishQuery6", "DEFAULT-DartfishQuery7", "DEFAULT-DartfishQuery8" ], c = a;
this.storedQueriesType === "DEFAULT" && (c = b);
var d = this.$.stored_queries.getValue(), e = this.storedQueries;
for (var f = 0; f < e.length; f++) if (e[f].queryId === c[d]) return e[f];
},
getButtonIndexByQId: function(a) {
var b = [ "HOME-DartfishQuery1", "HOME-DartfishQuery2", "HOME-DartfishQuery3", "HOME-DartfishQuery4" ], c = [ "DEFAULT-DartfishQuery5", "DEFAULT-DartfishQuery6", "DEFAULT-DartfishQuery7", "DEFAULT-DartfishQuery8" ], d = 0;
return a && (b.indexOf(a) != -1 ? d = b.indexOf(a) : c.indexOf(a) != -1 && (d = c.indexOf(a))), d;
}
});

// source/main/AppCatalog.js

enyo.kind({
name: "findApps.AppCatalog",
kind: enyo.VFlexBox,
storedQueries: null,
_selectedCatIndex: 0,
components: [ {
kind: "Scrim",
name: "scrim",
layoutKind: "VFlexLayout",
animateShowing: !1,
align: "center",
pack: "center",
components: [ {
kind: "SpinnerLarge",
name: "spinner",
showing: !1
} ]
}, {
kind: "findApps.Error"
}, {
kind: "VFlexBox",
align: "center",
pack: "center",
className: "radiohead",
components: [ {
kind: "RadioGroup",
name: "stored_queries",
onChange: "storedQuerySelected",
components: [ {
name: "stored_query_1",
label: $L("Recommended")
}, {
label: $L("Newest")
}, {
label: $L("All")
} ]
} ]
}, {
kind: "Pane",
name: "pane",
flex: 1,
className: "pane",
components: [ {
name: "browser",
kind: "HFlexBox",
className: "enyo-bg",
components: [ {
name: "categories",
kind: "findApps.Categories",
flex: 0,
width: "240px",
onCategoryClick: "updateApps"
}, {
name: "apps",
kind: "findApps.Apps",
flex: 1,
onShowScrim: "showScrim",
onHideScrim: "hideScrim",
onGotError: "handleGetAppsError",
onAppItemClick: "showAppDetails"
} ]
} ]
}, {
name: "app_save",
kind: "findApps.SaveButton",
showing: !1
} ],
create: function() {
this.inherited(arguments), this.appMetrics = enyo.application.appMetrics, this.firstLaunch = !0, this.registered = !1;
},
constructed: function() {
this.inherited(arguments), typeof HACKS != "undefined" && HACKS.HACK_ENYO_DEFAULT_GUI_EVENT_HANDLER(this);
},
showAppDetails: function(a, b) {
var c = findApps.ViewLibrary.getView("APPDETAILS");
c.setAppItem(b);
},
updateApps: function(a, b) {
var c = b || this._selectedCatIndex, d = findApps.UserSession.getSession();
if (d != null) {
var e = d.categories[c], f = e.id;
f == 0 ? (this.storedQueries = d.queryButtons.HOME, this.storedQueriesType = "HOME", this.$.apps.setStoredQuery(this.getQueryByButtonIndex()), this.appMetrics && this.appMetrics.trackNewScene("categories/home"), this.$.stored_query_1.setCaption($L("Recommended"))) : (this.storedQueries = d.queryButtons.DEFAULT, this.storedQueriesType = "DEFAULT", this.$.apps.setStoredQuery(this.getQueryByButtonIndex()), this.appMetrics && this.appMetrics.trackNewScene("categories/" + e.label), this.$.stored_query_1.setCaption($L("Recommended"))), this.$.apps.setTopCategory(e), this.$.apps.refresh(), this.$.categories.setCurrentSelectRowIndex(c), this.$.apps.renderSubCategories();
} else this.storedQueries = d.queryButtons.DEFAULT, this.storedQueriesType = "DEFAULT", this.$.apps.setStoredQuery(this.getQueryByButtonIndex()), this.appMetrics && this.appMetrics.trackNewScene("categories/" + e.label), this.$.stored_query_1.setCaption($L("Recommended"));
this.$.apps.setTopCategory(e), this.$.apps.refresh(), this.$.categories.setCurrentSelectRowIndex(c), this.$.apps.renderSubCategories();
},
receiveResponse: function(a, b, c) {
a === "userSession" && (enyo.application.sessionManager.removeListener(this, "userSession"), b ? findApps.ViewLibrary._container.isTopView(this.owner) ? this.reset() : this.prefetch() : findApps.ViewLibrary._container.isTopView(this.owner) && (c.push("LOC06006"), this.displayError(c)));
},
prefetch: function() {
var a = enyo.application.sessionManager.triggerInitSession(this);
if (a && a.status === "inprogress") return;
var b = findApps.UserSession._session;
if (b.queryButtons && b.queryButtons.HOME && b.queryButtons.HOME.length == 0 || b.categories && b.categories.length == 0) return;
if (this.firstLaunch) {
this.$.stored_queries.setValue(0), this.storedQueries = b.queryButtons.HOME, this.$.categories.setCategories(b.categories), this.storedQueriesType = "HOME", this.$.apps.setStoredQuery(this.getQueryByButtonIndex()), this.$.apps.setTopCategory(b.categories[0]), this.$.apps.setAppFilter(), this.$.apps.refresh(), this.$.categories.refresh(), this.firstLaunch = !1, this.$.stored_query_1.setCaption($L("Recommended"));
return;
}
},
reset: function() {
var a = enyo.application.sessionManager.triggerInitSession(this);
if (a && a.status === "inprogress") {
this.showScrim();
return;
}
var b = findApps.UserSession._session;
if (b.queryButtons && b.queryButtons.HOME && b.queryButtons.HOME.length == 0 || b.categories && b.categories.length == 0) {
this.displayError([ "LOC06005" ]);
return;
}
if (this.firstLaunch) {
this.showScrim(), this.$.stored_queries.setValue(0), this.storedQueries = b.queryButtons.HOME, this.$.categories.setCategories(b.categories), this.storedQueriesType = "HOME", this.$.apps.setStoredQuery(this.getQueryByButtonIndex()), this.$.apps.setTopCategory(b.categories[0]), this.$.apps.setAppFilter(), this.$.apps.refresh(), this.$.categories.refresh(), this.firstLaunch = !1, this.$.stored_query_1.setCaption($L("Recommended"));
return;
}
this.$.apps.refreshList(), this.$.categories.refresh(), this.$.apps.isEmpty() && this.refresh();
},
refresh: function() {
this.updateApps();
},
storedQuerySelected: function(a) {
var b = this.getQueryByButtonIndex();
this.$.apps.setStoredQuery(b), this.$.apps.refresh(!0), this.appMetrics && this.appMetrics.trackEvent("stored_query/storedQuerySelected");
},
handleGetAppsError: function(a, b) {
this.hideScrim(), b.push("LOC06008"), this.displayError(b);
},
hideScrim: function() {
this.$.scrim && (this.$.scrim.hide(), this.$.spinner.setShowing(!1));
},
showScrim: function() {
this.$.scrim && (this.$.scrim.show(), this.$.spinner.setShowing(!0));
},
update: function(a, b) {
switch (a) {
case "resize":
this.$.apps.refreshList(), this.$.categories.refresh();
}
},
displayError: function(a) {
this.hideScrim(), findApps.ViewLibrary._container.isTopView(this.owner) && this.$.error.displayError(a);
},
getQueryByButtonIndex: function() {
var a = [ "HOME-DartfishQuery1", "HOME-DartfishQuery2", "HOME-DartfishQuery3", "HOME-DartfishQuery4" ], b = [ "DEFAULT-DartfishQuery5", "DEFAULT-DartfishQuery6", "DEFAULT-DartfishQuery7", "DEFAULT-DartfishQuery8" ], c = a;
this.storedQueriesType === "DEFAULT" && (c = b);
var d = this.$.stored_queries.getValue(), e = this.storedQueries;
for (var f = 0; f < e.length; f++) if (e[f].queryId === c[d]) return e[f];
}
});

// source/main/SavedApps.js

enyo.kind({
name: "findApps.SavedApps",
kind: "enyo.VFlexBox",
published: {
appList: []
},
components: [ {
kind: "Scrim",
name: "scrim",
layoutKind: "VFlexLayout",
align: "center",
pack: "center",
animateShowing: !1,
components: [ {
kind: "SpinnerLarge",
name: "spinner",
showing: !1
} ]
}, {
kind: "findApps.Error",
onSubmit: "submitError",
onCancel: "cancelError"
}, {
name: "emptyInstructions",
height: "1024px",
showing: !0,
style: "text-align:center;background-color:#e7e7e7;",
components: [ {
kind: "VFlexBox",
width: "560px",
style: "margin:auto;color:#46484b;",
components: [ {
name: "bigSavedIcon",
style: "margin:168px 0 10px 0;",
kind: enyo.Image,
src: "images/empty-scene-bookmark-icon.png"
}, {
name: "description",
className: "enyo-text-header",
content: $L("To add bookmarks, tap the Bookmark icon next to the application. Any saved bookmarks appear on this page so you can view and manage them.")
} ]
} ]
}, {
name: "app_list1",
kind: "findApps.AppList",
className: "saved-items",
flex: 1,
isSaveList: !0,
onSaveListEmpty: "handleSaveListEmpty"
} ],
create: function() {
this.inherited(arguments);
},
prefetch: function() {
this.getSavedList(!1);
},
handleSaveListEmpty: function(a) {
this.$.emptyInstructions.show(), this.$.app_list1.hide();
},
getSavedList: function(a) {
var b = enyo.application.savedList.getList(), c = {
packageIds: b,
sort: "DATE_DESC"
};
c.packageIds.length > 0 ? (this.$.emptyInstructions.hide(), this.$.app_list1.show(), a && (this.$.scrim.show(), this.$.spinner.setShowing(!0)), findApps.BaseServer.getACServer().getAppList(c, "SavedAppsService", {
onSuccess: "gotSavedList",
onFailure: "gotError",
scope: this
})) : (this.$.emptyInstructions.show(), this.$.app_list1.hide());
},
gotSavedList: function(a, b, c, d) {
this.$.scrim.hide(), this.$.spinner.setShowing(!1);
if (b.OutGetAppList) {
var e = b.OutGetAppList.appList, f = e.appSummary, g = e.totalCount;
this.$.app_list1.setAppList(g > 1 ? f : [ f ]), findApps.ViewLibrary._container.updateSavedList(g, f), g == 0 && (this.$.emptyInstructions.show(), this.$.app_list1.hide());
}
},
gotError: function(a, b, c, d, e) {
this.$.scrim.hide(), this.$.scrim.setShowing(!1), e.push("LOC09000"), this.displayError(e);
},
displayError: function(a) {
findApps.ViewLibrary._container.isTopView(this.owner) && this.$.error.displayError(a);
},
submitError: function() {
this.$.error.cancel();
},
cancelError: function() {
this.$.error.cancel();
},
update: function(a, b) {
a == "resize" && this.$.app_list1.refresh();
}
});

// source/details/AverageRating.js

enyo.kind({
name: "findApps.AverageRating",
kind: "VFlexBox",
className: "average-rating",
width: "220px",
published: {
appRatingData: null
},
components: [ {
kind: "HFlexBox",
pack: "center",
height: "90px",
style: "margin-bottom:4px;",
components: [ {
width: "64px",
components: [ {
name: "positive_rating",
height: "64px",
className: "small-bubble small-positive-rating",
components: [ {
name: "positive_rating_value",
className: "value"
} ]
}, {
content: $L("positive"),
style: "text-transform:lowercase;color:#60913d;font-size:16px;text-align:right;margin-right:4px;"
} ]
}, {
width: "64px",
components: [ {
name: "negative_rating",
height: "64px",
className: "small-bubble small-negative-rating",
components: [ {
name: "negative_rating_value",
className: "value"
} ]
}, {
content: $L("negative"),
style: "text-transform:lowercase;color:#911d21;font-size:16px;text-align:left;margin-left:4px;"
} ]
} ]
}, {
kind: "HFlexBox",
components: [ {
kind: "Image",
src: "images/stars/stars-mono-5.png"
}, {
kind: "ProgressBar",
flex: 1,
position: "0",
name: "five_stars",
domStyles: {
color: "gray"
},
className: "grey-progress"
}, {
name: "star_count5",
content: "0",
style: "margin-left:20px;"
} ]
}, {
kind: "HFlexBox",
components: [ {
kind: "Image",
src: "images/stars/stars-mono-4.png"
}, {
kind: "ProgressBar",
flex: 1,
position: "0",
name: "four_stars",
className: "grey-progress"
}, {
name: "star_count4",
content: "0",
style: "margin-left:20px;"
} ]
}, {
kind: "HFlexBox",
components: [ {
kind: "Image",
src: "images/stars/stars-mono-3.png"
}, {
kind: "ProgressBar",
flex: 1,
position: "0",
name: "three_stars",
className: "grey-progress"
}, {
name: "star_count3",
content: "0",
style: "margin-left:20px;"
} ]
}, {
kind: "HFlexBox",
components: [ {
kind: "Image",
src: "images/stars/stars-mono-2.png"
}, {
kind: "ProgressBar",
flex: 1,
position: "0",
name: "two_stars",
className: "grey-progress"
}, {
name: "star_count2",
content: "0",
style: "margin-left:20px;"
} ]
}, {
kind: "HFlexBox",
components: [ {
kind: "Image",
src: "images/stars/stars-mono-1.png"
}, {
kind: "ProgressBar",
flex: 1,
position: "0",
name: "one_star",
className: "grey-progress"
}, {
name: "star_count1",
content: "0",
style: "margin-left:20px;"
} ]
} ],
reset: function() {
this.$.positive_rating.setClassName("small-bubble small-positive-rating"), this.$.positive_rating_value.setContent(""), this.$.negative_rating.setClassName("small-bubble small-negative-rating"), this.$.negative_rating_value.setContent(""), this.$.star_count5.setContent(0), this.$.star_count4.setContent(0), this.$.star_count3.setContent(0), this.$.star_count2.setContent(0), this.$.star_count1.setContent(0), this.$.five_stars.setPosition(0), this.$.four_stars.setPosition(0), this.$.three_stars.setPosition(0), this.$.two_stars.setPosition(0), this.$.one_star.setPosition(0);
},
setRatingBubbles: function() {
this.appRatingData.percentPositive == this.appRatingData.percentNegative && (this.$.positive_rating.setClassName("big-bubble big-positive-rating"), this.$.negative_rating.setClassName("big-bubble big-negative-rating")), this.appRatingData.percentPositive > this.appRatingData.percentNegative && (this.$.positive_rating.setClassName("big-bubble big-positive-rating"), this.$.negative_rating.setClassName("small-bubble small-negative-rating")), this.appRatingData.percentPositive < this.appRatingData.percentNegative && (this.$.positive_rating.setClassName("small-bubble small-positive-rating"), this.$.negative_rating.setClassName("big-bubble big-negative-rating"));
},
appRatingDataChanged: function() {
this.setRatingBubbles(), this.appRatingData.percentPositive !== undefined && this.$.positive_rating_value.setContent(findApps.Utilities.Formatter.formatPercent(this.appRatingData.percentPositive)), this.appRatingData.percentNegative !== undefined && this.$.negative_rating_value.setContent(findApps.Utilities.Formatter.formatPercent(this.appRatingData.percentNegative)), this.appRatingData.stars && (this.$.star_count5.setContent(this.appRatingData.stars[5]), this.$.star_count4.setContent(this.appRatingData.stars[4]), this.$.star_count3.setContent(this.appRatingData.stars[3]), this.$.star_count2.setContent(this.appRatingData.stars[2]), this.$.star_count1.setContent(this.appRatingData.stars[1]), this.$.five_stars.setPosition(Math.round(this.appRatingData.stars[5] * 100 / this.appRatingData.totalCount)), this.$.four_stars.setPosition(Math.round(this.appRatingData.stars[4] * 100 / this.appRatingData.totalCount)), this.$.three_stars.setPosition(Math.round(this.appRatingData.stars[3] * 100 / this.appRatingData.totalCount)), this.$.two_stars.setPosition(Math.round(this.appRatingData.stars[2] * 100 / this.appRatingData.totalCount)), this.$.one_star.setPosition(Math.round(this.appRatingData.stars[1] * 100 / this.appRatingData.totalCount)));
}
});

// setup.js

var AppCatalog = {
Config: {
wsTimeout: 6e4,
defaultPageSize: 50,
testServerErrors: !1,
CacheConfig: {
enabled: !0,
persistent: !1,
longTermTTL: 36e5,
shortTermTTL: 9e5
}
}
};

// source/payment/ProfilePasswordPrompt.js

enyo.kind({
name: "findApps.ProfilePasswordPrompt",
kind: enyo.Control,
events: {
onSubmit: "",
onForgetPassword: "",
onCancel: ""
},
components: [ {
kind: "Scrim",
animateShowing: !1,
name: "scrim",
layoutKind: "VFlexLayout",
align: "center",
pack: "center",
components: [ {
kind: "SpinnerLarge",
name: "spinner",
showing: !1
} ]
}, {
content: $L("Password Required"),
className: "enyo-text-header",
style: "text-align:center;"
}, {
content: $L("Please enter the password for this HP webOS Account:"),
className: "enyo-paragraph"
}, {
name: "accntEmail",
className: "enyo-text-subheader",
style: "padding: 0 0 12px 0;"
}, {
kind: "PasswordInput",
alwaysLooksFocused: !0,
hint: $L("Enter password"),
onkeyup: "passwordKeyupHandler"
}, {
name: "errorLength",
showing: !1,
content: $L("Password must be between 6 and 20 characters long."),
className: "enyo-text-error",
style: "padding: 3px 0;"
}, {
name: "errorIncorrect",
showing: !1,
content: $L("Incorrect password. Please try again."),
className: "enyo-text-error",
style: "padding: 3px 0;"
}, {
name: "errorMessage",
showing: !1,
content: "",
className: "enyo-text-error",
style: "padding: 3px 0;"
}, {
kind: "VFlexBox",
style: "padding-top: 6px;",
components: [ {
kind: "Button",
className: "enyo-button-affirmative",
caption: $L("OK"),
onclick: "passwordCheck"
}, {
name: "forgetPwd",
kind: "Button",
showing: !1,
caption: $L("Forgot Password"),
onclick: "doForgetPassword"
}, {
kind: "Button",
caption: $L("Cancel"),
onclick: "doCancel"
} ]
} ],
focusInput: function() {
this.$.passwordInput.forceFocus();
},
passwordCheck: function(a) {
this.doSubmit();
},
getPassword: function() {
return this.$.passwordInput.getValue();
},
showLengthError: function() {
this.$.errorMessage.setContent($L("Password must be between 6 and 20 characters long.")), this.$.errorMessage.show(), this.$.passwordInput.forceFocus();
},
showIncorrectError: function() {
this.$.errorMessage.setContent($L("Incorrect password. Please try again.")), this.$.errorMessage.show(), this.$.passwordInput.forceSelect();
},
showOtherError: function(a) {
this.$.errorMessage.setContent($L(a)), this.$.errorMessage.show(), this.$.passwordInput.forceFocus();
},
resetPassword: function() {
this.$.errorMessage.hide(), this.hideScrim(), this.$.passwordInput.forceFocus(), this.$.passwordInput.setValue(""), this.$.forgetPwd.hide(), this.$.accntEmail.setContent(findApps.UserProfile.email);
},
showScrim: function() {
this.$.scrim.show(), this.$.spinner.setShowing(!0);
},
hideScrim: function() {
this.$.scrim.hide(), this.$.spinner.setShowing(!1);
},
showForgetPasswordButton: function() {
this.$.forgetPwd.show();
},
passwordKeyupHandler: function(a, b) {
b.keyCode == "13" && (this.doSubmit(), a.forceBlur());
}
});

// source/payment/ChangePasswordPrompt.js

enyo.kind({
name: "findApps.ChangePasswordPrompt",
kind: enyo.Control,
events: {
onSubmit: ""
},
components: [ {
content: $L("Change Password"),
style: "font-size: 26px; padding: 6px;"
}, {
name: "password",
kind: "PasswordInput",
hint: $L("Enter Password")
}, {
name: "passwordAgain",
kind: "PasswordInput",
hint: $L("Confirm Password")
}, {
kind: "Spacer"
}, {
name: "errorMessage",
showing: !1,
content: $L("Passwords do not match."),
style: "font-size: 16px; padding: 6px; color: red"
}, {
kind: "Button",
caption: $L("Done"),
onclick: "doSubmit"
} ],
getPassword: function() {
return this.$.password.getValue();
},
getPasswordAgain: function() {
return this.$.passwordAgain.getValue();
},
showError: function() {
this.$.errorMessage.show();
},
resetPassword: function() {
this.$.password.setValue(""), this.$.passwordAgain.setValue("");
},
doChange: function() {
var a = this.getPassword(), b = this.getPasswordAgain();
a != b || a == "" || a.length < 6 || a.length > 20 ? this.showError() : this.doSubmit();
}
});

// source/payment/PasswordResetPrompt.js

enyo.kind({
name: "findApps.PasswordResetPrompt",
kind: enyo.Control,
events: {
onSubmit: ""
},
components: [ {
kind: "Scrim",
animateShowing: !1,
name: "scrim",
layoutKind: "VFlexLayout",
align: "center",
pack: "center",
components: [ {
kind: "SpinnerLarge",
name: "spinner",
showing: !1
} ]
}, {
content: $L("Change Password"),
className: "enyo-text-header",
style: "text-align:center;"
}, {
kind: "Control",
className: "form-row",
components: [ {
content: $L("Password"),
className: "enyo-subtext",
style: "font-size: 16px;",
onkeyup: "keyupNP"
}, {
name: "newPassword",
kind: "PasswordInput",
alwaysLooksFocused: !0,
hint: "",
autoCapitalize: "lowercase",
autocorrect: !1,
spellcheck: !1
} ]
}, {
kind: "Control",
className: "form-row",
components: [ {
content: $L("Verify Password"),
className: "enyo-subtext",
style: "font-size: 16px;",
onkeyup: "keyupNP"
}, {
name: "confirmPassword",
kind: "PasswordInput",
alwaysLooksFocused: !0,
hint: "",
autoCapitalize: "lowercase",
autocorrect: !1,
spellcheck: !1
} ]
}, {
name: "noPasswordMessage",
showing: !1,
content: $L("Please enter a password."),
className: "enyo-text-error",
style: "padding: 3px 0;"
}, {
name: "passwordLengthError",
showing: !1,
content: $L("Password must be between 6 and 20 characters long."),
className: "enyo-text-error",
style: "padding: 3px 0;"
}, {
name: "mismatchMessage",
showing: !1,
content: $L("Passwords do not match."),
className: "enyo-text-error",
style: "padding: 3px 0;"
}, {
name: "noConfirmMessage",
showing: !1,
content: $L("Please confirm password."),
className: "enyo-text-error",
style: "padding: 3px 0;"
}, {
name: "systemErrorMessage",
showing: !1,
content: $L("Unable to change password. Try again."),
className: "enyo-text-error",
style: "padding: 3px 0;"
}, {
kind: "VFlexBox",
style: "padding-top: 6px;",
components: [ {
kind: "Button",
className: "enyo-button-affirmative",
caption: $L("Change Password"),
onclick: "submitResetPassword"
} ]
}, {
kind: "VFlexBox",
components: [ {
kind: "Button",
caption: $L("Cancel")
} ]
} ],
focusInput: function() {
this.$.newPassword.forceFocus();
},
keyupNP: function(a, b) {
b.keyCode == "13" && this.$.confirmPassword.forceFocus();
},
keyupNPConfirm: function(a, b) {
b.keyCode == "13" && (a.forceBlur(), this.submitResetPassword());
},
getNewPassword: function() {
return this.$.newPassword.getValue();
},
getConfirmPassword: function() {
return this.$.confirmPassword.getValue();
},
resetPassword: function() {
this.$.password.setValue(""), this.$.passwordAgain.setValue(""), this.clearErrorMessages(), this.$.newPassword.forceFocus();
},
showSystemErrorMessages: function() {
this.$.systemErrorMessage.setShowing(!0);
},
clearErrorMessages: function() {
this.$.mismatchMessage.setShowing(!1), this.$.noPasswordMessage.setShowing(!1), this.$.noConfirmMessage.setShowing(!1), this.$.systemErrorMessage.setShowing(!1), this.$.passwordLengthError.setShowing(!1);
},
showScrim: function() {
this.$.scrim.show(), this.$.spinner.setShowing(!0);
},
hideScrim: function() {
this.$.scrim.hide(), this.$.spinner.setShowing(!1);
},
submitResetPassword: function(a) {
this.newPassword = this.getNewPassword(), this.confirmPassword = this.getConfirmPassword(), this.clearErrorMessages();
if (this.newPassword == "" || this.newPassword == undefined) {
this.$.noPasswordMessage.setShowing(!0), this.$.newPassword.forceFocus();
return;
}
if (this.newPassword.length < 6 || this.newPassword.length > 20) {
this.$.passwordLengthError.setShowing(!0), this.$.newPassword.forceSelect();
return;
}
if (this.confirmPassword == "" || this.confirmPassword == undefined) {
this.$.noConfirmMessage.setShowing(!0), this.$.confirmPassword.forceFocus();
return;
}
if (this.newPassword != this.confirmPassword) {
this.$.mismatchMessage.setShowing(!0), this.$.confirmPassword.forceSelect();
return;
}
this.doSubmit();
}
});

// source/payment/ForgotPasswordPrompt.js

enyo.kind({
name: "findApps.ForgotPasswordPrompt",
kind: enyo.Control,
published: {
params: {
questionText: ""
}
},
events: {
onSubmit: "",
onCancel: ""
},
components: [ {
kind: "Scrim",
animateShowing: !1,
name: "scrim",
layoutKind: "VFlexLayout",
align: "center",
pack: "center",
components: [ {
kind: "SpinnerLarge",
name: "spinner",
showing: !1
} ]
}, {
content: $L("Security Question"),
className: "enyo-text-header",
style: "text-align:center;"
}, {
name: "questionText",
className: "enyo-text-subheader",
style: "padding: 10px 0;",
alwaysLooksFocused: !0,
content: $L("Your security question.")
}, {
name: "myAnswer",
kind: "Input",
hint: $L("Type your answer here"),
alwaysLooksFocused: !0,
onkeyup: "answerKeyupHandler",
autoCapitalize: "lowercase"
}, {
name: "noResponseMessage",
showing: !1,
content: $L("Please enter an answer."),
className: "enyo-text-error",
style: "padding: 3px 0;"
}, {
name: "wrongResponse",
showing: !1,
content: $L("Your answer is incorrect. Try again."),
className: "enyo-text-error",
style: "padding: 3px 0;"
}, {
kind: "VFlexBox",
style: "padding-top: 6px;",
components: [ {
kind: "Button",
className: "enyo-button-affirmative",
flex: 1,
caption: $L("OK"),
onclick: "submitAnswer"
}, {
kind: "Button",
flex: 1,
caption: $L("Cancel"),
onclick: "doCancel"
} ]
} ],
focusInput: function() {
this.$.myAnswer.forceFocus();
},
answerKeyupHandler: function(a, b) {
b.keyCode == "13" && (a.forceBlur(), this.submitAnswer());
},
paramsChanged: function() {
this.$.questionText.setContent(this.params.questionText);
},
getMyAnswer: function() {
return this.$.myAnswer.getValue();
},
showWrongResponseMessages: function() {
this.$.wrongResponse.setShowing(!0), this.$.myAnswer.forceSelect();
},
clearErrorMessages: function() {
this.$.noResponseMessage.setShowing(!1), this.$.wrongResponse.setShowing(!1);
},
resetAnswer: function() {
this.clearErrorMessages(), this.$.myAnswer.setValue(""), this.$.myAnswer.forceFocus();
},
showScrim: function() {
this.$.scrim.show(), this.$.spinner.setShowing(!0);
},
hideScrim: function() {
this.$.scrim.hide(), this.$.spinner.setShowing(!1);
},
submitAnswer: function() {
this.clearErrorMessages(), this.getMyAnswer() == "" || this.getMyAnswer() == undefined ? (this.$.noResponseMessage.setShowing(!0), this.$.myAnswer.forceFocus()) : this.doSubmit();
}
});

// source/payment/ChangeEmailAddressPrompt.js

enyo.kind({
name: "findApps.ChangeEmailAddressPrompt",
kind: enyo.Control,
events: {
onEmailChanged: "",
onCancel: ""
},
components: [ {
name: "errorHandler",
kind: "findApps.Error"
}, {
content: $L("Change Email Address"),
pack: "center",
align: "center",
className: "enyo-text-header",
style: "text-align:center;"
}, {
className: "enyo-paragraph",
content: $L("Enter a valid email address. This is where receipts will be sent.")
}, {
kind: "Control",
className: "form-row",
components: [ {
content: $L("Email"),
className: "enyo-subtext",
style: "font-size: 16px;"
}, {
name: "emailAddress",
kind: "Input",
inputType: "email",
alwaysLooksFocused: !0,
hint: "",
autoCapitalize: "lowercase",
autocorrect: !1,
spellcheck: !1
} ]
}, {
kind: "Control",
className: "form-row",
components: [ {
content: $L("Confirm Email"),
className: "enyo-subtext",
style: "font-size: 16px;"
}, {
name: "emailAddressAgain",
kind: "Input",
inputType: "email",
alwaysLooksFocused: !0,
hint: "",
autoCapitalize: "lowercase",
autocorrect: !1,
spellcheck: !1
} ]
}, {
kind: "HFlexBox",
name: "errorMessageBar",
showing: !1,
components: [ {
kind: enyo.Image,
src: "images/header-warning-icon.png"
}, {
name: "errorMessage",
content: "",
className: "enyo-text-error",
style: "padding: 6px 0 0 3px;"
} ]
}, {
kind: "VFlexBox",
style: "padding-top: 6px;",
components: [ {
kind: "Button",
className: "enyo-button-affirmative",
caption: $L("OK"),
onclick: "_validateEmail"
} ]
}, {
kind: "VFlexBox",
components: [ {
kind: "Button",
caption: $L("Cancel"),
onclick: "doCancel"
} ]
} ],
_validateEmail: function() {
var a = this.$.emailAddress.getValue(), b = this.$.emailAddressAgain.getValue();
a.search(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) == -1 ? this._setErrors(2) : a == b ? findApps.AccountServices.embargoedList ? this.handleEmbargoAcc() : findApps.BaseServer.getPMTServer().getEmbargoedEmailExtensions("embargoedExt", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
}) : this._setErrors(1);
},
handleEmbargoAcc: function() {
var a = this.$.emailAddress.getValue(), b = a.substring(a.lastIndexOf(".") + 1), c = findApps.AccountServices.embargoedList.indexOf(b) != -1;
c ? this._setErrors(3) : this._changeEmail();
},
_changeEmail: function() {
findApps.BaseServer.getPMTServer().setInvoiceEmail(this.$.emailAddress.getValue(), "InvoiceEmail", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
});
},
_setErrors: function(a) {
switch (a) {
case 0:
this.$.errorMessage.setContent(""), this.$.errorMessageBar.hide();
break;
case 1:
this.$.errorMessage.setContent(findApps.ChangeEmailAddressPrompt.emailNotSameError), this.$.errorMessageBar.show();
break;
case 2:
this.$.errorMessage.setContent(findApps.ChangeEmailAddressPrompt.emailNotValidError), this.$.errorMessageBar.show();
break;
case 3:
this.$.errorMessage.setContent(findApps.ChangeEmailAddressPrompt.embargoedAddError), this.$.errorMessageBar.show();
break;
default:
}
this.$.emailAddress.forceFocus();
},
processResponse: function(a, b, c, d) {
b.OutGetEmbargoedEmailExtensions ? (findApps.AccountServices.embargoedList = b.OutGetEmbargoedEmailExtensions.embargoedEmailExtensions, this.handleEmbargoAcc()) : b.OutSetUserInfo && (findApps.UserProfile.validPayment.OutGetPaymentInfos && (findApps.UserProfile.validPayment.OutGetPaymentInfos.invoiceEmail = this.$.emailAddress.getValue()), this.doEmailChanged());
},
reset: function() {
this._setErrors(0), this.$.emailAddress.setValue(""), this.$.emailAddressAgain.setValue(""), this.$.emailAddress.forceFocus();
},
handleFailure: function(a, b, c, d, e) {
var f = b.JSONException.errorCode ? b.JSONException.errorCode : b;
f === "PMT04800" ? e.push("LOC02023") : e.push("LOC02022"), this.$.errorHandler.displayError(e);
}
}), findApps.ChangeEmailAddressPrompt.emailNotSameError = $L("Email addresses do not match."), findApps.ChangeEmailAddressPrompt.emailNotValidError = $L("Please enter a valid email address."), findApps.ChangeEmailAddressPrompt.embargoedAddError = $L("The United States Government restricts exports to certain countries, including the country where your email address domain is issued.");

// source/model/profile-model.js

findApps.UserProfile = {
email: "",
password: "",
firstName: "",
lastName: "",
questionId: -2,
response: "",
securityQuestions: []
};

// source/payment/DefaultPaymentType.js

enyo.kind({
name: "findApps.DefaultPaymentType",
kind: enyo.Item,
published: {
selected: "CC"
},
events: {
onTypeSelected: ""
},
components: [ {
name: "defaulttype",
kind: "RowGroup",
caption: $L("Default Payment Method"),
components: [ {
kind: enyo.HFlexBox,
domStyles: "linePaddingSlim",
components: [ {
kind: "CheckBox",
checked: !1,
onChange: "selectionChange",
value: "OB",
name: "obTypeCheckbox"
}, {
content: $L("Carrier Account"),
name: "obTypeName",
style: "margin-left:10px"
} ]
}, {
kind: enyo.HFlexBox,
domStyles: "linePaddingSlim",
components: [ {
kind: "CheckBox",
checked: !1,
onChange: "selectionChange",
value: "CC",
name: "ccTypeCheckbox"
}, {
content: $L("Credit Card"),
name: "ccTypeName",
style: "margin-left:10px"
} ]
} ]
} ],
selectedChanged: function() {
if (this.selected == "CC") {
this.$.ccTypeCheckbox.checked = !0, this.$.ccTypeCheckbox.checkedChanged(), this.$.obTypeCheckbox.checked = !1, this.$.obTypeCheckbox.checkedChanged();
return;
}
if (this.selected == "OB") {
this.$.ccTypeCheckbox.checked = !1, this.$.ccTypeCheckbox.checkedChanged(), this.$.obTypeCheckbox.checked = !0, this.$.obTypeCheckbox.checkedChanged();
return;
}
},
selectionChange: function(a) {
this.selected != a.value && this.setSelected(a.value), this.doTypeSelected(a.value);
}
});

// source/payment/CreditCardInfo.js

enyo.kind({
name: "findApps.CreditCardInfo",
kind: enyo.VFlexBox,
modalMode: !1,
components: [ {
kind: "Scrim",
name: "scrim",
layoutKind: "VFlexLayout",
align: "center",
pack: "center",
components: [ {
kind: "SpinnerLarge",
name: "spinner",
showing: !1
} ]
}, {
name: "errorHandler",
kind: "findApps.Error",
onSubmit: "submitError",
onCancel: "cancelError"
}, {
kind: "ModalDialog",
name: "wrongAddressPrompt",
components: [ {
name: "wrongAddrTile",
className: "enyo-text-header",
style: "text-align: center;",
content: $L("Address Verification")
}, {
name: "wrongAddrMessage",
className: "enyo-paragraph",
allowHtml: !0
}, {
kind: "Button",
className: "enyo-button-dark",
value: "change",
caption: $L("Change Address"),
onclick: "rejectAddress"
}, {
kind: "Button",
className: "enyo-button-light",
value: "ok",
caption: $L("Use What I Entered"),
onclick: "acceptAddress"
} ]
}, {
kind: "ModalDialog",
name: "addrSuggestionPrompt",
components: [ {
name: "addrSuggestionTitle",
className: "enyo-text-header",
style: "text-align: center;",
content: $L("Address Verification")
}, {
name: "addrSuggestionMsg",
className: "enyo-paragraph",
allowHtml: !0
}, {
kind: "Button",
className: "enyo-button-affirmative",
value: "change",
caption: $L("Use This Address"),
onclick: "changeAddress"
}, {
kind: "Button",
className: "enyo-button-light",
value: "ok",
caption: $L("Use What I Entered"),
onclick: "acceptAddress"
} ]
}, {
kind: "ModalDialog",
name: "removeCCPrompt",
components: [ {
name: "removeCCTitle",
className: "enyo-text-header",
style: "text-align: center;",
content: $L("Remove Credit Card")
}, {
name: "removeCCMsg",
className: "enyo-paragraph",
content: $L("Are you sure you want to remove this credit card?")
}, {
kind: "VFlexBox",
className: "button-group",
components: [ {
kind: "Button",
className: "enyo-button-negative",
value: "remove",
caption: $L("Remove"),
onclick: "removeCC"
}, {
kind: "Button",
className: "enyo-button-light",
value: "cancel",
caption: $L("Cancel"),
onclick: "cancelRemoveCC"
} ]
} ]
}, {
kind: "PageHeader",
name: "headerTitle",
pack: "center"
}, {
kind: "Scroller",
height: "100%",
components: [ {
name: "creditCardInfoBody",
className: "box-center",
height: "100%",
components: [ {
className: "",
components: [ {
kind: "RowGroup",
caption: $L("Billing Country"),
components: [ {
name: "billingCountry",
kind: "CustomListSelector",
onChange: "billCountryChange",
items: ""
} ]
}, {
kind: "RowGroup",
name: "ccTypesGroup",
caption: $L("Payment method")
}, {
kind: "RowGroup",
caption: $L("Card information"),
components: [ {
name: "ccNumber",
kind: "findApps.SmartInput",
hint: $L("Card Number..."),
spellcheck: !1,
autocorrect: !1,
autoCapitalize: "lowercase",
onblur: "fieldCompleteCheck",
onSubmit: "enterHandler",
nextFocuser: ""
}, {
name: "cvv",
kind: "findApps.SmartInput",
hint: $L("Security Number..."),
inputType: "password",
spellcheck: !1,
autocorrect: !1,
autoCapitalize: "lowercase",
onblur: "fieldCompleteCheck",
onSubmit: "enterHandler",
nextFocuser: ""
}, {
name: "expireDate",
kind: "DatePicker",
label: $L("Expires: "),
hideDay: !0,
onChange: "fieldCompleteCheck"
} ]
}, {
kind: "RowGroup",
name: "addressGroup",
caption: $L("Billing address"),
components: [ {
name: "name",
kind: "findApps.SmartInput",
spellcheck: !1,
autocorrect: !1,
hint: $L("Full Name..."),
onblur: "fieldCompleteCheck",
onSubmit: "enterHandler",
nextFocuser: ""
}, {
name: "address1",
kind: "findApps.SmartInput",
autocorrect: !1,
hint: $L("Billing Address 1..."),
onblur: "fieldCompleteCheck",
onSubmit: "enterHandler",
nextFocuser: ""
}, {
name: "address2",
kind: "findApps.SmartInput",
autocorrect: !1,
hint: $L("Billing Address 2..."),
onblur: "fieldCompleteCheck",
onSubmit: "enterHandler",
nextFocuser: ""
}, {
name: "address3",
kind: "findApps.SmartInput",
autocorrect: !1,
hint: $L("Billing Address 3..."),
onSubmit: "enterHandler",
nextFocuser: ""
}, {
name: "city",
kind: "findApps.SmartInput",
autocorrect: !1,
hint: $L("City..."),
onblur: "fieldCompleteCheck",
onSubmit: "enterHandler",
nextFocuser: ""
}, {
name: "state",
kind: "CustomListSelector",
onChange: "fieldCompleteCheck"
}, {
name: "zip",
kind: "findApps.SmartInput",
spellcheck: !1,
autocorrect: !1,
hint: $L("Zip Code..."),
onblur: "fieldCompleteCheck",
showing: !0,
onSubmit: "enterHandler",
nextFocuser: ""
}, {
name: "phone",
kind: "findApps.SmartInput",
spellcheck: !1,
autocorrect: !1,
hint: $L("Phone Number..."),
autoCapitalize: "lowercase",
onblur: "fieldCompleteCheck",
onSubmit: "enterHandler",
nextFocuser: ""
} ]
} ]
}, {
kind: "VFlexBox",
className: "button-group",
components: [ {
name: "submitButton",
kind: "Button",
className: "enyo-button-affirmative",
caption: $L("Done"),
onclick: "submitButtonClick"
}, {
name: "removeAccountButton",
kind: "Button",
className: "enyo-button-negative",
showing: !1,
caption: $L("Remove"),
onclick: "removeAccountButtonClick"
}, {
kind: "Button",
className: "enyo-button-light",
caption: $L("Cancel"),
onclick: "cancelButtonClick"
} ]
} ]
} ]
} ],
expirationFmt: new enyo.g11n.DateFmt("MMyyyy"),
showScrim: function() {
this.$.scrim.show(), this.$.spinner.show();
},
hideScrim: function() {
this.$.scrim.hide(), this.$.spinner.hide();
},
enterHandler: function(a, b) {
a.nextFocuser && a.nextFocuser.forceFocus();
},
setupFocusMap: function() {
this.$.ccNumber.nextFocuser = this.$.cvv, this.$.cvv.nextFocuser = this.$.name, this.$.name.nextFocuser = this.$.address1, this.$.address1.nextFocuser = this.$.address2, this.selectedCountry === "GB" || this.selectedCountry === "AU" || this.selectedCountry === "NZ" ? this.$.address2.nextFocuser = this.$.address3 : this.$.address2.nextFocuser = this.$.city, this.$.address3.nextFocuser = this.$.city, this.selectedCountry !== "IE" ? this.$.city.nextFocuser = this.$.zip : this.$.city.nextFocuser = this.$.phone, this.$.zip.nextFocuser = this.$.phone;
},
create: function() {
this.inherited(arguments), this.$.submitButton.disabled = !0, this.$.submitButton.addClass("enyo-button-disabled"), this.callback = !1, this.callBackFn = null;
var a = (new Date).getFullYear();
this.$.expireDate.setMinYear(a), this.$.expireDate.setMaxYear(a + 18);
},
refreshStatus: function() {
var a = findApps.UserProfile.validPayment;
a && a.OutGetPaymentInfos && a.OutGetPaymentInfos.ccPaymentInfos && a.OutGetPaymentInfos.ccPaymentInfos.length > 0 ? (this._ccinfo = a.OutGetPaymentInfos.ccPaymentInfos[0], this.isEditMode = !0) : (this.isEditMode = !1, this._ccinfo = undefined, this.$.ccNumber.forceFocus()), findApps.UserProfile.validPayment = undefined, this._setupBillCountry();
},
setCallback: function(a) {
this.callBackFn = a, this.callBackFn && (this.callback = !0);
},
setModalMode: function(a) {
this.modalMode = a;
},
processResponse: function(a, b, c, d) {
this.hideScrim();
switch (d.service) {
case "billToCountries":
this._hasCountryBill(a, d, b, c);
break;
case "addAccount":
this._handleAddUpdateResponse("add", a, d, b, c);
break;
case "updateAccount":
this._handleAddUpdateResponse("update", a, d, b, c);
break;
case "removeAccount":
this._handleRemoveCCPaymentInfo(a, d, b, c);
break;
case "ccTypes":
this._handleCCTypes(a, d, b, c);
}
},
handleFailure: function(a, b, c, d, e) {
this.hideScrim();
switch (d.service) {
case "billToCountries":
e.push("LOC02028");
break;
case "addAccount":
e.push("LOC02029");
break;
case "updateAccount":
e.push("LOC02030");
break;
case "removeAccount":
e.push("LOC02031");
break;
case "ccTypes":
e.push("LOC02032");
break;
default:
e.push("LOC02033");
}
this.$.errorHandler.displayError(e);
},
_setupBillCountry: function() {
var a = "";
this.choices = [], this.showScrim(), findApps.BaseServer.getPMTServer().getBillToCountries("billToCountries", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
});
},
_hasCountryBill: function(a, b, c, d) {
var e = c.OutGetBillToCountries.billToCountries;
this.choices = [];
if (e) {
var f;
for (var g = 0; g < e.length; g++) {
var h = e[g].name ? e[g].name.toUpperCase() : "";
this.choices.push({
caption: $L(h),
value: e[g].code
}), e[g].activation && (f = e[g].code);
}
this.choices.sort(function(a, b) {
return a.caption.localeCompare(b.caption);
}), this.binCountry = this.isEditMode ? this._ccinfo.billTo.country : f, this.selectedCountry = this.binCountry, this.$.billingCountry.setItems(this.choices), this.$.billingCountry.setValue(this.selectedCountry), this._setupCreditCardForm();
}
},
_getCreditCardTypes: function() {
this.showScrim(), findApps.BaseServer.getPMTServer().getCCTypes(this.selectedCountry, "ccTypes", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
});
},
_handleCCTypes: function(a, b, c, d) {
this.selectedCCType = null, this.ccTypeComponents = new Object;
var e = c.OutGetCCTypes.ccTypes;
this.$.ccTypesGroup.destroyControls();
var f;
for (var g = 0; g < e.length; g++) {
f = e[g].code == (this._ccinfo && this._ccinfo.creditCard ? this._ccinfo.creditCard.type : e[0].code), f == 1 && (this.selectedCCType = e[g].code);
var h = this.$.ccTypesGroup.createComponent({
kind: "findApps.CCType",
code: e[g].code,
description: e[g].description,
selected: f,
name: e[g].code + "_ccType",
onCCTypeSelected: "handleCCTypeSelected",
owner: this
});
this.ccTypeComponents[e[g].code] = h;
}
this.$.ccTypesGroup.contentChanged();
},
handleCCTypeSelected: function(a, b, c) {
c == 1 && (this.selectedCCType = b);
if (this.ccTypeComponents) for (var d in this.ccTypeComponents) {
var e = this.ccTypeComponents[d];
e.code != b && e.setSelected(!1);
}
},
getActiveCreditCard: function() {
return this.selectedCCType;
},
_setupCreditCardForm: function() {
this.$.ccNumber.setValue(this.isEditMode ? this._ccinfo.creditCard.number : "");
var a = new Date;
if (this.isEditMode) {
var b = this._ccinfo.creditCard.expDate, c = b.substring(0, 2), d = b.substring(2);
a.setFullYear(parseInt(d, 10), parseInt(c, 10) - 1, 1);
}
var e = (new Date).getFullYear(), f = a.getFullYear();
this.$.expireDate.setMinYear(f < e ? f : e), this.originalCardDate = new Date(a), this.$.expireDate.setValue(new Date(a)), this.$.cvv.setValue(this.isEditMode ? this._ccinfo.creditCard.cvv : ""), this.$.phone.setValue(this.isEditMode ? this._ccinfo.billTo.phone : "");
var g = "";
this.isEditMode && (this._ccinfo.billTo.firstName && this._ccinfo.billTo.lastName ? g = this._ccinfo.billTo.firstName + " " + this._ccinfo.billTo.lastName : this._ccinfo.billTo.firstName && (g = this._ccinfo.billTo.firstName)), this.$.name.setValue(g), this._setAddress1(!1), this.$.address2.setValue(this.isEditMode ? this._ccinfo.billTo.address2 || "" : ""), this._setAddress3(!1), this._setCity(!1), this._setupState(!1), this._setZip(!1);
if (this.isEditMode) this.$.headerTitle.setContent($L("Edit Credit Card")), this.$.removeAccountButton.show(); else {
this.$.removeAccountButton.hide(), this.$.headerTitle.setContent($L("Add Credit Card"));
var h = findApps.AccountServices.getInstance().getAccountInfo({
onSuccess: "accountInfoSuccess",
onFailure: "accountInfoFailure",
scope: this
});
h && this.accountInfoSuccess(null, h);
}
this.$.submitButton.disabled = !0, this.$.submitButton.addClass("enyo-button-disabled"), this._getCreditCardTypes(), this.setupFocusMap();
},
_setAddress1: function(a) {
this.$.address1.setValue(this.isEditMode && !a ? this._ccinfo.billTo.address1 ? this._ccinfo.billTo.address1 : "" : "");
},
_setAddress3: function(a) {
switch (this.selectedCountry) {
case "GB":
case "AU":
case "NZ":
this.$.address3.setValue(this.isEditMode && !a ? this._ccinfo.billTo.address3 ? this._ccinfo.billTo.address3 : "" : ""), findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.0" || findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.1" ? this.$.addressGroup.showRow(7) : this.$.addressGroup.showRow(3), this.address3Shown = !0;
break;
default:
findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.0" || findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.1" ? this.$.addressGroup.hideRow(7) : this.$.addressGroup.hideRow(3), this.address3Shown = !1;
}
},
_setCity: function(a) {
switch (this.selectedCountry) {
case "GB":
this.$.city.setHint($L("Posttown..."));
break;
case "US":
this.$.city.setHint($L("City..."));
break;
default:
this.$.city.setHint($L("City/Town..."));
}
this.$.city.setValue(this.isEditMode && !a ? this._ccinfo.billTo.city ? this._ccinfo.billTo.city : "" : "");
},
_setZip: function(a) {
if (this.selectedCountry != "IE") {
findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.0" || findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.1" ? this.$.addressGroup.showRow(10) : this.$.addressGroup.showRow(6), this.zipShown = !0;
switch (this.selectedCountry) {
case "GB":
case "AU":
case "NZ":
this.$.zip.setHint($L("Postcode..."));
break;
case "US":
this.$.zip.setHint($L("Zip..."));
break;
default:
this.$.zip.setHint($L("Postal Code..."));
}
this.$.zip.setValue(this.isEditMode && !a ? this._ccinfo.billTo.zip : "");
} else this.zipShown = !1, findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.0" || findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.1" ? this.$.addressGroup.hideRow(10) : this.$.addressGroup.hideRow(6);
},
_getInfo: function() {
var a = {}, b = {}, c = this.$.name.value, d = c.split(" ");
a.lastName = "";
if (d.length > 1) {
a.firstName = d[0];
for (var e = 1; e < d.length; e++) a.lastName += d[e], e < d.length - 1 && (a.lastName += " ");
} else d.length == 1 ? (a.firstName = d[0], a.lastName = "") : (a.firstName = "", a.lastName = "");
a.address1 = this.$.address1.value, a.address2 = this.$.address2.value, this.address3Shown == 1 && (a.address3 = this.$.address3.value), a.city = this.$.city.value, this.stateShown == 1 && (a.state = this.$.state.value), this.zipShown == 1 && (a.zip = this.$.zip.value);
var f = this.$.phone.value;
return f && (a.phone = f.replace(/[. ()-+]/g, "")), a.company = "", a.county = "", a.country = this.$.billingCountry.value, b.type = this.getActiveCreditCard(), b.number = this.$.ccNumber.value.replace(/ /g, ""), b.expDate = this.expirationFmt.format(this.$.expireDate.getValue()), b.cvv = this.$.cvv.value, b.email = "", {
address: a,
card: b
};
},
billCountryChange: function(a, b, c) {
this.selectedCountry = b;
var d = this.binCountry != this.selectedCountry;
this.$.ccNumber.setValue(this.isEditMode && !d ? this._ccinfo.creditCard.number : "");
var e = new Date;
this.$.expireDate.setValue(e), this.$.cvv.setValue(this.isEditMode && !d ? this._ccinfo.creditCard.cvv : ""), this.$.phone.setValue(this.isEditMode && !d ? this._ccinfo.billTo.phone : ""), this.$.address2.setValue(this.isEditMode && !d ? this._ccinfo.billTo.address2 || "" : ""), this._setAddress1(d), this._setAddress3(d), this._setCity(d), this._setupState(d), this._setZip(d), this._getCreditCardTypes(), this.fieldCompleteCheck(), this.setupFocusMap();
},
goBack: function(a) {
if (this.modalMode && this.modalMode === !0) {
var b = JSON.stringify({
resultCode: a
}), c = {
returnMessage: b,
params: {}
};
findApps.ViewLibrary._container.closeModalAndExit(c);
} else this.callback == 1 && this.callBackFn && findApps.ViewLibrary.popViewsFromHistory(1), findApps.ViewLibrary.goBack(), this.callback == 1 && this.callBackFn && (this.callback = !1, this.callBackFn({
accountValid: a
}));
},
cancelButtonClick: function() {
this.goBack(!1);
},
submitButtonClick: function() {
this.showScrim(), this.saveAccount();
},
removeAccountButtonClick: function() {
this.$.removeCCPrompt.openAtCenter();
},
removeCC: function() {
this.$.removeCCPrompt.close(), this.showScrim(), findApps.BaseServer.getPMTServer().removeAccount(this._ccinfo.paymentInfoId, !0, "removeAccount", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
});
},
cancelRemoveCC: function() {
this.$.removeCCPrompt.close();
},
_handleRemoveCCPaymentInfo: function(a, b, c, d) {
this.goBack(!1);
},
saveAccount: function() {
var a = this._getInfo();
if (this.isEditMode) {
var b = {}, c = {}, d = !1, e = !1;
a.address.firstName !== undefined && a.address.firstName.toUpperCase() != this._ccinfo.billTo.firstName.toUpperCase() && (b.firstName = a.address.firstName), a.address.lastName !== undefined && a.address.lastName.toUpperCase() != this._ccinfo.billTo.lastName.toUpperCase() && (b.lastName = a.address.lastName), a.address.address1 !== undefined && a.address.address1.toUpperCase() != this._ccinfo.billTo.address1.toUpperCase() && (b.address1 = a.address.address1), a.address.address2 !== undefined && this._ccinfo.billTo.address2 !== undefined && a.address.address2.toUpperCase() != this._ccinfo.billTo.address2.toUpperCase() && (b.address2 = a.address.address2), a.address.address3 !== undefined && this._ccinfo.billTo.address3 !== undefined && a.address.address3.toUpperCase() != this._ccinfo.billTo.address3.toUpperCase() && (b.address3 = a.address.address3), a.address.city !== undefined && this._ccinfo.billTo.city !== undefined && a.address.city.toUpperCase() != this._ccinfo.billTo.city.toUpperCase() && (b.city = a.address.city), a.address.state !== undefined && this._ccinfo.billTo.state !== undefined && a.address.state.toUpperCase() != this._ccinfo.billTo.state.toUpperCase() && (b.state = a.address.state), a.address.country !== undefined && a.address.country.toUpperCase() != this._ccinfo.billTo.country.toUpperCase() && (b.country = a.address.country), a.address.zip !== undefined && this._ccinfo.billTo.zip !== undefined && a.address.zip.toUpperCase() != this._ccinfo.billTo.zip.toUpperCase() && (b.zip = a.address.zip), a.address.phone !== undefined && a.address.phone.toUpperCase() != this._ccinfo.billTo.phone.toUpperCase() && (b.phone = a.address.phone);
for (var f in b) {
d = !0;
break;
}
a.card.type != this._ccinfo.creditCard.type && (c.type = a.card.type), a.card.number != this._ccinfo.creditCard.number && (c.number = a.card.number, c.type = a.card.type);
var g = findApps.Utilities.Formatter.getShortMonth(this.originalCardDate) + "" + findApps.Utilities.Formatter.getFullYear(this.originalCardDate);
a.card.expDate != g && (c.expDate = a.card.expDate), c.cvv = a.card.cvv;
for (var f in c) {
e = !0;
break;
}
c.paymentInfoId = this._ccinfo.paymentInfoId;
if (d || e) {
this.$.submitButton.disabled = !0, this.$.submitButton.addClass("enyo-button-disabled");
var h = this._localCardCheck(a.address, a.card, "check", !0);
if (h) {
this.hideScrim();
var i = [ h.error ];
this.$.errorHandler.displayError(i, h.args);
return;
}
this.savedAddressParam = a.address, this.savedCreditCardParam = a.card, findApps.BaseServer.getPMTServer().updateAccount(b, c, "updateAccount", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
});
} else this.goBack(!1);
} else {
this.$.submitButton.disabled = !0, this.$.submitButton.addClass("enyo-button-disabled");
var h = this._localCardCheck(a.address, a.card, "new", !0);
if (h) {
this.hideScrim();
var i = [ h.error ];
this.$.errorHandler.displayError(i, h.args);
return;
}
this.savedAddressParam = a.address, this.savedCreditCardParam = a.card, findApps.BaseServer.getPMTServer().addAccount(a.address, a.card, "addAccount", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
});
}
},
isFieldValueOkay: function(a, b) {
return b == "edit" || a && a != "";
},
_localCardCheck: function(a, b, c, d) {
var e, f;
if (a) if (!(this.isFieldValueOkay(a.firstName, c) || this.isFieldValueOkay(a.lastName, c) || this.isFieldValueOkay(a.address1, c))) e = "PMT02010"; else if (!this.isFieldValueOkay(a.phone, c)) e = "LOCL0005"; else {
var g = [];
this.isFieldValueOkay(a.firstName, c) || g.push($L("Full Name")), this.isFieldValueOkay(a.address1, c) || g.push($L("Billing Address 1")), this.isFieldValueOkay(a.city, c) || g.push($L("City")), (a.country === "US" || a.country === "CA" || a.country === "AU") && a.state === "STATE" && g.push($L("State")), a.country !== "IE" && !this.isFieldValueOkay(a.zip, c) && g.push($L("Zip")), g.length > 0 ? (e = "LOCL0009", f = {
errCode: e,
fields: g.join(", ")
}) : (!this.isFieldValueOkay(a.firstName, c) || !this.isFieldValueOkay(a.lastName, c)) && d && (e = "LOCL0008");
}
return b && !e && (this.isFieldValueOkay(b.number, c) ? !b.cvv || b.cvv == "" ? e = "LOCL0006" : (c == "new" || b.number) && c != "check" && !/^\d*$/.test(b.number) ? e = "LOCL0003" : (c == "new" || b.cvv) && !/^\d*$/.test(b.cvv) ? e = "LOCL0003" : this.isFieldValueOkay(b.type, c) || (e = "LOCL0004") : e = "PMT02011"), a && a.zip && !e && (a.country === "US" && !/^\d{5}$|^\d{5}-\d{4}$/.test(a.zip) ? e = "LOC02018" : a.country === "CA" && !/^[a-zA-Z]{1}\d{1}[a-zA-Z]{1}[ ]{0,1}\d{1}[a-zA-Z]{1}\d{1}$/.test(a.zip) ? e = "LOC02019" : (a.country === "AU" || a.country === "NZ") && !/^\d{4}$/.test(a.zip) && (e = "LOCL0010")), a && a.firstName && !e && a.firstName.length > 60 && (e = "LOC02020"), a && a.lastName && !e && a.lastName.length > 60 && (e = "LOC02021"), e ? {
error: e,
args: f
} : undefined;
},
rejectAddress: function() {
this.isEditMode = !0, this._ccinfo = {
billTo: this.savedAddressParam,
creditCard: this.savedCreditCardParam,
paymentInfoId: this.paymentInfoId
}, this.$.submitButton.disabled = !0, this.$.submitButton.addClass("enyo-button-disabled"), this.$.wrongAddressPrompt.close();
},
acceptAddress: function() {
this.$.wrongAddressPrompt.close(), this.$.addrSuggestionPrompt.close(), this.goBack(!0);
},
changeAddress: function() {
this.$.addrSuggestionPrompt.close(), this.showScrim(), findApps.BaseServer.getPMTServer().updateAccount(this.billTo, {
paymentInfoId: this.paymentInfoId
}, "updateAccount", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
});
},
_handleAddUpdateResponse: function(a, b, c, d, e) {
var f = undefined;
if (a == "add") f = d.OutAddCCPaymentInfo; else if (a = "update") f = d.OutUpdateCCPaymentInfo;
var g = f.billTo;
this.paymentInfoId = f.paymentInfoId, this.billTo = g;
if (g !== undefined) if (g == "") {
var h = $L("Your address could not be verified. Is it correct?");
h = this._formatAddress(h, this.savedAddressParam), this.$.wrongAddressPrompt.openAtCenter(), this.$.wrongAddrMessage.setContent($L(h));
} else {
var h = $L("The billing address you entered was not found. Is this version correct?");
h = this._formatAddress(h, g), this.$.addrSuggestionPrompt.openAtCenter(), this.$.addrSuggestionMsg.setContent($L(h));
} else this.goBack(!0);
},
_formatAddress: function(a, b) {
var c = a + "<br/><br/>";
return b.address1 && (c += b.address1 + "<br/>"), b.address2 && (c += b.address2 + "<br/>"), b.city && (c += b.city + ", "), b.state && (c += b.state + "<br/>"), b.zip && (c += b.zip), c;
},
_setupState: function(a) {
switch (this.selectedCountry) {
case "US":
case "CA":
case "AU":
var b = findApps.States.getStates(this.selectedCountry);
b.sort(function(a, b) {
return a.value == "STATE" ? -1 : b.value == "STATE" ? 1 : a.caption.localeCompare(b.caption);
}), this.$.state.setItems(b), this.$.state.setValue(this.isEditMode && !a ? this._ccinfo.billTo.state : "STATE"), findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.0" || findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.1" ? this.$.addressGroup.showRow(11) : this.$.addressGroup.showRow(5), this.stateShown = !0;
break;
default:
findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.0" || findApps.UserSession._softwareBuildBranch === "HP webOS 3.0.1" ? this.$.addressGroup.hideRow(11) : this.$.addressGroup.hideRow(5), this.stateShown = !1;
}
},
fieldCompleteCheck: function() {
var a = this._getInfo();
this._localCardCheck(a.address, a.card, this.isEditMode ? "check" : "new", !1) ? (this.$.submitButton.disabled = !0, this.$.submitButton.addClass("enyo-button-disabled")) : (this.$.submitButton.disabled = !1, this.$.submitButton.removeClass("enyo-button-disabled"));
},
submitError: function(a, b) {
b && b == "help" ? (this.goBack(!1), findApps.ApplicationManager.getInstance().openApplication("com.palm.app.help", {
target: "http://help.palm.com/app_catalog/appcatalog_download_error.html"
})) : b && b == "quit" && this.goBack(!1);
},
cancelError: function() {
this.$.errorHandler.cancel();
},
displayError: function(a) {
this.hideScrim(), this.$.error.displayError(a);
},
accountInfoSuccess: function(a, b) {
findApps.UserSession.getAccountInfo() == null && findApps.UserSession.setAccountInfo(b);
if (this.isEditMode == 0) {
var c = b.firstName + " " + (b.lastName ? b.lastName : "");
this.$.name.setValue(c);
}
},
accountInfoFailure: function(a, b) {
this.error("CreditCardInfo : Could not fetch first name / last name. getAccountInfo failure. ", b);
}
});

// source/payment/PreferenceAccount.js

findApps.PreferenceAccount = findApps.PreferenceAccount || {}, findApps.PreferenceAccount.paDescriptionOBCC = $L("A carrier account or credit card is required to purchase items. Specify your default payment method below."), findApps.PreferenceAccount.paDescriptionCC = $L("A credit card is required to purchase items."), findApps.PreferenceAccount.paPasswordRFrequency = [ {
caption: $L("Once Every 4 Hours"),
value: "Once Every 4 Hours"
}, {
caption: $L("Every Purchase"),
value: "Every Purchase"
} ], enyo.kind({
name: "findApps.PreferenceAccount",
kind: "VFlexBox",
height: "100%",
modalMode: !1,
components: [ {
kind: "Scrim",
name: "scrim",
layoutKind: "VFlexLayout",
align: "center",
pack: "center",
components: [ {
kind: "SpinnerLarge",
name: "spinner",
showing: !1
} ]
}, {
kind: "ModalDialog",
name: "emailNotValidPrompt",
components: [ {
name: "emailInvalidTitle",
className: "enyo-item enyo-first",
content: $L("Email must be in valid format."),
style: "padding: 12px"
}, {
kind: "Button",
className: "enyo-button-light",
value: "ok",
caption: $L("OK"),
onclick: "dismissEmailInvalidPrompt"
} ]
}, {
kind: "Popup",
name: "embargoedPrompt",
components: [ {
name: "embargoedEmailTitle",
className: "enyo-item enyo-first",
content: $L("The United States Government prohibits HP from allowing you to use this email address."),
style: "padding: 12px"
}, {
kind: "Button",
className: "enyo-button-light",
value: "ok",
caption: $L("OK"),
onclick: "dismissEmbargoedPrompt"
} ]
}, {
name: "verifyEmailPopup",
kind: "ModalDialog",
scrim: !0,
modal: !1,
onBeforeOpen: "initVerifyEmailPopup",
components: [ {
kind: "findApps.VerifyEmailAddressPrompt",
name: "verifyEmailPrompt",
onOK: "handleEmailVerified",
onChangeEmailAddress: "showChangeEmailAddrPrompt"
} ]
}, {
name: "changeEmailAddrPop",
kind: "ModalDialog",
scrim: !0,
modal: !1,
components: [ {
kind: "findApps.ChangeEmailAddressPrompt",
name: "changeEmailAddrPrompt",
onEmailChanged: "handleEmailChanged",
onCancel: "cancelChangeEmailAddr"
} ]
}, {
name: "errorHandler",
kind: "findApps.Error"
}, {
name: "userAuthenticator",
kind: "findApps.UserAuthenticator",
onUserValid: "handleValidUserResponse"
}, {
name: "paymentSetup",
components: [ {
kind: "PageHeader",
pack: "center",
style: "height:54px;text-align:center",
content: $L("Payment Setup")
}, {
className: "box-center",
height: "100%",
components: [ {
name: "description",
className: "description",
style: "padding:15px 5px 5px 5px; font-size: 16px",
allowHtml: !0,
domStyles: "linePadding",
content: $L("You must setup a payment method to make purchases. <br><br>Payment information is stored by a secure third-party payment service, not by HP or on your device.<br><br>Tap a button below to set up your payment method.")
}, {
kind: "VFlexBox",
className: "button-group",
components: [ {
name: "obButton",
kind: "Button",
className: "enyo-button-affirmative",
caption: $L("Setup Carrier Account"),
onclick: "OBItemClick"
}, {
name: "ccButton",
kind: "Button",
caption: $L("Setup Credit Card"),
className: "enyo-button-dark",
onclick: "creditCardItemClick"
}, {
name: "paymentSetupBackButton",
kind: "Button",
caption: $L("Back"),
onclick: "backFromPaymentSetup"
}, {
name: "paymentSetupBackFromModal",
kind: "Button",
showing: !1,
caption: $L("Done"),
onclick: "closeAndExit"
} ]
} ]
} ]
}, {
kind: "VFlexBox",
name: "acctPrefs",
flex: 1,
components: [ {
kind: "PageHeader",
pack: "center",
style: "height:54px;text-align:center",
content: $L("Preferences & Accounts")
}, {
name: "contentScroller",
kind: enyo.Scroller,
flex: 1,
components: [ {
className: "box-center",
components: [ {
kind: "Item",
style: "border:none",
components: [ {
content: findApps.PreferenceAccount.paDescriptionOBCC,
style: "font-size:18;px;margin:14px;",
name: "paDescriptionContent"
}, {
name: "defaultGroup",
kind: findApps.DefaultPaymentType,
showing: !1,
onTypeSelected: "changeDefaultType"
}, {
kind: "RowGroup",
caption: $L("Accounts"),
components: [ {
kind: "Item",
layoutKind: "HFlexLayout",
onclick: "creditCardItemClick",
components: [ {
name: "addCreditCardString",
content: $L("+ Add Credit Card")
}, {
name: "creditCardImage",
showing: !1,
allowHtml: !0,
content: 'MasterCard <img src="images/payment-mastercard.png"/>'
}, {
flex: 1,
kind: "Spacer"
}, {
name: "creditCardNumber",
showing: !1,
content: ""
} ]
}, {
name: "obItem",
kind: "Item",
layouKind: "HFlexLayout",
onclick: "OBItemClick",
components: [ {
name: "addCarrierAccountString",
content: $L("+ Add Carrier Account")
}, {
name: "carrierAccountState",
showing: !1,
content: $L("Carrier Account")
} ]
} ]
}, {
kind: "RowGroup",
caption: $L("Password Is Required"),
components: [ {
name: "passwordRF",
kind: "CustomListSelector",
items: findApps.PreferenceAccount.paPasswordRFrequency,
value: "Once Every 4 Hours",
onChange: "selectPasswordFrequency"
} ]
}, {
name: "sendReceipts",
kind: "RowGroup",
showing: "false",
caption: $L("Send Receipts"),
components: [ {
name: "receiptEmail",
kind: "findApps.SmartInput",
hint: $L("yourname@domain.com"),
onchange: "saveInvoiceEmail"
} ]
} ]
} ]
} ]
}, {
kind: "Toolbar",
className: "enyo-toolbar-light",
components: [ {
name: "backButton",
kind: "Button",
style: "width:300px",
className: "enyo-button-affirmative",
caption: $L("Done"),
onclick: "doneButtonClick"
} ]
} ]
}, {
name: "closeModal",
kind: "PalmService",
service: "palm://com.palm.systemmanager/",
method: "dismissModalApp",
onSuccess: "doNothing",
onFailure: "handleError",
subscribe: !0
}, {
name: "noPaymentTypesMsg",
kind: "VFlexBox",
flex: 2,
height: "100%",
style: "text-align:center",
components: [ {
kind: "PageHeader",
pack: "center",
style: "height:54px;text-align:center",
content: $L("Preferences & Accounts")
}, {
kind: "Spacer"
}, {
kind: enyo.Control,
allowHtml: !0,
height: "105px",
content: $L("Your App Catalog country does not support any payment options."),
flex: 2
}, {
kind: "Toolbar",
className: "enyo-toolbar-light",
components: [ {
name: "noPaymentTypesButton",
kind: "Button",
style: "width:300px",
className: "enyo-button-affirmative",
caption: $L("Back"),
onclick: "noPaymentTypesButtonClick"
} ]
} ]
} ],
goBackHandler: function(a) {
findApps.ViewLibrary.goBack(), this.callback == 1 && this.callBackFn && (this.callback = !1, this.callBackFn({
accountValid: a
}));
},
noPaymentTypesButtonClick: function() {
this.goBackHandler(!1);
},
create: function() {
this.inherited(arguments), this.$.acctPrefs.hide(), this.$.paymentSetup.hide(), this.$.obItem.hide(), this.$.obButton.hide();
},
selectPasswordFrequency: function(a, b) {
findApps.UserPreferences.setPaymentLogin(this.$.passwordRF.getValue());
},
handleEmbargoAcc: function() {
var a = this.$.receiptEmail.getValue(), b = a.substring(a.lastIndexOf(".") + 1), c = findApps.AccountServices.embargoedList.indexOf(b) != -1;
c ? this.$.embargoedPrompt.openAtCenter() : (this.invoiceEmail = a, findApps.BaseServer.getPMTServer().setInvoiceEmail(this.invoiceEmail, "setInvoiceEmail", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
}));
},
dismissEmbargoedPrompt: function() {
this.$.embargoedPrompt.close();
},
dismissEmailInvalidPrompt: function() {
this.$.emailNotValidPrompt.close();
},
saveInvoiceEmail: function() {
var a = this.$.receiptEmail.getValue(), b = a.substring(a.indexOf(".") + 1);
a.search(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) == -1 ? this.$.emailNotValidPrompt.openAtCenter() : findApps.AccountServices.embargoedList ? this.handleEmbargoAcc() : findApps.BaseServer.getPMTServer().getEmbargoedEmailExtensions("embargoedExt", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
});
},
changeDefaultType: function(a, b) {
var c = "";
b == "OB" ? c = this._myOBPaymentInfo[0].paymentInfoId : b == "CC" && (c = this._myCCPaymentInfo.paymentInfoId), findApps.BaseServer.getPMTServer().setDefaultPaymentInfo(c, "defaultType", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
});
},
backFromPaymentSetup: function() {
this.goBackHandler(!1);
},
receiveResponse: function(a, b, c) {
a === "paymentTypes" && (enyo.application.sessionManager.removeListener(this, "paymentTypes"), b ? this.refreshStatus() : (this.$.scrim.hide(), this.$.spinner.setShowing(!1), c.push("LOC03009"), this.$.errorHandler.displayError(c)));
},
refreshStatus: function() {
this.$.noPaymentTypesMsg.setShowing(!1);
if (!findApps.UserProfile.validPaymentTypes) {
var a = enyo.application.sessionManager.triggerInitPaymentTypes(this);
if (a && a.status === "inprogress") {
this.$.scrim.show(), this.$.spinner.setShowing(!0);
return;
}
}
if (findApps.UserProfile.validPaymentTypes && findApps.UserProfile.validPaymentTypes.length == 0) {
this.$.scrim.hide(), this.$.spinner.setShowing(!1), this.$.noPaymentTypesMsg.setShowing(!0);
return;
}
findApps.UserProfile.prf = enyo.getCookie("findapps.paymentPref"), findApps.UserProfile.prf && this.$.passwordRF.setValue(findApps.UserProfile.prf), this.$.receiptEmail.$.input.setAttribute("x-palm-disable-auto-cap"), this.isObEnabled = findApps.UserProfile.obEnabled, this.$.scrim.show(), this.$.spinner.setShowing(!0);
var b = !1;
findApps.UserProfile.validPayment && findApps.UserProfile.validPayment.OutGetPaymentInfos && (b = !0), b == 1 ? this.populatePaymentDetails() : this.verifyPaymentSetup();
},
verifyPaymentSetup: function() {
findApps.BaseServer.getPMTServer().verifyPaymentSetup("verifyPaymentSetup1", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
});
},
setCallback: function(a) {
this.callback = !0, this.callBackFn = a;
},
setShowPaymentSetup: function(a) {
this.showPaymentSetup = a;
},
processResponse: function(a, b, c, d) {
this.$.scrim.hide(), this.$.spinner.setShowing(!1), b.OutGetPaymentInfos ? this.handlePaymentPopulate(a, d, b, c) : b.OutGetEmbargoedEmailExtensions ? (findApps.AccountServices.embargoedList = b.OutGetEmbargoedEmailExtensions.embargoedEmailExtensions, this.handleEmbargoAcc()) : d.service == "defaultType" ? this.handleUpdateDefault(b) : b.OutSetUserInfo && findApps.UserProfile.validPayment.OutGetPaymentInfos && (findApps.UserProfile.validPayment.OutGetPaymentInfos.invoiceEmail = this.$.receiptEmail.getValue());
},
handleUpdateDefault: function(a) {
if (a && a.OutSetDefaultPaymentInfo) {
var b = a.OutSetDefaultPaymentInfo.paymentInfoId;
this._myOBPaymentInfo[0].paymentInfoId == b ? (findApps.UserProfile.validPayment.OutGetPaymentInfos.obPaymentInfos[0]["default"] = !0, findApps.UserProfile.validPayment.OutGetPaymentInfos.ccPaymentInfos[0]["default"] = !1) : this._myCCPaymentInfo.paymentInfoId == b && (findApps.UserProfile.validPayment.OutGetPaymentInfos.obPaymentInfos[0]["default"] = !1, findApps.UserProfile.validPayment.OutGetPaymentInfos.ccPaymentInfos[0]["default"] = !0);
}
},
handleFailure: function(a, b, c, d, e) {
this.$.scrim.hide(), this.$.spinner.setShowing(!1);
var f = b && b.JSONException && b.JSONException.errorCode ? b.JSONException.errorCode : b;
if (f == "PMT04800") e.push("LOC02053"); else switch (d.service) {
case "verifyPaymentSetup1":
e.push("LOC02054");
break;
case "verifyPaymentSetup2":
e.push("LOC02067");
break;
default:
e.push("LOC02068");
}
this.$.errorHandler.displayError(e);
},
handlePaymentPopulate: function(a, b, c, d) {
var e = this;
findApps.UserProfile.validPayment = c, this.populatePaymentDetails();
},
populatePaymentDetails: function() {
this.$.scrim.hide(), this.$.spinner.setShowing(!1);
var a = findApps.UserProfile.validPayment.OutGetPaymentInfos.ccPaymentInfos, b = findApps.UserProfile.validPayment.OutGetPaymentInfos.obPaymentInfos;
this.invoiceEmail = findApps.UserProfile.validPayment.OutGetPaymentInfos.invoiceEmail;
if (this.showPaymentSetup && this.showPaymentSetup == 1) this.$.paymentSetup.show(), this.$.acctPrefs.hide(), this.isObEnabled && this.isObEnabled == 1 ? this.$.obButton.show() : this.$.obButton.hide(); else {
this.$.paymentSetup.hide(), this.$.acctPrefs.show(), a[0] ? (this.editCC = !0, this._myCCPaymentInfo = a[0], this.$.addCreditCardString.hide(), this._myCCPaymentInfo.creditCard.type == "MC" ? (this.$.creditCardImage.setContent(this._masterCardDisplay), this.$.creditCardImage.show()) : this._myCCPaymentInfo.creditCard.type == "VISA" && (this.$.creditCardImage.setContent(this._visaDisplay), this.$.creditCardImage.show()), this.$.creditCardNumber.setContent(this._myCCPaymentInfo.creditCard.number), this.$.creditCardNumber.show()) : (this.editCC = !1, this.$.addCreditCardString.show(), this.$.creditCardImage.hide(), this.$.creditCardNumber.hide()), this.invoiceEmail && this.invoiceEmail != "" ? (this.$.receiptEmail.setValue(this.invoiceEmail), this.$.sendReceipts.show()) : this.$.sendReceipts.hide(), this.isObEnabled && this.isObEnabled == 1 ? (this.$.obItem.show(), this.$.paDescriptionContent.setContent(findApps.PreferenceAccount.paDescriptionOBCC), b[0] ? (this._myOBPaymentInfo = b, this.editOB = !0, this.$.addCarrierAccountString.hide(), this.$.carrierAccountState.show()) : (this.editOB = !1, this.$.addCarrierAccountString.show(), this.$.carrierAccountState.hide())) : (this.$.obItem.hide(), this.$.paDescriptionContent.setContent(findApps.PreferenceAccount.paDescriptionCC));
if (b && b[0] && a && a[0] && this.isObEnabled && this.isObEnabled == 1) {
var c = "";
b[0]["default"] ? c = "OB" : a[0]["default"] && (c = "CC"), this.$.defaultGroup.setSelected(c), this.$.defaultGroup.show();
} else this.$.defaultGroup.hide();
}
this.showPaymentSetup = !1;
},
closePopup: function(a) {
a.manager.close();
},
doneButtonClick: function() {
enyo.setCookie("findapps.paymentPref", this.$.passwordRF.getValue()), enyo.setCookie("findapps.rmail", this.$.receiptEmail.getValue()), this.goBackHandler(!1);
},
OBItemClick: function() {
this.CCClicked = !1, this.OBClicked = !0;
var a = findApps.UserProfile.validPayment;
a.OutGetPaymentInfos.obPaymentInfos && a.OutGetPaymentInfos.obPaymentInfos.length > 0 ? (this.editOB = !0, this.addOB = !1) : (this.addOB = !0, this.editOB = !1), this.$.userAuthenticator.showProfilePassword();
},
creditCardItemClick: function() {
this.CCClicked = !0, this.OBClicked = !1;
var a = findApps.UserProfile.validPayment;
a.OutGetPaymentInfos.ccPaymentInfos && a.OutGetPaymentInfos.ccPaymentInfos.length > 0 ? (this.editCreditCard = !0, this.addCreditCard = !1) : (this.addCreditCard = !0, this.editCreditCard = !1), this.$.userAuthenticator.showProfilePassword();
},
initVerifyEmailPopup: function() {
this.$.verifyEmailPrompt.setProfileEmail(this.invoiceEmail && this.invoiceEmail != "" ? this.invoiceEmail : findApps.UserProfile.email);
},
handleValidUserResponse: function() {
this.CCClicked ? this.editCC || this.editOB ? this.showCreditCardScreen() : this.$.verifyEmailPopup.openAtCenter() : this.OBClicked && this.showOBScreen();
},
handleEmailVerified: function() {
this.$.verifyEmailPopup.close(), this.showAddScreen();
},
handleEmailChanged: function() {
this.$.changeEmailAddrPop.close(), this.showAddScreen();
},
cancelChangeEmailAddr: function() {
this.$.changeEmailAddrPop.close(), this.$.verifyEmailPopup.openAtCenter();
},
showAddScreen: function() {
this.OBClicked ? this.showOBScreen() : this.CCClicked && this.showCreditCardScreen();
},
showCreditCardScreen: function() {
var a = findApps.ViewLibrary.getView("CCSETUP");
this.callback && this.callback == 1 && (this.callback = !1, a.setCallback(this.callBackFn)), this.modalMode && this.modalMode === !0 && a.setModalMode(this.modalMode);
},
showOBScreen: function() {
var a = findApps.ViewLibrary.getView("OBSETUP");
this.callback && this.callback == 1 && (this.callback = !1, a.setCallback(this.callBackFn)), this.modalMode && this.modalMode === !0 && a.setModalMode(this.modalMode);
},
showChangeEmailAddrPrompt: function() {
this.$.verifyEmailPopup.close(), this.$.changeEmailAddrPop.openAtCenter(), this.$.changeEmailAddrPrompt.reset();
},
setParams: function(a) {
a && a.initialView ? (this.$.paymentSetupBackButton.hide(), this.$.paymentSetupBackFromModal.show(), this.modalMode = a.modalMode, this.showPaymentSetup = a.showPaymentSetup) : this.modalMode = !1;
},
closeAndExit: function() {
if (this.modalMode && this.modalMode === !0) {
var a = !1, b = findApps.UserProfile.validPayment;
b != undefined && b.OutGetPaymentInfos.ccPaymentInfos && b.OutGetPaymentInfos.ccPaymentInfos.length > 0 && (a = !0);
var c = JSON.stringify({
resultCode: a
}), d = {
returnMessage: c,
params: {}
};
findApps.ViewLibrary._container.closeModalAndExit(d);
}
},
_masterCardDisplay: '<div style="position:relative;margin-top:-40px">MasterCard <img src="images/payment-mastercard.png" style="position:absolute;top:-5px;left:100px" /></div>',
_visaDisplay: '<div style="position:relative;margin-top:-40px">Visa <img src="images/payment-visa.png" style="position:absolute;top:-5px;left:40px"/></div>'
});

// source/payment/PromoCodePrompt.js

enyo.kind({
name: "findApps.PromoCodePrompt",
kind: "ModalDialog",
published: {
params: {
appid: "",
version: "",
title: "",
promoCode: "",
errCode: ""
}
},
promoCodeValue: "",
events: {
onPromoCodeConfirmed: "",
onPromoCodeCanceled: ""
},
components: [ {
name: "title",
className: "enyo-modaldialog-title",
style: "padding-bottom:5px",
content: $L("Enter Promo Code")
}, {
name: "promoCodeDiscript",
className: "enyo-text-body",
style: "padding-bottom:5px",
content: $L("Enter promo code to download this application.")
}, {
name: "promoCode",
kind: "Input",
hint: $L("Promo Code")
}, {
name: "errorTips",
showing: !1,
content: $L("Invalid promo code."),
style: "font-size: 16px; padding: 6px; color: red"
}, {
kind: "VFlexBox",
style: "padding-top: 6px;",
components: [ {
kind: "Button",
caption: $L("Use Promo Code"),
className: "enyo-button-affirmative",
onclick: "_checkPromoCodeStatus"
}, {
kind: "Button",
caption: $L("Cancel"),
onclick: "doPromoCodeCanceled"
} ]
} ],
paramsChanged: function() {
this.params.errCode != "" ? this._displayErrors(!0, this.params.errCode) : this._displayErrors(!1, ""), this.$.promoCodeDiscript.setContent(enyo.macroize($L("Enter promo code to download {$title}."), {
title: this.params.title
})), this.$.promoCode.setValue(this.params.promoCode);
},
_displayErrors: function(a, b) {
var c, d = {
INVALID: $L("This promo code is invalid."),
PMTPROMO70101: $L("This promo code has reached its limit and is no longer valid."),
PMTPROMO70102: $L("This promotion has been cancelled."),
PMTPROMO70103: $L("This promo code has expired."),
PMTPROMO70104: $L("This promotion has been cancelled."),
PMTPROMO70105: $L("This promotion has not started yet. Please try again later."),
PMTPROMO70106: $L("This promo code cannot be used in your country."),
PMTPROMO70107: $L("This promo code cannot be used with <CARRIER NAME>."),
PMTPROMO70108: $L("This apps price is higher than the value of the promo code."),
PMTPROMO70109: $L("This promo code is not valid for this app or version."),
PMTPROMO70110: $L("This promo code is not valid for this app or version."),
PMTPROMO70113: $L("The item costs more than the amount remaining in this promo code."),
PMTPROMO70010: $L("This promo code is invalid.")
};
if (a) {
this.$.errorTips.setShowing(!0);
if (b == "PMTPROMO70107") {
var e = this;
e.getCarrierSuccess = function(a, b) {
var d = status ? carrier : "ROW";
c = enyo.macroize($L("This promo code cannot be used with {$carrierName}."), {
carrierName: d
}), this.$.errorTips.setContent(enyo.macroize($L("{$error}"), {
error: c
})), e.$.systemproperties.destroy();
}, e.getCarrierFailure = function(a, b) {
var d = "this carrier";
c = enyo.macroize($L("This promo code cannot be used with {$carrierName}."), {
carrierName: d
}), this.$.errorTips.setContent(enyo.macroize($L("{$error}"), {
error: c
})), e.$.systemproperties.destroy();
}, e.createComponent({
name: "systemproperties",
kind: "findApps.SystemProperties"
}), e.$.systemproperties.getCarrier("getCarrierSuccess", "getCarrierFailure");
} else c = d[b], c && this.$.errorTips.setContent(enyo.macroize($L("{$error}"), {
error: c
}));
this.$.promoCode.forceFocus();
} else this.$.errorTips.setShowing(!1);
},
checkPromoCodeStatusSuccess: function(a, b, c, d) {
var e = this;
b && b.OutCheckPromoCodeStatus && (b.OutCheckPromoCodeStatus.valid == "true" ? (this._displayErrors(!1), this.doPromoCodeConfirmed({
promoCodeValid: !0,
status: b.OutCheckPromoCodeStatus.status,
promoCode: this.promoCodeValue
})) : b.OutCheckPromoCodeStatus.valid == "false" && (this.$.promoCodeDiscript.setContent(enyo.macroize($L("Enter promo code to download {$title}."), {
title: e.params.title
})), b.OutCheckPromoCodeStatus.errorCode ? this._displayErrors(!0, b.OutCheckPromoCodeStatus.errorCode) : this._displayErrors(!0, "INVALID")));
},
checkPromoCodeStatusFailure: function(a, b, c, d, e) {
var f = this;
if (b.JSONException.errorCode && b.JSONException.errorCode == "PMTPROMO70010") this.$.promoCodeDiscript.setContent(enyo.macroize($L("Enter promo code to download {$title}."), {
title: this.params.title
})), this._displayErrors(!0, b.errorCode), this.$.promoCode.doFocus(); else if (b.JSONException.errorCode) {
var g = b.JSONException.errorCode;
this._displayErrors(!0, g);
}
},
_checkPromoCodeStatus: function() {
this._verifyAttemptCount++, this.promoCodeValue = this.$.promoCode.getValue(), this.promoCodeValue = this.promoCodeValue.replace(/ /g, "");
var a = this.params.appid, b = this.params.version;
this.promoCodeValue.length < 1 || this.promoCodeValue.length > 64 ? this._displayErrors(!0, "INVALID") : enyo.application.connectionManager.isOnline() ? findApps.BaseServer.getPMTServer().checkPromoCodeStatus(this.promoCodeValue, a, b, "", {
onSuccess: "checkPromoCodeStatusSuccess",
onFailure: "checkPromoCodeStatusFailure",
scope: this
}) : this._displayErrors(!1);
},
focusPromoInput: function() {
this.$.promoCode.getValue().length > 0 ? this.$.promoCode.forceSelect() : this.$.promoCode.forceFocus();
}
});

// source/payment/PromoCodeNotify.js

enyo.kind({
name: "findApps.PromoCodeNotify",
kind: enyo.Control,
events: {
onClose: ""
},
components: [ {
style: "padding: 8px;",
content: $L("Promo Code")
}, {
kind: "Spacer"
}, {
name: "promoNotification",
style: "padding: 6px;",
content: "none"
}, {
kind: "VFlexBox",
style: "padding-top: 6px;",
components: [ {
kind: "Button",
caption: $L("OK"),
onclick: "doClose"
} ]
} ],
setContent: function(a) {
this.$.promoNotification.setContent(a);
}
});

// source/payment/CarrierInfo.js

var stateItems = [ "California", "Masuchusa" ];

enyo.kind({
name: "findApps.CarrierInfo",
kind: "VFlexBox",
components: [ {
kind: "Scrim",
name: "scrim",
layoutKind: "VFlexLayout",
align: "center",
pack: "center",
components: [ {
kind: "SpinnerLarge",
name: "spinner",
showing: !1
} ]
}, {
name: "errorHandler",
kind: "findApps.Error",
onSubmit: "submitError",
onCancel: "cancelError"
}, {
kind: "PageHeader",
name: "headerTitle",
pack: "center",
components: []
}, {
kind: "Scroller",
height: "100%",
components: [ {
name: "creditCardInfoBody",
className: "box-center",
height: "100%",
components: [ {
name: "country",
kind: "RowGroup",
caption: $L("Billing Country"),
showing: !1,
components: [ {
name: "billingCountry",
kind: "CustomListSelector",
onChange: "billCountryChange",
items: ""
} ]
}, {
name: "stateRow",
kind: "RowGroup",
caption: $L("State"),
showing: !1,
components: [ {
name: "state",
kind: "CustomListSelector",
onChange: "_enableDisableSave"
} ]
}, {
name: "errorMessage",
showing: !1,
content: "",
style: "font-size: 16px; padding: 6px; color: red"
}, {
name: "invoiceemailRow",
kind: "RowGroup",
showing: !1,
caption: $L("Send Receipts"),
components: [ {
name: "invoiceemail",
kind: "findApps.SmartInput",
autocorrect: !1,
hint: $L("Email Address...")
} ]
}, {
kind: "VFlexBox",
className: "button-group",
components: [ {
name: "submitButton",
kind: "Button",
className: "enyo-button-affirmative",
caption: $L("Done"),
onclick: "submitButtonClick"
}, {
name: "removeButton",
kind: "Button",
className: "enyo-button-negative",
showing: !1,
caption: $L("Remove"),
onclick: "removeButtonClick"
}, {
kind: "Button",
className: "enyo-button-light",
caption: $L("Cancel"),
onclick: "cancelButtonClick"
} ]
} ]
} ]
}, {
kind: "ModalDialog",
name: "removeOBPrompt",
components: [ {
name: "removeOBTitle",
className: "enyo-text-header",
style: "text-align: center;",
content: $L("Remove Carrier Account")
}, {
name: "removeOBMsg",
className: "enyo-paragraph",
content: $L("Are you sure you want to remove this carrier account?")
}, {
kind: "VFlexBox",
className: "button-group",
components: [ {
kind: "Button",
className: "enyo-button-negative",
value: "remove",
caption: $L("Remove"),
onclick: "removeOB"
}, {
kind: "Button",
className: "enyo-button-light",
value: "cancel",
caption: $L("Cancel"),
onclick: "cancelRemoveOB"
} ]
} ]
} ],
cancelButtonClick: function() {
this.goBack(!1);
},
submitButtonClick: function() {
this._setErrors(0), this.showScrim();
var a = this.$.invoiceemail.value;
this.invoiceShown && a != findApps.UserProfile.email ? a.search(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) == -1 ? this._setErrors(1) : findApps.AccountServices.embargoedList ? this.handleEmbargoAcc() : findApps.BaseServer.getPMTServer().getEmbargoedEmailExtensions("embargoedExt", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
}) : this.saveCarrier();
},
handleEmbargoAcc: function() {
var a = this.$.invoiceemail.value, b = a.substring(a.lastIndexOf(".") + 1), c = findApps.AccountServices.embargoedList.indexOf(b) != -1;
c ? this._setErrors(2) : this._changeEmail(a);
},
_changeEmail: function(a) {
findApps.BaseServer.getPMTServer().setInvoiceEmail(a, "InvoiceEmail", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
}), this.saveCarrier();
},
saveCarrier: function() {
var a = this.stateShown ? this.$.state.value : "", b = this.$.billingCountry.value, c = "", d = {};
if (this.isEditMode) {
var e = !1;
a !== undefined && this._obinfo.address.state !== undefined && a.toUpperCase() != this._obinfo.address.state.toUpperCase() && (d.state = a);
for (var f in d) {
e = !0, b !== undefined && (d.country = b);
break;
}
e && (this.$.submitButton.disabled = !0, this.$.submitButton.addClass("enyo-button-disabled"), findApps.BaseServer.getPMTServer().updateOBAccount(d, this._obinfo.paymentInfoId, "updateOBAccount", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
}));
} else d = {
state: a,
country: b
}, this.$.submitButton.disabled = !0, this.$.submitButton.addClass("enyo-button-disabled"), findApps.BaseServer.getPMTServer().addOBAccount(d, "addOBAccount", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
});
},
_setErrors: function(a) {
switch (a) {
case 0:
this.$.errorMessage.setContent(""), this.$.errorMessage.hide();
break;
case 1:
this.hideScrim(), this.$.errorMessage.setContent(emailNotValidError), this.$.errorMessage.show();
break;
case 2:
this.hideScrim(), this.$.errorMessage.setContent(embargoedAddError), this.$.errorMessage.show();
break;
default:
}
},
_handleRemoveOBPaymentInfo: function(a, b, c, d) {
this.goBack(!1);
},
removeButtonClick: function() {
this.$.removeOBPrompt.openAtCenter();
},
removeOB: function() {
this.$.removeOBPrompt.close(), this.showScrim(), findApps.BaseServer.getPMTServer().removeAccount(this._obinfo.paymentInfoId, !1, "removeOBAccount", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
});
},
cancelRemoveOB: function() {
this.$.removeOBPrompt.close();
},
billCountryChange: function(a, b, c) {
this.selectedCountry = b;
var d = this.binCountry != this.selectedCountry;
this._setupState(), this._enableDisableSave(), this.setupFocusMap();
},
showScrim: function() {
this.$.scrim.show(), this.$.spinner.show();
},
hideScrim: function() {
this.$.scrim.hide(), this.$.spinner.hide();
},
enterHandler: function(a, b) {
a.nextFocuser && a.nextFocuser.forceFocus();
},
setupFocusMap: function() {},
create: function() {
this.inherited(arguments), this.callback = !1, this.callBackFn = null;
},
refreshStatus: function() {
var a = findApps.UserProfile.validPayment;
a && a.OutGetPaymentInfos && a.OutGetPaymentInfos.obPaymentInfos && a.OutGetPaymentInfos.obPaymentInfos.length > 0 ? (this._obinfo = a.OutGetPaymentInfos.obPaymentInfos[0], this.isEditMode = !0, this.$.headerTitle.setContent($L("Edit Carrier Payment"))) : (this.isEditMode = !1, this.$.headerTitle.setContent($L("Setup Carrier Payment")), this._obinfo = undefined), this._enableDisableSave(), findApps.UserProfile.validPayment && findApps.UserProfile.validPayment.OutGetPaymentInfos && findApps.UserProfile.validPayment.OutGetPaymentInfos.invoiceEmail && (this._invoiceEmail = findApps.UserProfile.validPayment.OutGetPaymentInfos.invoiceEmail), findApps.UserProfile.validPayment = undefined, this._setupBillCountry(), this._setupInvoice();
},
setCallback: function(a) {
this.callBackFn = a, this.callBackFn && (this.callback = !0);
},
setModalMode: function(a) {
this.modalMode = a;
},
processResponse: function(a, b, c, d) {
switch (d.service) {
case "billToCountries":
this.hideScrim(), this._hasCountryBill(a, d, b, c);
break;
case "addOBAccount":
this.hideScrim(), this._handleAddUpdateResponse("add", a, d, b, c);
break;
case "updateOBAccount":
this.hideScrim(), this._handleAddUpdateResponse("update", a, d, b, c);
break;
case "removeOBAccount":
this.hideScrim(), this._handleRemoveOBPaymentInfo(a, d, b, c);
break;
case "embargoedExt":
b.OutGetEmbargoedEmailExtensions && (findApps.AccountServices.embargoedList = b.OutGetEmbargoedEmailExtensions.embargoedEmailExtensions, this.handleEmbargoAcc());
}
},
_handleAddUpdateResponse: function(a, b, c, d, e) {
var f = undefined;
if (a == "add") f = d.OutAddOBPaymentInfo; else if (a = "update") f = d.OutUpdateOBPaymentInfo;
var g = f.paymentInfoId;
g ? this.goBack(!0) : this.error("### Error in saving/updating OB account.");
},
goBack: function(a) {
if (this.modalMode && this.modalMode === !0) {
var b = JSON.stringify({
resultCode: a
}), c = {
returnMessage: b,
params: {}
};
findApps.ViewLibrary._container.closeModalAndExit(c);
} else this.callback == 1 && this.callBackFn && findApps.ViewLibrary.popViewsFromHistory(1), findApps.ViewLibrary.goBack(), this.callback == 1 && this.callBackFn && (this.callback = !1, this.callBackFn({
accountValid: a
}));
},
handleFailure: function(a, b, c, d, e) {
this.hideScrim();
switch (d.service) {
case "billToCountries":
e.push("LOC02056");
break;
case "addAccount":
e.push("LOC02057");
break;
case "updateAccount":
e.push("LOC02058");
break;
case "removeAccount":
e.push("LOC02059");
break;
default:
e.push("LOC02060");
}
this.$.errorHandler.displayError(e);
},
_setupBillCountry: function() {
var a = "";
this.choices = [], this.showScrim(), findApps.BaseServer.getPMTServer().getOBCountries("billToCountries", {
onSuccess: "processResponse",
onFailure: "handleFailure",
scope: this
});
},
_hasCountryBill: function(a, b, c, d) {
var e = c.OutGetOBCountries.obCountries;
this.choices = [];
if (e) {
var f;
for (var g = 0; g < e.length; g++) {
var h = e[g].name ? e[g].name.toUpperCase() : "";
this.choices.push({
caption: $L(h),
value: e[g].code
}), e[g].activation && (f = "US");
}
this.choices.sort(function(a, b) {
return a.caption.localeCompare(b.caption);
}), this.binCountry = this.isEditMode ? this._obinfo.address.country : f, this.selectedCountry = this.binCountry, this.$.billingCountry.setItems(this.choices), this.$.billingCountry.setValue(this.selectedCountry), f != "US" ? this.$.country.show() : this.$.country.hide(), this._setupState();
} else this.$.errorHandler.displayError([ "LOC02061" ]);
},
_enableDisableSave: function() {
var a = this.stateShown && this._obinfo && this._obinfo.address && this._obinfo.address.state === this.$.state.value, b = this.stateShown && this.$.state.value === "STATE";
a || b || !this.$.billingCountry.value ? (this.$.submitButton.disabled = !0, this.$.submitButton.addClass("enyo-button-disabled")) : (this.$.submitButton.disabled = !1, this.$.submitButton.removeClass("enyo-button-disabled")), this.isEditMode && this._obinfo && this._obinfo.paymentInfoId ? (this.$.removeButton.disabled = !1, this.$.removeButton.removeClass("enyo-button-disabled")) : (this.$.removeButton.disabled = !0, this.$.removeButton.addClass("enyo-button-disabled"));
},
_setupInvoice: function() {
!this.isEditMode && !this._invoiceEmail ? (this.invoiceShown = !0, this.$.invoiceemail.setValue(findApps.UserProfile.email), this.$.invoiceemailRow.show(), this.$.removeButton.hide()) : (this.invoiceShown = !1, this.$.invoiceemailRow.hide(), this.$.removeButton.show());
},
_setupState: function(a) {
if (this.selectedCountry == "US" || this.selectedCountry == "CA") {
var b = findApps.States.getStates(this.selectedCountry);
this.$.state.setItems(b), this.$.state.setValue(this.isEditMode && !a ? this._obinfo.address.state : "STATE"), this.$.stateRow.show(), this.stateShown = !0;
} else this.$.stateRow.hide(), this.stateShown = !1;
this._enableDisableSave();
},
fieldCompleteCheck: function() {}
});

// source/payment/PurchaseConfirmPrompt.js

enyo.kind({
name: "findApps.PurchaseConfirmPrompt",
kind: "ModalDialog",
account: "",
title: "",
events: {
onPurchase: "",
onPromo: "",
onCancel: ""
},
components: [ {
name: "popuptitle",
className: "enyo-text-header",
style: "text-align: center;"
}, {
name: "popupdesc",
className: "enyo-paragraph"
}, {
kind: "VFlexBox",
style: "padding-top: 6px;",
components: [ {
kind: "Button",
className: "enyo-button-affirmative",
caption: $L("Purchase"),
onclick: "doPurchase"
}, {
kind: "Spacer"
}, {
kind: "Button",
caption: $L("Use Promo Code"),
onclick: "doPromo"
}, {
kind: "Spacer"
}, {
kind: "Button",
className: "enyo-button-light",
caption: $L("Cancel"),
onclick: "doCancel"
} ]
} ],
create: function() {
this.inherited(arguments);
},
componentsReady: function() {
this.inherited(arguments), this.$.popuptitle.setContent($L("Confirm Purchase"));
var a = new enyo.g11n.Template($L("You are about to purchase #{title}. Your #{purchaseMethod} will only be charged if you select 'Purchase'."));
this.$.popupdesc.setContent(a.evaluate({
title: this.title,
purchaseMethod: this.account === "credit card" ? $L("credit card") : $L("carrier account")
}));
}
});

// source/payment/PromoCodeConfirmPrompt.js

enyo.kind({
name: "findApps.PromoCodeConfirmPrompt",
kind: enyo.Popup,
scrim: !0,
modal: !0,
width: "400px",
account: "",
title: "",
events: {
onOK: ""
},
components: [ {
name: "popuptitle",
style: "font-size: 26px; padding: 6px;"
}, {
name: "popupdesc",
style: "padding: 6px;"
}, {
kind: "VFlexBox",
style: "padding-top: 6px;",
components: [ {
kind: "Button",
className: "enyo-button-affirmative",
caption: $L("OK"),
onclick: "doOK"
} ]
} ],
create: function() {
this.inherited(arguments);
},
componentsReady: function() {
this.inherited(arguments);
var a = new enyo.g11n.Template($L("Promo Code #{title}?"));
this.$.popuptitle.setContent(a.evaluate({
title: this.title
})), this.$.popupdesc.setContent($L("Before you can use a promo code, you must first set up payment information."));
}
});

// source/payment/VerifyEmailAddressPrompt.js

enyo.kind({
name: "findApps.VerifyEmailAddressPrompt",
kind: enyo.Control,
events: {
onOK: "",
onChangeEmailAddress: ""
},
published: {
profileEmail: ""
},
components: [ {
content: $L("Email Receipts"),
pack: "center",
className: "enyo-text-header",
style: "text-align:center"
}, {
name: "verifyEmailMsg",
className: "enyo-paragraph"
}, {
kind: "VFlexBox",
style: "margin-top: 6px;",
components: [ {
kind: "Button",
className: "enyo-button-affirmative",
caption: $L("OK"),
onclick: "doOK"
}, {
kind: "Button",
className: "enyo-button-light",
caption: $L("Change Email"),
onclick: "doChangeEmailAddress"
} ]
} ],
profileEmailChanged: function() {
this.$.verifyEmailMsg.setContent($L("When you purchase items, we'll send receipts to ") + this.profileEmail);
}
});

// source/payment/ResetEmailSentPrompt.js

enyo.kind({
name: "findApps.ResetEmailSentPrompt",
kind: enyo.Control,
events: {
onSubmit: ""
},
components: [ {
content: $L("Password Reset"),
className: "enyo-text-header",
style: "text-align:center;"
}, {
kind: "Spacer"
}, {
name: "description",
content: "",
className: "enyo-paragraph"
}, {
kind: "VFlexBox",
style: "padding-top: 6px;",
components: [ {
kind: "Button",
caption: $L("Done"),
onclick: "doSubmit"
} ]
} ],
prepareDisplay: function(a) {
var b, c;
if (a && a.length > 0) {
var d = new enyo.g11n.Template($L("Follow the instructions we sent to #{emailAddr} to reset your password or visit http://www.palm.com/webos-contact to contact customer support."));
c = d.evaluate({
emailAddr: a
});
} else c = $L("Follow the instructions we sent to your HP webOS Account email to reset your password or visit http://www.palm.com/webos-contact to contact customer support.");
this.$.description.setContent(c);
},
setDescription: function() {
var a = $L("Please visit http://www.palm.com/webos-contact to contact customer support for assistance.");
this.$.description.setContent(a);
}
});

// source/payment/UserAuthenticator.js

var uaProfile = uaProfile || {};

enyo.kind({
name: "findApps.UserAuthenticator",
kind: enyo.Control,
events: {
onUserValid: ""
},
components: [ {
name: "errorHandler",
kind: "findApps.Error"
}, {
kind: "ModalDialog",
scrim: !0,
modal: !1,
name: "profilePwdPopup",
components: [ {
kind: "findApps.ProfilePasswordPrompt",
name: "profilePwdPrompt",
onSubmit: "passwordCheck",
onForgetPassword: "forgotPassword",
onCancel: "cancelProfilePwdPopup"
} ]
}, {
kind: "ModalDialog",
scrim: !0,
modal: !0,
name: "forgotPwdPopup",
components: [ {
name: "forgotpasswordprompt",
kind: "findApps.ForgotPasswordPrompt",
onSubmit: "submitSecurityAnswer",
onCancel: "cancelForgotPwdPopup"
} ]
}, {
kind: "ModalDialog",
scrim: !0,
modal: !0,
name: "pwdResetPopup",
components: [ {
name: "passwordresetprompt",
kind: "findApps.PasswordResetPrompt",
onSubmit: "resetPassword"
} ]
}, {
kind: "ModalDialog",
scrim: !0,
modal: !0,
name: "resetEmailPopup",
components: [ {
name: "resetEmailSentPrompt",
kind: "findApps.ResetEmailSentPrompt",
onSubmit: "resetDone"
} ]
} ],
create: function() {
this.inherited(arguments);
var a = findApps.ViewLibrary._container;
a && a.registerObserver && a.registerObserver("resize", this);
},
update: function(a) {
a == "resize" && (this.$.profilePwdPopup && this.$.profilePwdPopup.isOpen ? this.$.profilePwdPopup.resizeHandler() : this.$.forgotPwdPopup && this.$.forgotPwdPopup.isOpen ? this.$.forgotPwdPopup.resizeHandler() : this.$.pwdResetPopup && this.$.pwdResetPopup.isOpen ? this.$.pwdResetPopup.resizeHandler() : this.$.resetEmailPopup && this.$.resetEmailPopup.isOpen && this.$.resetEmailPopup.resizeHandler());
},
passwordCheck: function(a) {
this.$.profilePwdPrompt.showScrim(), uaProfile.password = this.$.profilePwdPrompt.getPassword(), uaProfile.deviceId = findApps.UserSession._deviceId, uaProfile.email = findApps.UserSession._email, this._loginAttemptCount++;
if (uaProfile.password.length < 6 || uaProfile.password.length > 20) {
this.$.profilePwdPrompt.hideScrim(), this.$.profilePwdPrompt.showLengthError();
return;
}
enyo.application.onBrowser ? this.isUserValidSuccess() : enyo.application.connectionManager.isOnline() ? findApps.AccountServices.getInstance().isUserValid(uaProfile.email, uaProfile.password.replace(/ /g, ""), uaProfile.deviceId, {
onSuccess: "isUserValidSuccess",
onFailure: "isUserValidFailure",
scope: this
}) : (this.$.profilePwdPrompt.hideScrim(), this.cancelProfilePwdPopup(), this.genericFailure(a));
},
changePwdSuccess: function(a, b) {
this.log("UserAuthenticator: changePassword Success Response: ", b), this.$.passwordresetprompt.hideScrim(), this.$.pwdResetPopup.close(), b.returnValue && (findApps.UserPreferences.setLoginTime(), this.doUserValid(), this.callbackFnSet == 1 && (this.callbackFnSet = !1, this.callback({
passwordValid: !0,
passwordChanged: !0
})));
},
changePwdFail: function(a, b) {
this.error("UserAuthenticator: changePwdFail Response: ", b), this.$.passwordresetprompt.hideScrim(), this.$.pwdResetPopup.close();
var c = [ "LOC02027" ];
this.genericFailure(a, b, c), this.answerCallback(!1);
},
genericFailure: function(a, b, c) {
if (!c || !enyo.isArray(c)) c = [];
c.push("LOC02024"), this.$.errorHandler.displayError(c);
},
isUserValidSuccess: function(a, b) {
this.$.profilePwdPrompt.hideScrim();
if (enyo.application.onBrowser || b.isValid) this.$.profilePwdPopup.close(), b && b.passwordResetFlag ? (this.$.pwdResetPopup.openAtCenter(), this.$.passwordresetprompt.focusInput()) : (findApps.UserPreferences.setLoginTime(), this.doUserValid(), this.callbackFnSet == 1 && (this.callbackFnSet = !1, this.callback({
passwordValid: !0
}))); else if (uaProfile.questionId == -2) {
this.$.profilePwdPrompt.showScrim();
var c = enyo.g11n.currentLocale();
uaProfile.locale = c.locale, findApps.AccountServices.getInstance().getAccountSecurityQuestions(uaProfile.email, uaProfile.locale, {
onSuccess: "getAccountSecurityQuestionsSuccess",
onFailure: "getAccountSecurityQuestionsFailure",
scope: this
});
} else this.loginError();
},
isUserValidFailure: function(a, b) {
this.error("isUserValid call failed. ", b), this.$.profilePwdPrompt.hideScrim(), this.cancelProfilePwdPopup();
var c = [ "LOC02025" ];
this.genericFailure(a, b, c);
},
requestPasswordResetEmailSuccess: function(a, b) {
this.log("UserAuthenticator: requestPasswordResetEmailSuccess Response ", b), this.$.resetEmailPopup.openAtCenter(), this.$.resetEmailSentPrompt.prepareDisplay(uaProfile.email);
},
requestPasswordResetEmailFailure: function(a, b) {
this.error("UserAuthenticator: requestPasswordResetEmailFailure Response ", b);
var c = [ "LOC02026" ];
this.genericFailure(a, b, c), this.answerCallback(!1);
},
getAccountSecurityQuestionsSuccess: function(a, b) {
this.log("UserAuthenticator: getAccountSecurityQuestionsSuccess Response ", b), this.$.profilePwdPrompt.hideScrim(), response = b, response.id !== undefined ? (uaProfile.questionId = response.id, uaProfile.questionText = response.question) : uaProfile.questionId = -1, this.loginError();
},
getAccountSecurityQuestionsFailure: function(a, b) {
this.error("UserAuthenticator: getAccountSecurityQuestionsFailure Response ", b), this.$.profilePwdPrompt.hideScrim(), findApps.UserProfile.questionId = -1, this.loginError();
},
handleSecurityAnswerSucc: function(a, b, c) {
this.log("UserAuthenticator: handleSecurityAnswerSuccess Response ", b), this.$.forgotpasswordprompt.hideScrim(), b.returnValue == 1 ? (uaProfile.idToken = b.idToken, this.$.forgotPwdPopup.close(), this.$.pwdResetPopup.openAtCenter(), this.$.passwordresetprompt.focusInput()) : (uaProfile.questionId = -1, this.$.forgotpasswordprompt.showWrongResponseMessages());
},
handleSecurityAnswerErr: function(a, b, c) {
this.error("UserAuthenticator: handleSecurityAnswerError Response ", b), this.$.forgotpasswordprompt.hideScrim();
var d = this;
d.attemptCount <= 3 ? this.$.forgotpasswordprompt.showWrongResponseMessages() : (this.cancelForgotPwdPopup(), findApps.AccountServices.getInstance().requestPasswordResetEmail(uaProfile.email, {
onSuccess: "passwordResetEmailSent",
onFailure: "failToSentMail",
scope: this
}));
},
passwordResetEmailSent: function(a, b) {
this.$.resetEmailPopup.openAtCenter(), this.$.resetEmailSentPrompt.prepareDisplay(uaProfile.email);
},
failToSentMail: function(a, b) {
this.$.resetEmailPopup.openAtCenter(), this.$.resetEmailSentPrompt.setDescription();
},
loginError: function() {
this.$.profilePwdPrompt.hideScrim(), this._loginAttemptCount >= 3 ? (this.$.profilePwdPopup.close(), uaProfile.questionId >= 0 ? this.forgotPassword() : findApps.AccountServices.getInstance().requestPasswordResetEmail(uaProfile.email, {
onSuccess: "requestPasswordResetEmailSuccess",
onFailure: "requestPasswordResetEmailFailure",
scope: this
})) : (uaProfile.questionId >= 0 && this.$.profilePwdPrompt.showForgetPasswordButton(), this.$.profilePwdPrompt.showIncorrectError());
},
forgotPassword: function(a) {
this.$.profilePwdPopup.close(), this.$.forgotPwdPopup.openAtCenter(), this.$.forgotpasswordprompt.setParams({
questionText: uaProfile.questionText
}), this.attemptCount = 0, this.$.forgotpasswordprompt.resetAnswer(), this.$.forgotpasswordprompt.focusInput();
},
resetPassword: function(a) {
this.$.passwordresetprompt.showScrim(), this.newPassword = this.$.passwordresetprompt.getNewPassword(), findApps.AccountServices.getInstance().changePassword(this.newPassword.replace(/ /g, ""), uaProfile.questionId, undefined, uaProfile.idToken, !0, {
onSuccess: "changePwdSuccess",
onFailure: "changePwdFail",
scope: this
});
},
resetDone: function(a) {
this.$.resetEmailPopup.close(), this.answerCallback(!1);
},
submitSecurityAnswer: function(a) {
var b = a.getMyAnswer();
this.attemptCount++, this.$.forgotpasswordprompt.showScrim(), findApps.AccountServices.getInstance().authenticateAccountFromSecurityQuestion(uaProfile.email, uaProfile.questionId, b, {
onSuccess: "handleSecurityAnswerSucc",
onFailure: "handleSecurityAnswerErr",
scope: this
});
},
showProfilePassword: function() {
uaProfile.questionId = -2, this._loginAttemptCount = 0, this.$.profilePwdPopup.openAtCenter(), this.$.profilePwdPrompt.resetPassword(), this.$.profilePwdPrompt.focusInput();
},
setNextView: function(a) {
this.nextViewName = a;
},
setOwner: function(a) {
this.owner = a;
},
setCallback: function(a) {
this.callback = a, a != null ? this.callbackFnSet = !0 : this.callbackFnSet = !1;
},
setParams: function(a) {
this.env_app = a.app, this.env_inResponse = a.inResponse, this.env_force = a.force, this.env_callback = a.callback;
},
cancelProfilePwdPopup: function(a) {
this.$.profilePwdPopup.close(), this.answerCallback(!1);
},
cancelForgotPwdPopup: function(a) {
this.$.forgotPwdPopup.close(), this.answerCallback(!1);
},
answerCallback: function(a) {
this.callbackFnSet == 1 && (this.callbackFnSet = !1, this.callback({
passwordValid: a
}));
}
});

// source/details/Details.js

enyo.kind({
name: "findApps.Details",
kind: enyo.VFlexBox,
className: "white-background",
published: {
appItem: ""
},
components: [ {
kind: "Scrim",
name: "scrim",
animateShowing: !1,
layoutKind: "VFlexLayout",
align: "center",
pack: "center",
components: [ {
kind: "SpinnerLarge",
name: "spinner",
showing: !1
} ]
}, {
kind: "Popup",
name: "alertPrompt",
components: [ {
name: "alertTitle",
className: "enyo-item enyo-first",
content: "",
style: "padding: 12px"
}, {
name: "alertMessage",
className: "enyo-item enyo-last",
content: "",
style: "padding: 12px; font-size: 14px"
}, {
kind: "Button",
className: "enyo-button-light",
value: "ok",
caption: $L("OK"),
onclick: "dismissAlertPopup"
} ]
}, {
kind: "findApps.Error",
onSubmit: "submitError",
onCancel: "cancelError"
}, {
kind: "enyo.Control",
name: "headerGroup",
components: [ {
name: "detailHeader",
layoutKind: "HFlexLayout",
kind: "PageHeader",
className: "details-header",
components: [ {
layoutKind: "HFlexLayout",
flex: 1,
components: [ {
name: "detailHeaderImage",
kind: enyo.Image,
className: "details-header-image"
}, {
components: [ {
name: "detailHeaderTitle",
kind: enyo.Control,
className: "details-header-title"
}, {
layoutKind: "HFlexLayout",
components: [ {
name: "detailHeaderCreater",
kind: enyo.Control,
className: "details-header-body",
onclick: "linkToDeveloperSite"
} ]
}, {
layoutKind: "HFlexLayout",
align: "center",
style: "height:24px;",
components: [ {
kind: enyo.Image,
name: "avgRatingImg1",
width: "12px",
height: "12px",
style: "display:block"
}, {
kind: enyo.Image,
name: "avgRatingImg2",
width: "12px",
height: "12px",
style: "display:block"
}, {
kind: enyo.Image,
name: "avgRatingImg3",
width: "12px",
height: "12px",
style: "display:block"
}, {
kind: enyo.Image,
name: "avgRatingImg4",
width: "12px",
height: "12px",
style: "display:block"
}, {
kind: enyo.Image,
name: "avgRatingImg5",
width: "12px",
height: "12px",
style: "display:block"
}, {
name: "detailHeaderRatings",
kind: enyo.Control,
className: "details-header-reviews"
} ]
} ]
} ]
}, {
layoutKind: "HFlexLayout",
components: [ {
kind: "findApps.downloadsavebutton",
name: "downloadsavebutton",
type: "detail"
} ]
} ]
} ]
}, {
className: "upper-shadow"
}, {
name: "detailBody",
kind: enyo.Scroller,
horizontal: !1,
autoHorizontal: !1,
height: "100%",
components: [ {
kind: "enyo.Control",
name: "detailsBodyGroup",
components: [ {
name: "detailBodyBody",
layoutKind: "HFlexLayout",
components: [ {
name: "detailBodyLeft",
width: "320px",
style: "border-right:1px solid #B8B8B8",
components: [ {
kind: "findApps.AverageRating",
name: "averageRatings",
className: "averageRating"
}, {
kind: "findApps.AppSummary",
name: "appSummary",
className: "appSummary"
}, {
name: "linkButtons",
className: "linkButtonDiv",
components: [ {
kind: "findApps.ShareApp",
className: "linkButton",
name: "shareAppButton"
}, {
kind: "Button",
className: "enyo-button-light linkButton",
caption: $L("Developer Apps"),
onclick: "linkToDeveloperApps",
name: "developerAppsButton"
}, {
kind: "Button",
className: "enyo-button-light linkButton",
caption: $L("Support"),
onclick: "linkToSupport",
name: "supportButton"
}, {
kind: "findApps.Details.ReportProblem",
className: "linkButton",
name: "reportProblemButton"
} ]
} ]
}, {
name: "detailBodyRight",
flex: 3,
components: [ {
className: "thumbnail-scroller-background",
name: "thumbnailsScroller",
components: [ {
className: "relief-box",
components: [ {
className: "relief-box-inner",
components: [ {
name: "detailBodyThumbnails",
className: "detailBodyThumbnails",
kind: "findApps.Details.ThumbnailsScroller"
} ]
} ]
} ]
}, {
kind: "findApps.AppDescription",
name: "appDescription"
}, {
content: "",
className: "app-description-review-header"
}, {
kind: "findApps.Details.MyReview",
name: "addReview",
onRenderSuccess: "myReviewRenderSuccess",
onMyReviewResized: "myReviewResized"
}, {
content: $L("Reviews"),
className: "app-description-review-header"
}, {
kind: "Control",
className: "review-box",
components: [ {
kind: "TabGroup",
onChange: "onChangePositiveNegative",
name: "positiveNegativeRadioGroup",
components: [ {
layoutKind: "HFlexLayout",
value: 0,
align: "center",
pack: "center",
components: [ {
content: $L("Positive"),
name: "positiveReviewLbl"
} ]
}, {
layoutKind: "HFlexLayout",
value: 1,
align: "center",
pack: "center",
components: [ {
content: $L("Negative"),
name: "negativeReviewLbl"
} ]
} ]
}, {
kind: "findApps.Details.ReviewList",
style: "clear:both",
name: "positiveReviewList",
onNeedMoreReviews: "getMorePositiveReviews",
onReviewListScroll: "handleReviewListScroll"
}, {
kind: "findApps.Details.ReviewList",
name: "negativeReviewList",
onNeedMoreReviews: "getMoreNegativeReviews",
onReviewListScroll: "handleReviewListScroll"
} ]
} ]
} ]
} ]
} ]
} ],
handleReviewListScroll: function() {
this.$.detailBody.scrollToBottom();
},
create: function() {
var a = findApps.ViewLibrary._container;
a && a.registerObserver && a.registerObserver("orientationChanged", this), this.inherited(arguments), this.firstLaunch = !0;
var b = findApps.AccountServices.getInstance().getAccountInfo({
onSuccess: "accountInfoSuccess",
onFailure: "accountInfoFailure",
scope: this
});
b && this.accountInfoSuccess(null, b), this.appdownloadmgr = enyo.application.appdownloadManager, this.appMetrics = enyo.application.appMetrics;
},
initReviewListData: function(a, b, c) {
a === "positive" ? this.$.positiveReviewList.setReviewListInfo({
reviews: c,
totalCount: b,
appDetails: {
id: this._appDetails.id,
packageid: this._appDetails.publicApplicationId,
version: this._appDetails.version
}
}) : this.$.negativeReviewList.setReviewListInfo({
reviews: c,
totalCount: b,
appDetails: {
id: this._appDetails.id,
packageid: this._appDetails.publicApplicationId,
version: this._appDetails.version
}
});
},
initialize: function() {
this._appDetails = {
id: this.appItem.id,
publicApplicationId: this.appItem.publicApplicationId,
version: ""
}, this.$.detailBody.scrollToBottom(), this._averageRatingData = null;
var a = {
publicApplicationId: this.appItem.publicApplicationId
};
this.$.downloadsavebutton.disableMe(!0), this.$.downloadsavebutton.setAppItem({
appId: this.appItem.publicApplicationId
}), this._negativeReviews = null, this._positiveReviews = null, this.$.positiveReviewList.setNoReviewsMessage($L("")), this.initReviewListData("positive", 0, []), this.$.negativeReviewList.setNoReviewsMessage($L("")), this.initReviewListData("negative", 0, []), this.$.positiveNegativeRadioGroup.setValue(0), this.$.appDescription.listRefresh = enyo.bind(this, this.refreshLists);
},
refreshLists: function() {
this.$.positiveReviewList && this.$.negativeReviewList && (this.$.positiveReviewList.refresh(), this.$.negativeReviewList.refresh());
},
appItemChanged: function() {
this.$.headerGroup.hide(), this.$.detailsBodyGroup.hide(), this.initialize(), this.appItem.viewToLoad ? (this.$.scrim.show(), this.$.spinner.setShowing(!0)) : this.preRenderDetailPage(), this.$.positiveReviewList.fetchSpinner(!0), this.$.negativeReviewList.fetchSpinner(!0), this.getApplicationDetailsFromServer();
},
preRenderDetailPage: function() {
this.$.detailHeaderImage.setSrc(this.appItem.appIcon), this.$.detailHeaderTitle.setContent(this.appItem.title), this.$.detailHeaderCreater.setContent(this.appItem.author), this.$.averageRatings.reset(), this.$.downloadsavebutton.setAppItem({
appId: this.appItem.publicApplicationId
}), this.$.headerGroup.show(), this.$.appSummary.setAppDetails({
version: this.appItem.appVersion,
lastModifiedTime: this.appItem.lastModifiedTime
}), this.$.shareAppButton.setAppDetail({
publicApplicationId: this.appItem.publicApplicationId,
id: this.appItem.id,
title: this.appItem.title
}), this.$.developerAppsButton.disabled = !0, this.$.developerAppsButton.addClass("enyo-button-disabled"), this.$.supportButton.disabled = !0, this.$.supportButton.addClass("enyo-button-disabled"), this.$.reportProblemButton.disableMe(!0);
var a = this.appItem.images ? this.appItem.images.slice() : [];
for (var b = 1; b <= 5; b++) if (this.appItem["appScaledImage" + b] != null) {
var c = {};
c.imageKey = "appScaledImage" + b, c.uri = this.appItem["appScaledImage" + b], a[a.length] = c;
}
var d = {
images: a,
mediaLink: this.appItem.mediaLink,
mediaIcon: this.appItem.mediaIcon
};
this.$.detailBodyThumbnails.setImageData(d), this.$.appDescription.setDescription(this.appItem.summary), this.$.addReview.setAppDetails({
appid: this.appItem.id,
packageid: this.appItem.publicApplicationId,
version: this.appItem.appVersion
}), this.$.detailsBodyGroup.show();
},
changeOrientation: function(a) {
a && a == "landscape" ? this.$.detailHeaderTitle.applyStyle("width", "735px") : this.$.detailHeaderTitle.applyStyle("width", "475px");
},
update: function(a, b) {
a == "orientationChanged" ? this.changeOrientation(b.orientation) : a == "resize" && (this.$.positiveReviewList.refresh(), this.$.negativeReviewList.refresh(), this.$.detailBody.resized(), this.$.detailBodyLeft.resized(), this.$.detailBodyRight.resized(), this.$.detailBodyThumbnails.refresh());
},
renderDetailsPage: function() {
this.renderAverageRatingFromModel(this._averageRatingData), this.renderApplicationReviewsFromModel("positive", this._positiveReviewCount, this._positiveReviews), this.changeOrientation(findApps.ViewLibrary._container._orientation);
},
renderAppDetailsFromModel: function(a) {
if (a) {
this.$.shareAppButton.setAppDetail(a), this.$.reportProblemButton.setAppDetails(a), this.$.developerAppsButton.disabled = !1, this.$.developerAppsButton.removeClass("enyo-button-disabled"), this.$.supportButton.disabled = !1, this.$.supportButton.removeClass("enyo-button-disabled"), this.$.reportProblemButton.disableMe(!1);
var b = findApps.Utilities.array2Map(a.images, "imageKey"), c = findApps.Utilities.findFirstMatch(b, [ "icon/64x64", "icon/48x48" ]), d = c ? c.uri : a.appIcon;
this.$.detailHeaderImage.setSrc(d), this.$.detailHeaderTitle.setContent(a.title), this.$.detailHeaderCreater.setContent(a.creator);
var e = a.images ? a.images.slice() : [];
for (var f = 1; f <= 5; f++) if (a["appScaledImage" + f] != null) {
var g = {};
g.imageKey = "appScaledImage" + f, g.uri = a["appScaledImage" + f], e[e.length] = g;
}
var h = {
images: e,
mediaLink: a.mediaLink,
mediaIcon: a.mediaIcon
};
this.$.detailBodyThumbnails.setImageData(h), this.$.appSummary.setAppDetails(a), this.$.appDescription.setDescription(a.description), this.$.headerGroup.show(), this.$.detailsBodyGroup.show(), this.$.scrim.hide(), this.$.spinner.setShowing(!1);
}
},
myReviewRenderSuccess: function(a, b) {},
myReviewResized: function(a, b) {
this.$.positiveReviewList.refresh(), this.$.negativeReviewList.refresh();
},
renderAverageRatingFromModel: function(a) {
if (a) {
var b = a.totalCount;
if (b == 0) this.$.detailHeaderRatings.setContent($L("No Reviews")); else {
var c;
b > 1 ? c = new enyo.g11n.Template($L("#{num} reviews")) : c = new enyo.g11n.Template($L("#{num} review")), this.$.detailHeaderRatings.setContent(c.evaluate({
num: b
}));
}
a.averageRating || (a.averageRating = 0);
var d = a.averageRating * 2;
this.$.avgRatingImg1.setSrc("images/stars/star-" + findApps.Utilities.formatStar(d, 0) + ".png"), this.$.avgRatingImg2.setSrc("images/stars/star-" + findApps.Utilities.formatStar(d, 1) + ".png"), this.$.avgRatingImg3.setSrc("images/stars/star-" + findApps.Utilities.formatStar(d, 2) + ".png"), this.$.avgRatingImg4.setSrc("images/stars/star-" + findApps.Utilities.formatStar(d, 3) + ".png"), this.$.avgRatingImg5.setSrc("images/stars/star-" + findApps.Utilities.formatStar(d, 4) + ".png"), this.$.averageRatings.show(), this.$.averageRatings.setAppRatingData(a);
} else this.$.averageRatings.hide();
},
renderApplicationReviewsFromModel: function(a, b, c) {
this.initReviewListData(a, b, c), this._showingPositiveReviews = a === "positive", this._showingPositiveReviews ? (this.$.positiveNegativeRadioGroup.setValue(0), this.$.positiveReviewList.show(), this.$.negativeReviewList.hide(), this.$.positiveReviewList.refresh()) : (this.$.positiveNegativeRadioGroup.setValue(1), this.$.negativeReviewList.show(), this.$.positiveReviewList.hide(), this.$.negativeReviewList.refresh());
},
_showVideoPreview: function() {
var a = this._appDetails.getDetails(), b = {};
b.target = a.mediaLink, b.direct = !0;
},
linkToDeveloperApps: function() {
var a = this._appDetails.vendorid, b = new enyo.g11n.Template($L("More Applications by #{developer}")), c = {
developerId: a,
hideSearchField: !0,
title: b.evaluate({
developer: this._appDetails.creator
}),
comingFrom: "details",
appName: this._appDetails.title
}, d = findApps.ViewLibrary.getView("DEVSEARCH");
d.setParams(c);
},
linkToDeveloperSite: function() {
this._appDetails.publicApplicationId && this._appDetails.homeURL && (this.appMetrics && this.appMetrics.trackEvent("linkToDeveloperSite/" + this._appDetails.publicApplicationId + "?url=" + this._appDetails.homeURL), findApps.ApplicationManager.getInstance().openBrowserPage(this._appDetails.homeURL, "browserPageOpenSuccess", "browserPageOpenFailure", this));
},
linkToSupport: function() {
this.appMetrics && this.appMetrics.trackEvent("linkToSupport/" + this._appDetails.publicApplicationId + "?url=" + this._appDetails.supportURL), findApps.ApplicationManager.getInstance().openBrowserPage(this._appDetails.supportURL, "browserPageOpenSuccess", "browserPageOpenFailure", this);
},
browserPageOpenSuccess: function() {},
browserPageOpenFailure: function() {},
onChangePositiveNegative: function(a) {
a.getValue() == 0 ? this._showingPositiveReviews == 0 && (this._showingPositiveReviews = !0, this._positiveReviews || this.getApplicationReviewsFromServer("positive", 0, 10, "positiveReviewList"), this.$.positiveReviewList.show(), this.$.negativeReviewList.hide(), this.$.positiveReviewList.refresh()) : this._showingPositiveReviews == 1 && (this._showingPositiveReviews = !1, this._negativeReviews || this.getApplicationReviewsFromServer("negative", 0, 10, "negativeReviewList"), this.$.positiveReviewList.hide(), this.$.negativeReviewList.show(), this.$.negativeReviewList.refresh());
},
getApplicationDetailsFromServer: function() {
findApps.BaseServer.getACServer().getApplicationDetails(this.appItem.id, this.appItem.publicApplicationId, enyo.g11n.currentLocale().toISOString(), "AppDetailsService", !1, {
onSuccess: "handleServerResponse",
onFailure: "handleServerError",
scope: this
}), this.getApplicationReviewsFromServer("negative", 0, 10, "negativeReviewListCnt");
},
getApplicationReviewsFromServer: function(a, b, c, d) {
findApps.BaseServer.getACServer().getAppReviewsList(this.appItem.id, this.appItem.publicApplicationId, a, b, c, d, {
onSuccess: "handleServerResponse",
onFailure: "handleServerError",
scope: this
});
},
getMorePositiveReviews: function(a, b) {
var c = 10;
this._positiveReviewCount - b.offset < 10 && (c = this._positiveReviewCount - b.offset), this.getApplicationReviewsFromServer("positive", b.offset, c, "morePositiveReviewList");
},
getMoreNegativeReviews: function(a, b) {
var c = 10;
this._negativeReviewCount - b.offset < 10 && (c = this._negativeReviewCount - b.offset), this.getApplicationReviewsFromServer("negative", b.offset, c, "moreNegativeReviewList");
},
updateFirstFetchOfNegativeReviewsAndCount: function(a) {
this._negativeReviewCount = a.body.response.totalCount, this._negativeReviewCount === 0 && this.$.negativeReviewList.setNoReviewsMessage($L("No negative reviews have been written yet.")), this._negativeReviews = a.body.response.reviews, this.initReviewListData("negative", this._negativeReviewCount, this._negativeReviews);
},
handleServerResponse: function(a, b, c, d) {
switch (d.service) {
case "AppDetailsService":
b.OutGetAppDetailV2 && (this._appDetails = b.OutGetAppDetailV2.appDetail, this.$.downloadsavebutton.updateFromServer(this._appDetails), this.$.downloadsavebutton.disableMe(!1), this.$.addReview.setAppDetails({
appid: this.appItem.id,
packageid: this.appItem.publicApplicationId,
version: this._appDetails.version
}), this.renderAppDetailsFromModel(this._appDetails), this.getApplicationReviewsFromServer("positive", 0, 10, "positiveReviewList"));
break;
case "positiveReviewList":
this.$.positiveReviewList.fetchSpinner(!1), !b || !b.body || b.body.error != "" ? this.$.positiveReviewList.setNoReviewsMessage($L("Could not fetch reviews for the Application.")) : (this._averageRatingData || (this._averageRatingData = b.body.response.ratingsBreakdown), this._positiveReviewCount = b.body.response.totalCount, this._positiveReviewCount === 0 && this.$.positiveReviewList.setNoReviewsMessage($L("No positive reviews have been written yet.")), this._positiveReviews = b.body.response.reviews, this.renderDetailsPage());
break;
case "negativeReviewListCnt":
this.$.negativeReviewList.fetchSpinner(!1), this.updateFirstFetchOfNegativeReviewsAndCount(b), this.initReviewListData("negative", this._negativeReviewCount, this._negativeReviews);
break;
case "negativeReviewList":
this.$.negativeReviewList.fetchSpinner(!1), this.updateFirstFetchOfNegativeReviewsAndCount(b), this.renderApplicationReviewsFromModel("negative", this._negativeReviewCount, this._negativeReviews);
break;
case "morePositiveReviewList":
this._positiveReviews ? this._positiveReviews.concat(b.body.response.reviews) : this._positiveReviews = b.body.response.reviews, this._positiveReviewCount = b.body.response.totalCount, this.$.positiveReviewList.updateReviewList(b.body.response.reviews);
break;
case "moreNegativeReviewList":
this._negativeReviews ? this._negativeReviews.concat(b.body.response.reviews) : this._negativeReviews = b.body.response.reviews, this._negativeReviewCount = b.body.response.totalCount, this.$.negativeReviewList.updateReviewList(b.body.response.reviews);
break;
default:
}
},
handleServerError: function(a, b, c, d, e) {
switch (d.service) {
case "AppDetailsService":
this._appDetails = null, e.push("LOC07001"), this.displayError(e);
break;
case "positiveReviewList":
this.$.positiveReviewList.fetchSpinner(!1), this.$.positiveReviewList.setNoReviewsMessage($L("Could not fetch reviews for the Application."));
break;
case "negativeReviewList":
this.$.negativeReviewList.fetchSpinner(!1), this.$.negativeReviewList.setNoReviewsMessage($L("Could not fetch reviews for the Application."));
}
},
accountInfoSuccess: function(a, b) {
findApps.UserSession.getAccountInfo() == null && findApps.UserSession.setAccountInfo(b), this.accountInfo = b;
},
accountInfoFailure: function(a, b) {
this.error("Details - Could not fetch first name / last name - getAccountInfo failure. ", b), this.accountInfo = null;
},
displayError: function(a) {
this.$.error.displayError(a);
},
showAlertPopup: function(a, b) {
this.$.alertPrompt.openAtCenter(), this.$.alertTitle.setContent(a), this.$.alertMessage.setContent(b);
},
dismissAlertPopup: function() {
this.$.alertPrompt.close();
}
});

// source/payment/CCType.js

enyo.kind({
name: "findApps.CCType",
kind: enyo.Item,
published: {
code: "",
description: "",
selected: !1
},
events: {
onCCTypeSelected: ""
},
components: [ {
kind: enyo.HFlexBox,
domStyles: "linePaddingSlim",
components: [ {
kind: "CheckBox",
checked: !1,
onChange: "checkboxSelected",
name: "ccTypeCheckbox"
}, {
content: "",
name: "ccTypeName",
style: "margin-left:10px"
}, {
flex: 1,
components: [ {
kind: "Image",
name: "ccTypeIcon",
src: "",
style: "float: right;"
} ]
} ]
} ],
create: function() {
this.inherited(arguments), this.codeChanged(), this.descriptionChanged(), this.selectedChanged();
},
descriptionChanged: function() {
this.$.ccTypeName.setContent(this.description), this.$.ccTypeIcon.setSrc("images/payment-" + this.description.toLowerCase() + ".png");
},
selectedChanged: function() {
this.$.ccTypeCheckbox.checked != this.selected && (this.$.ccTypeCheckbox.checked = this.selected, this.$.ccTypeCheckbox.checkedChanged());
},
codeChanged: function() {
this.$.ccTypeName.addClass("icon." + this.code);
},
checkboxSelected: function() {
if (this.selected == 1 && this.$.ccTypeCheckbox.checked == 0) {
this.$.ccTypeCheckbox.checked = !0, this.$.ccTypeCheckbox.checkedChanged();
return;
}
this.selected = this.$.ccTypeCheckbox.checked, this.doCCTypeSelected(this.code, this.$.ccTypeCheckbox.checked);
}
});

// source/details/ThumbnailImageScroller.js

enyo.kind({
name: "findApps.Details.ThumbnailsScroller",
kind: "enyo.Control",
components: [ {
name: "imageViewPopup",
className: "screenshot-thumbnail-popup",
kind: "Popup",
layoutKind: "HFlexLayout",
style: "overflow: hidden",
height: "fill",
components: [ {
kind: "findApps.Details.ThumbnailImageView",
name: "thumbnailImageView",
flex: 1,
onCancel: "closePopup"
} ]
}, {
name: "thumbnailScroller",
layoutKind: "HFlexLayout",
className: "thumbnailScrollerClass",
autoHorizontal: !0,
horizontal: !0,
autoVertical: !1,
vertical: !1,
kind: enyo.Scroller,
components: [ {
kind: "HFlexBox",
flex: 1,
name: "client"
} ]
} ],
closePopup: function(a) {
this.$.imageViewPopup.close();
},
published: {
imageData: null
},
create: function() {
this.inherited(arguments), this.appVideo = {
afterThumbnails: !1,
showVideo: !1,
videoSrc: "",
videoImg: ""
}, this.screenshots = [];
},
imageDataChanged: function(a) {
this.processImageData(), this.$.thumbnailScroller.setScrollLeft(0), this.renderProcessedImages();
},
processImageData: function() {
var a = this.appVideo, b = this.imageData;
a.showVideo = !1, b && b.mediaLink && (a.showVideo = !0, a.videoSrc = b.mediaLink, a.videoImg = b.mediaIcon), this.screenshots = [];
var c = findApps.Utilities.array2Map(b.images, "imageKey"), d, e, f, g;
for (var h = 0; h < 5; h++) d = null, e = null, f = "", g = "", d = findApps.Utilities.findFirstMatch(c, [ "screenshot/" + (h + 1) + "/landscape/480x320/tb", "screenshot/" + (h + 1) + "/portrait/320x480/tb", "screenshot/" + (h + 1) + "/portrait/320x480", "screenshot/" + (h + 1) + "/portrait/96x144", "screenshot/" + (h + 1) + "/portrait/75x112", "appScaledImage" + (h + 1) ]), d && (f = d.uri, e = findApps.Utilities.findFirstMatch(c, [ "screenshot/" + (h + 1) + "/landscape/768x576/tb", "screenshot/" + (h + 1) + "/landscape/480x320/tb", "screenshot/" + (h + 1) + "/portrait/576x768/tb", "screenshot/" + (h + 1) + "/portrait/320x480/tb" ]), g = e ? e.uri : d.uri, d.imageKey.indexOf("appScaledImage") >= 0 && (g = g ? g : d.uri.replace(/\/S\//gi, "/L/"))), f && this.screenshots.push({
thumbnailImgUrl: f,
carouselImgUrl: g
});
},
renderProcessedImages: function() {
this.$.client.destroyControls();
var a = this.appVideo;
a.showVideo && !a.afterThumbnails && this.createVideoComponent(a.videoSrc, a.videoImg);
var b = this.screenshots;
for (var c in b) this.createThumbnailComponent("Thumbnail_" + c, c, b[c]);
a.showVideo && a.afterThumbnails && this.createVideoComponent(a.videoSrc, a.videoImg), this.$.thumbnailScroller.contentChanged(), this.$.thumbnailScroller.resized();
},
createVideoComponent: function(a, b) {
this.$.client.createComponent({
components: [ {
className: "details-body-video-img",
kind: "findApps.AppDetailVideoImage",
src: b,
mediaLink: a,
mediaIcon: b,
name: "videoControl",
onclick: "handleVideoClick",
onerror: "videoImageError"
}, {
kind: "Item",
name: "videoOverlayItem",
className: "video-overlay",
onclick: "handleVideoClick",
components: [ {
kind: "Image",
className: "video-overlay-play",
src: "images/Video_Icon.png"
} ]
} ],
owner: this
});
},
createThumbnailComponent: function(a, b, c) {
if (!c.thumbnailImgUrl) return;
this.$.client.createComponent({
components: [ {
owner: this,
name: a,
className: "details-body-thumbnail-img",
kind: "findApps.AppDetailImage",
src: c.thumbnailImgUrl,
onclick: "handleThumbnailClick",
onerror: "imageError",
index: b,
largeImgUrl: c.carouselImgUrl
} ]
});
},
handleThumbnailClick: function(a) {
if (!a || !a.index) return;
if (!this.screenshots[a.index] || !this.screenshots[a.index].carouselImgUrl) return;
this.$.imageViewPopup.lazy == 1 && this.$.imageViewPopup.validateComponents();
var b = [], c = 0, d = this.screenshots;
for (var e = 0; e < d.length; e++) d[e].carouselImgUrl && (b.push(d[e]), a.index == e && (c = b.length - 1));
b.length && (this.$.thumbnailImageView.setParams({
images: b,
index: c
}), this.$.imageViewPopup.openAtCenter());
},
handleVideoClick: function() {
findApps.ApplicationManager.getInstance().openBrowserPage(this.appVideo.videoSrc, "browserPageOpenSuccess", "browserPageOpenFailure", this);
},
browserPageOpenSuccess: function() {},
browserPageOpenFailure: function() {},
update: function(a, b) {
a == "resize" && (this.$.thumbnailScroller.contentChanged(), this.$.thumbnailScroller.resized());
},
refresh: function() {
this.$.thumbnailScroller.contentChanged(), this.$.thumbnailScroller.resized();
},
imageError: function(a, b) {
a.destroy();
},
videoImageError: function(a, b) {
this.$.videoOverlayItem && this.$.videoOverlayItem.hide(), a.destroy();
}
}), enyo.kind({
name: "findApps.AppDetailImage",
kind: "enyo.Image",
published: {
index: "",
largeImgUrl: ""
}
}), enyo.kind({
name: "findApps.AppDetailVideoImage",
kind: "enyo.Image",
published: {
mediaLink: "",
mediaIcon: ""
}
});

// source/details/AppSummary.js

enyo.kind({
name: "findApps.AppSummary",
kind: "VFlexBox",
showMoreButton: !1,
published: {
appDetails: null
},
components: [ {
className: "application-info",
name: "compatibleContainer",
kind: "VFlexBox",
components: [ {
className: "application-info-label",
content: $L("Compatible: ")
}, {
kind: enyo.Control,
name: "compatibleLbl",
content: $L("")
} ]
}, {
className: "application-info",
name: "versionContainer",
kind: "VFlexBox",
components: [ {
className: "application-info-label",
content: $L("Version: ")
}, {
kind: enyo.Control,
name: "versionLbl",
content: $L("")
} ]
}, {
className: "application-info",
name: "updatedContainer",
kind: "VFlexBox",
components: [ {
className: "application-info-label",
content: $L("Updated:  ")
}, {
kind: enyo.Control,
name: "updatedLbl",
content: $L("")
} ]
}, {
className: "application-info",
name: "sizeContainer",
kind: "VFlexBox",
components: [ {
className: "application-info-label",
content: $L("Size:  ")
}, {
kind: enyo.Control,
name: "sizeLbl",
content: $L("")
} ]
}, {
className: "application-info",
name: "locContainer",
kind: "VFlexBox",
components: [ {
name: "locationLbl",
className: "application-info-label",
content: $L("Uses Location Services  ")
}, {
kind: enyo.Control,
content: $L(""),
name: "locationText"
} ]
}, {
className: "application-info",
kind: "LabeledContainer",
label: $L("Works With: "),
name: "worksWithContainer",
components: [ {
kind: enyo.Control,
name: "contacts",
content: $L("Contacts")
}, {
kind: enyo.Control,
name: "calendar",
content: $L("Calendar")
}, {
kind: enyo.Control,
name: "messaging",
content: $L("Messaging")
}, {
kind: enyo.Control,
name: "email",
content: $L("Email")
}, {
kind: enyo.Control,
name: "universalSearch",
content: $L("Universal Search")
}, {
kind: enyo.Control,
name: "dockMode",
content: $L("Dock Mode")
} ]
}, {
className: "application-info",
name: "moreButton",
onclick: "showMore",
className: "moreButton",
components: [ {
name: "moreButtonContent",
kind: "Pushable",
style: "display:inline-block;margin: 0 0 0 0;",
content: $L("More")
}, {
name: "upArrow",
style: "display:inline-block;margin: 0 0 0 4px;align:center;",
kind: "Image",
src: "images/menu/arrow_up.png"
}, {
name: "downArrow",
style: "display:inline-block;margin: 0 0 0 4px;align:center;",
kind: "Image",
src: "images/menu/arrow_down.png"
} ]
}, {
name: "utcdate",
kind: "findApps.UTCDate"
} ],
appDetailsChanged: function(a) {
this.showLess();
},
showLess: function() {
if (this.appDetails.supportedDevices) {
if (typeof this.appDetails.supportedDevices == "string") this.$.compatibleLbl.setContent(this.appDetails.supportedDevices); else {
var a = this.appDetails.supportedDevices[0];
for (var b in this.appDetails.supportedDevices) {
if (b == 0) continue;
a = a + ", " + this.appDetails.supportedDevices[b];
}
this.$.compatibleLbl.setContent(a);
}
this.$.compatibleContainer.show();
} else this.$.compatibleContainer.hide();
this.appDetails.version ? (this.$.versionContainer.show(), this.$.versionLbl.setContent(this.appDetails.version)) : this.$.versionContainer.hide();
if (this.appDetails.lastModifiedTime) {
this.$.updatedContainer.show();
var c = this.$.utcdate.parse(this.appDetails.lastModifiedTime), d = findApps.Utilities.Formatter.formatLongDate(c);
this.$.updatedLbl.setContent(d);
} else this.$.updatedContainer.hide();
if (this.appDetails.installSize) {
this.$.sizeContainer.show();
var e = this.appDetails.installSize / 1048576 + 1;
e = findApps.Utilities.Formatter.formatRound(e) + " " + $L("MB"), this.$.sizeLbl.setContent(e);
} else this.$.sizeContainer.hide();
this.appDetails.attributes && this.appDetails.attributes.provides && (this.appDetails.attributes.provides.dockMode || this.appDetails.attributes.provides.universalSearch) || this.appDetails.islocationbased ? (this.$.moreButton.show(), this.$.moreButtonContent.setContent($L("More")), this.showMoreButton = !0, this.$.moreButton.onclick = "showMore", this.$.upArrow.hide(), this.$.downArrow.show()) : (this.$.moreButton.hide(), this.showMoreButton = !1), this.$.dockMode.hide(), this.$.universalSearch.hide(), this.$.worksWithContainer.hide(), this.$.locationLbl.hide(), this.$.locationText.hide();
},
showMore: function() {
if (this.appDetails.attributes.provides) {
var a = this.appDetails.attributes.provides, b = !1, c = !1, d = !1, e = !1, f = !1;
a.dockMode ? (b = !0, this.$.dockMode.show()) : this.$.dockMode.hide(), a.universalSearch ? (b = !0, this.$.universalSearch.show()) : this.$.universalSearch.hide();
if (a.connectors) for (var g in a.connectors) a.connectors[g] == "CONTACTS" ? (this.$.contacts.show(), c = !0, b = !0) : a.connectors[g] == "EMAIL" ? (this.$.email.show(), d = !0, b = !0) : a.connectors[g] == "MESSAGING" ? (this.$.messaging.show(), e = !0, b = !0) : a.connectors[g] == "CALENDAR" && (this.$.calendar.show(), f = !0, b = !0);
b ? this.$.worksWithContainer.show() : this.$.worksWithContainer.hide(), c == 0 && this.$.contacts.hide(), f == 0 && this.$.calendar.hide(), d == 0 && this.$.email.hide(), e == 0 && this.$.messaging.hide();
} else this.$.worksWithContainer.hide();
this.appDetails.islocationbased ? this.$.locationLbl.show() : this.$.locationLbl.hide(), this.$.moreButtonContent.setContent($L("Less")), this.$.upArrow.show(), this.$.downArrow.hide(), this.$.moreButton.onclick = "showLess";
}
});

// source/details/AppDescription.js

enyo.kind({
name: "findApps.AppDescription",
kind: "enyo.Control",
components: [ {
content: $L("Description"),
className: "appDescriptionHeader"
}, {
name: "description",
components: [ {
name: "descriptionText",
kind: enyo.Control,
className: "appDescriptionText"
}, {
name: "descriptionMore",
showing: "false",
kind: enyo.Control,
className: "MoreLessLink",
onclick: "onClickDescriptionMore",
components: [ {
style: "display:inline-block;margin: 0 0 0 0;",
content: $L("More")
}, {
style: "display:inline-block;margin: 0 0 0 4px;align:center;",
kind: "Image",
src: "images/menu/arrow_down.png"
} ]
}, {
name: "descriptionLess",
showing: "false",
kind: enyo.Control,
className: "MoreLessLink",
onclick: "onClickDescriptionLess",
components: [ {
style: "display:inline-block;margin: 0 0 0 0;",
content: $L("Less")
}, {
style: "display:inline-block;margin: 0 0 0 4px;align:center;",
kind: "Image",
src: "images/menu/arrow_up.png"
} ]
} ]
} ],
published: {
description: null
},
listRefresh: undefined,
descriptionChanged: function(a) {
this.description.length > 250 ? (this.shortDescription = this.description.substr(0, 250) + "...", this.onClickDescriptionLess()) : (this.$.descriptionMore.hide(), this.$.descriptionLess.hide(), this.$.descriptionText.setContent(this.description));
},
onClickDescriptionMore: function() {
this.$.descriptionText.setContent(this.description), this.$.descriptionMore.hide(), this.$.descriptionLess.show(), this.listRefresh && this.listRefresh();
},
onClickDescriptionLess: function() {
this.$.descriptionText.setContent(this.shortDescription), this.$.descriptionMore.show(), this.$.descriptionLess.hide(), this.listRefresh && this.listRefresh();
}
});

// source/details/ReviewList.js

enyo.kind({
name: "findApps.Details.ReviewList",
kind: "VFlexBox",
published: {
noReviewsMessage: "",
reviewListInfo: null,
reviewAuthTemp: new enyo.g11n.Template($L("By: #{author}")),
reivewHelpTemp: new enyo.g11n.Template($L("#{usefulCnt} of #{totalCnt} found this review helpful."))
},
events: {
onNeedMoreReviews: "",
onReviewListScroll: ""
},
components: [ {
kind: "findApps.Error"
}, {
className: "relief-box light",
components: [ {
className: "relief-box-inner",
components: [ {
layoutKind: "VFlexLayout",
name: "reviewFetchLayout",
showing: !1,
align: "center",
pack: "center",
height: "60px",
components: [ {
kind: "Spinner",
name: "reviewFetchSpinner",
showing: !1
} ]
}, {
height: "500px",
name: "noReviewList",
kind: enyo.Control,
flex: 1,
style: "color:#aaa; padding:90px 0 0 0; text-align:center;"
}, {
height: "500px",
classname: "review-list",
name: "reviewList",
accelerated: !0,
kind: "VirtualList",
flex: 1,
onSetupRow: "getReview",
onAcquirePage: "acquireListPage",
components: [ {
kind: "VFlexBox",
className: "review-list-rows",
components: [ {
layoutKind: "HFlexLayout",
components: [ {
flex: 1,
layoutKind: "HFlexLayout",
components: [ {
name: "reviewListItemAuthor",
kind: enyo.Control,
className: "review-list-author"
} ]
}, {
name: "reviewListItemDate",
className: "review-item-date"
}, {
kind: enyo.Image,
name: "reviewListItemStar"
} ]
}, {
name: "reviewListItemComment",
className: "review-list-comment",
allowHtml: !0
}, {
layoutKind: "HFlexLayout",
name: "reviewReviewsBox",
align: "center",
className: "enyo-row",
components: [ {
content: $L("Was this review useful?"),
style: "font-style:italic;margin-right:6px;",
className: ""
}, {
kind: "Button",
name: "reviewUsefulYesButton",
className: "enyo-button-light helpful-button",
caption: $L("Yes"),
onclick: "onClickUsefulYes"
}, {
kind: "Button",
name: "reviewUsefulNoButton",
className: "enyo-button-light helpful-button",
caption: $L("No"),
onclick: "onClickUsefulNo"
} ]
}, {
content: "",
name: "usefulNessCount",
className: "enyo-row"
} ]
} ]
} ]
} ]
} ],
onClickUsefulYes: function(a, b) {
var c = b.rowIndex;
this.reviews[c] && this.markReviewUsefulness(c, this.reviews[c], !0);
},
onClickUsefulNo: function(a, b) {
var c = b.rowIndex;
this.reviews[c] && this.markReviewUsefulness(c, this.reviews[c], !1);
},
getReview: function(a, b) {
var c = (new Date).getTime();
if (b >= 0 && b < this.reviewListInfo.totalCount) {
var d = this.reviews[b];
if (d) {
d.usefulCount || (d.usefulCount = 0), d.unusefulCount || (d.unusefulCount = 0);
var e = "images/stars-medium-" + d.rating + ".png";
return this.$.reviewListItemStar.setSrc(e), this.$.reviewListItemAuthor.setContent(this.reviewAuthTemp.evaluate({
author: d.creator
})), this.$.reviewListItemDate.setContent(findApps.Utilities.Formatter.formatShortDate(new Date(d.created))), this.$.reviewUsefulYesButton.disabled = !1, this.$.reviewUsefulYesButton.removeClass("enyo-button-disabled"), this.$.reviewUsefulNoButton.disabled = !1, this.$.reviewUsefulNoButton.removeClass("enyo-button-disabled"), d.accountId && findApps.UserSession._accountId && d.accountId == findApps.UserSession._accountId ? (this.$.usefulNessCount.setContent(this.reivewHelpTemp.evaluate({
usefulCnt: d.usefulCount,
totalCnt: d.unusefulCount + d.usefulCount
})), this.$.usefulNessCount.show(), this.$.reviewReviewsBox.hide()) : d.usefulToMe == 1 || d.usefulToMe == 0 ? (this.$.usefulNessCount.setContent(this.reivewHelpTemp.evaluate({
usefulCnt: d.usefulCount,
totalCnt: d.unusefulCount + d.usefulCount
})), this.$.usefulNessCount.show(), this.$.reviewReviewsBox.hide()) : (this.$.usefulNessCount.hide(), this.$.reviewReviewsBox.show()), this.$.reviewListItemComment.setContent(d.comments), !0;
}
}
},
acquireListPage: function(a, b) {
var c = b * a.pageSize;
c > 0 && c < this.reviewListInfo.totalCount && !this.reviews[c] && this.doNeedMoreReviews({
offset: c
});
},
reviewListInfoChanged: function(a) {
this.reviews = this.reviewListInfo.reviews, this.appDetails = this.reviewListInfo.appDetails, this.reviews && this.reviews.length ? (this.$.noReviewList.hide(), this.$.reviewList.show(), this.$.reviewList.punt()) : (this.$.noReviewList.show(), this.$.reviewList.hide());
},
noReviewsMessageChanged: function() {
this.$.noReviewList.setContent(this.noReviewsMessage);
},
updateReviewList: function(a) {
this.reviews = this.reviews.concat(a), this.$.reviewList.resized();
},
refresh: function() {
this.$.reviewList.resized();
},
markReviewUsefulness: function(a, b, c) {
var d = "";
c == 1 ? d = "ReviewUsefulService:" + a : d = "ReviewUnusefulService:" + a, findApps.BaseServer.getACServer().updateReviewOfReview(this.appDetails.id, this.appDetails.packageid, b.version, b.id, c, d, {
onSuccess: "handleServerResponse",
onFailure: "handleServerError",
scope: this
}), this.$.reviewUsefulYesButton.disabled = !0, this.$.reviewUsefulYesButton.addClass("enyo-button-disabled"), this.$.reviewUsefulNoButton.disabled = !0, this.$.reviewUsefulNoButton.addClass("enyo-button-disabled");
},
handleServerResponse: function(a, b, c, d) {
var e = d.service.indexOf(":"), f = d.service.substring(e + 1), g = d.service.substring(0, e);
g == "ReviewUsefulService" ? (this.reviews[f].usefulToMe = !0, this.reviews[f].usefulCount++) : g == "ReviewUnusefulService" && (this.reviews[f].usefulToMe = !1, this.reviews[f].unusefulCount++), this.refresh();
},
handleServerError: function(a, b, c, d, e) {
e.push("LOC07200"), this.displayError(e);
},
displayError: function(a) {
findApps.ViewLibrary._container.isTopView(this.owner.owner) && this.$.error.displayError(a);
},
submitError: function() {
this.$.error.cancel();
},
cancelError: function() {
this.$.error.cancel();
},
create: function() {
this.inherited(arguments), this.$.reviewList.scrollerScroll = enyo.bind(this, "scrollerScroll"), this.$.reviewList.$.scroller.onScroll = "scrollerScroll";
},
scrollerScroll: function() {
this.doReviewListScroll();
},
fetchSpinner: function(a) {
this.$.reviewFetchLayout.setShowing(a), this.$.reviewFetchSpinner.setShowing(a);
}
});

// source/details/MyReview.js

enyo.kind({
name: "findApps.Details.MyReview",
kind: "enyo.Control",
published: {
appDetails: null
},
myReviewDetails: null,
events: {
onRenderSuccess: "",
onMyReviewResized: ""
},
components: [ {
kind: "findApps.Error"
}, {
kind: "Popup",
name: "alertPrompt",
components: [ {
name: "alertTitle",
className: "enyo-item enyo-first",
content: "",
style: "padding: 12px"
}, {
name: "alertMessage",
className: "enyo-item enyo-last",
content: "",
style: "padding: 12px; font-size: 14px"
}, {
kind: "Button",
className: "enyo-button-light",
value: "ok",
caption: $L("OK"),
onclick: "dismissAlertPopup"
} ]
}, {
name: "addReview",
kind: "Group",
className: "addReview",
components: [ {
layoutKind: "HFlexLayout",
flex: 1,
components: [ {
kind: enyo.Control,
className: "app-details-rate-app-header",
content: $L("Rate This App:")
}, {
flex: 3,
layoutKind: "HFlexLayout",
components: [ {
name: "addReviewStarImg1",
className: "add-review-star-img",
kind: enyo.Image,
src: "images/star-large-single-gray.png",
onclick: "onClickAddReviewStarImg1"
}, {
name: "addReviewStarImg2",
className: "add-review-star-img",
kind: enyo.Image,
src: "images/star-large-single-gray.png",
onclick: "onClickAddReviewStarImg2"
}, {
name: "addReviewStarImg3",
className: "add-review-star-img",
kind: enyo.Image,
src: "images/star-large-single-gray.png",
onclick: "onClickAddReviewStarImg3"
}, {
name: "addReviewStarImg4",
className: "add-review-star-img",
kind: enyo.Image,
src: "images/star-large-single-gray.png",
onclick: "onClickAddReviewStarImg4"
}, {
name: "addReviewStarImg5",
className: "add-review-star-img",
kind: enyo.Image,
src: "images/star-large-single-gray.png",
onclick: "onClickAddReviewStarImg5"
} ]
} ]
}, {
layoutKind: "HFlexLayout",
flex: 2,
name: "addReviewComment",
className: "add-review-comment",
components: [ {
flex: 1,
name: "addReviewTextField",
components: [ {
kind: "InputBox",
name: "addReviewCommentInputBox",
components: [ {
name: "scroller",
kind: "BasicScroller",
autoVertical: !0,
flex: 1,
style: "height:100px;",
components: [ {
style: "padding:10px;",
components: [ {
kind: "RichText",
flex: 1,
name: "addReviewCommentInput",
className: "add-review-comment-input",
style: "min-height:90px;border-width:0px;border-style:none;",
hint: $L("Tap here to begin typing")
} ]
} ]
} ]
} ]
} ]
}, {
layoutKind: "HFlexLayout",
flex: 1,
align: "center",
name: "submitCancelReview",
components: [ {
kind: "CustomListSelector",
name: "nameSelector",
style: "margin:0 14px 0 14px;"
}, {
kind: "Button",
name: "submitAReviewButton",
className: "enyo-button-light",
caption: $L("Submit"),
onclick: "onClickSubmitAReview"
}, {
kind: "Button",
name: "cancelReviewButton",
className: "enyo-button-light",
caption: $L("Cancel"),
onclick: "onClickCancelReview"
} ]
} ]
}, {
name: "myReview",
components: [ {
caption: $L("My Review")
}, {
components: [ {
name: "myReviewItem",
kind: "VFlexBox",
className: "my-review enyo-row",
components: [ {
layoutKind: "HFlexLayout",
components: [ {
flex: 1,
layoutKind: "HFlexLayout",
className: "my-review-items",
components: [ {
name: "myReviewItemStar",
className: "my-review-stars",
kind: enyo.Image,
src: ""
}, {
name: "author",
className: "my-review-name",
kind: enyo.Control
} ]
}, {
flex: 1,
components: [ {
name: "myReviewItemDate",
className: "my-review-date"
} ]
} ]
}, {
name: "myReviewItemComment",
className: "my-review-comment-text",
allowHtml: !0
}, {
kind: "Button",
name: "updateAReviewButton",
className: "enyo-button-light my-review-update-comment-button",
caption: $L("Update"),
onclick: "onClickUpdateMyReview"
} ]
} ]
} ]
} ],
create: function() {
this.inherited(arguments), this.appdownloadmgr = enyo.application.appdownloadManager, this.myReviewDetails = null;
var a = findApps.AccountServices.getInstance().getAccountInfo({
onSuccess: "accountInfoSuccess",
onFailure: "accountInfoFailure",
scope: this
});
a && this.accountInfoSuccess(null, a);
},
destroy: function() {
this.appDownload && this.appDownload.detach(this), this.inherited(arguments);
},
appDetailsChanged: function(a) {
this.appDownload && this.appDownload.detach(this), this.appDownload = this.appdownloadmgr.getAppDownload(this.appDetails.packageid, this), this.getMyRatingFromServer();
},
updateDownloadState: function(a) {
this.appDownload.isInstalled() && (this.doMyReviewResized(), this.renderReviewFromModel(this.myReviewDetails));
},
renderReviewFromModel: function(a) {
a && a.reviewed == 1 ? this.showMyReview(a.myRatingData) : this.appDownload && this.appDownload.isInstalled() && (this.fullName != "" || this.firstInitial != "") ? this.showAddReview() : this.disallowAddReview(), this.doRenderSuccess();
},
showAddReview: function() {
this.$.myReview.hide(), this.$.addReview.show(), this.$.submitCancelReview.hide(), this.$.addReviewComment.hide(), this.$.addReviewCommentInput.setValue(""), this.renderRatingStars(0), this.doMyReviewResized();
},
disallowAddReview: function() {
this.$.myReview.hide(), this.$.addReview.hide();
},
showMyReview: function(a) {
this.$.addReview.hide(), this.$.submitCancelReview.hide(), this.$.myReview.show(), this.$.myReviewItemComment.setContent(a.comment), a.isAnonymous || this.$.author.setContent("By: " + a.creator);
var b = "images/stars/stars-medium-" + a.score + ".png";
this.$.myReviewItemStar.setSrc(b), this.$.myReviewItemDate.setContent(this.formatDate(a.creationtime)), this.$.updateAReviewButton.show(), this.doMyReviewResized();
},
displayReviewComment: function() {
this.$.addReview.showing || this.$.addReview.show();
if (!this.$.submitCancelReview.showing) {
this.$.submitCancelReview.show(), this.$.addReviewComment.show(), this.$.addReviewCommentInput.show(), this.$.nameSelector.show(), this.$.addReviewTextField.show();
if (this.myReviewDetails && this.myReviewDetails.myRatingData) {
this.myReviewDetails.myRatingData.comment && this.$.addReviewCommentInput.setValue(this.myReviewDetails.myRatingData.comment);
if (this.myReviewDetails.myRatingData.isAnonymous) this.$.nameSelector.setValue(1); else {
var a = this.myReviewDetails.myRatingData.creator;
a && a == this.firstInitial ? this.$.nameSelector.setValue("firstinitial") : this.$.nameSelector.setValue("fullname");
}
this.myReviewDetails.myRatingData.score && this.renderRatingStars(this.myReviewDetails.myRatingData.score);
}
}
this.doMyReviewResized();
},
onClickUpdateMyReview: function() {
this.$.myReview.hide(), this.displayReviewComment();
},
onClickAddReviewStarImg1: function() {
this.renderRatingStars(1), this.displayReviewComment();
},
onClickAddReviewStarImg2: function() {
this.renderRatingStars(2), this.displayReviewComment();
},
onClickAddReviewStarImg3: function() {
this.renderRatingStars(3), this.displayReviewComment();
},
onClickAddReviewStarImg4: function() {
this.renderRatingStars(4), this.displayReviewComment();
},
onClickAddReviewStarImg5: function() {
this.renderRatingStars(5), this.displayReviewComment();
},
onClickSubmitAReview: function() {
var a = this.$.addReviewCommentInput.value;
if (!this.score || this.score < 1) this.showAlertPopup($L("App Rating"), $L("Rate the Application by tapping the stars.")); else {
a = enyo.string.trim(a);
var b = new Date, c = this.formatDate(b), d = !1, e = "";
this.$.nameSelector.value == 1 ? d = !0 : this.$.nameSelector.getValue() == "firstinitial" ? e = this.firstInitial : this.$.nameSelector.getValue() == "fullname" && (e = this.fullName), this.myRatingData = {
comment: a,
isAnonymous: d,
creationtime: c,
score: this.score,
creator: d == 1 ? "" : e,
id: this.myReviewDetails.myRatingData && this.myReviewDetails.myRatingData.id ? this.myReviewDetails.myRatingData.id : ""
}, this.$.submitAReviewButton.disabled = !0, this.$.submitAReviewButton.addClass("enyo-button-disabled"), this.addUserRating(this.myRatingData);
}
},
onClickCancelReview: function() {
this.myReviewDetails = this.oldMyReviewDetails, this.myReviewDetails && this.myReviewDetails.myRatingData ? this.showMyReview(this.myReviewDetails.myRatingData) : this.showAddReview();
},
renderRatingStars: function(a) {
this.score = a, a >= 1 ? this.$.addReviewStarImg1.setSrc("images/star-large-single-orange.png") : this.$.addReviewStarImg1.setSrc("images/star-large-single-gray.png"), a >= 2 ? this.$.addReviewStarImg2.setSrc("images/star-large-single-orange.png") : this.$.addReviewStarImg2.setSrc("images/star-large-single-gray.png"), a >= 3 ? this.$.addReviewStarImg3.setSrc("images/star-large-single-orange.png") : this.$.addReviewStarImg3.setSrc("images/star-large-single-gray.png"), a >= 4 ? this.$.addReviewStarImg4.setSrc("images/star-large-single-orange.png") : this.$.addReviewStarImg4.setSrc("images/star-large-single-gray.png"), a >= 5 ? this.$.addReviewStarImg5.setSrc("images/star-large-single-orange.png") : this.$.addReviewStarImg5.setSrc("images/star-large-single-gray.png");
},
formatDate: function(a) {
var b = new Date(a);
return b.getMonth() + 1 + "/" + b.getDate() + "/" + b.getFullYear();
},
displayError: function(a) {
findApps.ViewLibrary._container.isTopView(this.owner.owner) && this.$.error.displayError(a);
},
submitError: function() {
this.$.error.cancel();
},
cancelError: function() {
this.$.error.cancel();
},
getMyRatingFromServer: function() {
findApps.BaseServer.getACServer().getMyRating(this.appDetails.appid, this.appDetails.packageid, "getMyRatingService", {
onSuccess: "handleServerResponse",
onFailure: "handleServerError",
scope: this
});
},
addUserRating: function(a) {
a.id && a.id != "" ? findApps.BaseServer.getACServer().updateUserReview(this.appDetails.appid, this.appDetails.packageid, this.appDetails.version, enyo.g11n.currentLocale().toISOString(), a.id, a.comment, a.score, a.creator, "updateUserRatingService", {
onSuccess: "handleServerResponse",
onFailure: "handleServerError",
scope: this
}) : findApps.BaseServer.getACServer().addUserReview(this.appDetails.appid, this.appDetails.packageid, this.appDetails.version, enyo.g11n.currentLocale().toISOString(), a.comment, a.score, a.creator, "addUserRatingService", {
onSuccess: "handleServerResponse",
onFailure: "handleServerError",
scope: this
});
},
setNameOptions: function() {
var a = findApps.UserSession.getAccountInfo();
a != null ? (this.fullName = a.firstName + " " + a.lastName, this.firstInitial = a.firstName + " " + a.lastName.substring(0, 1)) : (this.fullName = "", this.firstInitial = ""), this.fullName.trim() == this.firstInitial.trim() ? this.$.nameSelector.setItems([ {
caption: this.firstInitial,
value: "firstinitial"
} ]) : this.$.nameSelector.setItems([ {
caption: this.firstInitial,
value: "firstinitial"
}, {
caption: this.fullName,
value: "fullname"
} ]), this.$.nameSelector.setValue("firstinitial"), this.$.nameSelector.render();
},
accountInfoSuccess: function(a, b) {
findApps.UserSession.getAccountInfo() == null && findApps.UserSession.setAccountInfo(b), this.setNameOptions();
},
accountInfoFailure: function(a, b) {
this.error("Review : Could not fetch first name / last name. getAccountInfo failure. ", b), this.setNameOptions();
},
handleServerResponse: function(a, b, c, d) {
this.$.submitAReviewButton.disabled = !1, this.$.submitAReviewButton.removeClass("enyo-button-disabled");
switch (d.service) {
case "getMyRatingService":
b.UserRating ? this.myReviewDetails = {
reviewed: !0,
myRatingData: b.UserRating,
appid: this.appDetails.appid,
packageid: this.appDetails.packageid
} : this.myReviewDetails = {
reviewed: !1,
appid: this.appDetails.appid,
packageid: this.appDetails.packageid
}, this.oldMyReviewDetails = this.myReviewDetails, this.renderReviewFromModel(this.myReviewDetails);
break;
case "addUserRatingService":
this.myReviewDetails.reviewed = !0, this.myReviewDetails.myRatingData = this.myRatingData, this.myReviewDetails.myRatingData.id = b.response.id, this.oldMyReviewDetails = this.myReviewDetails, this.showMyReview(this.myReviewDetails.myRatingData);
break;
case "updateUserRatingService":
this.myReviewDetails.reviewed = !0, this.myReviewDetails.myRatingData = this.myRatingData, this.oldMyReviewDetails = this.myReviewDetails, this.showMyReview(this.myReviewDetails.myRatingData);
}
},
handleServerError: function(a, b, c, d, e) {
switch (d.service) {
case "getMyRatingService":
b === "" ? (this.myReviewDetails = {
reviewed: !1,
appid: this.appDetails.appid,
packageid: this.appDetails.packageid
}, this.oldMyReviewDetails = this.myReviewDetails, this.renderReviewFromModel(this.myReviewDetails)) : b.JSONException ? (this.myReviewDetails = {
reviewed: !1,
appid: this.appDetails.appid,
packageid: this.appDetails.packageid
}, this.oldMyReviewDetails = this.myReviewDetails, this.renderReviewFromModel(this.myReviewDetails)) : this.disallowAddReview();
break;
case "addUserRatingService":
case "updateUserRatingService":
this.$.submitAReviewButton.disabled = !1, this.$.submitAReviewButton.removeClass("enyo-button-disabled"), e.push("LOC07101"), this.displayError(e);
}
},
showAlertPopup: function(a, b) {
findApps.ViewLibrary._container.isTopView(this.owner.owner) && (this.$.alertPrompt.openAtCenter(), this.$.alertTitle.setContent(a), this.$.alertMessage.setContent(b));
},
dismissAlertPopup: function() {
this.$.alertPrompt.close();
}
});

// source/details/ShareApp.js

enyo.kind({
name: "findApps.ShareApp",
kind: "enyo.Control",
components: [ {
kind: "findApps.CommonHandler",
name: "utilityHandler"
}, {
kind: "Button",
className: "enyo-button-light",
caption: $L("Share"),
onclick: "shareApp",
name: "shareButton"
}, {
name: "sharePopup",
kind: "Menu",
lazy: !1,
components: [ {
caption: $L("Email"),
onclick: "shareByEmail"
}, {
caption: $L("Text Message"),
onclick: "shareBySMS"
} ]
} ],
published: {
appDetail: null
},
appDetailChanged: function(a) {},
shareApp: function(a) {
var b = this.$.shareButton.hasNode();
this.$.sharePopup.openAroundControl(this), this.$.sharePopup.addStyles("width:" + b.offsetWidth + "px");
},
shareByEmail: function(a) {
this.closePopup(a), this.$.utilityHandler.handleCommand("email", this.appDetail);
},
shareBySMS: function(a) {
this.closePopup(a), this.$.utilityHandler.handleCommand("text", this.appDetail);
},
closePopup: function(a) {
this.$.sharePopup.close();
}
});

// source/details/ReportProblem.js

enyo.kind({
name: "findApps.Details.ReportProblem",
kind: enyo.Control,
published: {
appDetails: null
},
components: [ {
kind: "findApps.Error",
onSubmit: "submitError",
onCancel: "cancelError"
}, {
kind: "Popup",
name: "alertPrompt",
components: [ {
name: "alertTitle",
className: "enyo-item enyo-first",
content: "",
style: "padding: 12px"
}, {
name: "alertMessage",
className: "enyo-item enyo-last",
content: "",
style: "padding: 12px; font-size: 14px"
}, {
kind: "Button",
className: "enyo-button-light",
value: "ok",
caption: "OK",
onclick: "dismissAlertPopup"
} ]
}, {
name: "reportAProblemPopup",
kind: "ModalDialog",
caption: $L("Report a Problem"),
components: [ {
kind: "HFlexBox",
flex: 1,
className: "palm-paragraph",
components: [ {
name: "reportHeaderImage",
kind: enyo.Image,
src: "",
className: "report-header-image"
}, {
components: [ {
name: "reportHeaderTitle",
kind: enyo.Control,
className: "enyo-text-subheader enyo-text-ellipsis"
}, {
name: "reportHeaderCreater",
kind: enyo.Control,
className: "enyo-text-ellipsis enyo-text-body"
} ]
} ]
}, {
kind: "Button",
className: "report-list-button",
components: [ {
kind: "CustomListSelector",
name: "problemTypeListSelector",
value: "1",
items: [ {
caption: $L("Bug"),
value: "1"
}, {
caption: $L("Offensive Content"),
value: "2"
}, {
caption: $L("Download"),
value: "3"
}, {
caption: $L("Installation"),
value: "4"
}, {
caption: $L("Payment"),
value: "5"
}, {
caption: $L("Legal Issue"),
value: "6"
}, {
caption: $L("Other"),
value: "7"
} ]
} ]
}, {
kind: enyo.Control,
content: "<p>" + $L("Report a problem with this application to Palm.") + "</p>",
className: "enyo-paragraph"
}, {
kind: "RichText",
name: "descriptionInput",
richContent: !1,
alwaysLooksFocused: !0,
style: "min-height:90px;",
hint: $L("Tap here to begin typing")
}, {
layoutKind: "HFlexLayout",
defaultKind: "Button",
className: "report-button-box",
components: [ {
kind: "Button",
caption: $L("Cancel"),
flex: 1,
onclick: "closePopup"
}, {
kind: "Button",
name: "sendReportButton",
flex: 1,
caption: $L("Send"),
onclick: "submitProblem"
} ]
} ]
}, {
kind: "Button",
className: "enyo-button-light",
caption: $L("Report a Problem"),
onclick: "openPopup",
name: "reportProblemButton"
} ],
create: function() {
this.inherited(arguments), this.appMetrics = enyo.application.appMetrics;
var a = findApps.AccountServices.getInstance().getAccountInfo({
onSuccess: "accountInfoSuccess",
onFailure: "accountInfoFailure",
scope: this
});
a && this.accountInfoSuccess(null, a);
},
appDetailsChanged: function() {
this.$.reportAProblemPopup.validateComponents(), this.appDetails && (this.$.reportHeaderImage.setSrc(this.appDetails.appIcon), this.$.reportHeaderTitle.setContent(this.appDetails.title), this.$.reportHeaderCreater.setContent(this.appDetails.creator)), this.$.descriptionInput.setValue(""), this.$.problemTypeListSelector.setValue(0);
},
getDescription: function() {
return this.$.descriptionInput.getValue();
},
getProblemType: function() {
return this.$.problemTypeListSelector.getValue();
},
submitProblem: function(a) {
this.problemDesc = this.$.descriptionInput.getValue(), this.problemType = this.$.problemTypeListSelector.getValue(), this.$.sendReportButton.disabled = !0, this.$.sendReportButton.addClass("enyo-button-disabled"), findApps.BaseServer.getACServer().reportProblem(this.appDetails.id, this.appDetails.publicApplicationId, this.problemDesc, 0, enyo.g11n.currentLocale().toISOString(), this.name, !1, !0, this.problemType, "ReportProblemService", {
onSuccess: "handleServerResponse",
onFailure: "handleServerError",
scope: this
});
},
closePopup: function() {
this.appMetrics && this.appMetrics.trackNewScene("report_a_problem_closed/" + this.appDetails.publicApplicationId), this.$.reportAProblemPopup.close();
},
openPopup: function() {
this.appMetrics && this.appMetrics.trackNewScene("report_a_problem/" + this.appDetails.publicApplicationId), this.$.reportAProblemPopup.openAtCenter();
},
accountInfoSuccess: function(a, b) {
findApps.UserSession.getAccountInfo() == null && findApps.UserSession.setAccountInfo(b), this.name = b.firstName + " " + b.lastName;
},
accountInfoFailure: function(a, b) {
this.error("ReportProblem : Could not fetch first name / last name. getAccountInfo failure. ", b), this.name = "";
},
handleServerResponse: function(a, b, c, d) {
this.$.sendReportButton.disabled = !1, this.$.sendReportButton.removeClass("enyo-button-disabled"), this.closePopup(), this.appMetrics && this.appMetrics.trackNewScene("report_a_problem_submitted/" + this.appDetails.publicApplicationId);
},
handleServerError: function(a, b, c, d, e) {
this.$.sendReportButton.disabled = !1, this.$.sendReportButton.removeClass("enyo-button-disabled"), this.appMetrics && this.appMetrics.trackNewScene("report_a_problem_failed/" + this.appDetails.publicApplicationId), this.closePopup(), e.push("LOC07100"), this.displayError(e);
},
displayError: function(a) {
findApps.ViewLibrary._container.isTopView(this.owner.owner) && this.$.error.displayError(a);
},
submitError: function() {
this.$.error.cancel();
},
cancelError: function() {
this.$.error.cancel();
},
showAlertPopup: function(a, b) {
findApps.ViewLibrary._container.isTopView(this.owner.owner) && (this.$.alertPrompt.openAtCenter(), this.$.alertTitle.setContent(a), this.$.alertMessage.setContent(b));
},
dismissAlertPopup: function() {
this.$.alertPrompt.close();
},
disableMe: function(a) {
a ? (this.$.reportProblemButton.disabled = !0, this.$.reportProblemButton.addClass("enyo-button-disabled")) : (this.$.reportProblemButton.disabled = !1, this.$.reportProblemButton.removeClass("enyo-button-disabled"));
}
});

// source/details/thumbnailImage.js

enyo.kind({
name: "findApps.Details.ThumbnailImageView",
kind: enyo.Control,
published: {
params: {
images: [],
index: 0
}
},
images: [],
index: 0,
events: {
onCancel: ""
},
components: [ {
kind: "findApps.Error",
name: "error"
}, {
kind: "Carousel",
name: "screenshots",
flex: 1,
onclick: "doCancel",
onGetLeft: "getLeft",
onGetRight: "getRight",
onSnapFinish: "snapFinish"
} ],
create: function() {
this.inherited(arguments);
},
paramsChanged: function() {
this.images = this.params.images, this.index = this.params.index, this.$.screenshots.setCenterView(this.getView(this.index));
},
resizeHandler: function() {
this.$.screenshots.resize();
},
getImageUrl: function(a) {
var b = this.images[a];
if (b && b.carouselImgUrl) return b.carouselImgUrl;
},
getView: function(a) {
if (a >= 0 && a < this.images.length) {
var b = this.getImageUrl(a);
if (b) return {
kind: findApps.CarouselImage,
src: b,
autoSize: !1,
onImageLoaded: "imageLoaded",
onImageFailed: "imageFailed"
};
}
},
snapFinish: function() {
var a = this.$.screenshots.fetchCurrentView();
a && a._failed && (this.doCancel(), this.$.error.displayError([ "LOC07102" ]));
},
getLeft: function(a, b) {
return b && this.index--, this.getView(this.index - 1);
},
getRight: function(a, b) {
return b && this.index++, this.getView(this.index + 1);
},
imageLoaded: function(a) {
a.stopSpinner();
},
imageFailed: function(a) {
a.stopSpinner(), this.snapFinish();
}
}), enyo.kind({
name: "findApps.CarouselImage",
kind: enyo.ViewImage,
published: {
timeout: AppCatalog.Config.wsTimeout
},
events: {
onImageFailed: ""
},
components: [ {
kind: enyo.Control,
flex: 1,
layoutKind: "VFlexLayout",
align: "center",
pack: "center",
components: [ {
kind: "Spinner",
name: "spinner",
showing: !0
} ]
} ],
clearTimer: function() {
this._timer && (clearTimeout(this._timer), this._timer = undefined);
},
srcChanged: function() {
this.inherited(arguments), this._failed = !1, this.clearTimer();
var a = this;
this._timer = setTimeout(function() {
a.imageError();
}, this.timeout);
},
stopSpinner: function() {
this.$.spinner.stop(), this.$.spinner.hide();
},
imageLoaded: function() {
this._failed || (this.clearTimer(), this.inherited(arguments));
},
imageError: function() {
this._failed = !0, this.clearTimer(), this.doImageFailed();
}
});

// source/details/progresspill.js

enyo.kind({
name: "findApps.ProgressPill",
kind: enyo.CustomButton,
cssNamespace: "button",
allowDrag: !0,
published: {
params: null
},
events: {
onTap: "",
onCancel: ""
},
components: [ {
name: "progressPill",
kind: "ProgressButton",
className: "affirmative",
cancelable: !1,
value: 0,
layoutKind: "HFlexLayout",
position: "",
onclick: "doTap",
onmousehold: "mouseHold",
components: [ {
name: "title",
content: "",
style: "width:100%;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
}, {
name: "rightIcon",
kind: "Image",
className: "acc-progress-icon",
src: "images/menu/icon-download-top.png",
onclick: "doCancel"
} ]
} ],
mouseHold: function(a, b) {
b.stopPropagation();
},
paramsChanged: function() {
var a = this.$.progressPill, b = this.$.rightIcon, c = this.params;
if (a) {
this.$.title.setContent(c.title), c.icon ? (b.show(), b.setSrc(c.icon)) : b.hide();
if (c.state) switch (c.state) {
case "initiating_download":
case "pausing":
case "resuming":
case "removing":
case "canceling":
case "downloading":
case "paused":
case "purchasing":
case "purchase_pending":
case "installing":
this.addClass("progress-showing");
break;
case "initial":
case "download":
case "download_failed":
case "purchase_failed":
case "purchased":
case "installed":
case "update_available":
case "install_failed":
this.removeClass("progress-showing");
}
if (c.value || c.value === 0) {
var d = c.value * 100;
a.setPosition(d);
} else a.setPosition(0);
}
}
});

// source/details/downloadbutton.js

enyo.kind({
name: "findApps.downloadButton",
kind: enyo.Control,
published: {
appId: null
},
events: {
onUpdateStates: ""
},
components: [ {
kind: "findApps.ProgressPill",
name: "headerDownloadButton",
onTap: "_handleDownloadBar",
onCancel: "_progressCancelled"
} ],
create: function() {
this.inherited(arguments);
},
destroy: function() {
this._appDownload && this._appDownload.detach(this), this.inherited(arguments);
},
appIdChanged: function() {
this._appDownload = enyo.application.appdownloadManager.getAppDownload(this.appId, this), this.$.headerDownloadButton.setParams(this._appDownload._progressPillModel), this.doUpdateStates(this._appDownload.enableSave);
},
updateDownloadState: function() {
this.$.headerDownloadButton.setParams(this._appDownload._progressPillModel), this.doUpdateStates(this._appDownload.enableSave);
},
_progressCancelled: function(a) {},
_handleDownloadBar: function(a) {
this._appDownload.defaultAction();
},
disableMe: function(a) {
a ? (this.$.headerDownloadButton.disabled = !0, this.$.headerDownloadButton.addClass("enyo-button-disabled")) : (this.$.headerDownloadButton.disabled = !1, this.$.headerDownloadButton.removeClass("enyo-button-disabled"));
}
});

// source/details/genericdownloadbutton.js

enyo.kind({
name: "findApps.genericDownloadButton",
kind: enyo.Control,
appdownloadmgr: null,
published: {
appItem: {
price: "n/a"
}
},
events: {
onUpdateStates: ""
},
components: [ {
kind: "findApps.ProgressPill",
name: "headerDownloadButton",
onTap: "_handleDownloadBar",
onCancel: "_progressCancelled"
} ],
create: function() {
this.inherited(arguments), this.appdownloadmgr = enyo.application.appdownloadManager, this.appdownloadmgr.attach(this), this.init();
},
formatPrice: function(a) {
if (a == "n/a" || a == "N/A") return a;
if (a === "Free" || a == 0 || a == "0" || findApps.BaseServer.isPurchased(this.appItem.appId)) return $L("FREE");
var b = parseFloat(a), c = findApps.UserSession.getActivationCountry();
return findApps.Utilities.Formatter.formatCurrency(b, c);
},
destroy: function() {
this.appdownloadmgr && this.appdownloadmgr.detach(this), this.inherited(arguments);
},
appItemChanged: function() {
this.init();
},
init: function() {
this.$.headerDownloadButton.setParams({
value: 0,
title: this.formatPrice(this.appItem.price)
});
if (!this.appdownloadmgr.myAppsListIsReady()) return;
this._appDownload = this.appdownloadmgr.belongToMyApp(this.appItem.appId), this._appDownload ? (this.$.headerDownloadButton.setParams(this._appDownload._progressPillModel), this.doUpdateStates(this._appDownload.enableSave)) : this.doUpdateStates(!0);
},
updateMyApps: function(a, b) {
b == this.appdownloadmgr.MYAPPS_ALL ? this.init() : a.publicApplicationId == this.appItem.appId && (this._appDownload || (this._appDownload = a), this.$.headerDownloadButton.setParams(this._appDownload._progressPillModel), this.doUpdateStates(this._appDownload.enableSave));
},
_progressCancelled: function(a) {},
_handleDownloadBar: function(a, b) {
b.bubbles = !1;
if (!this._appDownload) {
this._appDownload = this.appdownloadmgr.getAppDownload(this.appItem.appId);
if (this._appDownload.price === undefined) {
var c = {
publicApplicationId: this.appItem.appId,
price: this.appItem.price
};
this._appDownload.updateFromAppList(c);
}
}
this._appDownload.defaultAction();
}
});

// source/details/downloadsavebutton.js

enyo.kind({
name: "findApps.downloadsavebutton",
kind: enyo.Control,
published: {
appItem: {
price: "n/a"
}
},
events: {
onUpdateStates: ""
},
components: [ {
kind: "HFlexBox",
style: "margin-left:24px;",
width: "172px",
align: "center",
name: "buttonContainer",
components: [ {
name: "app_save",
kind: "findApps.SaveButton",
onclick: "saveApp"
} ]
} ],
create: function() {
this.inherited(arguments), this.type == "detail" ? this.$.buttonContainer.createComponent({
name: "downloadbutton",
kind: "findApps.downloadButton",
flex: 1,
appId: this.appItem.appId,
onUpdateStates: "updateStates",
owner: this
}) : (this.$.buttonContainer.createComponent({
name: "downloadbutton",
kind: "findApps.genericDownloadButton",
flex: 1,
appItem: {
appId: this.appItem.appId,
price: this.appItem.price
},
onUpdateStates: "updateStates",
owner: this
}), (this.appItem.price == "n/a" || this.appItem.price == "N/A") && this.$.app_save.hide()), enyo.application.savedList.attach(this), this.$.app_save.setButton({
publicApplicationId: this.appItem.appId
});
},
appItemChanged: function() {
this.$.app_save.setButton({
publicApplicationId: this.appItem.appId
}), this.type == "detail" ? this.$.downloadbutton.setAppId(this.appItem.appId) : this.$.downloadbutton.setAppItem(this.appItem);
},
saveListChanged: function(a) {
a == this.appItem.appId && this.$.app_save.setButton({
publicApplicationId: a
});
},
destroy: function() {
enyo.application.savedList && enyo.application.savedList.detach(this), this.inherited(arguments);
},
updateFromServer: function(a) {
this.$.downloadbutton._appDownload.updateFromServer(a);
},
updateStates: function(a, b) {
b ? this.$.app_save.show() : this.$.app_save.hide();
},
saveApp: function(a, b) {
this.$.app_save.processAction({
publicApplicationId: this.appItem.appId
});
},
disableMe: function(a) {
this.type == "detail" && this.$.downloadbutton != undefined && this.$.downloadbutton.disableMe(a);
}
});

// source/utilities/CommonHandler.js

enyo.kind({
name: "findApps.CommonHandler",
kind: enyo.Component,
handleCommand: function(a, b) {
var c = this._generateAppURL(b);
if (c) switch (a) {
case "email":
var d = {
summary: $L("Check out this HP webOS app"),
text: this._generateEmailMessageText(b, c)
};
findApps.ApplicationManager.getInstance().launchApplication("com.palm.app.email", d, "emailLaunchSuccess", "emailLaunchFailure", this);
break;
case "text":
var d = {
compose: {
messageText: this._generateSMSMessageText(b, c)
}
};
findApps.ApplicationManager.getInstance().launchApplication("com.palm.app.messaging", d, "smsLaunchSuccess", "smsLaunchFailure", this);
}
},
smsLaunchSuccess: function() {},
smsLaunchFailure: function() {},
emailLaunchSuccess: function() {},
emailLaunchFailure: function() {},
_generateAppURL: function(a) {
return a && a.publicApplicationId && a.id ? "http://developer.palm.com/appredirect/?packageid=" + a.publicApplicationId + "&applicationid=" + a.id : null;
},
_generateEmailMessageText: function(a, b) {
var c = {
appURL: b
};
a && a.title ? c.title = a.title : c.title = b;
var d = new enyo.g11n.Template($L("Here's an app I think you'll like:  <a href='#{appURL}'> #{title}</a>")), e = d.evaluate({
appURL: b,
title: a.title
});
return e;
},
_generateSMSMessageText: function(a, b) {
var c = b;
a && a.title && (c = a.title);
var d = new enyo.g11n.Template($L("Check out #{title}: #{url}")), e = d.evaluate({
title: c,
url: b
});
return e;
},
_embargolistSuccess: function(a, b, c, d) {
var e = d.edit, f = d.callback;
b && b.OutGetEmbargoedEmailExtensions && (findApps.AccountServices.embargoedList = b.OutGetEmbargoedEmailExtensions.embargoedEmailExtensions, findApps.UserProfile.isEmbargoed = findApps.AccountServices.embargoedList.indexOf(ext) != -1, this._handleEmbargoAcc(e, f));
},
_embargolistFailure: function(a, b, c, d, e) {
this.OnSubmit = function() {
this.$.error.cancel(), this.$.error.destroy();
}, this.createComponent({
name: "error",
kind: "findApps.Error",
onSubmit: "OnSubmit",
onCancel: "OnSubmit",
owner: this
}), e.push("LOC02055"), this.$.error.displayError(e);
},
doEmbargoCheck: function(a, b) {
if (findApps.UserProfile.isEmbargoed !== undefined) this._handleEmbargoAcc(a, b); else {
var c = findApps.UserProfile.email.substring(findApps.UserProfile.email.lastIndexOf(".") + 1);
findApps.AccountServices.embargoedList ? (findApps.UserProfile.isEmbargoed = findApps.AccountServices.embargoedList.indexOf(c) != -1, this._handleEmbargoAcc(a, b)) : findApps.BaseServer.getPMTServer().getEmbargoedEmailExtensions("CommonEmbargoedEmailExtensiosn", {
onSuccess: "_embargolistSuccess",
onFailure: "_embargolistFailure",
scope: this,
edit: a,
callback: b
});
}
},
_handleEmbargoAcc: function(a, b) {
var c = this;
!a && findApps.UserProfile.isEmbargoed ? (c.OnSubmit = function() {
c.$.error.cancel(), c.$.error.destroy(), findApps.ApplicationManager.getInstance().openApplication("com.palm.app.help", {
target: online ? "http://help.palm.com/app_catalog/appcatalog_download_error.html" : "no-network"
});
}, c.OnCancel = function() {
c.$.error.cancel(), c.$.error.destroy();
}, c.createComponent({
name: "error",
kind: "findApps.Error",
owner: c
}), c.$.error.displayError([ "LOC02065" ])) : b(a);
},
capWords: function(a) {
var b = a.split(" ");
for (var c = 0; c < b.length; c++) b[c] = b[c].capitalize();
return b.join(" ");
},
filterSpace: function(a) {
return a === Mojo.Char.spaceBar ? !1 : !0;
},
isEmpty: function(a) {
for (var b in a) return !1;
return !0;
},
formatDateStr: function(a) {
if (!a || a.length < 8) return "";
var b = a.substr(0, 4), c = a.substr(4, 2), d = a.substr(6, 2), e = a.substr(8, 2), f = a.substr(10, 2), g = a.substr(12, 2), h = new Date(b, c - 1, d, e, f, g), i = h.getTime(), j = new Date;
localOffset = j.getTimezoneOffset() * 6e4;
var k = new Date(i - localOffset);
return enyo.date.format(k, "MMM d, yyyy");
}
}), enyo.kind({
name: "findApps.SmartInput",
kind: enyo.Input,
events: {
onSubmit: "",
onkeyup: "keyupHandler"
},
keyupHandler: function(a, b) {
b.keyCode == "13" && this.handleEnter();
},
handleEnter: function() {
this.doSubmit(), this.forceBlur();
}
});

// source/utilities/common.js

findApps.Utilities = {
oneSecond: 1e3,
oneMinute: 6e4,
oneHour: 36e5,
oneDay: 864e5,
formatStar: function(a, b) {
return a -= 2 * b, a > 0 ? a > 1 ? "full" : "half" : "empty";
},
contains: function(a, b) {
for (var c = 0; c < a.length; c++) if (a[c] == b) return !0;
return !1;
},
array2Map: function(a, b) {
var c = [];
if (a && a.length) for (var d = 0; d < a.length; d++) {
var e = a[d];
c[e[b]] = e;
}
return c;
},
findFirstMatch: function(a, b) {
var c, d = b.length;
for (var e = 0; e < d && !c; e++) c = a[b[e]];
return c;
},
getUUID: function() {
return (new Date).getTime() + Math.floor(Math.random() * 16777216);
},
getUUID2: function() {
var a = [], b = "0123456789ABCDEF";
for (var c = 0; c < 32; c++) a[c] = b.substr(Math.floor(Math.random() * 16), 1);
a[12] = "4", a[16] = b.substr(a[16] & 3 | 8, 1);
var d = a.join("");
return d;
},
getUUID3: function() {
return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(a) {
var b = Math.random() * 16 | 0, c = a == "x" ? b : b & 3 | 8;
return c.toString(16);
});
},
getHashCode: function(a) {
var b = 0;
if (a.length == 0) return b;
for (var c = 0; c < a.length; c++) {
var d = a.charCodeAt(c);
b = (b << 5) - b + d, b &= b;
}
return b;
},
getRandNumber: function() {
return this.getUUID();
},
delFunc: function(a, b, c) {
typeof a[b + c] == "function" && delete a[b + c];
},
Formatter: {
formatCurrency: function(a, b) {
if (b) {
b = b.toLowerCase();
if (typeof findApps.Utilities.Formatter._currencyFmt == "undefined" || b !== findApps.Utilities.Formatter.purchasingLocale) findApps.Utilities.Formatter._currencyFmt = new enyo.g11n.NumberFmt({
locale: b,
fractionDigits: 2,
style: "currency"
}), findApps.Utilities.Formatter.purchasingLocale = b;
return findApps.Utilities.Formatter._currencyFmt.format(a, {
style: "currency"
});
}
return a;
},
formatLongDate: function(a) {
return typeof findApps.Utilities.Formatter._longDateFmt == "undefined" && (findApps.Utilities.Formatter._longDateFmt = new enyo.g11n.DateFmt({
date: "long"
})), findApps.Utilities.Formatter._longDateFmt.format(a);
},
formatShortDate: function(a) {
return typeof findApps.Utilities.Formatter._shortDateFmt == "undefined" && (findApps.Utilities.Formatter._shortDateFmt = new enyo.g11n.DateFmt({
date: "short"
})), findApps.Utilities.Formatter._shortDateFmt.format(a);
},
formatRound: function(a) {
return typeof findApps.Utilities.Formatter._roundFmt == "undefined" && (findApps.Utilities.Formatter._roundFmt = new enyo.g11n.NumberFmt({
fractionDigits: 1
})), findApps.Utilities.Formatter._roundFmt.format(a);
},
formatRound2: function(a) {
return typeof findApps.Utilities.Formatter._roundFmt == "undefined" && (findApps.Utilities.Formatter._roundFmt = new enyo.g11n.NumberFmt({
fractionDigits: 2
})), findApps.Utilities.Formatter._roundFmt.format(a);
},
formatPercent: function(a) {
typeof findApps.Utilities.Formatter._percentFmt == "undefined" && (findApps.Utilities.Formatter._percentFmt = new enyo.g11n.NumberFmt({
style: "percent"
}));
if (!a || a == undefined) a = 0;
return findApps.Utilities.Formatter._percentFmt.format(a, {
style: "percent"
});
},
serverTimeFormat: function(a) {
return typeof findApps.Utilities.Formatter._serverFmt == "undefined" && (findApps.Utilities.Formatter._serverFmt = new enyo.g11n.DateFmt("yyyyMMddHHmmss")), findApps.Utilities.Formatter._serverFmt.format(a);
},
getFullYear: function(a) {
return typeof findApps.Utilities.Formatter._dateFullYear == "undefined" && (findApps.Utilities.Formatter._dateFullYear = new enyo.g11n.DateFmt("yyyy")), findApps.Utilities.Formatter._dateFullYear.format(a);
},
getLongMonth: function(a) {
return typeof findApps.Utilities.Formatter._dateMonth == "undefined" && (findApps.Utilities.Formatter._dateMonth = new enyo.g11n.DateFmt("MMM")), findApps.Utilities.Formatter._dateMonth.format(a);
},
formatPhoneNumber: function(a) {
return typeof findApps.Utilities.Formatter._phoneFmt == "undefined" && (findApps.Utilities.Formatter._phoneFmt = new enyo.g11n.PhoneFmt), findApps.Utilities.Formatter._phoneFmt.format(a);
},
getShortMonth: function(a, b) {
return typeof findApps.Utilities.Formatter._dateShortMonth == "undefined" && (findApps.Utilities.Formatter._dateShortMonth = new enyo.g11n.DateFmt("MM")), findApps.Utilities.Formatter._dateShortMonth.format(a);
}
}
}, findApps.Utilities.CommonHandler = findApps.Utilities.CommonHandler || new findApps.CommonHandler;

// source/utilities/StorageUtil.js

enyo.kind({
name: "findApps.StorageUtil",
kind: enyo.Object,
keyPrefix: "findApps.StorageUtil.",
constructor: function(a) {
this.inherited(arguments), this.keyPrefix = a;
},
set: function(a, b) {
typeof b == "object" && (b = JSON.stringify(b)), localStorage.setItem(this.keyPrefix + a, b);
},
get: function(a) {
var b = localStorage.getItem(this.keyPrefix + a);
return b && b.charAt(0) === "{" ? JSON.parse(b) : b;
},
remove: function(a) {
localStorage.removeItem(this.keyPrefix + a);
},
clear: function() {
for (var a in localStorage) findApps.StorageUtil.startsWith(a, this.keyPrefix) && localStorage.removeItem(a);
}
}), findApps.StorageUtil.startsWith = function(a, b) {
return enyo.isString(a) && enyo.isString(b) && a.substr(0, b.length) === b ? !0 : !1;
}, findApps.StorageUtil.getInstance = function(a) {
return a = a || "_singleton", findApps.StorageUtil._pool = findApps.StorageUtil._pool || [], findApps.StorageUtil._pool[a] = findApps.StorageUtil._pool[a] || new findApps.StorageUtil(a), findApps.StorageUtil._pool[a];
};

// source/utilities/CacheUtil.js

enyo.kind({
name: "findApps.CacheUtil",
kind: enyo.Object,
published: {
enabled: !1
}
}), enyo.kind({
name: "findApps.TransientCache",
kind: findApps.CacheUtil,
cache: [],
clear: function(a) {
if (!this.enabled) return;
a ? this.cache[a] = undefined : this.cache = [];
},
isExpired: function(a) {
if (!this.enabled) return;
var b = this.cache[a];
if (b) {
if ((new Date).getTime() < b.expires.getTime()) return !1;
this.clear(a);
}
return !0;
},
set: function(a, b, c) {
if (!this.enabled) return;
if (this.isExpired(a)) b && b.getTime && (this.cache[a] = {
expires: b,
value: c
}); else {
var d = this.cache[a];
d.expires = b ? b : d.expires, d.value = c ? c : d.value;
}
},
get: function(a) {
if (!this.enabled) return;
if (!this.isExpired(a)) return this.cache[a].value;
}
}), enyo.kind({
name: "findApps.PersistentCache",
kind: findApps.CacheUtil,
constructor: function(a) {
this.inherited(arguments), this.storageUtil = findApps.StorageUtil.getInstance(a);
},
clear: function(a) {
if (!this.enabled) return;
a ? this.storageUtil.remove(a) : this.storageUtil.clear();
},
isExpired: function(a) {
if (!this.enabled) return;
var b = this.storageUtil.get(a);
if (b && b.expires) {
b.expires = new Date(b.expires);
if ((new Date).getTime() < b.expires.getTime()) return !1;
this.clear(a);
}
return !0;
},
set: function(a, b, c) {
if (!this.enabled) return;
if (this.isExpired(a)) b && b.getTime && this.storageUtil.set(a, {
expires: b,
value: c
}); else {
var d = this.storageUtil.get(a);
d.expires = new Date(d.expires), d.expires = b ? b : d.expires, d.value = c ? c : d.value, this.storageUtil.set(a, d);
}
},
get: function(a) {
if (!this.enabled) return;
if (!this.isExpired(a)) return this.storageUtil.get(a).value;
}
}), findApps.CacheUtil.getInstance = function(a, b) {
return a = a || "_singleton", findApps.CacheUtil._pool = findApps.CacheUtil._pool || [], findApps.CacheUtil._pool[a] = findApps.CacheUtil._pool[a] || (b ? new findApps.PersistentCache(a) : new findApps.TransientCache), findApps.CacheUtil._pool[a];
}, findApps.CacheUtil.destroy = function() {
findApps.CacheUtil._pool = null;
};

// source/utilities/FatalError.js

enyo.kind({
name: "findApps.FatalError",
kind: "VFlexBox",
pack: "center",
align: "center",
width: "100%",
height: "100%",
className: "",
style: "text-align:center",
components: [ {
kind: "VFlexBox",
flex: 2,
style: "padding-left: 10px;",
components: [ {
kind: "Spacer"
}, {
name: "error_image",
kind: "Image",
src: "images/misc-connection-error-triangle.png",
height: "176px",
flex: 1
}, {
name: "fullscreen_error_message",
kind: "findApps.TapMessage",
allowHtml: !0,
height: "105px",
flex: 0
}, {
kind: "HFlexBox",
pack: "center",
align: "center",
components: [ {
kind: "Button",
caption: $L("Retry"),
onclick: "retryHandler",
flex: 0,
width: "244px"
} ]
}, {
kind: "Spacer"
} ]
} ],
published: {
params: {}
},
create: function(a) {
this.inherited(arguments);
},
paramsChanged: function() {
this.params.online ? this.$.error_image.setSrc("images/misc-connection-error-triangle.png") : this.$.error_image.setSrc("images/misc-connection-error.png"), this.$.fullscreen_error_message.setContent(this.params.errorMessage), this.$.fullscreen_error_message.setHiddenMsg(this.params.hiddenErrorCodes);
},
retryHandler: function() {
findApps.ViewLibrary.goBack();
},
getAppMenuOptions: function() {
return {
softwareManager: {
disabled: !1,
show: !0
},
helpMenu: {
disabled: !1,
show: !0
}
};
}
});

// source/utilities/errormessages.js

findApps.Utilities.ErrorChoices = {
tryCCChoices: [ {
label: $L("Use Credit Card"),
value: "cc",
type: "default"
}, {
label: $L("Cancel"),
value: !0,
type: "dismiss"
} ],
tryOBChoices: [ {
label: $L("Use Carrier Account"),
value: "ob",
type: "default"
}, {
label: $L("Cancel"),
value: !0,
type: "dismiss"
} ],
simpleOKChoices: [ {
label: $L("OK"),
value: !0,
type: "dismiss"
} ],
simpleRetryChoices: [ {
label: $L("Retry")
} ]
}, enyo.kind({
name: "findApps.CommonErrors",
kind: enyo.Component,
components: [],
_PMTGroupErrors: {
PMT_0: {
dialog: !0,
title: $L("Payment Type"),
message: $L("You can only pay with a credit card. Update your account information in Preferences & Accounts and try again. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT_1: {
dialog: !0,
title: $L("Payment Failed"),
message: $L("We cannot process your payment. Contact your financial institution. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT_2: {
dialog: !0,
title: $L("Payment Failed"),
message: $L("Update the payment information in your account and try again. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT_3: {
dialog: !0,
title: $L("Payment Failed"),
message: $L("CyberSource refused your payment. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT_4: {
dialog: !0,
title: $L("Payment Failed"),
message: $L("You are not permitted to purchase items in the App Catalog. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT_5: {
dialog: !0,
title: $L("Transaction Error"),
message: $L("The credit card you are using may be fraudulent. Enter a different credit card in Preferences & Accounts and try again. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT_6: {
dialog: !0,
title: $L("Can't Purchase"),
message: $L("The United States Government prohibits HP from allowing you to purchase applications."),
choices: [ {
label: $L("OK"),
value: "quit",
type: "primary"
}, {
label: $L("Help"),
value: "help",
type: "secondary"
} ]
},
PMT_7: {
dialog: !0,
title: $L("Invalid Address"),
message: $L("The address you entered cannot be found. Verify that the address you entered is correct, and is in the Billing Country you have chosen."),
choices: [ {
label: $L("OK"),
value: "ok",
type: "dismiss"
} ]
}
},
OBCarrierNotSupported: {
dialog: !0,
title: $L("Operator Billing is not supported for this carrier"),
message: $L("{$carrierName} does not support payments. Please pay with a credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
catchAllDialog: {
dialog: !0,
title: $L("Unexpected problem"),
message: $L("App Catalog could not complete the last action you performed. Please try again later."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
catchAllFullPage: {
page: !0,
title: $L("Unexpected problem"),
message: $L("The action could not be completed.<br/>Try again later."),
choices: findApps.Utilities.ErrorChoices.simpleRetryChoices
}
}), findApps.Utilities.CommonErrors = new findApps.CommonErrors, findApps.Utilities._dialogErrors = {
offline: {
page: !0,
message: $L("You must connect to a network to use this application.")
},
invalidtoken: {
page: !0,
message: $L("We could not find a valid webOS Account.<br/>You need a valid account to use App Catalog.")
},
failure: {
page: !0
},
badformat: {
page: !0
},
timeout: {
page: !0
},
jsonexception: {
page: !0
},
downformaintenance: {
page: !0
},
appunavailable: {
page: !0,
message: $L("No applications found.")
},
dplfailed: {
page: !0,
message: $L("You can't set up an account. The United States Government prohibits HP from allowing you to purchase applications.")
},
noPaymentTypeSupported: {
page: !0,
message: $L("There are no payment types available for this profile")
},
PMT01002: {
page: !0
},
APPCAT0065: {
page: !0,
message: $L("Your first wifi-only device has not yet setup Application Catalog country, please do so before proceeding.")
},
DISC0025: {
incompatible_page: !0,
message: $L("This is not a valid HP webOS application.")
},
DISC0056: {
incompatible_page: !0,
message: $L("This is not a valid HP webOS application.")
},
DISC0124: {
incompatible_page: !0,
message: $L("This application is not available for your model.")
},
DISC0125: {
incompatible_page: !0,
message: $L("This application is not available for your carrier.")
},
DISC0201: {
incompatible_page: !0,
message: $L("This application is not available in your country.")
},
DISC0202: {
incompatible_page: !0,
message: $L("This application is not available for your model.")
},
DISC0203: {
incompatible_page: !0,
message: $L("This application cannot run on your current operating system. Use the Updates app to install the system update and try again.")
},
catchAllDialog: findApps.Utilities.CommonErrors.catchAllDialog,
noNetwork: {
page: !0,
title: $L("No Internet Connection"),
message: $L("You must connect to a network to use this application."),
choices: findApps.Utilities.ErrorChoices.simpleRetryChoices
},
RESP0001: {
dialog: !0,
title: $L("Server Exception"),
message: $L("XHR Status Code is not 200"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
RESP0002: {
dialog: !0,
title: $L("Server Exception"),
message: $L("Exception thrown by the server"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
RESP0003: {
dialog: !0,
title: $L("Server Exception"),
message: $L("Empty Response. Connection timed out"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
RESP0004: {
dialog: !0,
title: $L("Server Exception"),
message: $L("Empty Response. Connection did not time out"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
RESP0005: {
dialog: !0,
title: $L("Server Exception"),
message: $L("Response Status code was not OK"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
RESP0006: {
dialog: !0,
title: $L("Server Exception"),
message: $L("General server exception thrown"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
RESP0007: {
dialog: !0,
title: $L("Server Exception"),
message: $L("Response xhr status code was non-200"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
RESP0008: {
dialog: !0,
title: $L("Server Exception"),
message: $L("General server exception thrown"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
RESP0009: {
reuseDefinition: "RESP0002"
},
RESP0010: {
reuseDefinition: "RESP0001"
},
RESP0011: {
reuseDefinition: "RESP0003"
},
RESP0012: {
reuseDefinition: "RESP0004"
},
RESP0013: {
reuseDefinition: "RESP0005"
},
PMT_catchAll: {
dialog: !0,
title: $L("Unexpected problem"),
message: $L("App Catalog could not complete the last action you performed. Try again later. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT_addCC_default: {
dialog: !0,
title: $L("Couldn't Add Credit Card"),
message: $L("A problem occurred when adding your credit card information. Try again later. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT_modifyCC_default: {
dialog: !0,
title: $L("Couldn't Update"),
message: $L("The credit card information could not be updated. Try again later. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT_removeCC_default: {
dialog: !0,
title: $L("Couldn't Remove"),
message: $L("The credit card was not removed from your account. Try again later. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT_purchase_default: {
dialog: !0,
title: $L("Couldn't Purchase"),
message: $L("The item could not be purchased. Try again later. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.tryCCChoices
},
PMT_cant_download: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_6,
PMT_cant_download_encrypted: {
dialog: !0,
title: $L("Can't Download"),
message: $L("The United States Government prohibits HP from allowing you to download this application."),
choices: [ {
label: $L("Help"),
value: "help",
type: "primary"
}, {
label: $L("OK"),
value: !0,
type: "dismiss"
} ]
},
PMT_cant_purchase: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_6,
PMT02000: {
dialog: !0,
title: $L("Error"),
message: $L("You cannot purchase items via your Carrier Account. Please use a credit card instead."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02002: {
dialog: !0,
title: $L("Data Entry"),
message: $L("This card type is not supported"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02003: {
dialog: !0,
title: $L("Data Entry"),
message: $L("This order type is not supported"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02005: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The State code is incorrect. Try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02006: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The Country code is incorrect. Try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02008: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The Currency code is incorrect. Try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02010: {
dialog: !0,
title: $L("Data Entry"),
message: $L("You must enter valid information in every field."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02011: {
dialog: !0,
title: $L("Data Entry"),
message: $L("You must enter a number in the Credit Card field."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02012: {
dialog: !0,
title: $L("Data Entry"),
message: $L("You must enter a number in the Payment Info ID field."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02013: {
dialog: !0,
title: $L("Data Entry"),
message: $L("You must enter a number in the Quantity field."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02014: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The date in the Expiration Date field must be in the format mmyyyy"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02015: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The value in the Item Unit Price field is not valid. Enter a number instead."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02016: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The date in the Order Date field must be in the format yyyyMMddHHmmss"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02017: {
dialog: !0,
title: $L("Data Entry"),
message: $L("Update the Expiration Date information in your account and try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02018: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The Zip code is incorrect. Try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT03000: {
dialog: !0,
title: $L("Transaction Error"),
message: $L("Update your credit card information in Preferences & Accounts and try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT03001: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_0,
PMT03002: {
dialog: !0,
title: $L("Payment Failed"),
message: $L("We cannot perform financial transactions in your country."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT03003: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_0,
PMT03006: {
dialog: !0,
title: $L("Payment Failed"),
message: $L("The last transaction failed. Update the payment information in your account and try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT03007: {
dialog: !0,
title: $L("Couldn't Update"),
message: $L("Credit card information can only be updated after all pending purchases have cleared. Try again after you received receipts for all recent purchases."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04000: {
dialog: !0,
title: $L("Payment Failed"),
message: $L("Update the Expiration Date information in your account and try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04001: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04002: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04004: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04005: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_2,
PMT04006: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04007: {
dialog: !0,
title: $L("Payment Failed"),
message: $L("Update the security number and try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04008: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04009: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04010: {
dialog: !0,
title: $L("Data Entry"),
message: $L("Update the payment information in your account and try again. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04011: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04012: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04013: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_3,
PMT04014: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_3,
PMT04015: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_4,
PMT04016: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_2,
PMT04017: {
dialog: !0,
title: $L("Payment Failed"),
message: $L("There is no payment information associated with your HP webOS Account. Tap Preferences in the App Menu to set it up."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04018: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_5,
PMT04019: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_5,
PMT04020: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_5,
PMT04021: {
dialog: !0,
title: $L("Transaction Error"),
message: $L("A transaction problem has occurred. Update your credit card information in Preferences & Accounts and try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04200: {
dialog: !0,
title: $L("Payment Failed"),
message: $L("Update your credit card address information and try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04400: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_3,
PMT04401: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_3,
PMT04402: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_4,
PMT04403: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_2,
PMT04404: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04405: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_2,
PMT04406: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04407: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04408: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04409: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04410: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_2,
PMT04411: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04412: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04413: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_2,
PMT04414: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT04415: {
dialog: !0,
title: $L("Transaction Error"),
message: $L("There is a problem with the credit card. Enter a different credit card in Preferences & Accounts and try again. PMT04415"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04416: {
dialog: !0,
title: $L("Transaction Error"),
message: $L("There may be a problem with the credit card. Enter a different credit card in Preferences & Accounts and try again. PMT04416"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04417: {
dialog: !0,
title: $L("Transaction Error"),
message: $L("There is a problem with the credit card. Enter a different credit card in Preferences & Accounts and try again. PMT04417"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04600: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_7,
PMT04601: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_7,
PMT04602: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_7,
PMT04603: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_7,
PMT04604: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_7,
PMT04605: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_7,
PMT04606: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_7,
PMT04607: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_7,
PMT04608: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_7,
PMT04609: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_7,
PMT04610: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_7,
PMT04611: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_7,
PMT04612: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_7,
PMTPROMO70010: {
dialog: !0,
title: $L("Promo Code"),
message: $L("Invalid, unavailable or expired promo code, try to use previous saved code or manually input valid code."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04800: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_6,
PMT03027: {
dialog: !0,
title: $L("Updating or removing account is not allowed because there are still pending orders using this account"),
message: $L("Your account cannot be updated at this time. Please try again later."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices,
failoverNotAllowed: !0
},
PMT03028: findApps.Utilities.CommonErrors.OBCarrierNotSupported,
PMT03031: {
dialog: !0,
title: $L("Order not accepted because there is a pending order for the same item"),
message: $L("This item is already in the process of being purchased. Please wait for the transaction to complete."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices,
failoverNotAllowed: !0
},
PMT03037: {
dialog: !0,
title: $L("Item already purchased"),
message: $L("This item has already been purchased. Your account won't be charged again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices,
failoverNotAllowed: !0
},
PMT04022: {
dialog: !0,
title: $L("Invalid Information"),
message: $L("Your credit card Security Code is incorrect. Please enter it, as it appears on your credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04023: {
dialog: !0,
title: $L("Invalid Information"),
message: $L("Your First Name is incorrect. Please enter it, as it appears on your credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04024: {
dialog: !0,
title: $L("Invalid Information"),
message: $L("Your Last Name is incorrect. Please enter it, as it appears on your credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04025: {
dialog: !0,
title: $L("Invalid Information"),
message: $L("Please enter a valid phone number."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT04026: {
dialog: !0,
title: $L("Invalid Information"),
message: $L("The City listed in your Billing Address is invalid. Please check it and try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT05205: {
dialog: !0,
title: $L("Transaction failed"),
message: $L("This item's price exceeds your spending limit. Please pay with a credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT05206: {
dialog: !0,
title: $L("Transaction failed"),
message: $L("Your {$carrierName} account's settings do not allow you to purchase items with your {$carrierName} account. Please pay with a credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT05208: {
dialog: !0,
title: $L("Transaction failed"),
message: $L("You do not have an active account with {$carrierName}. Try paying with a credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT05210: {
dialog: !0,
title: $L("Wireless subscriber has run out of prepaid credits"),
message: $L("This item's price exceeds your carrier account balance. Please pay with a credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT05213: {
dialog: !0,
title: $L("Carrier not supported"),
message: $L("{$carrierName} does not support payments. Please pay with a credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT05215: findApps.Utilities.CommonErrors.OBCarrierNotSupported,
PMT05216: {
dialog: !0,
title: $L("Transaction failed"),
message: $L("You do not have an active account with {$carrierName}. Try paying with a credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT05217: findApps.Utilities.CommonErrors.OBCarrierNotSupported,
PMT05204: {
dialog: !0,
title: $L("Transaction failed"),
message: $L("You do not have an active account with {$carrierName}. Try paying with a credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT05211: {
dialog: !0,
title: $L("Wireless subscriber not eligible for premium billing"),
message: $L("{$carrierName} does not allow you to purchase items using with your {$carrierName} account. Please pay with a credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT05212: {
dialog: !0,
title: $L("Transaction failed"),
message: $L("You do not have an active account with {$carrierName}. Try paying with a credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
inprogress: {
dialog: !0,
title: $L("Transaction in Progress"),
message: $L("The transaction is still being processed. Try to download the app in a few minutes. You will not be charged again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices,
failoverNotAllowed: !0
},
nowan: {
dialog: !0,
title: $L("No Carrier Data Connection"),
message: $L("You must be connected to {$carrierName} to pay with your carrier account. Connect and try again. Or, pay with credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT02019: {
dialog: !0,
title: $L("Card validation"),
message: $L("Please verify that the credit card number and payment type are set correctly."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
PMT51004: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
PMT51005: findApps.Utilities.CommonErrors._PMTGroupErrors.PMT_1,
LOCL0001: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The address is incomplete. Verify that you\u2019ve entered your complete address."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOCL0002: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The payment information is incomplete. Verify that you\u2019ve entered your payment information completely."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOCL0003: {
dialog: !0,
title: $L("Data Entry"),
message: $L("Please only enter numbers (0-9) in the account number."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOCL0004: {
dialog: !0,
title: $L("Data Entry"),
message: $L("Choose a card type."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOCL0005: {
dialog: !0,
title: $L("Data Entry"),
message: $L("You must enter a phone number in the Phone Number field."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOCL0006: {
dialog: !0,
title: $L("Data Entry"),
message: $L("Verify your billing information. It is incomplete."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOCL0007: {
dialog: !0,
title: $L("Data Entry"),
message: $L("Verify your account information. It is incomplete or incorrect."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOCL0008: {
dialog: !0,
title: $L("Data Entry"),
message: $L("Please enter your full name, as it appears on your credit card."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOCL0009: {
dialog: !0,
title: $L("Data Entry"),
message: $L("You must enter data in the correct format in these fields: {$fields}."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOCL0010: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The Postcode is incorrect. Try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOC02018: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The Zip code is incorrect. Try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOC02019: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The Postal code is incorrect. Try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOC02020: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The first name is too long (must be less than 60 characters). Try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOC02021: {
dialog: !0,
title: $L("Data Entry"),
message: $L("The last name is too long (must be less than 60 characters). Try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOC02022: {
reuseDefinition: "PMT_catchAll"
},
LOC02023: {
reuseDefinition: "dplfailed"
},
LOC02024: {
reuseDefinition: "PMT_catchAll"
},
LOC02025: {
reuseDefinition: "PMT_catchAll"
},
LOC02026: {
reuseDefinition: "PMT_catchAll"
},
LOC02027: {
reuseDefinition: "PMT_catchAll"
},
LOC02028: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC02029: {
reuseDefinition: "PMT_addCC_default"
},
LOC02030: {
reuseDefinition: "PMT_modifyCC_default"
},
LOC02031: {
reuseDefinition: "PMT_removeCC_default"
},
LOC02032: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC02033: {
reuseDefinition: "PMT_catchAll"
},
LOC02034: {
reuseDefinition: "PMT_catchAll"
},
LOC02035: {
reuseDefinition: "PMT_catchAll"
},
LOC02036: {
reuseDefinition: "PMT_catchAll"
},
LOC02037: {
reuseDefinition: "PMT_catchAll"
},
LOC02038: {
reuseDefinition: "PMT_catchAll"
},
LOC02039: {
reuseDefinition: "PMT_catchAll"
},
LOC02040: {
reuseDefinition: "PMT_catchAll"
},
LOC02041: {
reuseDefinition: "PMT_catchAll"
},
LOC02042: {
reuseDefinition: "PMT_catchAll"
},
LOC02043: {
reuseDefinition: "PMT_catchAll"
},
LOC02044: {
reuseDefinition: "PMT_catchAll"
},
LOC02045: {
reuseDefinition: "PMT_catchAll"
},
LOC02046: {
reuseDefinition: "PMT_catchAll"
},
LOC02047: {
reuseDefinition: "PMT_catchAll"
},
LOC02048: {
reuseDefinition: "PMT_catchAll"
},
LOC02049: {
reuseDefinition: "PMT_catchAll"
},
LOC02050: {
reuseDefinition: "PMT_catchAll"
},
LOC02051: {
reuseDefinition: "PMT_catchAll"
},
LOC02052: {
reuseDefinition: "PMT_catchAll"
},
LOC02053: {
reuseDefinition: "dplfailed"
},
LOC02054: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC02055: {
reuseDefinition: "PMT_catchAll"
},
LOC02056: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC02057: {
reuseDefinition: "PMT_addCC_default"
},
LOC02058: {
reuseDefinition: "PMT_modifyCC_default"
},
LOC02059: {
reuseDefinition: "PMT_removeCC_default"
},
LOC02060: {
reuseDefinition: "PMT_catchAll"
},
LOC02061: {
reuseDefinition: "PMT_catchAll"
},
LOC02062: {
reuseDefinition: "noPaymentTypeSupported"
},
LOC02063: {
reuseDefinition: "noPaymentTypeSupported"
},
LOC02064: {
reuseDefinition: "failure"
},
LOC02065: {
reuseDefinition: "PMT_cant_download"
},
LOC02066: {
reuseDefinition: "PMT_catchAll"
},
LOC02067: {
reuseDefinition: "PMT_catchAll"
},
LOC02068: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC02069: {
reuseDefinition: "PMT_catchAll"
},
LOC02070: {
reuseDefinition: "PMT_catchAll"
},
LOC02071: {
reuseDefinition: "PMT_catchAll"
},
LOC01000: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC01001: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC01002: {
page: !0,
message: $L("Unknown Error")
},
LOC01003: {
reuseDefinition: "LOC01002"
},
LOC03001: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC03002: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC03003: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC03004: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC03005: {
reuseDefinition: "invalidtoken"
},
LOC03006: {
dialog: !0,
title: $L("Error"),
message: $L("Fail to get country list from server."),
choices: [ {
label: $L("Try Again"),
value: "tryGetCountryList"
} ]
},
LOC03007: findApps.Utilities.CommonErrors.catchAllDialog,
LOC03008: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC03009: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC03010: findApps.Utilities.CommonErrors.catchAllDialog,
LOC04001: findApps.Utilities.CommonErrors.catchAllDialog,
LOC04002: findApps.Utilities.CommonErrors.catchAllDialog,
LOC04003: findApps.Utilities.CommonErrors.catchAllDialog,
LOC04004: findApps.Utilities.CommonErrors.catchAllDialog,
LOC04005: {
reuseDefinition: "PMT_catchAll"
},
LOC04006: {
reuseDefinition: "PMT_catchAll"
},
LOC04007: findApps.Utilities.CommonErrors.catchAllDialog,
LOC04008: {
reuseDefinition: "PMT_cant_download_encrypted"
},
LOC04009: {
reuseDefinition: "install_revert_default"
},
LOC04010: {
reuseDefinition: "install_default"
},
LOC04011: findApps.Utilities.CommonErrors.catchAllDialog,
LOC04012: {
dialog: !0,
title: $L("Couldn't Purchase"),
message: $L("The item could not be purchased. Try again later. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.tryCCChoices
},
LOC04013: {
dialog: !0,
title: $L("Couldn't Purchase"),
message: $L("The item could not be purchased. Try again later. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.tryOBChoices
},
LOC04014: {
dialog: !0,
title: $L("Couldn't Purchase"),
message: $L("The item could not be purchased. Try again later. {$errCode}"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOC04015: {
reuseDefinition: "download_default"
},
LOC04016: {
reuseDefinition: "inprogress"
},
LOC04017: {
reuseDefinition: "inprogress"
},
LOC04018: {
reuseDefinition: "inprogress"
},
LOC04019: {
reuseDefinition: "inprogress"
},
LOC04020: {
reuseDefinition: "inprogress"
},
LOC06001: findApps.Utilities.CommonErrors.catchAllDialog,
LOC06002: findApps.Utilities.CommonErrors.catchAllDialog,
LOC06003: findApps.Utilities.CommonErrors.catchAllDialog,
LOC06004: findApps.Utilities.CommonErrors.catchAllDialog,
LOC06005: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC06006: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC06007: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC06008: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC06009: {
reuseDefinition: "LOC06004"
},
LOC07001: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC07002: {
page: !0,
title: $L("Error"),
message: $L("Could not fetch reviews for the Application."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOC07003: {
dialog: !0,
title: $L("Error"),
message: $L("Could not fetch reviews for the Application."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOC07004: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC07005: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC07006: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC07007: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC07100: {
dialog: !0,
title: $L("Error"),
message: $L("Could not submit your report at this time. Try again later."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOC07101: {
reuseDefinition: "LOC07100"
},
LOC07102: {
dialog: !0,
title: $L("Image is missing"),
message: $L("The full-size image cannot be displayed because it cannot be found."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOC07200: findApps.Utilities.CommonErrors.catchAllDialog,
LOC08000: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC08001: findApps.Utilities.CommonErrors.catchAllFullPage,
LOC08002: {
dialog: !0,
title: $L("Error"),
message: $L("Search was unsuccessful"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
LOC09000: {
page: !0,
title: $L("Error"),
message: $L("Error in saved apps"),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
validate_space_default_single: {
dialog: !0,
title: $L("Cannot Install"),
message: $L("This app requires {$installSize}. You must delete some apps or files before you can install it. Click Help for more information."),
choices: [ {
label: $L("Help"),
value: "help",
type: "primary"
}, {
label: $L("OK"),
value: "ok",
type: "dismiss"
} ]
},
validate_space_default_mult: {
dialog: !0,
title: $L("Cannot Install"),
message: $L("{$installSize} is required to install everything. You can install apps one at a time, or delete apps or files to make room. Click Help for more information."),
choices: [ {
label: $L("Help"),
value: "help",
type: "primary"
}, {
label: $L("OK"),
value: "ok",
type: "dismiss"
} ]
},
install_revert_failed: {
dialog: !0,
title: $L("Can't Restore"),
message: $L("The original version couldn't be installed because there is not enough space. Delete some apps or files and try again."),
choices: findApps.Utilities.ErrorChoices.simpleOKChoices
},
install_revert_default: {
dialog: !0,
title: $L("Couldn'ttInstall"),
message: $L("The {$title} update can not be installed and current version is unusable. Please restore the original version."),
choices: [ {
label: $L("Restore Now"),
value: "revert",
type: "primary"
} ]
},
install_default: {
dialog: !0,
title: $L("Couldn't Install"),
message: $L("There was a problem installing the application"),
choices: [ {
label: $L("Try Again"),
value: "retry",
type: "primary"
}, {
label: $L("Don't Install"),
value: "cancel",
type: "dismiss"
} ]
},
FAILED_NOT_ENOUGH_TEMP_SPACE: {
dialog: !0,
title: $L("Couldn't Install"),
message: $L("This app requires {$installSize}. You must delete some apps or files before you can install it. Click Help for more information."),
choices: [ {
label: $L("Help"),
value: "help",
type: "primary"
}, {
label: $L("OK"),
value: "cancel",
type: "dismiss"
} ]
},
FAILED_NOT_ENOUGH_INSTALL_SPACE: {
dialog: !0,
title: $L("Couldn't Install"),
message: $L("This app requires {$installSize}. You must delete some apps or files before you can install it. Click Help for more information."),
choices: [ {
label: $L("Help"),
value: "help",
type: "primary"
}, {
label: $L("OK"),
value: "cancel",
type: "dismiss"
} ]
},
download_default: {
dialog: !0,
title: $L("Download Error"),
message: $L("There was a problem downloading the application."),
choices: [ {
label: $L("Cancel"),
value: "cancel",
type: "dismiss"
}, {
label: $L("Try Again"),
value: "retry",
type: "primary"
} ]
},
"-3": {
dialog: !0,
title: $L("Download Error"),
message: $L("The download file is missing or damaged."),
choices: [ {
label: $L("Try Again"),
value: "retry",
type: "primary"
}, {
label: $L("Cancel"),
value: "cancel",
type: "dismiss"
} ]
},
"-2": {
dialog: !0,
title: $L("Download Error"),
message: $L("The download file is missing or damaged."),
choices: [ {
label: $L("Try Again"),
value: "retry",
type: "primary"
}, {
label: $L("Cancel"),
value: "cancel",
type: "dismiss"
} ]
}
};

// source/utilities/errors.js

enyo.kind({
name: "findApps.TapMessage",
kind: "Control",
events: {
onclick: "clickHandler"
},
published: {
hiddenMsg: ""
},
hiddenMsgChanged: function() {
function a(a, b) {
var c = "", d = a.split(",");
if (d.length > b) for (var e = 0; e < d.length; e++) c !== "" && e !== 0 && (c += ","), e % b === 0 && e !== 0 && (c += "<br/>"), c += d[e]; else c = a;
return c;
}
var b = 3;
this.hiddenMsg = "<small>" + a(this.hiddenMsg, b) + "</small>";
},
clickHandler: function(a) {
if (this.hiddenMsg) {
var b = this.getContent();
this.setContent(this.hiddenMsg), this.hiddenMsg = b;
}
}
}), enyo.kind({
name: "findApps.Error",
kind: "Control",
events: {
onSubmit: "",
onCancel: ""
},
submitHandler: null,
cancelHandler: null,
published: {
session: null
},
components: [ {
kind: "ModalDialog",
animateShowing: !1,
name: "popup",
scrim: !0,
modal: !0,
components: [ {
name: "popup_error_title",
className: "",
pack: "center",
style: "font-size:20px;text-align:center;",
allowHtml: !0
}, {
name: "popup_error_message",
kind: "findApps.TapMessage",
className: "",
style: "font-size:16px;padding-top: 6px;",
allowHtml: !0
}, {
kind: "HFlexBox",
name: "popup_choices",
style: "padding-top: 6px;"
} ]
} ],
submitPopup: function(a) {
this.$.popup.close(), this.doSubmit(a.value);
},
cancelPopup: function(a) {
this.$.popup.close(), this.doCancel(a.value);
},
cancel: function() {
this.$.popup.close();
},
showPalmProfileError: function() {
this.displayError("invalidtoken");
},
displayError: function(a, b) {
var c = this, d = c.$, e = function(a, b) {
function e() {
var a = c.getComponents();
for (var b in a) a[b].name.search(/button/) >= 0 && a[b].destroy();
}
e(), d.popup.lazy === !0 && d.popup.validateComponents();
if (!enyo.application.connectionManager.isOnline()) {
var f = findApps.Utilities._dialogErrors.noNetwork;
d.popup_error_title.setContent(f.title), d.popup_error_message.setContent(f.message);
} else d.popup_error_title.setContent(a.title), d.popup_error_message.setContent(a.formattedMessage ? a.formattedMessage : a.message);
d.popup_error_message.setHiddenMsg(b);
if (!a.choices || a.choices.length === 0) d.popup_choices.createComponent({
kind: "Button",
flex: 1,
caption: $L("OK"),
onclick: "cancelPopup",
owner: c
}); else for (var g in a.choices) {
var h = a.choices[g].type === "dismiss" ? "cancelPopup" : "submitPopup";
d.popup_choices.createComponent({
kind: "Button",
flex: 1,
value: a.choices[g].value,
caption: a.choices[g].label,
onclick: h,
owner: c
});
}
d.popup.render(), d.popup.openAtCenter();
}, f = function(a, b) {
var c = function() {
a.message || (a.message = $L("The action could not be completed.<br/>Try again later."));
var c = a.formattedMessage ? a.formattedMessage : a.message, d = enyo.application.connectionManager.isOnline();
if (!d) {
var e = findApps.Utilities._dialogErrors.noNetwork;
c = e.message;
}
var f = findApps.ViewLibrary.getView("FULLSCREENERROR");
f.setParams({
errorMessage: c,
hiddenErrorCodes: b,
online: d
});
};
i === "invalidtoken" ? findApps.AccountServices.getInstance().notifyAuthenticationFailure({
onSuccess: "showPalmProfileError",
onFailure: "showPalmProfileError",
scope: this
}) : c();
}, g = function() {
try {
var a = findApps.ViewLibrary._container.$.pane && findApps.ViewLibrary._container.$.pane.view;
throw c.error("In", a, "errorcode: ", i, "stack:", n), b;
} catch (b) {
var d = b.stack || b.stacktrace || "";
d && (d = d.replace(/file:\/.*enyo-findapps/g, "").replace(/file:\/.*enyo-build\.js/g, "enyo-build.js").replace(/\n/g, "").replace(/ +/g, " ")), c.error(findApps.UserSession._callerVersion, "stacktrace", d);
}
}, h = function(b) {
var d = b && b.message || "", e = -1;
a.indexOf("RESP0002") > 0 ? e = a.indexOf("RESP0002") : a.indexOf("RESP0008") > 0 ? e = a.indexOf("RESP0008") : a.indexOf("RESP0009") > 0 && (e = a.indexOf("RESP0009"));
var f = e - 1;
if (f >= 0) {
var g = a[f];
if (g) {
c.log("Attempting to use serverExceptionExceptionCode", g);
var h = findApps.Utilities._dialogErrors[g];
if (h) {
h.reuseDefinition && (h = findApps.Utilities._dialogErrors[h.reuseDefinition]);
var i = h.message;
}
}
}
return i && i !== "" && (d = i), d;
}, i = "";
a && enyo.isArray(a) && a.length > 0 ? i = a[a.length - 1] : a ? (a = [ a ], a.push("LOC01000"), (a + "").indexOf("PMT") >= 0 && a.push("PMT_catchAll")) : (i = "failure", a = [], a.push("LOC01001"), a.push(i));
var j = findApps.Utilities._dialogErrors[i];
if (!findApps.Utilities._dialogErrors[i] && enyo.isArray(a) && a.length > 0) {
for (var k = a.length - 1; k > -1; k--) {
var l = findApps.Utilities._dialogErrors[a[k]];
l && (k = -1, j = l);
}
a.push("LOC01003");
}
j && j.reuseDefinition && (j = findApps.Utilities._dialogErrors[j.reuseDefinition]), j || (a.push("LOC01002"), j = findApps.Utilities._dialogErrors.LOC01002), b = typeof b == "object" ? b : {};
if (!b.errCode || b.errCode === "") b.errCode = i;
var m = h(j);
j.message = m, j.formattedMessage = enyo.macroize(m, b);
var n = a && a + "" || a;
g(), j.page || j.incompatible_page ? f(j, n) : j.dialog && e(j, n);
}
});

// source/utilities/versioncheck.js

enyo.kind({
name: "findApps.VersionCheck",
kind: enyo.Control,
components: [],
compare: function(a, b) {
if (a == null && b == null) return 0;
if (a == null) return -1;
if (b == null) return 1;
var c = ("" + a).split(/[^a-zA-Z0-9]+/), d = ("" + b).split(/[^a-zA-Z0-9]+/), e = Math.min(c.length, d.length);
for (var f = 0; f <= e; f++) {
if (f == c.length) return f == d.length ? 0 : -1;
if (f == d.length) return 1;
var g = this._parseInt(c[f]), h = this._parseInt(d[f]);
if (g != h) {
var i = g - h;
return i < 0 ? -1 : i > 0 ? 1 : 0;
}
g = c[f].toLowerCase(), h = d[f].toLowerCase();
if (g < h) return -1;
if (g > h) return 1;
}
return 0;
},
_parseInt: function(a) {
return a.search(/[^\D]/) ? null : parseInt(a, 10);
}
}), findApps.Utilities.VersionCheck = findApps.Utilities.VersionCheck || new findApps.VersionCheck;

// source/utilities/utcdate.js

enyo.kind({
name: "findApps.UTCDate",
kind: enyo.Component,
components: [],
parse: function(a) {
var b = new Date;
return b.setUTCFullYear(a.substring(0, 4) - 0, a.substring(5, 7) - 1, a.substring(8, 10) - 0), b.setUTCHours(a.substring(11, 13)), b.setUTCMinutes(a.substring(14, 16)), b;
},
shortDate: function(a) {
return "" + a.getUTCFullYear() + (a.getUTCMonth() + 1).toPaddedString(2) + a.getUTCDate().toPaddedString(2) + a.getUTCHours().toPaddedString(2) + a.getUTCMinutes().toPaddedString(2) + a.getUTCSeconds().toPaddedString(2);
}
});

// source/utilities/SessionManager.js

enyo.kind({
name: "findApps.SessionManager",
kind: enyo.Object,
listeners: {
userSession: [],
paymentTypes: []
},
initSessionInProgress: !1,
initPaymentTypesInProgress: !1,
paymentTypesError: !1,
sessionError: !1,
constructor: function() {
this.initSessionInProgress = !1, this.sessionError = !1, this.initPaymentTypesInProgress = !1, this.paymentTypesError = !1, this.inherited(arguments);
},
initSession: function() {
this.initSessionInProgress === !1 && (this.initSessionInProgress = !0, findApps.BaseServer.getACServer().getSession("SessionService", {
onSuccess: "handleSessionResponse",
onFailure: "handleSessionFailure",
scope: this
}));
},
triggerInitSession: function(a) {
return this.initSessionInProgress === !0 ? (a && this.addListener(a, "userSession"), {
status: "inprogress"
}) : this.sessionError === !0 || findApps.UserSession._session == null ? (this.initSession(), a && this.addListener(a, "userSession"), {
status: "inprogress"
}) : {
status: "complete"
};
},
initPaymentTypes: function() {
this.initPaymentTypesInProgress = !0, findApps.BaseServer.getPMTServer().getPaymentTypes("paymentTypesService", {
onSuccess: "handlePaymentResp",
onFailure: "handlePaymentError",
scope: this
});
},
triggerInitPaymentTypes: function(a) {
return this.initPaymentTypesInProgress === !0 ? (a && this.addListener(a, "paymentTypes"), {
status: "inprogress"
}) : this.paymentTypesError === !0 || !findApps.UserProfile.validPayments ? (a && this.addListener(a, "paymentTypes"), this.initPaymentTypes(), {
status: "inprogress"
}) : {
status: "complete"
};
},
addListener: function(a, b) {
this.listeners[b] && this.listeners[b].push(a);
},
removeListener: function(a, b) {
if (this.listeners[b]) for (var c in this.listeners[b]) this.listeners[b][c] === a && this.listeners[b].splice(c, 1);
},
broadcastResponse: function(a, b, c) {
if (this.listeners[a]) {
var d = this.listeners[a].splice(0), e = d.length;
for (var f = 0; f < e; f++) d[f].receiveResponse && d[f].receiveResponse(a, b, c);
d = null;
}
},
handleSessionResponse: function(a, b, c, d) {
findApps.UserSession._sessionError = !1, findApps.UserSession._session = b.results.body.response;
if (findApps.UserSession._session && findApps.UserSession._session.accountInfo && findApps.UserSession._session.accountInfo.isUserAllowedUpdateCountry == "false") {
var e = findApps.UserSession._session.deviceProperties ? findApps.UserSession._session.deviceProperties.country : "";
findApps.UserSession.setActivationCountry(e);
}
findApps.UserSession._session.accountInfo && (findApps.UserSession._accountId = findApps.UserSession._session.accountInfo.accountId), findApps.BaseServer.buildCategoriesMap(), this.sessionError = !1, this.initSessionInProgress = !1, this.broadcastResponse("userSession", !0, []);
},
handleSessionFailure: function(a, b, c, d, e) {
this.sessionError = !0, this.initSessionInProgress = !1, this.broadcastResponse("userSession", !1, e);
},
handlePaymentResp: function(a, b, c, d) {
this.paymentTypesError = !1, this.initPaymentTypesInProgress = !1, findApps.UserProfile.validPaymentTypes = b.OutGetPaymentTypes.paymentTypes, findApps.UserProfile.obEnabled = !1;
var e = findApps.UserProfile.validPaymentTypes;
for (var f in e) e[f].code === "OB" && (findApps.UserProfile.obEnabled = !0);
this.broadcastResponse("paymentTypes", !0, []);
},
handlePaymentError: function(a, b, c, d, e) {
this.paymentTypesError = !0, this.initPaymentTypesInProgress = !1, e.push("LOC03001"), this.broadcastResponse("paymentTypes", !1, e);
}
});

// source/firstuse/AcceptTermsConditions.js

enyo.kind({
name: "findApps.AcceptTermsAndConditions",
kind: enyo.VFlexBox,
className: "terms",
published: {},
components: [ {
layoutKind: "HFlexLayout",
pack: "center",
components: [ {
name: "header",
className: "terms-header",
content: $L("webOS App Catalog End-User Terms And Conditions")
} ]
}, {
kind: "Scroller",
className: "box terms-box",
flex: 1,
components: [ {
kind: "findApps.TermsAndConditions"
} ]
}, {
kind: "Toolbar",
layoutKind: "HFlexLayout",
pack: "center",
className: "enyo-toolbar-light terms-footer",
components: [ {
kind: "Button",
caption: $L("Decline"),
className: "enyo-button-negative",
style: "width:130px;margin-right:6px",
onclick: "handleDecline"
}, {
kind: "Button",
caption: $L("Accept"),
className: "enyo-button-affirmative",
style: "width:130px;margin-left:6px",
onclick: "handleAccept"
} ]
} ],
constructor: function() {
this.inherited(arguments);
},
handleDecline: function(a, b) {
window.close();
},
handleAccept: function(a, b) {
findApps.UserSession.setTermsAccepted(), this.showNextView();
},
showNextView: function() {
var a = this.sceneParams.nextViewParams || {};
a.viewToLoad = this.sceneParams.nextView, findApps.ViewLibrary._container.showView(a);
},
setParams: function(a) {
this.sceneParams = a, a && a.modalMode && this.$.header.setClassName("terms-header-modal");
},
getAppMenuOptions: function() {
return {
softwareManager: {
disabled: !1,
show: !0
},
helpMenu: {
disabled: !1,
show: !0
}
};
}
});

// source/firstuse/CountryPicker.js

enyo.kind({
name: "findApps.CountryPicker",
kind: enyo.VFlexBox,
height: "100%",
width: "100%",
published: {},
className: "terms",
countries: [],
countryOffset: 0,
components: [ {
name: "scrim",
kind: "Scrim",
layoutKind: "VFlexLayout",
align: "center",
pack: "center",
components: [ {
kind: "SpinnerLarge",
name: "spinner",
showing: !1
} ]
}, {
kind: "findApps.Error",
name: "error",
onSubmit: "submitError",
onCancel: "cancelError"
}, {
layoutKind: "HFlexLayout",
pack: "center",
components: [ {
kind: "Spacer",
name: "spacerleft"
}, {
name: "header",
className: "terms-header",
content: $L("Choose your shopping country:")
}, {
kind: "Spacer",
name: "spacerright"
} ]
}, {
flex: 1,
name: "list",
kind: "VirtualList",
layoutKind: "VFlexLayout",
className: "enyo-scroller box country-box",
onSetupRow: "listSetupRow",
components: [ {
kind: "Item",
onclick: "itemClick",
components: [ {
name: "country",
className: "country-item"
} ]
} ]
}, {
layoutKind: "HFlexLayout",
components: [ {
kind: "Spacer"
}, {
name: "description",
style: "width:460px",
content: $L('Choose the country where you reside or where your billing address is located. If you choose "Other" you will only be able to download free apps. Once you choose a country, you cannot change it later.')
}, {
kind: "Spacer"
} ]
}, {
layoutKind: "HFlexLayout",
style: "padding-top:20px",
components: [ {
kind: "Spacer"
}, {
name: "continueButton",
kind: "Button",
style: "width:276px",
caption: $L("Continue"),
disabled: !0,
onclick: "openConfirmPopup"
}, {
kind: "Spacer"
} ]
}, {
layoutKind: "HFlexLayout",
components: [ {
kind: "Spacer"
}, {
name: "footer",
style: "width:460px",
content: $L("Once you\u2019ve chosen a Shopping Country, you cannot change it.")
}, {
kind: "Spacer"
} ]
}, {
kind: "ModalDialog",
name: "confirmPopup",
components: [ {
name: "confirmContent",
className: "enyo-paragraph",
style: "padding: 0 10px 6px 10px;",
allowHtml: !0,
content: $L("")
}, {
name: "confirm",
kind: "Button",
caption: $L("YES"),
onclick: "handleConfirm",
className: "enyo-button-affirmative"
}, {
name: "back",
kind: "Button",
caption: $L("Go Back"),
onclick: "closeConfirmPopup"
} ]
} ],
create: function() {
this.inherited(arguments);
var a = findApps.ViewLibrary._container;
a && a.registerObserver && a.registerObserver("resize", this), this.countryOffset = 0, this.refresh();
},
refresh: function() {
this.$.scrim.show(), this.$.spinner.setShowing(!0);
var a = enyo.application.sessionManager.triggerInitSession(this);
a && a.status === "complete" && this.processSessionResponse();
},
receiveResponse: function(a, b, c) {
a === "userSession" && (enyo.application.sessionManager.removeListener(this, "userSession"), b ? this.processSessionResponse() : (c.push("LOC03008"), this.$.scrim.hide(), this.$.spinner.setShowing(!1), this.$.error.displayError(c)));
},
processSessionResponse: function() {
findApps.UserSession._session && findApps.UserSession._session.accountInfo && findApps.UserSession._session.accountInfo.isUserAllowedUpdateCountry == "true" ? findApps.BaseServer.getACServer().getCountryList("getCountryList", {
onSuccess: "handleServerResponse",
onFailure: "handleServerFailure",
scope: this
}) : (this.storeACCountry(findApps.UserSession._session.deviceProperties.country), this.showNextView());
},
update: function() {
this.$.list.resized();
},
submitError: function(a, b) {
switch (b) {
case "tryGetCountryList":
this.tryGetCountryList();
}
},
tryGetCountryList: function() {
this.$.error.cancel(), findApps.BaseServer.getACServer().getCountryList("getCountryList", {
onSuccess: "handleServerResponse",
onFailure: "handleServerFailure",
scope: this
}), this.$.scrim.hide(), this.$.scrim.show(), this.$.spinner.setShowing(!0);
},
cancelError: function() {
this.$.error.cancel();
},
listSetupRow: function(a, b) {
if (this.countries) {
if (b >= this.countries.length - this.countryOffset) return !1;
var c = (parseInt(b) + parseInt(this.countryOffset)) % this.countries.length;
if (this.countries[c]) {
this.record = this.countries[c];
if (this.record && this.record.name) return this.$.item.addRemoveClass("enyo-item-selected", a.isSelected(c) ? !0 : !1), this.$.country.setContent(this.record.name), !0;
}
}
},
itemClick: function(a, b, c) {
var d = (parseInt(c) + parseInt(this.countryOffset)) % this.countries.length;
this.selectedItem = this.countries[d], this.$.list.select(d), this.$.continueButton.setDisabled(!1), this.update(), this.updateHeaderDescription(d);
},
handleAccept: function(a, b) {
this.selectedItem && this.selectedItem.code ? (this.storeACCountry(this.selectedItem.code), findApps.BaseServer.getACServer().setCountryCode(this.selectedItem.code, "setCountryCode", {
onSuccess: "handleServerResponse",
onFailure: "handleServerFailure",
scope: this
})) : findApps.ViewLibrary._container.handleAppCatLaunch();
},
handleCountryListResponse: function(a, b, c, d) {
this.$.scrim.hide(), this.$.spinner.setShowing(!1);
if (c && c.body && c.body.response && c.body.response.countries) {
this.countries = c.body.response.countries;
if (findApps.UserSession.getSession() && findApps.UserSession.getSession().deviceProperties && findApps.UserSession.getSession().deviceProperties.country) {
var e = findApps.UserSession.getSession().deviceProperties.country;
for (var f in this.countries) this.countries[f].name = $L(this.countries[f].name);
this.countries.sort(this.compareCountries);
for (var f in this.countries) this.countries[f].code == e && (this.selectedItem = this.countries[f], this.$.list.select(f), this.countryOffset = f, this.$.continueButton.setDisabled(!1), this.updateHeaderDescription(f));
}
this.$.list.resized();
}
},
storeACCountry: function(a) {
findApps.UserSession.setActivationCountry(a);
},
showNextView: function() {
if (!findApps.UserSession.isTermsAccepted()) this.sceneParams.viewToLoad = "TERMSCONDITIONS", findApps.ViewLibrary._container.showView(this.sceneParams); else {
var a = this.sceneParams.nextViewParams || {};
a.viewToLoad = this.sceneParams.nextView, findApps.ViewLibrary._container.showView(a);
}
this.$.scrim.hide(), this.$.spinner.setShowing(!1);
},
handleServerResponse: function(a, b, c, d) {
switch (d.service) {
case "getCountryList":
this.handleCountryListResponse(a, d, b, c);
break;
case "setCountryCode":
this.storeACCountry(this.selectedItem.code), this.showNextView();
}
},
handleServerFailure: function(a, b, c, d, e) {
switch (d.service) {
case "getCountryList":
e.push("LOC03006");
break;
case "setCountryCode":
e.push("LOC03007");
}
this.$.scrim.hide(), this.$.spinner.setShowing(!1), this.$.error.displayError(e);
},
setParams: function(a) {
this.sceneParams = a, a && a.modalMode && (this.$.spacerleft.hide(), this.$.spacerright.hide(), this.$.header.setClassName("terms-header-modal"));
},
compareCountries: function(a, b) {
return a.name.localeCompare(b.name);
},
updateHeaderDescription: function(a) {
var b = a;
this.selectedItem = this.countries[b];
if (this.selectedItem.useForPurchase) {
var c = [], d;
for (var e in this.selectedItem.billingCountries) {
var f = this.selectedItem.billingCountries[e], g = f.name;
c.push($L(g));
}
if (c.length == 0) {
var h = new enyo.g11n.Template($L("The #{selectedCountry} App Catalog has free and paid apps. "));
d = h.evaluate({
selectedCountry: $L(this.selectedItem.name)
});
} else {
var h = new enyo.g11n.Template($L("You must have a billing address in one of these places to purchase apps: #{countries}."));
d = h.evaluate({
countries: c.join($L(", "))
});
}
this.$.description.setContent(d);
} else {
var h = new enyo.g11n.Template($L("The #{selectedCountry} App Catalog has free apps only.")), i = h.evaluate({
selectedCountry: this.selectedItem.name
});
this.$.description.setContent(i);
}
},
getAppMenuOptions: function() {
return {
softwareManager: {
disabled: !1,
show: !0
},
helpMenu: {
disabled: !1,
show: !0
}
};
},
openConfirmPopup: function() {
this.$.confirmPopup.openAtCenter();
var a = new enyo.g11n.Template($L("You have selected #{selectedCountry} Country as your shopping country. Are you sure? This cannot be changed.")), b = a.evaluate({
selectedCountry: this.selectedItem.name
});
this.$.confirmContent.setContent(b);
},
closeConfirmPopup: function() {
this.$.confirmPopup.close();
},
handleConfirm: function() {
this.handleAccept(), this.closeConfirmPopup();
}
});

// source/firstuse/TermsConditions.js

enyo.kind({
name: "findApps.TermsAndConditions",
kind: enyo.VFlexBox,
published: {},
components: [ {
name: "end-user",
content: $L("webOS App Catalog End-User Terms And Conditions"),
className: "terms-text-subhead"
}, {
content: $L("THE FOLLOWING TERMS AND CONDITIONS (\u201cAGREEMENT\u201d) APPLY TO YOUR USE OF THE HP WEBOS APP CATALOG (\u201cAPP CATALOG\u201d), YOUR PURCHASE OF PRODUCTS (EACH, AN \u201cAPPLICATION\u201d) THROUGH THE APP CATALOG, AND YOUR USE OF SUCH APPLICATIONS. BEFORE USING, DOWNLOADING FROM OR OTHERWISE ACCESSING THE HP APP CATALOG OR ANY APPLICATION, CAREFULLY READ THIS AGREEMENT. THE APPLICATIONS PROVIDED THROUGH THE APP CATALOG ARE LICENSED BY THE PROVIDER OF THE APPLICATION (\u201cAPPLICATION PROVIDER\u201d) TO YOU, THE ORIGINAL END USER, SOLELY FOR YOUR PERSONAL USE AS SET FORTH BELOW AND SUBJECT TO THE APPLICABLE END-USER LICENSE AGREEMENT. IF YOU DO NOT AGREE TO THE TERMS AND CONDITIONS OF THIS AGREEMENT, DO NOT USE, DOWNLOAD OR OTHERWISE ACCESS THE APP CATALOG. USING, DOWNLOADING, OR OTHERWISE ACCESSING ANY PART OF THE APP CATALOG INDICATES THAT YOU ACCEPT THESE TERMS AND CONDITIONS.  YOU MUST BE AT LEAST 13 (THIRTEEN) YEARS OF AGE TO USE OR ACCESS THE APP CATALOG.  IF YOU ARE AT LEAST 13 BUT UNDER THE AGE OF 18, YOU MUST HAVE YOUR PARENT OR LEGAL GUARDIAN\u2019S PERMISSION TO USE OR ACCESS THE APP CATALOG.")
}, {
content: $L("PLEASE NOTE THAT IF YOU ARE A CONSUMER IN THE EUROPEAN ECONOMIC AREA OR SWITZERLAND, THIS LICENSE AGREEMENT DOES NOT AFFECT YOUR STATUTORY RIGHTS.  FOR FURTHER INFORMATION ABOUT YOUR STATUTORY RIGHTS CONTACT YOUR LOCAL AUTHORITY, TRADING STANDARDS DEPARTMENT OR CITIZENS ADVICE BUREAU (OR LOCAL EQUIVALENT)."),
className: "terms-text"
}, {
name: "license-agreement",
content: $L("Application License Agreement"),
className: "terms-text-subhead"
}, {
content: $L("Your use of each Application that you download through the App Catalog is governed by the terms of the Application License Agreement between you and the Application Provider (the \u201cApplication License Agreement\u201d) set forth below.  If the Application Provider provides an End-User License Agreement (\u201cEULA\u201d) with the Application, those terms shall supplement the Application License Agreement.  As between you and the Application Provider, any additional or different terms in such EULA shall take precedence over the terms in the Application License Agreement."),
className: "terms-text"
}, {
name: "palm-role",
content: $L("HP's Role In Providing Applications"),
className: "terms-text-subhead"
}, {
content: $L("You agree that the license you purchase to each Application is a binding agreement between you and the Application Provider only. The Application Provider is solely responsible for that Application, the content therein, any terms, conditions and warranties to the extent that such terms, conditions and warranties have not been disclaimed, and any claims relating to that Application. You acknowledge that HP and HP\u2019s subsidiaries are acting as agent for the Application Provider in providing each Application to you and is not a party to the license between you and the Application Provider. HP is not responsible for any Application, the content therein, or any terms, conditions, warranties or claims that you or any other party may have relating to that Application."),
className: "terms-text"
}, {
content: $L("You further acknowledge and agree that HP is a third party beneficiary of the Application License Agreement and, any EULA, if so provided. You acknowledge and agree that HP will have the right (and will be deemed to have accepted the right) to enforce such license against you as a third party beneficiary of those agreements."),
className: "terms-text"
}, {
name: "restrictions",
content: $L("Restrictions"),
className: "terms-text-subhead"
}, {
content: $L("You agree that HP and/or third parties own all right, title and interest in and to the App Catalog and all Applications (including all copyrights and trademarks relating thereto). Each Application is licensed for use only for a single HP webOS account, and you may not distribute or make the Application available over a network or for use with multiple devices. Except as otherwise provided below, you may not modify or alter the Application in any way, and may only use the Application as expressly set forth above and as set forth in the applicable EULA for the Application. You agree that you will not attempt to, or assist or encourage any other person or entity to circumvent, disable or modify any security technology or software that is part of the Application or is used on your HP device. Except as set forth above, HP and the Application Providers reserve all other rights in or to the Application. If applicable law permits you to copy or modify the Application, then you may copy and modify the Application solely to the extent, and for such purposes as, expressly permitted by applicable law. You agree that you will not engage in any activity that interferes with or disrupts the App Catalog or services available through Applications you have downloaded. You further agree that you will not use any Applications you download to interfere with or otherwise disrupt any servers, networks, websites or services."),
className: "terms-text"
}, {
name: "right-to-modify",
content: $L("HP Has The Right To Modify, Change or Terminate Your Use Of The App Catalog or Applications Found in the App Catalog"),
className: "terms-text-subhead"
}, {
content: $L("HP reserves the right, at its sole discretion and at any time, to add, remove, disable access to, block, or modify the App Catalog, and to add, remove, disable access to, block, or modify remotely any Applications previously downloaded to your device from the App Catalog. HP may be required to take these actions due to changes in the obligations or restrictions from its third party licensors or partners, an Application Provider\u2019s serious violation of its agreement with HP, or due to any governmental restriction or court order. HP may also impose limits on the use of or access to certain features or portions of the App Catalog or Applications downloaded from the App Catalog, in any case and without notice or liability. If HP removes, disables access to, or otherwise blocks you from accessing an Application, you will need to contact the Application Provider for further action."),
className: "terms-text"
}, {
name: "modify-terms",
content: $L("HP Has The Right To Modify These Terms"),
className: "terms-text-subhead"
}, {
content: $L("HP reserves the right to modify the terms of this Agreement at its sole discretion at any time. Any such modification will be effective upon HP notifying you prior to your continued use or access of the App Catalog. Your continued use of the App Catalog after such notice will constitute your binding acceptance of the Agreement as revised."),
className: "terms-text"
}, {
name: "fees",
content: $L("Fees And Payment"),
className: "terms-text-subhead"
}, {
content: $L("Applications are either available for download at no charge or, where available, require payment of a specified amount by the end-user (\u201cPaid-For Applications\u201d).  For Paid-For Applications, the App Catalog accepts credit cards and Mastercard or Visa branded debit cards (each, a \u201cCard\u201d).  You agree to pay for all Paid-For Applications you purchase."),
className: "terms-text"
}, {
content: $L("YOU ARE RESPONSIBLE FOR THE TIMELY PAYMENT OF ALL FEES AND FOR PROVIDING HP OR ITS DESIGNEE WITH A VALID CARD FOR PAYMENT OF ALL FEES."),
className: "terms-text"
}, {
content: $L("You will be required to provide accurate, current and complete Card information before you will be permitted to download Paid-For Applications. You authorize HP or its agents to charge or debit your Card the specified amount plus any applicable sales tax for each Paid-For Application you download. Once you enter a Card, such Card will be used for future transactions unless you designate a different Card. Debit cards and check cards have daily spending limits that may prevent the processing of your order. If the transaction is not accepted online, you will be unable to use that Card for your transaction and should use another Card."),
className: "terms-text"
}, {
content: $L("Alternatively, in some locations with some wireless carriers, you may elect to be billed by the wireless carrier providing telecommunications service for your device. If so enabled and you choose wireless carrier billing, the related terms and conditions of your wireless carrier will apply."),
className: "terms-text"
}, {
name: "prices",
content: $L("Prices"),
className: "terms-text-subhead"
}, {
content: $L("Your total price will include the price of the Application plus any applicable sales tax, value added tax or other applicable taxes. Prices in the European Union are inclusive of taxes. Sales tax in the United States will be based on the billing address and the sales tax rate in effect at the time your transaction is completed. For international customers, other transaction taxes may apply. Tax exemptions will not be processed for App Catalog purchases. HP reserves the right to change prices for Applications offered through the App Catalog at any time, and does not provide price protection or refunds in the event of a temporary or permanent price drop, rebate or other promotion."),
className: "terms-text"
}, {
name: "refunds",
content: $L("Refunds"),
className: "terms-text-subhead"
}, {
content: $L("Prices and availability of any Applications are subject to change at any time.   All sales of successfully downloaded Applications are final and non-refundable."),
className: "terms-text"
}, {
name: "delivery",
content: $L("Delivery Of Applications"),
className: "terms-text-subhead"
}, {
content: $L("If delivery of an Application you purchased is interrupted, you will be able to resume or restart such delivery at no additional charge. On occasion, technical problems may delay or prevent delivery of an Application. Your exclusive and sole remedy with respect to such Application that is not delivered within a reasonable period will be replacement of such Application, or refund of the price paid for such Application if such Application is no longer available for download. "),
className: "terms-text"
}, {
name: "customer-service",
content: $L("Customer Service"),
className: "terms-text-subhead"
}, {
content: $L("For any issues or questions concerning the App Catalog, please go to www.palm.com and click on the \u201cSupport\u201d link. HP does not provide support for Applications, and the Application Provider is responsible for providing such support. For any issues or questions concerning specific Applications, please contact the Application Provider."),
className: "terms-text"
}, {
name: "responsibility",
content: $L("Responsibility For App Catalog Activities"),
className: "terms-text-subhead"
}, {
content: $L("You are entirely responsible for all activities that occur on or through the App Catalog from your device, including any unauthorized purchases made through your device, and you agree to notify HP immediately of any unauthorized use of your device or any other breach of security. HP is not responsible for any losses arising out of the unauthorized use of your device. HP reserves the right to disable, block, suspend or otherwise limit your access to the App Catalog in the event of unauthorized use of your device or if you violate the terms of this Agreement."),
className: "terms-text"
}, {
name: "content-accessed",
content: $L("Content Accessed Through Applications"),
className: "terms-text-subhead"
}, {
content: $L("You acknowledge and agree that certain Applications may provide access to products, services, web content or other third-party materials (together, \u201cThird-Party Content\u201d) and that HP is not responsible for such Third-Party Content. HP makes no representations or warranties regarding, and accepts no liability in respect of, such Third-Party Content. You further acknowledge that by accessing the App Catalog or Applications downloaded through the App Catalog, you may be exposed to Third-Party Content that contains explicit language or is offensive, indecent or objectionable to you, and that you may not be warned about the specific Application or Third-Party Content in advance. You agree that your downloading and use of all Applications will be at your sole risk, and HP shall have no liability to you as a result of any exposure through such Applications."),
className: "terms-text"
}, {
name: "internet",
content: $L("Internet Connection"),
className: "terms-text-subhead"
}, {
content: $L("Access to and downloading from the App Catalog requires an internet connection.  In addition, your use of certain Applications may require an internet connection. "),
className: "terms-text"
}, {
name: "reviews",
content: $L("Reviews"),
className: "terms-text-subhead"
}, {
content: $L("HP, in its sole discretion, may permit users to post reviews of Applications on the App Catalog. Such reviews reflect the opinions of the reviewers and not HP, and HP makes no representations or warranties as to the accuracy or completeness of the reviews. You agree that HP shall have no liability to you if you rely on the reviews to download or use an Application.  HP reserves the right to, but has no obligation to, remove reviews that HP deems irrelevant or otherwise inappropriate for any reason. If you post a review, you hereby grant HP a perpetual, worldwide, fully transferable and sub-licensable, irrevocable, royalty-free license to make, use, sell, market, reproduce, create derivative works of, distribute, perform, and display the review in any manner and for any purpose. You acknowledge that your personally identifiable information may be associated with your review unless you post the review anonymously. If you post a review, you agree not to post, publish or transmit any material that: (i) is false or misleading; (ii) is defamatory; (iii) invades another\u2019s privacy; (iv) is obscene, pornographic, or offensive; (v) promotes bigotry, racism, hatred or harm against any individual or group; (vi) infringes on another\u2019s rights, including but not limited to any intellectual property rights; or (vii) violates, or encourages any conduct that would violate any applicable law or regulation or would give rise to civil liability."),
className: "terms-text"
}, {
name: "consent-use",
content: $L("Consent To Use Of Data"),
className: "terms-text-subhead"
}, {
content: $L("You agree that HP, its affiliates and designated agents may collect and use technical and related information, gathered in any manner, as part of product support services related to the App Catalog. This includes the use of Google Analytics or other analytics tools for the collection of anonymous usage information, which helps HP understand how visitors engage with the application catalog. HP, its affiliates and designated agents may use this information solely to improve its products or to provide customized services or technologies to you. HP will collect and use this information in accordance with its privacy policy (http://www.palm.com/privacy) and in accordance with applicable data protection laws. HP, its affiliates and designated agents may disclose this information to others, but not in a form that personally identifies you."),
className: "terms-text"
}, {
name: "reverse-engineering",
content: $L("Reverse Engineering"),
className: "terms-text-subhead"
}, {
content: $L("You may not reverse engineer, decompile, or disassemble the App Catalog or any Applications downloaded from the App Catalog, except and only to the extent that such activity is expressly permitted by applicable law."),
className: "terms-text"
}, {
name: "indemnification",
content: $L("Indemnification"),
className: "terms-text-subhead"
}, {
content: $L("To the maximum extent permitted by law, you agree to defend, indemnify and hold HP, its directors, officers, employees, affiliates, and agents harmless from and against any and all claims arising out of your breach of this Agreement, your use of the App Catalog, or your use of any Applications downloaded from the App Catalog."),
className: "terms-text"
}, {
name: "warranty",
content: $L("Warranty And Disclaimers"),
className: "terms-text-subhead"
}, {
content: $L("EXCEPT AS MAY BE PROVIDED UNDER A WARRANTY FOR NEWLY PURCHASED DEVICES, AND TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT USE OF THE APP CATALOG IS AT YOUR SOLE RISK AND THAT ACCESS TO THE APP CATALOG IS PROVIDED TO YOU ON AN \u201cAS IS\u201d AND \u201cAS AVAILABLE\u201d BASIS AND WITHOUT ANY WARRANTY OF ANY KIND OR NATURE. HP DOES NOT WARRANT THAT USE OF THE APP CATALOG WILL BE UNINTERRUPTED, FAULT-TOLERANT OR ERROR FREE. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HP AND ITS SUPPLIERS EXPRESSLY DISCLAIM ANY IMPLIED OR STATUTORY TERMS, CONDITIONS OR WARRANTIES, INCLUDING THOSE AS TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, CORRESPONDENCE WITH DESCRIPTION, SATISFACTORY QUALITY AND NON-INFRINGEMENT. HP MAKES NO WARRANTY OF ANY KIND, WHETHER EXPRESS OR IMPLIED, WITH REGARD TO ANY THIRD PARTY SOFTWARE OR OPEN SOURCE SOFTWARE. ALL THIRD PARTY SOFTWARE AND OPEN SOURCE SOFTWARE IS PROVIDED \u201cAS-IS\u201d, WITHOUT WARRANTIES OF ANY KIND BY HP."),
className: "terms-text"
}, {
name: "liability",
content: $L("Limitation Of Liability"),
className: "terms-text-subhead"
}, {
content: $L("NOTHING IN THIS LIMITATION OF LIABILITY LIMITS OR EXCLUDES HP\u2019S OR ITS SUPPLIERS\u2019 LIABILITY FOR DEATH OR PERSONAL INJURY CAUSED BY NEGLIGENCE, FOR REPRESENTATIONS MADE FRAUDULENTLY, OR FOR ANY OTHER LIABILITY WHICH CANNOT BE LIMITED OR EXCLUDED BY APPLICABLE LAW. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NEITHER HP NOR ITS SUPPLIERS SHALL BE LIABLE FOR INCIDENTAL, CONSEQUENTIAL, INDIRECT, SPECIAL, OR PUNITIVE DAMAGES OF ANY KIND, LOSS OF INFORMATION OR DATA, LOSS OF REVENUE, LOSS OF BUSINESS OR OTHER FINANCIAL LOSS ARISING OUT OF OR IN CONNECTION WITH THE LICENSE OR USE OF THE APP CATALOG OR APPLICATIONS DOWNLOADED FROM THE APP CATALOG, WHETHER BASED IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT PRODUCT LIABILITY OR ANY OTHER THEORY, EVEN IF HP HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES AND EVEN IF ANY LIMITED REMEDY IS DEEMED TO HAVE FAILED OF ITS ESSENTIAL PURPOSE. HP\u2019S ENTIRE LIABILITY SHALL BE LIMITED TO REPLACEMENT, REPAIR, OR REFUND OF THE PURCHASE PRICE PAID FOR THE APPLICABLE APPLICATION, AT HP\u2019S OPTION. IN NO EVENT WILL HP BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, PUNITIVE, EXEMPLARY, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF ANY APPLICATION OR OPEN SOURCE SOFTWARE, EVEN IF HP HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES OR LOSSES."),
className: "terms-text"
}, {
content: $L("Some jurisdictions do not allow the exclusion or limitation of implied warranties, terms or conditions or the limitation of incidental or consequential damages so the above limitations and exclusions may be limited in their application to you. For further information about your statutory rights, please contact your local authority, trading standards department, citizens\u2019 advice bureau or equivalent.")
}, {
name: "export",
content: $L("Export Restrictions"),
className: "terms-text-subhead"
}, {
content: $L("You agree that you will not export or re-export any Application or accompanying documentation (or any copies thereof) in violation of any applicable laws or regulations of the United States. You agree to comply with all applicable United States and international export laws and regulations. These laws include restrictions on destinations, end users, and end use.  You represent and warrant that you are not prohibited from receiving exports or services under United States or other applicable export laws."),
className: "terms-text"
}, {
name: "terms-termination",
content: $L("Term And Termination"),
className: "terms-text-subhead"
}, {
content: $L("This Agreement is effective until terminated. HP may terminate this Agreement in whole or as it applies to your use of any Application if you breach any of the terms of this Agreement. You may terminate it at any time by ceasing to use the App Catalog, provided that any terms relating to your use of each Application will survive unless and until you destroy all copies of such Application and related documentation. Some jurisdictions do not allow the termination of this type of Agreement, so the above provision may be limited in its application to you. In addition, HP reserves the right to modify, suspend, or discontinue the App Catalog (or any part or content thereof) at any time with or without notice to you, and HP will not be liable to you or to any third party should it exercise such rights. HP may freely assign this Agreement to any subsidiary or affiliate of HP without Your approval."),
className: "terms-text"
}, {
name: "special-rights",
content: $L("Special Rights For The License Or Use By The U.S. Government"),
className: "terms-text-subhead"
}, {
content: $L("If an Application is being used by or licensed to the United States Government, the following shall apply: The Application licensed under this Agreement is \u201ccommercial computer software\u201d as the term is described in 48 C.F.R. 252.227-7014(a)(1). If acquired by or on behalf of a civilian agency, the U.S. Government acquires this commercial computer software and/or commercial computer software documentation subject to the terms of this Agreement as specified in 48 C.F.R. 12.212 (Computer Software) and 48 C.F.R. 12.211 (Technical Data) of the Federal Acquisition Regulations (\u201cFAR\u201d) and its successors. If acquired by or on behalf of any agency within the Department of Defense (\u201cDOD\u201d), the U.S. Government acquires this commercial computer software and/ or commercial computer software documentation subject to the terms of this Agreement as specified in 48 C.F.R. 227.7202-3 of the DOD FAR Supplement (\u201cDFAR\u201d) and its successors."),
className: "terms-text"
}, {
name: "governing-law",
content: $L("Governing Law"),
className: "terms-text-subhead"
}, {
content: $L("This Agreement shall be governed by the laws of the State of California and by the federal laws of the United States, excluding their conflicts of laws provisions. The United Nations Convention on Contracts for the International Sale of Goods (1980) is hereby excluded in its entirety from application to this Agreement. If you are a consumer residing in the European Economic Area or Switzerland, this Agreement shall be governed by the law of the country in which you reside. "),
className: "terms-text"
}, {
name: "severability",
content: $L("Severability"),
className: "terms-text-subhead"
}, {
content: $L("In the event any provision of this Agreement is found to be invalid, illegal or unenforceable, the validity, legality and enforceability of any of the remaining provisions shall not in any way be affected or impaired."),
className: "terms-text"
}, {
name: "enforcement",
content: $L("Enforcement Of Agreement"),
className: "terms-text-subhead"
}, {
content: $L("HP reserves the right to takes any steps it believes to be reasonably necessary or appropriate to enforce and/or verify compliance with any part of this Agreement. You agree that HP has the right, without liability to you, to disclose any information relating to your use of the App Catalog to law enforcement authorities, government officials, and/or a third party, as HP believes is reasonably necessary or appropriate to enforce and/or verify compliance with any part of this Agreement."),
className: "terms-text"
}, {
name: "entire-agreement",
content: $L("Entire Agreement"),
className: "terms-text-subhead"
}, {
content: $L("By accepting this Agreement, you agree that the Agreement (including all incorporated or referenced documents) set forth the entire agreement between you and HP, and supersede all prior agreements, whether written or oral, with respect to the App Catalog and all Applications, notwithstanding the terms or conditions of any such prior agreements. If HP fails to enforce any right or provision in this Agreement, such failure will not constitute a waiver of such right or provision."),
className: "terms-text"
}, {
content: $L("Hewlett-Packard Company")
}, {
content: $L("950 W. Maude Ave.")
}, {
content: $L("Sunnyvale CA 94085-2801")
}, {
content: $L("United States of America")
}, {
content: $L("www.hp.com")
}, {
content: $L("Last updated: March 15, 2011"),
style: "margin-bottom:10px"
}, {
name: "app-license-agreement",
content: $L("Application License Agreement"),
className: "terms-text-subhead"
}, {
content: $L("THE FOLLOWING TERMS AND CONDITIONS APPLY TO YOUR USE OF EACH APPLICATION YOU DOWNLOAD FROM THE APP CATALOG (EACH, AN \u201cAPPLICATION\u201d).  BEFORE USING ANY APPLICATION, CAREFULLY READ THIS AGREEMENT"),
className: "terms-text"
}, {
content: $L("PLEASE NOTE THAT IF YOU ARE A CONSUMER IN THE EUROPEAN ECONOMIC AREA OR SWITZERLAND, THIS LICENSE AGREEMENT DOES NOT AFFECT YOUR STATUTORY RIGHTS.  FOR FURTHER INFORMATION ABOUT YOUR STATUTORY RIGHTS CONTACT YOUR LOCAL AUTHORITY, TRADING STANDARDS DEPARTMENT OR CITIZENS ADVICE BUREAU (OR LOCAL EQUIVALENT)."),
className: "terms-text"
}, {
content: $L("The license granted hereunder is granted to you by the provider of the Application (\u201cApplication Provider\u201d) and not by Hewlett-Packard Company  (\u201cHP\u201d). If the Application Provider provides an End User License Agreement (\u201cEULA\u201d) with the Application, those terms shall supplement this Application License Agreement.  As between you and the Application Provider, any additional or different terms in such EULA shall take precedence over the terms in this Application License Agreement."),
className: "terms-text"
}, {
content: $L("You acknowledge and agree that HP is a third party beneficiary of this Application License Agreement and any EULA, if so provided. You acknowledge and agree that HP will have the right (and will be deemed to have accepted the right) to enforce such license against you as a third party beneficiary of those agreements."),
className: "terms-text"
}, {
name: "app-license-grant",
content: $L("License Grant"),
className: "terms-text-subhead"
}, {
content: $L("You are hereby granted a limited, non-transferable license to use the Application for a single HP account that you control and solely for devices operating on webOS. You may not rent, lease, lend, sell, redistribute or sublicense the Application. You may not reverse engineer, decompile, or disassemble the Application, except and only to the extent that such activity is expressly permitted by applicable law. Any attempt to do so is a violation of the rights of the Application Provider. If you breach this restriction, you may be subject to prosecution and damages. The terms of the license will govern any upgrades provided by the Application Provider that replace and/or supplement the original Application, unless such upgrade is accompanied by a separate license in which case the terms of that license will govern. The Application Provider reserves all rights in and to the Application not expressly granted to you under this Application License Agreement."),
className: "terms-text"
}, {
name: "app-consent-use",
content: $L("Consent To Use Of Data"),
className: "terms-text-subhead"
}, {
content: $L("You agree that the Application Provider may collect and use technical and related information, gathered in any manner, as part of product support services related to the Application. The Application Provider may use this information solely to improve its products or to provide customized services or technologies to you.  The Application Provider may disclose this information to others, but not in a form that personally identifies you.")
}, {
name: "app-no-warranty",
content: $L("No Warranty"),
className: "terms-text-subhead"
}, {
content: $L("YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT USE OF THE APPLICATION IS AT YOUR SOLE RISK AND THAT ACCESS TO THE APPLICATION IS PROVIDED TO YOU ON AN \u201cAS IS\u201d AND \u201cAS AVAILABLE\u201d BASIS AND WITHOUT ANY WARRANTY OF ANY KIND OR NATURE. THE APPLICATION PROVIDER DOES NOT WARRANT THAT USE OF THE APPLICATION WILL BE UNINTERRUPTED, FAULT-TOLERANT OR ERROR FREE.  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE APPLICATION PROVIDER EXPRESSLY DISCLAIMS ANY IMPLIED OR STATUTORY TERMS, CONDITIONS OR WARRANTIES, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, CORRESPONDENCE WITH DESCRIPTION, SATISFACTORY QUALITY AND NON-INFRINGEMENT.  THE APPLICATION PROVIDER MAKES NO WARRANTY OF ANY KIND, WHETHER EXPRESS OR IMPLIED, WITH REGARD TO ANY THIRD PARTY SOFTWARE OR OPEN SOURCE SOFTWARE.  "),
className: "terms-text"
}, {
name: "app-limitation-liability",
content: $L("Limitation Of Liability"),
className: "terms-text-subhead"
}, {
content: $L("NOTHING IN THIS LIMITATION OF LIABILITY LIMITS OR EXCLUDES THE APPLICATION PROVIDER\u2019S LIABILITY FOR DEATH OR PERSONAL INJURY CAUSED BY NEGLIGENCE, FOR REPRESENTATIONS MADE FRAUDULENTLY, OR FOR ANY OTHER LIABILITY WHICH CANNOT BE LIMITED OR EXCLUDED BY APPLICABLE LAW. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE APPLICATION PROVIDER SHALL NOT BE LIABLE FOR INCIDENTAL, CONSEQUENTIAL, INDIRECT, SPECIAL, OR PUNITIVE DAMAGES OF ANY KIND, LOSS OF INFORMATION OR DATA, LOSS OF REVENUE, LOSS OF BUSINESS OR OTHER FINANCIAL LOSS ARISING OUT OF OR IN CONNECTION WITH THE LICENSE OR USE OF THE APPLICATION, WHETHER BASED IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT PRODUCT LIABILITY OR ANY OTHER THEORY, EVEN IF THE APPLICATION PROVIDER HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES AND EVEN IF ANY LIMITED REMEDY IS DEEMED TO HAVE FAILED OF ITS ESSENTIAL PURPOSE. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE APPLICATION PROVIDER\u2019S ENTIRE LIABILITY SHALL BE LIMITED TO REPLACEMENT, REPAIR, OR REFUND OF THE PURCHASE PRICE PAID FOR THE APPLICATION, AT THE APPLICATION PROVIDER\u2019S OPTION.  IN NO EVENT WILL THE APPLICATION PROVIDER BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, PUNITIVE, EXEMPLARY, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF ANY THIRD PARTY SOFTWARE OR OPEN SOURCE SOFTWARE, EVEN IF THE APPLICATION PROVIDER HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES OR LOSSES."),
className: "terms-text"
}, {
content: $L("Some jurisdictions do not allow the exclusion or limitation of implied warranties or the limitation of incidental or consequential damages so the above limitations and exclusions may be limited in their application to you. "),
className: "terms-text"
}, {
name: "app-export-restrictions",
content: $L("Export Restrictions"),
className: "terms-text-subhead"
}, {
content: $L("You agree that you will not export or re-export the Application or accompanying documentation (or any copies thereof) in violation of any applicable laws or regulations of the United States.  You agree to comply with all applicable United States and international export laws and regulations. These laws include restrictions on destinations, end users, and end use.  You represent and warrant that you are not prohibited from receiving exports or services under United States or other applicable export laws."),
className: "terms-text"
}, {
name: "app-terms-termination",
content: $L("Term And Termination"),
className: "terms-text-subhead"
}, {
content: $L("The license is effective until terminated by you or the Application Provider. Your rights under this license will terminate automatically without notice from the Application Provider if you fail to comply with any term(s) of this license. Upon termination of the license, you shall cease all use of the Application, and destroy all copies, full or partial, of the Application, including any accompanying documentation."),
className: "terms-text"
}, {
name: "app-special-rights",
content: $L("Special Rights For The License Or Use By The U.S. Government"),
className: "terms-text-subhead"
}, {
content: $L(" If the Application is being used by or licensed to the United States Government, the following shall apply: The Application licensed under this Application License Agreement is \u201ccommercial computer software\u201d as the term is described in 48 C.F.R. 252.227-7014(a)(1). If acquired by or on behalf of a civilian agency, the U.S. Government acquires this commercial computer software and/or commercial computer software documentation subject to the terms of this Agreement as specified in 48 C.F.R. 12.212 (Computer Software) and 48 C.F.R. 12.211 (Technical Data) of the Federal Acquisition Regulations (\u201cFAR\u201d) and its successors. If acquired by or on behalf of any agency within the Department of Defense (\u201cDOD\u201d), the U.S. Government acquires this commercial computer software and/ or commercial computer software documentation subject to the terms of this Application License Agreement as specified in 48 C.F.R. 227.7202-3 of the DOD FAR Supplement (\u201cDFAR\u201d) and its successors."),
className: "terms-text"
}, {
name: "app-governing-law",
content: $L("Governing Law"),
className: "terms-text-subhead"
}, {
content: $L("This Application License Agreement shall be governed by the laws of the State of California and by the federal laws of the United States, excluding their conflicts of laws provisions. The United Nations Convention on Contracts for the International Sale of Goods (1980) is hereby excluded in its entirety from application to this Application License Agreement. If you acquired the Application in the European Economic Area or Switzerland, this Agreement shall be governed by the law of the country in which you purchased the Application."),
className: "terms-text"
}, {
name: "app-severability",
content: $L("Severability"),
className: "terms-text-subhead"
}, {
content: $L("In the event any provision of this Application License Agreement is found to be invalid, illegal or unenforceable, the validity, legality and enforceability of any of the remaining provisions shall not in any way be affected or impaired. "),
className: "terms-text"
}, {
name: "app-entire-agreement",
content: $L("Entire Agreement"),
className: "terms-text-subhead"
}, {
content: $L("By accepting this Application License Agreement, you agree that such agreement (including all incorporated or referenced documents) sets forth the entire agreement between you and the Application Provider, and supersedes all prior agreements, whether written or oral, with respect to the Application, notwithstanding the terms or conditions of any such prior agreements.  If the Application Provider fails to enforce any right or provision in this Application License Agreement, such failure will not constitute a waiver of such right or provision."),
className: "terms-text"
}, {
name: "update-date",
content: $L("Last updated: March 15, 2011"),
className: "terms-text"
} ]
});

// source/views/MagazineView.js

enyo.kind({
name: "findApps.MagazineView",
kind: enyo.VFlexBox,
components: [ {
flex: 1,
name: "magazine",
kind: "enyo.FindApps.Magazine.Magazine",
className: "enyo-bg",
onMagazineGoToTarget: "goToTarget"
}, {
kind: "findApps.NavigationBar",
name: "navigationControlsMagazine",
selectedView: "Issue"
} ],
create: function() {
this.inherited(arguments);
var a = findApps.ViewLibrary._container;
a && a.registerObserver && a.registerObserver("resize", this);
},
update: function(a) {
this.$.magazine.update && a == "resize" && findApps.ViewLibrary._container.isTopView(this) && this.$.magazine.update(a);
},
goToTarget: function(a, b, c) {
switch (b) {
case "saved":
var d = findApps.ViewLibrary.getView("SAVEDAPPS");
d.reset();
break;
case "preferences":
var d = findApps.ViewLibrary.getView("PREFERENCES");
d.reset();
break;
case "appdetails":
var e = findApps.ViewLibrary.getView("APPDETAILS");
e.setAppItem(c);
break;
case "searchlist":
c && (c.hideSearchField = !0, c.title = "", c.comingFrom = "magazine");
var f = findApps.ViewLibrary.getView("MAGSEARCH");
f.setParams(c);
}
},
reset: function() {
this.$.navigationControlsMagazine.setSelectedView("Issue");
},
resizeHandler: function() {
findApps.ViewLibrary._container.isTopView(this) && this.inherited(arguments);
},
targetViewMapping: {
saved: 2,
preferences: 5,
myAccount: 0,
topPaid: 0,
topFree: 0,
onSale: 0
},
getAppMenuOptions: function() {
return {
accountOption: {
disabled: !1,
show: !0
},
softwareManager: {
disabled: !1,
show: !0
},
helpMenu: {
disabled: !1,
show: !0
}
};
}
});

// source/views/BrowserView.js

enyo.kind({
name: "findApps.BrowserView",
kind: enyo.VFlexBox,
components: [ {
flex: 1,
kind: "findApps.AppCatalog",
name: "browseCategories"
}, {
kind: "findApps.NavigationBar",
name: "navigationControlsBrowser",
selectedView: "Browser"
} ],
create: function() {
this.inherited(arguments);
var a = findApps.ViewLibrary._container;
a && a.registerObserver && a.registerObserver("resize", this);
},
update: function(a) {
if (this.$.browseCategories.update) switch (a) {
case "resize":
findApps.ViewLibrary._container.isTopView(this) && this.$.browseCategories.update(a);
}
},
refresh: function() {
this.$.browseCategories.refresh();
},
reset: function() {
this.$.navigationControlsBrowser.setSelectedView("Browser"), this.$.browseCategories.reset();
},
resizeHandler: function() {
findApps.ViewLibrary._container.isTopView(this) && this.inherited(arguments);
},
getAppMenuOptions: function() {
return {
accountOption: {
disabled: !1,
show: !0
},
softwareManager: {
disabled: !1,
show: !0
},
helpMenu: {
disabled: !1,
show: !0
}
};
},
prefetch: function() {
this.$.browseCategories.prefetch && this.$.browseCategories.prefetch();
}
});

// source/views/SavedView.js

enyo.kind({
name: "findApps.SavedView",
kind: enyo.VFlexBox,
components: [ {
flex: 1,
name: "saved",
className: "enyo-bg",
kind: "findApps.SavedApps"
}, {
kind: "findApps.NavigationBar",
name: "navigationControlsSave",
selectedView: "Saved"
} ],
reset: function() {
this.$.navigationControlsSave.setSelectedView("Saved"), this.$.saved.getSavedList(!0);
},
create: function() {
this.inherited(arguments);
var a = findApps.ViewLibrary._container;
a && a.registerObserver && a.registerObserver("resize", this);
},
update: function(a) {
this.$.saved.update && (a == "resize" ? findApps.ViewLibrary._container.isTopView(this) && this.$.saved.update(a) : this.$.saved.update(a));
},
resizeHandler: function() {
findApps.ViewLibrary._container.isTopView(this) && this.inherited(arguments);
},
getAppMenuOptions: function() {
return {
accountOption: {
disabled: !1,
show: !0
},
softwareManager: {
disabled: !1,
show: !0
},
helpMenu: {
disabled: !1,
show: !0
}
};
},
prefetch: function() {
this.$.saved.prefetch && this.$.saved.prefetch();
}
});

// source/views/SearchView.js

enyo.kind({
name: "findApps.SearchView",
kind: enyo.VFlexBox,
showingBackNavigation: !1,
components: [ {
flex: 1,
name: "search_apps",
kind: "findApps.SearchApps"
}, {
kind: "findApps.NavigationBar",
name: "navigationControlsSearch",
selectedView: "Search"
}, {
kind: "findApps.BackNavigationBar",
name: "backButtonBar",
showing: "false"
} ],
published: {
params: {}
},
create: function() {
this.inherited(arguments);
var a = findApps.ViewLibrary._container;
a && a.registerObserver && a.registerObserver("resize", this);
},
update: function(a) {
this.$.search_apps.update && (a == "resize" ? findApps.ViewLibrary._container.isTopView(this) && this.$.search_apps.update(a) : this.$.search_apps.update(a));
},
reset: function() {
this.updateNavigationBar(this.params), this.$.backButtonBar.reset(), this.$.search_apps.reset();
},
updateNavigationBar: function(a) {
a && a.comingFrom && (a.comingFrom === "details" || a.comingFrom === "magazine") || a && a.type && a.type === "connector" ? (findApps.ViewLibrary._container.isFirstPage() ? this.$.backButtonBar.hide() : (this.$.backButtonBar.show(), this.showingBackNavigation = !0), this.$.navigationControlsSearch.hide()) : (this.$.backButtonBar.reset(), this.$.backButtonBar.hide(), this.$.navigationControlsSearch.show(), this.$.navigationControlsSearch.setSelectedView("Search"));
},
paramsChanged: function() {
this.$.search_apps.setParams(this.params);
},
resizeHandler: function() {
findApps.ViewLibrary._container.isTopView(this) && this.inherited(arguments);
},
getAppMenuOptions: function() {
return {
accountOption: {
disabled: !1,
show: !0
},
softwareManager: {
disabled: !1,
show: !0
},
helpMenu: {
disabled: !1,
show: !0
}
};
}
});

// source/views/PreferencesView.js

enyo.kind({
name: "findApps.PreferencesView",
kind: enyo.VFlexBox,
components: [ {
name: "acct_preferences",
kind: "findApps.PreferenceAccount",
flex: 1
} ],
reset: function() {
this.$.acct_preferences.refreshStatus();
},
setCallback: function(a) {
this.$.acct_preferences.setCallback(a);
},
setShowPaymentSetup: function(a) {
this.$.acct_preferences.setShowPaymentSetup(a);
},
setParams: function(a) {
this.$.acct_preferences.setParams(a);
},
resizeHandler: function() {
findApps.ViewLibrary._container.isTopView(this) && this.inherited(arguments);
},
getAppMenuOptions: function() {
return {
softwareManager: {
disabled: !1,
show: !0
},
helpMenu: {
disabled: !1,
show: !0
}
};
}
});

// source/views/CCSetupView.js

enyo.kind({
name: "findApps.CCSetupView",
kind: enyo.VFlexBox,
components: [ {
name: "ccSetup",
kind: "findApps.CreditCardInfo",
flex: 1
} ],
reset: function() {
this.$.ccSetup.refreshStatus();
},
setCallback: function(a) {
this.$.ccSetup.setCallback(a);
},
setModalMode: function(a) {
this.$.ccSetup.setModalMode(a);
},
resizeHandler: function() {
findApps.ViewLibrary._container.isTopView(this) && this.inherited(arguments);
},
getAppMenuOptions: function() {
return {
softwareManager: {
disabled: !1,
show: !0
},
helpMenu: {
disabled: !1,
show: !0
}
};
}
});

// source/views/OBSetupView.js

enyo.kind({
name: "findApps.OBSetupView",
kind: enyo.VFlexBox,
components: [ {
name: "obSetup",
kind: "findApps.CarrierInfo",
flex: 1
} ],
reset: function() {
this.$.obSetup.refreshStatus();
},
setCallback: function(a) {
this.$.obSetup.setCallback(a);
},
setModalMode: function(a) {
this.$.obSetup.setModalMode(a);
},
resizeHandler: function() {
findApps.ViewLibrary._container.isTopView(this) && this.inherited(arguments);
},
getAppMenuOptions: function() {
return {
softwareManager: {
disabled: !1,
show: !0
},
helpMenu: {
disabled: !1,
show: !0
}
};
}
});

// source/views/DetailsView.js

enyo.kind({
name: "findApps.DetailsView",
kind: enyo.VFlexBox,
components: [ {
flex: 1,
kind: "findApps.Details",
name: "appDetails"
}, {
className: "bottom-shadow",
style: "margin-top:-9px;"
}, {
kind: "findApps.BackNavigationBar",
name: "backBar"
} ],
create: function() {
this.inherited(arguments);
var a = findApps.ViewLibrary._container;
a && a.registerObserver && a.registerObserver("resize", this);
},
update: function(a) {
if (this.$.appDetails.update) switch (a) {
case "resize":
findApps.ViewLibrary._container.isTopView(this) && this.$.appDetails.update(a);
break;
default:
this.$.appDetails.update(a);
}
},
refresh: function() {
this.$.appDetails.appItemChanged();
},
reset: function() {
this.source && this.source == "devappssearch" && findApps.ViewLibrary.popViewsFromHistory(2), this.source = null, findApps.ViewLibrary._container.isFirstPage() ? this.$.backBar.hide() : (this.$.backBar.reset(), this.$.backBar.show()), this.$.appDetails.refreshLists();
},
setAppItem: function(a) {
this.$.appDetails.setAppItem(a);
},
setSource: function(a) {
this.source = a;
},
resizeHandler: function() {
findApps.ViewLibrary._container.isTopView(this) && this.inherited(arguments);
},
getAppMenuOptions: function() {
return {
accountOption: {
disabled: !1,
show: !0
},
softwareManager: {
disabled: !1,
show: !0
},
helpMenu: {
disabled: !1,
show: !0
}
};
}
});

// source/main/NavigationBar.js

enyo.kind({
name: "findApps.NavigationBar",
kind: enyo.Control,
style: "-webkit-transform: translate3d(0px, 0px, 0px);",
published: {
selectedView: "",
allowNavigation: !0
},
selectedViewChanged: function() {
if (this.allowNavigation) switch (this.selectedView) {
case "Issue":
this.$.navigationButtons.setValue(0);
break;
case "Browser":
this.$.navigationButtons.setValue(1);
break;
case "Saved":
this.$.navigationButtons.setValue(2);
break;
case "Search":
this.$.navigationButtons.setValue(3);
break;
default:
this.$.navigationButtons.setValue(0);
}
},
create: function() {
this.inherited(arguments);
var a = enyo.application.savedList;
a.attach(this), this.updateBookmarkCaption(a._list.length);
},
components: [ {
className: "bottom-shadow",
style: "margin-top:-9px;"
}, {
name: "navigationButtons",
onChange: "navigationChange",
className: "navigation-bar",
kind: "TabGroup",
components: [ {
label: $L("Featured"),
icon: "images/menu/icon-featured.png",
className: "icon-with-text"
}, {
label: $L("Categories"),
icon: "images/menu/icon-browse.png",
className: "icon-with-text"
}, {
label: $L("Bookmarks"),
icon: "images/menu/icon-saved.png",
className: "icon-with-text",
name: "bookmarks"
}, {
label: $L("Search"),
icon: "images/menu/icon-search.png",
className: "icon-with-text"
} ]
} ],
navigationChange: function(a) {
this.allowNavigation && this.switchToView(a.getValue());
},
saveListChanged: function(a, b, c) {
this.updateBookmarkCaption(c);
},
updateBookmarkCaption: function(a) {
a !== undefined && (a === 0 ? this.$.bookmarks.setCaption($L("Bookmarks")) : this.$.bookmarks.setCaption($L("Bookmarks") + " (" + a + ")"));
},
switchToView: function(a) {
var b;
switch (a) {
case 0:
b = findApps.ViewLibrary.getView("MAGAZINE");
break;
case 1:
b = findApps.ViewLibrary.getView("BROWSER");
break;
case 2:
b = findApps.ViewLibrary.getView("SAVEDAPPS");
break;
case 3:
b = findApps.ViewLibrary.getView("SEARCHAPPS"), b.setParams({
comingFrom: ""
});
break;
default:
b = findApps.ViewLibrary.getView("BROWSER");
}
}
});

// source/main/BackNavigationBar.js

enyo.kind({
name: "findApps.BackNavigationBar",
kind: "Header",
className: "enyo-header back-footer",
height: "54px",
align: "center",
create: function() {
this.inherited(arguments);
},
components: [ {
name: "backButton",
kind: "Button",
label: $L("Back"),
className: "back-button",
onclick: "goBack"
}, {
kind: "Control",
flex: 1
} ],
goBack: function(a) {
this.$.backButton.disabled = !0, this.$.backButton.addClass("enyo-button-disabled"), findApps.ViewLibrary.goBack();
},
setBackButtonCaption: function(a) {},
reset: function() {
this.$.backButton.disabled = !1, this.$.backButton.removeClass("enyo-button-disabled");
}
});

// source/views/LaunchView.js

enyo.kind({
name: "findApps.LaunchView",
kind: "VFlexBox",
height: "100%",
className: "splash-background",
align: "center",
imageIndex: 0,
splashImages: [ "images/splash/splash001.png", "images/splash/splash002.png", "images/splash/splash003.png", "images/splash/splash004.png", "images/splash/splash005.png", "images/splash/splash006.png", "images/splash/splash007.png", "images/splash/splash008.png", "images/splash/splash009.png" ],
components: [ {
kind: "Spacer"
}, {
kind: enyo.Image,
src: "images/splash/splash001.png",
name: "splashImage",
style: "display:block;margin:auto"
}, {
kind: "Spacer"
} ],
create: function() {
this.inherited(arguments), this.t = setTimeout(enyo.bind(this, this.changeSplashImage), 5);
},
changeSplashImage: function() {
this.imageIndex = (this.imageIndex + 1) % this.splashImages.length, this.$.splashImage.setSrc(this.splashImages[this.imageIndex]), findApps.ViewLibrary._container.isTopView(this) ? this.t = setTimeout(enyo.bind(this, this.changeSplashImage), 100) : clearTimeout(this.t);
},
resizeHandler: function() {
findApps.ViewLibrary._container.isTopView(this) && this.inherited(arguments);
},
getAppMenuOptions: function() {
return {
softwareManager: {
disabled: !1,
show: !0
},
helpMenu: {
disabled: !1,
show: !0
}
};
}
});

// source/viewLibrary.js

findApps.ViewLibrary = {
_container: null,
_views: null,
init: function() {
this._views = [], this._views.MAGAZINE = "findApps.MagazineView", this._views.BROWSER = "findApps.BrowserView", this._views.APPDETAILS = "findApps.DetailsView", this._views.SAVEDAPPS = "findApps.SavedView", this._views.SEARCHAPPS = "findApps.SearchView", this._views.DEVSEARCH = "findApps.SearchView", this._views.MAGSEARCH = "findApps.SearchView", this._views.PREFERENCES = "findApps.PreferencesView", this._views.CCSETUP = "findApps.CCSetupView", this._views.OBSETUP = "findApps.OBSetupView", this._views.FULLSCREENERROR = "findApps.FatalError", this._views.COUNTRYPICKER = "findApps.CountryPicker", this._views.TERMSCONDITIONS = "findApps.AcceptTermsAndConditions", this._views.LAUNCHVIEW = "findApps.LaunchView";
},
setContainer: function(a) {
this._container = a;
},
getView: function(a) {
var b = this._container.setView(a);
return b;
},
popViewsFromHistory: function(a) {
this._container.popViewsFromHistory(a);
},
goBack: function() {
this._container.goBack();
},
cleanup: function() {
this._container = null, this._views = null;
}
};

// source/magazine/app/Magazine.js

enyo.kind({
name: "enyo.FindApps.Magazine.Magazine",
kind: enyo.VFlexBox,
events: {
onMagazineGoToTarget: ""
},
DEFAULT_PAGE: 0,
currentEdition: {},
commonFileSet: {
layout: {},
image: {},
css: {},
binding: {}
},
editionFileSet: [],
fileSetArray: [],
currentPageNum: 0,
maxNumPages: 0,
currentMagazinePage: undefined,
usingDefaultEdition: !1,
magazineDefinedTarget: {
cover: {
type: "internal",
pageNum: 0
},
contents: {
type: "internal",
pageNum: 1
},
toc: {
type: "internal",
pageNum: 1
},
"my-account": {
type: "external"
},
preferences: {
type: "external"
},
saved: {
type: "external"
},
appdetails: {
type: "external"
},
searchlist: {
type: "external"
}
},
components: [ {
name: "magazineHelper",
kind: "enyo.FindApps.Magazine.MagazineHelper"
}, {
name: "magazineContainer",
kind: "enyo.FindApps.Magazine.MagazinePageCarousel",
accelerated: !1,
onGetLeft: "handlePrevPage",
onGetRight: "handleNextPage",
defaultKind: "enyo.FindApps.Magazine.MagazinePage"
}, {
name: "getEdition",
kind: "DbService",
dbKind: "com.palm.appcatalog.editioninfo:3",
method: "find",
onSuccess: "gotEdition",
onFailure: "getEditionFailed"
}, {
name: "getEditionFileSet",
kind: "DbService",
dbKind: "com.palm.appcatalog.editionfile:2",
method: "find",
onSuccess: "gotEditionFileSet",
onFailure: "getEditionFileSetFailed"
}, {
kind: "WebService"
}, {
kind: "enyo.FindApps.Magazine.EditionsMgrHelper",
name: "editionsMgrHelper"
}, {
kind: "Scrim",
name: "scrim",
animateShowing: !1,
layoutKind: "VFlexLayout",
align: "center",
pack: "center",
components: [ {
kind: "SpinnerLarge",
name: "spinner",
showing: !1
} ]
} ],
create: function() {
this.inherited(arguments), this.showScrim();
var a = this.owner, b = findApps.ViewLibrary._container;
this.$.editionsMgrHelper.getEdition(findApps.UserSession.getActivationCountry().toUpperCase(), enyo.g11n.currentLocale().toISOString()), AppCatalog.Config.draftEditionDir ? this.loadDraftEdition() : this.$.getEdition.call({
query: {
where: [ {
prop: "version",
op: "=",
val: "current",
limit: 1,
publishDate: "timestamp",
desc: !0
}, {
prop: "country",
op: "=",
val: findApps.UserSession.getActivationCountry().toUpperCase()
}, {
prop: "locale",
op: "=",
val: enyo.g11n.currentLocale().toISOString()
} ]
}
});
},
gotEdition: function(a, b, c) {
var d = !0, e;
b.results && b.results.length > 0 && (this.currentEdition = b.results[0], this.currentEdition && this.currentEdition.number && this.currentEdition.revision && (e = this.currentEdition.number, d = !1, this.$.getEditionFileSet.call({
query: {
where: [ {
prop: "edition",
op: "=",
val: this.currentEdition.number
}, {
prop: "revision",
op: "=",
val: this.currentEdition.revision
} ]
}
}))), d == 1 && this.loadDefaultEdition();
},
gotDefaultEditionFileSet: function(a, b, c) {
this.currentEdition = {
_id: "00001",
_kind: "com.palm.appcatalog.editioninfo:3",
numPages: b.numPages,
number: "1",
publishDate: b.publishDate
}, this.gotEditionFileSet(a, b, c, !0);
},
gotEditionFileSet: function(a, b, c, d) {
if (c.json || d) {
var e = undefined;
if (c.json) try {
e = JSON.parse(c.json);
} catch (f) {
this.error("Request JSON not valid."), d = !0;
}
if (e && !e.query.page || d) this.commonFileSet = {
layout: {},
image: {},
css: {},
binding: {}
}, this.editionFileSet = [], this.fileSetArray = [];
}
var g = "";
b && b.next && (g = b.next), b.results && b.results.length > 0 ? (this.editionFileSet = this.editionFileSet.concat(b.results), g != "" ? this.$.getEditionFileSet.call({
query: {
page: g,
where: [ {
prop: "edition",
op: "=",
val: this.currentEdition.number
}, {
prop: "revision",
op: "=",
val: this.currentEdition.revision
} ]
}
}) : this.processEditionFileSet(this.editionFileSet)) : (this.error(MagazineErrors.getErrorString(MagazineErrors.EDITION_NOT_LOADED) + " - Empty edition set"), this.loadDefaultEdition());
},
processEditionFileSet: function(a) {
var b = !1;
if (a && a.length > 0) {
var c;
for (c = 0; c < a.length; c++) this.registerEditionFile(a[c]);
b = !0;
} else this.error("ACC Magazine: Couldn't load file set for current edition " + this.currentEdition._id + " " + this.currentEdition.number), this.loadDefaultEdition();
b && (this.currentPageNum = this.DEFAULT_PAGE, this.$.magazineContainer.setCenterView(this.getView(this.currentPageNum)));
},
registerEditionFile: function(a) {
var b = this.$.magazineHelper.getPageNum(a.section);
this.maxNumPages = Math.max(this.maxNumPages, b);
var c;
b === -1 ? c = this.commonFileSet : (this.fileSetArray[b] || (this.fileSetArray[b] = {
layout: {},
image: {},
css: {},
binding: {},
section: ""
}), c = this.fileSetArray[b]), c && c[a.type] ? (c[a.type][a.logicalPath] = a.physicalPath, c.section = a.section) : this.error("Missing file set for pagenum [" + b + "] and section [" + a.section + "]");
},
getView: function(a) {
if (a >= 0 && a < this.currentEdition.numPages) {
var b = a, c = "page" + b, d = {
type: "internal",
pageNum: b
};
return this.magazineDefinedTarget[c] = d, {
name: c + (new Date).getTime(),
commonFileSet: this.commonFileSet,
pageFileSet: this.fileSetArray[b],
onDispatchGoToTarget: "handleGoToTarget",
onDispatchDownloadApp: "handleDownloadApplication",
onDispatchLayoutRendered: "handleDispatchLayoutRendered",
onDispatchLayoutError: "handleDispatchLayoutError",
pageNum: b
};
}
return null;
},
handleNextPage: function(a, b) {
return b && this.currentPageNum++, this.getView(this.currentPageNum + 1);
},
handlePrevPage: function(a, b) {
return b && this.currentPageNum--, this.getView(this.currentPageNum - 1);
},
handleGoToTarget: function(a, b, c) {
var d = this.magazineDefinedTarget[b];
if (d) d.type === "internal" ? this.setInternetTargetPage(d.pageNum) : d.type === "external" && this.doMagazineGoToTarget(b, c); else {
var e = this._getPageNumber(b);
e > 0 && this.setInternetTargetPage(e);
}
},
setInternetTargetPage: function(a) {
if (this.currentPageNum == a) return;
this.currentPageNum = a, this.$.magazineContainer.setCenterView(this.getView(this.currentPageNum));
},
_getPageNumber: function(a) {
var b = /^(page)([0-9]+)$/, c = b.exec(a);
return c && c[2] ? parseInt(c[2]) : -1;
},
handleDispatchLayoutRendered: function(a, b) {
this.hideScrim();
},
handleDispatchLayoutError: function(a, b) {
this.hideScrim();
},
handleDownloadApplication: function(a, b) {},
getEditionFailed: function() {
this.error(MagazineErrors.getErrorString(MagazineErrors.EDITION_NOT_LOADED)), this.loadDefaultEdition();
},
getEditionFileSetFailed: function() {
this.error(MagazineErrors.getErrorString(MagazineErrors.EDITION_FILESET_NOT_LOADED) + this.currentEdition._id + " " + this.currentEdition.number), this.loadDefaultEdition();
},
loadDefaultEdition: function() {
if (this.usingDefaultEdition) return this.unableToInitMagazine();
this.warn(MagazineErrors.getErrorString(MagazineErrors.LOADING_DEFAULT_EDITION)), this.usingDefaultEdition = !0;
var a = enyo.g11n.currentLocale().toISOString().substring(0, 2);
a != "de" && a != "en" && a != "es" && a != "fr" && a != "it" && (this.log("Going to default language"), a = "en"), this.$.webService.call(null, {
url: "source/magazine/defaultEdition/" + a + "/manifest.json",
handleAs: "json",
onSuccess: "gotDefaultEditionFileSet",
onFailure: "unableToInitMagazine"
});
},
unableToInitMagazine: function() {
this.hideScrim(), this.error(MagazineErrors.getErrorString(MagazineErrors.UNABLE_TO_INIT_MAGAZINE));
},
showScrim: function() {
this.$.scrim && (this.$.spinner.setShowing(!0), this.$.scrim.show());
},
hideScrim: function() {
this.$.scrim && (this.$.spinner.setShowing(!1), this.$.scrim.hide());
},
update: function(a, b) {
this.$.magazineContainer.resize();
},
loadDraftEdition: function() {
this.$.webService.call(null, {
url: AppCatalog.Config.draftEditionDir + "/manifest.json",
handleAs: "json",
onSuccess: "drafEditionFilesetLoaded",
onFailure: "drafEditionFilesetNotLoaded"
});
},
drafEditionFilesetLoaded: function(a, b) {
var c = b.fileset || b.results || [], d, e, f = AppCatalog.Config.draftEditionDir, g = this.$.magazineHelper;
for (d = 0; d < c.length; d++) {
var h = g.getCanonicalFilename(c[d].path || c[d].logicalPath);
e = g.getTypeFromFile(h);
if (e) {
var i = {
_id: "200",
_rev: 2,
_kind: "com.palm.appcatalog.editionfile:2",
checksum: "1",
edition: "0",
section: g.getSectionFromFile(h),
type: e,
logicalPath: h,
physicalPath: f + "/" + h
};
this.registerEditionFile(i);
}
}
this.currentEdition = {
_id: "00001",
_kind: "com.palm.appcatalog.editioninfo:3",
numPages: this.maxNumPages + 1,
number: "0",
publishDate: "03/31/2011 12:00:00"
}, this.currentPageNum = 0, this.$.magazineContainer.setCenterView(this.getView(this.currentPageNum));
},
drafEditionFilesetNotLoaded: function(a, b) {
this.hideScrim(), this.error("Draft edition could not be loaded ");
}
});

// source/magazine/app/MagazineHelper.js

enyo.kind({
name: "enyo.FindApps.Magazine.MagazineHelper",
kind: enyo.Component,
pageNumRegex: /(page)(\d+)/,
sectionFromFileRegex: /(\/)?([^\/]*)\/(.*)/,
typeFromFileRegexs: [ {
regex: /(.*)\.(jpg|png|gif)$/,
type: "image"
}, {
regex: /(.*)\.(lo.js)$/,
type: "layout"
}, {
regex: /(.*)\.(json)$/,
type: "binding"
}, {
regex: /(.*)\.(css)$/,
type: "css"
} ],
getPageNum: function(a) {
var b = -1;
if (a && a !== "common") {
var c = this.pageNumRegex.exec(a);
c && c.length >= 3 && (b = parseInt(c[2], 10));
}
return b;
},
getSectionFromFile: function(a) {
var b = undefined;
if (a && a.length > 0) {
var c = this.sectionFromFileRegex.exec(a);
c && c.length >= 3 && (b = c[2]);
}
return b;
},
getTypeFromFile: function(a) {
var b = undefined, c, d, e;
if (a && a.length > 0) for (d = 0; d < this.typeFromFileRegexs.length; d++) {
c = this.typeFromFileRegexs[d], e = c.regex.exec(a);
if (e && e.length >= 3) {
b = c.type;
break;
}
}
return b;
},
getCanonicalFilename: function(a) {
return a.replace(/^\.\//, "");
}
});

// source/magazine/app/MagazinePageCarousel.js

enyo.kind({
name: "enyo.FindApps.Magazine.MagazinePageCarousel",
kind: enyo.Carousel,
events: {
onDispatchGoToTarget: "",
onDispatchDownloadApp: "",
onDispatchLayoutRendered: "",
onDispatchLayoutError: ""
},
handleEvent: function(a, b) {
switch (a) {
case "resize":
default:
}
},
sizeControls: function(a, b, c) {
if (findApps.ViewLibrary._container.isTopView(this.owner.owner)) for (var d = 0, e = this.getControls(), f; f = e[d]; d++) a && f.applyStyle("width", a), b && f.applyStyle("height", b), this.findView(f) && a != b && this.findView(f).orientationChanged(a, b), c && this.resetView(d);
}
});

// source/magazine/app/MagazinePage.js

enyo.kind({
name: "enyo.FindApps.Magazine.MagazinePage",
kind: enyo.Control,
bindingPath: "",
templatePaths: [],
bindingObject: {},
hasCustomLandscapeLayout: !1,
landscapeMode: !1,
published: {
commonFileSet: {},
pageFileSet: {},
name: ""
},
events: {
onNext: "",
onPrev: "",
onDispatchGoToTarget: "",
onDispatchDownloadApp: "",
onDispatchLayoutRendered: "",
onDispatchLayoutError: ""
},
components: [ {
kind: "WebService"
}, {
name: "bindingHelper",
kind: "enyo.FindApps.Magazine.BindingHelper"
}, {
kind: "VFlexBox",
components: [ {
name: "pageContainer",
kind: "Pane",
defaultKind: "enyo.FindApps.Magazine.BindableLayout",
className: "magazinepage",
onLayoutRendered: "doDispatchLayoutRendered",
onLayoutError: "handleLayoutError"
} ]
} ],
create: function() {
this.inherited(arguments), this.commonFileSet = arguments[0].commonFileSet, this.pageFileSet = arguments[0].pageFileSet, this.name = arguments[0].name, this.lookupBindingPath(), this.lookupTemplatePaths(), this.generateLayout();
},
lookupBindingPath: function() {
var a = this.pageFileSet;
this.bindingPath = undefined, a && a.binding && a.section && (this.bindingPath = this.$.bindingHelper.resolveBindingPath(a)), this.bindingPath || (this.error(MagazineErrors.getErrorString(MagazineErrors.INVALID_PAGE_BINDING)), this.doDispatchLayoutError());
},
lookupTemplatePaths: function() {
var a = this.pageFileSet, b = this.$.bindingHelper;
if (a && a.layout && a.section) {
this.templatePaths = b.resolveTemplatePaths(a);
var c = this.templatePaths.length || 0;
this.hasCustomLandscapeLayout = c == 2;
}
if (!this.templatePaths || this.templatePaths.length == 0) this.error(MagazineErrors.getErrorString(MagazineErrors.INVALID_PAGE_TEMPLATE)), this.doDispatchLayoutError();
},
generateLayout: function() {
this.commonFileSet && this.addStyleSheets(this.commonFileSet.css), this.pageFileSet && this.addStyleSheets(this.pageFileSet.css);
var a = this.$.pageContainer, b;
for (b = 0; b < this.templatePaths.length; b++) a.createComponent({
owner: this,
templatePath: this.templatePaths[b],
bindingPath: this.bindingPath,
topLayout: !0,
onLayoutRendered: "doDispatchLayoutRendered",
onLayoutError: "handleLayoutError"
});
this.orientationChanged(window.innerWidth, window.innerHeight), this.render();
},
handleLayoutError: function() {
this.doDispatchLayoutError();
},
forwardGoToTarget: function(a, b) {
this.doDispatchGoToTarget(a, b);
},
forwardDownloadApp: function(a) {
this.doDispatchDownloadApp(a);
},
addStyleSheets: function(a) {
if (a) for (var b in a) typeof a[b] != "function" && enyo.loadSheet(a[b]);
},
handleEvent: function(a, b) {
switch (a) {
case "resize":
var c = b.width, d = b.height;
this.orientationChanged(c, d);
break;
default:
}
},
orientationChanged: function(a, b) {
var c = parseInt(a), d = parseInt(b);
if (this.hasCustomLandscapeLayout) {
var e = c > d;
e && !this.landscapeMode ? this.landscapeMode = !0 : !e && this.landscapeMode && (this.landscapeMode = !1);
}
this._selectOrientView();
},
_selectOrientView: function() {
var a = this.landscapeMode ? 1 : 0;
this.$.pageContainer.selectViewByIndex(a), this.$.pageContainer.render();
},
triggerPortrait: function() {
this.orientationChanged(100, 200);
},
triggerLandscape: function() {
this.orientationChanged(200, 100);
}
});

// source/magazine/app/BindingHelper.js

enyo.kind({
name: "enyo.FindApps.Magazine.BindingHelper",
kind: enyo.Component,
recognizeBindingNames: [ "bindings.json", "binding.json" ],
templateNames: [ "default.lo.js", "main.lo.js" ],
portraitTemplateNames: [ "portrait.lo.js" ],
landscapeTemplateNames: [ "landscape.lo.js" ],
logicalPathRegex: /(\.js|\.png|\.jpg|\.gif|\.json|\.txt|\.htm|\.html)$/,
dynamicVariableRegex: /{\$([^}]*)}/,
appInfoRegex: /{\$(_app)(_price|_rating|_reviewCount)(_.*)?}/,
bindingKeyToStageName: {},
events: {
onPrefetchAppDetailsBulkResponse: "",
onGetAppDetails: ""
},
payloadPropertyLookup: {
_price: "price",
_reviewCount: "numReviews",
_rating: "rating"
},
create: function() {
this.inherited(arguments), this.bindingKeyToStageName.prefetch = STAGES.APP_PREFETCH;
},
resolveBindingPath: function(a) {
return this._resolvePathByNamingConvention(a, "binding", this.recognizeBindingNames);
},
resolveTemplatePaths: function(a) {
var b = [], c = this._resolvePathByNamingConvention(a, "layout", this.templateNames);
if (c) b.push(c); else {
var d = this._resolvePathByNamingConvention(a, "layout", this.portraitTemplateNames);
d && b.push(d);
var e = this._resolvePathByNamingConvention(a, "layout", this.landscapeTemplateNames);
e && b.push(e);
}
return b;
},
resolveDefaultTemplatePath: function(a) {
var b = [], c = this._resolvePathByNamingConvention(a, "layout", this.templateNames);
return c && b.push(c), b;
},
findResolvingStageName: function(a, b) {
if (!a || !b) return undefined;
var c = this.bindingKeyToStageName[a];
if (!c) {
var d = this.logicalPathRegex.exec(b);
d ? c = STAGES.PATH_RESOLVE : (d = this.dynamicVariableRegex.exec(b), d && (d = this.appInfoRegex.exec(b), d && (c = STAGES.APP_INFO)));
}
return c;
},
resolvePhysicalPath: function(a, b, c) {
var d = [ "layout", "image", "css", "binding" ], e = this._resolvePhysicalByLogicalPath(d, b, c);
return e || (e = this._resolvePhysicalByLogicalPath(d, a, c)), e;
},
resolveBulkPhysicalPath: function(a, b, c) {
if (c && c.length > 0) {
var d;
for (d = 0; d < c.length; d++) {
var e = c[d].logicalPath, f = this.resolvePhysicalPath(a, b, e);
f && (c[d].physicalPath = f);
}
}
return c;
},
_resolvePhysicalByLogicalPath: function(a, b, c) {
var d, e;
for (e = 0; e < a.length; e++) {
var f = a[e];
if (b[f][c]) {
d = b[f][c];
break;
}
}
return d;
},
_resolvePathByNamingConvention: function(a, b, c) {
var d = undefined, e;
for (e = 0; e < c.length; e++) {
var f = a.section + "/" + c[e];
if (a[b][f]) {
d = a[b][f];
break;
}
}
return d;
},
getAppProperty: function(a) {
var b = "", c = this.appInfoRegex.exec(a);
return c && c[2] && (b = this.payloadPropertyLookup[c[2]]), b;
},
getAppIdForVariable: function(a) {
var b = "", c = this.appInfoRegex.exec(a);
return c && !c[3] && (b = c[1] + "_id"), c && c[3] && (b = c[1] + "_id" + c[3]), b;
},
getCanonicalAppInfo: function(a) {
var b = a.OutGetAppList.appList.totalCount || 0, c = a.OutGetAppList.appList.appSummary || [], d, e = [], f;
c.length ? b = c.length : b = Math.min(1, b);
for (f = 0; f < b; f++) d = c[f] || c, e.push({
id: d.publicApplicationId,
rating: d.averageRating,
numReviews: d.ratingCount,
price: d.price
});
return e;
}
});

// source/magazine/app/BindableLayout.js

enyo.kind({
name: "enyo.FindApps.Magazine.BindableLayout",
kind: "Control",
templateContent: "",
bindingObject: {},
magazinePage: {},
published: {
templatePath: "",
bindingPath: "",
topLayout: !1
},
stages: {},
boundAndRendered: !1,
events: {
onGoToTarget: "",
onGoToSave: "",
onLayoutRendered: "",
onLayoutError: ""
},
stageHandlerByNameLookup: {},
components: [ {
name: "getLocalFile",
kind: "WebService"
}, {
name: "bindingHelper",
kind: "enyo.FindApps.Magazine.BindingHelper"
}, {
name: "getAppDetailsService",
kind: "enyo.FindApps.Magazine.AppInfoService",
onGetAppList: "handleAppDetailsResponse"
} ],
handleLayoutError: function() {
this.topLayout && (this.createComponent({
kind: "VFlexBox",
pack: "center",
align: "center",
height: "100%",
name: "pageErrorMsgBox",
components: [ {
kind: enyo.Control,
className: "magazine-error-page",
content: $L("Page unavailable."),
flex: 1
} ]
}), this.render()), this.doLayoutError();
},
create: function() {
this.inherited(arguments), this._initHandlersLookup(), this.templatePath = arguments[0].templatePath, this.bindingPath = arguments[0].bindingPath, this.magazinePage = this.findMagazinePage(), this.loadTemplate();
},
loadTemplate: function() {
this.templatePath ? this.$.getLocalFile.call(null, {
url: this.templatePath,
handleAs: "text",
onSuccess: "templateLoaded",
onFailure: "templateNotLoaded"
}) : (this.error(MagazineErrors.getErrorString(MagazineErrors.TEMPLATE_NOT_PROVIDED)), this.handleLayoutError());
},
templateLoaded: function(a, b) {
this.templateContent = b, this.loadBinding();
},
loadBinding: function() {
this.$.getLocalFile.call(null, {
url: this.bindingPath,
handleAs: "json",
onSuccess: "bindingLoaded",
onFailure: "bindingNotLoaded"
});
},
bindingLoaded: function(a, b) {
this.bindingObject = b;
if (enyo.isString(this.bindingObject)) try {
this.bindingObject = enyo.json.parse(this.bindingObject);
} catch (c) {
this.bindingNotLoaded(a, b);
return;
}
var d = this.magazinePage.getCommonFileSet(), e = this.magazinePage.getPageFileSet();
this.createBindingStages();
},
createBindingStages: function() {
var a = this.bindingObject, b = this.$.bindingHelper, c, d;
this._initStages();
var e, f;
for (var g in a) if (typeof a[g] != "function") {
c = a[g], d = b.findResolvingStageName(g, c);
if (!d) continue;
e = this.stages[d], e || (this.stages[d] = {
pending: !1
}), e && !e.pending && (e.pending = !0, this.stages.pendingStages++);
var h = this.stageHandlerByNameLookup[d];
h && h.buildStage && h.buildStage.apply(this, [ a, g, c, e ]);
}
this.processStages();
},
processStages: function(a) {
var b = this.stages;
for (var c in b) if (typeof b[c] != "function") {
var d = b[c];
if (d.pending) {
var e = this.stageHandlerByNameLookup[c];
if (e && e.handleRequest) {
var f = e.handleRequest.apply(this, [ d ]);
if (f) break;
this.stages.pendingStages--;
}
}
}
if (b.pendingStages === 0) return this.bindAndRender();
},
findMagazinePage: function() {
var a = this.owner;
while (a && !(a instanceof enyo.FindApps.Magazine.MagazinePage)) a = a.owner;
return a || this.handleLayoutError(), a;
},
bindAndRender: function(inSender, inResponse) {
if (!this.boundAndRendered) {
this.boundAndRendered = !0;
var comps = enyo.macroize(this.templateContent, this.bindingObject);
try {
comps = eval("(" + comps + ")");
} catch (e) {
this.error("Error when evaluating javascript in magazine"), this.handleLayoutError();
return;
}
this.createComponents(comps), this.render(), this.topLayout && this.doLayoutRendered();
}
},
templateNotLoaded: function(a, b) {
this.error(MagazineErrors.getErrorString(MagazineErrors.TEMPLATE_NOT_LOADED) + " template: " + this.templatePath), this.handleLayoutError();
},
bindingNotLoaded: function(a, b) {
this.error(MagazineErrors.getErrorString(MagazineErrors.BINDING_NOT_LOADED)), this.handleLayoutError();
},
handleAppDetailsResponse: function(a, b) {
this.handleResponse(STAGES.APP_INFO, b);
},
handleResponse: function(a, b) {
var c = this.stageHandlerByNameLookup[a], d = this.stages[a];
d && c ? (c.handleAsyncResponse.apply(this, [ d, b ]), this.stages.pendingStages--, this.processStages()) : this.error("Invalid stageName " + a);
},
_initHandlersLookup: function() {
this.stageHandlerByNameLookup[STAGES.PATH_RESOLVE] = pathBindingStageHandler, this.stageHandlerByNameLookup[STAGES.APP_PREFETCH] = prefetchBindingStageHandler, this.stageHandlerByNameLookup[STAGES.APP_INFO] = appInfoBindingStageHandler;
},
_initStages: function() {
this.stages = {
pendingStages: 0
}, this.stages[STAGES.PATH_RESOLVE] = {
pending: !1,
items: []
}, this.stages[STAGES.APP_INFO] = {
pending: !1
}, this.stages[STAGES.APP_PREFETCH] = {
pending: !1,
items: []
};
},
goToTargetAction: function(a) {
this.magazinePage.forwardGoToTarget(a.target, a.runtimeParams);
},
downloadAppAction: function(a) {
this.magazinePage.forwardDownloadApp(a.appId);
},
saveForLater: function(a) {
var b = {
publicApplicationId: a.publicAppId
};
a.processAction(b);
},
delegate: function(inSender) {
if (inSender.target) {
var handler = eval(inSender.target);
handler.apply(this, [ inSender ]);
}
}
});

// source/magazine/app/MagazineErrors.js

var MagazineErrors = {};

MagazineErrors.EDITION_NOT_LOADED = "edition_not_loaded", MagazineErrors.EDITION_FILESET_NOT_LOADED = "edition_fileset_not_loaded", MagazineErrors.TEMPLATE_NOT_PROVIDED = "template_not_provided", MagazineErrors.TEMPLATE_NOT_LOADED = "template_not_loaded", MagazineErrors.BINDING_NOT_LOADED = "binding_not_loaded", MagazineErrors.ROOT_PAGE_NOT_FOUND = "root_page_not_found", MagazineErrors.INVALID_PAGE_TEMPLATE = "invalid_page_template", MagazineErrors.INVALID_PAGE_BINDING = "invalid_page_binding", MagazineErrors.LOADING_DEFAULT_EDITION = "loading_def_edition", MagazineErrors.UNABLE_TO_INIT_MAGAZINE = "unable_to_init_magazine", MagazineErrors._errorStrings = {}, function() {
var a = MagazineErrors._errorStrings;
a[MagazineErrors.EDITION_NOT_LOADED] = $L("ACC Magazine: Couldn't load current edition info"), a[MagazineErrors.EDITION_FILESET_NOT_LOADED] = $L("ACC Magazine: Couldn't load file set for current edition "), a[MagazineErrors.TEMPLATE_NOT_PROVIDED] = $L("Missing template path"), a[MagazineErrors.TEMPLATE_NOT_LOADED] = $L("Couldn't load given template "), a[MagazineErrors.BINDING_NOT_LOADED] = $L("Couldn't load given binding"), a[MagazineErrors.ROOT_PAGE_NOT_FOUND] = $L("Root magazine page not found"), a[MagazineErrors.INVALID_PAGE_TEMPLATE] = $L("Page File set is missing either section or layouts needed to resolve physical path"), a[MagazineErrors.INVALID_PAGE_BINDING] = $L("Page File set is missing either section or bindings needed to resolve physical path"), a[MagazineErrors.LOADING_DEFAULT_EDITION] = $L("Trying to load the default edition"), a[MagazineErrors.UNABLE_TO_INIT_MAGAZINE] = $L("Failed to load both current and default editions");
}(), MagazineErrors.getErrorString = function(a) {
return this._errorStrings[a];
};

// source/magazine/app/BindingStageHandler.js

var STAGES = {};

STAGES.PATH_RESOLVE = "pathResolve", STAGES.APP_PREFETCH = "appPrefetch", STAGES.APP_INFO = "appInfo", pathBindingStageHandler = {
buildStage: function(a, b, c, d) {
d.items.push({
bindingKey: b,
logicalPath: c,
physicalPath: ""
});
},
handleRequest: function(a) {
var b = this.$, c = b.bindingHelper, d = this.magazinePage.getCommonFileSet(), e = this.magazinePage.getPageFileSet(), f = c.resolveBulkPhysicalPath(d, e, a.items);
if (f) {
var g = this.bindingObject, h, i, j;
for (h = 0; h < f.length; h++) i = f[h].bindingKey, j = f[h].physicalPath, g[i] && j && (g[i] = j);
a.pending = !1;
}
return !1;
},
handleAsyncResponse: function(a, b) {
return !0;
},
handleAsyncFailure: function() {
return !0;
}
}, prefetchBindingStageHandler = {
buildStage: function(a, b, c, d) {
d.items = c;
},
handleRequest: function(a) {
return a.pending = !1, this.$.getAppDetailsService.getAppList({
packageIds: a.items,
binding: this.bindingPath
}), !0;
},
handleAsyncResponse: function(a, b) {
return !0;
},
handleAsyncFailure: function() {
return !0;
}
}, appInfoBindingStageHandler = {
buildStage: function(a, b, c, d) {
var e = this.$.bindingHelper, f = e.getAppIdForVariable(c), g = a[f];
if (g) {
var h = d[g];
h || (h = d[g] = {
items: []
});
var i = e.getAppProperty(c);
h.items.push({
bindingKey: b,
property: i,
resolvedValue: "",
resolvedFlag: !1
});
}
},
handleRequest: function(a) {
a.pending = !1;
var b = [], c = {}, d;
for (appId in a) c = a[appId], isAppInfo = typeof c != "function" && c.items, isAppInfo && b.push(appId);
return this.$.getAppDetailsService.getAppList({
packageIds: b,
binding: this.bindingPath
}), !0;
},
handleAsyncResponse: function(a, b) {
var c = this.bindingObject;
if (!c) return !1;
if (b.length && b.length > 0) {
var d;
for (d = 0; d < b.length; d++) {
var e = b[d], f = a[e.id];
if (f) {
var g;
for (g = 0; g < f.items.length; g++) {
var h = f.items[g];
h && h.property && h.bindingKey && (h.resolvedValue = e[h.property], h.resolvedValue !== undefined && (h.resolvedFlag = !0), c[h.bindingKey] = h.resolvedValue);
}
}
}
}
var i;
for (i in a) {
appInfo = a[i], isAppInfo = typeof appInfo != "function" && appInfo.items;
if (isAppInfo) for (g = 0; g < appInfo.items.length; g++) {
var h = appInfo.items[g];
h && !h.resolvedFlag && (h.resolvedValue = "N/A", c[h.bindingKey] = h.resolvedValue);
}
}
return !0;
},
handleAsyncFailure: function() {
return !1;
}
};

// source/magazine/app/AppInfoService.js

MagazineAppInfoCache = {
appCache: [],
insertAppDetailsBulk: function(a) {
var b, c;
for (b = 0; b < a.length; b++) c = a[b], this.appCache[c.id] || (this.appCache[c.id] = c);
},
getAppDetails: function(a) {
return this.appCache[a];
}
}, enyo.kind({
name: "enyo.FindApps.Magazine.AppInfoService",
kind: enyo.Component,
partialAppDetails: [],
asynchGetAppDetailsPending: !1,
bindingPath: "",
events: {
onPrefetchAppDetailsBulkResponse: "",
onGetAppDetails: "",
onGetAppList: ""
},
components: [ {
name: "prefetchAppDetailsBulk",
kind: "MockService",
requestKind: "enyo.FindApps.Magazine.AppInfoService.MockService.Request",
method: "prefetchAppDetailsBulk",
onSuccess: "prefetchAppDetailBulkSuccess",
onFailure: "prefetchAppDetailBulkFailed"
}, {
name: "bindingHelper",
kind: "enyo.FindApps.Magazine.BindingHelper"
} ],
getAppList: function(a) {
this.asynchGetAppDetailsPending = !1, this.partialAppDetails = [];
var b = [], c = a.packageIds;
this.bindingPath = a.binding;
var d, e;
for (d = 0; d < c.length; d++) {
e = c[d];
var f = MagazineAppInfoCache.getAppDetails(e);
f ? this.partialAppDetails.push(f) : b.push(e);
}
b.length > 0 ? (this.asynchGetAppDetailsPending = !0, this._getAppListFromCatalogService(b)) : this._returnResponse(this.partialAppDetails);
},
_getAppListFromCatalogService: function(a) {
var b = {
onSuccess: "handleCatalogServerResponse",
onFailure: "handleCatalogServerError",
scope: this
};
findApps.BaseServer.getACServer().getAppList({
packageIds: a,
count: a.length || 0
}, "SearchAppsService", b);
},
handleCatalogServerResponse: function(a, b, c, d) {
if (b.JSONException) return this._returnResponse();
switch (d.service) {
case "SearchAppsService":
if (b.OutGetAppList) this._processGetAppListResponse(b); else return this._returnResponse();
break;
default:
this.error("AppInfo Service: UNKNOWN SERVICE");
}
},
_processGetAppListResponse: function(a) {
var b = this.$.bindingHelper.getCanonicalAppInfo(a);
MagazineAppInfoCache.insertAppDetailsBulk(b), this._returnResponse(b);
},
_returnResponse: function(a) {
var b = [];
a && (b = a, this.asynchGetAppDetailsPending && (this.asynchGetAppDetailsPending = !1, b = a.concat(this.partialAppDetails))), this.doGetAppList(b);
},
handleCatalogServerError: function(a, b, c, d) {
return this._returnResponse();
}
});

// source/magazine/app/ExpertReview.js

enyo.kind({
name: "enyo.FindApps.Magazine.ExpertReview",
kind: enyo.Control,
appIdViewIndexLookup: {},
create: function() {
this.inherited(arguments);
var a = this.appDetails.appDetailsKind || "enyo.FindApps.Magazine.BindableLayout";
this.createComponent({
owner: this,
name: "appDetailContainer",
kind: "Pane",
defaultKind: a
}), this._createAppDetailsPane();
},
_createAppDetailsPane: function() {
var a, b, c, d = this.appDetails.defaultTemplatePath || "", e = this.appDetails.apps || [], f = this.$.appDetailContainer;
for (a = 0; a < e.length; a++) b = e[a].appId, c = e[a].bindingPath, this.appIdViewIndexLookup[b] = a, f.createComponent({
owner: this,
templatePath: d,
bindingPath: c,
topLayout: !1
});
f.selectViewByIndex(0), this.render();
},
selectApp: function(a) {
var b = a.owner.$.expertReview, c = a.selectorImgStyle, d = a.owner.$.selectorImg;
d && c && d.setStyle(c);
var e = b.appIdViewIndexLookup[a.appId];
b.$.appDetailContainer.selectViewByIndex(e);
}
});

// source/magazine/services/EditionsMgrHelper.js

enyo.kind({
name: "enyo.FindApps.Magazine.EditionsMgrHelper",
kind: enyo.Component,
components: [ {
kind: "enyo.FindApps.Magazine.EditionsMgrService",
name: "editionsMgrService"
} ],
getEdition: function(a, b) {
a && b ? this.$.editionsMgrService.getEdition(a, b) : this.error("AC Country and device locale not available to trigger edition fetch");
}
});

// source/magazine/services/EditionsMgrService.js

enyo.kind({
name: "enyo.FindApps.Magazine.EditionsMgrService",
kind: "PalmService",
service: "palm://com.palm.activitymanager/",
getEdition: function(a, b) {
var c = {
name: "DownloadEditionActivity",
description: "This is the activity for downloading magazine edition",
callback: {
method: "palm://com.palm.appcatalog/getEdition",
params: {
acCountry: a,
locale: b
}
},
requirements: {
internet: !0
},
type: {
immediate: !0,
priority: "low"
}
}, d = {
activity: c,
start: !0,
replace: !0
}, e = {
method: "create",
onSuccess: "activityCreatedSuccess",
onFailure: "activityCreatedFailure"
};
this.call(d, e);
},
activityCreatedSuccess: function(a, b) {
this.log("activityCreatedSuccess: Edition downloaded activity started. Response: " + enyo.json.stringify(b));
},
activityCreatedFailure: function(a, b) {
this.error("activityCreatedFailure: Edition download activity could not be created. Response: " + enyo.json.stringify(b));
}
});

// source/AppCatalogWindow.js

enyo.kind({
name: "findApps.AppCatalogWindow",
kind: enyo.VFlexBox,
observers: {
resize: [],
orientationChanged: []
},
components: [ {
kind: "Scrim",
name: "scrim",
layoutKind: "VFlexLayout",
align: "center",
pack: "center",
components: [ {
kind: "SpinnerLarge",
name: "spinner",
showing: !1
} ]
}, {
kind: "ApplicationEvents",
onWindowParamsChange: "windowParamsChangeHandler",
onOpenAppMenu: "openAppMenu"
}, {
name: "appMenu",
kind: "AppMenu",
components: [ {
name: "accountOption",
caption: $L("Preferences & Accounts"),
onclick: "showPreferenceAccount"
}, {
name: "softwareManager",
caption: $L("Software Manager"),
onclick: "openSoftwareManager"
}, {
name: "helpMenu",
caption: $L("Help"),
onclick: "openHelpApp"
} ]
}, {
name: "pane",
kind: "Pane",
flex: 1,
onCreateView: "paneAddView",
onSelectView: "triggerReset",
components: [ {
kind: "findApps.LaunchView",
name: "findApps_LaunchView"
} ]
} ],
openAppMenu: function() {
return this.$.appMenu.validateComponents(), this.configureAppMenu(), this.$.appMenu.render(), this.$.appMenu.open(), !0;
},
configureAppMenu: function() {
var a = this.$.pane.view, b = {};
a.getAppMenuOptions && (b = a.getAppMenuOptions());
var c = this.$.appMenu.getControls();
c.forEach(function(a) {
if (b[a.name]) {
var c = b[a.name];
a.setDisabled(a.disabled), a.disabled ? a.addClass("enyo-disabled") : a.removeClass("enyo-disabled"), a.setShowing(a.show);
} else a.setShowing(!1);
});
},
create: function() {
enyo.VirtualScroller.prototype.accelerated = !0, enyo.keyboard.setResizesWindow(!1), findApps.ViewLibrary.setContainer(this), this.inherited(arguments), findApps.ViewLibrary.init(), enyo.application.sessionManager = new findApps.SessionManager, enyo.application.savedList = new findApps.SavedList, enyo.application.connectionManager = new findApps.ConnectionManager, enyo.application.connectionManager.monitor(), enyo.application.appdownloadManager = new findApps.AppDownloadManager, this.orientationChangeHandler(), this.launched = !1;
},
launchAppCat: function() {
this.showView(this.launchParams);
if (this.launched === !1) {
this.launched = !0;
var a = this;
setTimeout(function() {
enyo.application.sessionManager.triggerInitSession(a);
}, 10), setTimeout(function() {
enyo.application.appdownloadManager.init(), enyo.application.appdownloadManager.myAppsListIsReady() ? a.updateMyApps(null, enyo.application.appdownloadManager.MYAPPS_ALL) : enyo.application.appdownloadManager.attach(a), a.initGoogleAppMetrics(), enyo.application.connectionManager.getDataService(), a.$.appLists || a.createComponent({
name: "appLists",
kind: "findApps.AppLists",
owner: a
});
}, 20);
}
},
destroy: function() {
findApps.ViewLibrary.cleanup(), enyo.application.appdownloadManager.detach(this), this.inherited(arguments);
},
constructed: function() {
this.inherited(arguments), typeof HACKS != "undefined" && HACKS.HACK_ENYO_DEFAULT_GUI_EVENT_HANDLER(this);
},
windowParamsChangeHandler: function(a, b) {
var c = b.params;
c.modalMode === !0 && (this.modalId = c.modalId), this.launchParams = c, c.viewToLoad === "PROMOCODE" ? this.handlePromoCodeLaunch() : this.launchAppCat();
},
displayError: function(a) {
this.$.error || this.createComponent({
kind: "findApps.Error",
name: "error",
onSubmit: "submitError",
onCancel: "cancelError"
}), this.$.error.displayError(a);
},
receiveResponse: function(a, b, c) {
a === "userSession" && (enyo.application.sessionManager.removeListener(this, "userSession"), b || (c.push("LOC03004"), this.displayError(c))), enyo.windows.activate("", "main");
},
initGoogleAppMetrics: function() {
enyo.application.onDevice ? findApps.AccountServices.getInstance().getGoogleAnalyticsWebPropertyID({
onSuccess: "gotGooglePropertyId",
onFailure: "errorGooglePropertyId",
scope: this
}) : this.gotGooglePropertyId(null, null);
},
gotGooglePropertyId: function(a, b) {
var c;
if (AppCatalog.Config.DummyConfig) c = AppCatalog.Config.DummyConfig._googlePropertyId; else if (b.parameterInfos) for (var d = 0; d < b.parameterInfos.length; d++) if (b.parameterInfos[d]["key"] == "GOOGLE_ANALYTICS_WPID") {
c = b.parameterInfos[d].value;
break;
}
var e = new AppMetrics(c);
e.setInternetConnection(enyo.application.connectionManager.isOnline()), e.trackLaunch(enyo.fetchAppInfo().version), e.trackRegistration(enyo.fetchAppInfo().version), enyo.application.appMetrics = e;
},
errorGooglePropertyId: function(a, b) {
this.error("Error when fetching google Property ID: ", b);
},
setView: function(a) {
this.$.pane.selectViewByName(a);
var b = this.$[a + "_content"] || this.$[a];
return b;
},
validateView: function(a) {
this.$.pane.validateView(a);
var b = this.$[a + "_content"] || this.$[a];
return b;
},
paneAddView: function(a, b) {
var c = findApps.ViewLibrary._views[b], d = enyo.constructorForKind(c);
return {
name: b,
kind: c
};
},
hiddenLoadView: function(a) {
var b = this.validateView(a);
b.prefetch && b.prefetch();
},
prefetchViews: function(a) {
if (a) for (var b in a) this.hiddenLoadView(a[b]);
},
goBack: function(a, b) {
(!findApps.UserSession._session || findApps.UserSession._session == null) && enyo.application.sessionManager.triggerInitSession(this), enyo.application.appMetrics || this.initGoogleAppMetrics();
if (this.$.pane.getViewIndex() > 0) {
var c = !0;
while (c) {
var d = this.$.pane.view;
this.$.pane.back(b);
var e = this.$.pane.view;
d.id === "appCatalogWindow_FULLSCREENERROR" && e && e.refresh && e.refresh(), c = e.id === "appCatalogWindow_FULLSCREENERROR";
}
} else this.selectTopView();
var d = this.$.pane.view;
d.id === "appCatalogWindow_findApps_LaunchView" && this.showView(this.launchParams);
},
popViewsFromHistory: function(a) {
if (a && a > 0) while (a > 0) {
var b = this.$.pane.history.pop();
a--;
}
},
selectTopView: function() {
this.$.pane.selectViewByIndex(0);
},
isTopView: function(a) {
var b = !1, c = this.$.pane.view;
if (a) if (c.id === "appCatalogWindow_FULLSCREENERROR") {
var d = this.$.pane.views, e = d && enyo.isArray(d) && d[d.length - 1] && d[d.length - 1];
this.log("Previous View: ", e && e.id, "View To Check: ", a.id, "Current View: ", c.id), b = a === e;
} else b = a === c;
return b;
},
isFirstPage: function() {
return this.$.pane.history.length && this.$.pane.history.length > 1 ? !1 : !0;
},
triggerReset: function(a, b, c) {
b.reset && b.reset();
},
showPreferenceAccount: function(a) {
var b = findApps.ViewLibrary.getView("PREFERENCES");
a && b.setParams(a);
},
openSoftwareManager: function() {
findApps.ApplicationManager.getInstance().launchApplication("com.palm.app.swmanager", "", "SWMLaunchSuccess", "SWMLaunchFailure");
},
SWMLaunchSuccess: function() {
this.log("SWMLaunchSuccess");
},
SWMLaunchFailure: function() {
this.log("SWMLaunchFailure");
},
openHelpApp: function() {
findApps.ApplicationManager.getInstance().launchApplication("com.palm.app.help", {
target: "http://help.palm.com/app_catalog/index.html"
}, "helpLaunchSuccess", "helpLaunchFailure");
},
helpLaunchSuccess: function() {
this.log("helpLaunchSuccess");
},
helpLaunchFailure: function() {
this.log("helpLaunchFailure");
},
updateMyApps: function(a, b) {
var c = enyo.application.appdownloadManager;
a === null && b == c.MYAPPS_ALL && c.myAppsListIsReady() && (this.verifySavedList(c.getMyApps()), enyo.application.appdownloadManager.detach(this));
},
verifySavedList: function(a) {
var b = [], c = enyo.application.savedList.getList();
c.forEach(function(c) {
a[c] || b.push(c);
});
var d = {
packageIds: b,
sort: "DATE_DESC"
};
d.packageIds.length > 0 && findApps.BaseServer.getACServer().getAppList(d, "SavedAppsService", {
onSuccess: "handleACServerResponse",
onFailure: "handleACServerFailure",
scope: this
});
},
updateSavedList: function(a, b) {
var c = [];
a > 1 ? b.forEach(function(a) {
c.push(a.publicApplicationId);
}) : a === 1 && c.push(b.publicApplicationId), enyo.application.savedList.updateList(c);
},
handleACServerResponse: function(a, b, c, d) {
if (d.service == "SavedAppsService") {
var e = b.OutGetAppList.appList, f = e.totalCount, g = e.appSummary;
this.updateSavedList(f, g);
}
},
handleACServerFailure: function(a, b, c, d, e) {
this.error("handleACServerFailure for service ", d.service);
},
registerObserver: function(a, b) {
this.observers[a].push(b);
},
sendEvent: function(a, b) {
var c, d = this.observers[a] || [];
for (c = 0; c < d.length; c++) d[c].update && d[c].update(a, b);
},
resizeHandler: function() {
this.inherited(arguments), this.sendEvent("resize", {
width: window.innerWidth,
height: window.innerHeight
}), this.orientationChangeHandler();
},
orientationChangeHandler: function() {
var a = this.updateOrientation(window.innerWidth, window.innerHeight);
a == 1 && this.sendEvent("orientationChanged", {
orientation: this._orientation
});
},
updateOrientation: function(a, b) {
var c = a > b, d = !1;
return c == 1 ? (this._orientation && this._orientation != "landscape" ? d = !0 : this._orientation || (d = !0), this._orientation = "landscape") : (this._orientation && this._orientation != "portrait" ? d = !0 : this._orientation || (d = !0), this._orientation = "portrait"), d;
},
showView: function(a) {
this.launchParams = a;
var b = this.$.pane.view;
if (b && b.id === "appCatalogWindow_FULLSCREENERROR") return;
var c = a.viewToLoad;
switch (c) {
case "COUNTRYPICKER":
var d = findApps.ViewLibrary.getView("COUNTRYPICKER");
d.setParams(a);
break;
case "TERMSCONDITIONS":
var e = findApps.ViewLibrary.getView("TERMSCONDITIONS");
e.setParams(a);
break;
case "SEARCHAPPS":
var f = findApps.ViewLibrary.getView("SEARCHAPPS");
f.setParams(a);
break;
case "APPDETAILS":
var g = findApps.ViewLibrary.getView("APPDETAILS");
g.setAppItem(a);
break;
case "PREFERENCES":
this.$.closeModal || this.createComponent({
name: "closeModal",
kind: "PalmService",
service: "palm://com.palm.systemmanager/",
method: "dismissModalApp",
onSuccess: "doNothing",
onFailure: "handleError",
subscribe: !0
});
var h = this.showPreferenceAccount(a);
break;
case "PROMOCODE":
this.handlePromoCodeLaunch();
break;
case "BROWSER":
var i = findApps.ViewLibrary.getView("BROWSER"), j = this;
setTimeout(function() {
j.prefetchViews([ "MAGAZINE", "SAVEDAPPS", "SEARCHAPPS" ]);
}, 30);
break;
case "default":
case "MAGAZINE":
default:
var k = findApps.ViewLibrary.getView("MAGAZINE"), j = this;
setTimeout(function() {
j.prefetchViews([ "BROWSER", "SAVEDAPPS", "SEARCHAPPS" ]);
}, 30);
}
},
closeModalAndExit: function(a) {
a && this.modalId && (a.subscribe = !0, a.callerId = this.appId, a.launchId = "com.palm.app.enyo-findapps", a.modalId = this.modalId, this.$.closeModal.call(a));
},
doNothing: function() {},
handleError: function(a, b) {},
showScrim: function() {
this.$.scrim.show(), this.$.spinner.setShowing(!0);
},
hideScrim: function() {
this.$.scrim.hide(), this.$.spinner.setShowing(!1);
},
handlePromoCodeLaunch: function() {
var a = this.$.pane.view;
a.id !== "appCatalogWindow_findApps_LaunchView" && this.showScrim();
var b = this.launchParams;
enyo.setCookie("findapps.promocode", b.promoCode), findApps.UserProfile.promoLink = !0, b.promoCode.length > 0 && findApps.BaseServer.getPMTServer().getCodeInfos(b.promoCode, "codeInfosService", {
onSuccess: "handlePaymentResp",
onFailure: "handlePaymentError",
scope: this
});
},
handlePaymentResp: function(a, b, c, d) {
if (b.OutGetPromoCodeInfos) {
var e = b.OutGetPromoCodeInfos.campaignType, f = b.OutGetPromoCodeInfos.amount, g = b.OutGetPromoCodeInfos.validTo, h = b.OutGetPromoCodeInfos.validFrom, i = b.OutGetPromoCodeInfos.campaignStatus, j = b.OutGetPromoCodeInfos.status;
if (b.OutGetPromoCodeInfos.items) var k = b.OutGetPromoCodeInfos.items[0].id;
var l = function(a, b) {
var c = !0, d = function(a) {
if (!a || a.length < 8) return new Date;
var b = a.substr(0, 4), c = a.substr(4, 2), d = a.substr(6, 2), e = a.substr(8, 2), f = a.substr(10, 2), g = a.substr(12, 2), h = new Date(b, c - 1, d, e, f, g), i = h.getTime(), j = new Date;
return localOffset = j.getTimezoneOffset() * 6e4, new Date(i - localOffset);
}, e = d(a), f = new Date, g = d(b);
if (g < e || f < e || f > g) c = !1;
return c;
}, m = function(a) {
if (!a || a.length < 8) return "";
var b = a.substr(0, 4), c = a.substr(4, 2), d = a.substr(6, 2), e = a.substr(8, 2), f = a.substr(10, 2), g = a.substr(12, 2), h = new Date(b, c - 1, d, e, f, g), i = h.getTime(), j = new Date;
localOffset = j.getTimezoneOffset() * 6e4;
var k = new Date(i - localOffset), l = findApps.Utilities.Formatter.formatLongDate(k);
return l;
};
if (e === "GP") {
var n = {
viewToLoad: "BROWSER"
};
enyo.mixin(this.launchParams, n);
if (i === "A" && j === "A") {
var o = $L("This Promo Code is valid until ") + m(g);
l(h, g) || (o = $L("This promo code is invalid (expired or other reason)."), enyo.setCookie("findapps.promocode", ""));
} else {
var o = $L("Invalid promo code or campaign.");
j !== "A" ? o = $L("This promo code is invalid (redeemed or other reason).") : i !== "A" && (o = $L("This promo code related campaign is invalid (expired or other reason).")), enyo.setCookie("findapps.promocode", "");
}
} else if (e === "AP" || e === "AJ" || e === "AD") {
var n = {
viewToLoad: "APPDETAILS",
id: "",
publicApplicationId: k
};
enyo.mixin(this.launchParams, n);
if (i === "A" && j === "A") var o = $L("This Promo Code is valid until ") + m(g); else {
var o = $L("Invalid promo code or campaign.");
j != "A" ? o = $L("This promo code is invalid (redeemed or other reason).") : i != "A" && (o = $L("This promo code related campaign is invalid (expired or other reason).")), enyo.setCookie("findapps.promocode", "");
}
}
this.hideScrim(), this.openPromoCodeNotifyPopup(o), this.launchAppCat();
}
},
handlePaymentError: function(a, b, c, d, e) {
enyo.setCookie("findapps.promocode", ""), this.hideScrim(), e.push("LOC03010"), this.displayError(e), this.launchParams.viewToLoad = "default", this.launchAppCat();
},
openPromoCodeNotifyPopup: function(a) {
this.$.PromoCodeNotify || this.createComponent({
name: "PromoCodeNotify",
kind: "Popup",
scrim: !0,
modal: !0,
width: "400px",
components: [ {
style: "padding: 8px;",
content: $L("Promo Code")
}, {
kind: "Spacer"
}, {
name: "promoNotification",
style: "padding: 6px;",
content: "none"
}, {
kind: "VFlexBox",
style: "padding-top: 6px;",
components: [ {
kind: "Button",
caption: $L("OK"),
onclick: "closePopup"
} ]
} ]
}), this.$.PromoCodeNotify.openAtCenter(), this.$.promoNotification.setContent(a);
},
closePopup: function(a) {
this.$.PromoCodeNotify.close();
}
});
