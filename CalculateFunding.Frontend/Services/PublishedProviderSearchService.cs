﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using AutoMapper;
using CalculateFunding.Common.ApiClient.Models;
using CalculateFunding.Common.ApiClient.Policies;
using CalculateFunding.Common.ApiClient.Policies.Models;
using CalculateFunding.Common.ApiClient.Policies.Models.FundingConfig;
using CalculateFunding.Common.ApiClient.Publishing;
using CalculateFunding.Common.ApiClient.Publishing.Models;
using CalculateFunding.Common.Models.Search;
using CalculateFunding.Common.Utility;
using CalculateFunding.Frontend.Interfaces.Services;
using CalculateFunding.Frontend.ViewModels.Common;
using CalculateFunding.Frontend.ViewModels.Results;
using Serilog;

namespace CalculateFunding.Frontend.Services
{
    public class PublishedProviderSearchService : IPublishedProviderSearchService
    {
        private readonly IPublishingApiClient _publishingApiClient;
        private readonly IPoliciesApiClient _policiesApiClient;
        private readonly ILogger _logger;
        private readonly IMapper _mapper;

        public PublishedProviderSearchService(IPublishingApiClient publishingApiClient, IPoliciesApiClient policiesApiClient, ILogger logger, IMapper mapper)
        {
            _publishingApiClient = publishingApiClient;
            _policiesApiClient = policiesApiClient;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<PublishProviderSearchResultViewModel> PerformSearch(SearchRequestViewModel request)
        {
            Guard.ArgumentNotNull(request.PageSize, "PageSize");

            SearchModel requestOptions = new SearchModel
            {
                PageNumber = request.PageNumber ?? 1,
                Top = request.PageSize.Value,
                SearchTerm = request.SearchTerm,
                IncludeFacets = request.IncludeFacets,
                Filters = request.Filters,
                SearchMode = Common.Models.Search.SearchMode.All,
                SearchFields = request.SearchFields
            };

            if (request.PageNumber.HasValue && request.PageNumber.Value > 0)
            {
                requestOptions.PageNumber = request.PageNumber.Value;
            }

            var searchTask = _publishingApiClient.SearchPublishedProvider(requestOptions);
            var fundingConfigTask = _policiesApiClient.GetFundingConfiguration(request.FundingStreamId, request.FundingPeriodId);

            ApiResponse<SearchResults<PublishedProviderSearchItem>> searchResponse = await searchTask;
            if (searchResponse == null)
            {
                _logger.Error("Find providers HTTP request failed");
                return null;
            }

            PublishProviderSearchResultViewModel result = new PublishProviderSearchResultViewModel
            {
                TotalResults = searchResponse.Content?.TotalCount ?? 0,
                TotalErrorResults = searchResponse.Content?.TotalErrorCount ?? 0,
                CurrentPage = requestOptions.PageNumber,
                Facets = searchResponse.Content?.Facets?.Select(facet => _mapper.Map<SearchFacetViewModel>(facet)),
                Providers = searchResponse.Content?.Results?.Select(provider => _mapper.Map<PublishedProviderSearchResultItemViewModel>(provider)),
                FilteredFundingAmount = searchResponse.Content?.Results?.Sum(x => x.FundingValue) ?? 0
            };

            int totalPages = (int) Math.Ceiling((double) result.TotalResults / (double) request.PageSize.Value);
            result.PagerState = new PagerState(requestOptions.PageNumber, totalPages, 4);

            int numberOfResultsInThisPage = result.Providers?.Count() ?? 0;
            if (numberOfResultsInThisPage > 0)
            {
                result.StartItemNumber = (result.PagerState.CurrentPage - 1) * request.PageSize.Value + 1;
                result.EndItemNumber = result.StartItemNumber + numberOfResultsInThisPage - 1;
            }

            ApiResponse<FundingConfiguration> fundingConfigurationResponse = await fundingConfigTask;
            if (fundingConfigurationResponse.StatusCode != HttpStatusCode.OK)
            {
                _logger.Error($"Request failed to find funding configuration for stream {request.FundingStreamId} and period {request.FundingPeriodId}");
                return null;
            }

            bool isBatchModeEnabled = fundingConfigurationResponse.Content.ApprovalMode == ApprovalMode.Batches;

            if (result.Providers != null && result.Providers.Any())
            {
                string[] providerTypes = request.Filters.GetValueOrDefault("providerType") ?? new string[0];
                string[] localAuthorities = request.Filters.GetValueOrDefault("localAuthority") ?? new string[0];
                string[] fundingStatuses = request.Filters.GetValueOrDefault("fundingStatus") ?? new string[0];
                ApiResponse<IEnumerable<ProviderFundingStreamStatusResponse>> providerStatusCounts =
                    await _publishingApiClient.GetProviderStatusCounts(
                        result.Providers.First().SpecificationId,
                        providerTypes.FirstOrDefault(),
                        localAuthorities.FirstOrDefault(),
                        fundingStatuses.FirstOrDefault()
                    );

                foreach (var providerStats in providerStatusCounts.Content)
                {
                    if (isBatchModeEnabled && providerStats.ProviderApprovedCount > 0)
                    {
                        result.CanPublish = true;
                    }
                    
                    if (providerStats.ProviderDraftCount == 0 &&
                        providerStats.ProviderApprovedCount > 0 &&
                        providerStats.ProviderUpdatedCount == 0)
                    {
                        result.CanPublish = true;
                        result.TotalProvidersToPublish += providerStats.ProviderApprovedCount;
                    }

                    if (providerStats.ProviderDraftCount > 0 ||
                        providerStats.ProviderUpdatedCount > 0)
                    {
                        result.CanApprove = true;
                        result.TotalProvidersToApprove += providerStats.ProviderUpdatedCount;
                        result.TotalProvidersToApprove += providerStats.ProviderDraftCount;
                    }

                    if (providerStats.TotalFunding.HasValue)
                    {
                        result.TotalFundingAmount = +providerStats.TotalFunding.Value;
                    }
                }
            }

            return result;
        }
    }
}