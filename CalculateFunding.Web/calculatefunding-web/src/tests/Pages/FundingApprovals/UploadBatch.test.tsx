﻿import React from 'react';
import {match, MemoryRouter} from "react-router";
import {createLocation} from "history";
import {render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import {Provider} from "react-redux";
import {createStore, Store} from "redux";
import {IStoreState, rootReducer} from "../../../reducers/rootReducer";
import {QueryCache, QueryClient, QueryClientProvider} from "react-query";
import {UploadBatch, UploadBatchRouteProps} from "../../../pages/FundingApprovals/UploadBatch";
import userEvent from "@testing-library/user-event";
import * as redux from "react-redux";
import {FundingApprovalTestSetup} from "./FundingApprovalTestSetup";
const useSelectorSpy = jest.spyOn(redux, 'useSelector');
const mockHistory = {push: jest.fn()};
const location = createLocation("", "", "");
const store: Store<IStoreState> = createStore(rootReducer);
const testData = FundingApprovalTestSetup();
const mockRoute: match<UploadBatchRouteProps> = {
    params: {
        specificationId: testData.testSpec2.id,
        fundingStreamId: testData.fundingStream2.id,
        fundingPeriodId: testData.fundingPeriod2.id
    },
    url: "",
    path: "",
    isExact: true,
};
const renderPage = () => {
    const {UploadBatch} = require('../../../pages/FundingApprovals/UploadBatch');
    store.dispatch = jest.fn();
    return render(<MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
            <Provider store={store}>
                <UploadBatch location={location} history={mockHistory} match={mockRoute}/>
            </Provider>
        </QueryClientProvider>
    </MemoryRouter>);
};

describe("<UploadBatch />", () => {

    describe("<UploadBatch /> when loading normally", () => {
        beforeEach(() => {
            testData.hasNoActiveJobsRunning();
            testData.hasFundingConfigWithApproveBatchMode();

            renderPage();
        });
        afterEach(() => jest.clearAllMocks());

        it('renders correct heading', async () => {
            expect(screen.getByRole("heading", {name: /Upload batch file/})).toBeInTheDocument();
        });

        it('renders file upload input', async () => {
            const input = await screen.getByLabelText(/Upload an XLSX file/);
            expect(input).toBeInTheDocument();
            expect(input).toBeEnabled();
        });

        it('renders approve button as disabled', async () => {
            const button = screen.getByRole("button", {name: /Approve funding/});
            expect(button).toBeInTheDocument();
            expect(button).toBeDisabled();
        });

        it('renders release button as disabled', async () => {
            const button = screen.getByRole("button", {name: /Release funding/});
            expect(button).toBeInTheDocument();
            expect(button).toBeDisabled();
        });
    });

    describe("<UploadBatch /> when user selects file to upload", () => {
        beforeEach(async () => {
            testData.hasNoActiveJobsRunning();
            testData.hasFundingConfigWithApproveBatchMode();
            const file = new File(['hello'], 'hello.png', {type: 'image/png'})

            renderPage();

            const input = await screen.getByLabelText(/Upload an XLSX file/);
            userEvent.upload(input, file);
        });
        afterEach(() => jest.clearAllMocks());

        it('renders file upload input', async () => {
            const input = await screen.getByLabelText(/Upload an XLSX file/);
            expect(input).toBeInTheDocument();
            expect(input).toBeEnabled();
        });

        it('renders approve button as enabled', async () => {
            const button = screen.getByRole("button", {name: /Approve funding/});
            expect(button).toBeInTheDocument();
            expect(button).toBeEnabled();
        });

        it('renders release button as enabled', async () => {
            const button = screen.getByRole("button", {name: /Release funding/});
            expect(button).toBeInTheDocument();
            expect(button).toBeEnabled();
        });
    });
});



