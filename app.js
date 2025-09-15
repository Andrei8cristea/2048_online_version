'use strict';


// Cristea Andrei - 2048 Game in JavaScript

// === Configurations & Globals ===
const SIZE = 4;
const PROBABILITIES = [ { value: 2, weight: 6 },
                        { value: 4, weight: 3 },
                        { value: 8, weight: 1 } ];
const LIMIT_SCORES_PER_PAGE = 10;

let grid = [];
let score = 0;

// DOM Elements
const gridContainer   = document.getElementById('grid');
const scoreElement    = document.getElementById('score');
const overlayGameOver = document.getElementById('game-over');
const inputName       = document.getElementById('player-name');
const btnSubmit       = document.getElementById('submit-score');
const highScoresList  = document.getElementById('high-scores');

// === Initialization ===
function initGame() {
  // 1) reset state
  grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  score = 0;
  updateScoreDisplay();
  overlayGameOver.classList.add('hidden');

  // 2) build DOM cells
  gridContainer.innerHTML = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      gridContainer.append(cell);
    }
  }

  // 3) spawn two initial tiles and render
  addTile();
  addTile();
  drawGrid();
}





// === Spawning Tiles ===
function addTile() {
  // collect empty positions
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) empty.push({ r, c });
    }
  }
  if (!empty.length) return false;

  // choose random empty
  const idx = Math.floor(Math.random() * empty.length);
  const { r, c } = empty[idx];

  // weighted random value
  const totalWeight = PROBABILITIES.reduce((a,b) => a + b.weight, 0);
  let rnd = Math.random() * totalWeight; // it returns a rand value between 0 and 1
  let chosen = PROBABILITIES.find(p => {
    rnd -= p.weight;
    return rnd <= 0;
  });

  grid[r][c] = chosen.value;
  return true;
}

// === Rendering ===
function drawGrid() {
  const cells = gridContainer.querySelectorAll('.cell');
  cells.forEach((cell, idx) => {
    const r = Math.floor(idx / SIZE);
    const c = idx % SIZE;
    const val = grid[r][c];
    cell.textContent = val === 0 ? '' : val;
    cell.className = 'cell';
    if (val !== 0) cell.classList.add(`tile-${val}`);
  });
}

function updateScoreDisplay() {
  scoreElement.textContent = `Score: ${score}`;
}

// === Movement Helpers ===
function compress(row) {
  const filtered = row.filter(x => x !== 0);
  return filtered.concat(Array(row.length - filtered.length).fill(0));
}

function merge(row) {
  for (let i = 0; i < row.length - 1; i++) {
    if (row[i] !== 0 && row[i] === row[i+1]) {
      row[i] *= 2;
      score += row[i];
      row[i+1] = 0;
      i++;
    }
  }
  return row;
}

function moveLeft() {
  let moved = false;
  for (let r = 0; r < SIZE; r++) {
    let row = grid[r].slice();
    let compressed = compress(row);
    let merged     = merge(compressed);
    let result     = compress(merged);
    if (JSON.stringify(result) !== JSON.stringify(row)) {
      moved = true;
      grid[r] = result;
    }
  }
  return moved;
}

function moveRight() {
  let moved = false;
  for (let r = 0; r < SIZE; r++) {
    let row = grid[r].slice().reverse();
    let compressed = compress(row);
    let merged     = merge(compressed);
    let result     = compress(merged).reverse();
    if (JSON.stringify(result) !== JSON.stringify(grid[r])) {
      moved = true;
      grid[r] = result;
    }
  }
  return moved;
}

function transpose(matrix) {
  return matrix[0].map((_, c) => matrix.map(r => r[c]));
}

function moveUp() {
  grid = transpose(grid);
  const moved = moveLeft();
  grid = transpose(grid);
  return moved;
}

function moveDown() {
  grid = transpose(grid);
  const moved = moveRight();
  grid = transpose(grid);
  return moved;
}

function isGameOver() {
  // if any zero exists
  if (grid.some(row => row.includes(0))) return false;
  // if any merge possible
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c < SIZE-1 && grid[r][c] === grid[r][c+1]) return false;
      if (r < SIZE-1 && grid[r][c] === grid[r+1][c]) return false;
    }
  }
  return true;
}

// === Event Handlers ===
window.addEventListener('keydown', e => {
  let moved = false;
  switch(e.key) {
    case 'ArrowLeft': case 'a': case 'A': moved = moveLeft();  break;

    case 'ArrowRight': case 'd': case 'D': moved = moveRight(); break;

    case 'ArrowUp':    case 'w': case 'W': moved = moveUp();    break;

    case 'ArrowDown':  case 's': case 'S': moved = moveDown();  break;

    default: return;
  }
  if (moved) {
    addTile();
    updateScoreDisplay();
    drawGrid();
    if (isGameOver()) showGameOver();
  }
});

async function handleSubmit(){
  const name = inputName.value.trim() || 'Anonim';

    // Show loading state
  btnSubmit.textContent = 'Saving...';
  btnSubmit.disabled = true;
  
  // Submit score to Firebase
  const success = await submitScore(name, score);
  
  if (success) {
    // Reset button and hide overlay
    btnSubmit.textContent = 'Send Score';
    btnSubmit.disabled = false;
    inputName.value = '';
    overlayGameOver.classList.add('hidden');
  } else {
    // Show error and reset button
    alert('Error at saving the score. Try again please!');
    btnSubmit.textContent = 'Send Score';
    btnSubmit.disabled = false;
  }
}



btnSubmit.addEventListener('click', handleSubmit);
inputName.addEventListener('keydown', e =>{
  if(e.key === 'Enter'){
    handleSubmit();
  }
})


function showGameOver() {
  overlayGameOver.classList.remove('hidden');
}

// === Start ===
document.addEventListener('DOMContentLoaded', async () => {
  initGame();
  
  // Load high scores from Firebase
  await refreshHighScores();
});








// === Firebase Functions ===
async function submitScore(playerName, playerScore) {
  try {
    // Add score to Firestore
    await window.firebaseModules.addDoc(
      window.firebaseModules.collection(window.db, 'scores'), 
      {
        name: playerName,
        score: playerScore,
        timestamp: new Date(),
        date: new Date().toLocaleDateString('ro-RO')
      }
    );
    
    console.log('The scor has been saved successfully');
    
    // Refresh leaderboard after saving
    await refreshHighScores();
    
    return true;
  } catch (error) {
    console.error('Error at posting:', error);
    return false;
  }
}

async function refreshHighScores() {
  try {
    const q = window.firebaseModules.query(
      window.firebaseModules.collection(window.db, 'scores'),
      window.firebaseModules.orderBy('score', 'desc'),
      window.firebaseModules.limit(LIMIT_SCORES_PER_PAGE)
    );
    
    const querySnapshot = await window.firebaseModules.getDocs(q);
    
    // Clear current high scores
    highScoresList.innerHTML = '';
    
    if (querySnapshot.empty) {
      highScoresList.innerHTML = '<li>No scores available yet.</li>';
      return;
    }
    
    // Add each score to the list
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const li = document.createElement('li');
      li.textContent = `${data.name}: ${data.score}     <---->    ${data.date}`;
      highScoresList.appendChild(li);
    });
    
  } catch (error) {
    console.error('Error at scores rendering:', error);
    highScoresList.innerHTML = '<li>error at displaying the scores.</li>';
  }
}