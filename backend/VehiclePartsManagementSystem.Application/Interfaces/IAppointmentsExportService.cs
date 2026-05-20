namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IAppointmentsExportService
    {
        Task<byte[]> ExportPdfAsync(
            string? status,
            string? fromDate,
            string? toDate,
            string? serviceType,
            string? search,
            CancellationToken cancellationToken = default);
    }
}
