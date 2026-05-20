namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class CustomerVehicle
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public int Mileage { get; set; }
        public string? Vin { get; set; }
        public string? Notes { get; set; }
    }
}
