// IPC handlers: the bridge between the renderer's `window.api` calls and the
// main-process reader engine (epub parsing + library/progress store).

import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC } from '../shared/types'
import type { OpenedBook, ReadingPosition, Shelf } from '../shared/types'
import { parseEpubChapters, parseEpubMeta } from './epub'
import { lookupWord } from './dictionary'
import {
  addBookByPath,
  getBook,
  listBooks,
  removeBook,
  saveProgress,
  setShelf
} from './library'

export function registerIpc(): void {
  ipcMain.handle(IPC.libraryList, () => listBooks())

  ipcMain.handle(IPC.libraryAdd, async () => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const result = await dialog.showOpenDialog(win, {
      title: 'Add EPUB books',
      filters: [{ name: 'EPUB books', extensions: ['epub'] }],
      properties: ['openFile', 'multiSelections']
    })
    if (result.canceled) return listBooks()
    let views = await listBooks()
    for (const filePath of result.filePaths) {
      views = await addBookByPath(filePath)
    }
    return views
  })

  ipcMain.handle(IPC.libraryAddPath, (_e, filePath: string) => addBookByPath(filePath))

  ipcMain.handle(IPC.libraryRemove, (_e, id: string) => removeBook(id))

  ipcMain.handle(IPC.librarySetShelf, (_e, id: string, shelf: Shelf | null) =>
    setShelf(id, shelf)
  )

  ipcMain.handle(IPC.bookOpen, async (_e, id: string): Promise<OpenedBook> => {
    const book = await getBook(id)
    if (!book) throw new Error(`Book not found: ${id}`)
    const [meta, chapters] = await Promise.all([
      parseEpubMeta(book.filePath),
      parseEpubChapters(book.filePath)
    ])
    return { id, meta, chapters, position: book.position }
  })

  ipcMain.handle(
    IPC.progressSave,
    (_e, id: string, position: Omit<ReadingPosition, 'updatedAt'>, atEnd: boolean) =>
      saveProgress(id, position, atEnd)
  )

  ipcMain.handle(IPC.dictLookup, (_e, word: string) => lookupWord(word))
}
