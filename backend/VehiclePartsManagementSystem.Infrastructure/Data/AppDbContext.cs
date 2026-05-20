using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Part> Parts => Set<Part>();
        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<User> Users => Set<User>();
        public DbSet<Staff> Staff => Set<Staff>();
        public DbSet<Vendor> Vendors => Set<Vendor>();
        public DbSet<PurchaseInvoice> PurchaseInvoices => Set<PurchaseInvoice>();
        public DbSet<PurchaseItem> PurchaseItems => Set<PurchaseItem>();
        public DbSet<InventoryStockLog> InventoryStockLogs => Set<InventoryStockLog>();
        public DbSet<Sale> Sales => Set<Sale>();
        public DbSet<SaleItem> SaleItems => Set<SaleItem>();
        public DbSet<Invoice> Invoices => Set<Invoice>();
        public DbSet<InvoicePayment> InvoicePayments => Set<InvoicePayment>();
        public DbSet<ServiceAppointment> ServiceAppointments => Set<ServiceAppointment>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<InventoryNotification> InventoryNotifications => Set<InventoryNotification>();
        public DbSet<CustomerVehicle> CustomerVehicles => Set<CustomerVehicle>();
        public DbSet<PartRequest> PartRequests => Set<PartRequest>();
        public DbSet<Review> Reviews => Set<Review>();
        public DbSet<CommunityReview> CommunityReviews => Set<CommunityReview>();
        public DbSet<FuelUsageLog> FuelUsageLogs => Set<FuelUsageLog>();
        public DbSet<EmailLog> EmailLogs => Set<EmailLog>();
        public DbSet<EmailReminderLog> EmailReminderLogs => Set<EmailReminderLog>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<BackgroundJobRun> BackgroundJobRuns => Set<BackgroundJobRun>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Some databases store Role as text ("Admin"/"Staff"); EF defaults to integer enum storage.
            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion(
                    v => v.ToString(),
                    v => Enum.Parse<UserRole>(v, true));

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            // Staff accounts (Feature 2) — role stored as text for readability in PostgreSQL.
            modelBuilder.Entity<Staff>()
                .Property(s => s.Role)
                .HasConversion(
                    v => v.ToString(),
                    v => Enum.Parse<UserRole>(v, true));

            modelBuilder.Entity<Staff>()
                .HasIndex(s => s.Email)
                .IsUnique();

            modelBuilder.Entity<Customer>()
                .HasIndex(c => c.Email)
                .IsUnique();

            // Feature 5: vendor email must be unique; parts may reference a vendor.
            modelBuilder.Entity<Vendor>()
                .HasIndex(v => v.Email)
                .IsUnique();

            modelBuilder.Entity<Part>()
                .HasOne(p => p.Vendor)
                .WithMany(v => v.Parts)
                .HasForeignKey(p => p.VendorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<InventoryNotification>()
                .HasOne(n => n.Part)
                .WithMany()
                .HasForeignKey(n => n.PartId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<InventoryNotification>()
                .HasIndex(n => new { n.PartId, n.IsRead });

            modelBuilder.Entity<PurchaseInvoice>()
                .HasOne(p => p.Vendor)
                .WithMany(v => v.PurchaseInvoices)
                .HasForeignKey(p => p.VendorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseInvoice>()
                .HasMany(p => p.Items)
                .WithOne(i => i.PurchaseInvoice)
                .HasForeignKey(i => i.PurchaseInvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PurchaseItem>()
                .HasOne(i => i.Part)
                .WithMany()
                .HasForeignKey(i => i.PartId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<InventoryStockLog>()
                .HasOne(l => l.Part)
                .WithMany()
                .HasForeignKey(l => l.PartId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<InventoryStockLog>()
                .HasIndex(l => new { l.PartId, l.CreatedAt });

            modelBuilder.Entity<Sale>()
                .HasOne(s => s.Customer)
                .WithMany()
                .HasForeignKey(s => s.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Sale>()
                .HasMany(s => s.Items)
                .WithOne(i => i.Sale)
                .HasForeignKey(i => i.SaleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SaleItem>()
                .HasOne(i => i.Part)
                .WithMany()
                .HasForeignKey(i => i.PartId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Sale>()
                .HasOne(s => s.Invoice)
                .WithOne(i => i.Sale)
                .HasForeignKey<Invoice>(i => i.SaleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ServiceAppointment>()
                .HasOne(a => a.Customer)
                .WithMany(c => c.ServiceAppointments)
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .HasIndex(i => i.InvoiceNumber)
                .IsUnique();

            modelBuilder.Entity<InvoicePayment>()
                .HasOne(p => p.Invoice)
                .WithMany()
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CustomerVehicle>()
                .HasOne(v => v.Customer)
                .WithMany(c => c.Vehicles)
                .HasForeignKey(v => v.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CustomerVehicle>()
                .HasIndex(v => v.VehicleNumber);

            modelBuilder.Entity<PartRequest>()
                .HasOne(p => p.Customer)
                .WithMany(c => c.PartRequests)
                .HasForeignKey(p => p.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PartRequest>()
                .HasOne(p => p.Vehicle)
                .WithMany()
                .HasForeignKey(p => p.VehicleId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<PartRequest>()
                .HasOne(p => p.FulfilledByStaff)
                .WithMany()
                .HasForeignKey(p => p.FulfilledByStaffId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Review>()
                .HasOne(r => r.Customer)
                .WithMany(c => c.Reviews)
                .HasForeignKey(r => r.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CommunityReview>()
                .HasOne(r => r.Customer)
                .WithMany()
                .HasForeignKey(r => r.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CommunityReview>()
                .HasIndex(r => r.CustomerId);

            modelBuilder.Entity<FuelUsageLog>()
                .HasOne(f => f.Customer)
                .WithMany()
                .HasForeignKey(f => f.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<FuelUsageLog>()
                .HasOne(f => f.Vehicle)
                .WithMany()
                .HasForeignKey(f => f.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<FuelUsageLog>()
                .HasIndex(f => f.CustomerId);

            modelBuilder.Entity<EmailLog>()
                .HasOne(e => e.Customer)
                .WithMany()
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EmailLog>()
                .HasOne(e => e.Invoice)
                .WithMany()
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EmailLog>()
                .HasIndex(e => e.InvoiceId);

            modelBuilder.Entity<EmailReminderLog>()
                .HasOne(e => e.Customer)
                .WithMany()
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EmailReminderLog>()
                .HasOne(e => e.Invoice)
                .WithMany()
                .HasForeignKey(e => e.CreditPaymentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EmailReminderLog>()
                .HasIndex(e => new { e.CustomerId, e.SentAt });

            modelBuilder.Entity<EmailReminderLog>()
                .HasIndex(e => e.CreditPaymentId);

            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.Timestamp);

            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.Action);

            modelBuilder.Entity<BackgroundJobRun>()
                .HasIndex(j => new { j.JobKey, j.StartedAt });
        }
    }
}

