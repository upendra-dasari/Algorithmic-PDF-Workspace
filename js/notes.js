class NotesManager {
    constructor() {
        this.notes = '';
        this.undoStack = [];
        this.redoStack = [];
    }

    setNotes(content) {
        this.notes = content;
    }

    getNotes() {
        return this.notes;
    }

    updateNotes(content) {
        this.undoStack.push({
            action: 'update',
            oldContent: this.notes,
            newContent: content
        });
        this.redoStack = [];
        this.notes = content;
    }

    appendNote(content) {
        const newContent = this.notes + (this.notes ? '\n' : '') + content;
        this.updateNotes(newContent);
    }

    clearNotes() {
        this.undoStack.push({
            action: 'clear',
            content: this.notes
        });
        this.redoStack = [];
        this.notes = '';
    }

    load(content) {
        this.notes = content || '';
        this.undoStack = [];
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return false;

        const action = this.undoStack.pop();
        this.redoStack.push(action);

        if (action.action === 'update') {
            this.notes = action.oldContent;
        } else if (action.action === 'clear') {
            this.notes = action.content;
        }
        return true;
    }

    redo() {
        if (this.redoStack.length === 0) return false;

        const action = this.redoStack.pop();
        this.undoStack.push(action);

        if (action.action === 'update') {
            this.notes = action.newContent;
        } else if (action.action === 'clear') {
            this.notes = '';
        }
        return true;
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    searchInNotes(pattern) {
        if (!pattern) return [];
        
        const lowerNotes = this.notes.toLowerCase();
        const lowerPattern = pattern.toLowerCase();
        const results = [];
        let index = 0;

        while ((index = lowerNotes.indexOf(lowerPattern, index)) !== -1) {
            results.push({
                index,
                text: this.notes.substring(index, index + lowerPattern.length)
            });
            index += lowerPattern.length;
        }

        return results;
    }

    addPointwiseNote(point) {
        const bullet = this.notes ? '\n' : '';
        const newPoint = `${bullet}• ${point}`;
        this.updateNotes(this.notes + newPoint);
    }

    extractSelectedText(startOffset, endOffset) {
        return this.notes.substring(startOffset, endOffset);
    }

    getSelectedContext(selection) {
        if (!selection.toString()) return null;

        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(range.commonAncestorContainer);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        const start = preCaretRange.toString().length - range.toString().length;
        const text = range.toString();

        return {
            text,
            start,
            end: start + text.length
        };
    }

    removeAt(start, end) {
        const before = this.notes.substring(0, start);
        const after = this.notes.substring(end);
        const newContent = before + after;
        this.updateNotes(newContent);
    }

    insertAt(position, text) {
        const before = this.notes.substring(0, position);
        const after = this.notes.substring(position);
        const newContent = before + text + after;
        this.updateNotes(newContent);
    }

    export() {
        return {
            content: this.notes,
            exportedAt: new Date().toISOString()
        };
    }
}

const notesManager = new NotesManager();
