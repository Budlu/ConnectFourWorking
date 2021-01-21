import React from "react";

export class Analysis extends React.Component
{
    render()
    {
        if (this.props.visible)
        {
            let elements = this.props.history.map((board, step) => {
                let classes = ["analysis-button"];

                if (step === this.props.index)
                    classes.push("highlighted");

                if (step === 0)
                {
                    return (
                        <li key={step}>
                            <button onClick={() => this.props.jump(step)} className={classes.join(' ')} >Start</button>
                        </li>
                    )
                }
                return (
                    <li key={step}>
                        <button onClick={() => this.props.jump(step)} className={classes.join(' ')} >Move {step}</button>
                    </li>
                );
            });

            return <div className="analysis">{elements}</div>;
        }
        else
            return "";
    }

    startAnalysis()
    {
        this.setState({started: true});
    }
}