class PDFEditorApp {
    constructor() {
        this.currentDocId = null;
        this.currentFileName = '';
        this.searchMatchesFlat = [];
        this.currentMatchFlatIndex = -1;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    setupEventListeners() {
        // Header buttons
        document.getElementById('browseBtn').addEventListener('click', () => this.openBrowseModal());
        document.getElementById('storageBtn').addEventListener('click', () => this.openStorageModal());

        // Welcome screen buttons
        document.getElementById('welcomeBrowseBtn').addEventListener('click', () => this.openBrowseModal());
        document.getElementById('welcomeStorageBtn').addEventListener('click', () => this.openStorageModal());

        // Browse modal
        document.getElementById('pdfInput').addEventListener('change', (e) => this.handlePDFUpload(e));
        this.setupModalCloseButtons();

        // Viewer controls
        document.getElementById('nextPageBtn').addEventListener('click', () => pdfViewer.nextPage());
        document.getElementById('prevPageBtn').addEventListener('click', () => pdfViewer.previousPage());
        document.getElementById('saveBtn').addEventListener('click', () => this.savePDF());
        document.getElementById('closeViewerBtn').addEventListener('click', () => this.closeViewer());

        // Sidebar buttons
        document.getElementById('searchToolBtn').addEventListener('click', () => this.switchTool('search'));
        document.getElementById('notesToolBtn').addEventListener('click', () => this.switchTool('notes'));
        // Highlighter button - toggle highlight mode
        document.getElementById('highlighterBtn').addEventListener('click', () => this.toggleHighlighter());

        // Color palette
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                highlighter.setColor(e.target.dataset.color);
                highlighter.isHighlightMode = true;
                document.getElementById('highlighterBtn').classList.add('active');
                // Visual feedback: highlight the selected color
                document.querySelectorAll('.color-option').forEach(o => o.style.borderColor = 'white');
                e.target.style.borderColor = 'var(--dark)';
                this.updateHighlighterIndicator();
            });
        });

        // Search Panel
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });


        // Notes editor
        const notesList = document.getElementById('notesList');
        notesList.addEventListener('input', (e) => {
            notesManager.updateNotes(e.target.innerHTML);
        });
        notesList.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            document.execCommand('insertText', false, text);
        });

        // Context menu on notes
        document.getElementById('notesList').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showNotesContextMenu(e);
        });

        // Text selection for highlighting (listens to mouseup)
        document.addEventListener('mouseup', () => {
            this.handleTextSelection();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z - Undo
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (document.activeElement === document.getElementById('notesList')) {
                    if (notesManager.canUndo()) notesManager.undo();
                } else {
                    if (highlighter.canUndo()) highlighter.undo();
                }
                this.refreshUI();
            }

            // Ctrl+Y or Ctrl+Shift+Z - Redo
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                if (document.activeElement === document.getElementById('notesList')) {
                    if (notesManager.canRedo()) notesManager.redo();
                } else {
                    if (highlighter.canRedo()) highlighter.redo();
                }
                this.refreshUI();
            }

            // Ctrl+S - Save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.savePDF();
            }

            // Ctrl+F - Search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.switchTool('search');
                document.getElementById('searchInput').focus();
            }
        });
    }

    setupModalCloseButtons() {
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.add('hidden');
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }

    openBrowseModal() {
        document.getElementById('browseModal').classList.remove('hidden');
    }

    openStorageModal() {
        document.getElementById('storageModal').classList.remove('hidden');
        this.loadStorageList();
    }

    async handlePDFUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.currentFileName = file.name.replace('.pdf', '');
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const pdfData = e.target.result;
                // Clone the ArrayBuffer before PDF.js detaches it
                this.currentPDFData = pdfData.slice(0);
                
                await pdfViewer.loadPDF(pdfData);
                
                this.currentDocId = `doc_${Date.now()}`;
                this.showViewer();
                
                document.getElementById('docTitle').textContent = this.currentFileName;
                await pdfViewer.renderPage(1);

                document.getElementById('browseModal').classList.add('hidden');
                document.getElementById('pdfInput').value = '';

                // Reset annotations for new document
                highlighter.clearHighlights();
                notesManager.clearNotes();
                document.getElementById('notesList').innerHTML = '<ul><li></li></ul>';

                console.log('PDF loaded successfully');
            } catch (error) {
                alert('Failed to load PDF: ' + error.message);
                console.error(error);
            }
        };

        reader.readAsArrayBuffer(file);
    }

    showViewer() {
        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('viewerContainer').classList.remove('hidden');
        this.switchTool('search');
    }

    closeViewer() {
        document.getElementById('viewerContainer').classList.add('hidden');
        document.getElementById('welcomeScreen').classList.remove('hidden');
        pdfViewer.clear();
        highlighter.clearHighlights();
        notesManager.clearNotes();
        this.currentDocId = null;
    }

    switchTool(tool) {
        // Hide all tool panels
        document.querySelectorAll('.tool-panel').forEach(panel => {
            panel.classList.add('hidden');
        });
        document.querySelectorAll('.sidebar-btn:not(.highlighter-btn)').forEach(btn => {
            btn.classList.remove('active');
        });

        if (tool === 'search') {
            document.getElementById('searchPanel').classList.remove('hidden');
            document.getElementById('searchToolBtn').classList.add('active');
        } else if (tool === 'notes') {
            document.getElementById('notesPanel').classList.remove('hidden');
            document.getElementById('notesToolBtn').classList.add('active');
        }
    }

    toggleHighlighter() {
        const palette = document.getElementById('colorPalette');
        const btn = document.getElementById('highlighterBtn');
        
        highlighter.isHighlightMode = !highlighter.isHighlightMode;
        
        if (highlighter.isHighlightMode) {
            palette.classList.remove('hidden');
            btn.classList.add('active');
        } else {
            palette.classList.add('hidden');
            btn.classList.remove('active');
        }
    }

    updateHighlighterIndicator() {
        const color = highlighter.getColor();
        console.log('Highlighter color set to:', color);
    }

    async performSearch() {
        const searchTerm = document.getElementById('searchInput').value.trim();
        
        if (!searchTerm || !pdfViewer.pdfDocument) {
            pdfViewer.clearSearchHighlights();
            document.getElementById('searchResults').innerHTML = '';
            return;
        }

        const results = await searchManager.searchAcrossPages(pdfViewer.pdfDocument, searchTerm);
        this.displaySearchResults(results, searchTerm);
        pdfViewer.highlightSearchMatches(searchTerm);
    }

    displaySearchResults(results, searchTerm) {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = '';

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No results found</div>';
            return;
        }

        results.forEach((result, index) => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'search-result-item';

            const pageSpan = document.createElement('div');
            pageSpan.className = 'search-result-page';
            pageSpan.textContent = `Page ${result.pageNum} (${result.matchCount} matches)`;

            const textDiv = document.createElement('div');
            textDiv.className = 'search-result-text';
            
            // Safely escape and highlight search term
            let snippet = result.pageText.substring(0, 200);
            snippet = snippet.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            snippet = snippet.replace(
                new RegExp(`(${escapedTerm})`, 'gi'),
                '<strong style="background-color: #ffff00;">$1</strong>'
            );
            textDiv.innerHTML = snippet + '...';

            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'search-result-controls';

            const goBtn = document.createElement('button');
            goBtn.className = 'btn btn-small btn-primary';
            goBtn.textContent = 'Go to Page';
            goBtn.addEventListener('click', async () => {
                await pdfViewer.goToPage(result.pageNum);
                // Re-highlight search matches on the new page
                const currentSearch = document.getElementById('searchInput').value.trim();
                if (currentSearch) {
                    pdfViewer.highlightSearchMatches(currentSearch);
                }
            });

            controlsDiv.appendChild(goBtn);
            resultDiv.appendChild(pageSpan);
            resultDiv.appendChild(textDiv);
            resultDiv.appendChild(controlsDiv);
            resultsContainer.appendChild(resultDiv);
        });
    }

    handleTextSelection() {
        // Only highlight if highlighter mode is active
        if (!highlighter.isHighlightMode) return;

        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) return;

        const range = selection.getRangeAt(0);
        
        // Find the textLayer - handle both cases: 
        // when ancestor is a text node inside a span, or the textLayer itself
        let ancestor = range.commonAncestorContainer;
        let textLayer = null;
        
        if (ancestor.nodeType === Node.TEXT_NODE) {
            textLayer = ancestor.parentElement ? ancestor.parentElement.closest('.textLayer') : null;
        } else if (ancestor.nodeType === Node.ELEMENT_NODE) {
            textLayer = ancestor.closest('.textLayer') || (ancestor.classList && ancestor.classList.contains('textLayer') ? ancestor : null);
        }
        
        if (!textLayer) return;

        // Get the pdf-page-container as coordinate reference
        const container = textLayer.closest('.pdf-page-container');
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const rects = range.getClientRects();
        
        if (rects.length === 0) return;

        // Create a highlight for each line of the selection
        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            // Skip tiny rects (artifacts)
            if (rect.width < 2 || rect.height < 2) continue;
            
            highlighter.addHighlight(
                pdfViewer.getCurrentPage(),
                selection.toString(),
                {
                    x: (rect.left - containerRect.left) / containerRect.width,
                    y: (rect.top - containerRect.top) / containerRect.height,
                    width: rect.width / containerRect.width,
                    height: rect.height / containerRect.height
                }
            );
        }

        // Clear browser selection after highlighting
        selection.removeAllRanges();

        // Re-render to show the highlight overlay
        this.refreshUI();
    }

    showNotesContextMenu(event) {
        const selection = window.getSelection();
        if (!selection.toString()) return;

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';

        const findBtn = document.createElement('button');
        findBtn.className = 'context-menu-item';
        findBtn.textContent = '🔍 Find in PDF';
        findBtn.addEventListener('click', async () => {
            const searchTerm = selection.toString();
            document.getElementById('searchInput').value = searchTerm;
            this.switchTool('search');
            await this.performSearch();
            menu.remove();
        });

        menu.appendChild(findBtn);
        document.body.appendChild(menu);

        document.addEventListener('click', () => menu.remove(), { once: true });
    }

    async loadStorageList() {
        const list = document.getElementById('storageList');
        list.innerHTML = '<div class="storage-empty">Loading...</div>';

        try {
            await storage.ready;
            const documents = await storage.getAllDocuments();
            
            if (documents.length === 0) {
                list.innerHTML = '<div class="storage-empty">No saved documents yet</div>';
                return;
            }

            list.innerHTML = '';
            documents.forEach(doc => {
                const item = document.createElement('div');
                item.className = 'storage-item';

                const icon = document.createElement('div');
                icon.className = 'storage-item-icon';
                icon.textContent = '📄';

                const name = document.createElement('div');
                name.className = 'storage-item-name';
                name.title = doc.name;
                name.textContent = doc.name;

                const date = document.createElement('div');
                date.className = 'storage-item-date';
                date.textContent = new Date(doc.savedAt).toLocaleDateString();

                const actions = document.createElement('div');
                actions.className = 'storage-item-actions';

                const openBtn = document.createElement('button');
                openBtn.className = 'btn btn-small btn-primary';
                openBtn.textContent = 'Open';
                openBtn.addEventListener('click', () => this.loadDocumentFromStorage(doc.id));

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-small btn-danger';
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', () => this.deleteDocument(doc.id));

                actions.appendChild(openBtn);
                actions.appendChild(deleteBtn);

                item.appendChild(icon);
                item.appendChild(name);
                item.appendChild(date);
                item.appendChild(actions);
                list.appendChild(item);
            });
        } catch (error) {
            list.innerHTML = '<div class="storage-empty">Error loading documents</div>';
            console.error(error);
        }
    }

    async loadDocumentFromStorage(docId) {
        try {
            // Ensure DB is ready
            await storage.ready;

            const doc = await storage.loadPDF(docId);
            
            // Clone the ArrayBuffer before PDF.js detaches it
            this.currentPDFData = doc.pdfData.slice(0);
            
            await pdfViewer.loadPDF(doc.pdfData);
            // Reuse the same docId so re-saving updates the same record
            this.currentDocId = docId;
            this.currentFileName = doc.name;

            // Load all highlights for all pages
            if (doc.annotations && doc.annotations.highlights) {
                const allHighlights = [];
                for (const pageNum in doc.annotations.highlights) {
                    const pageHighlights = doc.annotations.highlights[pageNum];
                    if (Array.isArray(pageHighlights)) {
                        allHighlights.push(...pageHighlights);
                    }
                }
                highlighter.loadHighlights(allHighlights);
            } else {
                highlighter.clearHighlights();
            }

            // Load notes for re-editing
            if (doc.annotations && doc.annotations.notes) {
                notesManager.load(doc.annotations.notes);
                document.getElementById('notesList').innerHTML = doc.annotations.notes;
            } else {
                notesManager.clearNotes();
                document.getElementById('notesList').innerHTML = '<ul><li></li></ul>';
            }

            document.getElementById('docTitle').textContent = doc.name;
            this.showViewer();
            await pdfViewer.renderPage(1);
            document.getElementById('storageModal').classList.add('hidden');

            console.log('Document loaded from storage, ID:', docId);
        } catch (error) {
            console.error('Load error:', error);
            alert('Failed to load document: ' + (error.message || 'Unknown error'));
        }
    }

    async deleteDocument(docId) {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await storage.ready;
            await storage.deleteDocument(docId);
            this.loadStorageList();
        } catch (error) {
            alert('Failed to delete document: ' + error.message);
        }
    }

    async savePDF() {
        if (!this.currentDocId || !pdfViewer.pdfDocument) {
            alert('No document loaded. Please open a PDF first.');
            return;
        }

        // Show saving indicator
        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '⏳ Saving...';
        saveBtn.disabled = true;

        try {
            // Ensure DB is ready
            await storage.ready;

            if (!this.currentPDFData) {
                alert('PDF data not available. Please reload the PDF.');
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
                return;
            }

            const annotations = {
                highlights: {},
                notes: notesManager.getNotes()
            };

            // Collect highlights from all pages
            for (let i = 1; i <= pdfViewer.getTotalPages(); i++) {
                annotations.highlights[i] = highlighter.getHighlightsForPage(i);
            }

            // Save to IndexedDB storage
            await storage.savePDF(
                this.currentDocId,
                this.currentFileName,
                this.currentPDFData,
                annotations
            );

            // Show success feedback
            saveBtn.textContent = '✅ Saved!';
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }, 1500);

            console.log('Document saved to storage with ID:', this.currentDocId);
        } catch (error) {
            console.error('Save error:', error);
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            alert('Failed to save document: ' + (error.message || 'Unknown error. Check console for details.'));
        }
    }

    refreshUI() {
        pdfViewer.renderPage(pdfViewer.getCurrentPage());
        document.getElementById('notesList').innerHTML = notesManager.getNotes();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new PDFEditorApp();
    console.log('PDF Editor App initialized');
});
