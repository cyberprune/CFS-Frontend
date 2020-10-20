﻿import {AxiosError} from "axios";
import {QueryConfig, useQuery} from "react-query";
import {getFundingConfiguration} from "../services/policyService";
import {FundingConfiguration} from "../types/FundingConfiguration";

const oneDay = 1000 * 60 * 60 * 24;

export type FundingConfigurationQueryResult = {
    fundingConfiguration: FundingConfiguration | undefined,
    isLoadingFundingConfiguration: boolean,
    isErrorLoadingFundingConfiguration: boolean,
    errorLoadingFundingConfiguration: string
}
export const useFundingConfiguration = (fundingStreamId: string,
                                        fundingPeriodId: string,
                                        queryConfig: QueryConfig<FundingConfiguration, AxiosError> =
                                            {
                                                cacheTime: oneDay,
                                                staleTime: oneDay,
                                                refetchOnWindowFocus: false,
                                                enabled: fundingStreamId && fundingPeriodId && fundingPeriodId.length > 0 && fundingStreamId.length > 0
                                            })
    : FundingConfigurationQueryResult => {
    const {data, isLoading, isError, error} = useQuery<FundingConfiguration, AxiosError>(
        `funding-configuration-${fundingStreamId}-${fundingPeriodId}`,
        async () => (await getFundingConfiguration(fundingStreamId, fundingPeriodId)).data,
        queryConfig);
    
    return {
        fundingConfiguration: data,
        isLoadingFundingConfiguration: isLoading,
        isErrorLoadingFundingConfiguration: isError,
        errorLoadingFundingConfiguration: !isError ? "" : error ? `Error while fetching funding configuration: ${error.message}` : "Unknown error while fetching funding configuration"}
};
