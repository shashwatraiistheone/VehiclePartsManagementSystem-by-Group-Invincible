using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class CreateSaleItemDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "PartId must be valid")]
        public int PartId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
        public int Quantity { get; set; }
    }

    public class CreateSaleDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "CustomerId must be valid")]
        public int CustomerId { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "At least one sale item is required")]
        public List<CreateSaleItemDto> Items { get; set; } = new();

        /// <summary>Paid or Credit (defaults to Credit).</summary>
        public string? PaymentStatus { get; set; }
    }
}
