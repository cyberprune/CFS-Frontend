﻿namespace CalculateFunding.Frontend.Pages.Specs
{
    using System.Net;
    using System.Threading.Tasks;
    using AutoMapper;
    using CalculateFunding.Frontend.Clients.CommonModels;
    using CalculateFunding.Frontend.Clients.SpecsClient.Models;
    using CalculateFunding.Frontend.Helpers;
    using CalculateFunding.Frontend.Interfaces.ApiClient;
    using CalculateFunding.Frontend.Properties;
    using CalculateFunding.Frontend.ViewModels.Specs;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.AspNetCore.Mvc.RazorPages;

    public class CreatePolicyPageModel : PageModel
    {
        private readonly ISpecsApiClient _specsClient;
        private readonly IMapper _mapper;

        public CreatePolicyPageModel(ISpecsApiClient specsClient, IMapper mapper)
        {
            _specsClient = specsClient;
            _mapper = mapper;
        }

        [BindProperty]
        public CreatePolicyViewModel CreatePolicyViewModel { get; set; }

        public string SpecificationId { get; set; }

        public string SpecificationName { get; set; }

        public string FundingPeriodId { get; set; }

        public string FundingPeriodName { get; set; }

        public async Task<IActionResult> OnGetAsync(string specificationId)
        {
            Guard.IsNullOrWhiteSpace(specificationId, nameof(specificationId));

            SpecificationId = specificationId;

            ApiResponse<Specification> specificationResponse = await _specsClient.GetSpecification(specificationId);

            Specification specification = await GetSpecification(specificationId);

            SpecificationName = specification.Name;

            FundingPeriodName = specification.FundingPeriod.Name;

            FundingPeriodId = specification.FundingPeriod.Id;

            return Page();
        }

        public async Task<IActionResult> OnPostAsync(string specificationId)
        {
            Guard.IsNullOrWhiteSpace(specificationId, nameof(specificationId));

            if (!string.IsNullOrWhiteSpace(CreatePolicyViewModel.Name))
            {
                ApiResponse<Policy> existingPolicyResponse = await _specsClient.GetPolicyBySpecificationIdAndPolicyName(specificationId, CreatePolicyViewModel.Name);

                if (existingPolicyResponse.StatusCode != HttpStatusCode.NotFound)
                {
                    this.ModelState.AddModelError($"{nameof(CreatePolicyViewModel)}.{nameof(CreatePolicyViewModel.Name)}", ValidationMessages.PolicyNameAlreadyExists);
                }
            }

            if (!ModelState.IsValid)
            {
                Specification specification = await GetSpecification(specificationId);

                SpecificationName = specification.Name;

                SpecificationId = specificationId;

                FundingPeriodName = specification.FundingPeriod.Name;

                FundingPeriodId = specification.FundingPeriod.Id;

                return Page();
            }

            CreatePolicyModel policy = _mapper.Map<CreatePolicyModel>(CreatePolicyViewModel);

            policy.SpecificationId = specificationId;

            ApiResponse<Policy> newPolicyResponse = await _specsClient.CreatePolicy(policy);

            Policy newPolicy = newPolicyResponse.Content;

            return Redirect($"/specs/policies/{specificationId}#policy-{newPolicy.Id}");
        }

        private async Task<Specification> GetSpecification(string specificationId)
        {
            Guard.IsNullOrWhiteSpace(specificationId, nameof(specificationId));

            ApiResponse<Specification> specificationResponse = await _specsClient.GetSpecification(specificationId);

            if (specificationResponse != null && specificationResponse.StatusCode == HttpStatusCode.OK)
            {
                return specificationResponse.Content;
            }

            return null;
        }
    }
}