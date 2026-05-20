using System;
using System.Collections.Generic;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class Customer
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        public List<ServiceAppointment> ServiceAppointments { get; set; } = new();
        public List<CustomerVehicle> Vehicles { get; set; } = new();
        public List<PartRequest> PartRequests { get; set; } = new();
        public List<Review> Reviews { get; set; } = new();
    }
}
