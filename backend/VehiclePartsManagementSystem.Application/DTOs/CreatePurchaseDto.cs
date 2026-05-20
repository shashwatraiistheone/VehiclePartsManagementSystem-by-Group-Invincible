using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class CreatePurchaseDto
    {
        public string? InvoiceNumber { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "A valid vendor is required")]
        public int VendorId { get; set; }

        public DateTime? PurchaseDate { get; set; }

        public string? Notes { get; set; }

        public string? ProcessedBy { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "At least one purchase item is required")]
        public List<PurchaseItemDto> Items { get; set; } = new();
    }
}
