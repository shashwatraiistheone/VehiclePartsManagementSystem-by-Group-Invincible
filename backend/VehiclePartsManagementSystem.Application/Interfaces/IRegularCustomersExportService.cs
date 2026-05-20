namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IRegularCustomersExportService
    {
        Task<byte[]> ExportPdfAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken = default);
    }
}
