namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class FuelUsageLog
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public int VehicleId { get; set; }
        public CustomerVehicle? Vehicle { get; set; }
        public int OdometerKm { get; set; }
        public decimal FuelAmountLiters { get; set; }
        public string FuelType { get; set; } = "Petrol";
        public decimal FuelCost { get; set; }
        public DateTime LogDate { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
