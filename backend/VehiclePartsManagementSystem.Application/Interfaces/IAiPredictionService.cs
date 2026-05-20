using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    /// <summary>
    /// AI / heuristic maintenance prediction module (extensible for ML integration).
    /// </summary>
    public interface IAiPredictionService
    {
        Task<IReadOnlyList<MaintenancePredictionDto>> GetPredictionsForCustomerAsync(int customerId, CancellationToken cancellationToken = default);
        Task<MaintenanceDashboardDto> GetMaintenanceDashboardAsync(int customerId, CancellationToken cancellationToken = default);
    }

    public class MaintenancePredictionDto
    {
        public string Component { get; set; } = string.Empty;
        public string RiskLevel { get; set; } = "Medium";
        public string Recommendation { get; set; } = string.Empty;
        public int EstimatedKmUntilService { get; set; }
    }
}
