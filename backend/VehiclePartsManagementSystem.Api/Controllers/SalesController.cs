using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Helpers;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Staff")]
    public class SalesController : ControllerBase
    {
        private readonly ISalesService _salesService;

        public SalesController(ISalesService salesService)
        {
            _salesService = salesService;
        }

        [HttpPost]
        public async Task<ActionResult<SaleResponseDto>> Create(CreateSaleDto dto)
        {
            try
            {
                var created = await _salesService.CreateSaleAsync(dto);
                return CreatedAtAction(nameof(GetAll), null, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<SaleResponseDto>>> GetAll()
        {
            var sales = await _salesService.GetAllSalesAsync();
            return Ok(sales);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<SaleResponseDto>> GetById(int id)
        {
            var sale = await _salesService.GetSaleByIdAsync(id);
            if (sale == null)
            {
                return NotFound(new { message = "Sale not found." });
            }

            return Ok(sale);
        }

        [HttpPost("{saleId:int}/send-invoice")]
        public async Task<IActionResult> SendInvoice(int saleId, [FromBody] SendInvoiceDto? dto)
        {
            if (!string.IsNullOrWhiteSpace(dto?.Email) && !EmailValidator.CanSendTo(dto.Email))
            {
                return BadRequest(new { message = "Please provide a valid email address." });
            }

            try
            {
                await _salesService.SendInvoiceEmailAsync(saleId, dto?.Email);
                return Ok(new { message = "Invoice email sent successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error sending email: {ex.Message}" });
            }
        }
    }
}
