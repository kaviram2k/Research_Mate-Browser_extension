# Research Mate- Browser Extension

A powerful Chrome/Chromium browser extension that enables one-click downloading of research papers from IEEE, Springer, ScienceDirect, arXiv, and other academic sources.

## 🎯 Features

### Core Features
- **One-Click Download**: Instantly download papers using multiple sources
- **Auto DOI Detection**: Automatically extracts DOI from academic websites
- **Multiple Sources**: Access Sci-Hub, Anna's Archive, arXiv, and DOI.org
- **Injected Buttons**: Download buttons directly on research paper pages
- **Custom Sources**: Configure custom download sources with placeholder support
- **Usage Statistics**: Track your downloads and favorite sources
- **Dark Mode Support**: Fully compatible with dark mode browsers

### Supported Websites
- IEEE Xplore (ieeexplore.ieee.org)
- arXiv (arxiv.org)
- ScienceDirect (sciencedirect.com)
- Springer (springer.com)
- Google Scholar (scholar.google.com)
- And many more through DOI detection

## 📦 Installation

### Method 1: Manual Installation (Development)

1. **Download the Extension**
   - Clone or download all extension files
   - Ensure you have all required files in your directory

2. **Load into Chrome/Brave/Edge**
   - Open your browser and go to `chrome://extensions/` (or `brave://extensions/`, etc.)
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the extension folder containing `manifest.json`

3. **Verify Installation**
   - You should see the extension appear in your extensions list
   - The extension icon should appear in your toolbar
   - Click the icon to open the popup

### Method 2: Production Installation
*(Coming soon on Chrome Web Store)*

## 🚀 Quick Start

### Basic Usage

1. **Visit a Research Paper**
   - Navigate to any academic paper (IEEE, Springer, arXiv, etc.)

2. **Click the Extension Icon**
   - Look for the "📚" icon in your browser toolbar
   - Click it to open the popup

3. **Download Options**

   **Option A: Quick Download**
   - Click "Download Paper" to use your default source
   - The paper will open in a new tab

   **Option B: Choose Source**
   - Click "Detect DOI" to identify the paper
   - Click one of the source buttons (Sci-Hub, Anna's Archive, etc.)
   - Select your preferred download location

### Keyboard Shortcuts
- `Ctrl + D`: Detect DOI on current page
- `Ctrl + Shift + D`: Quick download with default source

## ⚙️ Configuration

### Access Settings
1. Click the extension icon
2. Click the "⚙️ Settings" button
3. Customize your preferences

### Available Settings

**General Settings**
- Auto-detect DOI: Automatically identify papers
- Inject Download Buttons: Add buttons directly to websites
- Show Notifications: Display download confirmations

**Default Download Source**
- Sci-Hub: Fast, reliable academic paper repository
- Anna's Archive: Distributed open-source archive
- arXiv: Pre-prints and open-access papers
- DOI.org: Official DOI resolver

**Custom Sources**
- Add your own download sources
- Use `{doi}` as a placeholder for the DOI
- Example: `https://yourservice.com/papers/{doi}`

### Usage Statistics
- View total downloads
- See last download date
- Identify your favorite source
- Reset statistics anytime

## 📁 Project Structure

```
research-paper-downloader/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.js              # Popup functionality
├── popup-styles.css      # Popup styling
├── content-script.js     # Page injection logic
├── background.js         # Service worker
├── options.html          # Settings page
├── options.js            # Settings functionality
├── content.css           # Injected element styles
└── icons/                # Extension icons
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    ├── icon-64.png
    ├── icon-96.png
    └── icon-128.png
```

## 🔑 Key Components

### manifest.json
- Defines extension permissions and configuration
- Specifies which websites the extension can access
- Configures content scripts and background service worker

### popup.js & popup.html
- Main user interface
- DOI detection functionality
- Download source selection
- Settings shortcuts

### content-script.js
- Runs on academic websites
- Injects download buttons
- Detects DOI from page metadata
- Manages user interactions on the page

### background.js
- Handles extension-wide logic
- Manages storage and settings
- Tracks statistics
- Processes messages from other components

### options.html & options.js
- Settings page interface
- User preference configuration
- Statistics display and reset

## 🔒 Privacy & Security

### What This Extension Does
- ✅ Detects DOI from page metadata
- ✅ Creates download links to public services
- ✅ Stores user preferences locally
- ✅ Tracks usage statistics

### What This Extension Does NOT Do
- ❌ Collect personal information
- ❌ Track browsing history
- ❌ Send data to external servers (except when downloading papers)
- ❌ Modify website content permanently
- ❌ Store passwords or credentials

### Permissions Explained
| Permission | Purpose |
|-----------|---------|
| `storage` | Save your settings and statistics |
| `activeTab` | Access current tab for DOI detection |
| `scripting` | Inject download buttons on compatible sites |
| `tabs` | Open new tabs for downloads |
| `host_permissions` | Access academic websites for DOI detection |

## ⚖️ Legal Notice

**Important**: This extension helps you access papers through legitimate channels:

- **Sci-Hub, Anna's Archive**: Provide legal access to published research
- **arXiv**: Official open-access repository
- **DOI.org**: Official publisher resolution service
- **Custom sources**: Configure according to your institution's policies

**Respect Copyright**: Always verify you have the right to access papers. Many institutions provide legal access through their libraries.

## 🛠️ Development

### Prerequisites
- Chrome/Chromium/Brave/Edge browser
- Basic knowledge of JavaScript, HTML, CSS
- Text editor or IDE

### Project Architecture

**MV3 Compliant**
- Uses Service Workers (not background pages)
- All scripts are async-friendly
- No inline scripts in HTML

**Modular Design**
- Separated concerns for maintainability
- Reusable DOI detection logic
- Pluggable download sources

### Adding New Sources

1. **In popup.js**, add to `SOURCES` object:
```javascript
const SOURCES = {
    newsource: 'https://newsource.com/',
    // ... existing sources
};
```

2. **Update `downloadFromSource()` function**:
```javascript
case 'newsource':
    url = SOURCES.newsource + doi;
    break;
```

3. **Add button in popup.html**:
```html
<button class="source-btn" data-source="newsource">
    <span class="source-icon">🔗</span>
    <span>New Source</span>
</button>
```

### Adding New Website Support

1. **Update manifest.json** host_permissions:
```json
"host_permissions": [
    "https://newsite.com/*"
]
```

2. **Add detection in content-script.js**:
```javascript
function findDoiFromNewsite() {
    if (currentUrl.indexOf('newsite.com') < 0) return null;
    // Add detection logic
    return doi;
}
```

## 📊 Statistics & Analytics

The extension tracks (locally only):
- Total number of downloads
- Downloads per source
- Last download date/time
- Favorite source usage

All data is stored locally in your browser. No data is sent to external servers.

## 🐛 Troubleshooting

### DOI Not Detected
1. Verify you're on an academic website
2. Check browser console for errors (F12)
3. Try the "Detect DOI" button in the popup
4. Some websites don't include DOI metadata

### Extension Not Working
1. **Reload the extension**
   - Go to `chrome://extensions/`
   - Find the extension and click the refresh icon

2. **Check permissions**
   - Verify the website is in the permissions list
   - Some sites may require additional permissions

3. **Clear data**
   - Open options page
   - Click "Reset to Default"
   - Reload extension

4. **Check console**
   - Press F12 to open Developer Tools
   - Check Console tab for error messages

### Papers Not Downloading
- Verify the DOI is correct
- Try a different source
- Check if your ISP blocks certain sources
- Some institutional networks may restrict access

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Areas for Contribution
- Adding new academic websites
- Improving DOI detection
- UI/UX improvements
- Translation support
- Documentation

## 📚 Additional Resources

### Academic Database Links
- [IEEE Xplore](https://ieeexplore.ieee.org/)
- [arXiv](https://arxiv.org/)
- [ScienceDirect](https://www.sciencedirect.com/)
- [Springer](https://www.springer.com/)
- [Google Scholar](https://scholar.google.com/)

### Related Projects
- [Sci-Hub](https://sci-hub.se/)
- [Anna's Archive](https://annas-archive.li/)
- [DOI.org](https://doi.org/)

## 📝 License

This project is provided as-is for educational and research purposes.

## ⚠️ Disclaimer

This extension is provided "as-is" without warranty. Users are responsible for:
- Complying with applicable laws and regulations
- Respecting copyright and licensing agreements
- Following institutional policies
- Verifying access rights before downloading

## 🎉 Support

### Getting Help
- Check this README for common issues
- Review settings and permissions
- Check browser console (F12) for errors
- Submit issue with:
  - Browser and version
  - Website where issue occurs
  - Steps to reproduce
  - Screenshots if applicable

### Contact
For questions or suggestions, please open an issue on the project repository.

---

**Version**: 1.0.0  
**Last Updated**: February 2025  
**Compatibility**: Chrome, Brave, Edge, Chromium  

**Happy researching! 📚**
