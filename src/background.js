// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from "path";
import url from "url";
import { app, Menu } from "electron";
import { devMenuTemplate } from "./menu/dev_menu_template";
import { editMenuTemplate } from "./menu/edit_menu_template";
import createWindow from "./helpers/window";

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";

let debug = false;

const setApplicationMenu = () => {
  const menus = [editMenuTemplate];
  if (env.name !== "production") {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== "production") {
  const userDataPath = app.getPath("userData");
  app.setPath("userData", `${userDataPath} (${env.name})`);
}

app.on("ready", () => {
  setApplicationMenu();

  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "app.html"),
      protocol: "file:",
      slashes: true
    })
  );

  if (env.name === "development") {
    mainWindow.openDevTools();
    debug = true;
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

const ipc = require('electron').ipcMain
const dialog = require('electron').dialog
let srcFile = "";
let srtFile = "";
let outFolder = "";

ipc.on('open-file-dialog-src', function (event) {
  const options = {
    title: 'Select Media File',
    properties: ['openFile'],
    filters: [
      { name: 'Media', 
	extensions: [
		'webm', 
		'flv', 
		'vob', 
		'ogv', 
		'ogg', 
		'avi', 
		'mov', 
		'qt', 
		'wmv', 
		'rm', 
		'mp4', 
		'm4p', 
		'm4v', 
		'mpg', 
		'mp2', 
		'mpeg', 
		'mpe', 
		'mpv', 
		'3gp', 
		'3g2', 
		'aa', 
		'aac', 
		'flac', 
		'm4a', 
		'mp3', 
		'oga', 
		'ra', 
		'raw', 
		'vox', 
		'wma', 
		'wav'
	] 
      } 
    ]
  }
  dialog.showOpenDialog(options, function (file) {
    if (file) { 
	srcFile = file[0];
	event.sender.send('selected-src-file', file)
    }
  })
})

ipc.on('open-file-dialog-srt', function (event) {
  const options = {
    title: 'Select SRT File',
    properties: ['openFile'],
    filters: [
      { name: 'SRT', 
	extensions: [
		'srt'
	] 
      } 
    ]
  }
  dialog.showOpenDialog(options, function (file) {
    if (file) {
	srtFile = file[0];
	event.sender.send('selected-srt-file', file)
    }
  })
})

ipc.on('open-file-dialog-out', function (event) {
  const options = {
    title: 'Select Output Folder',
    properties: ['openDirectory']
  }
  dialog.showOpenDialog(options, function (folder) {
    if (folder) {
	outFolder = folder[0];
	event.sender.send('selected-out-folder', folder)
    }
  })
})

ipc.on('process-media', function (event, outFormat) {
	console.log(srcFile,srtFile,outFolder,outFormat);
	let options = {
		file: srcFile,
		srt: srtFile,
		dir: outFolder,
		fmt: outFormat,
		verbose: debug,
		debug: debug
	}
	let processStatus = "Processing...";
	event.sender.send('process-status', processStatus)

        var parser = require('subtitles-parser');
        var path = require('path');
        var fs = require('fs');

        if (fs.existsSync(options.dir)) {

                var srtData = fs.readFileSync(options.srt,'utf8');
                if ( options.debug == true ) {
                        console.log(srtData);
                }
                var jsonSubs = parser.fromSrt(srtData);
                if ( options.debug == true ) {
                        console.log(jsonSubs);
                }

                const execSync = require('child_process').execSync;
                var total = Object.keys(jsonSubs).length
                jsonSubs.forEach(function (sub) {
                        /*
                         * ffmpeg -i BIG_FILE -acodec copy -ss START_TIME -to END_TIME LITTLE_FILE
                         */
                        processStatus = "Processing segment: "+sub.id+" of "+total;
			event.sender.send('process-status', processStatus);
                        console.log(processStatus);
			let loglevel = "-loglevel 8";
                        if ( options.verbose == true ) {
				loglevel = "-loglevel 24";
                        }
                        if ( options.debug == true ) {
                                console.log(sub);
				loglevel = "-loglevel 32";
                        }
                        var fileExt = path.extname(options.file);
                        if ( options.fmt ) {
                                fileExt = "."+options.fmt;
                        }
                        var newFile = path.basename(options.file,path.extname(options.file))+"-"+sub.id+fileExt;
                        var splitCmd = 'ffmpeg '+loglevel+' -hide_banner -i "'+options.file+'" -acodec copy -ss '+sub.startTime.replace(",",".")+' -to '+sub.endTime.replace(",",".")+' -y "'+options.dir+path.sep+newFile+'"';
                        if ( options.debug == true ) {
                                console.log(splitCmd);
                        }
                        var results = execSync(splitCmd).toString();
                        if ( options.verbose == true ) {
                                console.log(results);
                        }
                })
	}
})
