import { app, shell, BrowserWindow, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import splashHtml from '../../resources/splash.html?asset'
import { registerIpc } from './ipc'
import { seedFromDir } from './library'
import { IPC } from '../shared/types'

/** How long the animated splash stays up before revealing the main window. */
const SPLASH_MS = 2500

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 640,
    show: false,
    backgroundColor: '#0a0e14',
    autoHideMenuBar: true,
    ...(process.platform !== 'darwin' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

/** Frameless, transparent splash window that plays the branded boot animation. */
function createSplash(): BrowserWindow {
  const splash = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    center: true,
    show: false
  })
  splash.once('ready-to-show', () => splash.show())
  splash.loadFile(splashHtml)
  return splash
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.pretext.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Wire the reader-engine IPC handlers (library, book open, progress).
  registerIpc()

  // In dev, auto-import any .epub dropped in the project root for quick testing.
  if (is.dev) {
    seedFromDir(process.cwd())
  }

  // Boot splash → reveal the main window once it's ready and the splash has had
  // time to play its animation.
  const splash = createSplash()
  const mainWindow = createWindow()
  const startedAt = Date.now()
  mainWindow.once('ready-to-show', () => {
    const wait = Math.max(0, SPLASH_MS - (Date.now() - startedAt))
    setTimeout(() => {
      mainWindow.show()
      if (!splash.isDestroyed()) splash.close()
    }, wait)
  })

  // Global panic hotkey: works even when the app isn't focused. Fires the same
  // in-window panic cover the renderer toggles on Escape.
  globalShortcut.register('F9', () => {
    const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed()) ?? mainWindow
    win?.webContents.send(IPC.panicTrigger)
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      const w = createWindow()
      w.once('ready-to-show', () => w.show())
    }
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
