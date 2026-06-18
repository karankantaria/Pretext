import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC } from '../shared/types'
import type { PretextApi } from '../shared/types'

// Typed bridge implementing the PretextApi contract over ipcRenderer.invoke.
const api: PretextApi = {
  library: {
    list: () => ipcRenderer.invoke(IPC.libraryList),
    add: () => ipcRenderer.invoke(IPC.libraryAdd),
    addPath: (filePath) => ipcRenderer.invoke(IPC.libraryAddPath, filePath),
    remove: (id) => ipcRenderer.invoke(IPC.libraryRemove, id),
    setShelf: (id, shelf) => ipcRenderer.invoke(IPC.librarySetShelf, id, shelf)
  },
  book: {
    open: (id) => ipcRenderer.invoke(IPC.bookOpen, id)
  },
  progress: {
    save: (id, position) => ipcRenderer.invoke(IPC.progressSave, id, position)
  }
}

// Use `contextBridge` to expose APIs to the renderer only if context isolation
// is enabled, otherwise just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
