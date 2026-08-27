# Human vs Stockfish

# Play Link: https://lucasli1337unknown.github.io/HumanVSStockfishEngine/

A browser chess game where a human plays against Stockfish 18 Lite WASM.

## IMPORTANT

Copy your already-working Stockfish engine files into the ROOT of this project:

```text
stockfish-18-lite-single.js
stockfish-18-lite-single.wasm
```

Final structure:

```text
HumanVsStockfish/
├── index.html
├── stockfish-18-lite-single.js
├── stockfish-18-lite-single.wasm
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── engine.js
└── README.md
```

Do not edit the `.wasm` file in GitHub's text editor.

## Features

- Human vs Stockfish
- Play as White or Black
- Legal chess rules
- Click-to-move
- Legal move highlighting
- Captures
- Check / checkmate / draw
- Castling and en passant via chess.js
- Auto queen promotion
- Adjustable Stockfish depth
- Adjustable AI move delay
- Undo
- Flip board
- Move list
- Evaluation
- Best move display
- Engine log

## GitHub Pages

Create a repository, upload these files to the repository root, enable:

Settings → Pages → Deploy from a branch → main → / (root)

Then your site will be available at:

```text
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```
