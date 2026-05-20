using System;
using System.Threading;
using System.Threading.Tasks;
using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IReportService
    {
        Task<ReportDto> GetDashboardAsync(CancellationToken cancellationToken = default);

        Task<FinancialReportDto> GetFinancialReportAsync(
            string? period,
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken = default);

        Task<DashboardAnalyticsDto> GetDashboardAnalyticsAsync(CancellationToken cancellationToken = default);

        Task<StaffDashboardDto> GetStaffDashboardAsync(
            string? displayName,
            string? email,
            string? role,
            CancellationToken cancellationToken = default);

        Task<StaffWorkspaceDto> GetStaffWorkspaceAsync(
            string? displayName,
            string? email,
            CancellationToken cancellationToken = default);
    }
}
