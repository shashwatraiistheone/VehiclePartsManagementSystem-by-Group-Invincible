using FluentValidation;
using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Validators
{
    public class RegisterCustomerDtoValidator : AbstractValidator<RegisterCustomerDto>
    {
        public RegisterCustomerDtoValidator()
        {
            RuleFor(x => x.Name).NotEmpty().MinimumLength(2);
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.Phone).NotEmpty().MinimumLength(6);
            RuleFor(x => x.Password).NotEmpty().MinimumLength(8);

            RuleFor(x => x.Vehicles)
                .NotEmpty()
                .WithMessage("At least one vehicle is required.");

            RuleForEach(x => x.Vehicles).ChildRules(vehicle =>
            {
                vehicle.RuleFor(v => v.VehicleNumber).NotEmpty().WithMessage("Vehicle number is required.");
                vehicle.RuleFor(v => v.Brand).NotEmpty().WithMessage("Brand is required.");
                vehicle.RuleFor(v => v.Model).NotEmpty().WithMessage("Model is required.");
                vehicle.RuleFor(v => v.Year)
                    .InclusiveBetween(1900, DateTime.UtcNow.Year + 1)
                    .WithMessage("Invalid vehicle year.");
                vehicle.RuleFor(v => v.Mileage).GreaterThanOrEqualTo(0).WithMessage("Mileage cannot be negative.");
            });
        }
    }
}
