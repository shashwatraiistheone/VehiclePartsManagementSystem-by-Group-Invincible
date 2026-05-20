namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class LoyaltyProgramSummaryDto
    {
        public int TotalCustomers { get; set; }
        public int EligibleCustomers { get; set; }
        public int GoldPlusCount { get; set; }
        public int GoldCount { get; set; }
        public int SilverCount { get; set; }
        public int MemberCount { get; set; }
        public decimal OrderThreshold { get; set; }
        public int DiscountPercent { get; set; }
        public List<LoyaltyProgramCustomerRowDto> Customers { get; set; } = new();
    }

    public class LoyaltyProgramCustomerRowDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Tier { get; set; } = "MEMBER";
        public int LoyaltyPoints { get; set; }
        public decimal TotalSpent { get; set; }
        public int QualifyingOrderCount { get; set; }
        public bool IsEligible { get; set; }
    }
}
