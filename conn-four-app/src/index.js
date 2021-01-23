import React from "react";
import ReactDom from "react-dom";
import dropSound from "./drop.mp3";
import clickSound from "./click.mp3";
import { Game } from "./game.js";
import { Menu } from "./menu.js";
import { Analysis } from "./analysis.js";
import { EvalBar } from "./evalbar.js";

const IP = "http://localhost:5000/percent";
const ANALYSIS_COLUMNS = 3;
const BUTTON_HEIGHT = 40;
const DROP_TIME = 125;

class Main extends React.Component
{
    constructor(props)
    {
        super(props);

        this.pvpMode = this.pvpMode.bind(this);
        this.playerFirst = this.playerFirst.bind(this);
        this.redFirst = this.redFirst.bind(this);

        this.startGame = this.startGame.bind(this);
        this.handleData = this.handleData.bind(this);
        this.moveFromColumn = this.moveFromColumn.bind(this);
        this.computerMove = this.computerMove.bind(this);
        this.updateBoard = this.updateBoard.bind(this);
        this.updateHistory = this.updateHistory.bind(this);
        this.updateGame = this.updateGame.bind(this);
        this.restartGame = this.restartGame.bind(this);
        this.randomMove = this.randomMove.bind(this);
        this.jump = this.jump.bind(this);
        this.startAnalysis = this.startAnalysis.bind(this)
        this.keyDown = this.keyDown.bind(this);
        this.toggleDarkMode = this.toggleDarkMode.bind(this);

        document.onkeydown = this.keyDown;

        let darkMode = getCookie("darkMode");
        let sheet = "";
        if (darkMode === "true")
        {
            darkMode = true;
            sheet = "/dark.css";
        }
        else
        {
            darkMode = false;
            sheet = "/style.css";
        }

        this.state = {
            rows: 6,
            columns: 7,
            gameActive: false,
            board: generateBoard(6,7),
            highlighted: generateBoard(7, 6),
            emptyHighlight: generateBoard(7, 6),
            highlightCopy: generateBoard(7, 6),
            maximizingPlayer: true,
            pvp: true,
            playerFirst: true,
            redFirst: true,
            gameOver: false,
            playerCanMove: true,
            status: "Pick your settings",
            history: [{"board": generateBoard(6, 7)}],
            analysis: false,
            index: 0,
            lastMove: false,
            connected: false,
            stylePath: sheet,
            darkMode: darkMode
        }
    }

    pvpMode(mode)
    {
        this.setState({pvp: mode})
    }

    playerFirst(mode)
    {
        this.setState({playerFirst: mode});
    }

    redFirst(mode)
    {
        this.setState({redFirst: mode});
    }

    startGame()
    {
        this.setState({gameActive: true, playerCanMove: this.state.playerFirst}, this.updateGame);
    }

    updateBoard(i, k)
    {
        let chip = 0;
        if (this.state.maximizingPlayer)
            chip = 1;
        else
            chip = -1;

        let newBoard = JSON.parse(JSON.stringify(this.state.board));
        newBoard[i][k] = chip;

        let newHistory = this.state.history;
        newHistory.push({"board": newBoard});
        this.setState({history: newHistory, index: this.state.index + 1});

        let gameState = checkGameOver(newBoard, i, k);

        if (gameState === 2)
        {
            this.setState({board: newBoard, maximizingPlayer: !this.state.maximizingPlayer, gameActive: false, gameOver: true, status: "It's a draw"});
            playDrop();

            return;
        }
        else if (gameState !== 0)
        {
            let new_highlighted = generateBoard(this.state.columns, this.state.rows);

            for (let highlight of gameState)
            {
                new_highlighted[highlight[1]][highlight[0]] = 1;
            }

            let winner = "";
            let color = "";
            if (redMove(this.state.maximizingPlayer, this.state.redFirst))
            {
                winner = "Red";
                color = "red";
            }
            else
            {
                winner = "Yellow";
                color = "yellow";
            }

            let highlightCopy = JSON.parse(JSON.stringify(new_highlighted));
            this.setState({board: newBoard, maximizingPlayer: !this.state.maximizingPlayer, gameActive: false, gameOver: true, highlighted: new_highlighted, highlightCopy: highlightCopy, status: <span style={{color: color}}>{winner} wins!</span>});
            playDrop();

            return;
        }

        if (!this.state.pvp)
            this.setState({board: newBoard, maximizingPlayer: !this.state.maximizingPlayer, playerCanMove: !this.state.playerCanMove}, this.updateGame);
        else
            this.setState({board: newBoard, maximizingPlayer: !this.state.maximizingPlayer}, this.updateGame);

        playDrop();
    }

    updateGame()
    {
        console.log(this.state.index);

        let redMessage = <span style={{color: "red"}}>Red's move</span>;
        let yellowMessage = <span style={{color: "yellow"}}>Yellow's move</span>;

        if (redMove(this.state.maximizingPlayer, this.state.redFirst))
        {
            this.setState({status: redMessage});
        }
        else
        {
            this.setState({status: yellowMessage});
        }

        if (!this.state.pvp && !this.state.playerCanMove)
        {
            this.computerMove();
        }
    }

    restartGame()
    {
        this.setState({gameActive: false, board: generateBoard(6,7), highlighted: generateBoard(7,6), highlightCopy: generateBoard(7, 6), maximizingPlayer: true, gameOver: false, playerCanMove: true, playerFirst: true, status: "Pick your settings", history: [{"board": generateBoard(6, 7)}], analysis: false, index: 0, lastMove: false});
    }

    computerMove()
    {
        let options = {method: 'POST', mode: 'cors', headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(this.state.board)};
	
        fetch(IP, options)
        .then(response => response.json())
        .then(data => { this.handleData(data) } )
        .catch(error => { this.randomMove(); } );
    }

    handleData(data)
    {
        if (!this.state.gameActive)
            return;

        let updatedHistory = this.state.history;
        updatedHistory[updatedHistory.length - 1]["best"] = data.best;
        updatedHistory[updatedHistory.length - 1]["percent"] = data.percent;

        this.moveFromColumn(data.best);
        this.setState({history: updatedHistory})
    }

    randomMove()
    {
        if (!this.state.gameActive)
            return;

        let validMoves = [];

        for (let k = 0; k < this.state.board[0].length; k++)
        {
            if (this.state.board[0][k] === 0)
                validMoves.push(k);
        }

        let index = Math.floor(Math.random() * validMoves.length);

        this.moveFromColumn(index);
    }

    moveFromColumn(k)
    {
        let i = this.state.board.length - 1;

        while (i >= 0)
        {
            if (!this.state.board[i][k])
            {
                this.updateBoard(i, k);
                return;
            }

            i -= 1;
        }

        this.updateBoard(i, k);
    }

    jump(i)
    {
        if (i > this.state.index)
            playDrop();

        if (i === this.state.history.length - 1)
        {
            this.setState({board: this.state.history[i]["board"], highlighted: this.state.highlightCopy, index: i, lastMove: true})
        }
        else
        {
            this.setState({board: this.state.history[i]["board"], highlighted: this.state.emptyHighlight, index: i, lastMove: false});
        }
    }

    updateHistory(data, i)
    {
        if (!this.state.analysis)
            return;

        let newHistory = this.state.history;
        newHistory[i]["percent"] = data["percent"];
        newHistory[i]["best"] = data["best"];

        this.setState({history: newHistory, connected: true});
    }

    startAnalysis()
    {
        this.setState({analysis: true});

        let maxHeight = Math.ceil(this.state.history.length / ANALYSIS_COLUMNS) * BUTTON_HEIGHT;
        let analysis = document.getElementsByClassName("analysis")[0];
        analysis.style.maxHeight = maxHeight + "px";

        for (let i = 0; i < this.state.history.length; i++)
        {
            if (this.state.history[i]["percent"] === undefined)
            {
                let options = {method: 'POST', mode: 'cors', headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(this.state.history[i]["board"])};

                fetch(IP, options)
                .then(response => response.json())
                .then(data => { this.updateHistory(data, i); } )
                .catch(error => { this.setState({connected: false}); } );
            }
        }
    }

    keyDown(e)
    {
        let event = window.event ? window.event : e;

        if (event.key === "ArrowDown" || event.key === "ArrowRight" || event.key === "s" || event.key === "d")
        {
            if (this.state.analysis && this.state.index < (this.state.history.length - 1))
                this.jump(this.state.index + 1);

            event.preventDefault();
        }
        else if (event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "w" || event.key === "a")
        {
            if (this.state.analysis && this.state.index > 0)
                this.jump(this.state.index - 1);

            event.preventDefault();
        }
    }

    toggleDarkMode()
    {
        console.log("toggled");
        let mode = !this.state.darkMode;

        if (mode)
            this.setState({darkMode: mode, stylePath: "/dark.css"});
        else
            this.setState({darkMode: mode, stylePath: "/style.css"});

        setCookie("darkMode", mode, 365 * 10);
    }

    render()
    {
        return (
            <div className="container">
                <link rel="stylesheet" type="text/css" href={ process.env.PUBLIC_URL + this.state.stylePath } />
                <h1>Connect Four</h1>
                <div className="credits">
                    Matthew Rubino - <a href="https://github.com/Budlu/ConnectFour" target="_blank" rel="noreferrer">https://github.com/Budlu/ConnectFour</a>
                </div>
                <div className="content" >
                    <div className="column-1">
                        <Menu pvpMode={this.pvpMode} playerFirst={this.playerFirst} redFirst={this.redFirst} startGame={this.startGame} restartGame={this.restartGame} visible={this.state.gameOver} started={this.state.analysis} startAnalysis={this.startAnalysis} />
                        <Analysis visible={this.state.analysis} history={this.state.history} jump={this.jump} index={this.state.index} />
                    </div>
                    <div className="column-2">
                        <h2>{this.state.status}</h2>
                        <EvalBar redFirst={this.state.redFirst} p1Height={this.state.history[this.state.index]["percent"]} analysis={this.state.analysis} connected={this.state.connected} />
                        <Game rows={6} columns={7} board={this.state.board} highlighted={this.state.highlighted} updateBoard={this.updateBoard} active={this.state.gameActive} redFirst={this.state.redFirst} playerMove={this.state.playerCanMove} analysis={this.state.analysis} best={this.state.history[this.state.index]["best"]} lastMove={this.state.lastMove} connected={this.state.connected} />
                    </div>
                </div>
                <button className="dark-mode" onClick={() => {this.toggleDarkMode(); playClick();} }>O</button>
            </div>
        );
    }
}

function generateBoard(rows, columns)
{
    let board = [];

    for (let i = 0; i < rows; i++)
    {
        let row = [];
        for (let k = 0; k < columns; k++)
        {
            row.push(0);
        }
        board.push(row);
    }

    return board;
}

function checkGameOver(board, i, k)
{
    let height = board.length;
    let width = board[0].length;

    // Horizontal Win Check
    let start = clamp(k-3, 0, width - 4);
    let end = clamp(k, 0, width - 4);

    while (start <= end)
    {
        let tiles = [board[i][start], board[i][start + 1], board[i][start + 2], board[i][start + 3]];
        if (tiles.every((value, i, arr) => value === arr[0]))
            return [[i, start], [i, start + 1], [i, start + 2], [i, start + 3]];
        
        start += 1;
    }

    // Vertical Win Check
    if (i <= height - 4)
    {
        let tiles = [board[i][k], board[i + 1][k], board[i + 2][k], board[i + 3][k]];
        if (tiles.every((value, i, arr) => value === arr[0]))
            return [[i, k], [i + 1, k], [i + 2, k], [i + 3, k]];
    }

    // Diagonal Win Check (TL to BR)
    let minLeftDiff = min(i, k);
    start = clamp(minLeftDiff, 0, 3);

    let minRightDiff = min(height - i - 1, width - k - 1);
    end = clamp(3 - minRightDiff, 0, 3)

    while (start >= end)
    {
        let tiles = [board[i - start][k - start], board[i - start + 1][k - start + 1], board[i - start + 2][k - start + 2], board[i - start + 3][k - start + 3]];
        if (tiles.every((value, i, arr) => value === arr[0]))
            return [[i - start, k - start], [i - start + 1, k - start + 1], [i - start + 2, k - start + 2], [i - start + 3, k - start + 3]];

        start -= 1;
    }

    // Diagonal Win Check (TR to BL)
    minLeftDiff = min(height - i - 1, k)
    minRightDiff = min(i, width - k - 1)

    start = clamp(minRightDiff, 0, 3)
    end = clamp(3 - minLeftDiff, 0, 3)

    while (start >= end)
    {
        let tiles = [board[i - start][k + start], board[i - start + 1][k + start - 1], board[i - start + 2][k + start - 2], board[i - start + 3][k + start - 3]];
        if (tiles.every((value, i, arr) => value === arr[0]))
            return [[i - start, k + start], [i - start + 1, k + start - 1], [i - start + 2, k + start - 2], [i - start + 3, k + start - 3]];

        start -= 1;
    }

    for (let n = 0; n < width; n++)
    {
        if (!board[0][n])
            return 0;
    }

    return 2;
}

function clamp(val, min, max)
{
    if (val >= max)
        return max;
    else if (val <= min)
        return min;
    else
        return val;
}

function min(x1, x2)
{
    if (x1 < x2)
        return x1;
    else
        return x2;
}

function redMove(maximizingPlayer, redFirst)
{
    if (redFirst)
    {
        if (maximizingPlayer)
            return true;
        return false;
    }
    else
    {
        if (maximizingPlayer)
            return false;
        return true;
    }
}

let dropElement = new soundEffect(dropSound);
let clickElement = new soundEffect(clickSound);

function soundEffect(src)
{
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.setAttribute("id", "sound")
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function() { this.sound.play(); }
    this.stop = function() { this.sound.pause(); }
}

function playDrop()
{
    setTimeout(function() {
        console.log("sound played");
        dropElement.sound.load();
        dropElement.sound.play()
        .catch(error => {console.warn("Drop sound failed")});
    }, DROP_TIME);
}

function playClick()
{
    clickElement.sound.load();
    clickElement.sound.play()
    .catch(error => {console.warn("Click sound failed")});
}

function setCookie(cname, cvalue, exdays)
{
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }

function getCookie(cname)
{
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

let tiles = document.getElementsByClassName("tile");
for (let tile of tiles)
{
    tile.addEventListener("animationend", dropAnimationEnd());
}

function dropAnimationEnd()
{
    console.log("event fired");
    playDrop();
}

ReactDom.render(<Main />, document.getElementById("root"));