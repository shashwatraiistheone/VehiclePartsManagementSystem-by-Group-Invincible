using System;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class PartRequest
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public int? VehicleId { get; set; }
        public CustomerVehicle? Vehicle { get; set; }
        public string PartName { get; set; } = string.Empty;
        public string VehicleDetails { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public string? ResponseNotes { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? FulfilledAt { get; set; }
        public int? FulfilledByStaffId { get; set; }
        public Staff? FulfilledByStaff { get; set; }
    }
}
