// Global variables for the game
let boardSize = 5;
let difficulty = 'easy';
let gameBoard = [];
let moveCount = 0;
let timer;
let timeElapsed = 0;
let hintsLeft = 3;
let undoStack = [];

// Initialize the game when the document is ready
$(document).ready(function() {
    $('#start-game-btn').click(showGameContainer);
    $('#start-btn').click(startNewGame);
    $('#reset-btn').click(resetGame);
    $('#hint-btn').click(useHint);
    $('#undo-btn').click(undoMove);
    $('#menu-btn').click(returnToMenu);
});

// Function to show the game container and start the game
function showGameContainer() {
    $('#start-page').hide();
    $('#game-container').show();
    startGame(); // Start the game when the player moves to the game screen
    playSound('start');
}

// Function to initialize or restart the game
function startGame() {
    boardSize = parseInt($('#grid-size').val());
    difficulty = $('#difficulty').val();
    moveCount = 0;
    timeElapsed = 0;
    hintsLeft = 3;
    undoStack = [];

    $('#move-count').text(moveCount);
    $('#time').text('0:00');
    $('#hints-left').text(hintsLeft);
    $('#message').text('');

    createBoard();
    randomizeBoard(difficulty);
    startTimer();
}

// Function to start a new game (separate from initialization)
function startNewGame() {
    startGame();
    playSound('start');
}

// Function to create the game board grid
function createBoard() {
    const $boardElement = $('#game-board');
    $boardElement.css('grid-template-columns', `repeat(${boardSize}, 60px)`);
    $boardElement.empty();
    gameBoard = [];

    // Create the grid based on the selected board size
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
            row.push(false); // Initially, all lights are off
        }
        gameBoard.push(row);
    }
}

// Function to toggle the light and its neighbors
function toggleLights(row, col) {
    toggleLight(row, col);
    if (row > 0) toggleLight(row - 1, col);
    if (row < boardSize - 1) toggleLight(row + 1, col);
    if (col > 0) toggleLight(row, col - 1);
    if (col < boardSize - 1) toggleLight(row, col + 1);

    checkWinCondition();
}

// Function to toggle a single light on or off
function toggleLight(row, col) {
    gameBoard[row][col] = !gameBoard[row][col];
    const $light = $(`.light[data-row="${row}"][data-col="${col}"]`);
    if (gameBoard[row][col]) {
        $light.addClass('on');
    } else {
        $light.removeClass('on');
    }
}

// Function to randomize the board based on difficulty
function randomizeBoard(difficulty) {
    const moves = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 25 : 50;
    for (let i = 0; i < moves; i++) {
        const row = Math.floor(Math.random() * boardSize);
        const col = Math.floor(Math.random() * boardSize);
        toggleLights(row, col);
    }
}

// Function to start the game timer
function startTimer() {
    clearInterval(timer);
    timer = setInterval(function() {
        timeElapsed++;
        $('#time').text(formatTime(timeElapsed));
    }, 1000);
}

// Function to format the elapsed time as mm:ss
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainderSeconds = seconds % 60;
    return `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
}

// Function to check if the player has won the game
function checkWinCondition() {
    const allOff = gameBoard.every(row => row.every(light => !light));
    if (allOff) {
        clearInterval(timer);
        playSound('win');
        $('#message').text('You win! All lights are off.');
    }
}

// Function to reset the game
function resetGame() {
    clearInterval(timer);
    $('#time').text('0:00');
    startGame();
    playSound('reset');
}

// Function to return to the main menu
function returnToMenu() {
    $('#game-container').hide();
    $('#start-page').show();
    playSound('menu');
}

// Function to provide a hint by highlighting a strategic light
function useHint() {
    if (hintsLeft > 0) {
        let bestHint = null;
        let bestImpact = -Infinity;

        // Iterate through all lights to find the best move
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const impact = calculateImpact(i, j);
                if (impact > bestImpact) {
                    bestHint = { row: i, col: j };
                    bestImpact = impact;
                }
            }
        }

        // Fallback: If no impactful hint is found, select the first unlit light
        if (!bestHint) {
            for (let i = 0; i < boardSize; i++) {
                for (let j = 0; j < boardSize; j++) {
                    if (!gameBoard[i][j]) { // Find the first unlit light as a fallback
                        bestHint = { row: i, col: j };
                        break;
                    }
                }
                if (bestHint) break;
            }
        }

        // Apply the hint and highlight it
        if (bestHint) {
            const $hintElement = $(`.light[data-row="${bestHint.row}"][data-col="${bestHint.col}"]`);
            $hintElement.addClass('hint');
            setTimeout(() => $hintElement.removeClass('hint'), 1000);

            hintsLeft--;
            $('#hints-left').text(hintsLeft);
            playSound('hint');
        }
    } else {
        // Show a pop-up message if no hints are left
        alert('No hints left!');
    }
}

// Function to calculate the impact of toggling a light
function calculateImpact(row, col) {
    let impact = 0;

    // Simulate the effect of toggling this light and its neighbors
    impact += checkToggleEffect(row, col); // Current light
    impact += checkToggleEffect(row - 1, col); // Above
    impact += checkToggleEffect(row + 1, col); // Below
    impact += checkToggleEffect(row, col - 1); // Left
    impact += checkToggleEffect(row, col + 1); // Right

    return impact;
}

// Function to check the effect of toggling a specific light
function checkToggleEffect(row, col) {
    // If the light is within the grid and is on, toggling it off is beneficial
    if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
        return gameBoard[row][col] ? 1 : 0;
    }
    return 0;
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

// Function to play sound effects
function playSound(sound) {
    const audio = $(`#${sound}-sound`)[0];
    audio.currentTime = 0;
    audio.play();
}

// Start the game automatically on page load
startGame();
