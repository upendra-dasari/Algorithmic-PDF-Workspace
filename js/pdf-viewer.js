class PDFViewer {
    constructor() {
        this.pdfDocument = null;
        this.currentPage = 1;
        this.scale = 1.5;
        this.canvas = document.getElementById('pdfCanvas');
        this.context = null;
        this.selectedText = null;
        this.searchHighlightTimeout = null;
    }

    async loadPDF(pdfData) {
        try {
            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfData) }).promise;
            this.pdfDocument = pdf;
            this.currentPage = 1;
            console.log('PDF loaded with', pdf.numPages, 'pages');
            return pdf;
        } catch (error) {
            console.error('Error loading PDF:', error);
            throw error;
        }
    }

    async renderPage(pageNum) {
        if (!this.pdfDocument) return;

        try {
            const page = await this.pdfDocument.getPage(pageNum);
            const viewport = page.getViewport({ scale: this.scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            // Container to align canvas, highlights overlay, and selectable text layer
            const container = document.createElement('div');
            container.className = 'pdf-page-container';
            container.style.position = 'relative';
            container.style.display = 'inline-block';
            container.style.margin = '0 auto';
            container.style.padding = '0';
            container.style.width = `${viewport.width}px`;
            container.style.height = `${viewport.height}px`;

            // 1. Add PDF canvas
            container.appendChild(canvas);

            // 2. Add highlights canvas overlay (always present so highlights render immediately)
            const overlayCanvas = document.createElement('canvas');
            overlayCanvas.width = canvas.width;
            overlayCanvas.height = canvas.height;
            overlayCanvas.style.position = 'absolute';
            overlayCanvas.style.top = '0';
            overlayCanvas.style.left = '0';
            overlayCanvas.style.margin = '0';
            overlayCanvas.style.padding = '0';
            overlayCanvas.style.pointerEvents = 'none';
            overlayCanvas.style.zIndex = '1';

            const highlights = highlighter.getHighlightsForPage(pageNum);
            if (highlights.length > 0) {
                const ctx = overlayCanvas.getContext('2d');
                for (const highlight of highlights) {
                    const style = highlighter.getHighlightStyles()[highlight.color];
                    if (style) {
                        ctx.fillStyle = style.rgb;
                        ctx.fillRect(
                            highlight.position.x * viewport.width,
                            highlight.position.y * viewport.height,
                            highlight.position.width * viewport.width,
                            highlight.position.height * viewport.height
                        );
                    }
                }
            }
            container.appendChild(overlayCanvas);

            // 3. Render PDF.js Text Layer on top
            const textContent = await page.getTextContent();
            const textLayerDiv = document.createElement('div');
            textLayerDiv.className = 'textLayer';
            textLayerDiv.style.position = 'absolute';
            textLayerDiv.style.top = '0';
            textLayerDiv.style.left = '0';
            textLayerDiv.style.width = `${viewport.width}px`;
            textLayerDiv.style.height = `${viewport.height}px`;
            textLayerDiv.style.overflow = 'hidden';
            textLayerDiv.style.lineHeight = '1.0';
            textLayerDiv.style.setProperty('--scale-factor', viewport.scale);

            container.appendChild(textLayerDiv);

            this.canvas.innerHTML = '';
            this.canvas.appendChild(container);

            await pdfjsLib.renderTextLayer({
                textContent: textContent,
                container: textLayerDiv,
                viewport: viewport,
                textDivs: []
            }).promise;

            this.currentPage = pageNum;
            this.updatePageInfo();

            // Auto highlight search matches if there is an active search term
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value.trim()) {
                this.highlightSearchMatches(searchInput.value.trim());
            }
        } catch (error) {
            console.error('Error rendering page:', error);
        }
    }

    async getTextContent(pageNum) {
        if (!this.pdfDocument) return '';

        try {
            const page = await this.pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            return textContent.items.map(item => item.str).join(' ');
        } catch (error) {
            console.error('Error getting text content:', error);
            return '';
        }
    }

    nextPage() {
        if (this.currentPage < this.pdfDocument.numPages) {
            return this.renderPage(this.currentPage + 1);
        }
        return Promise.resolve();
    }

    previousPage() {
        if (this.currentPage > 1) {
            return this.renderPage(this.currentPage - 1);
        }
        return Promise.resolve();
    }

    goToPage(pageNum) {
        if (pageNum >= 1 && pageNum <= this.pdfDocument.numPages) {
            return this.renderPage(pageNum);
        }
        return Promise.resolve();
    }

    getCurrentPage() {
        return this.currentPage;
    }

    getTotalPages() {
        return this.pdfDocument ? this.pdfDocument.numPages : 0;
    }

    updatePageInfo() {
        const pageInfo = document.getElementById('pageInfo');
        const pageCounter = document.getElementById('pageCounter');
        
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${this.getTotalPages()}`;
        }
        if (pageCounter) {
            pageCounter.textContent = `Page ${this.currentPage}`;
        }
    }

    zoom(direction) {
        if (direction === 'in') {
            this.scale += 0.2;
        } else if (direction === 'out') {
            this.scale = Math.max(0.5, this.scale - 0.2);
        }
        this.renderPage(this.currentPage);
    }

    setZoom(scale) {
        this.scale = scale;
        this.renderPage(this.currentPage);
    }

    getZoom() {
        return this.scale;
    }

    highlightSearchMatches(pattern) {
        this.clearSearchHighlights();
        const textLayer = this.canvas.querySelector('.textLayer');
        if (!textLayer || !pattern) return;

        // Clear any existing highlight timer to prevent race conditions
        if (this.searchHighlightTimeout) {
            clearTimeout(this.searchHighlightTimeout);
        }

        // Schedule highlights to run after a small delay.
        // This ensures the browser has completed rendering and layout of the text layer,
        // so getClientRects() returns accurate, stable visual coordinates.
        this.searchHighlightTimeout = setTimeout(() => {
            const container = textLayer.closest('.pdf-page-container');
            if (!container) return;
            const containerRect = container.getBoundingClientRect();

            const spans = textLayer.querySelectorAll('span');
            let pageText = '';
            const charMap = []; // Maps character index in pageText to { spanIndex, charOffset }

            // Build pageText and charMap character-by-character.
            // This is completely immune to index drift caused by varying text styles,
            // carriage returns, or spacing inconsistencies in PDF.js spans.
            for (let i = 0; i < spans.length; i++) {
                const span = spans[i];
                const text = span.textContent || '';
                
                for (let j = 0; j < text.length; j++) {
                    charMap.push({ spanIndex: i, charOffset: j });
                }
                pageText += text;

                // Add a space to separate spans, mimicking the join(' ') logic of search.js
                if (i < spans.length - 1) {
                    pageText += ' ';
                    charMap.push(null); // The space doesn't map to any character in a span
                }
            }

            // Find all matching indices using the KMP search engine
            const matches = searchManager.searchTextIgnoreCase(pageText, pattern);

            matches.forEach(matchIndex => {
                const matchStart = matchIndex;
                const matchEnd = matchIndex + pattern.length;

                // Group the match characters by span index to handle cross-span matches correctly
                const spansInMatch = {};
                for (let k = matchStart; k < matchEnd; k++) {
                    const mapping = charMap[k];
                    if (mapping) {
                        const { spanIndex, charOffset } = mapping;
                        if (!spansInMatch[spanIndex]) {
                            spansInMatch[spanIndex] = { start: charOffset, end: charOffset };
                        } else {
                            spansInMatch[spanIndex].end = Math.max(spansInMatch[spanIndex].end, charOffset);
                        }
                    }
                }

                // Create highlights for each span involved in this match
                for (const spanIndexStr in spansInMatch) {
                    const spanIndex = parseInt(spanIndexStr);
                    const { start, end } = spansInMatch[spanIndex];
                    const span = spans[spanIndex];
                    const textNode = span.childNodes[0];

                    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                        const range = document.createRange();
                        // setEnd takes an exclusive offset, so we use end + 1
                        range.setStart(textNode, start);
                        range.setEnd(textNode, Math.min(textNode.length, end + 1));

                        const rects = range.getClientRects();
                        for (const rect of rects) {
                            if (rect.width < 0.5 || rect.height < 0.5) continue;
                            const overlay = document.createElement('div');
                            overlay.className = 'search-highlight-overlay';
                            overlay.style.position = 'absolute';
                            overlay.style.left = `${rect.left - containerRect.left}px`;
                            overlay.style.top = `${rect.top - containerRect.top}px`;
                            overlay.style.width = `${rect.width}px`;
                            overlay.style.height = `${rect.height}px`;
                            overlay.style.backgroundColor = 'rgba(0, 120, 215, 0.35)';
                            overlay.style.pointerEvents = 'none';
                            // Set zIndex to 1 (behind .textLayer at zIndex 2)
                            // This ensures the overlays do not block or corrupt native browser text selection!
                            overlay.style.zIndex = '1';
                            overlay.style.borderRadius = '2px';
                            container.appendChild(overlay);
                        }
                    }
                }
            });
        }, 50);
    }

    clearSearchHighlights() {
        if (this.searchHighlightTimeout) {
            clearTimeout(this.searchHighlightTimeout);
            this.searchHighlightTimeout = null;
        }
        const overlays = this.canvas.querySelectorAll('.search-highlight-overlay');
        overlays.forEach(el => el.remove());
    }

    resetZoom() {
        this.scale = 1.5;
        this.renderPage(this.currentPage);
    }

    exportAsImage() {
        const canvases = this.canvas.querySelectorAll('canvas');
        if (canvases.length === 0) return null;

        const canvas = canvases[0];
        return canvas.toDataURL('image/png');
    }

    async extractAllText() {
        let allText = '';
        for (let i = 1; i <= this.getTotalPages(); i++) {
            const text = await this.getTextContent(i);
            allText += `--- Page ${i} ---\n${text}\n\n`;
        }
        return allText;
    }

    clear() {
        this.canvas.innerHTML = '';
        this.pdfDocument = null;
        this.currentPage = 1;
    }
}

const pdfViewer = new PDFViewer();
