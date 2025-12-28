# YouTube Shorts Auto-Scroll

A browser extension that automatically scrolls to the next video when a YouTube Short ends.

## Features

- ✅ Automatically scrolls to the next video when a YouTube Short finishes
- ✅ Prevents video looping
- ✅ Works with YouTube's dynamic content loading
- ✅ Compatible with Chrome and Firefox

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm

### Setup

```bash
npm install
```

### Build

Build for Chrome:
```bash
npm run build:chrome
```

Build for Firefox:
```bash
npm run build:firefox
```

Build for both:
```bash
npm run build:all
```

### Package

Create ZIP files for distribution:
```bash
npm run package:all
```

The ZIP files will be created in the `dist/` directory.

## Installation (Development)

### Chrome/Chromium

1. Build the extension: `npm run build:chrome`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/chrome` directory

### Firefox

1. Build the extension: `npm run build:firefox`
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from `dist/firefox`

## Project Structure

```
.
├── content.js              # Main content script
├── manifest.chrome.json    # Chrome manifest (Manifest V3)
├── manifest.firefox.json     # Firefox manifest (Manifest V2)
├── package.json            # npm configuration
├── scripts/
│   └── build.js           # Build script
├── dist/                   # Build output (gitignored)
└── icons/                  # Extension icons (to be added)
```

## License

MIT

