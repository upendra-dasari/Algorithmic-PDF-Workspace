class HighlighterManager {
    constructor() {
        this.highlights = [];
        this.undoStack = [];
        this.redoStack = [];
        this.currentColor = '#FFFF00';
        this.isHighlightMode = false;
    }

    setColor(color) {
        this.currentColor = color;
    }

    getColor() {
        return this.currentColor;
    }

    addHighlight(pageNum, text, position, color = null) {
        const highlight = {
            id: this.generateId(),
            pageNum,
            text,
            position,
            color: color || this.currentColor,
            timestamp: new Date().toISOString()
        };

        this.undoStack.push({
            action: 'add',
            highlight
        });
        this.redoStack = [];

        this.highlights.push(highlight);
        return highlight;
    }

    removeHighlight(highlightId) {
        const index = this.highlights.findIndex(h => h.id === highlightId);
        if (index > -1) {
            const removed = this.highlights[index];
            this.undoStack.push({
                action: 'remove',
                highlight: removed,
                index
            });
            this.redoStack = [];
            this.highlights.splice(index, 1);
            return true;
        }
        return false;
    }

    updateHighlightColor(highlightId, newColor) {
        const highlight = this.highlights.find(h => h.id === highlightId);
        if (highlight) {
            const oldColor = highlight.color;
            this.undoStack.push({
                action: 'colorChange',
                highlightId,
                oldColor,
                newColor
            });
            this.redoStack = [];
            highlight.color = newColor;
            return true;
        }
        return false;
    }

    undo() {
        if (this.undoStack.length === 0) return false;

        const action = this.undoStack.pop();
        this.redoStack.push(action);

        if (action.action === 'add') {
            const index = this.highlights.indexOf(action.highlight);
            if (index > -1) {
                this.highlights.splice(index, 1);
            }
        } else if (action.action === 'remove') {
            this.highlights.splice(action.index, 0, action.highlight);
        } else if (action.action === 'colorChange') {
            const highlight = this.highlights.find(h => h.id === action.highlightId);
            if (highlight) {
                highlight.color = action.oldColor;
            }
        }
        return true;
    }

    redo() {
        if (this.redoStack.length === 0) return false;

        const action = this.redoStack.pop();
        this.undoStack.push(action);

        if (action.action === 'add') {
            this.highlights.push(action.highlight);
        } else if (action.action === 'remove') {
            this.highlights.splice(action.index, 1);
        } else if (action.action === 'colorChange') {
            const highlight = this.highlights.find(h => h.id === action.highlightId);
            if (highlight) {
                highlight.color = action.newColor;
            }
        }
        return true;
    }

    getHighlightsForPage(pageNum) {
        return this.highlights.filter(h => h.pageNum === pageNum);
    }

    getAllHighlights() {
        return [...this.highlights];
    }

    clearHighlights() {
        this.undoStack.push({
            action: 'clearAll',
            highlights: [...this.highlights]
        });
        this.redoStack = [];
        this.highlights = [];
    }

    loadHighlights(highlights) {
        // If array of all highlights provided, just load them
        if (Array.isArray(highlights)) {
            this.highlights = highlights;
        } else {
            this.highlights = [];
        }
        this.undoStack = [];
        this.redoStack = [];
    }

    generateId() {
        return `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getHighlightStyles() {
        return {
            '#FFFF00': { name: 'Yellow', rgb: 'rgba(255, 255, 0, 0.3)' },
            '#00FF00': { name: 'Green', rgb: 'rgba(0, 255, 0, 0.3)' },
            '#FF00FF': { name: 'Pink', rgb: 'rgba(255, 0, 255, 0.3)' },
            '#FFA500': { name: 'Orange', rgb: 'rgba(255, 165, 0, 0.3)' },
            '#87CEEB': { name: 'Blue', rgb: 'rgba(135, 206, 235, 0.3)' },
            '#FFB6C1': { name: 'Light Pink', rgb: 'rgba(255, 182, 193, 0.3)' }
        };
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }
}

const highlighter = new HighlighterManager();
