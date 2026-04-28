using System;
using System.Collections.Generic;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class SaleItemResponseDto
    {
        public int PartId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }

    public class SaleResponseDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public decimal TotalAmount { get; set; }
        public List<SaleItemResponseDto> Items { get; set; } = new();
        public int InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceCreatedDate { get; set; }
    }
}
