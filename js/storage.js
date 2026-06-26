class StorageManager {
    constructor() {
        this.dbName = 'PDFEditorDB';
        this.dbVersion = 1;
        this.db = null;
        // Store the init promise so all methods can await it
        this.ready = this.init();
    }

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Database failed to open:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('documents')) {
                    const store = db.createObjectStore('documents', { keyPath: 'id' });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('savedAt', 'savedAt', { unique: false });
                }
            };
        });
    }

    async savePDF(id, name, pdfData, annotations = {}) {
        // Wait for DB to be ready before any operation
        await this.ready;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readwrite');
            const store = transaction.objectStore('documents');

            const doc = {
                id,
                name,
                pdfData,
                annotations,
                savedAt: new Date().toISOString()
            };

            const request = store.put(doc);

            request.onsuccess = () => {
                console.log('Document saved:', name);
                resolve(doc);
            };

            request.onerror = () => {
                console.error('Error saving document:', request.error);
                reject(request.error);
            };
        });
    }

    async loadPDF(id) {
        await this.ready;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readonly');
            const store = transaction.objectStore('documents');
            const request = store.get(id);

            request.onsuccess = () => {
                if (request.result) {
                    console.log('Document loaded:', request.result.name);
                    resolve(request.result);
                } else {
                    reject(new Error('Document not found'));
                }
            };

            request.onerror = () => {
                console.error('Error loading document:', request.error);
                reject(request.error);
            };
        });
    }

    async getAllDocuments() {
        await this.ready;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readonly');
            const store = transaction.objectStore('documents');
            const request = store.getAll();

            request.onsuccess = () => {
                const documents = request.result.sort((a, b) => 
                    new Date(b.savedAt) - new Date(a.savedAt)
                );
                console.log('All documents retrieved:', documents.length);
                resolve(documents);
            };

            request.onerror = () => {
                console.error('Error retrieving documents:', request.error);
                reject(request.error);
            };
        });
    }

    async deleteDocument(id) {
        await this.ready;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['documents'], 'readwrite');
            const store = transaction.objectStore('documents');
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('Document deleted:', id);
                resolve();
            };

            request.onerror = () => {
                console.error('Error deleting document:', request.error);
                reject(request.error);
            };
        });
    }

    async saveHighlights(docId, pageNum, highlights) {
        const doc = await this.loadPDF(docId);
        if (!doc.annotations.highlights) {
            doc.annotations.highlights = {};
        }
        doc.annotations.highlights[pageNum] = highlights;
        return this.savePDF(docId, doc.name, doc.pdfData, doc.annotations);
    }

    async getHighlights(docId, pageNum) {
        const doc = await this.loadPDF(docId);
        return doc.annotations.highlights?.[pageNum] || [];
    }

    async saveNotes(docId, notes) {
        const doc = await this.loadPDF(docId);
        doc.annotations.notes = notes;
        return this.savePDF(docId, doc.name, doc.pdfData, doc.annotations);
    }

    async getNotes(docId) {
        const doc = await this.loadPDF(docId);
        return doc.annotations.notes || '';
    }
}

const storage = new StorageManager();
