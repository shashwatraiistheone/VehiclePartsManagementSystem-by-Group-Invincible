using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Infrastructure.Data
{
    public class DemoDataSeeder : IDemoDataSeeder
    {
        private const decimal LoyaltyThreshold = 5000m;
        private const decimal LoyaltyDiscountRate = 0.10m;
        private const decimal VatRate = 0.13m;

        private readonly AppDbContext _db;
        private readonly ILogger<DemoDataSeeder> _logger;
        private Random _rng = new(2026);

        public DemoDataSeeder(AppDbContext db, ILogger<DemoDataSeeder> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<DemoDataSeedResult> SeedAsync(bool force = false, CancellationToken cancellationToken = default)
        {
            if (!force && await _db.Sales.CountAsync(cancellationToken) >= 400)
            {
                return new DemoDataSeedResult(true, "Demo data already present (400+ sales). Use force=true to reseed.", 0, 0, 0, 0, 0, 0);
            }

            _rng = new Random(2026);
            _logger.LogInformation("Starting demo data seed (force={Force})...", force);

            if (force)
            {
                await ClearTransactionalDataAsync(cancellationToken);
            }

            await EnsureAdminStaffAsync(cancellationToken);
            await SeedStaffAsync(cancellationToken);

            var staffIds = await _db.Staff.Select(s => s.Id).ToListAsync(cancellationToken);
            var vendorIds = await SeedVendorsAsync(cancellationToken);
            var partIds = await SeedPartsAsync(vendorIds, cancellationToken);
            var customerIds = await SeedCustomersAsync(cancellationToken);
            await SeedVehiclesAsync(customerIds, cancellationToken);

            var stock = partIds.ToDictionary(id => id, _ => 0);
            await SeedPurchasesAsync(vendorIds, partIds, stock, staffIds, cancellationToken);
            var saleSummaries = await SeedSalesAsync(customerIds, partIds, stock, staffIds, cancellationToken);

            await UpdatePartQuantitiesAsync(partIds, stock, cancellationToken);
            await SeedAppointmentsAsync(customerIds, cancellationToken);
            await SeedPartRequestsAsync(customerIds, staffIds, cancellationToken);
            await SeedReviewsAsync(customerIds, cancellationToken);
            await SeedCommunityReviewsAsync(customerIds, cancellationToken);
            await SeedNotificationsAsync(cancellationToken);
            await SeedEmailLogsAsync(cancellationToken);
            await SeedFuelLogsAsync(customerIds, cancellationToken);
            var auditCount = await SeedAuditLogsAsync(saleSummaries, staffIds, cancellationToken);
            var jobCount = await SeedBackgroundJobRunsAsync(cancellationToken);

            var customers = await _db.Customers.CountAsync(cancellationToken);
            var parts = await _db.Parts.CountAsync(cancellationToken);
            var sales = await _db.Sales.CountAsync(cancellationToken);
            var purchases = await _db.PurchaseInvoices.CountAsync(cancellationToken);

            _logger.LogInformation(
                "Demo seed complete: {Customers} customers, {Parts} parts, {Sales} sales, {Purchases} purchases",
                customers, parts, sales, purchases);

            return new DemoDataSeedResult(
                false,
                "Demo data seeded successfully for Jan–Dec 2026.",
                customers,
                parts,
                sales,
                purchases,
                auditCount,
                jobCount);
        }

        private async Task ClearTransactionalDataAsync(CancellationToken ct)
        {
            await _db.BackgroundJobRuns.ExecuteDeleteAsync(ct);
            await _db.AuditLogs.ExecuteDeleteAsync(ct);
            await _db.EmailLogs.ExecuteDeleteAsync(ct);
            await _db.FuelUsageLogs.ExecuteDeleteAsync(ct);
            await _db.Notifications.ExecuteDeleteAsync(ct);
            await _db.InventoryNotifications.ExecuteDeleteAsync(ct);
            await _db.InventoryStockLogs.ExecuteDeleteAsync(ct);
            await _db.InvoicePayments.ExecuteDeleteAsync(ct);
            await _db.Sales.ExecuteDeleteAsync(ct);
            await _db.PurchaseInvoices.ExecuteDeleteAsync(ct);
            await _db.Reviews.ExecuteDeleteAsync(ct);
            await _db.CommunityReviews.ExecuteDeleteAsync(ct);
            await _db.PartRequests.ExecuteDeleteAsync(ct);
            await _db.ServiceAppointments.ExecuteDeleteAsync(ct);
            await _db.CustomerVehicles.ExecuteDeleteAsync(ct);
            await _db.Parts.ExecuteDeleteAsync(ct);
            await _db.Vendors.ExecuteDeleteAsync(ct);
            await _db.Customers.ExecuteDeleteAsync(ct);

            var adminEmail = "admin@partshub.local";
            await _db.Staff.Where(s => s.Email != adminEmail).ExecuteDeleteAsync(ct);
        }

        private async Task EnsureAdminStaffAsync(CancellationToken ct)
        {
            if (!await _db.Staff.AnyAsync(ct))
            {
                _db.Staff.Add(new Staff
                {
                    FullName = "System Administrator",
                    Email = "admin@partshub.local",
                    Phone = "+9779810000001",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Role = UserRole.Admin,
                    IsActive = true,
                    CreatedAt = DemoDataCatalog.YearStart.AddDays(-30),
                });
                await _db.SaveChangesAsync(ct);
            }
        }

        private async Task<List<int>> SeedVendorsAsync(CancellationToken ct)
        {
            if (await _db.Vendors.CountAsync(ct) >= 15)
            {
                return await _db.Vendors.Select(v => v.Id).ToListAsync(ct);
            }

            var vendors = new List<Vendor>();
            for (var i = 0; i < DemoDataCatalog.VendorNames.Length; i++)
            {
                var name = DemoDataCatalog.VendorNames[i];
                var slug = name.Replace(" ", "").ToLowerInvariant()[..Math.Min(12, name.Length)];
                vendors.Add(new Vendor
                {
                    Name = name,
                    ContactPerson = $"{DemoDataCatalog.StaffFirstNames[i % DemoDataCatalog.StaffFirstNames.Length]} {DemoDataCatalog.LastNames[i % DemoDataCatalog.LastNames.Length]}",
                    Phone = $"+97798{10000000 + i * 1111:D8}"[..14],
                    Email = $"vendor.{slug}{i}@partshub.demo",
                    Address = DemoDataCatalog.KathmanduAreas[i % DemoDataCatalog.KathmanduAreas.Length],
                    Notes = "Demo supplier account",
                    IsActive = i % 17 != 0,
                    CreatedAt = DemoDataCatalog.YearStart.AddDays(-_rng.Next(60, 200)),
                });
            }

            await _db.Vendors.AddRangeAsync(vendors, ct);
            await _db.SaveChangesAsync(ct);
            return vendors.Select(v => v.Id).ToList();
        }

        private async Task<List<int>> SeedPartsAsync(List<int> vendorIds, CancellationToken ct)
        {
            if (await _db.Parts.CountAsync(ct) >= 100)
            {
                return await _db.Parts.Select(p => p.Id).ToListAsync(ct);
            }

            var parts = new List<Part>();
            for (var i = 0; i < DemoDataCatalog.PartTemplates.Length; i++)
            {
                var t = DemoDataCatalog.PartTemplates[i];
                var cost = Math.Round((decimal)(_rng.NextDouble() * (double)(t.CostMax - t.CostMin) + (double)t.CostMin), 0);
                var price = Math.Round(cost * t.Margin, 0);
                var category = t.Category;
                var isLowStockTarget = i < 8 || i % 23 == 0;

                parts.Add(new Part
                {
                    PartNumber = $"VP-{category[..Math.Min(3, category.Length)].ToUpperInvariant()}-{(i + 1):D4}",
                    Name = t.Name,
                    Category = category,
                    Description = $"Genuine/OE quality {t.Name.ToLowerInvariant()} for passenger vehicles.",
                    CostPrice = cost,
                    Price = price,
                    Quantity = 0,
                    CriticalStockLevel = isLowStockTarget ? _rng.Next(8, 15) : _rng.Next(3, 8),
                    IsActive = i % 29 != 0,
                    VendorId = vendorIds[_rng.Next(vendorIds.Count)],
                    CreatedAt = DemoDataCatalog.YearStart.AddDays(-_rng.Next(30, 180)),
                });
            }

            await _db.Parts.AddRangeAsync(parts, ct);
            await _db.SaveChangesAsync(ct);
            return parts.Select(p => p.Id).ToList();
        }

        private async Task<List<int>> SeedCustomersAsync(CancellationToken ct)
        {
            if (await _db.Customers.CountAsync(ct) >= 100)
            {
                return await _db.Customers.Select(c => c.Id).ToListAsync(ct);
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123");
            var customers = new List<Customer>();
            var usedEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            for (var i = 0; i < 120; i++)
            {
                var first = DemoDataCatalog.FirstNames[i % DemoDataCatalog.FirstNames.Length];
                var last = DemoDataCatalog.LastNames[(i * 7) % DemoDataCatalog.LastNames.Length];
                var name = $"{first} {last}";
                var email = $"{first.ToLowerInvariant()}.{last.ToLowerInvariant()}{i}@demo.partshub.np";
                while (!usedEmails.Add(email))
                {
                    email = $"{first.ToLowerInvariant()}.{last.ToLowerInvariant()}{i}_{_rng.Next(100, 999)}@demo.partshub.np";
                }

                var brand = DemoDataCatalog.VehicleBrands[i % DemoDataCatalog.VehicleBrands.Length];
                var model = DemoDataCatalog.VehicleModels[i % DemoDataCatalog.VehicleModels.Length];
                var year = 2012 + (i % 12);
                var regMonth = _rng.Next(0, 11);
                var created = DemoDataCatalog.YearStart.AddMonths(-regMonth).AddDays(-_rng.Next(1, 28));

                customers.Add(new Customer
                {
                    Name = name,
                    Email = email,
                    Phone = $"+97798{_rng.Next(10000000, 99999999)}",
                    Address = $"Vehicle: {brand} {model} {year}, {DemoDataCatalog.KathmanduAreas[i % DemoDataCatalog.KathmanduAreas.Length]}",
                    PasswordHash = passwordHash,
                    CreatedAt = created,
                });
            }

            await _db.Customers.AddRangeAsync(customers, ct);
            await _db.SaveChangesAsync(ct);
            return customers.Select(c => c.Id).ToList();
        }

        private async Task SeedVehiclesAsync(List<int> customerIds, CancellationToken ct)
        {
            if (await _db.CustomerVehicles.AnyAsync(ct))
            {
                return;
            }

            var vehicles = new List<CustomerVehicle>();
            foreach (var customerId in customerIds)
            {
                var count = _rng.NextDouble() < 0.25 ? 2 : 1;
                for (var v = 0; v < count; v++)
                {
                    var brand = DemoDataCatalog.VehicleBrands[_rng.Next(DemoDataCatalog.VehicleBrands.Length)];
                    var model = DemoDataCatalog.VehicleModels[_rng.Next(DemoDataCatalog.VehicleModels.Length)];
                    vehicles.Add(new CustomerVehicle
                    {
                        CustomerId = customerId,
                        VehicleNumber = $"BA {customerId * 10 + v}-PA-{_rng.Next(1000, 9999)}",
                        Brand = brand,
                        Model = model,
                        Year = 2010 + _rng.Next(0, 14),
                        Mileage = _rng.Next(5000, 185000),
                        Vin = $"VIN{_rng.Next(100000, 999999)}{customerId}",
                    });
                }
            }

            await _db.CustomerVehicles.AddRangeAsync(vehicles, ct);
            await _db.SaveChangesAsync(ct);
        }

        private async Task SeedStaffAsync(CancellationToken ct)
        {
            if (await _db.Staff.CountAsync(ct) > 5)
            {
                return;
            }

            var staff = new List<Staff>();
            for (var i = 0; i < DemoDataCatalog.StaffFirstNames.Length; i++)
            {
                var first = DemoDataCatalog.StaffFirstNames[i];
                var last = DemoDataCatalog.LastNames[i % DemoDataCatalog.LastNames.Length];
                staff.Add(new Staff
                {
                    FullName = $"{first} {last}",
                    Email = $"staff.{first.ToLowerInvariant()}{i}@partshub.demo",
                    Phone = $"+97798{_rng.Next(20000000, 29999999)}",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"),
                    Role = i < 2 ? UserRole.Admin : UserRole.Staff,
                    IsActive = i % 11 != 0,
                    CreatedAt = DemoDataCatalog.YearStart.AddDays(-_rng.Next(30, 365)),
                });
            }

            await _db.Staff.AddRangeAsync(staff, ct);
            await _db.SaveChangesAsync(ct);
        }

        private async Task SeedPurchasesAsync(
            List<int> vendorIds,
            List<int> partIds,
            Dictionary<int, int> stock,
            List<int> staffIds,
            CancellationToken ct)
        {
            var existing = await _db.PurchaseInvoices.CountAsync(ct);
            if (existing >= 300)
            {
                await SyncStockFromDatabaseAsync(stock, ct);
                return;
            }

            var parts = await _db.Parts.AsNoTracking().ToListAsync(ct);
            var purchaseDates = GenerateWeightedDates(320, DemoDataCatalog.MonthlySaleWeight);
            var staffNames = await _db.Staff.AsNoTracking().Select(s => s.FullName).ToListAsync(ct);
            var batch = new List<PurchaseInvoice>();
            var stockLogs = new List<InventoryStockLog>();
            var auditLogs = new List<AuditLog>();
            var invoiceSeq = 1;

            foreach (var date in purchaseDates)
            {
                var vendorId = vendorIds[_rng.Next(vendorIds.Count)];
                var vendor = await _db.Vendors.AsNoTracking().FirstAsync(v => v.Id == vendorId, ct);
                var itemCount = _rng.Next(1, 5);
                var invoice = new PurchaseInvoice
                {
                    InvoiceNumber = $"PI-2026-{invoiceSeq:D5}",
                    VendorId = vendorId,
                    VendorName = vendor.Name,
                    Date = date,
                    Notes = _rng.NextDouble() < 0.15 ? "Urgent restock — low inventory alert" : string.Empty,
                    ProcessedBy = staffNames[_rng.Next(staffNames.Count)],
                    CreatedAt = date.AddHours(_rng.Next(1, 10)),
                };
                invoiceSeq++;

                for (var j = 0; j < itemCount; j++)
                {
                    var part = parts[_rng.Next(parts.Count)];
                    var qty = _rng.Next(5, 45);
                    var unitCost = Math.Round(part.CostPrice * (decimal)(0.92 + _rng.NextDouble() * 0.12), 0);
                    invoice.Items.Add(new PurchaseItem
                    {
                        PartId = part.Id,
                        Quantity = qty,
                        Price = unitCost,
                    });
                    stock[part.Id] = stock.GetValueOrDefault(part.Id) + qty;
                }

                invoice.TotalAmount = invoice.Items.Sum(i => i.Price * i.Quantity);
                batch.Add(invoice);

                if (batch.Count >= 40)
                {
                    await _db.PurchaseInvoices.AddRangeAsync(batch, ct);
                    await _db.SaveChangesAsync(ct);

                    foreach (var pi in batch)
                    {
                        foreach (var item in pi.Items)
                        {
                            stockLogs.Add(new InventoryStockLog
                            {
                                PartId = item.PartId,
                                QuantityChange = item.Quantity,
                                Reason = $"Purchase invoice {pi.InvoiceNumber}",
                                ReferenceType = "Purchase",
                                ReferenceId = pi.Id,
                                CreatedAt = pi.Date,
                            });
                        }

                        auditLogs.Add(new AuditLog
                        {
                            Timestamp = pi.Date,
                            Action = "Purchase Created",
                            Details = $"Purchase {pi.InvoiceNumber} from {pi.VendorName} for Rs. {pi.TotalAmount:N2} (incl. logistics).",
                            Entity = $"Purchase #{pi.Id}",
                            EntityType = "Purchase",
                            PerformedBy = pi.ProcessedBy,
                        });
                    }

                    await _db.InventoryStockLogs.AddRangeAsync(stockLogs, ct);
                    await _db.AuditLogs.AddRangeAsync(auditLogs, ct);
                    await _db.SaveChangesAsync(ct);
                    batch.Clear();
                    stockLogs.Clear();
                    auditLogs.Clear();
                }
            }

            if (batch.Count > 0)
            {
                await _db.PurchaseInvoices.AddRangeAsync(batch, ct);
                await _db.SaveChangesAsync(ct);
            }
        }

        private sealed record SaleSummary(
            int SaleId,
            int InvoiceId,
            string InvoiceNumber,
            int CustomerId,
            string CustomerName,
            DateTime Date,
            decimal Total,
            decimal Discount,
            bool IsPaid,
            string PaymentStatus);

        private async Task<List<SaleSummary>> SeedSalesAsync(
            List<int> customerIds,
            List<int> partIds,
            Dictionary<int, int> stock,
            List<int> staffIds,
            CancellationToken ct)
        {
            var existing = await _db.Sales.CountAsync(ct);
            if (existing >= 500)
            {
                return await _db.Sales
                    .Include(s => s.Invoice)
                    .Include(s => s.Customer)
                    .Select(s => new SaleSummary(
                        s.Id,
                        s.Invoice!.Id,
                        s.Invoice.InvoiceNumber,
                        s.CustomerId,
                        s.Customer!.Name,
                        s.Date,
                        s.TotalAmount,
                        s.DiscountAmount,
                        s.Invoice.IsPaid,
                        s.Invoice.PaymentStatus))
                    .ToListAsync(ct);
            }

            var parts = await _db.Parts.AsNoTracking().Where(p => p.IsActive).ToListAsync(ct);
            var saleDates = GenerateWeightedDates(550, DemoDataCatalog.MonthlySaleWeight);
            var summaries = new List<SaleSummary>();
            var auditLogs = new List<AuditLog>();
            var payments = new List<InvoicePayment>();
            var stockLogs = new List<InventoryStockLog>();
            var invoiceSeq = 1;
            var inactiveCustomers = new HashSet<int>(customerIds.OrderBy(_ => _rng.Next()).Take(18));
            var activeCustomers = customerIds.Where(id => !inactiveCustomers.Contains(id)).ToList();

            foreach (var date in saleDates)
            {
                int customerId;
                if (date.Month >= 7 && activeCustomers.Count > 0 && _rng.NextDouble() < 0.9)
                {
                    customerId = activeCustomers[_rng.Next(activeCustomers.Count)];
                }
                else if (date.Month < 7 && inactiveCustomers.Count > 0 && _rng.NextDouble() < 0.15)
                {
                    customerId = inactiveCustomers.ElementAt(_rng.Next(inactiveCustomers.Count));
                }
                else
                {
                    customerId = customerIds[_rng.Next(customerIds.Count)];
                }

                var availableParts = parts.Where(p => stock.GetValueOrDefault(p.Id) >= 2).ToList();
                if (availableParts.Count == 0)
                {
                    continue;
                }

                var itemCount = _rng.Next(1, 6);
                var sale = new Sale
                {
                    CustomerId = customerId,
                    Date = date,
                };

                for (var j = 0; j < itemCount; j++)
                {
                    var part = availableParts[_rng.Next(availableParts.Count)];
                    var maxQty = Math.Min(8, stock[part.Id]);
                    if (maxQty < 1)
                    {
                        continue;
                    }

                    var qty = _rng.Next(1, maxQty + 1);
                    var unitPrice = part.Price;
                    if (_rng.NextDouble() < 0.08)
                    {
                        unitPrice = Math.Round(part.Price * 0.95m, 0);
                    }

                    sale.Items.Add(new SaleItem
                    {
                        PartId = part.Id,
                        Quantity = qty,
                        Price = unitPrice,
                    });
                    stock[part.Id] -= qty;
                }

                if (sale.Items.Count == 0)
                {
                    continue;
                }

                var originalTotal = sale.Items.Sum(i => i.Price * i.Quantity);
                var discount = originalTotal >= LoyaltyThreshold ? Math.Round(originalTotal * LoyaltyDiscountRate, 2) : 0m;
                var vatAmount = Math.Round((originalTotal - discount) * VatRate, 2);
                var finalTotal = originalTotal - discount + vatAmount;

                sale.OriginalTotalAmount = originalTotal;
                sale.DiscountAmount = discount;
                sale.TotalAmount = finalTotal;

                var paymentRoll = _rng.NextDouble();
                string paymentStatus;
                bool isPaid;
                decimal paidAmount;
                decimal balance;
                DateTime dueDate;

                if (paymentRoll < 0.58)
                {
                    paymentStatus = InvoicePaymentStatus.Paid;
                    isPaid = true;
                    paidAmount = finalTotal;
                    balance = 0m;
                    dueDate = date;
                }
                else if (paymentRoll < 0.82)
                {
                    paymentStatus = InvoicePaymentStatus.Partial;
                    isPaid = false;
                    paidAmount = Math.Round(finalTotal * (decimal)(0.25 + _rng.NextDouble() * 0.55), 2);
                    balance = finalTotal - paidAmount;
                    dueDate = date.AddDays(30);
                }
                else
                {
                    paymentStatus = InvoicePaymentStatus.Credit;
                    isPaid = false;
                    paidAmount = 0m;
                    balance = finalTotal;
                    dueDate = date.AddDays(_rng.Next(15, 45));
                }

                if (_rng.NextDouble() < 0.12 && paymentStatus != InvoicePaymentStatus.Paid)
                {
                    dueDate = date.AddDays(-_rng.Next(5, 60));
                }

                await _db.Sales.AddAsync(sale, ct);
                await _db.SaveChangesAsync(ct);

                var invoiceNumber = $"INV-2026-{invoiceSeq:D5}";
                invoiceSeq++;
                var invoice = new Invoice
                {
                    SaleId = sale.Id,
                    InvoiceNumber = invoiceNumber,
                    CreatedDate = date,
                    DueDate = dueDate,
                    PaymentStatus = paymentStatus,
                    PaidAmount = paidAmount,
                    BalanceAmount = balance,
                    IsPaid = isPaid,
                    IsSent = _rng.NextDouble() < 0.72,
                    SentDate = _rng.NextDouble() < 0.72 ? date.AddHours(_rng.Next(1, 48)) : null,
                    ReminderSentCount = paymentStatus == InvoicePaymentStatus.Credit ? _rng.Next(0, 4) : 0,
                    LastReminderDate = paymentStatus == InvoicePaymentStatus.Credit && _rng.NextDouble() < 0.4
                        ? date.AddDays(_rng.Next(10, 40))
                        : null,
                };

                await _db.Invoices.AddAsync(invoice, ct);
                await _db.SaveChangesAsync(ct);

                var customerName = await _db.Customers.Where(c => c.Id == customerId).Select(c => c.Name).FirstAsync(ct);
                summaries.Add(new SaleSummary(sale.Id, invoice.Id, invoiceNumber, customerId, customerName, date, finalTotal, discount, isPaid, paymentStatus));

                auditLogs.Add(new AuditLog
                {
                    Timestamp = date,
                    Action = "Invoice Generated",
                    Details = $"Invoice {invoiceNumber} generated — Rs. {finalTotal:N2} (incl. {VatRate:P0} VAT Rs. {vatAmount:N2}).",
                    Entity = $"Invoice #{invoice.Id}",
                    EntityType = "Invoice",
                    PerformedBy = "System",
                });

                if (discount > 0)
                {
                    auditLogs.Add(new AuditLog
                    {
                        Timestamp = date.AddMinutes(1),
                        Action = "Loyalty Reward Applied",
                        Details = $"10% loyalty discount Rs. {discount:N2} applied on order over Rs. {LoyaltyThreshold:N0}.",
                        Entity = $"Invoice #{invoice.Id}",
                        EntityType = "Invoice",
                        PerformedBy = "System",
                    });
                }

                auditLogs.Add(new AuditLog
                {
                    Timestamp = date.AddMinutes(3),
                    Action = "Order Completed",
                    Details = $"Sale #{sale.Id} completed with {sale.Items.Count} line item(s).",
                    Entity = $"Order #{sale.Id}",
                    EntityType = "Sale",
                    PerformedBy = $"Staff #{staffIds[_rng.Next(staffIds.Count)]}",
                });

                foreach (var item in sale.Items)
                {
                    stockLogs.Add(new InventoryStockLog
                    {
                        PartId = item.PartId,
                        QuantityChange = -item.Quantity,
                        Reason = $"Sale invoice {invoiceNumber}",
                        ReferenceType = "Sale",
                        ReferenceId = sale.Id,
                        CreatedAt = date,
                    });

                    auditLogs.Add(new AuditLog
                    {
                        Timestamp = date.AddMinutes(2),
                        Action = "Inventory Updated",
                        Details = $"Stock reduced by {item.Quantity} unit(s) for part #{item.PartId}.",
                        Entity = $"Inventory #{item.PartId}",
                        EntityType = "Inventory",
                        PerformedBy = $"Staff #{staffIds[_rng.Next(staffIds.Count)]}",
                    });
                }

                if (paidAmount > 0)
                {
                    var method = DemoDataCatalog.PaymentMethods[_rng.Next(DemoDataCatalog.PaymentMethods.Length)];
                    payments.Add(new InvoicePayment
                    {
                        InvoiceId = invoice.Id,
                        Amount = paidAmount,
                        PaymentMethod = method,
                        Notes = paymentStatus == InvoicePaymentStatus.Partial ? "Partial settlement" : null,
                        StaffId = staffIds[_rng.Next(staffIds.Count)],
                        CreatedAt = date.AddHours(_rng.Next(1, 72)),
                    });

                    auditLogs.Add(new AuditLog
                    {
                        Timestamp = date.AddHours(_rng.Next(2, 96)),
                        Action = "Payment Received",
                        Details = $"Payment of Rs. {paidAmount:N2} received via {method}. Balance: Rs. {balance:N2}",
                        Entity = $"Invoice #{invoice.Id}",
                        EntityType = "Invoice",
                        PerformedBy = customerName,
                    });
                }

                if (_rng.NextDouble() < 0.03)
                {
                    auditLogs.Add(new AuditLog
                    {
                        Timestamp = date.AddHours(4),
                        Action = "Failed Event",
                        Details = "Payment gateway timeout during online authorization attempt.",
                        Entity = $"Invoice #{invoice.Id}",
                        EntityType = "Invoice",
                        PerformedBy = "System",
                    });
                }

                if (auditLogs.Count >= 80)
                {
                    await _db.AuditLogs.AddRangeAsync(auditLogs, ct);
                    await _db.InventoryStockLogs.AddRangeAsync(stockLogs, ct);
                    await _db.InvoicePayments.AddRangeAsync(payments, ct);
                    await _db.SaveChangesAsync(ct);
                    auditLogs.Clear();
                    stockLogs.Clear();
                    payments.Clear();
                }
            }

            if (auditLogs.Count > 0)
            {
                await _db.AuditLogs.AddRangeAsync(auditLogs, ct);
                await _db.InventoryStockLogs.AddRangeAsync(stockLogs, ct);
                await _db.InvoicePayments.AddRangeAsync(payments, ct);
                await _db.SaveChangesAsync(ct);
            }

            return summaries;
        }

        private async Task UpdatePartQuantitiesAsync(List<int> partIds, Dictionary<int, int> stock, CancellationToken ct)
        {
            foreach (var partId in partIds)
            {
                var qty = Math.Max(0, stock.GetValueOrDefault(partId));
                if (qty < 3 && _rng.NextDouble() < 0.35)
                {
                    qty = _rng.Next(0, 4);
                }

                await _db.Parts.Where(p => p.Id == partId)
                    .ExecuteUpdateAsync(s => s.SetProperty(p => p.Quantity, qty), ct);
            }
        }

        private async Task SeedAppointmentsAsync(List<int> customerIds, CancellationToken ct)
        {
            if (await _db.ServiceAppointments.CountAsync(ct) >= 150)
            {
                return;
            }

            var statuses = new[] { "Scheduled", "Completed", "Cancelled", "In Progress" };
            var appointments = new List<ServiceAppointment>();
            var dates = GenerateWeightedDates(180, DemoDataCatalog.MonthlySaleWeight);

            foreach (var date in dates)
            {
                appointments.Add(new ServiceAppointment
                {
                    CustomerId = customerIds[_rng.Next(customerIds.Count)],
                    ServiceType = DemoDataCatalog.ServiceTypes[_rng.Next(DemoDataCatalog.ServiceTypes.Length)],
                    Status = statuses[_rng.Next(statuses.Length)],
                    Date = date,
                    VehicleNumber = $"BA {_rng.Next(1, 99)}-PA-{_rng.Next(1000, 9999)}",
                    Notes = _rng.NextDouble() < 0.3 ? "Customer requested morning slot" : null,
                    EstimatedCost = Math.Round((decimal)(_rng.Next(1500, 25000)), 0),
                    CreatedAt = date.AddDays(-_rng.Next(1, 7)),
                });
            }

            await _db.ServiceAppointments.AddRangeAsync(appointments, ct);
            await _db.SaveChangesAsync(ct);
        }

        private async Task SeedPartRequestsAsync(List<int> customerIds, List<int> staffIds, CancellationToken ct)
        {
            if (await _db.PartRequests.AnyAsync(ct))
            {
                return;
            }

            var statuses = new[] { "Pending", "Fulfilled", "Rejected", "In Progress" };
            var requests = new List<PartRequest>();
            for (var i = 0; i < 85; i++)
            {
                var created = RandomDateIn2026();
                var status = statuses[_rng.Next(statuses.Length)];
                requests.Add(new PartRequest
                {
                    CustomerId = customerIds[_rng.Next(customerIds.Count)],
                    PartName = DemoDataCatalog.PartTemplates[_rng.Next(DemoDataCatalog.PartTemplates.Length)].Name,
                    VehicleDetails = $"{DemoDataCatalog.VehicleBrands[_rng.Next(12)]} {DemoDataCatalog.VehicleModels[_rng.Next(12)]}",
                    Description = "Customer inquiry for availability and price quote.",
                    Quantity = _rng.Next(1, 5),
                    Status = status,
                    CreatedAt = created,
                    UpdatedAt = created.AddDays(_rng.Next(1, 5)),
                    FulfilledAt = status == "Fulfilled" ? created.AddDays(_rng.Next(2, 10)) : null,
                    FulfilledByStaffId = status == "Fulfilled" ? staffIds[_rng.Next(staffIds.Count)] : null,
                    ResponseNotes = status == "Fulfilled" ? "Part sourced from vendor — ready for pickup." : null,
                });
            }

            await _db.PartRequests.AddRangeAsync(requests, ct);
            await _db.SaveChangesAsync(ct);
        }

        private async Task SeedReviewsAsync(List<int> customerIds, CancellationToken ct)
        {
            if (await _db.Reviews.CountAsync(ct) >= 150)
            {
                return;
            }

            var statuses = new[] { "Pending", "Approved", "Rejected" };
            var reviews = new List<Review>();
            var usedDay = new HashSet<(int CustomerId, DateOnly Day)>();
            var attempts = 0;

            while (reviews.Count < 220 && attempts < 800)
            {
                attempts++;
                var customerId = customerIds[_rng.Next(customerIds.Count)];
                var day = DateOnly.FromDateTime(RandomDateIn2026());
                if (!usedDay.Add((customerId, day)))
                {
                    continue;
                }

                reviews.Add(new Review
                {
                    CustomerId = customerId,
                    Rating = _rng.Next(1, 6),
                    Title = _rng.NextDouble() < 0.7 ? "Service feedback" : null,
                    Comment = DemoDataCatalog.ReviewComments[_rng.Next(DemoDataCatalog.ReviewComments.Length)],
                    ServiceType = DemoDataCatalog.ServiceTypes[_rng.Next(DemoDataCatalog.ServiceTypes.Length)],
                    Status = statuses[_rng.Next(statuses.Length)],
                    CreatedAt = day.ToDateTime(TimeOnly.FromTimeSpan(TimeSpan.FromHours(_rng.Next(8, 20))), DateTimeKind.Utc),
                });
            }

            await _db.Reviews.AddRangeAsync(reviews, ct);
            await _db.SaveChangesAsync(ct);
        }

        private async Task SeedCommunityReviewsAsync(List<int> customerIds, CancellationToken ct)
        {
            if (await _db.CommunityReviews.CountAsync(ct) >= 50)
            {
                return;
            }

            var customers = await _db.Customers.AsNoTracking().Take(80).ToListAsync(ct);
            var reviews = new List<CommunityReview>();
            var statuses = new[] { "Pending", "Approved", "Rejected" };

            foreach (var c in customers)
            {
                if (_rng.NextDouble() > 0.55)
                {
                    continue;
                }

                reviews.Add(new CommunityReview
                {
                    CustomerId = c.Id,
                    CustomerName = c.Name,
                    Rating = _rng.Next(3, 6),
                    ReviewText = DemoDataCatalog.ReviewComments[_rng.Next(DemoDataCatalog.ReviewComments.Length)],
                    Status = statuses[_rng.Next(statuses.Length)],
                    CreatedAt = RandomDateIn2026(),
                });
            }

            await _db.CommunityReviews.AddRangeAsync(reviews, ct);
            await _db.SaveChangesAsync(ct);
        }

        private async Task SeedNotificationsAsync(CancellationToken ct)
        {
            if (await _db.Notifications.AnyAsync(ct))
            {
                return;
            }

            var lowStockParts = await _db.Parts.Where(p => p.Quantity < p.CriticalStockLevel).Take(12).ToListAsync(ct);
            var overdueInvoices = await _db.Invoices
                .Where(i => !i.IsPaid && i.BalanceAmount > 0 && i.DueDate < DateTime.UtcNow)
                .Take(15)
                .ToListAsync(ct);

            var notifications = new List<Notification>();
            foreach (var p in lowStockParts)
            {
                notifications.Add(new Notification
                {
                    Title = "Low Stock Alert",
                    Message = $"{p.Name} is below critical level ({p.Quantity} remaining).",
                    Type = "LowStock",
                    ReferenceId = $"part-{p.Id}",
                    IsRead = _rng.NextDouble() < 0.4,
                    CreatedAt = RandomDateIn2026(),
                });
            }

            foreach (var inv in overdueInvoices)
            {
                notifications.Add(new Notification
                {
                    Title = "Unpaid Credit Invoice",
                    Message = $"Invoice {inv.InvoiceNumber} has outstanding balance Rs. {inv.BalanceAmount:N2}.",
                    Type = "UnpaidCredit",
                    ReferenceId = $"invoice-{inv.Id}",
                    IsRead = _rng.NextDouble() < 0.35,
                    CreatedAt = inv.DueDate.AddDays(_rng.Next(1, 10)),
                });
            }

            await _db.Notifications.AddRangeAsync(notifications, ct);
            await _db.SaveChangesAsync(ct);

            var invNotifs = lowStockParts.Select(p => new InventoryNotification
            {
                PartId = p.Id,
                Message = $"Critical stock: {p.Name} ({p.Quantity} units left)",
                Severity = p.Quantity == 0 ? "Critical" : "Warning",
                IsRead = false,
                CreatedAt = DateTime.UtcNow.AddHours(-_rng.Next(1, 72)),
            }).ToList();

            await _db.InventoryNotifications.AddRangeAsync(invNotifs, ct);
            await _db.SaveChangesAsync(ct);
        }

        private async Task SeedEmailLogsAsync(CancellationToken ct)
        {
            if (await _db.EmailLogs.AnyAsync(ct))
            {
                return;
            }

            var creditInvoices = await _db.Invoices
                .Include(i => i.Sale)
                .Where(i => !i.IsPaid && i.BalanceAmount > 0)
                .Take(40)
                .ToListAsync(ct);

            var logs = creditInvoices.Select(inv => new EmailLog
            {
                CustomerId = inv.Sale!.CustomerId,
                InvoiceId = inv.Id,
                EmailType = CreditEmailTypes.FriendlyReminder,
                SentAt = (inv.LastReminderDate ?? inv.DueDate).AddHours(-2),
                Status = _rng.NextDouble() < 0.92 ? "Sent" : "Failed",
                ErrorMessage = _rng.NextDouble() < 0.08 ? "SMTP timeout" : null,
                IsAutomatic = true,
            }).ToList();

            await _db.EmailLogs.AddRangeAsync(logs, ct);
            await _db.SaveChangesAsync(ct);
        }

        private async Task SeedFuelLogsAsync(List<int> customerIds, CancellationToken ct)
        {
            if (await _db.FuelUsageLogs.AnyAsync(ct))
            {
                return;
            }

            var vehicles = await _db.CustomerVehicles.Take(90).ToListAsync(ct);
            var logs = new List<FuelUsageLog>();
            foreach (var v in vehicles)
            {
                for (var m = 0; m < _rng.Next(2, 7); m++)
                {
                    logs.Add(new FuelUsageLog
                    {
                        CustomerId = v.CustomerId,
                        VehicleId = v.Id,
                        OdometerKm = v.Mileage + m * _rng.Next(400, 1200),
                        FuelAmountLiters = Math.Round((decimal)(20 + _rng.NextDouble() * 45), 1),
                        FuelType = _rng.NextDouble() < 0.7 ? "Petrol" : "Diesel",
                        FuelCost = Math.Round((decimal)_rng.Next(3500, 12000), 0),
                        LogDate = RandomDateIn2026(),
                        Notes = m % 3 == 0 ? "Highway trip refill" : null,
                        CreatedAt = RandomDateIn2026(),
                    });
                }
            }

            await _db.FuelUsageLogs.AddRangeAsync(logs, ct);
            await _db.SaveChangesAsync(ct);
        }

        private async Task<int> SeedAuditLogsAsync(List<SaleSummary> sales, List<int> staffIds, CancellationToken ct)
        {
            var existing = await _db.AuditLogs.CountAsync(ct);
            if (existing >= 1500)
            {
                return existing;
            }

            var extra = new List<AuditLog>();
            var staff = await _db.Staff.AsNoTracking().ToListAsync(ct);

            foreach (var s in staff)
            {
                for (var d = 0; d < 24; d++)
                {
                    var day = DemoDataCatalog.YearStart.AddDays(d * 15 + _rng.Next(0, 10));
                    if (day >= DemoDataCatalog.YearEnd)
                    {
                        break;
                    }

                    extra.Add(new AuditLog
                    {
                        Timestamp = day.AddHours(8 + _rng.Next(0, 10)),
                        Action = "Login",
                        Details = "Successful staff login from dashboard.",
                        Entity = "Session",
                        EntityType = "Auth",
                        PerformedBy = s.FullName,
                    });
                    extra.Add(new AuditLog
                    {
                        Timestamp = day.AddHours(17 + _rng.Next(0, 3)),
                        Action = "Logout",
                        Details = "User session ended.",
                        Entity = "Session",
                        EntityType = "Auth",
                        PerformedBy = s.FullName,
                    });
                }
            }

            var pendingReviews = await _db.Reviews.Where(r => r.Status == "Pending").Take(30).ToListAsync(ct);
            foreach (var r in pendingReviews)
            {
                extra.Add(new AuditLog
                {
                    Timestamp = r.CreatedAt.AddHours(_rng.Next(4, 72)),
                    Action = "Review Submitted",
                    Details = $"Customer submitted a {r.Rating}-star review for {r.ServiceType}.",
                    Entity = $"Review #{r.Id}",
                    EntityType = "Review",
                    PerformedBy = $"Customer #{r.CustomerId}",
                });
                if (r.Status == "Approved" || _rng.NextDouble() < 0.5)
                {
                    extra.Add(new AuditLog
                    {
                        Timestamp = r.CreatedAt.AddDays(_rng.Next(1, 5)),
                        Action = "Review Moderated",
                        Details = $"Admin {(r.Status == "Approved" ? "approved" : "rejected")} review #{r.Id}.",
                        Entity = $"Review #{r.Id}",
                        EntityType = "Review",
                        PerformedBy = staff[_rng.Next(staff.Count)].FullName,
                    });
                }
            }

            var customers = await _db.Customers.OrderBy(_ => _rng.Next()).Take(40).ToListAsync(ct);
            foreach (var c in customers)
            {
                extra.Add(new AuditLog
                {
                    Timestamp = RandomDateIn2026(),
                    Action = "Profile Updated",
                    Details = "Customer contact phone and address updated.",
                    Entity = $"Customer #{c.Id}",
                    EntityType = "Customer",
                    PerformedBy = c.Name,
                });
            }

            await _db.AuditLogs.AddRangeAsync(extra, ct);
            await _db.SaveChangesAsync(ct);
            return await _db.AuditLogs.CountAsync(ct);
        }

        private async Task<int> SeedBackgroundJobRunsAsync(CancellationToken ct)
        {
            if (await _db.BackgroundJobRuns.CountAsync(ct) >= 500)
            {
                return await _db.BackgroundJobRuns.CountAsync(ct);
            }

            var runs = new List<BackgroundJobRun>();
            for (var day = DemoDataCatalog.YearStart; day < DemoDataCatalog.YearEnd; day = day.AddDays(1))
            {
                foreach (var job in DemoDataCatalog.BackgroundJobs)
                {
                    if (job.Key == "backup" && day.Day % 7 != 0)
                    {
                        continue;
                    }

                    var start = day.AddHours(_rng.Next(0, 23)).AddMinutes(_rng.Next(0, 59));
                    var failed = _rng.NextDouble() < 0.05;
                    var duration = _rng.Next(800, 45000);
                    runs.Add(new BackgroundJobRun
                    {
                        JobKey = job.Key,
                        JobName = job.Name,
                        Queue = job.Queue,
                        Status = failed ? "Failed" : "Success",
                        StartedAt = start,
                        CompletedAt = start.AddMilliseconds(duration),
                        DurationMs = duration,
                        Message = failed
                            ? "Worker timeout — retried automatically"
                            : $"{job.Name} completed successfully",
                    });
                }
            }

            await _db.BackgroundJobRuns.AddRangeAsync(runs, ct);
            await _db.SaveChangesAsync(ct);
            return runs.Count;
        }

        private List<DateTime> GenerateWeightedDates(int count, double[] monthlyWeights)
        {
            var dates = new List<DateTime>(count);
            var totalWeight = monthlyWeights.Sum();
            for (var i = 0; i < count; i++)
            {
                var roll = _rng.NextDouble() * totalWeight;
                var month = 0;
                var acc = 0d;
                for (var m = 0; m < 12; m++)
                {
                    acc += monthlyWeights[m];
                    if (roll <= acc)
                    {
                        month = m;
                        break;
                    }
                }

                var daysInMonth = DateTime.DaysInMonth(2026, month + 1);
                var day = _rng.Next(1, daysInMonth + 1);
                dates.Add(new DateTime(2026, month + 1, day, _rng.Next(8, 20), _rng.Next(0, 59), 0, DateTimeKind.Utc));
            }

            return dates.OrderBy(d => d).ToList();
        }

        private DateTime RandomDateIn2026()
        {
            var dayOffset = _rng.Next(0, 365);
            return DemoDataCatalog.YearStart.AddDays(dayOffset)
                .AddHours(_rng.Next(8, 20))
                .AddMinutes(_rng.Next(0, 59));
        }

        private async Task SyncStockFromDatabaseAsync(Dictionary<int, int> stock, CancellationToken ct)
        {
            var parts = await _db.Parts.AsNoTracking().Select(p => new { p.Id, p.Quantity }).ToListAsync(ct);
            foreach (var p in parts)
            {
                stock[p.Id] = p.Quantity;
            }
        }

        public async Task EnsureMinimumTestDataAsync(CancellationToken cancellationToken = default)
        {
            await EnsureAdminStaffAsync(cancellationToken);

            var vendorIds = await EnsureMinimumVendorsAsync(cancellationToken);
            await EnsureMinimumPartsAsync(vendorIds, cancellationToken);
            await EnsureTestCustomersWithVehiclesAsync(cancellationToken);

            _logger.LogInformation(
                "Minimum test data ready: {Vendors} vendors, {Parts} parts, {Customers} customers, {Vehicles} vehicles",
                await _db.Vendors.CountAsync(cancellationToken),
                await _db.Parts.CountAsync(cancellationToken),
                await _db.Customers.CountAsync(cancellationToken),
                await _db.CustomerVehicles.CountAsync(cancellationToken));
        }

        private async Task<List<int>> EnsureMinimumVendorsAsync(CancellationToken ct)
        {
            var minimumVendors = new[]
            {
                ("Kathmandu Auto Supplies", "Ramesh Thapa", "+9779811000001", "vendor.kathmandu@partshub.demo", "Thamel, Kathmandu"),
                ("Pokhara Parts Hub", "Sita Gurung", "+9779811000002", "vendor.pokhara@partshub.demo", "Lakeside, Pokhara"),
                ("Lalitpur Motor Traders", "Bikash Shrestha", "+9779811000003", "vendor.lalitpur@partshub.demo", "Pulchowk, Lalitpur"),
                ("Bhaktapur Spare Center", "Anita Maharjan", "+9779811000004", "vendor.bhaktapur@partshub.demo", "Suryabinayak, Bhaktapur"),
                ("Chitwan Vehicle Parts", "Nabin Karki", "+9779811000005", "vendor.chitwan@partshub.demo", "Bharatpur, Chitwan"),
            };

            foreach (var (name, contact, phone, email, address) in minimumVendors)
            {
                if (await _db.Vendors.AnyAsync(v => v.Email == email, ct))
                {
                    continue;
                }

                _db.Vendors.Add(new Vendor
                {
                    Name = name,
                    ContactPerson = contact,
                    Phone = phone,
                    Email = email,
                    Address = address,
                    Notes = "Seeded for testing",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                });
            }

            if (_db.ChangeTracker.HasChanges())
            {
                await _db.SaveChangesAsync(ct);
            }

            if (await _db.Vendors.CountAsync(ct) < 5)
            {
                return await SeedVendorsAsync(ct);
            }

            return await _db.Vendors.OrderBy(v => v.Id).Select(v => v.Id).Take(15).ToListAsync(ct);
        }

        private async Task EnsureMinimumPartsAsync(List<int> vendorIds, CancellationToken ct)
        {
            if (vendorIds.Count == 0)
            {
                return;
            }

            var minimumParts = new[]
            {
                ("TEST-BRK-001", "Front Brake Pads Set", "Brakes", 1200m, 1680m, 40),
                ("TEST-OIL-002", "Engine Oil 5W-30 (4L)", "Fluids", 2800m, 3500m, 35),
                ("TEST-FLT-003", "Air Filter", "Filters", 450m, 650m, 50),
                ("TEST-SPK-004", "Spark Plug (Iridium)", "Ignition", 380m, 550m, 60),
                ("TEST-ALT-005", "Alternator Belt", "Belts", 720m, 980m, 30),
                ("TEST-RAD-006", "Radiator Coolant (1L)", "Cooling", 320m, 480m, 45),
                ("TEST-WPR-007", "Wiper Blade Pair", "Exterior", 550m, 790m, 25),
                ("TEST-BAT-008", "12V Car Battery 45Ah", "Electrical", 8500m, 10900m, 12),
                ("TEST-SHP-009", "Shock Absorber Front", "Suspension", 4200m, 5600m, 18),
                ("TEST-CLT-010", "Clutch Plate Kit", "Transmission", 6500m, 8200m, 10),
            };

            var vendorIndex = 0;
            foreach (var (partNumber, name, category, cost, price, qty) in minimumParts)
            {
                if (await _db.Parts.AnyAsync(p => p.PartNumber == partNumber, ct))
                {
                    continue;
                }

                _db.Parts.Add(new Part
                {
                    PartNumber = partNumber,
                    Name = name,
                    Category = category,
                    Description = $"Test catalog part — {name}",
                    CostPrice = cost,
                    Price = price,
                    Quantity = qty,
                    CriticalStockLevel = 5,
                    IsActive = true,
                    VendorId = vendorIds[vendorIndex % vendorIds.Count],
                    CreatedAt = DateTime.UtcNow,
                });
                vendorIndex++;
            }

            if (_db.ChangeTracker.HasChanges())
            {
                await _db.SaveChangesAsync(ct);
            }

            if (await _db.Parts.CountAsync(ct) < 15)
            {
                await SeedPartsAsync(vendorIds, ct);
            }
        }

        private async Task EnsureTestCustomersWithVehiclesAsync(CancellationToken ct)
        {
            var passwordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123");
            var testAccounts = new[]
            {
                ("vehicle.test1@partshub.local", "Aarav Sharma", "BA 1-PA-4521", "Honda", "Civic", 2020),
                ("vehicle.test2@partshub.local", "Priya Karki", "BA 2-PA-7832", "Toyota", "Corolla", 2019),
                ("vehicle.test3@partshub.local", "Rohan Thapa", "BA 3-PA-1198", "Hyundai", "Creta", 2021),
                ("vehicle.test4@partshub.local", "Sneha Gurung", "BA 4-PA-5567", "Suzuki", "Swift", 2018),
                ("vehicle.test5@partshub.local", "Kiran Maharjan", "BA 5-PA-9023", "Mahindra", "Scorpio", 2017),
            };

            var accountIndex = 0;
            foreach (var (email, name, plate, brand, model, year) in testAccounts)
            {
                var customer = await _db.Customers
                    .Include(c => c.Vehicles)
                    .FirstOrDefaultAsync(c => c.Email == email, ct);

                if (customer is null)
                {
                    customer = new Customer
                    {
                        Name = name,
                        Email = email,
                        Phone = $"+97798{11000000 + accountIndex:D8}"[..14],
                        Address = "Kathmandu, Nepal",
                        PasswordHash = passwordHash,
                        CreatedAt = DateTime.UtcNow,
                    };
                    _db.Customers.Add(customer);
                    await _db.SaveChangesAsync(ct);
                }

                if (customer.Vehicles.Any(v => v.VehicleNumber == plate))
                {
                    continue;
                }

                _db.CustomerVehicles.Add(new CustomerVehicle
                {
                    CustomerId = customer.Id,
                    VehicleNumber = plate,
                    Brand = brand,
                    Model = model,
                    Year = year,
                    Mileage = 25000 + year,
                    Vin = $"TESTVIN{customer.Id}{year}",
                    Notes = "Registered for customer portal testing",
                });

                accountIndex++;
            }

            if (_db.ChangeTracker.HasChanges())
            {
                await _db.SaveChangesAsync(ct);
            }

            var customersWithoutVehicles = await _db.Customers
                .Where(c => !c.Vehicles.Any())
                .Take(20)
                .ToListAsync(ct);

            foreach (var customer in customersWithoutVehicles)
            {
                _db.CustomerVehicles.Add(new CustomerVehicle
                {
                    CustomerId = customer.Id,
                    VehicleNumber = $"BA {customer.Id}-PA-{_rng.Next(1000, 9999)}",
                    Brand = "Toyota",
                    Model = "Yaris",
                    Year = 2016,
                    Mileage = _rng.Next(10000, 120000),
                });
            }

            if (_db.ChangeTracker.HasChanges())
            {
                await _db.SaveChangesAsync(ct);
            }
        }
    }
}
