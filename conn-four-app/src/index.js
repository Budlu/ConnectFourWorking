import React from "react";
import ReactDom from "react-dom";
import "./style.css";

class Main extends React.Component
{
    constructor(props)
    {
        super(props);

        this.pvpMode = this.pvpMode.bind(this);
        this.playerFirst = this.playerFirst.bind(this);
        this.redFirst = this.redFirst.bind(this);

        this.startGame = this.startGame.bind(this);
        this.startCallback = this.startCallback.bind(this);
        this.moveFromColumn = this.moveFromColumn.bind(this);
        this.computerMove = this.computerMove.bind(this);
        this.updateBoard = this.updateBoard.bind(this);
        this.updateStatus = this.updateStatus.bind(this);
        this.restartGame = this.restartGame.bind(this);

        this.state = {
            rows: 6,
            columns: 7,
            gameActive: false,
            board: generateBoard(6,7),
            highlighted: generateBoard(7, 6),
            maximizingPlayer: true,
            pvp: true,
            playerFirst: true,
            redFirst: true,
            gameOver: false,
            playerCanMove: true,
            status: "Pick your settings"
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
        this.setState({gameActive: true, playerCanMove: this.state.playerFirst}, this.startCallback);
    }

    startCallback()
    {
        this.updateStatus();

        if (!this.state.pvp)
        {
            if (!this.state.playerFirst)
            {
                console.log("computer move");
                this.computerMove();
            }
        }
    }

    updateBoard(i, k)
    {
        let chip = 0;
        if (this.state.maximizingPlayer)
            chip = 1;
        else
            chip = -1;

        let newBoard = this.state.board.slice();
        newBoard[i][k] = chip;

        let gameState = checkGameOver(newBoard, i, k);

        if (gameState === 2)
        {
            this.setState({board: newBoard, maximizingPlayer: !this.state.maximizingPlayer, gameActive: false, gameOver: true, stats: "It's a draw"});
            return;
        }
        else if (gameState !== 0)
        {
            let new_highlighted = generateBoard(this.state.columns, this.state.rows);

            for (let highlight of gameState)
            {
                new_highlighted[highlight[1]][highlight[0]] = 1;
            }

            this.setState({board: newBoard, maximizingPlayer: !this.state.maximizingPlayer, gameActive: false, gameOver: true, highlighted: new_highlighted, status: "The winner is " + chip});

            return;
        }

        this.setState({board: newBoard, maximizingPlayer: !this.state.maximizingPlayer}, this.updateStatus);

        if (!this.state.pvp && this.state.playerCanMove)
        {
            this.setState({playerCanMove: false}, this.computerMove);
        }
    }

    updateStatus()
    {
        let redMessage = "Red's move";
        let yellowMessage = "Yellow's move";

        if (this.state.maximizingPlayer)
        {
            if (this.state.redFirst)
            {
                this.setState({status: redMessage});
            }
            else
            {
                this.setState({status: yellowMessage});
            }
        }
        else
        {
            if (this.state.redFirst)
            {
                this.setState({status: yellowMessage});
            }
            else
            {
                this.setState({status: redMessage});
            }
        }
    }

    restartGame()
    {
        this.setState({gameActive: false, board: generateBoard(6,7), highlighted: generateBoard(7,6), maximizingPlayer: true, gameOver: false, playerCanMove: true, playerFirst: true, status: "Pick your settings"});
    }

    computerMove()
    {
        console.log(this.state.playerCanMove);
        let options = {method: 'POST', mode: 'cors', headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(this.state.board)};
	
        fetch("http://localhost:5000/percent", options)
        .then(response => response.json())
        .then(data => { this.moveFromColumn(data.best) } )
        .then(final => { this.setState({playerCanMove: true}) } );
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

    render()
    {
        return (
            <div className="content">
                <div className="column-1">
                    <Menu pvpMode={this.pvpMode} playerFirst={this.playerFirst} redFirst={this.redFirst} startGame={this.startGame} restartGame={this.restartGame} />
                    <Analysis visible={this.state.gameOver} />
                </div>
                <div className="column-2">
                    <h2>{this.state.status}</h2>
                    <Game rows={6} columns={7} board={this.state.board} highlighted={this.state.highlighted} updateBoard={this.updateBoard} active={this.state.gameActive} redFirst={this.state.redFirst} playerMove={this.state.playerCanMove} />
                </div>
            </div>
        );
    }
}

class Menu extends React.Component
{
    constructor(props)
    {
        super(props);

        this.playerVersusPlayer = this.playerVersusPlayer.bind(this);
        this.playerVersusComputer = this.playerVersusComputer.bind(this);
        this.backPVPPVC = this.backPVPPVC.bind(this);

        this.whichPlayer = this.whichPlayer.bind(this);
        this.playerFirstMenu = this.playerFirstMenu.bind(this);
        this.computerFirstMenu = this.computerFirstMenu.bind(this);

        this.whichColor = this.whichColor.bind(this);
        this.redFirstMenu = this.redFirstMenu.bind(this);
        this.yellowFirstMenu = this.yellowFirstMenu.bind(this);

        this.startGame = this.startGame.bind(this);

        this.state = {
            prompt: "Select a mode: ",
            buttonOneText: "Player v. Player",
            buttonOneFunction: this.playerVersusPlayer,
            buttonTwoText: "Player v. Computer",
            buttonTwoFunction: this.playerVersusComputer,
            backFunction: function(){},
            gameStarted: false
        }
    }

    render()
    {
        if (!this.state.gameStarted)
        {
            return (
                <div className="menu">
                    <h1>Connect Four</h1>
                    {this.state.prompt}
                    <button onClick={() => this.state.buttonOneFunction()}>{this.state.buttonOneText}</button>
                    <button onClick={() => this.state.buttonTwoFunction()}>{this.state.buttonTwoText}</button>
                    <button onClick={() => this.state.backFunction()}>Back</button>
                </div>
            );
        }
        else
        {
            return (
                <div className="menu">
                    <h1>Connect Four</h1>
                    <button onClick={() => this.restartGame()}>Restart Game</button>
                </div>
            )
        }
    }

    whichColor(backFunc)
    {
        this.setState({
            prompt: "Which color goes first: ",
            buttonOneText: "Red",
            buttonOneFunction: this.redFirstMenu,
            buttonTwoText: "Yellow",
            buttonTwoFunction: this.yellowFirstMenu,
            backFunction: backFunc
        });
    }
    
    whichPlayer()
    {
        this.setState({
            prompt: "Who goes first: ",
            buttonOneText: "Player",
            buttonOneFunction: this.playerFirstMenu,
            buttonTwoText: "Computer",
            buttonTwoFunction: this.computerFirstMenu,
            backFunction: this.backPVPPVC
        });
    }

    backPVPPVC()
    {
        this.setState({
            prompt: "Select a mode: ",
            buttonOneText: "Player v. Player",
            buttonOneFunction: this.playerVersusPlayer,
            buttonTwoText: "Player v. Computer",
            buttonTwoFunction: this.playerVersusComputer,
            backFunction: function(){}
        });
    }

    startGame()
    {
        this.props.startGame();
        this.setState({gameStarted: true});
    }

    playerVersusPlayer()
    {
        console.log("PVP");
        this.props.pvpMode(true);
        this.whichColor(this.backPVPPVC);
    }

    playerVersusComputer()
    {
        console.log("PVC");
        this.props.pvpMode(false);
        this.whichPlayer();
    }

    playerFirstMenu()
    {
        console.log("Player first");
        this.props.playerFirst(true);
        this.whichColor(this.whichPlayer);
    }

    computerFirstMenu()
    {
        console.log("Computer first");
        this.props.playerFirst(false);
        this.whichColor(this.whichPlayer);
    }

    redFirstMenu()
    {
        console.log("Red first");
        this.props.redFirst(true);
        this.startGame();
    }

    yellowFirstMenu()
    {
        console.log("Yellow first");
        this.props.redFirst(false);
        this.startGame();
    }

    restartGame()
    {
        this.props.restartGame();
        this.backPVPPVC();
        this.setState({gameStarted: false});
    }
}

class Analysis extends React.Component
{

    render()
    {
        if (this.props.visible)
            return 0;
        else
            return "";
    }
}

class Game extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = {
            rows: props.rows,
            columns: props.columns,
            maximizingPlayer: true,
            highlighted: generateBoard(props.columns, props.rows)
        };
    }

    getColumn(k)
    {
        let column = [];

        for (let i = 0; i < this.props.board.length; i++)
        {
            column.push(this.props.board[i][k]);
        }

        return column;
    }

    renderColumn(i)
    {
        let column = <Column index={i} total_height={this.props.rows} column={this.getColumn(i)} highlighted={this.props.highlighted[i]} redFirst={this.props.redFirst} />;
        return <ul key={i} className="column"><button onClick={() => this.debugClick(i)}>{column}</button></ul>;
    }

    getMoveHeight(k)
    {
        let i = this.props.board.length - 1;

        while (i >= 0)
        {
            if (!this.props.board[i][k])
                return i;

            i -= 1;
        }

        return i;
    }

    debugClick(i)
    {
        if (!this.props.active)
            return;

        if (!this.props.playerMove)
            return;
        
        let move = this.getMoveHeight(i);
        if (move === -1)
            return;
        
        this.props.updateBoard(move, i);
    }

    render()
    {
        let elements = [];
        for (let i = 0; i < this.state.columns; i++)
        {
            elements.push(this.renderColumn(i));
        }

        return <div className="game">{elements}</div>;
    }
}

class Column extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = {
            index: props.index,
            total_height: props.total_height,
            tile_height: props.tile_height
        }
    }

    renderTile(i)
    {
        let tile = this.props.column[i];
        let className = "tile";

        if (tile === 1)
        {
            if (this.props.redFirst)
            {
                className += "-red";
            }
            else
            {
                className += "-yellow";
            }
        }
        else if (tile === -1)
        {
            if (this.props.redFirst)
            {
                className += "-yellow";
            }
            else
            {
                className += "-red";
            }
        }

        return <Tile key={i} class={className} highlighted={this.props.highlighted[i]} />;
    }

    render()
    {
        let elements = [];
        for (let i = 0; i < this.props.total_height; i++)
        {
            elements.push(this.renderTile(i));
        }

        return elements;
    }
}

function Tile(props)
{
    let className = props.class;
    if (props.highlighted)
        className += "-highlighted";

    return <li key={props.i} className={className}></li>
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

ReactDom.render(<Main />, document.getElementById("root"));