        // score data

        const baseMatchScore = 100; // score for 4 tiles
        let combo = 0;
        let comboId = null;
        let currentTotalScore = 0;
        let highScore = 0;
        let finalMatchScore = null;

        // score multipliers

        const matchedMultiplier = 1.25 
        const comboMultiplier = 1.01
        const stopTimeMulitplier = 1.10

        // power bar data

        const basePowerBarScore = 5000;
        let powerBarScore = 5000; // amount score required to activate powerbar
        let completedPowerBar = 5000; // amount of times the Power Bar has been completed
        let sideScore = 0;

        let isPaused = false; // needed for powerbar effect

        // time data

        let timeLeft = 60;
        let timerInterval = null;
        let gameActive = false;

        // grid data

        const gridContainer = document.querySelector(".grid-container"); // selects container for the tiles
        let startContainer = document.querySelector(".start-panel"); // selects start container for removal
        const gridSize = 6; // size of container is 6
        const gridAmount = gridSize * gridSize;
        const emoji = ["🍒", "🍋", "🍇", "🍏", "🍊", "🍉"] // stores the emojis

        // hides the grid

        gridContainer.style.display = "none";
        
        // waits for a click on the block

        startContainer.addEventListener("click", () => {

            // calls function to start game

            startTimer();

            // hides the old block and display the grid

            startContainer.style.display = "none";
            gridContainer.style.display = "grid";


            // generates Grid

            for (let i = 0; i < gridAmount; i++) {
                const gridItem = document.createElement("div"); // creates the grid item
                const randomNum = Math.floor(Math.random() * 6) + 1 // chooses a random number for the color
                gridItem.className = `grid-item grid-item-${randomNum}`; // appends the class
                gridItem.textContent = emoji[randomNum - 1]; // adds an emoji to each tile
                gridItem.setAttribute("draggable", "true");
                gridContainer.appendChild(gridItem); // appends the grid item to the html code
            }

        }, { once: true });

        //  initalizes the variables

        let draggedItem = null;
        let targetItem = null;

        //  checks if an item is being dragged and makes it invisible

        gridContainer.addEventListener("dragstart", (e) => {
            if (e.target.classList.contains("grid-item")) {
                draggedItem = e.target;
                setTimeout(() => draggedItem.style.visibility = "hidden", 0);
            }
        });

        // restores item visibility if the dragging is over

        gridContainer.addEventListener("dragend", (e) => {
            draggedItem.style.visibility = "visible";
        });
        
        //  allows the item to drop / prevents the default browser behavior

        gridContainer.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        // drops the item onto another item

        gridContainer.addEventListener("drop", (e) => {
            e.preventDefault();
            if (e.target.classList.contains("grid-item")) {
                targetItem = e.target;
            }

            if (!gameActive) {
                return;
            }

            swapTiles(draggedItem, targetItem);

            let matchTrue = checkForMatches();

            gameLoop(matchTrue);

        });

        // swaps the tiles
        
        function swapTiles(tile1, tile2) {
            const tempClass = tile1.className;
            const tempText = tile1.textContent;

            tile1.className = tile2.className;
            tile1.textContent = tile2.textContent;

            tile2.className = tempClass;
            tile2.textContent = tempText;
        }

        // checks for matches

        function checkForMatches() {

            // initalizes promise because of animation

            return new Promise((resolve) => { 


                const tiles = Array.from(gridContainer.children); // converts the html array into a javascript array
                const visited = new Set(); // initalizes set keep track which tiles were visited already
                const matched = new Set(); // initalizes set to keep track of matches

                const clusters = []; // keeps track of tile clusters / important for calculating score later

                // array with directions

                const directions = [
                    [1, 0],
                    [-1, 0],
                    [0, 1],
                    [0, -1]
                ]

                for (let i = 0; i < gridAmount; i++) {

                    const newMatches = new Set();

                    // checks if the tile has already been visited

                    if (!visited.has(i)) {

                        // adds the tile to varius sets 

                        newMatches.add(i);
                        visited.add(i);

                        // initalizes the base emoji

                        const baseTileEmoji = tiles[i].textContent;

                        // calls the function to check how many matches there are

                        const returnSet = matches(baseTileEmoji, i, newMatches);

                        // records the matches if there are more than 3

                        if (returnSet.size > 3) {   
                            returnSet.forEach(index => matched.add(index));
                        }
                    }

                }

                // clears the matched tiles and calculates score

                if (matched.size > 3) {
                    matched.forEach(index => {
                        tiles[index].classList.add("fade-out"); // adds a fade out animation for cleared tiles
                    });

                    // amount to count

                    const matchedAmount = matched.size - 4;

                    // calculates the score for each match if there are more than 4 tiles connected

                    let matchScore = baseMatchScore;

                    for (i = matchedAmount; i > 0; i--) {

                            matchScore = Math.floor(matchScore * matchedMultiplier);

                            if (isPaused) {
                                matchScore = Math.floor(matchScore * stopTimeMulitplier)
                            }
                        }
                    
                    // adds the combo bonus to the score

                    for (i = combo; i > 0; i--) {
                        matchScore = Math.floor(matchScore * comboMultiplier);
                    }

                    // adds the new score to the current total score

                    sideScore = sideScore + matchScore;

                    currentTotalScore = currentTotalScore + matchScore;

                    // updates the score on the html page

                    document.getElementById("score").innerText = "Score: " + currentTotalScore;

                    
                    // calls on the powerbar function right after the score has been calculated

                    powerBar();

                    // adds a timeout so the animation has time to complete
                    
                    setTimeout(() => {
                        matched.forEach(index => {
                            tiles[index].textContent = "";
                            tiles[index].className = "grid-item";
                        });

                        resolve(true); // resolve promise after clearing
                    }, 200);
                } else {
                    resolve(false); // no matches found, resolve immediately
                }

                function matches(baseEmoji, tileNumber, newMatches) {
                    for (let [dirRow, dirCol] of directions) {

                        // converts the 1D array into a 2D one

                        const newRow = Math.floor(tileNumber / gridSize) + dirRow;
                        const newCol = tileNumber % gridSize + dirCol;

                        // checks if the index is going out of bounds

                        if (newRow >= gridSize || newRow < 0 || newCol >= gridSize || newCol < 0) {
                            continue;
                        }

                        // converts the new 2D array into 1D one

                        const neighbourTile = (newRow * gridSize + newCol); 

                        // checks the tile around the base tile, and calls the function there

                        if (tiles[neighbourTile].textContent == baseEmoji && !(visited.has(neighbourTile))) {

                            // adds the tile to the visited set, and the index to the newMatches set

                            visited.add(neighbourTile);
                            newMatches.add(neighbourTile);

                            // calls the function again on the new tile

                            matches(baseEmoji, neighbourTile, newMatches);
                        }
                    }

                    return newMatches;
                }
            });
        }

        // makes the upper tiles fall on the empty lower tiles

        function falls() {

            let changed = true;

            let tiles = Array.from(gridContainer.children);

            // loop checking if there are empty tiles on the grid

            while (tiles.some(tile => tile.textContent === (""))) {

                // reinitalizes the array
                tiles = Array.from(gridContainer.children);

                // changes to false in case the if clause doesn't activate
                changed = false;

                // loop checks from bottom up if there are free tiles

                for (let i = gridAmount - 1; i >= 0; i--) {
                    if (i - gridSize >= 0 && tiles[i].textContent === "" && tiles[(i - gridSize)].textContent !== "") {

                        // addsa animation before swappning
                        tiles[i - gridSize].classList.add("fall");

                        // calls the swaptiles function
                        swapTiles(tiles[i], tiles[i - gridSize]);

                        // changes boolean to true
                        changed = true;

                        // removes animation after swapping
                        setTimeout(() => {
                            tiles[i].classList.remove("fall");
                        }, 200);
                    }
                }
                if (changed == false) {
                    break;
                }
            }       
        }

        function fill() {
            
            let tiles = Array.from(gridContainer.children);
            let filled = false;

            for (let i = 0; i < gridSize; i++) {
                if (tiles[i].textContent === "") {

                    const randomNum = Math.floor(Math.random() * 6) + 1 // chooses a random number for the color
                    tiles[i].className = `grid-item grid-item-${randomNum}`; // appends the class
                    tiles[i].textContent = emoji[randomNum - 1];
                    filled = true;

                }
            }
        }

        function powerBar() {

            updatePowerBar();

            
            if (sideScore >= 5000) {

                // prepares the powerbar for the next time

                sideScore = sideScore - 5000;

                pauseTime();
            }
        }

        function pauseTime() {

            const timer = document.querySelector(".time-table");
            const powerBarFill = document.querySelector(".power-bar-fill");

            // gives the timer and grid a special effet

            timer.style.backgroundColor = "#29f4ed";
            gridContainer.style.transition = "background-color 0.5s ease";
            gridContainer.style.backgroundColor = "#29f4ed";

            // makes powerbar empty

            powerBarFill.style.transition = "width 7.5s ease";
            powerBarFill.style.width = "0%";


            isPaused = true;

            setTimeout(() => {

                // returns the timer and grid to its original state

                timer.style.backgroundColor = "";
                gridContainer.style.backgroundColor = "#f5a8f0"

                // returns powerbar transtion to its orignal state

                powerBarFill.style.transition = "width 0.3s ease";

                // starts the timer again

                isPaused = false;

            }, 7500);
        }

        function updatePowerBar() {

            // selects the power bar from the html
            const powerBarFill = document.querySelector(".power-bar-fill");

            // calculates the percentage
            
            let percent = sideScore / 5000;

            if (isPaused){
                return;
            }

            // doesen't allow percentage to go over 100%
            
            if (percent > 1) {
                percent = 1;
            }

            // updates the powerbar

            powerBarFill.style.width = (percent * 100) + "%";
        }

        async function gameLoop(isTrue) {

            let isTrueGameLoop = await checkForMatches();

            if (isTrueGameLoop) {
                checkCombo();
            }
            
            falls();

            fill();

            const tiles = Array.from(gridContainer.children);
            const hasEmpty = tiles.some(tile => tile.textContent === "");

            if (isTrue == true || hasEmpty == true) {
                setTimeout(() => gameLoop(isTrueGameLoop), 200);
            }
        }

        
        function startTimer() {

            gameActive = true;
            timerInterval = setInterval(() => {
                // resets timer

                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    gameActive = false;
                    document.getElementById("timer").textContent = "0";
                    setTimeout(() => {

                        endGame();

                    }, 1000);

                } else if (isPaused) {

                    return; // skip this turn if paused

                } else {
                    // counts down the timer

                    timeLeft--;
                    document.getElementById("timer").textContent = timeLeft;
                }
            }, 1000);
        }

        function endGame() {

            // changes the text in the startblock to make it an endblock

            startContainer.innerHTML = "<h1 class='floating-box game-over center'>Game Over</h1><h2 class='center' style='margin-top: 100px'>Refresh the page to play again!</h2>";

            // hides grid and shows end block
                
            gridContainer.style.display = "none";
            startContainer.style.display = "block";

            sendData(currentTotalScore);
        }

        // got this with the help of chatgpt
        // sends a packet to the route /indexLogged containing the current highscore using the POST method in the JSON format

        function sendData(highScore) {
            fetch("/indexLogged", {
                method: "POST",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({highScore: highScore })
            })
        }

        function checkCombo() {

            // adds amount to 

            combo++;
            
            clearTimeout(comboId);

            // updates html

            document.getElementById("combo").innerText = "Combo: " + combo;

            // sets a timeout to reset combo

            if (gameActive) {
                comboId = setTimeout(() => {

                    combo = 0;
                    document.getElementById("combo").innerText = "Combo: " + combo;
                    
                }, 2000);
            }
        }