// Able God College desktop app: a window around the live portal, so portal updates arrive without a new install.
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

const { url } = require("./app-config.json");
const portalOrigin = new URL(url).origin;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let win;
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    win = new BrowserWindow({
      width: 1280,
      height: 820,
      minWidth: 900,
      minHeight: 600,
      title: "Able God College",
      icon: path.join(__dirname, "icon.png"),
      backgroundColor: "#ffffff",
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
    });
    win.loadURL(url);
    // Anything outside the portal (WhatsApp links, maps, other sites) opens in the normal browser.
    win.webContents.setWindowOpenHandler(({ url: target }) => {
      if (new URL(target).origin !== portalOrigin) shell.openExternal(target);
      else win.loadURL(target);
      return { action: "deny" };
    });
    win.webContents.on("will-navigate", (event, target) => {
      if (new URL(target).origin !== portalOrigin) {
        event.preventDefault();
        shell.openExternal(target);
      }
    });
  });

  app.on("window-all-closed", () => app.quit());
}
