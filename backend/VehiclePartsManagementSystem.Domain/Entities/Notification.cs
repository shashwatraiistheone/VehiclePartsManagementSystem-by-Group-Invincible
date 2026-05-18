using System;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class Notification
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "LowStock" or "UnpaidCredit"
        public string ReferenceId { get; set; } = string.Empty; // Unique key to prevent duplicates: "part-{id}" or "invoice-{id}"
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
