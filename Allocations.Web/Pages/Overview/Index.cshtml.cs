﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Allocations.Web.ApiClient;
using Allocations.Web.ApiClient.Models.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Allocations.Web.Pages.Overview
{
    public class IndexModel : PageModel
    {
        private readonly AllocationsApiClient _apiClient;
        public IList<BudgetSummary> Budgets;

        public IndexModel(AllocationsApiClient apiClient)
        {
            _apiClient = apiClient;
        }

       

        public async Task<IActionResult> OnGetAsync()
        {
            var results = await _apiClient.GetBudgetResults();

            Budgets = results.Content;
            return Page();
        }
    }

}
