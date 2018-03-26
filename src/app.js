import "./stylesheets/main.css";

// Small helpers you might want to keep
import "./helpers/context_menu.js";
import "./helpers/external_links.js";

// ----------------------------------------------------------------------------
// Everything below is just to show you how it works. You can delete all of it.
// ----------------------------------------------------------------------------

import { remote } from "electron";
import jetpack from "fs-jetpack";
import env from "env";

const app = remote.app;
const appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// files from disk like it's node.js! Welcome to Electron world :)
const manifest = appDir.read("package.json", "json");

const osMap = {
  win32: "Windows",
  darwin: "macOS",
  linux: "Linux"
};

document.querySelector("#app").style.display = "block";
document.querySelector("#greet").innerHTML = "Split Media by SRT";
document.querySelector("#os").innerHTML = osMap[process.platform];
document.querySelector("#author").innerHTML = manifest.author;
document.querySelector("#version").innerHTML = manifest.version;
document.querySelector("#env").innerHTML = env.name;
document.querySelector("#electron-version").innerHTML = process.versions.electron;

const ipc = require('electron').ipcRenderer

const selectSrcBtn = document.getElementById('select-src-file')

selectSrcBtn.addEventListener('click', function (event) {
  ipc.send('open-file-dialog-src')
})

ipc.on('selected-src-file', function (event, path) {
  document.getElementById('selected-src-file').innerHTML = `You selected: ${path}`
})

const selectSrtBtn = document.getElementById('select-srt-file')

selectSrtBtn.addEventListener('click', function (event) {
  ipc.send('open-file-dialog-srt')
})

ipc.on('selected-srt-file', function (event, path) {
  document.getElementById('selected-srt-file').innerHTML = `You selected: ${path}`
})

const selectDirBtn = document.getElementById('select-out-folder')

selectDirBtn.addEventListener('click', function (event) {
  ipc.send('open-file-dialog-out')
})

ipc.on('selected-out-folder', function (event, path) {
  document.getElementById('selected-out-folder').innerHTML = `You selected: ${path}`
})

const processBtn = document.getElementById('start-processing')

processBtn.addEventListener('click', function (event) {
  ipc.send('process-media', document.getElementById('select-out-format').value)
})

ipc.on('process-status', function (event, pstatus) {
  document.getElementById('processing-status').innerHTML = `${pstatus}`
})

