using System;
using System.Collections.Generic;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class SaleItemResponseDto
    {
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal LineTotal => Price * Quantity;
    }

    public class SaleInvoiceResponseDto
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public DateTime DueDate { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public decimal PaidAmount { get; set; }
        public decimal BalanceAmount { get; set; }
        public bool IsPaid { get; set; }
    }

    public class SaleResponseDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string CustomerAddress { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Discount { get; set; }
        public decimal FinalAmount { get; set; }
        public List<SaleItemResponseDto> Items { get; set; } = new();

        public int InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceCreatedDate { get; set; }

        public SaleInvoiceResponseDto? Invoice { get; set; }
    }
}
