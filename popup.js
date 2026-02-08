// ==========================================
// Research Paper Downloader - Popup Script
// ==========================================

const SOURCES = {
    scihub: 'https://sci-hub.se/',
    annas: 'https://annas-archive.li/scidb/',
    arxiv: 'https://arxiv.org/search/',
    doi: 'https://doi.org/'
};

let currentDoi = null;
let currentSource = null;

// ==========================================
// DOI Detection Functions
// ==========================================

function getDoi() {
    const currentUrl = document.URL;
    const docAsStr = document.documentElement.innerHTML;
    let doi = null;

    // Helper function to run regex
    function runRegexOnDoc(re, host = null) {
        const myHost = document.location.hostname;
        if (!host || host === myHost) {
            const m = re.exec(docAsStr);
            if (m && m.length > 1) {
                return m[1];
            }
        }
        return false;
    }

    // Find DOI from meta tags
    function findDoiFromMetaTags() {
        const doiMetaNames = [
            "citation_doi", "doi", "dc.doi", "dc.identifier",
            "dc.identifier.doi", "bepress_citation_doi", "rft_id",
            "dcsext.wt_doi"
        ];

        const metaElements = document.getElementsByTagName('meta');
        let doiFound = null;

        Array.prototype.forEach.call(metaElements, (myMeta) => {
            if (!myMeta.name) return;
            if (doiMetaNames.indexOf(myMeta.name.toLowerCase()) < 0) return;
            if (myMeta.scheme && myMeta.scheme.toLowerCase() !== "doi") return;

            let doiCandidate = myMeta.content.replace("doi:", "");
            doiCandidate = doiCandidate.replace(/https?:\/\/(www\.)?doi\.org\//i, "");
            doiCandidate = doiCandidate.trim();

            if (doiCandidate.indexOf("10.") === 0) {
                doiFound = doiCandidate;
            }
        });

        return doiFound;
    }

    // Find DOI from data-doi attributes
    function findDoiFromDataDoiAttributes() {
        const elementsWithDataDoi = document.querySelectorAll('*[data-doi]');
        const dataDoiValues = Array.from(elementsWithDataDoi).map(elem =>
            elem.getAttribute('data-doi')
        );

        if (new Set(dataDoiValues).size === 1) {
            return dataDoiValues[0];
        }
        return null;
    }

    // ScienceDirect
    function findDoiFromScienceDirect() {
        if (currentUrl.indexOf('sciencedirect') < 0) return null;

        let doi = runRegexOnDoc(/SDM.doi\s*=\s*'([^']+)'/);
        if (doi) return doi;

        const doiLinkElem = document.querySelectorAll('a.doi');
        if (doiLinkElem.length) {
            const doiLinkText = doiLinkElem[0].textContent;
            const m = doiLinkText.match(/doi\.org\/(.+)/);
            if (m && m.length > 1) return m[1];
        }
        return null;
    }

    // IEEE Xplore
    function findDoiFromIeee() {
        return runRegexOnDoc(/"doi":"([^"]+)"/, "ieeexplore.ieee.org");
    }

    // Springer
    function findDoiFromSpringer() {
        if (currentUrl.indexOf('springer') < 0) return null;
        return runRegexOnDoc(/\"doi\"\s*:\s*\"([^\"]+)\"/, "springer.com");
    }

    // arXiv
    function findDoiFromArxiv() {
        if (currentUrl.indexOf('arxiv.org') < 0) return null;
        const m = currentUrl.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
        return m ? m[1] : null;
    }

    // Try all detection methods
    const doiFinderFunctions = [
        { func: findDoiFromMetaTags, name: "Meta Tags" },
        { func: findDoiFromDataDoiAttributes, name: "Data Attributes" },
        { func: findDoiFromScienceDirect, name: "ScienceDirect" },
        { func: findDoiFromIeee, name: "IEEE" },
        { func: findDoiFromSpringer, name: "Springer" },
        { func: findDoiFromArxiv, name: "arXiv" }
    ];

    for (let finder of doiFinderFunctions) {
        const foundDoi = finder.func();
        if (foundDoi) {
            return {
                doi: foundDoi,
                source: finder.name
            };
        }
    }

    return null;
}

// ==========================================
// UI Helper Functions
// ==========================================

function showStatus(message, type = 'info') {
    const container = document.getElementById('statusContainer');
    const messageEl = document.getElementById('statusMessage');

    messageEl.textContent = message;
    messageEl.className = `status-message status-${type}`;
    container.style.display = 'block';

    setTimeout(() => {
        container.style.display = 'none';
    }, 4000);
}

function displayPaperInfo(doi, source) {
    document.getElementById('doiDisplay').textContent = doi;
    document.getElementById('sourceDisplay').textContent = source || 'Unknown';
    document.getElementById('paperInfo').style.display = 'block';
}

function hidePaperInfo() {
    document.getElementById('paperInfo').style.display = 'none';
}

// ==========================================
// Download Functions
// ==========================================

function downloadFromSource(doi, source) {
    if (!doi) {
        showStatus('No DOI detected. Please visit an article page.', 'error');
        return;
    }

    let url = '';

    switch (source) {
        case 'scihub':
            url = SOURCES.scihub + doi;
            break;
        case 'annas':
            url = SOURCES.annas + doi;
            break;
        case 'arxiv':
            // For arXiv, search for the paper
            url = 'https://arxiv.org/search/?query=' + encodeURIComponent(doi) + '&searchtype=all';
            break;
        case 'doi':
            url = SOURCES.doi + doi;
            break;
        default:
            return;
    }

    chrome.tabs.create({ url: url });
    showStatus(`Opening ${source.toUpperCase()}...`, 'success');
}

// ==========================================
// Event Listeners
// ==========================================

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    const manualDoiInput = document.getElementById('manualDoiInput');
    const submitManualDoiBtn = document.getElementById('submitManualDoi');

    // Manual DOI Submission
    function handleManualDoi() {
        const input = manualDoiInput.value.trim();
        if (!input) {
            showStatus('Please enter a DOI or URL.', 'error');
            return;
        }

        // Clean up input to extract DOI
        let doi = input
            .replace(/^(https?:\/\/)?(www\.)?doi\.org\//, '')
            .replace(/^doi:/, '')
            .trim();

        // If it looks like a URL but not a DOI URL, try to extract specific patterns
        if (input.includes('arxiv.org/abs/')) {
            const m = input.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
            if (m) doi = m[1];
        }

        if (doi) {
            currentDoi = doi;
            currentSource = 'Manual Entry';

            // Auto-download request to background
            showStatus('🔍 Searching for PDF...', 'info');
            document.getElementById('fallbackSection').style.display = 'none'; // Hide previous errors
            document.getElementById('titleSection').style.display = 'block';
            document.getElementById('paperTitle').textContent = 'Fetching title...';

            // 1. Fetch Title Metadata (Async, don't wait for it to open tab)
            fetch(`https://api.crossref.org/works/${currentDoi}`)
                .then(res => res.json())
                .then(data => {
                    const title = data.message.title[0];
                    document.getElementById('paperTitle').textContent = title;
                    addToHistory(currentDoi, title);
                })
                .catch(err => {
                    console.error('Metadata fetch failed', err);
                    document.getElementById('paperTitle').textContent = 'Title not available';
                    addToHistory(currentDoi, 'Unknown Paper');
                });

            // 2. Show Source Options (No auto-open)
            document.getElementById('fallbackSection').style.display = 'block';
            showStatus('Select a source below.', 'info');

        } else {
            showStatus('Invalid DOI format.', 'error');
        }
    }

    // --- History Functions ---
    function addToHistory(doi, title) {
        chrome.storage.local.get({ searchHistory: [] }, (result) => {
            let history = result.searchHistory;
            // Remove duplicates
            history = history.filter(item => item.doi !== doi);
            // Add new item to top
            history.unshift({ doi: doi, title: title, date: new Date().toLocaleDateString() });
            // Keep last 10
            if (history.length > 10) history.pop();

            chrome.storage.local.set({ searchHistory: history }, updateHistoryUI);
        });
    }

    function updateHistoryUI() {
        chrome.storage.local.get({ searchHistory: [] }, (result) => {
            const list = document.getElementById('historyList');
            if (result.searchHistory.length === 0) {
                list.innerHTML = '<div style="padding: 10px; text-align: center; color: var(--text-secondary); font-size: 12px;">No recent history</div>';
                return;
            }

            list.innerHTML = '';
            result.searchHistory.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = `
                    <div style="font-weight: 500; font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">${item.title}</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">${item.doi} • ${item.date}</div>
                `;
                div.addEventListener('click', () => {
                    manualDoiInput.value = item.doi;
                    handleManualDoi();
                });
                list.appendChild(div);
            });
        });
    }

    // Load history on start
    updateHistoryUI();

    // Clear history
    document.getElementById('clearHistory').addEventListener('click', () => {
        chrome.storage.local.set({ searchHistory: [] }, updateHistoryUI);
    });

    if (submitManualDoiBtn) {
        submitManualDoiBtn.addEventListener('click', handleManualDoi);
    }

    if (manualDoiInput) {
        manualDoiInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                handleManualDoi();
            }
        });
        manualDoiInput.focus();
    }

    // Fallback Buttons Logic
    document.querySelectorAll('.fallback-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const baseUrl = this.getAttribute('data-base');
            if (currentDoi) {
                chrome.tabs.create({ url: baseUrl + currentDoi });
            }
        });
    });
});
