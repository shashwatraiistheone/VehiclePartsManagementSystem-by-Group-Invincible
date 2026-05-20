namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class BackgroundJobDefinitionDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Queue { get; set; } = string.Empty;
        public string Status { get; set; } = "idle";
        public DateTime LastRun { get; set; }
        public DateTime? NextRun { get; set; }
    }

    public class BackgroundJobHistoryPointDto
    {
        public string Time { get; set; } = string.Empty;
        public int Completed { get; set; }
        public int Failed { get; set; }
    }

    public class BackgroundJobsDashboardDto
    {
        public List<BackgroundJobDefinitionDto> Jobs { get; set; } = new();
        public List<BackgroundJobHistoryPointDto> History { get; set; } = new();
        public int TotalRuns { get; set; }
        public int FailedRuns { get; set; }
        public double SuccessRate { get; set; }
    }
}
