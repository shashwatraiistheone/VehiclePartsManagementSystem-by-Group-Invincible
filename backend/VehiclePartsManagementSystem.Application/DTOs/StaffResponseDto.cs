namespace VehiclePartsManagementSystem.Application.DTOs
{
    /// <summary>
    /// Safe staff projection — never exposes password hash.
    /// </summary>
    public class StaffResponseDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
