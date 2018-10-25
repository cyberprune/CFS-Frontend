﻿using System.Threading.Tasks;
using CalculateFunding.Frontend.Clients.CommonModels;
using CalculateFunding.Frontend.Clients.UsersClient.Models;

namespace CalculateFunding.Frontend.Interfaces.ApiClient
{
    public interface IUsersApiClient
    {
        Task<ApiResponse<User>> GetUserByUserId(string userId);

        Task<ValidatedApiResponse<User>> ConfirmSkills(string userId, UserConfirmModel userConfirmModel);
    }
}
