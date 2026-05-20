namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class VendorResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string Status { get; set; } = "Active";
        public decimal TotalPurchases { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
