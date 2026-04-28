using System.Threading.Tasks;
using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IReportService
    {
        Task<ReportDto> GetDashboardAsync();
    }
}
