const { app, BrowserWindow } = require("electron")
const path = require("path")

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 480,
    minHeight: 340,
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
