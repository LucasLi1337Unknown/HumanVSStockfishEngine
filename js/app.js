import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";
import { StockfishEngine } from "./engine.js";

const $ = s => document.querySelector(s);

const boardEl = $("#board");
const engineBadge = $("#engineBadge");
const gameStatus = $("#gameStatus");
const turnText = $("#turnText");
const plyText = $("#plyText");
const evalTextEl = $("#evalText");
const bestMoveText = $("#bestMoveText");
const movesEl = $("#moves");
const logEl = $("#log");
const whiteName = $("#whiteName");
const blackName = $("#blackName");
const whiteStatus = $("#whiteStatus");
const blackStatus = $("#blackStatus");
const sideSelect = $("#sideSelect");
const depthSlider = $("#depthSlider");
const depthValue = $("#depthValue");
const delaySlider = $("#delaySlider");
const delayValue = $("#delayValue");

const game = new Chess();

let humanColor = "w";
let flipped = false;
let selected = null;
let legalTargets = [];
let lastMove = null;
let engineThinking = false;
let gameGeneration = 0;
let lastEval = null;

const glyph = {
  wp:"♙", wn:"♘", wb:"♗", wr:"♖", wq:"♕", wk:"♔",
  bp:"♟", bn:"♞", bb:"♝", br:"♜", bq:"♛", bk:"♚"
};

function log(line) {
  const stamp = new Date().toLocaleTimeString();
  const arr = logEl.textContent === "Booting Stockfish…" ? [] : logEl.textContent.split("\n");
  arr.push(`[${stamp}] ${line}`);
  logEl.textContent = arr.slice(-100).join("\n");
  logEl.scrollTop = logEl.scrollHeight;
}

const engine = new StockfishEngine({
  onLine: log,
  onState: state => {
    if (state === "ready") {
      engineBadge.textContent = "STOCKFISH READY";
      engineBadge.className = "badge ready";
    } else if (state === "error") {
      engineBadge.textContent = "ENGINE ERROR";
      engineBadge.className = "badge error";
    } else {
      engineBadge.textContent = "ENGINE STARTING";
      engineBadge.className = "badge waiting";
    }
  },
  onEval: e => {
    lastEval = e;
    updateEval();
  }
});

function squareName(file, row) {
  return `${String.fromCharCode(97 + file)}${8 - row}`;
}

function renderBoard() {
  boardEl.innerHTML = "";

  for (let vr = 0; vr < 8; vr++) {
    for (let vc = 0; vc < 8; vc++) {
      const file = flipped ? 7 - vc : vc;
      const row = flipped ? 7 - vr : vr;
      const name = squareName(file, row);

      const sq = document.createElement("button");
      sq.type = "button";
      sq.className = `square ${(file + row) % 2 ? "light" : "dark"}`;
      sq.dataset.square = name;

      if (selected === name) sq.classList.add("selected");
      if (lastMove && (lastMove.from === name || lastMove.to === name)) sq.classList.add("last");

      const legal = legalTargets.find(m => m.to === name);
      if (legal) sq.classList.add(legal.captured ? "capture" : "legal");

      const piece = game.get(name);
      if (piece) {
        const p = document.createElement("span");
        p.className = "piece";
        p.textContent = glyph[piece.color + piece.type];
        sq.appendChild(p);
      }

      if (vr === 7) {
        const c = document.createElement("span");
        c.className = "coord file";
        c.textContent = name[0];
        sq.appendChild(c);
      }

      if (vc === 0) {
        const c = document.createElement("span");
        c.className = "coord rank";
        c.textContent = name[1];
        sq.appendChild(c);
      }

      sq.addEventListener("click", () => onSquareClick(name));
      boardEl.appendChild(sq);
    }
  }

  updateText();
}

function clearSelection(render = true) {
  selected = null;
  legalTargets = [];
  if (render) renderBoard();
}

function selectSquare(square) {
  selected = square;
  legalTargets = game.moves({ square, verbose:true });
  renderBoard();
}

function onSquareClick(square) {
  if (engineThinking || game.isGameOver()) return;
  if (game.turn() !== humanColor) return;

  const piece = game.get(square);

  if (!selected) {
    if (!piece || piece.color !== humanColor) return;
    selectSquare(square);
    return;
  }

  if (square === selected) {
    clearSelection();
    return;
  }

  if (piece && piece.color === humanColor) {
    selectSquare(square);
    return;
  }

  const candidate = legalTargets.find(m => m.to === square);
  if (!candidate) {
    clearSelection();
    return;
  }

  const promotion = candidate.promotion ? "q" : undefined;

  const move = game.move({
    from:selected,
    to:square,
    promotion
  });

  if (!move) return;

  lastMove = { from:move.from, to:move.to };
  clearSelection(false);
  renderBoard();

  if (!game.isGameOver()) {
    setTimeout(() => maybeEngineMove(gameGeneration), Number(delaySlider.value));
  }
}

function updateText() {
  turnText.textContent = game.turn() === "w" ? "White" : "Black";
  plyText.textContent = String(game.history().length);

  const history = game.history();

  if (!history.length) {
    movesEl.textContent = "No moves yet.";
  } else {
    const rows = [];
    for (let i = 0; i < history.length; i += 2) {
      rows.push(`${i/2 + 1}. ${history[i] || ""} ${history[i+1] || ""}`);
    }
    movesEl.textContent = rows.join("\n");
  }

  whiteName.textContent = humanColor === "w" ? "Human" : "Stockfish";
  blackName.textContent = humanColor === "b" ? "Human" : "Stockfish";

  whiteStatus.textContent =
    game.turn() === "w"
      ? (humanColor === "w" ? "Your move" : engineThinking ? "Thinking…" : "Stockfish")
      : "";

  blackStatus.textContent =
    game.turn() === "b"
      ? (humanColor === "b" ? "Your move" : engineThinking ? "Thinking…" : "Stockfish")
      : "";

  if (game.isCheckmate()) {
    gameStatus.textContent =
      `Checkmate — ${game.turn() === "w" ? "Black" : "White"} wins.`;
  } else if (game.isDraw()) {
    gameStatus.textContent = "Draw.";
  } else if (game.inCheck()) {
    gameStatus.textContent =
      `${game.turn() === "w" ? "White" : "Black"} is in check.`;
  } else if (engineThinking) {
    gameStatus.textContent = "Stockfish is thinking…";
  } else {
    gameStatus.textContent =
      game.turn() === humanColor ? "Your move." : "Stockfish to move.";
  }
}

function updateEval() {
  if (!lastEval) {
    evalTextEl.textContent = "—";
    return;
  }

  if (lastEval.type === "mate") {
    evalTextEl.textContent =
      lastEval.value > 0 ? `M${lastEval.value}` : `-M${Math.abs(lastEval.value)}`;
  } else {
    evalTextEl.textContent =
      `${lastEval.value >= 0 ? "+" : ""}${(lastEval.value / 100).toFixed(2)}`;
  }
}

async function maybeEngineMove(myGeneration) {
  if (myGeneration !== gameGeneration) return;
  if (game.isGameOver()) return;
  if (game.turn() === humanColor) return;
  if (engineThinking) return;

  engineThinking = true;
  bestMoveText.textContent = "…";
  updateText();

  try {
    const uci = await engine.bestMove(game.fen(), Number(depthSlider.value));

    if (myGeneration !== gameGeneration) return;
    if (!uci || uci === "(none)") throw new Error("Stockfish returned no move");

    bestMoveText.textContent = uci;

    const from = uci.slice(0,2);
    const to = uci.slice(2,4);
    const promotion = uci[4] || undefined;

    const move = game.move({ from, to, promotion });
    if (!move) throw new Error(`Illegal Stockfish move: ${uci}`);

    lastMove = { from:move.from, to:move.to };
    renderBoard();
  } catch (e) {
    engineBadge.textContent = "ENGINE ERROR";
    engineBadge.className = "badge error";
    log(e.message || String(e));
    gameStatus.textContent = e.message || String(e);
  } finally {
    engineThinking = false;
    updateText();
  }
}

function startNewGame() {
  gameGeneration++;
  engine.stop();
  game.reset();

  humanColor = sideSelect.value;
  flipped = humanColor === "b";

  selected = null;
  legalTargets = [];
  lastMove = null;
  lastEval = null;
  engineThinking = false;

  evalTextEl.textContent = "—";
  bestMoveText.textContent = "—";

  engine.newGame();
  renderBoard();

  if (humanColor === "b") {
    setTimeout(() => maybeEngineMove(gameGeneration), 300);
  }
}

$("#newGameBtn").addEventListener("click", startNewGame);

$("#undoBtn").addEventListener("click", () => {
  if (engineThinking) return;
  if (!game.history().length) return;

  engine.stop();

  game.undo();

  if (game.history().length && game.turn() !== humanColor) {
    game.undo();
  }

  selected = null;
  legalTargets = [];
  lastMove = null;
  lastEval = null;
  bestMoveText.textContent = "—";
  evalTextEl.textContent = "—";
  renderBoard();
});

$("#flipBtn").addEventListener("click", () => {
  flipped = !flipped;
  renderBoard();
});

$("#clearLogBtn").addEventListener("click", () => {
  logEl.textContent = "";
});

sideSelect.addEventListener("change", startNewGame);

depthSlider.addEventListener("input", () => {
  depthValue.textContent = depthSlider.value;
});

delaySlider.addEventListener("input", () => {
  delayValue.textContent = `${delaySlider.value} ms`;
});

async function boot() {
  try {
    await engine.start();
    log("Stockfish UCI ready.");
    startNewGame();
  } catch (e) {
    engineBadge.textContent = "ENGINE ERROR";
    engineBadge.className = "badge error";
    log(e.message || String(e));
    gameStatus.textContent = e.message || String(e);
  }
}

renderBoard();
boot();
