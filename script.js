// ================= GAME STATE =================
let board = [
    [' ', ' ', ' '],
    [' ', ' ', ' '],
    [' ', ' ', ' ']
];

let currentPlayer = 'X';
let gameActive = true;
let gameMode = "pvp"; // pvp, ai, multiplayer
let difficulty = "easy";

let scores = { X: 0, O: 0, draws: 0 };

// ================= MULTIPLAYER STATE =================
let playerId = null;
let playerSymbol = null;
let roomCode = null;
let roomRef = null;
let isHost = false;
let db = null;

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
    apiKey: "AIzaSyD1Zxm0kLEXPlVb3Uqgbq_lvmfuuqJjT-g",
    authDomain: "adhi-tic-tac.firebaseapp.com",
    databaseURL: "https://adhi-tic-tac-default-rtdb.firebaseio.com",
    projectId: "adhi-tic-tac",
    storageBucket: "adhi-tic-tac.firebasestorage.app",
    messagingSenderId: "914827700084",
    appId: "1:914827700084:web:85e34f3b81d7e7a9466e21",
    measurementId: "G-9JM87TLZE2"
};

// ================= SOUND EFFECTS =================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!audioCtx) initAudio();

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
}

function playMoveSound(player) {
    initAudio();
    if (player === 'X') {
        playTone(600, 0.1, 'sine', 0.2);
        setTimeout(() => playTone(800, 0.08, 'sine', 0.15), 50);
    } else {
        playTone(400, 0.12, 'sine', 0.2);
        setTimeout(() => playTone(500, 0.1, 'sine', 0.15), 60);
    }
}

function playWinSound() {
    initAudio();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.25, 'sine', 0.25), i * 120);
    });
}

function playDrawSound() {
    initAudio();
    playTone(350, 0.2, 'triangle', 0.2);
    setTimeout(() => playTone(300, 0.3, 'triangle', 0.15), 150);
}

function playClickSound() {
    initAudio();
    playTone(700, 0.05, 'sine', 0.15);
}

function playJoinSound() {
    initAudio();
    playTone(523, 0.15, 'sine', 0.2);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 100);
}

function playGameStartSound() {
    initAudio();
    // Uplifting arpeggio
    const notes = [392, 523, 659, 784]; // G4, C5, E5, G5
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.15, 'sine', 0.2), i * 80);
    });
}

function playInvalidSound() {
    initAudio();
    // Low buzz for invalid move
    playTone(150, 0.15, 'square', 0.1);
}

function playLoseSound() {
    initAudio();
    // Descending sad notes
    const notes = [392, 349, 311, 294]; // G4, F4, Eb4, D4
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.2, 'sine', 0.2), i * 150);
    });
}

function playHoverSound() {
    initAudio();
    playTone(880, 0.03, 'sine', 0.08);
}

// ================= DOM =================
let cells,
    turnIndicator,
    currentPlayerDisplay,
    playerXIndicator,
    playerOIndicator,
    restartBtn,
    modalOverlay,
    resultIcon,
    resultTitle,
    resultSubtitle,
    playAgainBtn,
    xWinsDisplay,
    oWinsDisplay,
    drawsDisplay,
    pvpBtn,
    aiBtn,
    multiplayerBtn,
    difficultySelect,
    difficultyWrapper,
    multiplayerPanel,
    mpStatus,
    mpStatusText,
    mpActions,
    mpRoomInfo,
    createRoomBtn,
    joinRoomBtn,
    roomCodeInput,
    roomCodeDisplay,
    copyCodeBtn,
    leaveRoomBtn,
    playerXStatus,
    playerOStatus,
    yourTurnBadge;

// ================= WIN COMBINATIONS =================
const winningCombinations = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]]
];

// ================= INIT =================
function init() {
    // Generate unique player ID
    playerId = 'player_' + Math.random().toString(36).substr(2, 9);

    cells = document.querySelectorAll('.cell');
    turnIndicator = document.getElementById('turnIndicator');
    currentPlayerDisplay = document.getElementById('currentPlayerDisplay');
    playerXIndicator = document.getElementById('playerX');
    playerOIndicator = document.getElementById('playerO');
    restartBtn = document.getElementById('restartBtn');

    modalOverlay = document.getElementById('modalOverlay');
    resultIcon = document.getElementById('resultIcon');
    resultTitle = document.getElementById('resultTitle');
    resultSubtitle = document.getElementById('resultSubtitle');
    playAgainBtn = document.getElementById('playAgainBtn');

    xWinsDisplay = document.getElementById('xWins');
    oWinsDisplay = document.getElementById('oWins');
    drawsDisplay = document.getElementById('draws');

    pvpBtn = document.getElementById("pvpBtn");
    aiBtn = document.getElementById("aiBtn");
    multiplayerBtn = document.getElementById("multiplayerBtn");
    difficultySelect = document.getElementById("difficulty");
    difficultyWrapper = document.getElementById("difficultyWrapper");

    // Multiplayer elements
    multiplayerPanel = document.getElementById("multiplayerPanel");
    mpStatus = document.getElementById("mpStatus");
    mpStatusText = document.getElementById("mpStatusText");
    mpActions = document.getElementById("mpActions");
    mpRoomInfo = document.getElementById("mpRoomInfo");
    createRoomBtn = document.getElementById("createRoomBtn");
    joinRoomBtn = document.getElementById("joinRoomBtn");
    roomCodeInput = document.getElementById("roomCodeInput");
    roomCodeDisplay = document.getElementById("roomCodeDisplay");
    copyCodeBtn = document.getElementById("copyCodeBtn");
    leaveRoomBtn = document.getElementById("leaveRoomBtn");
    playerXStatus = document.getElementById("playerXStatus");
    playerOStatus = document.getElementById("playerOStatus");
    yourTurnBadge = document.getElementById("yourTurnBadge");

    cells.forEach(cell =>
        cell.addEventListener("click", handleCellClick)
    );

    restartBtn.onclick = () => {
        playClickSound();
        if (gameMode === "multiplayer" && roomRef) {
            resetMultiplayerGame();
        } else {
            resetGame();
        }
    };

    playAgainBtn.onclick = () => {
        playClickSound();
        hideModal();
        if (gameMode === "multiplayer" && roomRef) {
            resetMultiplayerGame();
        } else {
            resetGame();
        }
    };

    pvpBtn.onclick = () => startMode("pvp");
    aiBtn.onclick = () => startMode("ai");
    multiplayerBtn.onclick = () => startMode("multiplayer");

    difficultySelect.onchange = e => {
        playClickSound();
        difficulty = e.target.value;
    };

    // Multiplayer button handlers
    if (createRoomBtn) {
        createRoomBtn.onclick = () => {
            playClickSound();
            createRoom();
        };
    }
    if (joinRoomBtn) {
        joinRoomBtn.onclick = () => {
            playClickSound();
            joinRoom();
        };
    }
    if (copyCodeBtn) {
        copyCodeBtn.onclick = () => {
            playClickSound();
            copyRoomCode();
        };
    }
    if (leaveRoomBtn) {
        leaveRoomBtn.onclick = () => {
            playClickSound();
            leaveRoom();
        };
    }

    // Room code input - auto uppercase
    if (roomCodeInput) {
        roomCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinRoom();
            }
        });
    }

    loadScores();
    updatePlayerIndicators();
    initFirebase();
}

// ================= FIREBASE INIT =================
function initFirebase() {
    try {
        if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
            firebase.initializeApp(firebaseConfig);
            db = firebase.database();
            console.log("Firebase initialized successfully");
        } else {
            console.log("Firebase not configured - multiplayer disabled");
        }
    } catch (error) {
        console.error("Firebase init error:", error);
    }
}

// ================= MODE =================
function startMode(mode) {
    // Leave current room if switching away from multiplayer
    if (gameMode === "multiplayer" && mode !== "multiplayer") {
        leaveRoom();
    }

    gameMode = mode;

    // Toggle active class on mode buttons
    pvpBtn.classList.toggle('active', mode === 'pvp');
    aiBtn.classList.toggle('active', mode === 'ai');
    if (multiplayerBtn) {
        multiplayerBtn.classList.toggle('active', mode === 'multiplayer');
    }

    // Show/hide difficulty selector (only for AI mode)
    if (difficultyWrapper) {
        difficultyWrapper.style.display = mode === 'ai' ? 'flex' : 'none';
    }

    // Show/hide multiplayer panel
    if (multiplayerPanel) {
        multiplayerPanel.classList.toggle('hidden', mode !== 'multiplayer');
    }

    // Update player 2 label
    const player2Label = document.getElementById('player2Label');
    if (player2Label) {
        if (mode === 'ai') {
            player2Label.textContent = 'AI';
        } else if (mode === 'multiplayer') {
            player2Label.textContent = 'Online';
        } else {
            player2Label.textContent = 'Player 2';
        }
    }

    // Hide your turn badge for non-multiplayer modes
    if (yourTurnBadge) {
        yourTurnBadge.classList.add('hidden');
    }

    resetGame();
}

// ================= MULTIPLAYER FUNCTIONS =================
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function createRoom() {
    if (!db) {
        alert("Firebase not configured. Please add your Firebase config to script.js");
        return;
    }

    roomCode = generateRoomCode();
    isHost = true;
    playerSymbol = 'X';

    const roomData = {
        board: board.map(row => row.join('')).join(''),
        currentPlayer: 'X',
        players: {
            X: { id: playerId, connected: true },
            O: { id: null, connected: false }
        },
        status: 'waiting',
        winner: null,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    roomRef = db.ref('rooms/' + roomCode);
    roomRef.set(roomData).then(() => {
        console.log("Room created:", roomCode);
        subscribeToRoom();
        updateMultiplayerUI('waiting');
        showRoomInfo();
    }).catch(error => {
        console.error("Error creating room:", error);
        alert("Failed to create room. Please try again.");
    });

    // Set up disconnect cleanup
    roomRef.child('players/X/connected').onDisconnect().set(false);
}

function joinRoom() {
    if (!db) {
        alert("Firebase not configured. Please add your Firebase config to script.js");
        return;
    }

    const code = roomCodeInput.value.toUpperCase().trim();
    if (code.length !== 6) {
        alert("Please enter a valid 6-character room code");
        return;
    }

    roomCode = code;
    roomRef = db.ref('rooms/' + roomCode);

    roomRef.once('value').then(snapshot => {
        if (!snapshot.exists()) {
            alert("Room not found. Please check the code and try again.");
            roomRef = null;
            roomCode = null;
            return;
        }

        const roomData = snapshot.val();

        if (roomData.players.O && roomData.players.O.id && roomData.players.O.connected) {
            alert("Room is full. Please try another room.");
            roomRef = null;
            roomCode = null;
            return;
        }

        isHost = false;
        playerSymbol = 'O';

        // Join as player O
        roomRef.child('players/O').set({
            id: playerId,
            connected: true
        }).then(() => {
            roomRef.child('status').set('playing');
            console.log("Joined room:", roomCode);
            playJoinSound();
            subscribeToRoom();
            updateMultiplayerUI('connected');
            showRoomInfo();
        });

        // Set up disconnect cleanup
        roomRef.child('players/O/connected').onDisconnect().set(false);
    }).catch(error => {
        console.error("Error joining room:", error);
        alert("Failed to join room. Please try again.");
    });
}

function subscribeToRoom() {
    if (!roomRef) return;

    roomRef.on('value', snapshot => {
        if (!snapshot.exists()) {
            // Room was deleted
            handleRoomDeleted();
            return;
        }

        const data = snapshot.val();

        // Update board from Firebase
        if (data.board) {
            const boardStr = data.board;
            for (let i = 0; i < 9; i++) {
                const r = Math.floor(i / 3);
                const c = i % 3;
                board[r][c] = boardStr[i] === '-' ? ' ' : boardStr[i];
            }
            renderBoard();
        }

        // Update current player
        if (data.currentPlayer) {
            currentPlayer = data.currentPlayer;
            updatePlayerIndicators();
            updateYourTurnBadge();
        }

        // Update game status
        if (data.status === 'playing') {
            gameActive = true;
            updateMultiplayerUI('connected');
        } else if (data.status === 'waiting') {
            gameActive = false;
            updateMultiplayerUI('waiting');
        } else if (data.status === 'finished') {
            gameActive = false;
            if (data.winner && data.winner !== 'shown') {
                // Show result
                if (data.winner === 'draw') {
                    playDrawSound();
                    showModal('draw');
                } else {
                    playWinSound();
                    showModal('win', data.winner);
                }
            }
        }

        // Update player statuses
        updatePlayerStatuses(data.players);

        // Check for opponent join
        if (isHost && data.players.O && data.players.O.connected && data.status === 'playing') {
            playJoinSound();
        }
    });
}

function handleRoomDeleted() {
    // Clean up listener first to prevent further callbacks
    if (roomRef) {
        roomRef.off();
        roomRef = null;
    }

    // Reset state
    roomCode = null;
    playerSymbol = null;
    isHost = false;

    // Update UI
    updateMultiplayerUI('offline');
    hideRoomInfo();
    resetGame();

    // Show alert after cleanup to prevent blocking
    setTimeout(() => {
        alert("The room has been closed.");
    }, 100);
}

function updatePlayerStatuses(players) {
    if (!playerXStatus || !playerOStatus) return;

    if (players.X && players.X.connected) {
        playerXStatus.textContent = players.X.id === playerId ? 'You' : 'Connected';
        playerXStatus.className = 'rp-status ' + (players.X.id === playerId ? 'you' : 'opponent');
    } else {
        playerXStatus.textContent = 'Waiting...';
        playerXStatus.className = 'rp-status';
    }

    if (players.O && players.O.connected) {
        playerOStatus.textContent = players.O.id === playerId ? 'You' : 'Connected';
        playerOStatus.className = 'rp-status ' + (players.O.id === playerId ? 'you' : 'opponent');
    } else {
        playerOStatus.textContent = 'Waiting...';
        playerOStatus.className = 'rp-status';
    }
}

function updateYourTurnBadge() {
    if (!yourTurnBadge || gameMode !== 'multiplayer') return;

    if (currentPlayer === playerSymbol && gameActive) {
        yourTurnBadge.classList.remove('hidden');
    } else {
        yourTurnBadge.classList.add('hidden');
    }
}

function updateMultiplayerUI(status) {
    if (!mpStatus) return;

    const statusDot = mpStatus.querySelector('.status-dot');

    if (status === 'waiting') {
        statusDot.className = 'status-dot waiting';
        mpStatusText.textContent = 'Waiting for opponent...';
    } else if (status === 'connected') {
        statusDot.className = 'status-dot connected';
        mpStatusText.textContent = 'Connected - Game On!';
    } else {
        statusDot.className = 'status-dot offline';
        mpStatusText.textContent = 'Not Connected';
    }
}

function showRoomInfo() {
    if (mpActions) mpActions.style.display = 'none';
    if (mpRoomInfo) mpRoomInfo.classList.remove('hidden');
    if (roomCodeDisplay) roomCodeDisplay.textContent = roomCode;
}

function hideRoomInfo() {
    if (mpActions) mpActions.style.display = 'flex';
    if (mpRoomInfo) mpRoomInfo.classList.add('hidden');
    if (roomCodeInput) roomCodeInput.value = '';
}

function copyRoomCode() {
    if (!roomCode) return;

    navigator.clipboard.writeText(roomCode).then(() => {
        copyCodeBtn.textContent = '✓';
        copyCodeBtn.classList.add('copied');
        setTimeout(() => {
            copyCodeBtn.textContent = '📋';
            copyCodeBtn.classList.remove('copied');
        }, 2000);
    }).catch(() => {
        // Fallback
        prompt("Copy this room code:", roomCode);
    });
}

function leaveRoom() {
    if (roomRef) {
        // Turn off listener first to prevent callbacks during cleanup
        roomRef.off();

        // Store ref temporarily for cleanup operations
        const tempRef = roomRef;
        const tempSymbol = playerSymbol;
        const tempIsHost = isHost;

        // Clear refs immediately to prevent any race conditions
        roomRef = null;

        // Mark as disconnected (fire and forget)
        if (tempSymbol) {
            tempRef.child('players/' + tempSymbol + '/connected').set(false).catch(() => { });
        }

        // If host, delete the room (fire and forget)
        if (tempIsHost) {
            tempRef.remove().catch(() => { });
        }
    }

    roomCode = null;
    playerSymbol = null;
    isHost = false;

    updateMultiplayerUI('offline');
    hideRoomInfo();
    resetGame();
}

function syncMove(r, c) {
    if (!roomRef) return;

    const boardStr = board.map(row => row.map(cell => cell === ' ' ? '-' : cell).join('')).join('');
    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';

    roomRef.update({
        board: boardStr,
        currentPlayer: nextPlayer
    });
}

function syncGameEnd(winner) {
    if (!roomRef) return;

    roomRef.update({
        status: 'finished',
        winner: winner || 'draw'
    });
}

function resetMultiplayerGame() {
    if (!roomRef) return;

    const emptyBoard = '---------';
    roomRef.update({
        board: emptyBoard,
        currentPlayer: 'X',
        status: 'playing',
        winner: null
    });
}

function renderBoard() {
    cells.forEach(cell => {
        const r = Number(cell.dataset.row);
        const c = Number(cell.dataset.col);
        const value = board[r][c];

        cell.textContent = value === ' ' ? '' : value;
        cell.className = 'cell';
        if (value !== ' ') {
            cell.classList.add(value.toLowerCase(), 'taken');
        }
    });
}

// ================= CLICK =================
function handleCellClick(e) {
    if (!gameActive) return;

    // In multiplayer, only allow moves on your turn
    if (gameMode === "multiplayer") {
        if (!roomRef || currentPlayer !== playerSymbol) {
            return;
        }
    }

    const cell = e.target;
    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);

    if (board[r][c] !== ' ') return;

    makeMove(r, c);

    if (gameMode === "ai" && gameActive && currentPlayer === "O") {
        setTimeout(aiMove, 250);
    }
}

// ================= MOVE =================
function makeMove(r, c) {
    board[r][c] = currentPlayer;

    const cell = document.querySelector(
        `[data-row="${r}"][data-col="${c}"]`
    );

    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase(), "taken");

    // Play move sound
    playMoveSound(currentPlayer);

    const win = checkWin();
    if (win) {
        gameActive = false;
        highlightWinningCells(win);
        scores[currentPlayer]++;
        saveScores();
        updateScoreDisplay();

        if (gameMode === "multiplayer") {
            // Capture winner BEFORE syncMove, because syncMove updates currentPlayer in Firebase
            // and the listener might change our local currentPlayer before syncGameEnd runs
            const winner = currentPlayer;
            syncMove(r, c);
            syncGameEnd(winner);
        } else {
            setTimeout(() => {
                showModal("win", currentPlayer);
            }, 500);
        }
        return;
    }

    if (isBoardFull()) {
        gameActive = false;
        scores.draws++;
        saveScores();
        updateScoreDisplay();

        if (gameMode === "multiplayer") {
            syncMove(r, c);
            syncGameEnd('draw');
        } else {
            setTimeout(() => {
                showModal("draw");
            }, 400);
        }
        return;
    }

    // Sync move to Firebase in multiplayer
    if (gameMode === "multiplayer") {
        syncMove(r, c);
        // Don't update currentPlayer locally for multiplayer - let Firebase sync handle it
        // This prevents race conditions where both players think it's their turn
        return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updatePlayerIndicators();
    updateYourTurnBadge();
}

// ================= AI =================
function aiMove() {
    let move;

    if (difficulty === "hard") move = bestMoveMinimax();
    else if (difficulty === "medium") move = smartMove();
    else move = randomMove();

    makeMove(move[0], move[1]);
}

function randomMove() {
    let empty = [];
    for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
            if (board[r][c] === ' ')
                empty.push([r, c]);

    return empty[Math.floor(Math.random() * empty.length)];
}

function smartMove() {
    for (const combo of winningCombinations) {
        const v = combo.map(p => board[p[0]][p[1]]);
        if (v.filter(x => x === 'O').length === 2 && v.includes(' '))
            return combo[v.indexOf(' ')];
    }

    for (const combo of winningCombinations) {
        const v = combo.map(p => board[p[0]][p[1]]);
        if (v.filter(x => x === 'X').length === 2 && v.includes(' '))
            return combo[v.indexOf(' ')];
    }

    return randomMove();
}

function bestMoveMinimax() {
    let bestScore = -Infinity;
    let move;

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (board[r][c] === ' ') {
                board[r][c] = 'O';
                let score = minimax(0, false);
                board[r][c] = ' ';
                if (score > bestScore) {
                    bestScore = score;
                    move = [r, c];
                }
            }
        }
    }
    return move;
}

function minimax(depth, isMax) {
    const result = evaluate();
    if (result !== null) return result - depth;

    if (isMax) {
        let best = -Infinity;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[r][c] === ' ') {
                    board[r][c] = 'O';
                    best = Math.max(best, minimax(depth + 1, false));
                    board[r][c] = ' ';
                }
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[r][c] === ' ') {
                    board[r][c] = 'X';
                    best = Math.min(best, minimax(depth + 1, true));
                    board[r][c] = ' ';
                }
            }
        }
        return best;
    }
}

function evaluate() {
    for (const combo of winningCombinations) {
        const [a, b, c] = combo;
        if (
            board[a[0]][a[1]] !== ' ' &&
            board[a[0]][a[1]] === board[b[0]][b[1]] &&
            board[b[0]][b[1]] === board[c[0]][c[1]]
        ) {
            return board[a[0]][a[1]] === 'O' ? 10 : -10;
        }
    }
    return isBoardFull() ? 0 : null;
}

// ================= HELPERS =================
function checkWin() {
    for (const combo of winningCombinations) {
        const [a, b, c] = combo;
        if (
            board[a[0]][a[1]] === currentPlayer &&
            board[b[0]][b[1]] === currentPlayer &&
            board[c[0]][c[1]] === currentPlayer
        ) return combo;
    }
    return null;
}

function isBoardFull() {
    return board.flat().every(c => c !== ' ');
}

function highlightWinningCells(combo) {
    combo.forEach(([r, c]) => {
        document
            .querySelector(`[data-row="${r}"][data-col="${c}"]`)
            .classList.add("winning");
    });
}

function updatePlayerIndicators() {
    currentPlayerDisplay.textContent = currentPlayer;
    playerXIndicator.classList.toggle("active", currentPlayer === "X");
    playerOIndicator.classList.toggle("active", currentPlayer === "O");
    turnIndicator.className =
        `turn-indicator player-${currentPlayer.toLowerCase()}`;
}

// ================= MODAL =================
function showModal(type, winner) {
    if (gameMode === "multiplayer" && type === "win") {
        if (winner === playerSymbol) {
            resultIcon.textContent = "🎉";
            resultTitle.textContent = "You Win!";
            resultSubtitle.textContent = "Congratulations!";
            playWinSound();
        } else {
            resultIcon.textContent = "😢";
            resultTitle.textContent = "You Lose!";
            resultSubtitle.textContent = "Better luck next time!";
            playLoseSound();
        }
    } else if (type === "draw") {
        resultIcon.textContent = "🤝";
        resultTitle.textContent = "Draw!";
        resultSubtitle.textContent = "Try again!";
        playDrawSound();
    } else {
        resultIcon.textContent = "🎉";
        resultTitle.textContent = `Player ${winner} Wins!`;
        resultSubtitle.textContent = "Great move!";
        playWinSound();
    }

    modalOverlay.classList.add("active");
}

function hideModal() {
    modalOverlay.classList.remove("active");
}

// ================= RESET =================
function resetGame() {
    board = [
        [' ', ' ', ' '],
        [' ', ' ', ' '],
        [' ', ' ', ' ']
    ];

    cells.forEach(c => {
        c.textContent = "";
        c.className = "cell";
    });

    currentPlayer = "X";
    gameActive = gameMode !== "multiplayer" || (roomRef !== null);
    updatePlayerIndicators();
    updateYourTurnBadge();
}

// ================= SCORE =================
function saveScores() {
    localStorage.setItem("tictactoe-scores", JSON.stringify(scores));
}

function loadScores() {
    const data = localStorage.getItem("tictactoe-scores");
    if (data) {
        scores = JSON.parse(data);
        updateScoreDisplay();
    }
}

function updateScoreDisplay() {
    xWinsDisplay.textContent = scores.X;
    oWinsDisplay.textContent = scores.O;
    drawsDisplay.textContent = scores.draws;
}

// ================= START =================
document.addEventListener("DOMContentLoaded", init);
