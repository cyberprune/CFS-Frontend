﻿using AutoMapper;
using CalculateFunding.Common.ApiClient.Calcs;
using CalculateFunding.Common.ApiClient.Calcs.Models;
using CalculateFunding.Common.ApiClient.Models;
using CalculateFunding.Common.Identity.Authorization.Models;
using CalculateFunding.Common.Utility;
using CalculateFunding.Frontend.Helpers;
using CalculateFunding.Frontend.ViewModels.Calculations;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using CalculateFunding.Frontend.Extensions;
using CalculateFunding.Common.ApiClient.Users.Models;

namespace CalculateFunding.Frontend.Controllers
{
    public class CalculationController : Controller
    {
        private ICalculationsApiClient _calcClient;
        private IMapper _mapper;
        private readonly IAuthorizationHelper _authorizationHelper;

        public CalculationController(ICalculationsApiClient calcClient, IMapper mapper, IAuthorizationHelper authorizationHelper)
        {
            Guard.ArgumentNotNull(calcClient, nameof(calcClient));
            Guard.ArgumentNotNull(mapper, nameof(mapper));
            Guard.ArgumentNotNull(authorizationHelper, nameof(authorizationHelper));

            _calcClient = calcClient;
            _mapper = mapper;
            _authorizationHelper = authorizationHelper;
        }

        [HttpPost]
        [Route("api/specs/{specificationId}/calculations/{calculationId}")]
        public async Task<IActionResult> SaveCalculation(string specificationId, string calculationId, [FromBody] CalculationUpdateViewModel vm)
        {
            Guard.ArgumentNotNull(specificationId, nameof(specificationId));
            Guard.ArgumentNotNull(calculationId, nameof(calculationId));
            Guard.ArgumentNotNull(vm, nameof(vm));

            if (!await _authorizationHelper.DoesUserHavePermission(User, specificationId, SpecificationActionTypes.CanEditCalculations))
            {
                return new ForbidResult();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            ApiResponse<Calculation> existingCalculationResponse = await _calcClient.GetCalculationById(calculationId);
            IActionResult errorResult = existingCalculationResponse.IsSuccessOrReturnFailureResult("Calculation");
            if (errorResult != null)
            {
                return errorResult;
            }
            Calculation existingCalculation = existingCalculationResponse.Content;

            CalculationEditModel update = new CalculationEditModel()
            {
                CalculationId = calculationId,
                Description = existingCalculation.Description,
                Name = existingCalculation.Name,
                SpecificationId = specificationId,
                ValueType = existingCalculation.ValueType,
                SourceCode = vm.SourceCode,
            };

            ValidatedApiResponse<Calculation> response = await _calcClient.EditCalculation(specificationId, calculationId, update);

            if (response.StatusCode == HttpStatusCode.OK)
            {
                return Ok(response.Content);
            }
            else
            {
                throw new InvalidOperationException($"An error occurred while saving calculation. Status code={response.StatusCode}");
            }
        }

        [Route("api/specs/{specificationId}/calculations/{calculationId}/compilePreview")]
        [HttpPost]
        public async Task<IActionResult> CompilePreview([FromRoute]string specificationId, [FromRoute] string calculationId, [FromBody]PreviewCompileRequestViewModel vm)
        {
            if (!ModelState.IsValid)
            {
				PreviewResponse errorResponse = new PreviewResponse();

				foreach (var modelStateValue in ModelState.Values)
				{
					errorResponse.CompilerOutput = new Build
					{
						CompilerMessages = new List<CompilerMessage>
						{
							new CompilerMessage {Message = modelStateValue.Errors[0].ErrorMessage}
						}
					};
				}

                return BadRequest(errorResponse);
            }

            PreviewRequest request = _mapper.Map<PreviewRequest>(vm);
            request.CalculationId = calculationId;
            request.SpecificationId = specificationId;

            ApiResponse<PreviewResponse> response = await _calcClient.PreviewCompile(request);

            if (response.StatusCode == HttpStatusCode.OK)
            {
                return Ok(response.Content);
            }

            if (response.StatusCode == HttpStatusCode.BadRequest)
            {
                return Ok(response.Content);
            }

            throw new InvalidOperationException($"An error occurred while compiling calculation. Status code={response.StatusCode}");
        }

        [Route("api/specs/{specificationId}/codeContext")]
        [HttpGet]
        public async Task<IActionResult> GetCodeContext(string specificationId)
        {
            Guard.IsNullOrWhiteSpace(specificationId, nameof(specificationId));

            ApiResponse<IEnumerable<Common.ApiClient.Calcs.Models.Code.TypeInformation>> response = await _calcClient.GetCodeContextForSpecification(specificationId);
            if (response.StatusCode == HttpStatusCode.OK)
            {
                return Ok(response.Content);
            }
            else
            {
                throw new InvalidOperationException($"An error occurred while retrieving code context. Status code={response.StatusCode}");
            }
        }

        [Route("api/specs/{specificationId}/calculations/{calculationId}/status")]
        [HttpPut]
        public async Task<IActionResult> EditCalculationStatus([FromRoute]string specificationId, [FromRoute]string calculationId, [FromBody]PublishStatusEditModel publishStatusEditModel)
        {
            Guard.IsNullOrWhiteSpace(calculationId, nameof(calculationId));
            Guard.ArgumentNotNull(publishStatusEditModel, nameof(publishStatusEditModel));

            if (!await _authorizationHelper.DoesUserHavePermission(User, specificationId, SpecificationActionTypes.CanEditCalculations))
            {
                return new ForbidResult();
            }

            if(publishStatusEditModel.PublishStatus == PublishStatus.Approved)
            {
                var (canApprove, _) = await CanUserAllowedToApproveCalculation(calculationId);
                if (!canApprove)
                {
                    return new ForbidResult();
                }
            }

            ValidatedApiResponse<PublishStatusResult> response = await _calcClient.UpdatePublishStatus(calculationId, publishStatusEditModel);

            if (response.StatusCode == HttpStatusCode.OK)
            {
                return Ok(response.Content);
            }
            else
            {
                throw new InvalidOperationException($"An error occurred while retrieving code context. Status code={response.StatusCode}");
            }
        }

        [Route("api/calcs/{calculationId}/approvepermission")]
        [HttpGet]
        public async Task<IActionResult> GetIsUserAllowedToApproveCalculation([FromRoute]string calculationId)
        {
            Guard.IsNullOrWhiteSpace(calculationId, nameof(calculationId));

            var (canApprove, content) = await CanUserAllowedToApproveCalculation(calculationId);
            return canApprove ? Ok(true) : (IActionResult)BadRequest(content);
        }

        [HttpPost]
        [Route("api/specs/{specificationId}/calculations/createadditionalcalculation")]
        public async Task<IActionResult> CreateCalculation(string specificationId, string calculationId, [FromBody] CreateAdditionalCalculationViewModel vm)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!await _authorizationHelper.DoesUserHavePermission(User, specificationId, SpecificationActionTypes.CanEditCalculations))
            {
                return new ForbidResult();
            }

            CalculationCreateModel createCalculation = _mapper.Map<CalculationCreateModel>(vm);

            createCalculation.SpecificationId = specificationId;
            createCalculation.Id = calculationId;
            createCalculation.Name = vm.CalculationName;
            createCalculation.ValueType = vm.CalculationType;

            ValidatedApiResponse<Calculation> response = await _calcClient.CreateCalculation(specificationId, createCalculation);

            if (response.StatusCode == HttpStatusCode.OK)
            {
                return Ok(response.Content);
            }

            return BadRequest($"An error occurred while saving calculation. Please check and try again.");
        }

        [HttpPost]
        [Route("api/calcs/status-counts")]
        public async Task<IActionResult> GetCalculationStatusCounts([FromBody] SpecificationIdsRequestModel specificationIds)
        {
            Guard.ArgumentNotNull(specificationIds, nameof(specificationIds));

            ApiResponse<IEnumerable<CalculationStatusCounts>> response = await _calcClient.GetCalculationStatusCounts(specificationIds);

            if (response.StatusCode == HttpStatusCode.OK)
            {
                return Ok(response.Content);
            }
            else
            {
                throw new InvalidOperationException($"An error occurred while retrieving code context. Status code={response.StatusCode}");
            }
        }

        [HttpPost]
        [Route("api/specs/{specificationId}/calculations/{calculationId}/editadditionalcalculation")]
        public async Task<IActionResult> EditAdditionalCalculation(string specificationId, string calculationId, [FromBody] EditAdditionalCalculationViewModel vm)
        {
            Guard.ArgumentNotNull(specificationId, nameof(specificationId));
            Guard.ArgumentNotNull(vm, nameof(vm));

            if (!await _authorizationHelper.DoesUserHavePermission(User, specificationId, SpecificationActionTypes.CanEditCalculations))
            {
                return new ForbidResult();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            CalculationEditModel editCalculation = _mapper.Map<CalculationEditModel>(vm);

            editCalculation.SpecificationId = specificationId;
            editCalculation.CalculationId = calculationId;
            editCalculation.Name = vm.CalculationName;
            editCalculation.ValueType = vm.CalculationType;

            ValidatedApiResponse<Calculation> response = await _calcClient.EditCalculation(specificationId, calculationId, editCalculation);

            if (response.StatusCode == HttpStatusCode.OK)
            {
                return Ok(response.Content);
            }
            else
            {
                throw new InvalidOperationException($"An error occurred while saving calculation. Status code={response.StatusCode}");
            }
        }

        [HttpGet]
        [Route("api/calcs/getcalculationbyid/{calculationId}")]
        public async Task<IActionResult> GetCalculationById(string calculationId)
        {
            Guard.ArgumentNotNull(calculationId, nameof(calculationId));

            ApiResponse<Calculation> result = await _calcClient.GetCalculationById(calculationId);

            if (result.StatusCode == HttpStatusCode.OK)
            {
                return Ok(result.Content);
            }

            return BadRequest(result.Content);
        }

        [HttpGet]
        [Route("api/calcs/getcalculations/{specificationId}/{calculationType}/{pageNumber}")]
        public async Task<IActionResult> GetCalculationsForSpecification(string specificationId, 
	        CalculationType calculationType, int pageNumber, [FromQuery]string searchTerm, [FromQuery]string status)
        {
            Guard.ArgumentNotNull(specificationId, nameof(specificationId));

            PublishStatus? publishStatus = null;

            if (!string.IsNullOrEmpty(status) && status != "All")
            {
                publishStatus = (PublishStatus)Enum.Parse(typeof(PublishStatus), status);

            }

            ApiResponse<SearchResults<CalculationSearchResult>> result =
                await _calcClient.SearchCalculationsForSpecification(specificationId, 
	                calculationType, publishStatus, searchTerm, pageNumber);


            if (result.StatusCode == HttpStatusCode.OK)
            {
                return Ok(result.Content);
            }

            return BadRequest(result.Content);
        }

        [HttpGet]
        [Route("api/calcs/getcalculationversionhistory/{calculationId}")]
        public async Task<IActionResult> GetCalculationVersionHistory(string calculationId)
        {
            Guard.IsNullOrWhiteSpace(calculationId, nameof(calculationId));

            var response = await _calcClient.GetAllVersionsByCalculationId(calculationId);

            if (response.StatusCode == HttpStatusCode.OK)
            {
                return new OkObjectResult(response.Content);
            }

            return new BadRequestObjectResult(response.Content);
        }

        private async Task<(bool, object)> CanUserAllowedToApproveCalculation(string calculationId)
        {
            ApiResponse<Calculation> calculationResult = await _calcClient.GetCalculationById(calculationId);

            if (calculationResult.StatusCode == HttpStatusCode.OK)
            {
                FundingStreamPermission permissions = await _authorizationHelper.GetUserFundingStreamPermissions(User, calculationResult.Content.FundingStreamId);

                return (permissions.CanApproveAnyCalculations || (permissions.CanApproveCalculations && User.GetUserProfile()?.Id != calculationResult.Content.Author.Id), null);
               
            }

            return (false, calculationResult.Content);
        }
    }
}