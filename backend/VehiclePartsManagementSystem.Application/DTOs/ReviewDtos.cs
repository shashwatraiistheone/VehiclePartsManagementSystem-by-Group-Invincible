using System;
using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class ReviewDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Title { get; set; }
        public string Comment { get; set; } = string.Empty;
        public string? ServiceType { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; }
    }

    public class CreateReviewDto
    {
        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(120)]
        public string? Title { get; set; }

        [Required]
        [MinLength(3)]
        [MaxLength(1000)]
        public string Comment { get; set; } = string.Empty;

        [MaxLength(80)]
        public string? ServiceType { get; set; }
    }

    public class UpdateReviewStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }
}
