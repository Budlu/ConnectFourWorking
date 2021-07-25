import React from "react";

export class Menu extends React.Component
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
                    <div className="prompt">
                        {this.state.prompt}<br/>
                    </div>
                    <button onClick={() => {this.state.buttonOneFunction(); playClick();} }>{this.state.buttonOneText}</button><br/>
                    <button onClick={() => {this.state.buttonTwoFunction(); playClick();} }>{this.state.buttonTwoText}</button><br/>
                    <button onClick={() => {this.state.backFunction(); playClick();} }>Back</button><br/>
                </div>
            );
        }
        else if (this.props.visible && !this.props.started)
        {
            return (
                <div className="menu">
                    <button onClick={() => {this.restartGame(); playClick();} }>Restart Game</button><br/>
                    <button onClick={() => {this.props.startAnalysis(); playClick();} }>Start Analysis</button>
                </div>
            );
        }
        else
        {
            return (
                <div className="menu">
                    <button onClick={() => {this.restartGame(); playClick();} }>Restart Game</button>
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
        this.props.pvpMode(true);
        this.whichColor(this.backPVPPVC);
    }

    playerVersusComputer()
    {
        this.props.pvpMode(false);
        this.whichPlayer();
    }

    playerFirstMenu()
    {
        this.props.playerFirst(true);
        this.whichColor(this.whichPlayer);
    }

    computerFirstMenu()
    {
        this.props.playerFirst(false);
        this.whichColor(this.whichPlayer);
    }

    redFirstMenu()
    {
        this.props.redFirst(true);
        this.startGame();
    }

    yellowFirstMenu()
    {
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

let clickElement = new soundEffect(process.env.PUBLIC_URL + "/click.mp3");

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

function playClick()
{
    clickElement.sound.load();
    clickElement.sound.play()
    .catch(error => {console.warn("Click sound failed")});
}