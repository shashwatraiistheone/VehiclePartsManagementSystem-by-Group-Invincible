using FluentValidation;
using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Validators
{
    public class UpdateStaffDtoValidator : AbstractValidator<UpdateStaffDto>
    {
        public UpdateStaffDtoValidator()
        {
            RuleFor(x => x.FullName).NotEmpty().MinimumLength(2).MaximumLength(120);
            RuleFor(x => x.Phone).NotEmpty();
            RuleFor(x => x.Role).Must(r => r is "Admin" or "Staff")
                .WithMessage("Role must be Admin or Staff.");
        }
    }
}
