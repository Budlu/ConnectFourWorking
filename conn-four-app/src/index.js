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
            maximizingIsRed: true
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
        let column = <Column index={i} total_height={this.props.rows} column={this.getColumn(i)} maxIsRed={this.state.maximizingIsRed}/>;
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

        return <Tile key={i} class={className} />;
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

ReactDom.render(<Game rows={6} columns={7} board={generateBoard(6,7)} />, document.getElementById("root"));