﻿using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using CalculateFunding.Common.ApiClient;
using CalculateFunding.Common.ApiClient.Models;
using CalculateFunding.Common.Interfaces;
using CalculateFunding.Common.Utility;
using CalculateFunding.Frontend.Clients.TemplateBuilderClient.Models;
using CalculateFunding.Frontend.Interfaces;
using CalculateFunding.Frontend.ViewModels.Common;
using CalculateFunding.Frontend.ViewModels.TemplateBuilder;
using Microsoft.AspNetCore.WebUtilities;
using Serilog;

namespace CalculateFunding.Frontend.Clients.TemplateBuilderClient
{
    // TODO: move to Common's PolicyApiClient once the dust settles
    public class TemplateBuilderApiClient : BaseApiClient, ITemplateBuilderApiClient
    {
        public TemplateBuilderApiClient(IHttpClientFactory httpClientFactory, ILogger logger,
            ICancellationTokenProvider cancellationTokenProvider = null)
            : base(httpClientFactory, HttpClientKeys.Policies, logger, cancellationTokenProvider)
        {
        }

        public async Task<ApiResponse<TemplateResource>> GetTemplate(string templateId)
        {
            string url = $"templates/build/{templateId}";

            return await GetAsync<TemplateResource>(url);
        }

        public async Task<ApiResponse<TemplateResource>> GetTemplateVersion(string templateId, string version)
        {
            string url = $"templates/build/{templateId}/versions/{version}";

            return await GetAsync<TemplateResource>(url);
        }

        public async Task<ApiResponse<IEnumerable<TemplateResource>>> GetPublishedTemplatesByFundingStreamAndPeriod(string fundingStreamId, string fundingPeriodId)
        {
            string url = $"templates/build/versions/search";

            return await PostAsync<IEnumerable<TemplateResource>, FindTemplateVersionQuery>(url, new FindTemplateVersionQuery
            {
                FundingStreamId = fundingStreamId,
                FundingPeriodId = fundingPeriodId,
                Statuses = new List<TemplateStatus> {TemplateStatus.Published}
            });
        }

        public async Task<NoValidatedContentApiResponse> ApproveTemplate(string templateId, string version, string comment)
        {
            string url = $"templates/build/{templateId}/approve";

            if (!string.IsNullOrWhiteSpace(version))
            {
                url = QueryHelpers.AddQueryString(url, "version", version);
            }
            if (!string.IsNullOrWhiteSpace(comment))
            {
                url = QueryHelpers.AddQueryString(url, "comment", comment);
            }

            return await ValidatedPostAsync<dynamic>(url, null);
        }

        public async Task<ApiResponse<List<TemplateResource>>> GetTemplateVersions(string templateId, List<TemplateStatus> statuses)
        {
            Guard.ArgumentNotNull(templateId, nameof(templateId));
            string templateStatusesParam = string.Join(",", statuses);
            string url = $"templates/build/{templateId}/versions";
            if (!string.IsNullOrWhiteSpace(templateStatusesParam))
            {
                url += $"?statuses={templateStatusesParam}";
            }

            return await GetAsync<List<TemplateResource>>(url);
        }

        public async Task<ApiResponse<string>> CreateDraftTemplate(TemplateCreateCommand command)
        {
            string url = "templates/build";

            return await ValidatedPostAsync<string, TemplateCreateCommand>(url, command);
        }

        public async Task<ApiResponse<string>> CreateTemplateAsClone(TemplateCreateAsCloneCommand command)
        {
            string url = "templates/build/clone";

            return await ValidatedPostAsync<string, TemplateCreateAsCloneCommand>(url, command);
        }

        public async Task<ValidatedApiResponse<string>> UpdateTemplateContent(TemplateContentUpdateCommand command)
        {
            string url = "templates/build/content";

            return await ValidatedPutAsync<string, TemplateContentUpdateCommand>(url, command);
        }

        public async Task<ValidatedApiResponse<string>> UpdateTemplateMetadata(TemplateMetadataUpdateCommand command)
        {
            string url = "templates/build/metadata";

            return await ValidatedPutAsync<string, TemplateMetadataUpdateCommand>(url, command);
        }

        public async Task<ApiResponse<SearchResults<TemplateIndex>>> SearchTemplates(SearchRequestViewModel request)
        {
	        string url = "templates/templates-search";

	        return await PostAsync<SearchResults<TemplateIndex>, SearchRequestViewModel>(url, request);

        }
    }
}