﻿import {AxiosError} from "axios";
import {useQuery} from "react-query";
import * as policyService from "../services/policyService";
import {FundingConfiguration} from "../types/FundingConfiguration";
import {milliseconds} from "../helpers/TimeInMs";

export type FundingConfigurationQueryResult = {
    fundingConfiguration: FundingConfiguration | undefined,
    isLoadingFundingConfiguration: boolean,
    isErrorLoadingFundingConfiguration: boolean,
    errorLoadingFundingConfiguration: string
}
export const useFundingConfiguration = (fundingStreamId: string | undefined | null,
                                        fundingPeriodId: string | undefined | null,
                                        onError: (err: AxiosError) => void,
                                        onSuccess?: (data: FundingConfiguration) => void)
    : FundingConfigurationQueryResult => {
    const {data, isLoading, isError, error} = useQuery<FundingConfiguration, AxiosError>(
        `funding-configuration-${fundingStreamId}-${fundingPeriodId}`,
        async () => (await policyService.getFundingConfiguration(fundingStreamId as string, fundingPeriodId as string)).data,
        {
            cacheTime: milliseconds.OneDay,
            staleTime: milliseconds.OneDay,
            onSuccess: onSuccess,
            onError: onError,
            refetchOnWindowFocus: false,
            enabled: (fundingStreamId && fundingPeriodId && fundingPeriodId.length > 0 && fundingStreamId.length > 0) === true
        });
    
    return {
        fundingConfiguration: data,
        isLoadingFundingConfiguration: isLoading,
        isErrorLoadingFundingConfiguration: isError,
        errorLoadingFundingConfiguration: !isError ? "" : error ? `Error while fetching funding configuration: ${error.message}` : "Unknown error while fetching funding configuration"}
};

