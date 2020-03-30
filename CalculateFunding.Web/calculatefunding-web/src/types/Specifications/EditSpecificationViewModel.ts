import {FundingPeriod, FundingStream, TemplateIds} from "../viewFundingTypes";

export interface EditSpecificationViewModel {
    fundingPeriod: FundingPeriod;
    fundingStreams: FundingStream[];
    providerVersionId: string;
    description: string;
    isSelectedForFunding: boolean;
    approvalStatus: string;
    templateIds: TemplateIds;
    dataDefinitionRelationshipIds: string[];
    id: string;
    name: string;
}