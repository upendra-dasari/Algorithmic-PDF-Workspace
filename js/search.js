class SearchManager {
    constructor() {
        this.searchResults = [];
        this.currentResultIndex = 0;
    }

    // Build failure function for KMP algorithm
    buildFailureFunction(pattern) {
        const m = pattern.length;
        const failure = new Array(m).fill(0);
        let j = 0;

        for (let i = 1; i < m; i++) {
            while (j > 0 && pattern[i] !== pattern[j]) {
                j = failure[j - 1];
            }
            if (pattern[i] === pattern[j]) {
                j++;
            }
            failure[i] = j;
        }
        return failure;
    }

    // KMP algorithm for string matching
    searchText(text, pattern) {
        if (!pattern || pattern.length === 0) return [];

        const n = text.length;
        const m = pattern.length;
        const failure = this.buildFailureFunction(pattern);
        const matches = [];
        let j = 0;

        for (let i = 0; i < n; i++) {
            while (j > 0 && text[i] !== pattern[j]) {
                j = failure[j - 1];
            }
            if (text[i] === pattern[j]) {
                j++;
            }
            if (j === m) {
                matches.push(i - m + 1);
                j = failure[m - 1];
            }
        }
        return matches;
    }

    // Case-insensitive search
    searchTextIgnoreCase(text, pattern) {
        const lowerText = text.toLowerCase();
        const lowerPattern = pattern.toLowerCase();
        return this.searchText(lowerText, lowerPattern);
    }

    // Search across all pages
    async searchAcrossPages(pdfDocument, pattern) {
        this.searchResults = [];
        const numPages = pdfDocument.numPages;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');

            const matches = this.searchTextIgnoreCase(pageText, pattern);
            
            if (matches.length > 0) {
                this.searchResults.push({
                    pageNum,
                    pageText,
                    matches,
                    matchCount: matches.length
                });
            }
        }

        this.currentResultIndex = 0;
        return this.searchResults;
    }

    // Get context around match
    getMatchContext(text, matchIndex, contextLength = 50) {
        const start = Math.max(0, matchIndex - contextLength);
        const end = Math.min(text.length, matchIndex + contextLength);
        
        return {
            before: text.substring(start, matchIndex),
            match: text.substring(matchIndex, matchIndex + contextLength),
            after: text.substring(matchIndex + contextLength, end)
        };
    }

    // Format search results for display
    formatResults(pattern) {
        return this.searchResults.map(result => ({
            pageNum: result.pageNum,
            matchCount: result.matchCount,
            contexts: result.matches.map(matchIndex => 
                this.getMatchContext(result.pageText, matchIndex, 40)
            )
        }));
    }

    getNextResult() {
        if (this.searchResults.length === 0) return null;
        const result = this.searchResults[this.currentResultIndex];
        return result;
    }

    goToNextPage() {
        if (this.searchResults.length > 0) {
            this.currentResultIndex = (this.currentResultIndex + 1) % this.searchResults.length;
        }
        return this.getNextResult();
    }

    goToPreviousPage() {
        if (this.searchResults.length > 0) {
            this.currentResultIndex = (this.currentResultIndex - 1 + this.searchResults.length) % this.searchResults.length;
        }
        return this.getNextResult();
    }

    clearResults() {
        this.searchResults = [];
        this.currentResultIndex = 0;
    }
}

const searchManager = new SearchManager();
