const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const scoreHumanEl = document.getElementById('score-human-val');
const scoreAiEl = document.getElementById('score-ai-val');
const scoreTieEl = document.getElementById('score-tie-val');
const resetScoresBtn = document.getElementById('reset-scores');
let board = Array(9).fill(null);
let human = 'X';
let ai = 'O';
let gameOver = false;
let scores = { human: 0, ai: 0, tie: 0 };

function init(){
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
      if(winner === human) scores.human++; else scores.ai++;
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

// Minimax für perfekten Computergegner
function bestMove(){
  let bestScore = -Infinity;
  let move = null;
  for(let i=0;i<9;i++){
    if(!board[i]){
      board[i]=ai;
      const score = minimax(board, 0, false);
      board[i]=null;
      if(score>bestScore){ bestScore=score; move=i }
    }
  }
  return move ?? board.findIndex(x=>!x);
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
