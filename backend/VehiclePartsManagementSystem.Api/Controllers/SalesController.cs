using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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

        [HttpPost("{saleId:int}/send-invoice")]
        public async Task<IActionResult> SendInvoice(int saleId, [FromBody] SendInvoiceDto? dto)
        {
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
