﻿using System.Collections.Generic;
using System.Linq;
using CalculateFunding.Frontend.ViewModels.Common;
using Newtonsoft.Json;

namespace CalculateFunding.Frontend.ViewModels.Results
{
    public class PublishProviderSearchResultViewModel : SearchResultViewModel
    {
        public PublishProviderSearchResultViewModel()
        {
            Providers = Enumerable.Empty<PublishedProviderSearchResultItemViewModel>();
        }

        public IEnumerable<PublishedProviderSearchResultItemViewModel> Providers { get; set; }

        public double FilteredFundingAmount { get; set; }

        public bool CanPublish { get; set; }

        public bool CanApprove { get; set; }

        public decimal TotalFundingAmount { get; set; }

        public int TotalProvidersToApprove { get; set; }

        public int TotalProvidersToPublish { get; set; }
        
        [JsonIgnore] // We can't figure this out from the search results so hide it to avoid confusion on UI
        public new int TotalErrorResults { get; set; }
    }
}
