let boardSize = 5;
let difficulty = 'easy';
let gameBoard = [];
let moveCount = 0;
let timer;
let timeElapsed = 0;
let hintsLeft = 3;
let undoStack = [];
let timedMode = false;
let lightColor = '#ffdd57'; // Default light color

$(document).ready(function() {
    $('#start-game-btn').click(showGameContainer);
    $('#start-btn').click(startNewGame);
    $('#reset-btn').click(resetGame);
    $('#hint-btn').click(useHint);
    $('#undo-btn').click(undoMove);
    $('#menu-btn').click(returnToMenu);
    $('#reset-settings-btn').click(resetSettings);
    $('#light-color').change(function() {
        lightColor = $(this).val();
    });

    $('#grid-size').change(function() {
        playSound('menu');
    });

    $('#difficulty').change(function() {
        playSound('menu');
    });

    $('#timed-mode').change(function() {
        playSound('undo');
    });
});

let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

function saveToLeaderboard(time) {
    leaderboard.push(time);
    leaderboard.sort((a, b) => a - b);
    if (leaderboard.length > 10) {
        leaderboard.pop();
    }
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    displayLeaderboard();
}

function displayLeaderboard() {
    const $leaderboard = $('#leaderboard');
    $leaderboard.empty();

    leaderboard.forEach((time, index) => {
        $leaderboard.append(`<li>${index + 1}. ${formatTime(time)}</li>`);
    });

    $('#leaderboard-container').show();
}

$('#close-leaderboard-btn').click(function() {
    $('#leaderboard-container').hide();
});

function showGameContainer() {
    boardSize = parseInt($('#grid-size').val());
    difficulty = $('#difficulty').val();
    timedMode = $('#timed-mode').is(':checked');

    $('#start-page').hide();
    $('#game-container').show();
    startGame();
    playSound('start');
}

function startGame() {
    moveCount = 0;
    timeElapsed = 0;
    hintsLeft = 3;
    undoStack = [];

    $('#move-count').text(moveCount);
    $('#time').text('0:00');
    $('#hints-left').text(hintsLeft);
    $('#message').text('');

    createBoard();

    // Add flicker effect when the game starts
    $('.light').addClass('flicker');

    // Delay the randomization and win check to ensure the board is fully set up
    setTimeout(() => {
        generateSolvableBoard(difficulty);
        // Double-check to ensure the board isn't falsely triggering a win
        if (checkWinCondition(true)) {
            generateSolvableBoard(difficulty);
        }
        startTimer();
    }, 100);

    // Remove flicker effect after it's done
    setTimeout(() => {
        $('.light').removeClass('flicker');
    }, 600);
}

function startNewGame() {
    startGame();
    playSound('start');
}

function createBoard() {
    const $boardElement = $('#game-board');
    $boardElement.css('grid-template-columns', `repeat(${boardSize}, 60px)`);
    $boardElement.empty();
    gameBoard = [];

    for (let i = 0; i < boardSize; i++) {
        const row = [];
        for (let j = 0; j < boardSize; j++) {
            const $light = $('<div>')
                .addClass('light')
                .attr('data-row', i)
                .attr('data-col', j)
                .click(function() {
                    toggleLights(i, j);
                    playSound('click');
                    moveCount++;
                    $('#move-count').text(moveCount);
                    undoStack.push({ row: i, col: j });
                });

            $boardElement.append($light);
            row.push(false);
        }
        gameBoard.push(row);
    }
}

function toggleLights(row, col) {
    toggleLight(row, col);
    if (row > 0) toggleLight(row - 1, col);
    if (row < boardSize - 1) toggleLight(row + 1, col);
    if (col > 0) toggleLight(row, col - 1);
    if (col < boardSize - 1) toggleLight(row, col + 1);

    checkWinCondition();
}

function toggleLight(row, col) {
    gameBoard[row][col] = !gameBoard[row][col];
    const $light = $(`.light[data-row="${row}"][data-col="${col}"]`);
    if (gameBoard[row][col]) {
        $light.addClass('on').css('background', `linear-gradient(145deg, ${lightColor}, ${lightColor})`);
    } else {
        $light.removeClass('on').css('background', `linear-gradient(145deg, #333, #444)`);
    }
}

function generateSolvableBoard(difficulty) {
    const moves = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 25 : difficulty === 'hard' ? 50 : 100;
    for (let i = 0; i < moves; i++) {
        const row = Math.floor(Math.random() * boardSize);
        const col = Math.floor(Math.random() * boardSize);
        toggleLights(row, col);
    }

    // Ensure that the board isn't fully solved after randomization
    if (gameBoard.every(row => row.every(light => !light))) {
        generateSolvableBoard(difficulty); // Re-randomize if accidentally solved
    }
}

function startTimer() {
    clearInterval(timer);
    timer = setInterval(function() {
        timeElapsed++;
        $('#time').text(formatTime(timeElapsed));
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainderSeconds = seconds % 60;
    return `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
}

function checkWinCondition(skipConfetti = false) {
    const allOff = gameBoard.every(row => row.every(light => !light));
    if (allOff) {
        if (!skipConfetti) {
            clearInterval(timer);
            playSound('win');
            $('#message').text('You win! All lights are off.');

            if (timedMode) {
                saveToLeaderboard(timeElapsed);
            }
            triggerConfetti();
        }
        return true;
    }
    return false;
}

function triggerConfetti() {
    const confettiCount = 50;
    const $gameContainer = $('#game-container');

    for (let i = 0; i < confettiCount; i++) {
        const $confetti = $('<div>').addClass('confetti');
        const confettiLeft = Math.random() * $gameContainer.width();
        const confettiTop = Math.random() * $gameContainer.height();
        const confettiColor = `hsl(${Math.random() * 360}, 100%, 50%)`;

        $confetti.css({
            left: `${confettiLeft}px`,
            top: `${-confettiTop}px`,
            backgroundColor: confettiColor
        });

        $gameContainer.append($confetti);

        setTimeout(() => $confetti.remove(), 3000);
    }
}

function resetGame() {
    clearInterval(timer);
    $('#time').text('0:00');
    startGame();
    playSound('reset');
}

function returnToMenu() {
    $('#game-container').hide();
    $('#leaderboard-container').hide();
    $('#start-page').show();
    playSound('menu');
}

function resetSettings() {
    $('#grid-size').val('5');
    $('#difficulty').val('easy');
    $('#timed-mode').prop('checked', false);
    $('#light-color').val('#ffdd57');
    playSound('menu');
}

// Solver function using Gaussian elimination
function solveLightsOut(board) {
    const n = board.length;
    const matrix = [];
    
    for (let i = 0; i < n * n; i++) {
        matrix[i] = new Array(n * n).fill(0);
        const row = Math.floor(i / n);
        const col = i % n;
        matrix[i][i] = 1;

        if (row > 0) matrix[i][i - n] = 1; // Above
        if (row < n - 1) matrix[i][i + n] = 1; // Below
        if (col > 0) matrix[i][i - 1] = 1; // Left
        if (col < n - 1) matrix[i][i + 1] = 1; // Right
    }

    const b = board.flat().map(x => x ? 1 : 0); // Convert board to a flat array

    // Gaussian elimination
    for (let i = 0; i < n * n; i++) {
        if (matrix[i][i] === 0) {
            for (let j = i + 1; j < n * n; j++) {
                if (matrix[j][i] === 1) {
                    [matrix[i], matrix[j]] = [matrix[j], matrix[i]];
                    [b[i], b[j]] = [b[j], b[i]];
                    break;
                }
            }
        }

        for (let j = i + 1; j < n * n; j++) {
            if (matrix[j][i] === 1) {
                for (let k = i; k < n * n; k++) {
                    matrix[j][k] ^= matrix[i][k];
                }
                b[j] ^= b[i];
            }
        }
    }

    const solution = Array(n * n).fill(0);
    for (let i = n * n - 1; i >= 0; i--) {
        solution[i] = b[i];
        for (let j = i + 1; j < n * n; j++) {
            solution[i] ^= matrix[i][j] * solution[j];
        }
    }

    return solution;
}

// Function to apply the solution to the board (for hints or solving)
function applySolution(solution, boardSize) {
    for (let i = 0; i < solution.length; i++) {
        if (solution[i] === 1) {
            const row = Math.floor(i / boardSize);
            const col = i % boardSize;
            toggleLights(row, col); // Apply each step of the solution
        }
    }
}

// Function to provide a hint by highlighting a strategic light
function useHint() {
    if (hintsLeft > 0) {
        const solution = solveLightsOut(gameBoard);
        for (let i = 0; i < solution.length; i++) {
            if (solution[i] === 1) {
                const row = Math.floor(i / boardSize);
                const col = i % boardSize;
                const $hintElement = $(`.light[data-row="${row}"][data-col="${col}"]`);
                $hintElement.addClass('hint').css('background', `linear-gradient(145deg, #4caf50, #388e3c)`);
                setTimeout(() => $hintElement.removeClass('hint').css('background', `linear-gradient(145deg, ${gameBoard[row][col] ? lightColor : '#333'}, ${gameBoard[row][col] ? lightColor : '#444'})`), 1000);

                hintsLeft--;
                $('#hints-left').text(hintsLeft);
                playSound('hint');
                return;
            }
        }
    } else {
        alert('No hints left!');
    }
}

// Function to undo the last move
function undoMove() {
    if (undoStack.length > 0) {
        const lastMove = undoStack.pop();
        toggleLights(lastMove.row, lastMove.col);
        moveCount--;
        $('#move-count').text(moveCount);
        playSound('undo');
    }
}

function playSound(sound) {
    const audio = $(`#${sound}-sound`)[0];
    audio.currentTime = 0;
    audio.play();
}

// Start the game automatically on page load
startGame();
