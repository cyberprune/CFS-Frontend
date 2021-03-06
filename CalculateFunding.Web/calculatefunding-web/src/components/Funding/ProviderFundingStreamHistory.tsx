﻿import React from "react";
import {ProviderTransactionSummary} from "../../types/ProviderSummary";


export interface ProviderFundingStreamHistoryProps {
    transactions: ProviderTransactionSummary
}

export const ProviderFundingStreamHistory = (props: ProviderFundingStreamHistoryProps) => {
return <section className="govuk-tabs__panel" id="funding-stream-history">
    <h2 className="govuk-heading-l">Funding stream history</h2>
    <table className="govuk-table">
        <caption className="govuk-table__caption">History of status changes</caption>
        <thead className="govuk-table__head">
        <tr className="govuk-table__row">
            <th scope="col" className="govuk-table__header">Status</th>
            <th scope="col"
                className="govuk-table__header govuk-table__header--numeric">Author
            </th>
            <th scope="col"
                className="govuk-table__header govuk-table__header--numeric">Date/time of change
            </th>
            <th scope="col"
                className="govuk-table__header govuk-table__header--numeric">Funding stream value
            </th>
        </tr>
        </thead>
        <tbody className="govuk-table__body">
        <tr className="govuk-table__row" hidden={props.transactions.results?.length > 0}>
            <td colSpan={4}>
                There are no results that match your search
            </td>
        </tr>
        {props.transactions.results && props.transactions.results.map((fsh, i) =>
            <tr className="govuk-table__row" key={`transaction-${i}`}>
                <th scope="row" className="govuk-table__header">{fsh.status}</th>
                <td className="govuk-table__cell govuk-table__cell--numeric">{fsh.author}</td>
                <td className="govuk-table__cell govuk-table__cell--numeric">{fsh.dateChanged}</td>
                <td className="govuk-table__cell govuk-table__cell--numeric">{fsh.fundingStreamValue}</td>
            </tr>)}
        </tbody>
    </table>
</section>
}