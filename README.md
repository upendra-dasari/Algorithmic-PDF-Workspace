# 📄 PDF Editor - Complete Web Application

A fully-featured web-based PDF editor built with vanilla JavaScript, PDF.js, and IndexedDB. No external dependencies like React required!

## 🎯 Features

### 1. **Browse & Open PDFs**
   - Click the **Browse PDF** button to select PDFs from your computer
   - Supports all standard PDF formats
   - Real-time rendering with page navigation

### 2. **Storage Management**
   - Save PDFs with all annotations locally using IndexedDB
   - Access **Saved Documents** from the Storage section
   - View document metadata (name, save date)
   - Delete documents you no longer need

### 3. **Search Functionality**
   - Advanced search using **KMP Algorithm** for optimal performance
   - Case-insensitive search across all PDF pages
   - Results display with page numbers and match counts
   - Click "Go to Page" to navigate to search results
   - Previous/Next navigation between results

### 4. **Highlighting with Colors**
   - Select text on any PDF page to highlight
   - Choose from 6 color options:
     - 🟨 Yellow
     - 🟩 Green
     - 🟪 Pink
     - 🟧 Orange
     - 🟦 Blue
     - 💖 Light Pink
   - **Undo/Redo** support with Ctrl+Z and Ctrl+Y

### 5. **Short Notes (3/4 Split View)**
   - Open notes panel to split screen into PDF (1/4) and Notes (3/4)
   - Point-wise note-taking with bullet and numbered lists
   - Copy-paste text directly from PDF to notes
   - Manual note typing and formatting
   - **Right-click "Find in PDF"** to search for selected note text in the document

### 6. **Keyboard Shortcuts**
   - **Ctrl+S** - Save document with all annotations
   - **Ctrl+Z** - Undo last action
   - **Ctrl+Y** - Redo last action
   - **Ctrl+F** - Open search panel
   - **Enter** in search - Execute search

## 📁 Project Structure

```
pdf_editor_project/
├── index.html              # Main HTML structure
├── css/
│   └── style.css          # Complete styling (responsive)
├── js/
│   ├── app.js             # Main application orchestration
│   ├── storage.js         # IndexedDB storage management
│   ├── pdf-viewer.js      # PDF rendering with PDF.js
│   ├── search.js          # KMP algorithm implementation
│   ├── highlighter.js     # Highlighting with undo/redo
│   └── notes.js           # Notes manager with formatting
└── README.md              # This file
```

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vanilla JavaScript (ES6+) |
| PDF Rendering | PDF.js (CDN) |
| Storage | IndexedDB |
| Styling | Pure CSS3 |
| Search Algorithm | Knuth-Morris-Pratt (KMP) |
| Backend | None (fully client-side) |

## 📋 Detailed Workflow

### Step 1: **Browse and Open PDF**
1. Click **📁 Browse PDF** button in header
2. Select a PDF file from your computer
3. Wait for PDF to load (progress visible)
4. First page displays automatically
5. View automatically switches to PDF viewer

### Step 2: **Navigate PDF**
- Use **Previous/Next** buttons to navigate pages
- View current page indicator (Page X of Y)
- Use color palette for highlighting:
  - Click **🖍️ Highlighter** button in sidebar
  - Select a color from the palette
  - Select text on PDF - it highlights automatically

### Step 3: **Search in PDF**
1. Click **🔍 Search** in sidebar (default active)
2. Type search term in search box
3. Click **Search** or press Enter
4. Results appear with:
   - Page number
   - Match count
   - Text preview
   - "Go to Page" button
5. Navigate between results using Previous/Next buttons

### Step 4: **Take Notes**
1. Click **📝 Short Notes** in sidebar
2. Screen splits: PDF (left) and Notes (right)
3. Take notes in the text area:
   - Use bullet points (• style)
   - Copy-paste text from PDF preview
   - Manual typing
4. Right-click any selected note text → **Find in PDF**
   - Automatically searches for that text in the PDF
   - Navigates to page with match

### Step 5: **Highlight Text**
1. Click **🖍️ Highlighter** button
2. Choose color from palette
3. Select text on PDF → auto-highlights with chosen color
4. Highlights persist on that page

### Step 6: **Undo/Redo**
- **Ctrl+Z** - Undo last highlight or note change
- **Ctrl+Y** - Redo action
- Works across highlights and notes

### Step 7: **Save Document**
1. Click **💾 Save** button in header
2. All annotations (highlights + notes) save automatically
3. Document stored with unique ID in IndexedDB
4. Takes full PDF + all metadata

### Step 8: **Access Saved Documents**
1. Click **💾 Storage** in header
2. View all saved documents with:
   - Document name
   - Save date
   - Open button
   - Delete button
3. Click **Open** to load document with all annotations
4. Click **Delete** to permanently remove document

## 🎨 UI Features

### Welcome Screen
- Features overview with icons
- Quick access buttons for Browse and Storage
- Professional welcome message

### Header
- Logo and app title
- Browse and Storage buttons
- Active indicator showing current document

### Sidebar Tools
- **Search** - Full-text search with KMP algorithm
- **Short Notes** - Note-taking with split view
- **Highlighter** - Color palette for highlighting
- Active tool indicator

### PDF Viewer
- Page-by-page navigation
- Current page indicator
- Zoom support (implemented in pdf-viewer.js)
- Responsive canvas rendering

### Storage Interface
- Grid layout of saved documents
- Document cards with metadata
- Action buttons (Open, Delete)
- Empty state message

## 🔧 Installation & Usage

### No Build Required!
Just open `index.html` in a modern web browser:
```bash
# Option 1: Direct open
open index.html

# Option 2: Using Python's http.server
python -m http.server 8000
# Then visit http://localhost:8000

# Option 3: Using Node.js http-server
npx http-server
```

### Browser Requirements
- Modern browser with ES6 support
- IndexedDB support (all modern browsers)
- PDF.js library (loaded from CDN)

## 💾 Data Persistence

All data is stored locally in **IndexedDB**:
- ✅ No server required
- ✅ No cloud storage
- ✅ Data persists across browser sessions
- ✅ ~50MB storage per domain (browser dependent)
- ⚠️ Data lost if browser cache is cleared

## 🎯 Algorithm Details

### KMP Search Algorithm
```javascript
- Time Complexity: O(n + m) where n = text length, m = pattern length
- Space Complexity: O(m) for failure function
- Efficient for searching across large PDF documents
- Case-insensitive matching
```

### Undo/Redo Implementation
- Stack-based approach with action history
- Supports highlights and notes modifications
- Clear history on document load

## 📱 Responsive Design

The application is fully responsive:
- Desktop: Full features with sidebar
- Tablet: Adjusted layout with stacked panels
- Mobile: Optimized for smaller screens

## 🐛 Troubleshooting

### PDF not loading?
- Check file format (must be valid PDF)
- Ensure browser has PDF.js support
- Check browser console for errors

### Storage not working?
- Ensure IndexedDB is enabled
- Check if not in private/incognito mode
- Clear cache if stuck

### Search not finding results?
- Try simpler search terms
- Check for special characters
- Ensure PDF has selectable text (not scanned image)

## 🚀 Future Enhancements

Potential features for v2:
- PDF export with annotations
- Multi-document comparison
- Cloud synchronization
- Document sharing
- OCR for scanned PDFs
- Drawing tools
- Text annotation boxes
- Bookmark management

## 📄 License

Free to use for personal and educational purposes.

## 🤝 Contributing

This is a single-developer project. Feel free to fork and modify!

---

**Made with ❤️ using Vanilla JavaScript** | No frameworks • No build tools • Pure browser power!
