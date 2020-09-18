import React from 'react';
import {match, MemoryRouter} from "react-router";
import {SpecificationFundingApproval, SpecificationFundingApprovalRoute} from "../../../pages/FundingApprovals/SpecificationFundingApproval";
import {createLocation, createMemoryHistory} from "history";
import {render, screen} from "@testing-library/react";
import {SpecificationSummary} from "../../../types/SpecificationSummary";
import {JobSummary} from "../../../types/jobSummary";

const Adapter = require('enzyme-adapter-react-16');
const enzyme = require('enzyme');
enzyme.configure({adapter: new Adapter()});

const history = createMemoryHistory();
const location = createLocation("","","");
const matchMock : match<SpecificationFundingApprovalRoute> = {
    params: {
        specificationId: "ABC123",
        fundingStreamId: "FS123",
        fundingPeriodId: "FP123"
    },
    path:"",
    isExact: true,
};
export const testSpec: SpecificationSummary = {
    name: "Wizard Training",
    approvalStatus: "",
    description: "",
    fundingPeriod: {
        id: "FP123",
        name: "2019-20"
    },
    fundingStreams: [{
        name: "FS123",
        id: "Wizard Training Scheme"
    }],
    id: "ABC123",
    isSelectedForFunding: true,
    providerVersionId: ""
};

function mockGetSpecification(spec: SpecificationSummary) {
    const specService = jest.requireActual('../../../services/specificationService');
    return {
        ...specService,
        getSpecificationSummaryService: jest.fn(() => Promise.resolve({
            data: spec
        }))
    }
}
function mockGetJobs(jobResults: JobSummary[]) {
    const jobService = jest.requireActual('../../../services/jobService');
    return {
        ...jobService,
        getJobStatusUpdatesForSpecification: jest.fn(() => Promise.resolve({
            data: jobResults
        }))
    }
}

const renderPage = () => {
    const {SpecificationFundingApproval} = require('../../../pages/FundingApprovals/SpecificationFundingApproval');
    return render(<MemoryRouter><SpecificationFundingApproval location={location} history={history} match={matchMock} /></MemoryRouter>);
};

describe("<SpecificationFundingApproval />", () => {
    beforeEach(() => {
        mockGetSpecification(testSpec);
        mockGetJobs([]);
        renderPage();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    it('renders Specification loading', async () => {
        expect(screen.getByTestId("loadingSpecification")).toBeTruthy();
    });
    
    it('renders job loading', async () => {
        expect(screen.getByTestId("loadingJobs")).toBeTruthy();
    });
});