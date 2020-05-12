const { app, BrowserWindow } = require('electron')
const path = require('path')
const homedir = require("os").homedir()
const settings = require("electron-settings")
const cssProcessor = require("./cssProcess")
const fs = require('fs-extra')
const url = require('url')
// const saveAs = require("./renderer").saveAs

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  console.log("here")
  if (!settings.has("filePath")) {
    settings.set("filePath.lastDir", homedir)
    settings.set("firstOpen",true)
  }
  if (!settings.has("project")) {
    settings.set("project.init", false)
  }
  if (!settings.has("unsaved")) {
    settings.set("saved", false)
  }
  if (!settings.has("defaultCSS")) {
    settings.set("defaultCSS.set", false)
    fs.copySync(path.join(__dirname, "katex"), path.join(app.getPath("userData"), "katex"))
    fs.copyFileSync(path.join(__dirname, "default.css"), path.join(app.getPath("userData"), "default.css"))
  }
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true
    },
    frame: true,
    icon: __dirname + "/LELogo.png"

  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  return mainWindow
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  let mainWindow = createWindow()
  let userData = app.getPath("userData")
  console.log(userData)
  // let css = fs.readFileSync(path.join(app.getPath("userData"), "default.css"), "utf8")
  let contents = mainWindow.webContents
  contents.on("did-finish-load", () => {
    // contents.insertCSS(css).then((value) => console.log("inserted"))
    contents.executeJavaScript('document.getElementById("defaultCSS").href="'+url.resolve(userData+"/", "default.css") + '";')
  })
  try {
    if (settings.get("project.init")) {
      let projectDir = settings.get("project.dir")
      cssProcessor(projectDir)
    }
  } catch (err) {
    console.log(err)
  }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  let projectDir = settings.get("project.dir")
  // try {
  // fs.rmdirSync(path.join(projectDir, "css", "temp"), {
  //   recursive: true
  // })} catch (err) {
  //   console.log("No Temp")
  // }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
