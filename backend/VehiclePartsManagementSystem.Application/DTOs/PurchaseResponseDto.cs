using System;
using System.Collections.Generic;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class PurchaseResponseDto
    {
        public int Id { get; set; }
        public string VendorName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public decimal TotalAmount { get; set; }
        public List<PurchaseItemDto> Items { get; set; } = new();
    }
}

