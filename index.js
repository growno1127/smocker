'use strict';

/**
 * Dependencies
 */
var pathtoRegexp = require('path-to-regexp');

/**
 * Expose public API
 */
module.exports = mock;
mock.get       = defineRoute.bind(null, 'GET');
mock.post      = defineRoute.bind(null, 'POST');
mock.put       = defineRoute.bind(null, 'PUT');
mock.del       = defineRoute.bind(null, 'DELETE');
/**
 * List of registred callbacks
 */
var callbacks = [];

/**
 * Mock
 */
function mock(superagent) {
  var SuperRequest = superagent.Request;
  var oldGet = superagent.get;
  var oldEnd = SuperRequest.prototype.end;
  var match;
  superagent.get = function (url, data, fn) {
    match = dispatch('GET', url);
    return match
      ? superagent('GET', url, data, fn)
      : oldGet.call(this, url, data, fn);
  };
  superagent.post = function (url, data, fn) {
    match = dispatch('POST', url, data);
    return match
      ? superagent('POST', url, data, fn)
      : oldGet.call(this, url, data, fn);
  };
  superagent.put = function (url, data, fn) {
    match = dispatch('PUT', url, data);
    return match
      ? superagent('PUT', url, data, fn)
      : oldGet.call(this, url, data, fn);
  };
  superagent.del = function (url, data, fn) {
    match = dispatch('DELETE', url, data);
    return match
      ? superagent('DELETE', url, data, fn)
      : oldGet.call(this, url, data, fn);
  };
  SuperRequest.prototype.end = function(cb) {
    cb(null, match && match());
  };
  return mock; // chaining
}

function dispatch(method, url, data) {
  var match;
  var i = callbacks.length;
  callbacks.forEach(function(callback) {
    var m = callbacks[i-1].match(method, url, data);
    if (m) match = m;
  });
  return match;
}

/**
 * Register url and callback for `get`
 */
function defineRoute(method, url, callback) {
  callbacks.push(new Route({
    url: url,
    callback: callback,
    method: method
  }));
  return mock;
}

/**
 * Route with given url
 */
var Route = function Route(state) {
  this.url    = state.url;
  this.fn     = state.callback;
  this.method = state.method;
  this.regexp = pathtoRegexp(this.url, this.keys = []);
};

/**
 * Match route with given url
 */
Route.prototype.match = function(method, url, body) {
  if (this.method !== method) return false;
  var params = {};
  var m = this.regexp.exec(url);
  if (!m) return false;
  for (var i = 1, len = m.length; i < len; ++i) {
    var key = this.keys[i - 1];
    var val = m[i];
    if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
      params[key.name] = val;
    }
  }
  var route = this;
  return function() {
    return route.fn({
      url: url,
      params: params || {},
      body: body || {}
    });
  };
};
