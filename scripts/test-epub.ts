// Standalone harness to exercise the EPUB parser outside Electron.
// Bundled with esbuild and run via node — see the npm-less invocation in chat.
import { parseEpubMeta, parseEpubChapters } from '../src/main/epub'

const file = process.argv[2]
if (!file) throw new Error('usage: test-epub <path-to-epub>')

const meta = await parseEpubMeta(file)
console.log('=== META ===')
console.log('title :', meta.title)
console.log('author:', meta.author)
console.log('chapters (spine):', meta.chapterCount)
console.log('cover :', meta.coverDataUrl ? `${meta.coverDataUrl.slice(0, 40)}... (${meta.coverDataUrl.length} chars)` : 'none')

const chapters = await parseEpubChapters(file)
console.log('\n=== CHAPTERS (non-empty):', chapters.length, '===')
const totalChars = chapters.reduce((n, c) => n + c.text.length, 0)
console.log('total prose chars:', totalChars.toLocaleString())
for (const [i, c] of chapters.slice(0, 6).entries()) {
  console.log(`\n[${i}] "${c.title}" — ${c.text.length} chars`)
  console.log('   ', JSON.stringify(c.text.slice(0, 160)))
}
