using System.Collections.Generic;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class Customer
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;

        public List<ServiceAppointment> ServiceAppointments { get; set; } = new();
    }
}
