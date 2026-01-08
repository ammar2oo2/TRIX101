# TRIX Score Tracker

A mobile-first Progressive Web App (PWA) for tracking TRIX card game scores. Built with vanilla HTML, CSS, and JavaScript - no frameworks required.

## Features

- **Mobile-First Design**: Optimized for mobile devices with touch-friendly controls
- **Offline Support**: Works offline using Service Workers (PWA)
- **Arabic/RTL Support**: Default Arabic language with RTL layout
- **Score Tracking**: Track scores for 4 players across multiple rounds
- **Complex Rounds**: Four categories - King of hearts, Queens, Diamonds, Collections
- **Doubling Option**: Optional 2X multiplier for King and Queens
- **Partial Rounds**: Save incomplete rounds with validation
- **Match Management**: Create, duplicate, and delete matches

## Scoring System

### Point Values
- **King of hearts**: 75 points
- **Queens**: 25 points each
- **Diamonds**: 10 points each
- **Collections (tricks)**: 15 points each

### Per-Round Limits (across all players)
- **King**: Maximum 1
- **Queens**: Maximum 4
- **Diamonds**: Maximum 13
- **Collections**: Maximum 13

### Scoring Formula

For each player in each round:

```
kingDelta = king.count × 75 × (king.sign == PLUS ? +1 : -1) × (king.doubled ? 2 : 1)
queensDelta = queens.count × 25 × (queens.sign == PLUS ? +1 : -1) × (queens.doubled ? 2 : 1)
diamondsDelta = diamonds.count × 10 × (diamonds.sign == PLUS ? +1 : -1)
collectionsDelta = collections.count × 15 × (collections.sign == PLUS ? +1 : -1)

roundDelta = kingDelta + queensDelta + diamondsDelta + collectionsDelta
```

**Player Total** = Sum of all `roundDelta` values across all rounds

### Doubling
When Doubling is enabled:
- A "2X" button appears for King and Queens categories only
- Tapping 2X doubles the absolute point value for that category
- Only affects King (75 → 150) and Queens (25 → 50)

## How to Use

### Starting a New Game
1. Enter player names (or use defaults)
2. Toggle "Doubling" ON/OFF if desired
3. Tap "START" to begin

### Adding a Round
1. In Game View, tap the green "+" button (bottom right)
2. Select a player using the bottom tabs
3. For each category:
   - Tap **red minus (-)** to set negative sign or decrement count
   - Tap **green plus (+)** to set positive sign or increment count
   - Tap **2X** (if available) to double points for King/Queens
4. Switch between players to enter their scores
5. Tap back arrow to save or discard

### Editing/Deleting Rounds
- Tap any round in the list to see options
- Choose "Edit" to modify or "Delete" to remove

### Match Management
- **Duplicate**: Creates a new match with same players/settings (no rounds)
- **Delete**: Removes the current match (with confirmation)

## Hosting

### GitHub Pages

1. Create a new repository on GitHub
2. Upload all files to the repository
3. Go to Settings → Pages
4. Select source branch (usually `main`)
5. Your app will be available at `https://[username].github.io/[repository-name]`

### Netlify

1. Create a Netlify account
2. Drag and drop the project folder to Netlify dashboard
3. Or connect your Git repository
4. Your app will be automatically deployed

### Other Static Hosts

Any static hosting service works:
- Vercel
- Firebase Hosting
- AWS S3 + CloudFront
- Any web server

Simply upload all files and ensure `index.html` is in the root directory.

## Local Development

1. Clone or download this repository
2. Open `index.html` in a web browser
3. For PWA features (Service Worker), use a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (http-server)
   npx http-server
   
   # PHP
   php -S localhost:8000
   ```
4. Open `http://localhost:8000` in your browser

## File Structure

```
trix-score-tracker/
├── index.html          # Main HTML structure
├── styles.css          # All styling
├── app.js              # Main application logic
├── storage.js          # localStorage management
├── scoring.js          # Pure scoring functions
├── sw.js               # Service Worker (PWA)
├── manifest.json       # PWA manifest
└── README.md           # This file
```

## Browser Support

- Modern browsers with ES6+ support
- Service Worker support for offline functionality
- localStorage for data persistence

## Data Storage

All data is stored locally in the browser's localStorage. No data is sent to any server. To clear data, clear your browser's localStorage for this site.

## License

Free to use and modify.
