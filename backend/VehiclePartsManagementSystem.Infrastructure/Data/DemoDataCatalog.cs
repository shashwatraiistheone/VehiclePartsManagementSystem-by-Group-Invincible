namespace VehiclePartsManagementSystem.Infrastructure.Data
{
    internal static class DemoDataCatalog
    {
        public static readonly DateTime YearStart = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        public static readonly DateTime YearEnd = new(2027, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        public static readonly double[] MonthlySaleWeight =
        {
            0.82, 0.88, 1.05, 1.12, 0.98, 0.92, 0.90, 0.94, 1.02, 1.38, 1.42, 1.15,
        };

        public static readonly string[] FirstNames =
        {
            "John", "David", "Rebecca", "Mary", "James", "Sarah", "Michael", "Emily",
            "Robert", "Jennifer", "William", "Linda", "Richard", "Patricia", "Joseph",
            "Elizabeth", "Thomas", "Barbara", "Charles", "Susan", "Daniel", "Jessica",
            "Matthew", "Karen", "Anthony", "Nancy", "Mark", "Lisa", "Donald", "Betty",
            "Steven", "Margaret", "Paul", "Sandra", "Andrew", "Ashley", "Joshua", "Kimberly",
            "Kenneth", "Donna", "Kevin", "Carol", "Brian", "Michelle", "George", "Amanda",
            "Timothy", "Melissa", "Ronald", "Deborah", "Rajan", "Sunita", "Bikash", "Anita",
            "Prakash", "Mina", "Suresh", "Puja", "Kiran", "Rita", "Nabin", "Sangita",
        };

        public static readonly string[] LastNames =
        {
            "Carter", "Murphy", "Taylor", "Fisher", "Anderson", "Thomas", "Jackson", "White",
            "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez",
            "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "King", "Wright", "Scott",
            "Green", "Baker", "Adams", "Nelson", "Hill", "Shrestha", "Gurung", "Tamang", "Rai",
            "Thapa", "Karki", "Maharjan", "Basnet", "Poudel", "Khatri", "Sharma", "Patel",
        };

        public static readonly string[] KathmanduAreas =
        {
            "Thamel, Kathmandu", "Baneshwor, Kathmandu", "Kalanki, Kathmandu", "Balaju, Kathmandu",
            "Koteshwor, Kathmandu", "Chabahil, Kathmandu", "Satdobato, Lalitpur", "Pulchowk, Lalitpur",
            "Jawalakhel, Lalitpur", "Lakeside, Pokhara", "Mahendrapul, Pokhara", "Biratnagar-10",
            "Bharatpur-4", "Hetauda-11", "Butwal-12",
        };

        public static readonly string[] VehicleBrands =
        {
            "Toyota", "Honda", "Hyundai", "Suzuki", "Mahindra", "Nissan", "Ford", "Kia",
            "Mitsubishi", "Isuzu", "Tata", "MG",
        };

        public static readonly string[] VehicleModels =
        {
            "Corolla", "Civic", "Creta", "Swift", "Scorpio", "Navara", "Ranger", "Seltos",
            "Lancer", "D-Max", "Nexon", "ZS EV",
        };

        public static readonly string[] PartCategories =
        {
            "Engine", "Brakes", "Filters", "Electrical", "Suspension", "Transmission",
            "Cooling", "Fuel System", "Steering", "Body", "Lighting", "Accessories",
        };

        public static readonly (string Name, string Category, decimal CostMin, decimal CostMax, decimal Margin)[] PartTemplates =
        {
            ("Engine Oil 5W-30 (4L)", "Engine", 1200, 1800, 1.35m),
            ("Synthetic Engine Oil 0W-20", "Engine", 2200, 3200, 1.32m),
            ("Brake Pad Set (Front)", "Brakes", 2800, 4500, 1.40m),
            ("Brake Pad Set (Rear)", "Brakes", 2200, 3800, 1.38m),
            ("Brake Disc Rotor", "Brakes", 3500, 6200, 1.42m),
            ("Fuel Injector", "Fuel System", 4500, 8500, 1.45m),
            ("Air Filter", "Filters", 450, 950, 1.50m),
            ("Cabin Air Filter", "Filters", 650, 1200, 1.48m),
            ("Oil Filter", "Filters", 350, 750, 1.52m),
            ("Timing Belt Kit", "Engine", 5500, 9800, 1.38m),
            ("Timing Chain Kit", "Engine", 8200, 14500, 1.35m),
            ("Steering Rack Assembly", "Steering", 18500, 32000, 1.30m),
            ("Shock Absorber (Pair)", "Suspension", 6200, 11500, 1.36m),
            ("Coil Spring Set", "Suspension", 4800, 8900, 1.34m),
            ("Clutch Plate Kit", "Transmission", 7200, 12800, 1.37m),
            ("Car Battery 65Ah", "Electrical", 9500, 14500, 1.28m),
            ("Alternator", "Electrical", 12500, 22000, 1.32m),
            ("Starter Motor", "Electrical", 9800, 17500, 1.33m),
            ("Spark Plug Set (4)", "Engine", 1200, 2800, 1.45m),
            ("Glow Plug Set", "Engine", 1800, 3500, 1.42m),
            ("Radiator Assembly", "Cooling", 8500, 15500, 1.31m),
            ("Water Pump", "Cooling", 4200, 7800, 1.36m),
            ("Thermostat", "Cooling", 650, 1400, 1.48m),
            ("Serpentine Belt", "Engine", 1100, 2400, 1.44m),
            ("Drive Shaft", "Transmission", 14500, 26500, 1.28m),
            ("CV Joint Boot Kit", "Transmission", 1800, 3200, 1.40m),
            ("Wheel Bearing Hub", "Suspension", 3800, 7200, 1.38m),
            ("Tie Rod End", "Steering", 1400, 2800, 1.42m),
            ("Ball Joint", "Suspension", 1600, 3200, 1.41m),
            ("Control Arm", "Suspension", 4200, 7800, 1.35m),
            ("Headlight Assembly", "Lighting", 5500, 12000, 1.38m),
            ("Tail Light Assembly", "Lighting", 3200, 6800, 1.36m),
            ("Wiper Blade Pair", "Accessories", 450, 950, 1.55m),
            ("Fuel Pump", "Fuel System", 6500, 11500, 1.34m),
            ("Fuel Filter", "Filters", 550, 1200, 1.50m),
            ("MAF Sensor", "Fuel System", 4800, 9200, 1.40m),
            ("Oxygen Sensor", "Fuel System", 3200, 6500, 1.42m),
            ("Ignition Coil", "Electrical", 2200, 4800, 1.43m),
            ("ABS Sensor", "Brakes", 1800, 4200, 1.44m),
            ("Brake Master Cylinder", "Brakes", 4200, 7800, 1.36m),
            ("Power Steering Pump", "Steering", 6800, 12500, 1.33m),
            ("AC Compressor", "Cooling", 18500, 32000, 1.28m),
            ("AC Condenser", "Cooling", 8500, 15500, 1.30m),
            ("Radiator Fan Motor", "Cooling", 3200, 5800, 1.37m),
            ("Engine Mount Set", "Engine", 3800, 7200, 1.35m),
            ("Exhaust Muffler", "Engine", 4500, 8500, 1.34m),
            ("Catalytic Converter", "Engine", 22000, 42000, 1.25m),
            ("Turbocharger Cartridge", "Engine", 35000, 65000, 1.22m),
            ("Intercooler Hose Kit", "Engine", 2200, 4500, 1.38m),
            ("Transmission Fluid (ATF)", "Transmission", 1400, 2600, 1.36m),
            ("Manual Gear Oil 75W-90", "Transmission", 1100, 2200, 1.40m),
            ("Differential Oil", "Transmission", 950, 1800, 1.42m),
            ("Brake Fluid DOT 4", "Brakes", 450, 850, 1.52m),
            ("Coolant Concentrate 1L", "Cooling", 550, 1100, 1.48m),
            ("Power Steering Fluid", "Steering", 650, 1200, 1.46m),
            ("Door Handle (Outer)", "Body", 1200, 2800, 1.45m),
            ("Side Mirror Assembly", "Body", 3800, 8500, 1.38m),
            ("Bumper Cover (Front)", "Body", 8500, 18500, 1.30m),
            ("Fender Panel", "Body", 6200, 12500, 1.32m),
            ("Hood Strut Pair", "Body", 1400, 2800, 1.44m),
            ("Floor Mat Set", "Accessories", 1800, 3500, 1.50m),
            ("Seat Cover Set", "Accessories", 3200, 6500, 1.42m),
            ("Roof Rack Kit", "Accessories", 5500, 9800, 1.35m),
            ("Tire Pressure Sensor", "Electrical", 2200, 4500, 1.40m),
            ("Parking Sensor Kit", "Electrical", 4500, 8500, 1.36m),
            ("Reverse Camera", "Electrical", 2800, 5800, 1.38m),
            ("Dash Cam 1080p", "Accessories", 4500, 8500, 1.34m),
            ("Jump Starter Pack", "Electrical", 6500, 11500, 1.32m),
            ("Towing Hook", "Accessories", 2200, 4200, 1.40m),
            ("Wheel Nut Set", "Accessories", 450, 950, 1.55m),
            ("Lug Wrench", "Accessories", 650, 1400, 1.48m),
            ("Jack Stand Pair", "Accessories", 2800, 5200, 1.38m),
            ("Hydraulic Floor Jack", "Accessories", 4500, 8500, 1.34m),
            ("Engine Air Intake Hose", "Engine", 1400, 2800, 1.42m),
            ("Throttle Body Gasket", "Engine", 350, 750, 1.52m),
            ("Valve Cover Gasket", "Engine", 850, 1800, 1.45m),
            ("Head Gasket Set", "Engine", 4200, 8500, 1.36m),
            ("Piston Ring Set", "Engine", 6500, 12500, 1.32m),
            ("Connecting Rod Bearing", "Engine", 2800, 5200, 1.38m),
            ("Crankshaft Seal", "Engine", 650, 1400, 1.48m),
            ("Camshaft Position Sensor", "Engine", 2200, 4800, 1.42m),
            ("Knock Sensor", "Engine", 1800, 3800, 1.44m),
            ("EGR Valve", "Engine", 4500, 8500, 1.34m),
            ("PCV Valve", "Engine", 450, 950, 1.50m),
            ("Idle Air Control Valve", "Engine", 2800, 5500, 1.38m),
            ("MAP Sensor", "Fuel System", 2200, 4500, 1.40m),
            ("Crank Position Sensor", "Engine", 2200, 4800, 1.42m),
            ("Speed Sensor", "Transmission", 1400, 3200, 1.43m),
            ("Window Regulator", "Body", 3200, 6500, 1.36m),
            ("Door Lock Actuator", "Electrical", 1800, 3800, 1.42m),
            ("Central Locking Module", "Electrical", 2800, 5500, 1.38m),
            ("Key Fob Battery CR2032", "Accessories", 80, 200, 1.80m),
            ("Remote Key Shell", "Accessories", 650, 1400, 1.48m),
            ("Horn Assembly", "Electrical", 850, 1800, 1.45m),
            ("Relay Pack (5-pin)", "Electrical", 350, 750, 1.52m),
            ("Fuse Box Assortment", "Electrical", 650, 1400, 1.48m),
            ("Wiring Harness Repair Kit", "Electrical", 2200, 4500, 1.40m),
            ("LED Bulb H4 Pair", "Lighting", 850, 1800, 1.45m),
            ("Fog Light Kit", "Lighting", 3200, 6500, 1.38m),
            ("Indicator Bulb Set", "Lighting", 250, 550, 1.58m),
            ("Number Plate Frame", "Accessories", 350, 750, 1.52m),
            ("Car Cover (Medium)", "Accessories", 3200, 5800, 1.36m),
            ("Sun Shade Windshield", "Accessories", 650, 1400, 1.48m),
            ("Phone Mount Vent", "Accessories", 450, 950, 1.50m),
            ("USB Car Charger Dual", "Accessories", 550, 1200, 1.48m),
        };

        public static readonly string[] VendorNames =
        {
            "Himalayan Auto Supplies", "Kathmandu Parts Depot", "Valley Motor Traders",
            "Nepal Genuine Parts Co.", "Everest Spare House", "Lalitpur Auto Wholesale",
            "Pokhara Vehicle Components", "Terai Parts Distributors", "Premium OE Imports",
            "City Brake & Clutch Centre", "Engine Masters Nepal", "Filter World Kathmandu",
            "Battery Hub Nepal", "Suspension Specialists", "Electrical Auto Parts Ltd",
            "TransGear Imports", "Cooling Systems Nepal", "Body Panel Suppliers",
        };

        public static readonly string[] StaffFirstNames =
        {
            "Amit", "Priya", "Ramesh", "Sita", "Bijay", "Anjali", "Hari", "Gita",
            "Sanjay", "Kamala", "Dipesh", "Sabina",
        };

        public static readonly string[] PaymentMethods =
        {
            "Cash", "Online Payment", "Bank Transfer",
        };

        public static readonly string[] ServiceTypes =
        {
            "Oil Change", "Brake Service", "Full Inspection", "AC Service",
            "Suspension Check", "Battery Replacement", "Tire Rotation", "Engine Tune-up",
        };

        public static readonly string[] ReviewComments =
        {
            "Excellent service and genuine parts. Highly recommended!",
            "Fast delivery and fair pricing in Kathmandu.",
            "Staff was helpful finding the right brake pads for my Corolla.",
            "Good quality oil filter, will visit again.",
            "Waiting time was a bit long but work quality was solid.",
            "Best prices I found for alternator replacement parts.",
            "Professional team — invoice was clear with VAT breakdown.",
            "Part arrived next day from their warehouse. Very satisfied.",
            "Average experience — parts were fine but communication could improve.",
            "Outstanding loyalty discount on my bulk purchase!",
            "They helped diagnose a fuel injector issue correctly.",
            "Not happy with delayed credit follow-up on invoice.",
        };

        public static readonly (string Key, string Name, string Queue)[] BackgroundJobs =
        {
            ("sales-rpt", "Daily Sales Report Generation", "reports"),
            ("inv-sync", "Inventory Synchronization", "inventory"),
            ("loyalty", "Loyalty Reward Processing", "loyalty"),
            ("email", "Email Notification Jobs", "notifications"),
            ("backup", "Scheduled Database Backup", "maintenance"),
        };

        public static readonly string[] AuditActions =
        {
            "Payment Received", "Inventory Updated", "Review Submitted", "Purchase Created",
            "Invoice Generated", "Order Completed", "Loyalty Reward Applied", "Profile Updated",
            "Login", "Logout", "Review Moderated", "Failed Event",
        };
    }
}
