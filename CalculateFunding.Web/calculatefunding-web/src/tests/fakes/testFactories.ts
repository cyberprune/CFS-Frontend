﻿import {PublishedProviderResult, PublishedProviderSearchResults} from "../../types/PublishedProvider/PublishedProviderSearchResults";
import {PublishedProviderSearchQueryResult} from "../../hooks/FundingApproval/usePublishedProviderSearch";
import {PublishedProviderErrorSearchQueryResult} from "../../hooks/FundingApproval/usePublishedProviderErrorSearch";
import {PublishedProviderIdsQueryResult} from "../../hooks/FundingApproval/usePublishedProviderIds";
import {PublishedProviderSearchFacet} from "../../types/publishedProviderSearchRequest";

export const defaultFacets = [
    {name: PublishedProviderSearchFacet.HasErrors, facetValues: [{"name": "True", "count": 1}, {"name": "False", "count": 0}]},
    {name: PublishedProviderSearchFacet.ProviderType, facetValues: []},
    {name: PublishedProviderSearchFacet.ProviderSubType, facetValues: []},
    {name: PublishedProviderSearchFacet.LocalAuthority, facetValues: [{"name": "East London", "count": 1}]},
    {name: PublishedProviderSearchFacet.ProviderType, facetValues: []}
];

export const createPublishedProviderResult = (providers: PublishedProviderResult[],
                                              canApprove = true,
                                              canPublish = true,
                                              facets = defaultFacets)
    : PublishedProviderSearchResults => {
    return {
        providers: providers,
        canApprove: canApprove,
        canPublish: canPublish,
        facets: facets,
        filteredFundingAmount: 10000,
        pagerState: {displayNumberOfPages: 1, previousPage: 0, nextPage: 1, lastPage: 1, pages: [1], currentPage: 1},
        currentPage: 1,
        endItemNumber: 1,
        startItemNumber: 1,
        totalFundingAmount: 10000,
        totalProvidersToApprove: 1,
        totalProvidersToPublish: 0,
        totalResults: providers.length
    };
};

export const createPublishedProviderSearchQueryResult = (results: PublishedProviderSearchResults, ids: string[])
    : PublishedProviderSearchQueryResult => {
    return {
        publishedProviderSearchResults: results,
        isLoadingSearchResults: false,
        publishedProviderIds: ids,
        refetchSearchResults: jest.fn()
    };
};

export const createPublishedProviderErrorSearchQueryResult = (errors: string[])
    : PublishedProviderErrorSearchQueryResult => {
    return {
        publishedProvidersWithErrors: errors,
        isLoadingPublishedProviderErrors: false,
        isErrorLoadingPublishedProviderErrors: false,
        errorLoadingPublishedProviderErrors: ""
    };
};
export const createPublishedProviderIdsQueryResult = (ids: string[])
    : PublishedProviderIdsQueryResult => {
    return {
        publishedProviderIds: ids,
        isLoadingPublishedProviderIds: false,
        refetchPublishedProviderIds: jest.fn()
    };
};