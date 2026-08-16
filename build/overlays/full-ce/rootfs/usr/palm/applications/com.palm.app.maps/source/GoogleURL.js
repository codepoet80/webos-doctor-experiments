// Ported from com.palm.app.maps v3.1.32
// Parses Google Maps URLs passed via the target launch parameter.
// Handles: q (search), sll (coordinates), near/hnear (location), saddr/daddr (route)

function GoogleURL(url) {
  var self = this;
  var parsed = parseUri(url);

  self.__defineGetter__("search", function() {
    var query = clean(parsed.queryKey.q);
    if (query) {
      // Strip "loc:near ..." suffix added by some apps (e.g. Yelp)
      var locNear = query.search("loc:near");
      if (locNear > 0) {
        query = query.substring(0, locNear - 1);
      }
    }
    return query;
  });

  self.__defineGetter__("coordinates", function() {
    var parsedCoords = clean(parsed.queryKey.sll);
    if (parsedCoords) {
      parsedCoords = parsedCoords.split(',');
      return {latitude: parseFloat(parsedCoords[0]), longitude: parseFloat(parsedCoords[1])};
    }
    return null;
  });

  self.__defineGetter__("near", function() {
    return clean(parsed.queryKey.near) || clean(parsed.queryKey.hnear);
  });

  self.__defineGetter__("routeRequest", function() {
    var route = {};
    route.start = clean(parsed.queryKey.saddr);
    route.end   = clean(parsed.queryKey.daddr);
    if (route.start === undefined && route.end === undefined) {
      return null;
    }
    return route;
  });

  return self;

  function clean(str) {
    if (str === undefined) {
      return str;
    }
    return decodeURIComponent(str).replace(/\+/g, " ");
  }
}
