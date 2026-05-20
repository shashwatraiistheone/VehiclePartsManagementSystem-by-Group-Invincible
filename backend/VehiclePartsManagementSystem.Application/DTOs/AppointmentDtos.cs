using System;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class AppointmentDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string? VehicleNumber { get; set; }
        public string? VehicleMakeModel { get; set; }
        public string ServiceType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string? Notes { get; set; }
        public decimal? EstimatedCost { get; set; }
    }

    public class AppointmentsSummaryDto
    {
        public int Pending { get; set; }
        public int Confirmed { get; set; }
        public int Cancelled { get; set; }
        public int Completed { get; set; }
    }

    public class AppointmentsListResponseDto
    {
        public AppointmentsSummaryDto Summary { get; set; } = new();
        public List<AppointmentDto> Items { get; set; } = new();
    }

    public class CreateAppointmentDto
    {
        public int CustomerId { get; set; }
        public string ServiceType { get; set; } = string.Empty;
        public string? Status { get; set; }
        public DateTime? Date { get; set; }
        public string? VehicleNumber { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateAppointmentDto
    {
        public string? ServiceType { get; set; }
        public string? Status { get; set; }
        public DateTime? Date { get; set; }
        public string? VehicleNumber { get; set; }
        public string? Notes { get; set; }
        public decimal? EstimatedCost { get; set; }
    }

    public class AppointmentCustomerDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }

    public class AppointmentVehicleDto
    {
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public string? Vin { get; set; }
        public string RegistrationNumber { get; set; } = string.Empty;
    }

    public class AppointmentHistoryItemDto
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ServiceType { get; set; } = string.Empty;
    }

    public class AppointmentDetailDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string ServiceType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Notes { get; set; }
        public decimal? EstimatedCost { get; set; }
        public AppointmentCustomerDto Customer { get; set; } = new();
        public AppointmentVehicleDto? Vehicle { get; set; }
        public List<AppointmentHistoryItemDto> History { get; set; } = new();
    }

    public class RescheduleAppointmentDto
    {
        public string Date { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
    }
}
