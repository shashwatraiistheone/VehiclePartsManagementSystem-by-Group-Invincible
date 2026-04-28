namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class SaleItem
    {
        public int Id { get; set; }

        public int SaleId { get; set; }
        public Sale? Sale { get; set; }

        public int PartId { get; set; }
        public Part? Part { get; set; }

        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
}
