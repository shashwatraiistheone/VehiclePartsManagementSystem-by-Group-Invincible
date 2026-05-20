using System;
using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class PartRequestDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string PartName { get; set; } = string.Empty;
        public string VehicleDetails { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string? ResponseNotes { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int? VehicleId { get; set; }
        public DateTime? FulfilledAt { get; set; }
        public int? FulfilledByStaffId { get; set; }
        public string? FulfilledByStaffName { get; set; }
    }

    public class CreatePartRequestDto
    {
        [Required]
        [MinLength(2)]
        public string PartName { get; set; } = string.Empty;

        [MaxLength(200)]
        public string VehicleDetails { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Range(1, 9999)]
        public int Quantity { get; set; } = 1;

        public int? VehicleId { get; set; }
    }

    public class UpdatePartRequestStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? ResponseNotes { get; set; }
    }

    public class FulfillPartRequestDto
    {
        [MaxLength(1000)]
        public string? ResponseNotes { get; set; }
    }

    public class RejectPartRequestDto
    {
        [MaxLength(1000)]
        public string? ResponseNotes { get; set; }
    }
}
