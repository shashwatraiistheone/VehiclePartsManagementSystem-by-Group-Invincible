namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class MaintenanceDashboardDto
    {
        public int FleetHealthScore { get; set; }
        public DateTime GeneratedAt { get; set; }
        public List<VehicleMaintenanceDashboardDto> Vehicles { get; set; } = new();
        public FuelUsageAnalyticsDto FuelUsageAnalytics { get; set; } = new();
    }

    public class VehicleMaintenanceDashboardDto
    {
        public int VehicleId { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public int MileageKm { get; set; }
        public int MileageMiles { get; set; }
        public DateTime LastUpdated { get; set; }
        public bool HasUsageData { get; set; }
        public List<ComponentPredictionDto> Components { get; set; } = new();
    }

    public class ComponentPredictionDto
    {
        public string Component { get; set; } = string.Empty;
        public string Severity { get; set; } = "NORMAL";
        public int HealthPercent { get; set; }
        public int ConfidencePercent { get; set; }
        public int EstimatedMilesUntilService { get; set; }
        public string Summary { get; set; } = string.Empty;
        public string Recommendation { get; set; } = string.Empty;
        public DateTime PredictionDate { get; set; }
    }
}
