using FluentValidation;
using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Validators
{
    public class CreatePurchaseDtoValidator : AbstractValidator<CreatePurchaseDto>
    {
        public CreatePurchaseDtoValidator()
        {
            RuleFor(x => x.VendorId)
                .GreaterThan(0)
                .WithMessage("A valid vendor is required.");

            RuleFor(x => x.Items)
                .NotEmpty()
                .WithMessage("At least one purchase item is required.");

            RuleForEach(x => x.Items).ChildRules(item =>
            {
                item.RuleFor(i => i.PartId).GreaterThan(0);
                item.RuleFor(i => i.Quantity).GreaterThan(0);
                item.RuleFor(i => i.CostPrice).GreaterThan(0);
            });
        }
    }
}
