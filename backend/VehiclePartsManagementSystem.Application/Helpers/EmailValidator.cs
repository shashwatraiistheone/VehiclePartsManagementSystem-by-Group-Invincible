using System.Net.Mail;

namespace VehiclePartsManagementSystem.Application.Helpers
{
    public static class EmailValidator
    {
        public static bool IsValidFormat(string? email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return false;
            }

            try
            {
                var trimmed = email.Trim();
                var addr = new MailAddress(trimmed);
                return string.Equals(addr.Address, trimmed, StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        public static bool IsPlaceholderAccount(string? email)
        {
            return !string.IsNullOrWhiteSpace(email)
                && email.Trim().EndsWith("@partshub.local", StringComparison.OrdinalIgnoreCase);
        }

        public static bool CanSendTo(string? email)
        {
            return IsValidFormat(email) && !IsPlaceholderAccount(email);
        }
    }
}
