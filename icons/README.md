# Pretext — brand assets

Brand colour: #FF6C7F

## Files
- `pretext.ico` — Windows app/exe icon. Multi-resolution (16, 24, 32, 48, 64, 128, 256). Uses a simplified mark at 16-32px and the detailed mark at 48px+.
- `pretext.icns` — macOS app icon (if you build a mac target).
- `png/icon-1024.png` — master square icon; Linux builds and regenerating other formats.
- `png/icon-{16..1024}.png` — individual square icons (taskbar, tray, installer, etc.).
- `png/lockup.png` — horizontal icon + wordmark (splash, about box, website, readme).
- `png/wordmark.png` — wordmark only.
- `svg/` — editable vector sources for all of the above.

## Electron / electron-builder
Point the build at the platform icons:

```json
"build": {
  "win":   { "icon": "build/pretext.ico" },
  "mac":   { "icon": "build/pretext.icns" },
  "linux": { "icon": "build/png/icon-512.png" }
}
```

For the BrowserWindow / taskbar at runtime:

```js
new BrowserWindow({ icon: path.join(__dirname, 'png/icon-256.png') })
```

Tip: keep the .ico for the .exe — Windows reads icon sizes straight from it, so
the small-size variant shows automatically in the taskbar and title bar.
