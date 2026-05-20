namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public record DemoDataSeedResult(
        bool Skipped,
        string Message,
        int Customers,
        int Parts,
        int Sales,
        int Purchases,
        int AuditLogs,
        int BackgroundJobRuns);

    public interface IDemoDataSeeder
    {
        Task<DemoDataSeedResult> SeedAsync(bool force = false, CancellationToken cancellationToken = default);

        /// <summary>
        /// Ensures a small catalog of vendors, parts, and customers with vehicles for manual testing.
        /// Safe to run on every startup; skips entities that already exist.
        /// </summary>
        Task EnsureMinimumTestDataAsync(CancellationToken cancellationToken = default);
    }
}
