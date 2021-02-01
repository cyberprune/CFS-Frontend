import React from 'react';
import {createStore, Store} from "redux";
import {IStoreState, rootReducer} from "../../../reducers/rootReducer";
import {render, screen, waitFor} from "@testing-library/react";
import {MemoryRouter, Route, Switch} from "react-router";
import '@testing-library/jest-dom/extend-expect';
import {CoreProviderSummary, ProviderSnapshot, ProviderSource} from "../../../types/CoreProviderSummary";
import {QueryClientProviderTestWrapper} from "../../Hooks/QueryClientProviderTestWrapper";
import {FundingPeriod, FundingStream} from "../../../types/viewFundingTypes";
import {PublishedFundingTemplate} from "../../../types/TemplateBuilderDefinitions";
import {SpecificationSummary} from "../../../types/SpecificationSummary";
import {ApprovalMode} from "../../../types/ApprovalMode";

const store: Store<IStoreState> = createStore(
    rootReducer
);

store.dispatch = jest.fn();

export function SpecificationTestData() {

    const renderCreateSpecificationPage = async () => {
        const {CreateSpecification} = require('../../../pages/Specifications/CreateSpecification');
        const component = render(<MemoryRouter initialEntries={['/Specifications/CreateSpecification']}>
            <QueryClientProviderTestWrapper>
                <Switch>
                    <Route path="/Specifications/CreateSpecification" component={CreateSpecification}/>
                </Switch>
            </QueryClientProviderTestWrapper>
        </MemoryRouter>);

        await waitFor(() => {
            expect(screen.queryByText(/Loading.../)).not.toBeInTheDocument();
        });
        return component;
    };

    const renderEditSpecificationPage = async (mockSpecId: string) => {
        const {EditSpecification} = require('../../../pages/Specifications/EditSpecification');
        const component = render(<MemoryRouter initialEntries={[`/Specifications/EditSpecification/${mockSpecId}`]}>
            <QueryClientProviderTestWrapper>
                <Switch>
                    <Route path="/Specifications/EditSpecification/:specificationId" component={EditSpecification}/>
                </Switch>
            </QueryClientProviderTestWrapper>
        </MemoryRouter>);

        await waitFor(() => {
            expect(screen.queryByText(/Loading.../)).not.toBeInTheDocument();
        });
        return component;
    };

    const mockFundingStream: FundingStream = {
        id: "stream-547",
        name: "Test Stream 547"
    };
    const mockFundingPeriod: FundingPeriod = {
        id: "period-433",
        name: "Test Period 433"
    };
    const mockTemplate1: PublishedFundingTemplate = {
        authorId: "53",
        authorName: "yukl yrtj",
        publishDate: new Date(),
        publishNote: "another publish note",
        schemaVersion: "1.1",
        templateVersion: "3.2"
    };
    const mockTemplate2: PublishedFundingTemplate = {
        authorId: "43",
        authorName: "asdf asdf",
        publishDate: new Date(),
        publishNote: "blah blah publish note",
        schemaVersion: "1.4",
        templateVersion: "9.9"
    };
    const mockPolicyService = (mockProviderSource: ProviderSource, mockApprovalMode: ApprovalMode) => {
        jest.mock("../../../services/policyService", () => {
            const service = jest.requireActual("../../../services/policyService");

            return {
                ...service,
                getFundingStreamsService: jest.fn(() => Promise.resolve({
                    data:
                        [{
                            id: mockFundingStream.id,
                            name: mockFundingStream.name
                        }]
                })),
                getPublishedTemplatesByStreamAndPeriod: jest.fn(() => Promise.resolve({
                    data: [mockTemplate1, mockTemplate2]
                })),
                getFundingConfiguration: jest.fn(() => Promise.resolve({
                    data:
                        {
                            fundingStreamId: mockFundingStream.id,
                            fundingPeriodId: mockFundingPeriod.id,
                            approvalMode: mockApprovalMode,
                            providerSource: mockProviderSource,
                            defaultTemplateVersion: mockTemplate2.templateVersion
                        }
                }))
            }
        });
    }

    const mockCoreProvider1: CoreProviderSummary = {
        providerVersionId: "provider-version-4162",
        versionType: "",
        name: "Provider 4162",
        description: "",
        version: 11,
        targetDate: new Date(),
        fundingStream: mockFundingStream.id,
        created: new Date()
    };
    const mockCoreProvider2: CoreProviderSummary = {
        providerVersionId: "provider-version-5439",
        versionType: "",
        name: "Provider 5439",
        description: "",
        version: 4,
        targetDate: new Date(),
        fundingStream: mockFundingStream.id,
        created: new Date()
    };
    const mockProviderSnapshot1: ProviderSnapshot = {
        providerSnapshotId: 2354,
        name: "Provider Snapshot Name 2354",
        description: "Provider Snapshot Description 2354",
        version: 14,
        targetDate: new Date(),
        created: new Date(),
        fundingStreamCode: mockFundingStream.id,
        fundingStreamName: mockFundingStream.name
    };
    const mockProviderSnapshot2: ProviderSnapshot = {
        providerSnapshotId: 423623,
        name: "Provider Snapshot Name 423623",
        description: "Provider Snapshot Description 423623",
        version: 51,
        targetDate: new Date(),
        created: new Date(),
        fundingStreamCode: mockFundingStream.id,
        fundingStreamName: mockFundingStream.name
    };
    const mockCfsSpec: SpecificationSummary = {
        name: "Wizard Training",
        approvalStatus: "",
        description: "Lorem ipsum lalala",
        fundingPeriod: mockFundingPeriod,
        fundingStreams: [mockFundingStream],
        id: "ABC123",
        isSelectedForFunding: true,
        providerVersionId: mockCoreProvider2.providerVersionId,
        dataDefinitionRelationshipIds: [],
        templateIds: {"stream-547" : mockTemplate2.templateVersion},
    };
    const mockFdzSpec: SpecificationSummary = {
        name: "Wizard Training",
        approvalStatus: "",
        description: "Lorem ipsum lalala",
        fundingPeriod: mockFundingPeriod,
        fundingStreams: [mockFundingStream],
        id: "ABC123",
        isSelectedForFunding: true,
        providerSnapshotId: mockProviderSnapshot2.providerSnapshotId,
        dataDefinitionRelationshipIds: [],
        templateIds: {"stream-547" : mockTemplate2.templateVersion},
    };

    const mockSpecificationServiceWithDuplicateNameResponse = () => {
        jest.mock("../../../services/specificationService", () => {
            const service = jest.requireActual("../../../services/specificationService");
            return {
                ...service,
                getSpecificationSummaryService: jest.fn(() => Promise.resolve({
                    data: mockCfsSpec
                })),
                getFundingPeriodsByFundingStreamIdService: jest.fn(() => Promise.resolve({
                    data: [mockFundingPeriod]
                })),
                createSpecificationService: jest.fn(() => Promise.reject({
                    status: 400,
                    response: {data: {Name: 'unique name error'}}
                }))
            }
        });
    }

    const mockSpecificationService = (mockSpec: SpecificationSummary) => {
        jest.mock("../../../services/specificationService", () => {
            const service = jest.requireActual("../../../services/specificationService");
            return {
                ...service,
                getSpecificationSummaryService: jest.fn(() => Promise.resolve({
                    data: mockSpec
                })),
                getFundingPeriodsByFundingStreamIdService: jest.fn(() => Promise.resolve({
                    data: [mockFundingPeriod]
                })),
                updateSpecificationService: jest.fn(() => Promise.resolve({status: 200})),
                createSpecificationService: jest.fn(() => Promise.resolve({
                    data:
                        {
                            name: "",
                            id: "35486792350689",
                            approvalStatus: "",
                            isSelectedForFunding: true,
                            description: "",
                            providerVersionId: "",
                            fundingStreams: [mockFundingStream],
                            fundingPeriod: mockFundingPeriod,
                            templateIds: {},
                            dataDefinitionRelationshipIds: []
                        }
                }))
            }
        });
    }

    const mockProviderVersionService = () => {
        jest.mock("../../../services/providerVersionService", () => {
            const service = jest.requireActual("../../../services/providerVersionService");

            return {
                ...service,
                getCoreProvidersByFundingStream: jest.fn(() => Promise.resolve({
                    data: [mockCoreProvider1, mockCoreProvider2]
                }))
            }
        });
    }

    const mockProviderService = () => {
        jest.mock("../../../services/providerService", () => {
            const service = jest.requireActual("../../../services/providerService");

            return {
                ...service,
                getProviderSnapshotsByFundingStream: jest.fn(() => Promise.resolve({
                    data: [mockProviderSnapshot1, mockProviderSnapshot2]
                }))
            }
        });
    }

    return {
        renderCreateSpecificationPage,
        renderEditSpecificationPage,
        mockPolicyService,
        mockSpecificationService,
        mockSpecificationServiceWithDuplicateNameResponse,
        mockProviderVersionService,
        mockProviderService,
        specificationCfs: mockCfsSpec,
        specificationFdz: mockFdzSpec,
        fundingStream: mockFundingStream,
        fundingPeriod: mockFundingPeriod,
        template1: mockTemplate1,
        template2: mockTemplate2,
        coreProvider1: mockCoreProvider1,
        coreProvider2: mockCoreProvider2,
        providerSnapshot1: mockProviderSnapshot1,
        providerSnapshot2: mockProviderSnapshot2
    }
}