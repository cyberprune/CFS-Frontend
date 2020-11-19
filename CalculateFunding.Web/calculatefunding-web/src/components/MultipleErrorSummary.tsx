﻿import React from "react";
import {ErrorMessage} from "../types/ErrorMessage";

export function MultipleErrorSummary(props: { errors: ErrorMessage[] }) {
    if (props.errors && props.errors.length > 0) {
        return (
            <div className="govuk-error-summary" aria-labelledby="error-summary-title" role="alert" tabIndex={-1} data-testid="error-summary">
                <h2 className="govuk-error-summary__title" id="error-summary-title">
                    There is a problem
                </h2>
                <div className="govuk-error-summary__body">
                    <ul className="govuk-list govuk-error-summary__list">
                        {props.errors.map((error, i) =>
                            <li key={i}>
                                {error.description &&
                                <span>{error.description}: </span>
                                }
                                {error.fieldName && <a href={"#" + error.fieldName} className="govuk-link govuk-link-red">{error.message}</a>}
                                {!error.fieldName && <span className="govuk-error-message">{error.message}</span>}
                                {error.validationErrors &&
                                <ul className="govuk-list">
                                    {Object.keys(error.validationErrors).map((errKey, index) =>
                                        errKey === "blobUrl" ?
                                            <li key={`${i}-${index}`}>
                                                <span>Please see </span><a href={error.validationErrors && error.validationErrors["blobUrl"]?.toString()}>error report</a>
                                            </li>
                                            :
                                            <li key={`${i}-${index}`}>
                                                {error.validationErrors && error.validationErrors[errKey]
                                                    .map(err => <><span>{err}</span><br/></>)}
                                            </li>
                                    )}
                                </ul>
                                }
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        );
    } else {
        return null;
    }
}