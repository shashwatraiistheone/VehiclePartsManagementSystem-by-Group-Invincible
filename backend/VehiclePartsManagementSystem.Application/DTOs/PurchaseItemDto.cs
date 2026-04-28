using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class PurchaseItemDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "PartId must be valid")]
        public int PartId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
        public int Quantity { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal Price { get; set; }
    }
}

