using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class FuelUsageLogDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int VehicleId { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public int OdometerKm { get; set; }
        public int OdometerMiles { get; set; }
        public decimal FuelAmountLiters { get; set; }
        public string FuelType { get; set; } = string.Empty;
        public decimal FuelCost { get; set; }
        public DateTime LogDate { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateFuelUsageLogDto
    {
        [Required]
        public int VehicleId { get; set; }

        [Range(1, 2_000_000)]
        public int OdometerKm { get; set; }

        [Range(0.1, 500)]
        public decimal FuelAmountLiters { get; set; }

        [Required]
        [MaxLength(40)]
        public string FuelType { get; set; } = "Petrol";

        [Range(0, 1_000_000)]
        public decimal FuelCost { get; set; }

        public DateTime? LogDate { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }

    public class UpdateVehicleUsageDto
    {
        [Required]
        public int VehicleId { get; set; }

        [Range(1, 2_000_000)]
        public int OdometerKm { get; set; }

        [MaxLength(2000)]
        public string? ConditionNotes { get; set; }
    }

    public class FuelUsageAnalyticsDto
    {
        public int LatestOdometerKm { get; set; }
        public int LatestOdometerMiles { get; set; }
        public int TotalLogCount { get; set; }
        public bool HasSufficientData { get; set; }
        public DateTime? LastLogDate { get; set; }
        public decimal? AvgMpg { get; set; }
        public List<FuelUsageLogDto> RecentLogs { get; set; } = new();
    }
}
