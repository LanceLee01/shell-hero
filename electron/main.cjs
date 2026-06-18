const { app, BrowserWindow } = require("electron")
const path = require("path")

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 640,
    minHeight: 360,
    resizable: true,
    fullscreenable: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  mainWindow.setBackgroundColor("#000000")
  mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))

  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools()
  }
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  app.quit()
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
