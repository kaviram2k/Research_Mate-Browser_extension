// ==========================================
// Research Paper Downloader - Background Service Worker
// Handles extension-wide events and data
// ==========================================

// Extension initialization
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // Open  page on first install
        chrome.tabs.create({
            url: chrome.runtime.getURL('popup.html')
        });

        // Initialize default settings
        chrome.storage.sync.set({
            defaultSource: 'scihub',
            showRating: 'true',
            autoDetect: 'true',
            injectButtons: 'true'
        });


        console.log('Research Paper Downloader installed successfully!');
    } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        console.log('Research Paper Downloader updated to version ' + chrome.runtime.getManifest().version);
    }

    // Create context menu on install/update
    chrome.contextMenus.create({
        id: 'downloadPaper',
        title: 'Download Paper with Research Paper Downloader',
        contexts: ['page', 'selection'],
        documentUrlPatterns: [
            'https://ieeexplore.ieee.org/*',
            'https://arxiv.org/*',
            'https://www.sciencedirect.com/*',
            'https://link.springer.com/*',
            'https://scholar.google.com/*'
        ]
    }, () => {
        // Suppress error if item already exists
        if (chrome.runtime.lastError) {
            console.log('Context menu item already exists.');
        }
    });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'extractDoi':
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: extractDoiFromPage
                }, (results) => {
                    if (results && results[0]) {
                        sendResponse({ doi: results[0].result });
                    }
                });
            });
            return true; // Keep the message channel open

        case 'openDownloadLink':
            chrome.tabs.create({ url: request.url });
            sendResponse({ success: true });
            break;

        case 'saveSetting':
            chrome.storage.sync.set({ [request.key]: request.value });
            sendResponse({ success: true });
            break;
            chrome.storage.sync.set({ [request.key]: request.value });
            sendResponse({ success: true });
            break;

        case 'getSetting':
            chrome.storage.sync.get(request.key, (result) => {
                sendResponse({ value: result[request.key] });
            });
            return true; // Keep the message channel open

        case 'getStats':
            chrome.storage.local.get('downloadStats', (result) => {
                sendResponse({ stats: result.downloadStats || { total: 0, sources: {} } });
            });
            return true; // Keep the message channel open

        case 'recordDownload':
            recordDownloadStatistic(request.source);
            sendResponse({ success: true });
            break;

        default:
            sendResponse({ error: 'Unknown action' });
    }
});

// Extract DOI from page content
function extractDoiFromPage() {
    const doiMetaNames = [
        "citation_doi", "doi", "dc.doi", "dc.identifier",
        "dc.identifier.doi", "bepress_citation_doi"
    ];

    for (let metaName of doiMetaNames) {
        const meta = document.querySelector(`meta[name="${metaName}"]`);
        if (meta && meta.content) {
            let doi = meta.content.replace(/^(https?:\/\/)?(www\.)?doi\.org\//, '').replace('doi:', '');
            if (doi.startsWith('10.')) {
                return doi;
            }
        }
    }

    return null;
}

// Record download statistics
function recordDownloadStatistic(source) {
    chrome.storage.local.get('downloadStats', (result) => {
        let stats = result.downloadStats || { total: 0, sources: {} };
        stats.total += 1;
        stats.sources[source] = (stats.sources[source] || 0) + 1;
        stats.lastDownload = new Date().toISOString();

        chrome.storage.local.set({ downloadStats: stats });
    });
}

// Update extension badge with notification
function updateBadge(tabId, text, color = '#2563eb') {
    chrome.action.setBadgeText({ text: text, tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: color, tabId: tabId });
}

// Clear badge after timeout
function clearBadge(tabId, delay = 2000) {
    setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId: tabId });
    }, delay);
}

// Listen for tab activation to update badge
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Could update badge based on current tab's paper detection
});

// Handle context menu (right-click) if needed
// Context menu creation moved to onInstalled listener

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'downloadPaper') {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractDoiFromPage
        }, (results) => {
            if (results && results[0] && results[0].result) {
                const doi = results[0].result;
                chrome.tabs.create({
                    url: 'https://sci-hub.se/' + doi
                });
            }
        });
    }
});

// Periodic cleanup of old data
chrome.alarms.create('cleanup', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup') {
        // Clean up old data if needed
        chrome.storage.local.get(null, (items) => {
            // You could add cleanup logic here
            console.log('Cleanup cycle completed');
        });
    }
});

// Log extension status
console.log('Research Paper Downloader - Background Service Worker loaded');
console.log('Version: ' + chrome.runtime.getManifest().version);
