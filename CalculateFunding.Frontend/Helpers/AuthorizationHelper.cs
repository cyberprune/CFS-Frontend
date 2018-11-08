﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using CalculateFunding.Common.Identity.Authorization;
using CalculateFunding.Common.Identity.Authorization.Models;
using CalculateFunding.Common.Utility;
using CalculateFunding.Frontend.Clients.CommonModels;
using CalculateFunding.Frontend.Clients.SpecsClient.Models;
using CalculateFunding.Frontend.Interfaces.ApiClient;
using Microsoft.AspNetCore.Authorization;
using Serilog;

namespace CalculateFunding.Frontend.Helpers
{
    public class AuthorizationHelper : IAuthorizationHelper
    {
        private readonly IAuthorizationService _authorizationService;
        private readonly IUsersApiClient _usersClient;
        private readonly ILogger _logger;

        public AuthorizationHelper(IAuthorizationService authorizationService, IUsersApiClient usersClient, ILogger logger)
        {
            Guard.ArgumentNotNull(authorizationService, nameof(authorizationService));
            Guard.ArgumentNotNull(usersClient, nameof(usersClient));
            Guard.ArgumentNotNull(logger, nameof(logger));

            _authorizationService = authorizationService;
            _usersClient = usersClient;
            _logger = logger;
        }

        public async Task<bool> DoesUserHavePermission(ClaimsPrincipal user, ISpecificationAuthorizationEntity specification, SpecificationActionTypes permissionRequired)
        {
            AuthorizationResult authorizationResult = await _authorizationService.AuthorizeAsync(user, specification, new SpecificationRequirement(permissionRequired));
            return authorizationResult.Succeeded;
        }

        public async Task<bool> DoesUserHavePermission(ClaimsPrincipal user, IEnumerable<string> fundingStreamIds, FundingStreamActionTypes permissionRequired)
        {
            Guard.ArgumentNotNull(user, nameof(user));
            Guard.ArgumentNotNull(fundingStreamIds, nameof(fundingStreamIds));

            string userId = VerifyObjectIdentifierClaimTypePresent(user);

            ApiResponse<IEnumerable<Clients.UsersClient.Models.FundingStreamPermission>> fundingStreamPermissionsResponse = await _usersClient.GetFundingStreamPermissionsForUser(userId);

            if (fundingStreamPermissionsResponse.StatusCode != HttpStatusCode.OK)
            {
                _logger.Error("Failed to get funding stream permissions for user ({user}) - {statuscode}", user.Identity.Name, fundingStreamPermissionsResponse.StatusCode);
                return false;
            }

            IEnumerable<Clients.UsersClient.Models.FundingStreamPermission> allowedFundingStreams = fundingStreamPermissionsResponse.Content;

            if (permissionRequired == FundingStreamActionTypes.CanCreateSpecification)
            {
                allowedFundingStreams = allowedFundingStreams.Where(p => p.CanCreateSpecification);
            }
            else if (permissionRequired == FundingStreamActionTypes.CanChooseFunding)
            {
                allowedFundingStreams = allowedFundingStreams.Where(p => p.CanChooseFunding);
            }

            IEnumerable<string> allowedFundingStreamIds = allowedFundingStreams.Select(p => p.FundingStreamId);

            return !fundingStreamIds.Except(allowedFundingStreamIds).Any();
        }

        public async Task<IEnumerable<FundingStream>> SecurityTrimList(ClaimsPrincipal user, IEnumerable<FundingStream> fundingStreams, FundingStreamActionTypes permissionRequired)
        {
            Guard.ArgumentNotNull(user, nameof(user));
            Guard.ArgumentNotNull(fundingStreams, nameof(fundingStreams));

            string userId = VerifyObjectIdentifierClaimTypePresent(user);

            ApiResponse<IEnumerable<Clients.UsersClient.Models.FundingStreamPermission>> fundingStreamPermissionsResponse = await _usersClient.GetFundingStreamPermissionsForUser(userId);

            if (fundingStreamPermissionsResponse.StatusCode != HttpStatusCode.OK)
            {
                _logger.Error("Failed to get funding stream permissions for user for security trimming ({user}) - {statuscode}", user.Identity.Name, fundingStreamPermissionsResponse.StatusCode);
                return Enumerable.Empty<FundingStream>();
            }

            IEnumerable<Clients.UsersClient.Models.FundingStreamPermission> allowedFundingStreams = fundingStreamPermissionsResponse.Content;

            if (permissionRequired == FundingStreamActionTypes.CanCreateSpecification)
            {
                allowedFundingStreams = allowedFundingStreams.Where(p => p.CanCreateSpecification);
            }
            else if (permissionRequired == FundingStreamActionTypes.CanChooseFunding)
            {
                allowedFundingStreams = allowedFundingStreams.Where(p => p.CanChooseFunding);
            }

            IEnumerable<string> allowedFundingStreamIds = allowedFundingStreams.Select(p => p.FundingStreamId);

            return fundingStreams.Where(fs => allowedFundingStreamIds.Contains(fs.Id));
        }

        public async Task<IEnumerable<SpecificationSummary>> SecurityTrimList(ClaimsPrincipal user, IEnumerable<SpecificationSummary> specifications, SpecificationActionTypes permissionRequired)
        {
            Guard.ArgumentNotNull(user, nameof(user));
            Guard.ArgumentNotNull(specifications, nameof(specifications));

            string userId = VerifyObjectIdentifierClaimTypePresent(user);

            ApiResponse<IEnumerable<Clients.UsersClient.Models.FundingStreamPermission>> fundingStreamPermissionsResponse = await _usersClient.GetFundingStreamPermissionsForUser(userId);

            if (fundingStreamPermissionsResponse.StatusCode != HttpStatusCode.OK)
            {
                _logger.Error("Failed to get funding stream permissions for user for security trimming ({user}) - {statuscode}", user.Identity.Name, fundingStreamPermissionsResponse.StatusCode);
                return Enumerable.Empty<SpecificationSummary>();
            }

            IEnumerable<Clients.UsersClient.Models.FundingStreamPermission> allowedFundingStreams = fundingStreamPermissionsResponse.Content;

            if (permissionRequired == SpecificationActionTypes.CanCreateQaTests)
            {
                allowedFundingStreams = allowedFundingStreams.Where(p => p.CanCreateQaTests);
            }
            else
            {
                throw new NotSupportedException($"Security trimming specifications by this permission ({permissionRequired} is not currently supported");
            }

            IEnumerable<string> allowedFundingStreamIds = allowedFundingStreams.Select(p => p.FundingStreamId);

            return specifications.Where(s => !s.FundingStreams.Select(fs => fs.Id).Except(allowedFundingStreamIds).Any());
        }

        public async Task<Clients.UsersClient.Models.FundingStreamPermission> GetEffectivePermissionsForUser(ClaimsPrincipal user, string specificationId)
        {
            Guard.ArgumentNotNull(user, nameof(user));
            Guard.IsNullOrWhiteSpace(specificationId, nameof(specificationId));

            string userId = VerifyObjectIdentifierClaimTypePresent(user);

            ApiResponse<Clients.UsersClient.Models.FundingStreamPermission> response = await _usersClient.GetEffectivePermissionsForUser(userId, specificationId);
            if (response.StatusCode != System.Net.HttpStatusCode.OK)
            {
                _logger.Error("Failed to get effective permissions for user ({user}) - {statuscode}", user.Identity.Name, response.StatusCode);

                return new Clients.UsersClient.Models.FundingStreamPermission
                {
                    CanAdministerFundingStream = false,
                    CanApproveFunding = false,
                    CanApproveSpecification = false,
                    CanChooseFunding = false,
                    CanCreateQaTests = false,
                    CanCreateSpecification = false,
                    CanEditCalculations = false,
                    CanEditQaTests = false,
                    CanEditSpecification = false,
                    CanMapDatasets = false,
                    CanPublishFunding = false,
                    CanRefreshFunding = false
                };
            }
            else
            {
                return response.Content;
            }
        }

        private static string VerifyObjectIdentifierClaimTypePresent(ClaimsPrincipal user)
        {
            if (!user.HasClaim(c => c.Type == Common.Identity.Authorization.Constants.ObjectIdentifierClaimType))
            {
                throw new Exception("Cannot security trim a list when cannot identify the user");
            }
            else
            {
                return user.FindFirst(Common.Identity.Authorization.Constants.ObjectIdentifierClaimType).Value;
            }
        }
    }
}
