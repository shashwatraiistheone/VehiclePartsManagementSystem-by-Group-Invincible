namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IPendingCreditsExportService
    {
        Task<byte[]> ExportPdfAsync(
            DateTime? from,
            DateTime? to,
            string? search,
            string? overdueStatus,
            CancellationToken cancellationToken = default);
    }
}
