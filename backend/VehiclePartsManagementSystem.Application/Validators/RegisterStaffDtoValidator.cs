using FluentValidation;
using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Validators
{
    public class RegisterStaffDtoValidator : AbstractValidator<RegisterStaffDto>
    {
        public RegisterStaffDtoValidator()
        {
            RuleFor(x => x.FullName).NotEmpty().MinimumLength(2).MaximumLength(120);
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.Phone).NotEmpty();
            RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
            RuleFor(x => x.Role).Must(r => r is "Admin" or "Staff")
                .WithMessage("Role must be Admin or Staff.");
        }
    }
}
