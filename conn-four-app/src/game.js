import React from "react";
import arrow from "./Arrow.png";

export class Game extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            rows: props.rows,
            columns: props.columns
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
        let column = <Column index={i} total_height={this.props.rows} column={this.getColumn(i)} highlighted={this.props.highlighted[i]} redFirst={this.props.redFirst} best={this.props.best} analysis={this.props.analysis} lastMove={this.props.lastMove} />;
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

        return <div className="game">{elements}</div>
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
        let classes = ["tile"]

        if (tile === 1)
        {
            if (this.props.redFirst)
                classes.push("red")
            else
                classes.push("yellow")
        }
        else if (tile === -1)
        {
            if (this.props.redFirst)
                classes.push("yellow")
            else
                classes.push("red")
        }

        return <Tile key={i} class={classes.join(' ')} highlighted={this.props.highlighted[i]} />;
    }

    render()
    {
        let elements = [];

        if (this.props.analysis && this.props.best === this.props.index && !this.props.lastMove)
            elements.push(<Arrow visible={true} key={this.props.total_height} />);
        else
            elements.push(<Arrow visible={false} key={this.props.total_height} />);

        for (let i = 0; i < this.props.total_height; i++)
        {
            elements.push(this.renderTile(i));
        }

        return elements;
    }
}

function Arrow(props)
{
    let classes = ["arrow"];
    if (!props.visible)
        classes.push("invisible");

    return <img src={arrow} className={classes.join(' ')} alt="" />
}

function Tile(props)
{
    let classes = [props.class];
    if (props.highlighted)
        classes.push("highlighted");

    return <li key={props.i} className={classes.join(' ')}></li>
}
