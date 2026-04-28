namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class PurchaseItem
    {
        public int Id { get; set; }

        public int PurchaseInvoiceId { get; set; }
        public PurchaseInvoice? PurchaseInvoice { get; set; }

        public int PartId { get; set; }
        public Part? Part { get; set; }

        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
}

