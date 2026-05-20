namespace VehiclePartsManagementSystem.Application.DTOs
{
  public class SlotAvailabilityDto
  {
    public string Time { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int Booked { get; set; }
    public int Max { get; set; }
    public bool IsFull { get; set; }
    public bool IsBookable { get; set; }
    public string? Reason { get; set; }
  }

  public class DaySlotAvailabilityDto
  {
    public string Date { get; set; } = string.Empty;
    public DateTime ServerNowUtc { get; set; }
    public int MinAdvanceHours { get; set; }
    public List<SlotAvailabilityDto> Slots { get; set; } = new();
  }
}
