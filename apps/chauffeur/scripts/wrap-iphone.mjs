/**
 * Post-build script: indpakker Expo web-appen i en iPhone 14 Pro CSS-ramme.
 * Kør efter: npx expo export --platform web
 */
import { readFileSync, writeFileSync } from 'fs'

const FILE = './dist/index.html'
let html = readFileSync(FILE, 'utf-8')

const CSS = `
  <style id="iphone-frame">
    html { height: 100%; margin: 0; padding: 0; }

    body {
      margin: 0;
      padding: 40px 24px;
      min-height: 100vh;
      box-sizing: border-box;
      overflow: auto !important;
      background: linear-gradient(160deg, #041c28 0%, #0B3950 55%, #0E4764 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, sans-serif;
    }
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
      background-size: 28px 28px;
      pointer-events: none;
      z-index: 0;
    }

    .demo-header {
      position: relative;
      z-index: 1;
      text-align: center;
      margin-bottom: 28px;
    }
    .demo-header p {
      margin: 0;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.3);
    }

    .iphone-outer {
      position: relative;
      z-index: 1;
      width: 417px;
      height: 876px;
      flex-shrink: 0;
      filter: drop-shadow(0 40px 80px rgba(0,0,0,0.7));
    }
    .iphone-body {
      position: absolute;
      inset: 0;
      background: #1A1A1C;
      border-radius: 52px;
      box-shadow: 0 0 0 1px #3A3A3C, inset 0 1px 0 rgba(255,255,255,0.07);
    }
    /* Mute + volume buttons (left) */
    .iphone-body::before {
      content: '';
      position: absolute;
      left: -3px;
      top: 116px;
      width: 3px;
      height: 26px;
      background: #3A3A3C;
      border-radius: 2px 0 0 2px;
      box-shadow: 0 44px 0 #3A3A3C, 0 94px 0 #3A3A3C;
    }
    /* Power button (right) */
    .iphone-body::after {
      content: '';
      position: absolute;
      right: -3px;
      top: 178px;
      width: 3px;
      height: 72px;
      background: #3A3A3C;
      border-radius: 0 2px 2px 0;
    }
    .iphone-screen {
      position: absolute;
      top: 12px;
      left: 12px;
      width: 393px;
      height: 852px;
      background: #000;
      border-radius: 42px;
      overflow: hidden;
    }
    /* Dynamic Island */
    .iphone-screen::before {
      content: '';
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      width: 126px;
      height: 37px;
      background: #000;
      border-radius: 20px;
      z-index: 9999;
      pointer-events: none;
    }
    /* Home indicator */
    .iphone-screen::after {
      content: '';
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: 134px;
      height: 5px;
      background: rgba(255,255,255,0.85);
      border-radius: 3px;
      z-index: 9999;
      pointer-events: none;
    }

    /* Override expo-reset: app fills the screen area */
    #root {
      position: absolute !important;
      inset: 0 !important;
      width: 393px !important;
      height: 852px !important;
      overflow: hidden !important;
    }

    .demo-footer {
      position: relative;
      z-index: 1;
      margin-top: 24px;
      font-size: 11px;
      color: rgba(255,255,255,0.18);
      text-align: center;
    }
  </style>
`

const HEADER = `
  <div class="demo-header"><p>Colas Chauff&oslash;r &mdash; Demo</p></div>
  <div class="iphone-outer">
    <div class="iphone-body"></div>
    <div class="iphone-screen">
`

const FOOTER = `
    </div>
  </div>
  <p class="demo-footer">&copy; 2026 Colas Danmark A/S</p>
`

// Inject CSS into <head>
html = html.replace('</head>', CSS + '</head>')

// Wrap #root with iPhone frame
html = html.replace('<div id="root"></div>', HEADER + '<div id="root"></div>' + FOOTER)

writeFileSync(FILE, html)
console.log('✓ iPhone frame injected into dist/index.html')
