import React from "react";
import ReactDom from "react-dom";
import "./style.css";

class Game extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = {
            rows: props.rows,
            columns: props.columns,
            board: props.board,
            active: true,
            maximizingPlayer: true,
            maximizingIsRed: true,
            highlighted: generateBoard(props.columns, props.rows)
        };
    }

    getColumn(k)
    {
        let column = [];

        for (let i = 0; i < this.state.board.length; i++)
        {
            column.push(this.state.board[i][k]);
        }

        return column;
    }

    renderColumn(i)
    {
        let column = <Column index={i} total_height={this.props.rows} column={this.getColumn(i)} maxIsRed={this.state.maximizingIsRed} highlighted={this.state.highlighted[i]} />;
        return <ul key={i} className="column"><button onClick={() => this.debugClick(i)}>{column}</button></ul>;
    }

    getMoveHeight(k)
    {
        let i = this.state.board.length - 1;

        while (i >= 0)
        {
            if (!this.state.board[i][k])
                return i;

            i -= 1;
        }

        return i;
    }

    debugClick(i)
    {
        if (!this.state.active)
            return;

        let move = this.getMoveHeight(i);
        if (move === -1)
            return;

        let chip = 0;
        if (this.state.maximizingPlayer)
            chip = 1;
        else
            chip = -1;
        
        let newBoard = this.state.board.slice();
        newBoard[move][i] = chip;

        let gameState = checkGameOver(newBoard, move, i);

        if (gameState === 2)
        {
            this.setState({active: false});
            console.log("Draw");
        }
        else if (gameState !== 0)
        {
            let new_highlighted = generateBoard(this.props.columns, this.props.rows);

            for (let highlight of gameState)
            {
                new_highlighted[highlight[1]][highlight[0]] = 1;
            }

            this.setState({active: false, highlighted: new_highlighted});

            let chip = this.state.board[gameState[0][0]][gameState[0][1]];
            console.log("The winner is " + chip);
        }

        this.setState({board: newBoard, maximizingPlayer: !this.state.maximizingPlayer})
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
            if (this.props.maxIsRed)
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
            if (this.props.maxIsRed)
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

ReactDom.render(<Game rows={6} columns={7} board={generateBoard(6,7)} />, document.getElementById("root"));