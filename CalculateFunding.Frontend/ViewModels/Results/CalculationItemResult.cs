﻿using CalculateFunding.Frontend.Clients.SpecsClient.Models;
using System.Globalization;

namespace CalculateFunding.Frontend.ViewModels.Results
{
    public class CalculationItemResult
    {
        public string Calculation { get; set; }

        public CalculationSpecificationType CalculationType { get; set; }

        public double SubTotal { get; set; }

        public string TotalFormatted
        {
            get
            {
                if(CalculationType == CalculationSpecificationType.Funding)
                {
                    return SubTotal.ToString("N2");
                }

                return SubTotal.ToString("C", new CultureInfo("en-GB"));
            }
        }
    }
}
