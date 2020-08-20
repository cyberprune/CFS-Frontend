﻿using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using CalculateFunding.Common.ApiClient.Calcs;
using CalculateFunding.Common.ApiClient.Calcs.Models;
using CalculateFunding.Common.ApiClient.Models;
using CalculateFunding.Common.ApiClient.Policies;
using CalculateFunding.Common.ApiClient.Results;
using CalculateFunding.Common.ApiClient.Specifications;
using CalculateFunding.Common.ApiClient.Specifications.Models;
using CalculateFunding.Common.TemplateMetadata.Models;
using CalculateFunding.Frontend.Controllers;
using CalculateFunding.Frontend.Extensions;
using CalculateFunding.Frontend.Modules;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using NSubstitute;
using Calculation = CalculateFunding.Common.TemplateMetadata.Models.Calculation;

namespace CalculateFunding.Frontend.UnitTests.Controllers
{
    [TestClass]
    public class FundingLineStructureControllerTests
    {
        private const string FundingStreamId = "DSG";
        private const string FundingPeriodId = "AY-2021";
        private const string TemplateVersion = "1.0";
        private const string SpecificationId = "680898bd-9ddc-4d11-9913-2a2aa34f213c";
        private const string CalculationId = "aValidCalculationId";
		private const PublishStatus CalculationExpectedPublishStatus = PublishStatus.Approved;

        private readonly ISpecificationsApiClient _specificationsApiClient = Substitute.For<ISpecificationsApiClient>();
        private readonly IPoliciesApiClient _policiesApiClient = Substitute.For<IPoliciesApiClient>();
        private readonly ICalculationsApiClient _calculationsApiClient = Substitute.For<ICalculationsApiClient>();
        private readonly IResultsApiClient _resultsApiClient = Substitute.For<IResultsApiClient>();
        private FundingLineStructureController _controller;

        [TestInitialize]
        public void SetUp()
        {
            _controller = new FundingLineStructureController(
                            _policiesApiClient, _specificationsApiClient, _calculationsApiClient, _resultsApiClient);   
        }

        [TestMethod]
        public async Task GetFundingStructures_ReturnsFlatStructureWithCorrectLevelsAndInCorrectOrder()
        {
            ValidScenarioSetup(FundingStreamId);

            IActionResult apiResponseResult = await _controller.GetFundingStructures(FundingStreamId, FundingPeriodId, SpecificationId);

            List<FundingStructureItem> expectedFundingStructureItems = GetValidMappedFundingStructureItems();
            apiResponseResult.Should().BeOfType<OkObjectResult>();
            OkObjectResult typedResult = apiResponseResult as OkObjectResult;
            List<FundingStructureItem> fundingStructureItems = typedResult?.Value as List<FundingStructureItem>;
            fundingStructureItems?.Count.Should().Be(3);
            fundingStructureItems.Should().BeEquivalentTo(expectedFundingStructureItems);
        }
        
        [TestMethod]
        public async Task GetFundingStructures_Returns304IfNoChangeForETag()
        {
            string etag = Guid.NewGuid().ToString();
            
            ValidScenarioSetup(FundingStreamId, HttpStatusCode.NotModified, etag);

            IActionResult apiResponseResult = await _controller.GetFundingStructures(FundingStreamId, FundingPeriodId, SpecificationId);

            apiResponseResult
                .Should()
                .BeOfType<StatusCodeResult>()
                .Which
                .StatusCode
                .Should()
                .Be((int) HttpStatusCode.NotModified);
        }

        [TestMethod]
        public async Task GetFundingStructures_ThrowsInternalErrorIfTemplateIdNotSet()
        {
            ValidScenarioSetup(FundingStreamId.ToLowerInvariant());

            IActionResult apiResponseResult = await _controller.GetFundingStructures(FundingStreamId, FundingPeriodId, SpecificationId);

            apiResponseResult.Should().BeOfType<InternalServerErrorResult>();
        }

        private void ValidScenarioSetup(string fundingStreamId, HttpStatusCode metaDaStatusCode = HttpStatusCode.OK, string etag = null)
        {
            if (etag != null)
            {
                _controller.ControllerContext = new ControllerContext()
                {
                    HttpContext = new DefaultHttpContext
                    {
                        Request =
                        {
                            Headers = { {"If-None-Match", etag } }
                        }
                    }
                };    
            }
            
            SpecificationSummary specificationSummary = new SpecificationSummary
            {
                Id = SpecificationId,
                TemplateIds = new Dictionary<string, string>
                {
                    [fundingStreamId] = TemplateVersion
                }
            };


            TemplateMetadataContents templateMetadataContents = new TemplateMetadataContents
            {
                RootFundingLines = new List<FundingLine>
                {
                    new FundingLine
                    {
	                    Name = "FundingLine-1"
                    },
                    new FundingLine
                    {
                        Name = "FundingLine-2-withFundingLines",
                        FundingLines = new List<FundingLine>
                        {
                            new FundingLine {Name = "FundingLine-2-fl-1"},
                            new FundingLine
                            {
                                Name = "FundingLine-2-fl-2",
                                FundingLines = new List<FundingLine>
                                {
                                    new FundingLine {Name = "FundingLine-2-fl-2-fl-1"}
                                }
                            }
                        }
                    },
                    new FundingLine
                    {
                        Name = "FundingLine-3-withCalculationsAndFundingLines",
                        FundingLines = new List<FundingLine>
                        {
                            new FundingLine {Name = "FundingLine-3-fl-1"}
                        },
                        Calculations = new List<Calculation>
                        {
                            new Calculation {Name = "FundingLine-3-calc-1", TemplateCalculationId = 1},
                            new Calculation
                            {
                                Name = "FundingLine-3-calc-2",
                                TemplateCalculationId = 1,
                                Calculations = new List<Calculation>
                                {
                                    new Calculation {Name = "FundingLine-3-calc-2-calc-1", TemplateCalculationId = 2}
                                }
                            }
                        }
                    }
                }
            };

            _specificationsApiClient.GetSpecificationSummaryById(SpecificationId)
                .Returns(new ApiResponse<SpecificationSummary>(HttpStatusCode.OK, specificationSummary));

            _policiesApiClient.GetFundingTemplateContents(FundingStreamId, FundingPeriodId, TemplateVersion, etag)
                .Returns(new ApiResponse<TemplateMetadataContents>(metaDaStatusCode, templateMetadataContents));

            _calculationsApiClient.GetTemplateMapping(SpecificationId, FundingStreamId)
                .Returns(new ApiResponse<TemplateMapping>(HttpStatusCode.OK, new TemplateMapping
                {
                    FundingStreamId = FundingStreamId,
                    SpecificationId = SpecificationId,
                    TemplateMappingItems = new List<TemplateMappingItem>
                    {
                        new TemplateMappingItem
                        {
                            TemplateId = 1,
                            CalculationId = CalculationId
                        },
                        new TemplateMappingItem
                        {
                            TemplateId = 2,
                            CalculationId = "CalculationIdForTemplateCalculationId2",
                        }
                    }
                }));

            _calculationsApiClient.GetCalculationMetadataForSpecification(SpecificationId)
	            .Returns(new ApiResponse<IEnumerable<CalculationMetadata>>(HttpStatusCode.OK,
		            new List<CalculationMetadata>
		            {
			            new CalculationMetadata
			            {
				            SpecificationId = SpecificationId,
				            CalculationId = CalculationId,
				            PublishStatus = CalculationExpectedPublishStatus
			            }
		            }));
        }

        private static List<FundingStructureItem> GetValidMappedFundingStructureItems()
        {
	        List<FundingStructureItem> result = new List<FundingStructureItem>
	        {
		        new FundingStructureItem(1, "FundingLine-1", null, null, FundingStructureType.FundingLine, null, null, null),
		        new FundingStructureItem(1, "FundingLine-2-withFundingLines", null, null, FundingStructureType.FundingLine,
                    null,
			        new List<FundingStructureItem>
			        {
				        new FundingStructureItem(2, "FundingLine-2-fl-1", null, null, FundingStructureType.FundingLine),
				        new FundingStructureItem(2, "FundingLine-2-fl-2", null, null, FundingStructureType.FundingLine,
                            null,
					        new List<FundingStructureItem>
					        {
						        new FundingStructureItem(3, "FundingLine-2-fl-2-fl-1", null, null,
							        FundingStructureType.FundingLine)
					        })
			        }),
		        new FundingStructureItem(1, "FundingLine-3-withCalculationsAndFundingLines", null, null,
			        FundingStructureType.FundingLine,
                    null,
			        new List<FundingStructureItem>
			        {
				        new FundingStructureItem(
					        2, 
					        "FundingLine-3-calc-1", 
					        CalculationId,
							CalculationExpectedPublishStatus.ToString(),
					        FundingStructureType.Calculation),
				        new FundingStructureItem(
					        2, 
					        "FundingLine-3-calc-2", 
					        CalculationId,
							CalculationExpectedPublishStatus.ToString(),
					        FundingStructureType.Calculation,
                            null,
						        new List<FundingStructureItem>
						        {
							        new FundingStructureItem(
								        3, 
								        "FundingLine-3-calc-2-calc-1",
								        "CalculationIdForTemplateCalculationId2", 
										null,
								        FundingStructureType.Calculation)
						        }),
				        new FundingStructureItem(
					        2, 
					        "FundingLine-3-fl-1",
					        null, 
							null,
					        FundingStructureType.FundingLine)
			        })
	        };

            return result;
        }
    }
}
