"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const { log, error: logError } = console;
const api = {};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    logError(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
