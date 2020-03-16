import React from "react";

export function ConfirmationPanel(props: {title:string, body:string, hidden:boolean}){
    return <div className="govuk-panel govuk-panel--confirmation" hidden={props.hidden}>
        <h1 className="govuk-panel__title">
            {props.title}
        </h1>
        <div className="govuk-panel__body">
            {props.body}
        </div>
    </div>
}