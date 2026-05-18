using FluentValidation;
using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Validators
{
    public class LoginDtoValidator : AbstractValidator<LoginDto>
    {
        public LoginDtoValidator()
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.Password).NotEmpty();
        }
    }
}
