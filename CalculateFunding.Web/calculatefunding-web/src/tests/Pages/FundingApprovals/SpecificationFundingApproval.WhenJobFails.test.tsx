﻿import React from 'react';
import {act, render, screen, waitFor, within} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import * as redux from "react-redux";
import {FundingApprovalTestData} from "./FundingApprovalTestData";

const useSelectorSpy = jest.spyOn(redux, 'useSelector');
const test = FundingApprovalTestData();

describe("<SpecificationFundingApproval />", () => {
    afterEach(() => jest.clearAllMocks());

    describe("when job has failed", () => {
        beforeEach(() => {
            useSelectorSpy.mockReturnValue(test.fundingSearchSelectionState);
            test.hasFailedJob();
            test.hasSpecification();
            test.hasFundingConfigurationWithApproveAll();
            test.hasFullPermissions();
            test.hasProvidersWithErrors([]);
            test.hasSearchResults([test.provider1]);

            test.renderPage();
        });

        it('renders Specification details', async () => {
            expect(screen.getByTestId("specName")).toBeInTheDocument();
        });

        it('does not render loading spinner', async () => {
            expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
        });

        it('renders job error', async () => {
            expect(await screen.findByText(component => component.startsWith(
                `Job ${test.failedJob?.latestJob?.statusDescription}: ${test.failedJob?.latestJob?.jobDescription}`))).toBeInTheDocument();
        });

        it('renders filters', async () => {
            expect(screen.getByRole("radio", {name: "Provider name"})).toBeInTheDocument();
        });

        it('renders results', async () => {
            expect(screen.getByTestId("published-provider-results")).toBeInTheDocument();
        });

        it('renders refresh button', async () => {
            expect(screen.getByRole("button", {name: /Refresh funding/})).toBeInTheDocument();
        });
    });
});

