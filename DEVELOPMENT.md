# Research Paper Downloader - Development Guide

## 📖 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Code Structure](#code-structure)
4. [Extension APIs](#extension-apis)
5. [Adding Features](#adding-features)
6. [Testing & Debugging](#testing--debugging)
7. [Performance Optimization](#performance-optimization)
8. [Security Best Practices](#security-best-practices)

## Architecture Overview

### Extension Flow

```
User Opens Academic Paper
         ↓
Content Script Injects Download Button
         ↓
User Clicks "Download Paper" or Source Button
         ↓
Popup Detects DOI via getDoi() Function
         ↓
Background Service Worker Processes Request
         ↓
New Tab Opens with Download Link
```

### Component Communication

```
┌─────────────┐
│   Popup     │ (User Interface)
└──────┬──────┘
       │ chrome.tabs.query()
       │ chrome.scripting.executeScript()
       ↓
┌─────────────────────┐
│ Content Script      │ (Page Injection)
└──────┬──────────────┘
       │ getDoi() -> DOI from page
       │
       ↓
┌──────────────────────┐
│ Background Service   │ (Logic & Storage)
│ Worker               │
└──────────────────────┘
```

## Development Setup

### Prerequisites
```bash
- Chrome/Brave/Edge browser (latest version)
- Text editor or IDE (VS Code recommended)
- Git for version control
- Basic JavaScript knowledge
```

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd research-paper-downloader
```

2. **Load in browser**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension folder

3. **Enable Development Features**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Check for any initialization messages

## Code Structure

### Directory Organization
```
extension/
├── manifest.json          # Extension metadata & permissions
├── popup.html            # Popup UI template
├── popup.js              # Popup logic (300 lines)
├── popup-styles.css      # Popup styling
├── content-script.js     # Page injection (350 lines)
├── background.js         # Service worker (180 lines)
├── options.html          # Settings page
├── options.js            # Settings logic
├── content.css           # Injected element styles
└── icons/                # Icons for different sizes
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    ├── icon-64.png
    ├── icon-96.png
    └── icon-128.png
```

### File Size Targets (for performance)
- `popup.js`: < 400 lines
- `content-script.js`: < 400 lines
- `background.js`: < 200 lines
- Total bundle: < 2 MB

## Extension APIs

### chrome.storage API
```javascript
// Save data (persistent across sessions)
chrome.storage.sync.set({ key: value });

// Retrieve data
chrome.storage.sync.get('key', (result) => {
    console.log(result.key);
});

// Local storage (faster, not synced)
chrome.storage.local.set({ downloads: 42 });
```

### chrome.tabs API
```javascript
// Get active tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
});

// Create new tab
chrome.tabs.create({ url: 'https://example.com' });

// Execute script in tab
chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: myFunction
});
```

### chrome.runtime API
```javascript
// Send message from popup to content script
chrome.runtime.sendMessage({ action: 'getDoi' }, (response) => {
    console.log(response.doi);
});

// Listen for messages (in any script)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getDoi') {
        sendResponse({ doi: extractDoi() });
    }
});
```

## Adding Features

### Adding a New Download Source

**Step 1**: Update manifest.json
```json
{
  "host_permissions": [
    "https://newsource.com/*"  // Add if needed
  ]
}
```

**Step 2**: Add to SOURCES in popup.js
```javascript
const SOURCES = {
    scihub: 'https://sci-hub.se/',
    annas: 'https://annas-archive.li/scidb/',
    newsource: 'https://newsource.com/papers/',  // Add this
    // ... others
};
```

**Step 3**: Update downloadFromSource()
```javascript
case 'newsource':
    url = SOURCES.newsource + doi;
    break;
```

**Step 4**: Add UI button in popup.html
```html
<button class="source-btn" data-source="newsource" title="New Source">
    <span class="source-icon">🆕</span>
    <span>New Source</span>
</button>
```

### Adding Support for New Website

**Step 1**: Update manifest.json
```json
{
  "content_scripts": [
    {
      "matches": [
        "https://newsite.com/*"  // Add here
      ],
      "js": ["content-script.js"],
      "run_at": "document_end"
    }
  ]
}
```

**Step 2**: Add detection function in popup.js
```javascript
function findDoiFromNewsite() {
    if (currentUrl.indexOf('newsite.com') < 0) return null;
    
    // Method 1: Meta tag
    const metaTag = document.querySelector('meta[name="doi"]');
    if (metaTag) return metaTag.content;
    
    // Method 2: Text regex
    const match = document.body.innerHTML.match(/DOI:\s*(10\.\d+[^<\s]+)/);
    if (match) return match[1];
    
    // Method 3: Data attribute
    const dataEl = document.querySelector('[data-doi]');
    if (dataEl) return dataEl.getAttribute('data-doi');
    
    return null;
}
```

**Step 3**: Register in doiFinderFunctions array
```javascript
const doiFinderFunctions = [
    // ... existing
    { func: findDoiFromNewsite, name: "New Site" }
];
```

**Step 4**: Optimize injection in content-script.js
```javascript
function injectButtons() {
    const url = window.location.href;
    
    // New Site
    if (url.includes('newsite.com')) {
        const container = document.querySelector('.action-buttons');
        if (container) {
            const button = createDownloadButton();
            container.appendChild(button);
        }
    }
}
```

### Adding User Settings

**Step 1**: Add HTML in options.html
```html
<div class="setting-item">
    <div class="setting-label">
        <label for="newSetting">New Setting</label>
        <small>Description of the setting</small>
    </div>
    <div class="setting-control">
        <input type="text" id="newSetting" placeholder="Default value">
    </div>
</div>
```

**Step 2**: Load/save in options.js
```javascript
const DEFAULT_SETTINGS = {
    newSetting: 'default_value',
    // ... others
};

function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
        document.getElementById('newSetting').value = settings.newSetting;
    });
}

// Save handler
document.getElementById('newSetting').addEventListener('change', (e) => {
    saveSetting('newSetting', e.target.value);
});
```

**Step 3**: Use in popup.js
```javascript
chrome.storage.sync.get('newSetting', (result) => {
    const value = result.newSetting;
    // Use the setting
});
```

## Testing & Debugging

### Console Logging
```javascript
// In any script, messages appear in browser console
console.log('Normal log:', data);
console.warn('Warning:', issue);
console.error('Error:', problem);
```

### Viewing Logs

**Content Script**: F12 → Console
```
Right-click any webpage → Inspect → Console tab
```

**Popup**: F12 on popup (or use chrome extension debugging)
```
Right-click extension icon → Inspect popup
```

**Service Worker**: chrome://extensions/
```
Find extension → Details → "Service Worker" link under "Inspect views"
```

### Testing DOI Detection

```javascript
// In popup.js, test DOI extraction
console.log('Testing DOI detection...');
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: getDoi
    }, (results) => {
        console.log('Detected DOI:', results[0].result);
    });
});
```

### Debugging Content Scripts

```javascript
// In content-script.js
function injectButtons() {
    console.log('Current URL:', window.location.href);
    console.log('DOI found:', extractDoi());
    console.log('Injecting buttons...');
    // ... rest of code
}
```

### Reload Extension During Development

```javascript
// Quick reload (in console)
chrome.runtime.reload();

// Or manually:
// 1. Go to chrome://extensions/
// 2. Click refresh icon on extension
```

## Performance Optimization

### Minimize Content Script Execution

**DON'T** (runs on every page):
```javascript
// Bad: Heavy computation on every page
const papers = document.querySelectorAll('[data-doi]');
papers.forEach(paper => {
    // Complex processing
});
```

**DO** (conditional execution):
```javascript
// Good: Only run on supported sites
const url = window.location.href;
if (!url.match(/ieeexplore|arxiv|springer/)) return;

// Now do processing
const papers = document.querySelectorAll('[data-doi]');
papers.forEach(paper => {
    // Complex processing
});
```

### Optimize DOI Detection

```javascript
// DON'T: Check all meta tags every time
function findDoi() {
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach(tag => {
        // Search through all
    });
}

// DO: Check specific meta tags
function findDoi() {
    const doiTag = document.querySelector('meta[name="citation_doi"]');
    if (doiTag) return doiTag.content;
    
    // If not found, try others
    const altTag = document.querySelector('meta[name="doi"]');
    if (altTag) return altTag.content;
}
```

### Lazy Load Non-Critical Code

```javascript
// Only load ratings code when needed
document.getElementById('rating').addEventListener('click', () => {
    // Load rating code here
});
```

### Cache Frequently Used Data

```javascript
// In popup.js
let cachedDoi = null;

function getCachedDoi() {
    if (cachedDoi) return cachedDoi;
    // Fetch DOI
    cachedDoi = result;
    return cachedDoi;
}
```

## Security Best Practices

### Content Security Policy

Manifest.json already includes CSP:
```json
"content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
}
```

**This prevents**:
- Inline scripts
- External script injection
- XSS attacks

### Input Validation

```javascript
// ALWAYS validate user input
function downloadFromSource(doi, source) {
    // Validate DOI format
    if (!doi || typeof doi !== 'string') {
        showStatus('Invalid DOI', 'error');
        return;
    }
    
    // Validate source
    const validSources = Object.keys(SOURCES);
    if (!validSources.includes(source)) {
        showStatus('Invalid source', 'error');
        return;
    }
    
    // Proceed safely
}
```

### Safe DOM Manipulation

```javascript
// DON'T: Use innerHTML (XSS risk)
button.innerHTML = userInput;

// DO: Use textContent or createElement
button.textContent = userInput;
// OR
const newButton = document.createElement('button');
newButton.textContent = userInput;
```

### Secure Storage

```javascript
// DON'T: Store sensitive data in local storage
localStorage.setItem('password', userPassword);

// DO: Use chrome.storage with encryption for sensitive data
// For this extension, we only store non-sensitive preferences
chrome.storage.sync.set({ userPreference: value });
```

### Origin Verification

```javascript
// Verify messages come from expected origin
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Check sender
    if (sender.url.indexOf('chrome-extension://') !== 0) {
        return; // Ignore external messages
    }
    
    // Process message
});
```

## Version Management

### Updating manifest.json version
```json
{
  "version": "1.0.0"  // Update when releasing
}
```

**Semantic Versioning**:
- `1.0.0` = MAJOR.MINOR.PATCH
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

### Changelog Format

```
## [1.0.0] - 2025-02-07
### Added
- Initial release
- Support for IEEE, Springer, ScienceDirect
- One-click download functionality
- Multiple source selection

### Fixed
- DOI detection for common academic sites

### Security
- Implemented Content Security Policy
- Input validation on all user actions
```

## Common Development Tasks

### Task: Add Support for ResearchGate

1. **Check if DOI is available** on ResearchGate pages
2. **Add detection function**:
```javascript
function findDoiFromResearchGate() {
    const doiLink = document.querySelector('a[href*="doi.org"]');
    if (doiLink) {
        const match = doiLink.href.match(/doi\.org\/([^\s]+)/);
        return match ? match[1] : null;
    }
}
```

3. **Register in doiFinderFunctions**
4. **Update manifest if needed**
5. **Test thoroughly**

### Task: Implement Custom Download Timeout

```javascript
function downloadWithTimeout(url, timeout = 5000) {
    const timer = setTimeout(() => {
        showStatus('Download timed out', 'error');
    }, timeout);
    
    chrome.tabs.create({ url: url }, () => {
        clearTimeout(timer);
    });
}
```

### Task: Add Analytics

```javascript
// Track feature usage (privacy-respecting)
function trackFeature(featureName) {
    chrome.storage.local.get('analytics', (result) => {
        const analytics = result.analytics || {};
        analytics[featureName] = (analytics[featureName] || 0) + 1;
        chrome.storage.local.set({ analytics });
    });
}

// Usage
trackFeature('download_scihub');
```

## References

### Chrome Extension APIs
- [Chrome Tabs API](https://developer.chrome.com/docs/extensions/reference/tabs/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Chrome Scripting API](https://developer.chrome.com/docs/extensions/reference/scripting/)

### Manifest V3
- [MV3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/mv2-migration/)
- [Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)

### Web Standards
- [MDN Web Docs](https://developer.mozilla.org/)
- [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)

---

**Happy developing! 🚀**
