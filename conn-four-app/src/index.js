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
            columns: props.columns
        };
    }

    renderColumn(i)
    {
        return <ul key={i} className="column"><button onClick={() => this.debugClick(i)}><Column index={i} total_height={this.props.rows} /></button></ul>;
    }

    debugClick(i)
    {
        console.log("You clicked on column " + i);
    }

    render()
    {
        let elements = [];
        for (let i = 0; i < this.state.columns; i++)
        {
            elements.push(this.renderColumn(i));
        }

        return elements;
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
        return <li key={i} className="tile"><Tile height={i} /></li>
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

class Tile extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = {
            height: props.height
        }
    }

    render()
    {
        return this.state.height;
    }
}

ReactDom.render(<div className="game"><Game rows={6} columns={7} /></div>, document.getElementById("root"));