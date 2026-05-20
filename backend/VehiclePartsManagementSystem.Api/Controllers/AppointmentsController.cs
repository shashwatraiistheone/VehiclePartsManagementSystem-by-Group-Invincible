using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Claims;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Application.Services;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IAppointmentsExportService _exportService;

        public AppointmentsController(AppDbContext db, IAppointmentsExportService exportService)
        {
            _db = db;
            _exportService = exportService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<AppointmentsListResponseDto>> GetAll(
            [FromQuery] string? status,
            [FromQuery] string? fromDate,
            [FromQuery] string? toDate,
            [FromQuery] string? serviceType,
            [FromQuery] string? search,
            CancellationToken cancellationToken)
        {
            return Ok(await QueryAppointments(
                null,
                status,
                fromDate,
                toDate,
                serviceType,
                search,
                cancellationToken));
        }

        [HttpGet("export/pdf")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> ExportPdf(
            [FromQuery] string? status,
            [FromQuery] string? fromDate,
            [FromQuery] string? toDate,
            [FromQuery] string? serviceType,
            [FromQuery] string? search,
            CancellationToken cancellationToken)
        {
            var pdf = await _exportService.ExportPdfAsync(
                status,
                fromDate,
                toDate,
                serviceType,
                search,
                cancellationToken);
            var fileName = $"appointments-report-{DateTime.UtcNow:yyyy-MM-dd}.pdf";
            return File(pdf, "application/pdf", fileName);
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<AppointmentDetailDto>> GetById(int id, CancellationToken cancellationToken)
        {
            var detail = await GetAppointmentDetailAsync(id, cancellationToken);
            if (detail == null)
            {
                return NotFound(new { message = "Appointment not found." });
            }

            return Ok(detail);
        }

        [HttpPut("{id:int}/confirm")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> Confirm(int id, CancellationToken cancellationToken)
        {
            var appt = await _db.ServiceAppointments.FindAsync([id], cancellationToken);
            if (appt == null)
            {
                return NotFound(new { message = "Appointment not found." });
            }

            appt.Status = "Approved";
            await _db.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Appointment confirmed.", status = appt.Status });
        }

        [HttpPut("{id:int}/cancel")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> CancelAppointment(int id, CancellationToken cancellationToken)
        {
            var appt = await _db.ServiceAppointments.FindAsync([id], cancellationToken);
            if (appt == null)
            {
                return NotFound(new { message = "Appointment not found." });
            }

            appt.Status = "Cancelled";
            await _db.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Appointment cancelled.", status = appt.Status });
        }

        [HttpPut("{id:int}/reschedule")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> Reschedule(
            int id,
            [FromBody] RescheduleAppointmentDto dto,
            CancellationToken cancellationToken)
        {
            var appt = await _db.ServiceAppointments.FindAsync([id], cancellationToken);
            if (appt == null)
            {
                return NotFound(new { message = "Appointment not found." });
            }

            if (!DateOnly.TryParseExact(dto.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var day))
            {
                return BadRequest(new { message = "Invalid date. Use yyyy-MM-dd." });
            }

            var time = string.IsNullOrWhiteSpace(dto.Time) ? "09:00" : dto.Time.Trim();
            var tzOffset = GetTimezoneOffsetMinutes();
            var newUtc = AppointmentBookingRules.SlotToUtc(day, time, tzOffset);

            var validationError = await ValidateBookingAsync(
                newUtc,
                tzOffset,
                enforceAdvanceRule: false,
                cancellationToken,
                excludeAppointmentId: appt.Id);
            if (validationError != null)
            {
                return BadRequest(new { message = validationError });
            }

            appt.Date = newUtc;
            if (string.Equals(appt.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                appt.Status = "Scheduled";
            }

            await _db.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Appointment rescheduled.", date = appt.Date });
        }

        [HttpGet("my")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<List<AppointmentDto>>> GetMy(CancellationToken cancellationToken)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId == null)
            {
                return Unauthorized(new { message = "Customer account not found." });
            }

            var list = await QueryAppointments(customerId, null, null, null, null, null, cancellationToken);
            return Ok(list.Items);
        }

        [HttpGet("service-types")]
        [Authorize(Roles = "Admin,Staff,Customer")]
        public async Task<ActionResult<List<string>>> GetServiceTypes(CancellationToken cancellationToken)
        {
            var defaults = new[]
            {
                "General service",
                "Oil change",
                "Brake inspection",
                "Diagnostics",
                "Tire rotation",
                "Battery check",
                "AC service",
            };

            var fromDb = await _db.ServiceAppointments
                .AsNoTracking()
                .Select(a => a.ServiceType)
                .Where(s => s != null && s != "")
                .Distinct()
                .ToListAsync(cancellationToken);

            var merged = defaults
                .Concat(fromDb)
                .Select(s => s.Trim())
                .Where(s => s.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(s => s, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return Ok(merged);
        }

        [HttpGet("availability")]
        [Authorize(Roles = "Admin,Staff,Customer")]
        public async Task<ActionResult<DaySlotAvailabilityDto>> GetAvailability(
            [FromQuery] string date,
            CancellationToken cancellationToken)
        {
            if (!DateOnly.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var day))
            {
                return BadRequest(new { message = "Invalid date. Use yyyy-MM-dd." });
            }

            var tzOffset = GetTimezoneOffsetMinutes();
            var nowUtc = DateTime.UtcNow;
            var slots = await BuildSlotAvailabilityAsync(day, tzOffset, nowUtc, cancellationToken);

            return Ok(new DaySlotAvailabilityDto
            {
                Date = day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                ServerNowUtc = nowUtc,
                MinAdvanceHours = AppointmentBookingRules.MinAdvanceHours,
                Slots = slots,
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Staff,Customer")]
        public async Task<ActionResult<AppointmentDto>> Create(
            [FromBody] CreateAppointmentDto dto,
            CancellationToken cancellationToken)
        {
            var customerId = dto.CustomerId;
            if (User.IsInRole("Customer"))
            {
                var ownId = GetCurrentCustomerId();
                if (ownId == null)
                {
                    return Unauthorized(new { message = "Customer account not found." });
                }

                customerId = ownId.Value;
            }

            if (string.IsNullOrWhiteSpace(dto.ServiceType))
            {
                return BadRequest(new { message = "Service type is required." });
            }

            var customer = await _db.Customers.FindAsync([customerId], cancellationToken);
            if (customer == null)
            {
                return BadRequest(new { message = "Customer not found." });
            }

            if (!dto.Date.HasValue)
            {
                return BadRequest(new { message = "Appointment date and time are required." });
            }

            var appointmentUtc = DateTime.SpecifyKind(dto.Date.Value, DateTimeKind.Utc);
            var tzOffset = GetTimezoneOffsetMinutes();
            var isCustomerBooking = User.IsInRole("Customer");

            var validationError = await ValidateBookingAsync(
                appointmentUtc,
                tzOffset,
                isCustomerBooking,
                cancellationToken);
            if (validationError != null)
            {
                return BadRequest(new { message = validationError });
            }

            var entity = new Domain.Entities.ServiceAppointment
            {
                CustomerId = customerId,
                ServiceType = dto.ServiceType.Trim(),
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Scheduled" : dto.Status.Trim(),
                CreatedAt = DateTime.UtcNow,
                Date = appointmentUtc,
                VehicleNumber = string.IsNullOrWhiteSpace(dto.VehicleNumber)
                    ? null
                    : dto.VehicleNumber.Trim().ToUpperInvariant(),
                Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
            };

            _db.ServiceAppointments.Add(entity);
            await _db.SaveChangesAsync(cancellationToken);

            var created = (await QueryAppointments(customerId, null, null, null, null, null, cancellationToken))
                .Items.FirstOrDefault(a => a.Id == entity.Id);

            return CreatedAtAction(nameof(GetAll), new { id = entity.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdateAppointmentDto dto,
            CancellationToken cancellationToken)
        {
            var appt = await _db.ServiceAppointments.FindAsync([id], cancellationToken);
            if (appt == null)
            {
                return NotFound(new { message = "Appointment not found." });
            }

            if (User.IsInRole("Customer"))
            {
                var ownId = GetCurrentCustomerId();
                if (ownId == null || appt.CustomerId != ownId.Value)
                {
                    return Forbid();
                }

                if (!string.IsNullOrWhiteSpace(dto.Status))
                {
                    var status = dto.Status.Trim();
                    if (!string.Equals(status, "Cancelled", StringComparison.OrdinalIgnoreCase))
                    {
                        return BadRequest(new { message = "Customers may only cancel appointments." });
                    }

                    appt.Status = "Cancelled";
                }

                if (!string.IsNullOrWhiteSpace(dto.ServiceType))
                {
                    appt.ServiceType = dto.ServiceType.Trim();
                }

                if (dto.Date.HasValue)
                {
                    var newUtc = DateTime.SpecifyKind(dto.Date.Value, DateTimeKind.Utc);
                    var tzOffset = GetTimezoneOffsetMinutes();
                    var validationError = await ValidateBookingAsync(
                        newUtc,
                        tzOffset,
                        enforceAdvanceRule: true,
                        cancellationToken,
                        excludeAppointmentId: appt.Id);
                    if (validationError != null)
                    {
                        return BadRequest(new { message = validationError });
                    }

                    appt.Date = newUtc;
                }

                if (dto.VehicleNumber != null)
                {
                    appt.VehicleNumber = string.IsNullOrWhiteSpace(dto.VehicleNumber)
                        ? null
                        : dto.VehicleNumber.Trim().ToUpperInvariant();
                }

                if (dto.Notes != null)
                {
                    appt.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
                }
            }
            else if (User.IsInRole("Admin") || User.IsInRole("Staff"))
            {
                if (!string.IsNullOrWhiteSpace(dto.ServiceType))
                {
                    appt.ServiceType = dto.ServiceType.Trim();
                }

                if (!string.IsNullOrWhiteSpace(dto.Status))
                {
                    appt.Status = dto.Status.Trim();
                }

                if (dto.Date.HasValue)
                {
                    var newUtc = DateTime.SpecifyKind(dto.Date.Value, DateTimeKind.Utc);
                    var tzOffset = GetTimezoneOffsetMinutes();
                    var validationError = await ValidateBookingAsync(
                        newUtc,
                        tzOffset,
                        enforceAdvanceRule: false,
                        cancellationToken,
                        excludeAppointmentId: appt.Id);
                    if (validationError != null)
                    {
                        return BadRequest(new { message = validationError });
                    }

                    appt.Date = newUtc;
                }

                if (dto.VehicleNumber != null)
                {
                    appt.VehicleNumber = string.IsNullOrWhiteSpace(dto.VehicleNumber)
                        ? null
                        : dto.VehicleNumber.Trim().ToUpperInvariant();
                }

                if (dto.Notes != null)
                {
                    appt.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
                }

                if (dto.EstimatedCost.HasValue)
                {
                    appt.EstimatedCost = dto.EstimatedCost.Value;
                }
            }
            else
            {
                return Forbid();
            }

            await _db.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Appointment updated." });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Cancel(int id, CancellationToken cancellationToken)
        {
            var appt = await _db.ServiceAppointments.FindAsync([id], cancellationToken);
            if (appt == null)
            {
                return NotFound(new { message = "Appointment not found." });
            }

            if (User.IsInRole("Customer"))
            {
                var ownId = GetCurrentCustomerId();
                if (ownId == null || appt.CustomerId != ownId.Value)
                {
                    return Forbid();
                }
            }
            else if (!User.IsInRole("Admin") && !User.IsInRole("Staff"))
            {
                return Forbid();
            }

            appt.Status = "Cancelled";
            await _db.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Appointment cancelled." });
        }

        [HttpPut("{id:int}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public Task<IActionResult> UpdateStatusPut(
            int id,
            [FromBody] UpdateStatusDto dto,
            CancellationToken cancellationToken) =>
            UpdateStatus(id, dto, cancellationToken);

        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdateStatus(
            int id,
            [FromBody] UpdateStatusDto dto,
            CancellationToken cancellationToken)
        {
            var appt = await _db.ServiceAppointments.FindAsync([id], cancellationToken);
            if (appt == null)
            {
                return NotFound(new { message = "Appointment not found." });
            }

            appt.Status = dto.Status.Trim();
            await _db.SaveChangesAsync(cancellationToken);
            return Ok(new { message = "Status updated." });
        }

        private int? GetCurrentCustomerId()
        {
            var claim = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }

        private int GetTimezoneOffsetMinutes()
        {
            if (Request.Headers.TryGetValue("X-Timezone-Offset", out var values) &&
                int.TryParse(values.FirstOrDefault(), out var offset))
            {
                return offset;
            }

            return 0;
        }

        private async Task<string?> ValidateBookingAsync(
            DateTime appointmentUtc,
            int timezoneOffsetMinutes,
            bool enforceAdvanceRule,
            CancellationToken cancellationToken,
            int? excludeAppointmentId = null)
        {
            var local = appointmentUtc.AddMinutes(-timezoneOffsetMinutes);
            if (!AppointmentBookingRules.IsAllowedSlotTime(local.Hour, local.Minute))
            {
                return AppointmentBookingRules.InvalidSlotError;
            }

            if (enforceAdvanceRule && !AppointmentBookingRules.MeetsAdvanceBookingRule(appointmentUtc, DateTime.UtcNow))
            {
                return AppointmentBookingRules.AdvanceBookingError;
            }

            var slotUtc = AppointmentBookingRules.SlotToUtc(
                DateOnly.FromDateTime(local),
                $"{local.Hour:D2}:{local.Minute:D2}",
                timezoneOffsetMinutes);

            var booked = await CountActiveBookingsInSlotAsync(
                slotUtc,
                cancellationToken,
                excludeAppointmentId,
                timezoneOffsetMinutes);
            if (booked >= AppointmentBookingRules.MaxBookingsPerSlot)
            {
                return AppointmentBookingRules.SlotFullError;
            }

            return null;
        }

        private async Task<List<Domain.Entities.ServiceAppointment>> LoadActiveAppointmentsInWindowAsync(
            DateTime windowStart,
            DateTime windowEnd,
            CancellationToken cancellationToken)
        {
            // Status filter must be inline — EF Core cannot translate AppointmentBookingRules.IsActiveStatus.
            return await _db.ServiceAppointments.AsNoTracking()
                .Where(a =>
                    a.Date >= windowStart &&
                    a.Date <= windowEnd &&
                    a.Status.ToLower() != "cancelled" &&
                    a.Status.ToLower() != "canceled")
                .ToListAsync(cancellationToken);
        }

        private static int CountBookingsInSlot(
            IReadOnlyList<Domain.Entities.ServiceAppointment> candidates,
            DateTime slotUtc,
            int timezoneOffsetMinutes,
            int? excludeAppointmentId = null)
        {
            return candidates.Count(a =>
            {
                if (excludeAppointmentId.HasValue && a.Id == excludeAppointmentId.Value)
                {
                    return false;
                }

                var normalized = AppointmentBookingRules.NormalizeToSlotStartUtc(a.Date, timezoneOffsetMinutes);
                return normalized == slotUtc;
            });
        }

        private async Task<int> CountActiveBookingsInSlotAsync(
            DateTime slotUtc,
            CancellationToken cancellationToken,
            int? excludeAppointmentId = null,
            int? timezoneOffsetMinutes = null)
        {
            var windowStart = slotUtc.AddHours(-12);
            var windowEnd = slotUtc.AddHours(12);
            var candidates = await LoadActiveAppointmentsInWindowAsync(windowStart, windowEnd, cancellationToken);
            var offset = timezoneOffsetMinutes ?? GetTimezoneOffsetMinutes();
            return CountBookingsInSlot(candidates, slotUtc, offset, excludeAppointmentId);
        }

        private async Task<List<SlotAvailabilityDto>> BuildSlotAvailabilityAsync(
            DateOnly day,
            int timezoneOffsetMinutes,
            DateTime nowUtc,
            CancellationToken cancellationToken)
        {
            var result = new List<SlotAvailabilityDto>();
            var firstSlotUtc = AppointmentBookingRules.SlotToUtc(
                day,
                AppointmentBookingRules.SlotTimes[0],
                timezoneOffsetMinutes);
            var lastSlotUtc = AppointmentBookingRules.SlotToUtc(
                day,
                AppointmentBookingRules.SlotTimes[^1],
                timezoneOffsetMinutes);
            var dayCandidates = await LoadActiveAppointmentsInWindowAsync(
                firstSlotUtc.AddHours(-12),
                lastSlotUtc.AddHours(12),
                cancellationToken);

            foreach (var slotTime in AppointmentBookingRules.SlotTimes)
            {
                var slotUtc = AppointmentBookingRules.SlotToUtc(day, slotTime, timezoneOffsetMinutes);
                var booked = CountBookingsInSlot(dayCandidates, slotUtc, timezoneOffsetMinutes);
                var isFull = booked >= AppointmentBookingRules.MaxBookingsPerSlot;
                var meetsAdvance = AppointmentBookingRules.MeetsAdvanceBookingRule(slotUtc, nowUtc);

                string? reason = null;
                if (!meetsAdvance)
                {
                    reason = AppointmentBookingRules.AdvanceBookingError;
                }
                else if (isFull)
                {
                    reason = AppointmentBookingRules.SlotFullError;
                }

                result.Add(new SlotAvailabilityDto
                {
                    Time = slotTime,
                    Label = FormatSlotLabel(slotTime),
                    Booked = booked,
                    Max = AppointmentBookingRules.MaxBookingsPerSlot,
                    IsFull = isFull,
                    IsBookable = meetsAdvance && !isFull,
                    Reason = reason,
                });
            }

            return result;
        }

        private static string FormatSlotLabel(string slotTime)
        {
            var parts = slotTime.Split(':');
            var hour = int.Parse(parts[0]);
            var minute = int.Parse(parts[1]);
            var endHour = hour + 1;
            return $"{FormatSlotClock(hour, minute)} - {FormatSlotClock(endHour, minute)}";
        }

        private static string FormatSlotClock(int hour, int minute)
        {
            var period = hour >= 12 ? "PM" : "AM";
            var displayHour = hour % 12;
            if (displayHour == 0) displayHour = 12;
            return minute == 0
                ? $"{displayHour:D2}:00 {period}"
                : $"{displayHour:D2}:{minute:D2} {period}";
        }

        private async Task<AppointmentsListResponseDto> QueryAppointments(
            int? customerId,
            string? status,
            string? fromDate,
            string? toDate,
            string? serviceType,
            string? search,
            CancellationToken cancellationToken)
        {
            var query = _db.ServiceAppointments.AsNoTracking()
                .Include(a => a.Customer!)
                .ThenInclude(c => c.Vehicles)
                .AsQueryable();

            if (customerId.HasValue)
            {
                query = query.Where(a => a.CustomerId == customerId.Value);
            }

            if (!string.IsNullOrWhiteSpace(serviceType))
            {
                var st = serviceType.Trim();
                query = query.Where(a => a.ServiceType.ToLower() == st.ToLower());
            }

            if (DateOnly.TryParseExact(fromDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fromDay))
            {
                var fromUtc = DateTime.SpecifyKind(fromDay.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
                query = query.Where(a => a.Date >= fromUtc);
            }

            if (DateOnly.TryParseExact(toDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var toDay))
            {
                var toUtc = DateTime.SpecifyKind(toDay.ToDateTime(TimeOnly.MaxValue), DateTimeKind.Utc);
                query = query.Where(a => a.Date <= toUtc);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(a =>
                    (a.Customer != null && a.Customer.Name.ToLower().Contains(term)) ||
                    (a.Customer != null && a.Customer.Phone.ToLower().Contains(term)) ||
                    (a.VehicleNumber != null && a.VehicleNumber.ToLower().Contains(term)) ||
                    a.ServiceType.ToLower().Contains(term) ||
                    a.Status.ToLower().Contains(term));
            }

            var rows = await query
                .OrderByDescending(a => a.Date)
                .ToListAsync(cancellationToken);

            var allItems = rows.Select(MapAppointmentDto).ToList();

            var items = allItems;
            if (!string.IsNullOrWhiteSpace(status))
            {
                var bucket = NormalizeStatusBucket(status);
                items = allItems.Where(a => NormalizeStatusBucket(a.Status) == bucket).ToList();
            }

            return new AppointmentsListResponseDto
            {
                Summary = new AppointmentsSummaryDto
                {
                    Pending = allItems.Count(a => NormalizeStatusBucket(a.Status) == "pending"),
                    Confirmed = allItems.Count(a => NormalizeStatusBucket(a.Status) == "confirmed"),
                    Cancelled = allItems.Count(a => NormalizeStatusBucket(a.Status) == "cancelled"),
                    Completed = allItems.Count(a => NormalizeStatusBucket(a.Status) == "completed"),
                },
                Items = items,
            };
        }

        private async Task<AppointmentDetailDto?> GetAppointmentDetailAsync(
            int id,
            CancellationToken cancellationToken)
        {
            var appt = await _db.ServiceAppointments.AsNoTracking()
                .Include(a => a.Customer!)
                .ThenInclude(c => c.Vehicles)
                .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

            if (appt == null || appt.Customer == null)
            {
                return null;
            }

            var vehicle = appt.Customer.Vehicles.FirstOrDefault(v =>
                !string.IsNullOrWhiteSpace(appt.VehicleNumber) &&
                string.Equals(v.VehicleNumber, appt.VehicleNumber, StringComparison.OrdinalIgnoreCase));

            var history = await _db.ServiceAppointments.AsNoTracking()
                .Where(a => a.CustomerId == appt.CustomerId && a.Id != appt.Id)
                .OrderByDescending(a => a.Date)
                .Take(8)
                .Select(a => new AppointmentHistoryItemDto
                {
                    Id = a.Id,
                    Date = a.Date,
                    Status = a.Status,
                    ServiceType = a.ServiceType,
                })
                .ToListAsync(cancellationToken);

            var createdAt = appt.CreatedAt == default ? appt.Date : appt.CreatedAt;

            return new AppointmentDetailDto
            {
                Id = appt.Id,
                CustomerId = appt.CustomerId,
                ServiceType = appt.ServiceType,
                Status = appt.Status,
                Date = appt.Date,
                CreatedAt = createdAt,
                Notes = appt.Notes,
                EstimatedCost = appt.EstimatedCost,
                Customer = new AppointmentCustomerDto
                {
                    Id = appt.Customer.Id,
                    Name = appt.Customer.Name,
                    Phone = appt.Customer.Phone,
                    Email = appt.Customer.Email,
                    Address = appt.Customer.Address,
                },
                Vehicle = vehicle != null
                    ? new AppointmentVehicleDto
                    {
                        Make = vehicle.Brand,
                        Model = vehicle.Model,
                        Year = vehicle.Year,
                        Vin = vehicle.Vin,
                        RegistrationNumber = vehicle.VehicleNumber,
                    }
                    : !string.IsNullOrWhiteSpace(appt.VehicleNumber)
                        ? new AppointmentVehicleDto { RegistrationNumber = appt.VehicleNumber }
                        : null,
                History = history,
            };
        }

        private static AppointmentDto MapAppointmentDto(Domain.Entities.ServiceAppointment a)
        {
            var vehicle = a.Customer?.Vehicles?.FirstOrDefault(v =>
                !string.IsNullOrWhiteSpace(a.VehicleNumber) &&
                string.Equals(v.VehicleNumber, a.VehicleNumber, StringComparison.OrdinalIgnoreCase));

            return new AppointmentDto
            {
                Id = a.Id,
                CustomerId = a.CustomerId,
                CustomerName = a.Customer?.Name ?? "",
                CustomerPhone = a.Customer?.Phone ?? "",
                VehicleNumber = a.VehicleNumber,
                VehicleMakeModel = vehicle != null ? $"{vehicle.Brand} {vehicle.Model}".Trim() : null,
                ServiceType = a.ServiceType,
                Status = a.Status,
                Date = a.Date,
                Notes = a.Notes,
                EstimatedCost = a.EstimatedCost,
            };
        }

        private static string NormalizeStatusBucket(string status)
        {
            var s = status.Trim().ToLowerInvariant();
            if (s is "scheduled" or "pending") return "pending";
            if (s is "approved" or "confirmed") return "confirmed";
            if (s is "cancelled" or "canceled" or "rejected") return "cancelled";
            if (s == "completed") return "completed";
            return s;
        }

    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
