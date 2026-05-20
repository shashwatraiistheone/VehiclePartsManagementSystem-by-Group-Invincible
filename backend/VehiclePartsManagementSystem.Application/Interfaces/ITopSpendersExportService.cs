namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface ITopSpendersExportService
    {
        Task<byte[]> ExportCsvAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken = default);

        Task<byte[]> ExportExcelAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken = default);

        Task<byte[]> ExportPdfAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken = default);
    }
}
