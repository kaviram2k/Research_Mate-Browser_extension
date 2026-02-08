// ==========================================
// Research Paper Downloader - Content Script
// Injects download buttons on academic websites
// ==========================================

const CONFIG = {
    scihubUrl: 'https://sci-hub.se/',
    annasUrl: 'https://annas-archive.li/scidb/',
    arxivUrl: 'https://arxiv.org/search/'
};

// Extract DOI from current page
function extractDoi() {
    const url = window.location.href;
    const docAsStr = document.documentElement.innerHTML;

    // Helper to run regex on doc
    function runRegexOnDoc(re, host) {
        if (!host || url.includes(host)) {
            const m = re.exec(docAsStr);
            if (m && m.length > 1) return m[1];
        }
        return null;
    }

    // 1. Meta Tags (Standard)
    const doiMetaNames = [
        "citation_doi", "doi", "dc.doi", "dc.identifier",
        "dc.identifier.doi", "bepress_citation_doi", "rft_id",
        "dcsext.wt_doi"
    ];

    for (let metaName of doiMetaNames) {
        const meta = document.querySelector(`meta[name="${metaName}"]`);
        if (meta && meta.content) {
            let doi = meta.content.replace(/^(https?:\/\/)?(www\.)?doi\.org\//, '').replace('doi:', '').trim();
            if (doi.startsWith('10.')) return doi;
        }
    }

    // 2. Data Attributes
    const dataDoiEl = document.querySelector('[data-doi]');
    if (dataDoiEl) {
        const doi = dataDoiEl.getAttribute('data-doi');
        if (doi && doi.startsWith('10.')) return doi;
    }

    // 3. Specific Site Logic

    // IEEE patterns
    if (url.includes('ieeexplore.ieee.org')) {
        const doi = runRegexOnDoc(/"doi":"([^"]+)"/, "ieeexplore.ieee.org");
        if (doi) return doi;
    }

    // ScienceDirect
    if (url.includes('sciencedirect.com')) {
        let doi = runRegexOnDoc(/SDM.doi\s*=\s*'([^']+)'/);
        if (doi) return doi;

        const doiLink = document.querySelector('a.doi');
        if (doiLink) {
            const m = doiLink.textContent.match(/doi\.org\/(.+)/);
            if (m) return m[1];
        }
    }

    // Springer
    if (url.includes('springer.com')) {
        const doi = runRegexOnDoc(/"doi"\s*:\s*"([^"]+)"/, "springer.com");
        if (doi) return doi;
    }

    // PubMed
    if (url.includes("ncbi.nlm.nih.gov")) {
        const link = document.querySelector("a[ref='aid_type=doi']");
        if (link) return link.innerHTML;

        // Fallback for newer PubMed
        const meta = document.querySelector('meta[name="citation_doi"]');
        if (meta) return meta.content;
    }

    // PsycNet
    if (url.includes("psycnet.apa.org")) {
        // green: https://psycnet.apa.org/doiLanding?doi=10.1037%2Fstl0000104
        const doi = runRegexOnDoc(/href="\/doi\/(10\..+?)"/, "psycnet.apa.org");
        if (doi) return doi;
    }

    // Epistemonikos
    if (url.includes("epistemonikos.org")) {
        const links = document.querySelectorAll('a');
        for (let link of links) {
            if (link.textContent === 'DOI') return link.href.replace(/^.*doi\.org\//, '');
        }
    }

    // InderScience
    if (url.includes("inderscienceonline.com")) {
        const meta = document.querySelector('meta[name="pbContext"]');
        if (meta) {
            const m = /article:article:(10\.\d+[^;]*)/.exec(meta.getAttribute('content'));
            if (m) return m[1];
        }
    }

    // Cairn.info
    if (url.includes("cairn.info")) {
        const details = document.getElementById('article-details');
        if (details) {
            const links = details.getElementsByTagName('a');
            for (let link of links) {
                const m = /https?:\/\/doi.org\/(10\.\d+\/.*)/.exec(link.href);
                if (m) return m[1];
            }
        }
    }

    // arXiv
    if (url.includes('arxiv.org')) {
        const m = url.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
        if (m) return m[1];
    }

    return null;
}

// Create styled button
function createDownloadButton() {
    const button = document.createElement('button');
    button.id = 'research-paper-dl-btn';
    button.className = 'research-paper-dl-btn';
    button.innerHTML = '⬇️ Download PDF';
    button.title = 'Download this paper using Research Paper Downloader';

    button.style.cssText = `
        display: inline-block;
        padding: 10px 16px;
        margin: 8px 8px 8px 0;
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 10000;
    `;

    button.onmouseover = () => {
        button.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
        button.style.transform = 'translateY(-2px)';
    };

    button.onmouseout = () => {
        button.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.3)';
        button.style.transform = 'translateY(0)';
    };

    return button;
}

// Create dropdown menu for sources
function createSourceMenu() {
    const container = document.createElement('div');
    container.className = 'research-paper-dl-menu';
    container.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10001;
        min-width: 160px;
    `;

    const sources = [
        { name: 'Sci-Hub', url: CONFIG.scihubUrl, icon: '🔓' },
        { name: "Anna's Archive", url: CONFIG.annasUrl, icon: '📚' },
        { name: 'DOI.org', url: 'https://doi.org/', icon: '🔗' }
    ];

    sources.forEach(source => {
        const item = document.createElement('button');
        item.style.cssText = `
            width: 100%;
            padding: 10px 12px;
            border: none;
            background: none;
            text-align: left;
            cursor: pointer;
            font-size: 13px;
            transition: background-color 0.2s;
        `;

        item.innerHTML = `${source.icon} ${source.name}`;

        item.onmouseover = () => {
            item.style.backgroundColor = '#f1f5f9';
        };

        item.onmouseout = () => {
            item.style.backgroundColor = 'transparent';
        };

        item.onclick = (e) => {
            e.stopPropagation();
            const doi = extractDoi();
            if (doi) {
                let downloadUrl;
                if (source.name.includes('Sci-Hub')) {
                    downloadUrl = CONFIG.scihubUrl + doi;
                } else if (source.name.includes("Anna")) {
                    downloadUrl = CONFIG.annasUrl + doi;
                } else {
                    downloadUrl = 'https://doi.org/' + doi;
                }
                window.open(downloadUrl, '_blank');
            }
        };

        container.appendChild(item);
    });

    return container;
}

// Inject button into various academic websites
function injectButtons() {
    const url = window.location.href;

    // IEEE Xplore - User's Custom Logic
    if (url.includes('ieeexplore.ieee.org')) {
        const container = document.querySelector('.u-mb-1.u-mt-05.btn-container');
        const doiContainer = document.querySelector('.u-pb-1.stats-document-abstract-doi');

        if (container && doiContainer && !document.getElementById('sci-hub-inject')) {
            // Extract DOI safely
            let doi = '';
            try {
                // Try user's specific path first
                if (doiContainer.children[1]) {
                    doi = doiContainer.children[1].innerHTML;
                } else {
                    doi = extractDoi();
                }
            } catch (e) {
                doi = extractDoi();
            }

            if (doi) {
                const parser = new DOMParser();
                const btnHtml = `
                  <div id="sci-hub-inject" class="xpl-btn-secondary" style="margin-right: 10px;">
                    <a href="https://sci-hub.se/${doi}" target="_blank" class="button" style="display: flex; align-items: center; justify-content: center; text-decoration: none;">
                        <span style="font-size: 16px; margin-right: 5px;">🔓</span> Sci-Hub
                    </a>
                  </div>
                 `;
                const btn = parser.parseFromString(btnHtml, 'text/html').body.childNodes[0];
                container.appendChild(btn);
            }
        }
        return; // Exit if IEEE to avoid double injection
    }

    // Existing Logic for Other Sites

    // Remove existing button if it exists
    const existing = document.getElementById('research-paper-dl-btn');
    if (existing) existing.remove();

    // Springer
    if (url.includes('springer.com')) {
        const actionContainer = document.querySelector('.test-article-actions') ||
            document.querySelector('[data-test="article-actions"]') ||
            document.querySelector('.article-actions');
        if (actionContainer) {
            const button = createDownloadButton();
            actionContainer.appendChild(button);
        }
    }

    // ScienceDirect
    if (url.includes('sciencedirect.com')) {
        const actionContainer = document.querySelector('[data-testid="article-header-section"]') ||
            document.querySelector('.article-header');
        if (actionContainer) {
            const button = createDownloadButton();
            actionContainer.appendChild(button);
        }
    }

    // arXiv
    if (url.includes('arxiv.org')) {
        const paperActions = document.querySelector('.download-pdf') ||
            document.querySelector('.leftcolumn');
        if (paperActions) {
            const button = createDownloadButton();
            button.style.display = 'block';
            button.style.margin = '10px 0';
            paperActions.appendChild(button);
        }
    }

    // Add click handler for generic button
    const button = document.getElementById('research-paper-dl-btn');
    if (button) {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const doi = extractDoi();
            if (doi) {
                window.open(CONFIG.scihubUrl + doi, '_blank');
            } else {
                alert('DOI not found.');
            }
        });
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButtons);
} else {
    injectButtons();
}

// Re-inject buttons if content changes (AJAX/SPA)
const observer = new MutationObserver(() => {
    setTimeout(injectButtons, 500);
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getDoi') {
        sendResponse({ doi: extractDoi() });
    }
});
