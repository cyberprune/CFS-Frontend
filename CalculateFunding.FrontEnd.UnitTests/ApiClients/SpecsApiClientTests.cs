﻿using CalculateFunding.Frontend.ApiClient;
using CalculateFunding.Frontend.ApiClient.Models;
using CalculateFunding.Frontend.Interfaces.Core;
using CalculateFunding.Frontend.Interfaces.Core.Logging;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using NSubstitute;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace CalculateFunding.FrontEnd.ApiClients
{
    [TestClass]
    public class SpecsApiClientTests
    {
        [TestMethod]
        public void GetSpecifications_GivenHttpClientThrowsException_LogsReturnsInternalServerError()
        {
            //Arrange
            IHttpClient httpClient = CreateHttpClient();
            httpClient
                .When(x => x.GetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()))
                .Do(x => { throw new Exception(); });

            ILoggingService logs = CreateLoggingService();

            SpecsApiClient apiClient = CreateSpecsApiClient(httpClient: httpClient, logs: logs);

            //Act
            Func<Task> test = async () => await apiClient.GetSpecifications();

            //Assert
            test();

            logs
                .Received()
                .Trace(Arg.Is("Beginning to fetch data from: specs/specifications"));

            logs
                .Received()
                .Exception(Arg.Any<string>(), Arg.Any<Exception>());
        }

        [TestMethod]
        public async Task GetSpecifications_GivenResponseIsNotASuccess_LogsReturnsStatusCode()
        {
            //Arrange
            HttpResponseMessage response = new HttpResponseMessage(HttpStatusCode.BadRequest);

            IHttpClient httpClient = CreateHttpClient();
            httpClient
                .GetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
                .Returns(response);

            ILoggingService logs = CreateLoggingService();

            SpecsApiClient apiClient = CreateSpecsApiClient(httpClient: httpClient, logs: logs);

            //Act
            ApiResponse<List<Specification>> results = await apiClient.GetSpecifications();

            //
            results
                .StatusCode
                .Should()
                .Be(HttpStatusCode.BadRequest);

            logs
                .Received()
                .Trace("No successful response from specs/specifications with status code: BadRequest and reason: Bad Request");
        }

        [TestMethod]
        public async Task GetSpecifications_GivenResponseIsASuccess_ReturnsData()
        {
            //Arrange
            HttpResponseMessage response = new HttpResponseMessage(HttpStatusCode.OK);

            IHttpClient httpClient = CreateHttpClient();
            httpClient
                .GetAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
                .Returns(response);

            ILoggingService logs = CreateLoggingService();

            SpecsApiClient apiClient = CreateSpecsApiClient(httpClient: httpClient, logs: logs);

            //Act
            ApiResponse<List<Specification>> results = await apiClient.GetSpecifications();

            //
            results
                .StatusCode
                .Should()
                .Be(HttpStatusCode.BadRequest);

            logs
                .Received()
                .Trace("No successful response from specs/specifications with status code: BadRequest and reason: Bad Request");
        }







        static IOptionsSnapshot<ApiOptions> CreateOptions()
        {
            ApiOptions options = new ApiOptions
            {
                ApiKey = "Whatever",
                ApiEndpoint = "http://wherever/",
                ResultsPath = "results",
                SpecsPath = "specs"
            };

            IOptionsSnapshot<ApiOptions> optionsSnapshot = Substitute.For<IOptionsSnapshot<ApiOptions>>();

            optionsSnapshot
                .Value
                .Returns(options);

            return optionsSnapshot;
        }

        static IHttpClient CreateHttpClient()
        {
            IHttpClient httpClient = Substitute.For<IHttpClient>();
            return httpClient;
        }

        static ILoggingService CreateLoggingService()
        {
            return Substitute.For<ILoggingService>();
        }

        static SpecsApiClient CreateSpecsApiClient(IOptionsSnapshot<ApiOptions> options = null, IHttpClient httpClient = null, ILoggingService logs = null)
        {
            return new SpecsApiClient(options ?? CreateOptions(), httpClient ?? CreateHttpClient(), logs ?? CreateLoggingService());
        }
    }
}
