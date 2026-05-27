const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const scoreHumanEl = document.getElementById('score-human-val');
const scoreAiEl = document.getElementById('score-ai-val');
const scoreTieEl = document.getElementById('score-tie-val');
const resetScoresBtn = document.getElementById('reset-scores');
const victoryOverlay = document.getElementById('victory-overlay');
const lossOverlay = document.getElementById('loss-overlay');
let board = Array(9).fill(null);
let human = 'X';
let ai = 'O';
// Wahrscheinlichkeit, dass die KI einen suboptimalen Zug wählt.
// Höherer Wert macht das Spiel einfacher für den Spieler.
const AI_MISTAKE_RATE = 0.6;
let gameOver = false;
let scores = { human: 0, ai: 0, tie: 0 };

function init(){
  clearVictoryAnimation();
  clearLossScreen();
  boardEl.innerHTML = '';
  board = Array(9).fill(null);
  gameOver = false;
  statusEl.textContent = 'Dein Zug (X)';
  for(let i=0;i<9;i++){
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.idx = i;
    cell.addEventListener('click', onCellClick);
    boardEl.appendChild(cell);
  }
}

function loadScores(){
  try{
    const s = localStorage.getItem('ttt-scores');
    if(s) scores = JSON.parse(s);
  }catch(e){ scores = { human:0, ai:0, tie:0 } }
  renderScores();
}

function saveScores(){
  try{ localStorage.setItem('ttt-scores', JSON.stringify(scores)); }catch(e){}
}

function renderScores(){
  if(scoreHumanEl) scoreHumanEl.textContent = scores.human;
  if(scoreAiEl) scoreAiEl.textContent = scores.ai;
  if(scoreTieEl) scoreTieEl.textContent = scores.tie;
}

function onCellClick(e){
  const idx = Number(e.currentTarget.dataset.idx);
  if(gameOver || board[idx]) return;
  makeMove(idx, human);
  render();
  const winner = checkWinner(board);
  if(winner || isBoardFull(board)) return endGame();
  statusEl.textContent = 'Computer denkt...';
  // kurzer Delay für besseres Gefühl
  setTimeout(()=>{
    const move = bestMove();
    makeMove(move, ai);
    render();
    endGame();
  }, 200);
}

function makeMove(idx, player){
  board[idx]=player;
}

function render(){
  const cells = boardEl.children;
  for(let i=0;i<9;i++){
    const v = board[i];
    const el = cells[i];
    el.textContent = v? v : '';
    if(v) el.classList.add('disabled'); else el.classList.remove('disabled');
  }
}

function endGame(){
  const winner = checkWinner(board);
  if(winner){
    gameOver = true;
    if(winner === 'tie'){
      statusEl.textContent = 'Unentschieden';
      scores.tie++;
    } else {
      statusEl.textContent = winner === human ? 'Du gewinnst!' : 'Computer gewinnt';
      if(winner === human){
        scores.human++;
        showVictoryAnimation();
      } else {
        scores.ai++;
        showLossScreen();
      }
      highlightWinningCells(winningLine(board));
    }
    saveScores();
    renderScores();
    return;
  }
  statusEl.textContent = 'Dein Zug (X)';
}

function isBoardFull(b){
  return b.every(Boolean);
}

function checkWinner(b){
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(const [a,c,d] of lines){
    if(b[a] && b[a]===b[c] && b[a]===b[d]) return b[a];
  }
  if(b.every(x=>x)) return 'tie';
  return null;
}

function winningLine(b){
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(const line of lines){
    const [a,c,d]=line;
    if(b[a] && b[a]===b[c] && b[a]===b[d]) return line;
  }
  return [];
}

function highlightWinningCells(line){
  const cells = boardEl.children;
  for(let i=0;i<9;i++) cells[i].classList.remove('win');
  for(const idx of line){
    cells[idx].classList.add('win');
  }
}

function showVictoryAnimation(){
  if(!victoryOverlay) return;
  victoryOverlay.classList.add('visible');
  victoryOverlay.classList.remove('hidden');
  for(let i=0;i<18;i++){
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random()*100}vw`;
    piece.style.background = ['#ff4d6d','#ffd700','#4d8cff','#79ff8c','#ff8c4d'][Math.floor(Math.random()*5)];
    piece.style.animationDuration = `${1.2 + Math.random()*0.8}s`;
    piece.style.transform = `translateY(${Math.random()*-20}px) rotate(${Math.random()*360}deg)`;
    document.body.appendChild(piece);
    setTimeout(()=> piece.remove(), 1800);
  }
  setTimeout(clearVictoryAnimation, 2200);
}

function showLossScreen(){
  if(!lossOverlay) return;
  lossOverlay.classList.add('visible');
  lossOverlay.classList.remove('hidden');
}

function clearLossScreen(){
  if(!lossOverlay) return;
  lossOverlay.classList.remove('visible');
  lossOverlay.classList.add('hidden');
}

function clearVictoryAnimation(){
  if(!victoryOverlay) return;
  victoryOverlay.classList.remove('visible');
  victoryOverlay.classList.add('hidden');
  document.querySelectorAll('.confetti-piece').forEach(el => el.remove());
}

// Minimax für perfekten Computergegner
function bestMove(){
  const moves = [];
  for(let i=0;i<9;i++){
    if(!board[i]){
      board[i]=ai;
      const score = minimax(board, 0, false);
      board[i]=null;
      moves.push({ idx: i, score });
    }
  }
  if(moves.length === 0) return board.findIndex(x=>!x);
  moves.sort((a,b)=>b.score - a.score);
  const bestScore = moves[0].score;
  const bestMoves = moves.filter(m=>m.score===bestScore).map(m=>m.idx);
  // Mit einer Wahrscheinlichkeit macht die KI absichtlich einen suboptimalen Zug
  if(Math.random() < AI_MISTAKE_RATE && moves.length > 1){
    const nonBest = moves.filter(m=>m.score < bestScore).map(m=>m.idx);
    if(nonBest.length > 0) return nonBest[Math.floor(Math.random()*nonBest.length)];
  }
  // sonst einen zufälligen besten Zug wählen (falls mehrere gleich gut sind)
  return bestMoves[Math.floor(Math.random()*bestMoves.length)];
}

function minimax(b, depth, isMaximizing){
  const res = checkWinner(b);
  if(res!==null){
    if(res===ai) return 10 - depth;
    if(res===human) return depth - 10;
    if(res==='tie') return 0;
  }
  if(isMaximizing){
    let best = -Infinity;
    for(let i=0;i<9;i++){
      if(!b[i]){ b[i]=ai; best = Math.max(best, minimax(b, depth+1, false)); b[i]=null }
    }
    return best;
  } else {
    let best = Infinity;
    for(let i=0;i<9;i++){
      if(!b[i]){ b[i]=human; best = Math.min(best, minimax(b, depth+1, true)); b[i]=null }
    }
    return best;
  }
}

restartBtn.addEventListener('click', ()=>{ init(); render(); });

resetScoresBtn && resetScoresBtn.addEventListener('click', ()=>{
  scores = { human:0, ai:0, tie:0 };
  saveScores(); renderScores();
});

// Start
loadScores();
init(); render();
