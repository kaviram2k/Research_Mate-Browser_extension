// ==========================================
// Research Paper Downloader - Options Script
// ==========================================

const DEFAULT_SETTINGS = {
    defaultSource: 'scihub',
    autoDetect: true,
    injectButtons: true,
    showNotifications: true,
    customSource1: '',
    customSource2: ''
};

// Load settings when page loads
document.addEventListener('DOMContentLoaded', loadSettings);

function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
        // Apply toggle switches
        document.getElementById('autoDetect').checked = settings.autoDetect;
        document.getElementById('injectButtons').checked = settings.injectButtons;
        document.getElementById('showNotifications').checked = settings.showNotifications;

        // Apply custom sources
        document.getElementById('customSource1').value = settings.customSource1 || '';
        document.getElementById('customSource2').value = settings.customSource2 || '';

        // Set active source
        document.querySelectorAll('.source-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-source="${settings.defaultSource}"]`)?.classList.add('active');

        // Load statistics
        loadStatistics();

        // Attach event listeners
        attachEventListeners();
    });
}

function loadStatistics() {
    chrome.storage.local.get('downloadStats', (result) => {
        const stats = result.downloadStats || { total: 0, sources: {}, lastDownload: null };

        document.getElementById('totalDownloads').textContent = stats.total;

        if (stats.lastDownload) {
            const date = new Date(stats.lastDownload);
            document.getElementById('lastDownload').textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        }

        // Find favorite source
        if (Object.keys(stats.sources).length > 0) {
            const favorite = Object.keys(stats.sources).reduce((a, b) => 
                stats.sources[a] > stats.sources[b] ? a : b
            );
            document.getElementById('favoriteSource').textContent = favorite.toUpperCase();
        }
    });
}

function attachEventListeners() {
    // Toggle switches
    document.getElementById('autoDetect').addEventListener('change', (e) => {
        saveSetting('autoDetect', e.target.checked);
    });

    document.getElementById('injectButtons').addEventListener('change', (e) => {
        saveSetting('injectButtons', e.target.checked);
    });

    document.getElementById('showNotifications').addEventListener('change', (e) => {
        saveSetting('showNotifications', e.target.checked);
    });

    // Custom sources
    document.getElementById('customSource1').addEventListener('change', (e) => {
        saveSetting('customSource1', e.target.value);
    });

    document.getElementById('customSource2').addEventListener('change', (e) => {
        saveSetting('customSource2', e.target.value);
    });

    // Source selection
    document.querySelectorAll('.source-item').forEach(item => {
        item.addEventListener('click', () => {
            const source = item.getAttribute('data-source');
            document.querySelectorAll('.source-item').forEach(i => {
                i.classList.remove('active');
            });
            item.classList.add('active');
            saveSetting('defaultSource', source);
        });
    });

    // Action buttons
    document.getElementById('saveSettings').addEventListener('click', saveAllSettings);
    document.getElementById('resetSettings').addEventListener('click', resetToDefault);
    document.getElementById('resetStats').addEventListener('click', resetStatistics);
    document.getElementById('contactSupport').addEventListener('click', contactSupport);
}

function saveSetting(key, value) {
    chrome.storage.sync.set({ [key]: value }, () => {
        showStatus('Setting saved!', 'success');
    });
}

function saveAllSettings() {
    const settings = {
        defaultSource: document.querySelector('.source-item.active').getAttribute('data-source'),
        autoDetect: document.getElementById('autoDetect').checked,
        injectButtons: document.getElementById('injectButtons').checked,
        showNotifications: document.getElementById('showNotifications').checked,
        customSource1: document.getElementById('customSource1').value,
        customSource2: document.getElementById('customSource2').value
    };

    chrome.storage.sync.set(settings, () => {
        showStatus('✅ All settings saved successfully!', 'success');
    });
}

function resetToDefault() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
            loadSettings();
            showStatus('✅ Settings reset to default!', 'success');
        });
    }
}

function resetStatistics() {
    if (confirm('Are you sure you want to clear all statistics?')) {
        chrome.storage.local.set({ downloadStats: { total: 0, sources: {}, lastDownload: null } }, () => {
            loadStatistics();
            showStatus('✅ Statistics cleared!', 'success');
        });
    }
}

function contactSupport() {
    chrome.tabs.create({
        url: 'https://github.com/yourusername/research-paper-downloader/issues'
    });
}

function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    
    setTimeout(() => {
        statusEl.className = 'status-message';
    }, 3000);
}

// Auto-save settings when input changes (debounced)
let saveTimeout;
document.querySelectorAll('input[type="text"], input[type="url"]').forEach(input => {
    input.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveAllSettings, 1000);
    });
});
