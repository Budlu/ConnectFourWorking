import React from "react";

export class EvalBar extends React.Component
{   
    render()
    {
        if (!this.props.analysis)
            return "";

        let height = -1;
        if (this.props.p1Height !== undefined)
        {
            if (this.props.redFirst)
            {
                height = this.props.p1Height;
            }
            else
            {
                height = 100 - this.props.p1Height;
            }
        }

        let boxClass = "";
        if (!this.props.connected && height === -1)
            boxClass = "blank-box"
        else
            boxClass = "eval-box";

        return (
                <div className={boxClass}>
                    <div className="eval-red" style={{height: height + '%'}}></div>
                </div>
        );
    }
}