using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class CommunityReviewDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string ReviewText { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; }
    }

    public class CommunityReviewStatsDto
    {
        public int TotalReviews { get; set; }
        public double AverageRating { get; set; }
        public int FiveStarPercentage { get; set; }
    }

    public class CommunityReviewsFeedDto
    {
        public List<CommunityReviewDto> Reviews { get; set; } = new();
        public CommunityReviewStatsDto Stats { get; set; } = new();
    }

    public class CreateCommunityReviewDto
    {
        [Range(1, 5)]
        public int Rating { get; set; }

        [Required]
        [MinLength(3)]
        [MaxLength(2000)]
        public string ReviewText { get; set; } = string.Empty;
    }

    public class UpdateCommunityReviewStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }
}
