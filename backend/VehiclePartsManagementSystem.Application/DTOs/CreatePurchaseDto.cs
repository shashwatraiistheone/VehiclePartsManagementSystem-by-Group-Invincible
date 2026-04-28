using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class CreatePurchaseDto
    {
        [Required]
        public string VendorName { get; set; } = string.Empty;

        [Required]
        [MinLength(1, ErrorMessage = "At least one purchase item is required")]
        public List<PurchaseItemDto> Items { get; set; } = new();
    }
}

