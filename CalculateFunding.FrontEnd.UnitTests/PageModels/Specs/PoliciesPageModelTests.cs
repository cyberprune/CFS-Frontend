﻿using CalculateFunding.Frontend.Clients.CommonModels;
using CalculateFunding.Frontend.Clients.SpecsClient.Models;
using CalculateFunding.Frontend.Interfaces.ApiClient;
using CalculateFunding.Frontend.Pages.Specs;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using NSubstitute;
using System.Net;
using System.Threading.Tasks;
using Serilog;
using CalculateFunding.Frontend.Clients.DatasetsClient.Models;
using System.Linq;
using System.Collections.Generic;
using CalculateFunding.Frontend.Helpers;
using CalculateFunding.Frontend.ViewModels.Specs;
using CalculateFunding.Frontend.ViewModels.Common;

namespace CalculateFunding.Frontend.PageModels.Specs
{
    [TestClass]
    public class PoliciesPageModelTests
    {
        [TestMethod]
        public async Task PoliciesPageModel_OnGet_WhenPoliciesAreRequestedForASpecification_ThenResultIsReturned()
        {
            // Arrange
            ISpecsApiClient specsApiClient = CreateSpecsApiClient();
            IDatasetsApiClient datasetsApiClient = CreateDatasetsApiClient();

            PoliciesModel policiesModel = GetPoliciesModel(specsApiClient, datasetsApiClient);

            string specificationId = "spec123";

            Specification specification = new Specification()
            {
                Id = specificationId,
                Name = "Test Specification",
                AcademicYear = new Reference("1617", "2016/2017"),
                Description = "Test Description",
                FundingStream = new Reference("fs1", "Funding Stream Name"),
                Policies = new List<Policy>()
                {
                    new Policy()
                    {
                        Id = "pol1",
                        Name = "Policy 1",
                        Description = "Policy 1 Description",
                        Calculations = new List<Calculation>()
                        {
                            new Calculation()
                            {
                                Id ="calc1",
                                Name = "Calculation 1",
                                Description = "Calculation with allocation line",
                                AllocationLine = new Reference("al1", "Allocation Line 1"),
                            },
                            new Calculation()
                            {
                                Id ="calc2",
                                Name = "Calculation Two",
                                Description = "Calculation without allocation line",
                                AllocationLine = null
                            },
                        },
                        SubPolicies = new List<Policy>(),
                    },
                }
            };

            specsApiClient.GetSpecification(Arg.Any<string>())
                .Returns(new ApiResponse<Specification>(HttpStatusCode.OK, specification));

            datasetsApiClient
               .GetAssignedDatasetSchemasForSpecification(specificationId)
               .Returns(new ApiResponse<IEnumerable<DatasetSchemasAssigned>>(HttpStatusCode.OK, Enumerable.Empty<DatasetSchemasAssigned>()));

            // Act
            IActionResult result = await policiesModel.OnGet(specificationId);

            // Assert
            result.Should().BeOfType<PageResult>();

            SpecificationViewModel expectedResult = new SpecificationViewModel()
            {
                Id = specificationId,
                Name = "Test Specification",
                AcademicYear = new ReferenceViewModel("1617", "2016/2017"),
                Description = "Test Description",
                FundingStream = new ReferenceViewModel("fs1", "Funding Stream Name"),
                Policies = new List<PolicyViewModel>()
                {
                    new PolicyViewModel()
                    {
                        Id = "pol1",
                        Name = "Policy 1",
                        Description = "Policy 1 Description",
                        Calculations = new List<CalculationViewModel>()
                        {
                            new CalculationViewModel()
                            {
                                Id ="calc1",
                                Name = "Calculation 1",
                                Description = "Calculation with allocation line",
                                AllocationLine = new ReferenceViewModel("al1", "Allocation Line 1"),
                            },
                            new CalculationViewModel()
                            {
                                Id ="calc2",
                                Name = "Calculation Two",
                                Description = "Calculation without allocation line",
                                AllocationLine = null
                            },
                        },
                        SubPolicies = new List<PolicyViewModel>(),
                    },
                }
            };

            policiesModel.Specification.Should().BeEquivalentTo(expectedResult, o => o.RespectingRuntimeTypes().WithAutoConversion().WithTracing());
        }

        [TestMethod]
        public async Task PoliciesPageModel_OnGet_WhenSpecificationNotFound_ThenNotFoundReturned()
        {
            // Arrange
            ISpecsApiClient specsApiClient = CreateSpecsApiClient();
            IDatasetsApiClient datasetsApiClient = CreateDatasetsApiClient();

            PoliciesModel policiesModel = GetPoliciesModel(specsApiClient, datasetsApiClient);

            string specificationId = "spec123";

            specsApiClient.GetSpecification(Arg.Any<string>())
                .Returns(new ApiResponse<Specification>(HttpStatusCode.NotFound, null));

            datasetsApiClient
                .GetAssignedDatasetSchemasForSpecification(specificationId)
                .Returns(new ApiResponse<IEnumerable<DatasetSchemasAssigned>>(HttpStatusCode.OK, Enumerable.Empty<DatasetSchemasAssigned>()));

            // Act
            IActionResult result = await policiesModel.OnGet(specificationId);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>()
                .Which.Value.Should().Be("Specification not found");
        }

        [TestMethod]
        public async Task PoliciesPageModel_OnGet_WhenDatasetsApiFailed_ThenErrorShouldBeReturned()
        {
            // Arrange
            ISpecsApiClient specsApiClient = CreateSpecsApiClient();
            IDatasetsApiClient datasetsApiClient = CreateDatasetsApiClient();

            PoliciesModel policiesModel = GetPoliciesModel(specsApiClient, datasetsApiClient);

            string specificationId = "spec123";

            specsApiClient.GetSpecification(Arg.Any<string>())
                .Returns(new ApiResponse<Specification>(HttpStatusCode.OK, new Specification()));

            datasetsApiClient
                .GetAssignedDatasetSchemasForSpecification(specificationId)
                .Returns(new ApiResponse<IEnumerable<DatasetSchemasAssigned>>(HttpStatusCode.NotFound, null));

            // Act
            IActionResult result = await policiesModel.OnGet(specificationId);

            // Assert
            result.Should().BeOfType<ObjectResult>()
                .Which.Value.Should().Be("Datasets Schema API Failed");

            result.Should().BeOfType<ObjectResult>()
                .Which.StatusCode.Should().Be(500);
        }

        [TestMethod]
        public async Task PoliciesPageModel_OnGet_WhenSpecificationsApiFailed_ThenErrorShouldBeReturned()
        {
            // Arrange
            ISpecsApiClient specsApiClient = CreateSpecsApiClient();
            IDatasetsApiClient datasetsApiClient = CreateDatasetsApiClient();

            PoliciesModel policiesModel = GetPoliciesModel(specsApiClient, datasetsApiClient);

            string specificationId = "spec123";

            specsApiClient.GetSpecification(Arg.Any<string>())
                .Returns(new ApiResponse<Specification>(HttpStatusCode.InternalServerError, null));

            datasetsApiClient
                .GetAssignedDatasetSchemasForSpecification(specificationId)
                .Returns(new ApiResponse<IEnumerable<DatasetSchemasAssigned>>(HttpStatusCode.OK, Enumerable.Empty<DatasetSchemasAssigned>()));

            // Act
            IActionResult result = await policiesModel.OnGet(specificationId);

            // Assert
            result.Should().BeOfType<ObjectResult>()
                .Which.Value.Should().Be("Specification Lookup API Failed");

            result.Should().BeOfType<ObjectResult>()
                .Which.StatusCode.Should().Be(500);
        }

        [TestMethod]
        public async Task PoliciesPageModel_OnGet_WhenSpecificationsApiFailedReturningNull_ThenErrorShouldBeReturned()
        {
            // Arrange
            ISpecsApiClient specsApiClient = CreateSpecsApiClient();
            IDatasetsApiClient datasetsApiClient = CreateDatasetsApiClient();
            ILogger logger = CreateLogger();

            PoliciesModel policiesModel = GetPoliciesModel(specsApiClient, datasetsApiClient, logger);

            string specificationId = "spec123";

            specsApiClient.GetSpecification(Arg.Any<string>())
                .Returns((ApiResponse<Specification>)null);

            datasetsApiClient
                .GetAssignedDatasetSchemasForSpecification(specificationId)
                .Returns(new ApiResponse<IEnumerable<DatasetSchemasAssigned>>(HttpStatusCode.OK, Enumerable.Empty<DatasetSchemasAssigned>()));

            // Act
            IActionResult result = await policiesModel.OnGet(specificationId);

            // Assert
            result.Should().BeOfType<ObjectResult>()
                .Which.Value.Should().Be("Specification Lookup API Failed and returned null");

            result.Should().BeOfType<ObjectResult>()
                .Which.StatusCode.Should().Be(500);

            logger
                .Received(1)
                .Warning("Specification API Request came back null for Specification ID = '{specificationId}'", specificationId);
        }

        [TestMethod]
        public async Task PoliciesPageModel_OnGet_WhenDatasetsApiFailedReturningNull_ThenErrorShouldBeReturned()
        {
            // Arrange
            ISpecsApiClient specsApiClient = CreateSpecsApiClient();
            IDatasetsApiClient datasetsApiClient = CreateDatasetsApiClient();
            ILogger logger = CreateLogger();

            PoliciesModel policiesModel = GetPoliciesModel(specsApiClient, datasetsApiClient, logger);

            string specificationId = "spec123";

            specsApiClient.GetSpecification(Arg.Any<string>())
                .Returns(new ApiResponse<Specification>(HttpStatusCode.OK, new Specification()));

            datasetsApiClient
                .GetAssignedDatasetSchemasForSpecification(specificationId)
                .Returns((ApiResponse<IEnumerable<DatasetSchemasAssigned>>)null);

            // Act
            IActionResult result = await policiesModel.OnGet(specificationId);

            // Assert
            result.Should().BeOfType<ObjectResult>()
                .Which.Value.Should().Be("Datasets Lookup API Failed and returned null");

            result.Should().BeOfType<ObjectResult>()
                .Which.StatusCode.Should().Be(500);

            logger
                .Received(1)
                .Warning("Dataset Schema Response API Request came back null for Specification ID = '{specificationId}'", specificationId);
        }

        private PoliciesModel GetPoliciesModel(
            ISpecsApiClient specsApiClient = null,
            IDatasetsApiClient datasetsApiClient = null,
            ILogger logger = null
            )
        {
            return new PoliciesModel(
                specsApiClient ?? CreateSpecsApiClient(),
                datasetsApiClient ?? CreateDatasetsApiClient(),
                logger ?? CreateLogger(),
                MappingHelper.CreateFrontEndMapper()
                );
        }

        private static ISpecsApiClient CreateSpecsApiClient()
        {
            return Substitute.For<ISpecsApiClient>();
        }

        private static IDatasetsApiClient CreateDatasetsApiClient()
        {
            return Substitute.For<IDatasetsApiClient>();
        }

        private static ILogger CreateLogger()
        {
            return Substitute.For<ILogger>();
        }
    }
}
