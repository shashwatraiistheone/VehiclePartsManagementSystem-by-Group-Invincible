namespace VehiclePartsManagementSystem.Application.Services
{
  public static class AppointmentBookingRules
  {
    public const int MinAdvanceHours = 24;
    public const int MaxBookingsPerSlot = 5;

    public const string AdvanceBookingError =
      "Appointments must be booked at least 24 hours in advance.";

    public const string SlotFullError =
      "This time slot is fully booked. Please choose another time.";

    public const string InvalidSlotError =
      "Please select a valid appointment time slot.";

    /// <summary>Allowed local slot times (HH:mm, 24-hour).</summary>
    public static readonly string[] SlotTimes =
    {
      "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
    };

    public static bool IsAllowedSlotTime(int hour, int minute) =>
      SlotTimes.Any(s =>
      {
        var parts = s.Split(':');
        return int.Parse(parts[0]) == hour && int.Parse(parts[1]) == minute;
      });

    /// <summary>
    /// Use only in memory after loading rows. Do not call from EF <c>IQueryable</c> — it cannot be translated to SQL.
    /// </summary>
    public static bool IsActiveStatus(string status) =>
      !string.Equals(status, "Cancelled", StringComparison.OrdinalIgnoreCase) &&
      !string.Equals(status, "Canceled", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Converts a local calendar date + slot time to UTC using the client timezone offset
    /// (same value as JavaScript <c>Date.getTimezoneOffset()</c>).
    /// </summary>
    public static DateTime SlotToUtc(DateOnly date, string slotTime, int timezoneOffsetMinutes)
    {
      var parts = slotTime.Split(':');
      var hour = int.Parse(parts[0]);
      var minute = int.Parse(parts[1]);
      var local = new DateTime(date.Year, date.Month, date.Day, hour, minute, 0, DateTimeKind.Unspecified);
      return DateTime.SpecifyKind(local.AddMinutes(timezoneOffsetMinutes), DateTimeKind.Utc);
    }

    public static bool MeetsAdvanceBookingRule(DateTime appointmentUtc, DateTime serverUtcNow) =>
      (appointmentUtc - serverUtcNow).TotalHours >= MinAdvanceHours;

    public static (int Hour, int Minute)? ParseSlotTime(string slotTime)
    {
      if (string.IsNullOrWhiteSpace(slotTime)) return null;
      var parts = slotTime.Trim().Split(':');
      if (parts.Length != 2) return null;
      if (!int.TryParse(parts[0], out var h) || !int.TryParse(parts[1], out var m)) return null;
      if (!IsAllowedSlotTime(h, m)) return null;
      return (h, m);
    }

    /// <summary>Maps a stored UTC appointment to its slot key for counting.</summary>
    public static DateTime NormalizeToSlotStartUtc(DateTime appointmentUtc, int timezoneOffsetMinutes)
    {
      var local = appointmentUtc.AddMinutes(-timezoneOffsetMinutes);
      if (!IsAllowedSlotTime(local.Hour, local.Minute))
      {
        return appointmentUtc;
      }

      return SlotToUtc(DateOnly.FromDateTime(local), $"{local.Hour:D2}:{local.Minute:D2}", timezoneOffsetMinutes);
    }
  }
}
