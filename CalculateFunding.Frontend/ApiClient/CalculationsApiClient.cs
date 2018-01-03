﻿using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using CalculateFunding.Frontend.ApiClient.Models;
using CalculateFunding.Frontend.ApiClient.Models.Results;
using CalculateFunding.Frontend.Interfaces.APiClient;
using CalculateFunding.Frontend.Interfaces.Core;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace CalculateFunding.Frontend.ApiClient
{
    public class CalculationsApiClient : ICalculationsApiClient
    {
        private readonly IHttpClient _httpClient;
        private readonly JsonSerializerSettings _serializerSettings = new JsonSerializerSettings{Formatting = Formatting.Indented, ContractResolver = new CamelCasePropertyNamesContractResolver()};
        
        public CalculationsApiClient(IOptions<ApiOptions> options, IHttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri(options.Value.ApiEndpoint);
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", options.Value.ApiKey);
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        public async Task<ApiResponse<PreviewResponse>> PostPreview(PreviewRequest request)
        {

            return (await PostAsync<PreviewResponse, PreviewRequest>("api/v1/engine/preview", request).ConfigureAwait(false));
        }


        private async Task<ApiResponse<TResponse>> PostAsync<TResponse, TRequest>(string url, TRequest request)
        {
            string json = JsonConvert.SerializeObject(request, _serializerSettings);
            var response = await _httpClient.PostAsync(url, new StringContent(json, Encoding.UTF8, "application/json")).ConfigureAwait(false);
            if (response.IsSuccessStatusCode)
            {
                return new ApiResponse<TResponse>(response.StatusCode, JsonConvert.DeserializeObject<TResponse>(await response.Content.ReadAsStringAsync().ConfigureAwait(false), _serializerSettings));
            }
            return new ApiResponse<TResponse>(response.StatusCode);
        }

        private async Task<HttpStatusCode> PostAsync<TRequest>(string url, TRequest request)
        {
            string json = JsonConvert.SerializeObject(request, _serializerSettings);
            var response = await _httpClient.PostAsync(url, new StringContent(json, Encoding.UTF8, "application/json")).ConfigureAwait(false);
            return response.StatusCode;
        }

        private async Task<ApiResponse<T>> GetAsync<T>(string url)
        {
            var response = await _httpClient.GetAsync(url).ConfigureAwait(false);
            if (response.IsSuccessStatusCode)
            {
                return new ApiResponse<T>(response.StatusCode, JsonConvert.DeserializeObject<T>(await response.Content.ReadAsStringAsync().ConfigureAwait(false), _serializerSettings));
            }
            return new ApiResponse<T>(response.StatusCode);
        }

    }
}

