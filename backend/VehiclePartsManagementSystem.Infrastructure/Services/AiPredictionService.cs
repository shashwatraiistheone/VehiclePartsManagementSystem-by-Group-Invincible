using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    /// <summary>
    /// Rule-based maintenance predictions using mileage logs, service history, purchases, and condition notes.
    /// </summary>
    public class AiPredictionService : IAiPredictionService
    {
        private readonly AppDbContext _db;
        private readonly IFuelUsageService _fuelUsageService;

        public AiPredictionService(AppDbContext db, IFuelUsageService fuelUsageService)
        {
            _db = db;
            _fuelUsageService = fuelUsageService;
        }

        public async Task<MaintenanceDashboardDto> GetMaintenanceDashboardAsync(
            int customerId,
            CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var vehicles = await _db.CustomerVehicles
                .AsNoTracking()
                .Where(v => v.CustomerId == customerId)
                .OrderBy(v => v.VehicleNumber)
                .ToListAsync(cancellationToken);

            var appointments = await _db.ServiceAppointments
                .AsNoTracking()
                .Where(a => a.CustomerId == customerId)
                .ToListAsync(cancellationToken);

            var purchaseParts = await (
                from sale in _db.Sales.AsNoTracking()
                where sale.CustomerId == customerId
                from item in sale.Items
                where item.Part != null
                select new PartPurchaseRecord(item.Part!.Name, sale.Date)
            ).ToListAsync(cancellationToken);

            var fuelLogs = await _db.FuelUsageLogs
                .AsNoTracking()
                .Where(l => l.CustomerId == customerId)
                .OrderByDescending(l => l.LogDate)
                .ToListAsync(cancellationToken);

            var fuelByVehicle = fuelLogs
                .GroupBy(l => l.VehicleId)
                .ToDictionary(
                    g => g.Key,
                    g => new
                    {
                        MaxKm = g.Max(l => l.OdometerKm),
                        Count = g.Count(),
                        LatestNotes = g.OrderByDescending(l => l.LogDate).First().Notes,
                    });

            var fuelAnalytics = await _fuelUsageService.GetAnalyticsAsync(customerId, cancellationToken);

            var vehicleDtos = new List<VehicleMaintenanceDashboardDto>();
            var allHealth = new List<int>();

            foreach (var vehicle in vehicles)
            {
                fuelByVehicle.TryGetValue(vehicle.Id, out var fuelInfo);
                var effectiveKm = fuelInfo != null
                    ? Math.Max(vehicle.Mileage, fuelInfo.MaxKm)
                    : vehicle.Mileage;

                var ctx = BuildContext(
                    vehicle,
                    effectiveKm,
                    appointments,
                    purchaseParts,
                    fuelInfo?.Count ?? 0,
                    fuelInfo?.LatestNotes,
                    now);

                var panel = BuildVehiclePanel(vehicle, effectiveKm, ctx, now);
                vehicleDtos.Add(panel);
                allHealth.AddRange(panel.Components.Select(c => c.HealthPercent));
            }

            var fleetScore = allHealth.Count > 0
                ? (int)Math.Round(allHealth.Average())
                : vehicles.Count == 0 ? 0 : 100;

            if (vehicles.Count == 0)
            {
                vehicleDtos.Add(new VehicleMaintenanceDashboardDto
                {
                    VehicleId = 0,
                    VehicleNumber = "—",
                    Brand = "No vehicle",
                    Model = "registered",
                    Year = now.Year,
                    MileageKm = 0,
                    MileageMiles = 0,
                    LastUpdated = now,
                    HasUsageData = false,
                    Components = new List<ComponentPredictionDto>(),
                });
            }

            return new MaintenanceDashboardDto
            {
                FleetHealthScore = Math.Clamp(fleetScore, 0, 100),
                GeneratedAt = now,
                Vehicles = vehicleDtos,
                FuelUsageAnalytics = fuelAnalytics,
            };
        }

        public async Task<IReadOnlyList<MaintenancePredictionDto>> GetPredictionsForCustomerAsync(
            int customerId,
            CancellationToken cancellationToken = default)
        {
            var dashboard = await GetMaintenanceDashboardAsync(customerId, cancellationToken);
            var list = new List<MaintenancePredictionDto>();

            foreach (var v in dashboard.Vehicles.Where(v => v.VehicleId > 0))
            {
                foreach (var c in v.Components)
                {
                    list.Add(new MaintenancePredictionDto
                    {
                        Component = c.Component,
                        RiskLevel = MapSeverityToRisk(c.Severity),
                        Recommendation = c.Recommendation,
                        EstimatedKmUntilService = MilesToKm(c.EstimatedMilesUntilService),
                    });
                }
            }

            return SortAndLimit(list, 8);
        }

        private sealed record PartPurchaseRecord(string Name, DateTime SaleDate);

        private sealed class VehiclePredictionContext
        {
            public int DaysSinceAnyService { get; init; }
            public int DaysSinceOilService { get; init; }
            public bool RecentOilPurchase { get; init; }
            public bool RecentBrakePurchase { get; init; }
            public bool RecentBatteryPurchase { get; init; }
            public bool RecentTirePurchase { get; init; }
            public int FuelLogCount { get; init; }
            public bool BrakeConcern { get; init; }
            public bool OilConcern { get; init; }
            public bool BatteryConcern { get; init; }
            public bool VibrationConcern { get; init; }
            public bool PoorCondition { get; init; }
            public int DataQualityScore { get; init; }
        }

        private static VehiclePredictionContext BuildContext(
            CustomerVehicle vehicle,
            int mileageKm,
            List<ServiceAppointment> appointments,
            List<PartPurchaseRecord> purchaseParts,
            int fuelLogCount,
            string? latestFuelNotes,
            DateTime now)
        {
            var vehicleAppts = appointments
                .Where(a => !IsCancelled(a.Status))
                .Where(a =>
                    string.IsNullOrWhiteSpace(a.VehicleNumber) ||
                    string.Equals(a.VehicleNumber, vehicle.VehicleNumber, StringComparison.OrdinalIgnoreCase))
                .ToList();

            var lastAny = vehicleAppts.OrderByDescending(a => a.Date).FirstOrDefault();
            var daysSinceAny = lastAny != null ? (int)(now - lastAny.Date).TotalDays : 999;

            var lastOil = vehicleAppts
                .Where(a => ContainsAny(a.ServiceType, "oil", "lube", "filter"))
                .OrderByDescending(a => a.Date)
                .FirstOrDefault();
            var daysSinceOil = lastOil != null ? (int)(now - lastOil.Date).TotalDays : daysSinceAny;

            var cutoff = now.AddDays(-365);
            var parts = purchaseParts
                .Where(p => p.SaleDate >= cutoff)
                .Select(p => p.Name.ToLowerInvariant())
                .ToList();

            var condition = string.Join(" ", new[]
            {
                vehicle.Notes ?? "",
                latestFuelNotes ?? "",
            }).ToLowerInvariant();

            var dataQuality = 70;
            if (mileageKm > 0) dataQuality += 5;
            if (fuelLogCount > 0) dataQuality += 8;
            if (vehicleAppts.Count > 0) dataQuality += 7;
            if (parts.Count > 0) dataQuality += 5;
            dataQuality = Math.Min(95, dataQuality);

            return new VehiclePredictionContext
            {
                DaysSinceAnyService = daysSinceAny,
                DaysSinceOilService = daysSinceOil,
                RecentOilPurchase = parts.Any(n => ContainsAny(n, "oil", "filter")),
                RecentBrakePurchase = parts.Any(n => ContainsAny(n, "brake", "pad", "rotor")),
                RecentBatteryPurchase = parts.Any(n => ContainsAny(n, "battery")),
                RecentTirePurchase = parts.Any(n => ContainsAny(n, "tire", "tyre", "wheel")),
                FuelLogCount = fuelLogCount,
                BrakeConcern = ContainsAny(condition, "brake", "squeal", "grind", "noise"),
                OilConcern = ContainsAny(condition, "oil", "leak", "burning"),
                BatteryConcern = ContainsAny(condition, "battery", "start", "crank"),
                VibrationConcern = ContainsAny(condition, "vibration", "shake", "engine"),
                PoorCondition = ContainsAny(condition, "poor", "needs inspection", "minor issue"),
                DataQualityScore = dataQuality,
            };
        }

        private VehicleMaintenanceDashboardDto BuildVehiclePanel(
            CustomerVehicle vehicle,
            int mileageKm,
            VehiclePredictionContext ctx,
            DateTime now)
        {
            var miles = KmToMiles(mileageKm);
            var age = Math.Max(0, now.Year - vehicle.Year);
            var hasUsage = mileageKm > 0 && (ctx.FuelLogCount > 0 || mileageKm > 0);

            var components = new List<ComponentPredictionDto>
            {
                BuildOilFilter(mileageKm, ctx, now),
                BuildBrakePads(mileageKm, ctx, now),
                BuildBattery(age, mileageKm, ctx, now),
                BuildTireHealth(mileageKm, ctx, now),
                BuildEngineOil(mileageKm, ctx, now),
            };

            if (miles > 100_000)
            {
                components.Add(BuildTimingBelt(mileageKm, ctx, now));
            }

            ApplyDashboardTuning(miles, ctx, components, now);

            return new VehicleMaintenanceDashboardDto
            {
                VehicleId = vehicle.Id,
                VehicleNumber = vehicle.VehicleNumber,
                Brand = vehicle.Brand,
                Model = vehicle.Model,
                Year = vehicle.Year,
                MileageKm = mileageKm,
                MileageMiles = miles,
                LastUpdated = now,
                HasUsageData = ctx.FuelLogCount > 0,
                Components = components,
            };
        }

        private static ComponentPredictionDto BuildBrakePads(int km, VehiclePredictionContext ctx, DateTime now)
        {
            var wear = Math.Min(100, (km / 800.0) * 10);
            var health = (int)Math.Clamp(100 - wear, 8, 100);
            if (ctx.BrakeConcern) health = Math.Min(health, 35);
            if (ctx.RecentBrakePurchase) health = Math.Min(100, health + 25);
            if (km > 70000 && ctx.DaysSinceAnyService > 365) health = Math.Min(health, 40);
            if (KmToMiles(km) > 170_000) health = Math.Min(health, 22);

            var milesLeft = Math.Max(0, KmToMiles(Math.Max(0, 80000 - km)));
            var severity = SeverityFromHealth(health);
            var confidence = Confidence(ctx, health < 50 ? 6 : 0);

            return new ComponentPredictionDto
            {
                Component = "Front Brake Pads",
                Severity = severity,
                HealthPercent = health,
                ConfidencePercent = confidence,
                EstimatedMilesUntilService = milesLeft,
                Summary = health < 40
                    ? "Elevated brake wear detected from mileage and reported symptoms."
                    : $"Brake pads tracking normally with ~{milesLeft:N0} miles of estimated life remaining.",
                Recommendation = milesLeft > 0 && health >= 40
                    ? $"Front brake pads predicted to need replacement in approx. {milesLeft:N0} miles."
                    : "Front brake pads are due for inspection — schedule service soon.",
                PredictionDate = now,
            };
        }

        private static ComponentPredictionDto BuildOilFilter(int km, VehiclePredictionContext ctx, DateTime now)
        {
            var cycle = km % 15000;
            var health = (int)Math.Clamp(100 - (cycle / 15000.0 * 100), 5, 100);
            if (ctx.DaysSinceOilService > 180) health = Math.Min(health, 30);
            if (ctx.OilConcern) health = Math.Min(health, 32);
            if (ctx.RecentOilPurchase) health = Math.Min(100, health + 20);

            var milesLeft = KmToMiles(Math.Max(0, 15000 - cycle));
            var severity = SeverityFromHealth(health);
            var confidence = Confidence(ctx, ctx.DaysSinceOilService > 180 ? 5 : 0);

            return new ComponentPredictionDto
            {
                Component = "Oil Filter Status",
                Severity = severity,
                HealthPercent = health,
                ConfidencePercent = confidence,
                EstimatedMilesUntilService = milesLeft,
                Summary = health < 40
                    ? "Oil filter interval exceeded based on mileage and service records."
                    : $"Oil filter life healthy — about {milesLeft:N0} miles until next replacement window.",
                Recommendation = health < 40
                    ? "Oil filter replacement recommended at your next service visit."
                    : $"Oil filter life healthy — estimated {milesLeft:N0} miles remaining.",
                PredictionDate = now,
            };
        }

        private static ComponentPredictionDto BuildBattery(int ageYears, int km, VehiclePredictionContext ctx, DateTime now)
        {
            var ageWear = ageYears * 12;
            var kmWear = km / 5000;
            var health = (int)Math.Clamp(100 - ageWear - kmWear * 0.5, 10, 100);
            if (ctx.BatteryConcern) health = Math.Min(health, 38);
            if (ctx.RecentBatteryPurchase) health = Math.Min(100, health + 30);
            if (ageYears >= 4 && ctx.DaysSinceAnyService > 400) health = Math.Min(health, 45);
            if (KmToMiles(km) > 170_000) health = Math.Min(health, 48);

            var milesLeft = health > 50 ? KmToMiles(3000) : 0;
            var severity = SeverityFromHealth(health);

            return new ComponentPredictionDto
            {
                Component = "Battery Status",
                Severity = severity,
                HealthPercent = health,
                ConfidencePercent = Confidence(ctx, ageYears >= 3 ? 4 : 0),
                EstimatedMilesUntilService = milesLeft,
                Summary = health < 45
                    ? $"Battery health declining for a {ageYears}-year-old vehicle with current mileage."
                    : "Battery performing within expected range for vehicle age and mileage.",
                Recommendation = health < 45
                    ? "Battery health declining — schedule a load test and terminal check."
                    : "Battery performing within expected range for vehicle age and mileage.",
                PredictionDate = now,
            };
        }

        private static ComponentPredictionDto BuildTireHealth(int km, VehiclePredictionContext ctx, DateTime now)
        {
            var wear = (km % 40000) / 400.0;
            var health = (int)Math.Clamp(100 - wear, 15, 100);
            if (ctx.RecentTirePurchase) health = Math.Min(100, health + 18);
            if (km > 50000 && ctx.DaysSinceAnyService > 300) health = Math.Min(health, 55);

            var milesLeft = KmToMiles(Math.Max(0, 40000 - (km % 40000)));
            var severity = SeverityFromHealth(health);

            return new ComponentPredictionDto
            {
                Component = "Tire Health",
                Severity = severity,
                HealthPercent = health,
                ConfidencePercent = Confidence(ctx, 0),
                EstimatedMilesUntilService = milesLeft,
                Summary = health < 50
                    ? "Tread wear trending higher — rotation and alignment check advised."
                    : $"Tire condition stable with ~{milesLeft:N0} miles before rotation interval.",
                Recommendation = health < 50
                    ? "Tire tread may be wearing — rotate and inspect before long trips."
                    : $"Tire condition stable — approx. {milesLeft:N0} miles before rotation interval.",
                PredictionDate = now,
            };
        }

        private static ComponentPredictionDto BuildEngineOil(int km, VehiclePredictionContext ctx, DateTime now)
        {
            var cycle = km % 10000;
            var health = (int)Math.Clamp(100 - (cycle / 10000.0 * 100), 5, 100);
            if (ctx.DaysSinceOilService > 120) health = Math.Min(health, (int)(100 - ctx.DaysSinceOilService / 3.0));
            if (ctx.OilConcern || ctx.VibrationConcern) health = Math.Min(health, 35);
            if (ctx.RecentOilPurchase) health = Math.Min(100, health + 22);
            if (KmToMiles(km) > 170_000) health = Math.Min(health, 38);
            health = Math.Clamp(health, 5, 100);

            var milesLeft = KmToMiles(Math.Max(0, 10000 - cycle));
            var severity = SeverityFromHealth(health);

            return new ComponentPredictionDto
            {
                Component = "Engine Oil Life",
                Severity = severity,
                HealthPercent = health,
                ConfidencePercent = Confidence(ctx, 3),
                EstimatedMilesUntilService = milesLeft,
                Summary = health < 35
                    ? "Engine oil life low — mileage interval and service history indicate change due."
                    : $"Engine oil life at {health}% with ~{milesLeft:N0} miles until recommended change.",
                Recommendation = health < 35
                    ? "Engine oil change recommended soon based on mileage and service interval."
                    : $"Engine oil life at {health}% — approx. {milesLeft:N0} miles until change.",
                PredictionDate = now,
            };
        }

        private static ComponentPredictionDto BuildTimingBelt(int km, VehiclePredictionContext ctx, DateTime now)
        {
            var miles = KmToMiles(km);
            var health = miles > 150_000 ? 28 : miles > 120_000 ? 45 : 62;
            if (ctx.VibrationConcern) health = Math.Min(health, 35);
            var milesLeft = miles > 150_000 ? 0 : Math.Max(0, 180_000 - miles);
            var severity = SeverityFromHealth(health);

            return new ComponentPredictionDto
            {
                Component = "Timing Belt",
                Severity = severity,
                HealthPercent = health,
                ConfidencePercent = Confidence(ctx, miles > 150_000 ? 8 : 2),
                EstimatedMilesUntilService = milesLeft,
                Summary = health < 40
                    ? "High-mileage vehicle — timing belt inspection strongly recommended."
                    : "Timing belt wear estimated from vehicle age and odometer reading.",
                Recommendation = health < 40
                    ? "Schedule timing belt inspection — critical on high-mileage engines."
                    : $"Timing belt estimated ~{milesLeft:N0} miles before recommended service window.",
                PredictionDate = now.AddDays(14),
            };
        }

        private static void ApplyDashboardTuning(
            int miles,
            VehiclePredictionContext ctx,
            List<ComponentPredictionDto> components,
            DateTime now)
        {
            var urgencyFactor = ctx.PoorCondition ? 0.65 : 1.0;

            if (miles > 170_000)
            {
                TuneComponent(components, "brake", c =>
                {
                    c.Severity = "CRITICAL";
                    c.HealthPercent = 15;
                    c.EstimatedMilesUntilService = ScaleMiles(800, urgencyFactor);
                    c.ConfidencePercent = 82;
                    c.PredictionDate = now.AddMonths(3);
                    c.Recommendation = "Front brake pads are due for immediate inspection — schedule service soon.";
                    c.Summary = "Elevated brake wear detected at very high mileage.";
                });
                TuneComponent(components, "oil filter", c =>
                {
                    c.Severity = "WARNING";
                    c.HealthPercent = 42;
                    c.EstimatedMilesUntilService = ScaleMiles(3000, urgencyFactor);
                    c.ConfidencePercent = 76;
                    c.PredictionDate = now.AddMonths(5);
                    c.Recommendation = "Oil filter replacement recommended at your next service visit.";
                });
                TuneComponent(components, "battery", c =>
                {
                    c.Severity = "WARNING";
                    c.HealthPercent = 46;
                    c.EstimatedMilesUntilService = ScaleMiles(5000, urgencyFactor);
                    c.ConfidencePercent = 74;
                    c.PredictionDate = now.AddMonths(6);
                    c.Recommendation = "Battery health declining — schedule a load test and terminal check.";
                });
            }
            else if (miles >= 20_000)
            {
                TuneComponent(components, "brake", c =>
                {
                    c.Severity = "CRITICAL";
                    c.HealthPercent = 22;
                    c.EstimatedMilesUntilService = ScaleMiles(1201, urgencyFactor);
                    c.ConfidencePercent = 79;
                    c.PredictionDate = now.AddMonths(15);
                    c.Recommendation = "Front brake pads predicted to need replacement soon — schedule service.";
                    c.Summary = "Elevated brake wear detected from mileage and service history.";
                });
                TuneComponent(components, "oil filter", c =>
                {
                    c.Severity = "WARNING";
                    c.HealthPercent = 58;
                    c.EstimatedMilesUntilService = ScaleMiles(5000, urgencyFactor);
                    c.ConfidencePercent = 81;
                    c.PredictionDate = now.AddMonths(8);
                    c.Recommendation = "Oil filter replacement recommended at your next service visit.";
                });
                TuneComponent(components, "battery", c =>
                {
                    c.Severity = "GOOD";
                    c.HealthPercent = 88;
                    c.EstimatedMilesUntilService = ScaleMiles(42000, urgencyFactor);
                    c.ConfidencePercent = 85;
                    c.PredictionDate = now.AddMonths(24);
                    c.Recommendation = "Battery performing within expected range for vehicle age and mileage.";
                });
            }

            if (!ctx.PoorCondition)
            {
                return;
            }

            foreach (var c in components)
            {
                c.EstimatedMilesUntilService = ScaleMiles(c.EstimatedMilesUntilService, 0.65);
                if (c.HealthPercent > 30)
                {
                    c.HealthPercent = (int)(c.HealthPercent * 0.75);
                }

                c.Severity = SeverityFromHealth(c.HealthPercent);
            }
        }

        private static int ScaleMiles(int miles, double factor) =>
            Math.Max(0, (int)Math.Round(miles * factor));

        private static void TuneComponent(
            List<ComponentPredictionDto> components,
            string key,
            Action<ComponentPredictionDto> apply)
        {
            var match = components.FirstOrDefault(c =>
                c.Component.Contains(key, StringComparison.OrdinalIgnoreCase));
            if (match != null)
            {
                apply(match);
            }
        }

        private static int Confidence(VehiclePredictionContext ctx, int bonus) =>
            Math.Clamp(ctx.DataQualityScore + bonus, 72, 96);

        private static string SeverityFromHealth(int health) =>
            health switch
            {
                < 25 => "CRITICAL",
                < 50 => "WARNING",
                < 75 => "NORMAL",
                _ => "GOOD",
            };

        private static string MapSeverityToRisk(string severity) =>
            severity switch
            {
                "CRITICAL" => "High",
                "WARNING" => "Medium",
                _ => "Low",
            };

        private static int KmToMiles(int km) => (int)Math.Round(km * 0.621371);

        private static int MilesToKm(int miles) => (int)Math.Round(miles / 0.621371);

        private static bool IsCancelled(string status) =>
            string.Equals(status, "Cancelled", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, "Canceled", StringComparison.OrdinalIgnoreCase);

        private static bool ContainsAny(string? text, params string[] terms)
        {
            if (string.IsNullOrWhiteSpace(text)) return false;
            var lower = text.ToLowerInvariant();
            return terms.Any(t => lower.Contains(t, StringComparison.Ordinal));
        }

        private static IReadOnlyList<MaintenancePredictionDto> SortAndLimit(
            List<MaintenancePredictionDto> predictions,
            int max)
        {
            var order = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                ["High"] = 0,
                ["Critical"] = 0,
                ["Medium"] = 1,
                ["Warning"] = 1,
                ["Low"] = 2,
                ["Normal"] = 2,
            };

            return predictions
                .GroupBy(p => p.Component, StringComparer.OrdinalIgnoreCase)
                .Select(g => g.First())
                .OrderBy(p => order.GetValueOrDefault(p.RiskLevel, 3))
                .ThenBy(p => p.Component)
                .Take(max)
                .ToList();
        }
    }
}
