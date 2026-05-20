namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class CustomerLoyaltyDto
    {
        public int CustomerId { get; set; }
        public int LoyaltyPoints { get; set; }
        public decimal TotalSpent { get; set; }
        public decimal OrderThreshold { get; set; }
        public int DiscountPercent { get; set; }
        public bool IsEligible { get; set; }
        public int ProgressPercent { get; set; }
        public decimal LargestOrderSubtotal { get; set; }
        public decimal RemainingAmount { get; set; }
        public int QualifyingOrderCount { get; set; }
        public string Tier { get; set; } = "MEMBER";
        public string NextDiscountMessage { get; set; } = string.Empty;
    }
}
