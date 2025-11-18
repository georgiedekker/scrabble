# Scrabble - Multilingual Multiplayer Web Game

A modern, serverless multiplingual Scrabble web application built with SvelteKit and WebRTC. Play Scrabble with friends across different devices in multiple languages!

## Features

- **True Cross-Device Multiplayer**: Play with friends on different devices using WebRTC peer-to-peer connections
- **Multilingual Support**: Play in English, Dutch, German, Polish, French, or multi-language mode
- **2-4 Players**: Supports 2 to 4 players per game
- **No Backend Required**: Peer-to-peer architecture with no server or database needed
- **Real-time Sync**: State changes broadcast 3x for reliability using PeerJS WebRTC
- **Mobile-First Design**: Touch-friendly interface optimized for phones, tablets, and desktops
- **Simple Game IDs**: Share easy peer IDs to invite players
- **Cross-Browser Compatible**: Works on all modern browsers
- **Host-Authoritative**: Game host maintains game state for consistency

## Technology Stack

- **Framework**: SvelteKit with static adapter
- **Styling**: Tailwind CSS
- **State Management**: Svelte stores with localStorage persistence (host only)
- **Real-time Sync**: PeerJS WebRTC for peer-to-peer connections
- **Signaling**: PeerJS cloud server (free hosted signaling)
- **Deployment**: Netlify-ready with static site generation
- **Icons**: Lucide Svelte

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` to play locally.

### Build

```bash
npm run build
```

The static site will be built to the `build/` directory.

### Preview Production Build

```bash
npm run preview
```

## How to Play

### Creating a Game

1. Visit the home page
2. Click "Create New Game"
3. Enter your name
4. Select a language (or multi-language)
5. Click "Create Game"
6. Share the Game ID (peer ID) with other players - they can use it to connect directly to your game

### Joining a Game

1. Visit the home page
2. Click "Join Game"
3. Enter your name
4. Enter the game token provided by the host
5. Click "Join Game"
6. Wait for the host to start the game

### Playing

1. Wait for your turn (indicated by green highlight)
2. Tap a tile from your rack
3. Tap a cell on the board to place it
4. Continue placing tiles in a straight line
5. Click "End Turn" when done (or "Recall" to take tiles back)
6. First move must touch the center star (★)

### Scoring

- Each letter has a point value
- Special cells multiply letter or word scores:
  - **TW** (Red): Triple Word Score
  - **DW** (Pink): Double Word Score
  - **TL** (Blue): Triple Letter Score
  - **DL** (Light Blue): Double Letter Score
- Using all 7 tiles: +50 bonus points

## WebRTC Architecture

The app uses a **host-authoritative** peer-to-peer architecture:

1. **Game Host**: The player who creates the game becomes the host
   - Initializes a PeerJS peer and gets a unique ID
   - This peer ID becomes the Game ID
   - Maintains the authoritative game state
   - Broadcasts state updates to all connected players

2. **Players**: Players who join connect directly to the host
   - Connect to host's peer ID via WebRTC
   - Send actions (tile placements, pass turn) to host
   - Receive state updates from host

3. **Signaling**: Uses PeerJS cloud server (free)
   - No custom backend needed
   - Handles ICE candidate exchange
   - Falls back to TURN servers for NAT traversal

4. **Reliability**: All messages sent 3 times with 50ms delays
   - Ensures delivery even with packet loss
   - No acknowledgment system needed for this use case

### Connection Flow

```
Player Creates Game → PeerJS assigns ID → Share ID with friends
                                            ↓
Friends Join → Connect to Host ID → WebRTC P2P established
                                            ↓
Host broadcasts state → Players receive → Game synced
```

## Deployment

### Netlify

This app is configured for Netlify deployment:

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Build command: `npm run build`
4. Publish directory: `build`
5. Deploy!

The `netlify.toml` file is already configured with the correct settings.

## Project Structure

```
scrabble/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Board.svelte      # Game board with special cells
│   │   │   ├── Tile.svelte       # Individual tile component
│   │   │   └── TileRack.svelte   # Player's tile rack with drag-drop
│   │   ├── stores/
│   │   │   └── gameStore.js      # Game state management
│   │   ├── languages.js          # Multi-language tile configurations
│   │   ├── sync.js               # Real-time synchronization
│   │   └── utils.js              # Utility functions
│   ├── routes/
│   │   ├── +layout.svelte        # Root layout
│   │   ├── +page.svelte          # Home page (create/join)
│   │   ├── lobby/[token]/        # Game lobby
│   │   └── game/[token]/         # Main game page
│   ├── app.html                  # HTML template
│   └── app.css                   # Global styles
├── static/                       # Static assets
├── build/                        # Production build output
├── netlify.toml                  # Netlify configuration
├── svelte.config.js              # SvelteKit configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── package.json                  # Dependencies and scripts
```

## Supported Languages

Each language has authentic tile distributions and point values:

- **English (EN)**: Standard Scrabble tile set
- **Dutch (NL)**: Nederlandse spelregels
- **German (DE)**: Deutsche Regeln mit Ä, Ö, Ü
- **Polish (PL)**: Polskie zasady z Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż
- **French (FR)**: Règles françaises
- **Multi-language**: Combination of all languages

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations

- No word validation dictionary (all placements are accepted if valid format)
- Games are stored locally (clearing browser data will lose games)
- Real-time sync only works across tabs/windows on the same device or via localStorage events

## Future Enhancements

- Word validation with language-specific dictionaries
- Game history and statistics
- Pass and swap tile functionality
- Timer for turns
- Spectator mode
- WebRTC for true peer-to-peer multiplayer

## License

This project is open source and available for educational purposes.

## Credits

Built with SvelteKit, Tailwind CSS, and Lucide icons.
