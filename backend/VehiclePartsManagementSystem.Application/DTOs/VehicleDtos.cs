using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class VehicleDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public int Mileage { get; set; }
        public string? Vin { get; set; }
        public string? Notes { get; set; }
        public string? LastServiceDate { get; set; }
    }

    public class VehicleInputDto
    {
        [Required]
        public string VehicleNumber { get; set; } = string.Empty;

        [Required]
        public string Brand { get; set; } = string.Empty;

        [Required]
        public string Model { get; set; } = string.Empty;

        [Range(1900, 2100)]
        public int Year { get; set; }

        [Range(0, int.MaxValue)]
        public int Mileage { get; set; }

        [MaxLength(17)]
        public string? Vin { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }

    public class CreateCustomerWithVehiclesDto
    {
        [Required]
        [MinLength(2)]
        public string Name { get; set; } = string.Empty;

        public string? Email { get; set; }

        [Required]
        [MinLength(6)]
        public string Phone { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public List<VehicleInputDto> Vehicles { get; set; } = new();
    }

    public class UpdateCustomerProfileDto
    {
        [Required]
        [MinLength(2)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Phone { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;
    }

    public class ChangeCustomerPasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class CustomerNotificationDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class CustomerDetailDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public List<VehicleDto> Vehicles { get; set; } = new();
        public int TotalPurchases { get; set; }
        public decimal TotalSpent { get; set; }
        public string? LastPurchaseDate { get; set; }
        public string? CreatedAt { get; set; }
        public List<PendingCreditDto> PendingCredits { get; set; } = new();
    }

    public class PendingCreditDto
    {
        public int InvoiceId { get; set; }
        public int SaleId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string CreatedDate { get; set; } = string.Empty;
    }

    public class CustomerSearchResultDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public List<VehicleDto> Vehicles { get; set; } = new();
        public int TotalPurchases { get; set; }
        public string? LastVisitDate { get; set; }
        public string? CreatedAt { get; set; }
        public string Status { get; set; } = "Inactive";
    }

    public class CustomerReportsDto
    {
        public List<CustomerReportRowDto> RegularCustomers { get; set; } = new();
        public List<CustomerReportRowDto> HighSpenders { get; set; } = new();
        public List<CustomerReportRowDto> PendingCreditCustomers { get; set; } = new();
    }

    public class CustomerReportRowDto
    {
        public int CustomerId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int PurchaseCount { get; set; }
        public decimal TotalSpent { get; set; }
        public decimal PendingCreditAmount { get; set; }
    }
}
