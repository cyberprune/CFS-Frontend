﻿using CalculateFunding.Common.ApiClient.Models;
using CalculateFunding.Common.ApiClient.Policies;
using CalculateFunding.Common.ApiClient.Policies.Models;
using CalculateFunding.Common.ApiClient.Policies.Models.FundingConfig;
using CalculateFunding.Common.Models;
using CalculateFunding.Common.Utility;
using CalculateFunding.Frontend.Extensions;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;

namespace CalculateFunding.Frontend.Controllers
{
    public class PolicyController : Controller
    {
        private readonly IPoliciesApiClient _policiesApiClient;

        public PolicyController(IPoliciesApiClient policiesApiClient)
        {
            Guard.ArgumentNotNull(policiesApiClient, nameof(policiesApiClient));
            _policiesApiClient = policiesApiClient;
        }

        [Route("api/policy/fundingperiods")]
        public async Task<IActionResult> GetFundingPeriods()
        {
            ApiResponse<IEnumerable<FundingPeriod>> response = await _policiesApiClient.GetFundingPeriods();

            if (response.StatusCode == HttpStatusCode.OK)
            {
                return Ok(response.Content);
            }

            throw new InvalidOperationException($"An error occurred while retrieving code context. Status code={response.StatusCode}");
        }

        [Route("api/policy/fundingstreams")]
        public async Task<IActionResult> GetFundingStreams()
        {
            ApiResponse<IEnumerable<FundingStream>> response = await _policiesApiClient.GetFundingStreams();

            if (response.StatusCode == HttpStatusCode.OK)
            {
                return Ok(response.Content);
            }

            throw new InvalidOperationException($"An error occurred while retrieving code context. Status code={response.StatusCode}");
        }

        [Route("api/policy/fundingperiods/{fundingStreamId}")]
        public async Task<IActionResult> GetFundingPeriods(string fundingStreamId)
        {
            Task<ApiResponse<IEnumerable<FundingConfiguration>>> fundingConfigsLookupTask = _policiesApiClient.GetFundingConfigurationsByFundingStreamId(fundingStreamId);

            Task<ApiResponse<IEnumerable<FundingPeriod>>> fundingPeriodsLookupTask = _policiesApiClient.GetFundingPeriods();

            await TaskHelper.WhenAllAndThrow(fundingConfigsLookupTask, fundingPeriodsLookupTask);

            IActionResult fundingConfigsLookupResult = fundingConfigsLookupTask.Result.IsSuccessOrReturnFailureResult(nameof(FundingConfiguration));

            IActionResult fundingPeriodsLookupResult = fundingPeriodsLookupTask.Result.IsSuccessOrReturnFailureResult(nameof(FundingPeriod));

            if (fundingConfigsLookupResult != null || fundingPeriodsLookupResult != null)
            {
                throw new InvalidOperationException($"An error occurred while retrieving funding periods");
            }

            IEnumerable<Reference> fundingPeriods = fundingConfigsLookupTask.Result.Content.Select(fc =>
                fundingPeriodsLookupTask.Result.Content.FirstOrDefault(m => string.Equals(m.Id, fc.FundingPeriodId, StringComparison.InvariantCultureIgnoreCase)));

            return new OkObjectResult(fundingPeriods);
        }
    }
}
