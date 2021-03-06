import React from "react";
import {MemoryRouter, Route, Switch} from "react-router";
import {screen, fireEvent, render, waitFor} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect';
import {PublishStatus} from "../../../types/PublishStatusModel";
import {FundingStructureItemViewModel, FundingStructureType} from "../../../types/FundingStructureItem";
import {QueryClient, QueryClientProvider} from "react-query";
import {CalculationType} from "../../../types/CalculationSearchResponse";
import {CalculationValueType} from "../../../types/CalculationDetails";
import {ValueFormatType} from "../../../types/TemplateBuilderDefinitions";
import {LegacyCalculationType} from "../../../types/Provider/ProviderResultForSpecification";

describe("<FundingLineResults/> tests", () => {
    beforeAll(() => {
        jest.mock('../../../services/providerService', () => mockProviderService());
        jest.mock('../../../services/fundingStructuresService', () => mockFundingLineStructureService());
        jest.mock('../../../services/calculationService', () => mockCalculationService());
    });

    afterEach(() => jest.clearAllMocks());

    describe("<FundingLineResults service checks />  ", () => {
        it("calls getFundingLineStructureService, getCalculationSummaryBySpecificationId and getCalculationCircularDependencies", async () => {
            const {getFundingLineStructureService} = require('../../../services/fundingStructuresService');
            const {getCalculationSummaryBySpecificationId} = require('../../../services/calculationService');
            const {getCalculationCircularDependencies} = require('../../../services/calculationService');
            const {getFundingStructureResultsForProviderAndSpecification} = require('../../../services/providerService');

            renderViewSpecificationFundingLineResults();

            await waitFor(() => {
                expect(getFundingLineStructureService).toBeCalledTimes(1);
                expect(getCalculationSummaryBySpecificationId).toBeCalledTimes(1);
                expect(getCalculationCircularDependencies).toBeCalledTimes(1);
                expect(getFundingStructureResultsForProviderAndSpecification).toBeCalledTimes(0);
            });
        });

        it("calls getFundingStructureResultsForProviderAndSpecification when providerId provided", async () => {
            const {getFundingLineStructureService} = require('../../../services/fundingStructuresService');
            const {getCalculationSummaryBySpecificationId} = require('../../../services/calculationService');
            const {getCalculationCircularDependencies} = require('../../../services/calculationService');
            const {getFundingStructureResultsForProviderAndSpecification} = require('../../../services/providerService');

            renderProviderFundingLineResults();

            await waitFor(() => {
                expect(getFundingLineStructureService).toBeCalledTimes(1);
                expect(getCalculationSummaryBySpecificationId).toBeCalledTimes(1);
                expect(getCalculationCircularDependencies).toBeCalledTimes(1);
                expect(getFundingStructureResultsForProviderAndSpecification).toBeCalledTimes(1);
            });
        });
    });

    describe('<FundingLineResults /> page renders correctly ', () => {
        it('shows approve status in funding line structure tab', async () => {
            const {queryAllByText} = renderViewSpecificationFundingLineResults();
            await waitFor(() => expect(queryAllByText('Draft')[0]).toHaveClass("govuk-tag"));
        });

        it('renders collapsible steps', async () => {
            const {container} = renderViewSpecificationFundingLineResults();
            await waitFor(() => expect(container.querySelectorAll('.collapsible-steps')).toHaveLength(1));
        });

        it('shows search box with an autocomplete input in funding line structure tab', async () => {
            const {container} = renderViewSpecificationFundingLineResults();
            await waitFor(() => expect(container.querySelectorAll('#fundingline-structure .search-container')).toHaveLength(1))
            await waitFor(() => expect(container.querySelectorAll('#fundingline-structure .search-container #input-auto-complete')).toHaveLength(1));
        });

        it('shows open-close all buttons correctly', async () => {
            const {container} = renderViewSpecificationFundingLineResults();
            await waitFor(() => expect(container.querySelectorAll('#fundingline-structure .govuk-accordion__open-all')[0]).toBeVisible());
            await waitFor(() => expect(container.querySelectorAll('#fundingline-structure .govuk-accordion__open-all')[1]).not.toBeVisible());

            fireEvent.click(container.querySelectorAll('#fundingline-structure .govuk-accordion__open-all')[0]);

            await waitFor(() => expect(container.querySelectorAll('#fundingline-structure .govuk-accordion__open-all')[0]).not.toBeVisible());
            await waitFor(() => expect(container.querySelectorAll('#fundingline-structure .govuk-accordion__open-all')[1]).toBeVisible());
        });

        it('does not show calculation errors when providerId not provided', async () => {
            renderViewSpecificationFundingLineResults();
            await waitFor(() => expect(screen.queryByText('exception')).not.toBeInTheDocument());
        });

        it('shows circular reference errors when providerId not provided', async () => {
            renderViewSpecificationFundingLineResults();
            await waitFor(() => expect(screen.queryByText(/Circular reference detected in calculation script/i)).toBeInTheDocument());
        });
    });

    describe('<FundingLineResults /> when providerId provided', () => {
        it('renders calculation value and format correctly', async () => {
            renderProviderFundingLineResults();
            await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument());
            await waitFor(() => expect(screen.getByText('£200')).toBeInTheDocument());
            await waitFor(() => expect(screen.getByText('Number')).toBeInTheDocument());
            await waitFor(() => expect(screen.getByText('Currency')).toBeInTheDocument());
        });

        it('shows calculation errors when providerId provided', async () => {
            renderProviderFundingLineResults();
            await waitFor(() => expect(screen.queryByText('exception')).toBeInTheDocument());
        });

        it('shows circular reference errors when providerId provided', async () => {
            renderProviderFundingLineResults();
            await waitFor(() => expect(screen.queryByText(/Circular reference detected in calculation script. oops/i)).toBeInTheDocument());
        });
    });
});

const renderViewSpecificationFundingLineResults = () => {
    const {FundingLineResults} = require('../../../components/FundingLineStructure/FundingLineResults');
    return render(<MemoryRouter initialEntries={['/FundingLineResults/SPEC123/FS1/FP1/Completed']}>
        <QueryClientProvider client={new QueryClient()}>
            <Switch>
                <Route path="/FundingLineResults/:specificationId/:fundingStreamId/:fundingPeriodId/:publishStatus">
                    <FundingLineResults
                        status={PublishStatus.Draft}
                        fundingPeriodId={"test fundingPeriodId"}
                        fundingStreamId={"test fundingStreamId"}
                        specificationId={"test spec id"}
                        addError={jest.fn()}
                        clearErrorMessages={jest.fn()}
                        showApproveButton={true}
                    />
                </Route>
            </Switch>
        </QueryClientProvider>
    </MemoryRouter>);
}

const renderProviderFundingLineResults = () => {
    const {FundingLineResults} = require('../../../components/FundingLineStructure/FundingLineResults');
    return render(<MemoryRouter initialEntries={['/FundingLineResults/SPEC123/FS1/FP1/Completed']}>
        <QueryClientProvider client={new QueryClient()}>
            <Switch>
                <Route path="/FundingLineResults/:specificationId/:fundingStreamId/:fundingPeriodId/:publishStatus">
                    <FundingLineResults
                        status={undefined}
                        fundingPeriodId={"test fundingPeriodId"}
                        fundingStreamId={"test fundingStreamId"}
                        specificationId={"test spec id"}
                        providerId={"test provider id"}
                        addError={jest.fn()}
                        clearErrorMessages={jest.fn()}
                        showApproveButton={false} />
                </Route>
            </Switch>
        </QueryClientProvider>
    </MemoryRouter>);
}

const mockFundingLineStructureService = () => {
    const fundingLineStructureService = jest.requireActual('../../../services/fundingStructuresService');
    const mockedFundingStructureItems: FundingStructureItemViewModel[] = [{
        level: 1,
        name: "fundingline1",
        calculationId: '',
        fundingLineCode: null,
        value: "",
        calculationType: "",
        templateId: 1,
        calculationPublishStatus: undefined,
        type: FundingStructureType.FundingLine,
        fundingStructureItems: [{
            level: 2,
            name: 'calc123',
            calculationId: '123',
            fundingLineCode: '',
            value: "100",
            calculationType: "Number",
            templateId: 2,
            calculationPublishStatus: PublishStatus.Draft,
            type: FundingStructureType.Calculation,
            fundingStructureItems: []
        },
        {
            level: 2,
            name: 'calc456',
            calculationId: '456',
            fundingLineCode: '',
            value: "200",
            calculationType: "Currency",
            templateId: 3,
            calculationPublishStatus: PublishStatus.Draft,
            type: FundingStructureType.Calculation,
            fundingStructureItems: []
        }],
        expanded: true
    }];
    return {
        ...fundingLineStructureService,
        getFundingLineStructureService: jest.fn(() => Promise.resolve({
            data: mockedFundingStructureItems
        }))
    }
}

const mockProviderService = () => {
    const providerService = jest.requireActual('../../../services/providerService');
    return {
        ...providerService,
        getFundingStructureResultsForProviderAndSpecification: jest.fn(() => Promise.resolve({
            data: {
                specificationId: "spec",
                specificationName: "spec name",
                fundingStreamId: "fundingStreamId",
                fundingStreamName: "fundingStreamName",
                fundingLineResults: {
                    1: {
                        templateLineId: 1,
                        fundingLineCode: null,
                        name: "fundingline1",
                        value: 0,
                        exceptionMessage: null
                    }
                },
                calculationResults: {
                    2: {
                        templateCalculationId: 2,
                        name: 'calc123',
                        calculationId: '123',
                        status: PublishStatus.Draft,
                        valueFormat: ValueFormatType.Number,
                        templateCalculationType: LegacyCalculationType.Number,
                        value: 100,
                        exceptionMessage: 'exception'
                    },
                    3: {
                        templateCalculationId: 3,
                        name: 'calc456',
                        calculationId: '456',
                        status: PublishStatus.Draft,
                        valueFormat: ValueFormatType.Currency,
                        templateCalculationType: LegacyCalculationType.Cash,
                        value: 200,
                        exceptionMessage: 'oops'
                    }
                }
            },
            status: 200
        }))
    }
};

const mockCalculationService = () => {
    const calculationService = jest.requireActual('../../../services/calculationService');
    return {
        ...calculationService,
        getCalculationSummaryBySpecificationId: jest.fn(() => Promise.resolve({
            data: [{
                calculationType: CalculationType.Template,
                publishStatus: PublishStatus.Draft,
                version: 1,
                type: CalculationValueType.Number,
                id: '123',
                name: 'calc123'
            },
            {
                calculationType: CalculationType.Template,
                publishStatus: PublishStatus.Draft,
                version: 1,
                type: CalculationValueType.Currency,
                id: '456',
                name: 'calc456'
            }],
            status: 200
        })),
        getCalculationCircularDependencies: jest.fn(() => Promise.resolve({
            data: [{
                node: {
                    calculationid: "456",
                    specificationId: "spec",
                    calculationName: "calc456",
                    calculationType: "Template",
                    fundingSteam: "fundingStreamId"
                },
                relationships: [{
                    source: {
                        calculationid: "456",
                        specificationId: "spec",
                        calculationName: "calc456",
                        calculationType: "Template",
                        fundingSteam: "fundingStreamId"
                    },
                    target: {
                        calculationid: "789",
                        specificationId: "spec",
                        calculationName: "calc789",
                        calculationType: "Template",
                        fundingSteam: "fundingStreamId"
                    }
                }]
            }],
            status: 200
        }))
    }
}
