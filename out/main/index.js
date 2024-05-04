"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const express = require("express");
const socket_io = require("socket.io");
const node_http = require("node:http");
const helmet = require("helmet");
const net = require("net");
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var lib = { exports: {} };
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;
function toObject(val) {
  if (val === null || val === void 0) {
    throw new TypeError("Object.assign cannot be called with null or undefined");
  }
  return Object(val);
}
function shouldUseNative() {
  try {
    if (!Object.assign) {
      return false;
    }
    var test1 = new String("abc");
    test1[5] = "de";
    if (Object.getOwnPropertyNames(test1)[0] === "5") {
      return false;
    }
    var test2 = {};
    for (var i = 0; i < 10; i++) {
      test2["_" + String.fromCharCode(i)] = i;
    }
    var order2 = Object.getOwnPropertyNames(test2).map(function(n) {
      return test2[n];
    });
    if (order2.join("") !== "0123456789") {
      return false;
    }
    var test3 = {};
    "abcdefghijklmnopqrst".split("").forEach(function(letter) {
      test3[letter] = letter;
    });
    if (Object.keys(Object.assign({}, test3)).join("") !== "abcdefghijklmnopqrst") {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}
var objectAssign = shouldUseNative() ? Object.assign : function(target, source) {
  var from;
  var to = toObject(target);
  var symbols;
  for (var s = 1; s < arguments.length; s++) {
    from = Object(arguments[s]);
    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }
    if (getOwnPropertySymbols) {
      symbols = getOwnPropertySymbols(from);
      for (var i = 0; i < symbols.length; i++) {
        if (propIsEnumerable.call(from, symbols[i])) {
          to[symbols[i]] = from[symbols[i]];
        }
      }
    }
  }
  return to;
};
var vary$1 = { exports: {} };
/*!
 * vary
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */
vary$1.exports = vary;
vary$1.exports.append = append;
var FIELD_NAME_REGEXP = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
function append(header, field) {
  if (typeof header !== "string") {
    throw new TypeError("header argument is required");
  }
  if (!field) {
    throw new TypeError("field argument is required");
  }
  var fields = !Array.isArray(field) ? parse(String(field)) : field;
  for (var j = 0; j < fields.length; j++) {
    if (!FIELD_NAME_REGEXP.test(fields[j])) {
      throw new TypeError("field argument contains an invalid header name");
    }
  }
  if (header === "*") {
    return header;
  }
  var val = header;
  var vals = parse(header.toLowerCase());
  if (fields.indexOf("*") !== -1 || vals.indexOf("*") !== -1) {
    return "*";
  }
  for (var i = 0; i < fields.length; i++) {
    var fld = fields[i].toLowerCase();
    if (vals.indexOf(fld) === -1) {
      vals.push(fld);
      val = val ? val + ", " + fields[i] : fields[i];
    }
  }
  return val;
}
function parse(header) {
  var end = 0;
  var list = [];
  var start = 0;
  for (var i = 0, len = header.length; i < len; i++) {
    switch (header.charCodeAt(i)) {
      case 32:
        if (start === end) {
          start = end = i + 1;
        }
        break;
      case 44:
        list.push(header.substring(start, end));
        start = end = i + 1;
        break;
      default:
        end = i + 1;
        break;
    }
  }
  list.push(header.substring(start, end));
  return list;
}
function vary(res, field) {
  if (!res || !res.getHeader || !res.setHeader) {
    throw new TypeError("res argument is required");
  }
  var val = res.getHeader("Vary") || "";
  var header = Array.isArray(val) ? val.join(", ") : String(val);
  if (val = append(header, field)) {
    res.setHeader("Vary", val);
  }
}
var varyExports = vary$1.exports;
(function() {
  var assign = objectAssign;
  var vary2 = varyExports;
  var defaults = {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
  };
  function isString(s) {
    return typeof s === "string" || s instanceof String;
  }
  function isOriginAllowed(origin, allowedOrigin) {
    if (Array.isArray(allowedOrigin)) {
      for (var i = 0; i < allowedOrigin.length; ++i) {
        if (isOriginAllowed(origin, allowedOrigin[i])) {
          return true;
        }
      }
      return false;
    } else if (isString(allowedOrigin)) {
      return origin === allowedOrigin;
    } else if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    } else {
      return !!allowedOrigin;
    }
  }
  function configureOrigin(options, req) {
    var requestOrigin = req.headers.origin, headers = [], isAllowed;
    if (!options.origin || options.origin === "*") {
      headers.push([{
        key: "Access-Control-Allow-Origin",
        value: "*"
      }]);
    } else if (isString(options.origin)) {
      headers.push([{
        key: "Access-Control-Allow-Origin",
        value: options.origin
      }]);
      headers.push([{
        key: "Vary",
        value: "Origin"
      }]);
    } else {
      isAllowed = isOriginAllowed(requestOrigin, options.origin);
      headers.push([{
        key: "Access-Control-Allow-Origin",
        value: isAllowed ? requestOrigin : false
      }]);
      headers.push([{
        key: "Vary",
        value: "Origin"
      }]);
    }
    return headers;
  }
  function configureMethods(options) {
    var methods = options.methods;
    if (methods.join) {
      methods = options.methods.join(",");
    }
    return {
      key: "Access-Control-Allow-Methods",
      value: methods
    };
  }
  function configureCredentials(options) {
    if (options.credentials === true) {
      return {
        key: "Access-Control-Allow-Credentials",
        value: "true"
      };
    }
    return null;
  }
  function configureAllowedHeaders(options, req) {
    var allowedHeaders = options.allowedHeaders || options.headers;
    var headers = [];
    if (!allowedHeaders) {
      allowedHeaders = req.headers["access-control-request-headers"];
      headers.push([{
        key: "Vary",
        value: "Access-Control-Request-Headers"
      }]);
    } else if (allowedHeaders.join) {
      allowedHeaders = allowedHeaders.join(",");
    }
    if (allowedHeaders && allowedHeaders.length) {
      headers.push([{
        key: "Access-Control-Allow-Headers",
        value: allowedHeaders
      }]);
    }
    return headers;
  }
  function configureExposedHeaders(options) {
    var headers = options.exposedHeaders;
    if (!headers) {
      return null;
    } else if (headers.join) {
      headers = headers.join(",");
    }
    if (headers && headers.length) {
      return {
        key: "Access-Control-Expose-Headers",
        value: headers
      };
    }
    return null;
  }
  function configureMaxAge(options) {
    var maxAge = (typeof options.maxAge === "number" || options.maxAge) && options.maxAge.toString();
    if (maxAge && maxAge.length) {
      return {
        key: "Access-Control-Max-Age",
        value: maxAge
      };
    }
    return null;
  }
  function applyHeaders(headers, res) {
    for (var i = 0, n = headers.length; i < n; i++) {
      var header = headers[i];
      if (header) {
        if (Array.isArray(header)) {
          applyHeaders(header, res);
        } else if (header.key === "Vary" && header.value) {
          vary2(res, header.value);
        } else if (header.value) {
          res.setHeader(header.key, header.value);
        }
      }
    }
  }
  function cors2(options, req, res, next) {
    var headers = [], method = req.method && req.method.toUpperCase && req.method.toUpperCase();
    if (method === "OPTIONS") {
      headers.push(configureOrigin(options, req));
      headers.push(configureCredentials(options));
      headers.push(configureMethods(options));
      headers.push(configureAllowedHeaders(options, req));
      headers.push(configureMaxAge(options));
      headers.push(configureExposedHeaders(options));
      applyHeaders(headers, res);
      if (options.preflightContinue) {
        next();
      } else {
        res.statusCode = options.optionsSuccessStatus;
        res.setHeader("Content-Length", "0");
        res.end();
      }
    } else {
      headers.push(configureOrigin(options, req));
      headers.push(configureCredentials(options));
      headers.push(configureExposedHeaders(options));
      applyHeaders(headers, res);
      next();
    }
  }
  function middlewareWrapper(o) {
    var optionsCallback = null;
    if (typeof o === "function") {
      optionsCallback = o;
    } else {
      optionsCallback = function(req, cb) {
        cb(null, o);
      };
    }
    return function corsMiddleware(req, res, next) {
      optionsCallback(req, function(err, options) {
        if (err) {
          next(err);
        } else {
          var corsOptions = assign({}, defaults, options);
          var originCallback = null;
          if (corsOptions.origin && typeof corsOptions.origin === "function") {
            originCallback = corsOptions.origin;
          } else if (corsOptions.origin) {
            originCallback = function(origin, cb) {
              cb(null, corsOptions.origin);
            };
          }
          if (originCallback) {
            originCallback(req.headers.origin, function(err2, origin) {
              if (err2 || !origin) {
                next(err2);
              } else {
                corsOptions.origin = origin;
                cors2(corsOptions, req, res, next);
              }
            });
          } else {
            next();
          }
        }
      });
    };
  }
  lib.exports = middlewareWrapper;
})();
var libExports = lib.exports;
const cors = /* @__PURE__ */ getDefaultExportFromCjs(libExports);
new net.Socket();
const socketHelper = (socket) => {
  socket.on("join-room", async (data) => data);
  socket.on("leave-room", async () => socket.disconnect());
};
const { log, error: logError } = console;
const whitelist = ["http://localhost:5173", "http://localhost:4172", "http://localhost:4030", "http://localhost:5030"];
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: [...whitelist], optionsSuccessStatus: 200, credentials: true }));
const server = node_http.createServer(app);
const io = new socket_io.Server(server, { cors: { origin: "*" } });
io.on("connection", (socket) => {
  log(`Connection to socketIO Ready ${socket.id}`);
  socketHelper(socket);
});
const dg = electron.dialog;
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "./assets/logo.ico"),
    // kiosk: true,
    webPreferences: {
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      enableBlinkFeatures: "WebContentsForceDark",
      experimentalFeatures: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true,
      webSecurity: false,
      contextIsolation: false
    },
    frame: false
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  electron.ipcMain.on("close", () => electron.app.quit());
  electron.ipcMain.on("minimize", () => mainWindow.minimize());
  mainWindow.maximize();
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  server.listen(4031, () => {
    createWindow();
  });
  server.on("error", (e) => log(e));
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0)
      createWindow();
  });
  dg.showErrorBox = (title, content) => ({ title, content });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
