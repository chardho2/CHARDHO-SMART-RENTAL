<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>CHARDHO | Smart Rental System</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600&display=swap"
		rel="stylesheet">
	<script src="https://unpkg.com/lucide@latest"></script>
	<link rel="stylesheet" href="<?php echo base_url('public/assets/css/chardho_main.css'); ?>">
</head>

<body>

	<!-- Navigation -->
	<nav id="navbar">
		<div class="logo">
			<i data-lucide="zap" style="color: var(--primary); fill: var(--primary);"></i>
			CHAR<span>DHO</span>
		</div>
		<div class="nav-links">
			<a href="#home">Home</a>
			<a href="#fleet">Fleet</a>
			<a href="#about">About</a>
			<a href="#support">Support</a>
		</div>
		<div class="auth-btns">
			<a href="<?php echo site_url('login'); ?>" class="btn btn-outline" style="border-radius: 12px; text-decoration: none;">Login</a>
			<a href="<?php echo site_url('login'); ?>" class="btn btn-primary pulse-anim" style="text-decoration: none;">Sign Up</a>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="hero" id="home">
		<div class="hero-bg" style="background-image: url('../public/assets/img/hero_bg.jpg');">
		</div>
		<div class="hero-content">
			<h1>Elegance <br><span>In Motion.</span></h1>
			<p
				style="font-size: 1.3rem; color: var(--muted); margin-bottom: 3.5rem; max-width: 650px; margin-inline: auto;">
				Premium car rentals built for the modern traveler. Experience the next generation of urban mobility.</p>
			<div style="display: flex; gap: 1.5rem; justify-content: center;">
				<button class="btn btn-primary" style="padding: 1.2rem 3.5rem; font-size: 1rem;">Reserve a Car <i
						data-lucide="arrow-right"></i></button>
				<button class="btn btn-outline" style="padding: 1.2rem 3.5rem; font-size: 1rem;">View Pricing</button>
			</div>
		</div>
	</section>

	<!-- Fleet Section -->
	<section id="fleet">
		<div class="section-header reveal">
			<h2>The Elite Fleet</h2>
			<p>Pristine vehicles, curated for performance and comfort.</p>
		</div>

		<div class="fleet-grid">
			<?php if(!empty($vehicles)): ?>
				<?php foreach($vehicles as $car): ?>
				<div class="car-card reveal glow-border">
					<div class="car-img-container">
						<div class="car-img" style="background-image: url('<?php echo base_url('public/assets/img/'.(isset($car['image']) ? $car['image'] : 'ertiga.png')); ?>')">
						</div>
					</div>
					<div class="car-info">
						<div class="car-name"><?php echo $car['make'] . ' ' . $car['model']; ?> 
							<span style="font-size: 0.8rem; background: var(--primary); color: #fff; padding: 4px 12px; border-radius: 20px;">
								<?php echo isset($car['class_name']) ? $car['class_name'] : 'PREMIUM'; ?>
							</span>
						</div>
						<div class="pricing-wrap">
							<div class="price-item">
								<span class="price-val">₹<?php echo isset($car['price_hour']) ? $car['price_hour'] : '250'; ?></span>
								<span class="price-label">Hour</span>
							</div>
							<div class="price-item">
								<span class="price-val">₹<?php echo isset($car['price_day']) ? $car['price_day'] : '2.5k'; ?></span>
								<span class="price-label">Day</span>
							</div>
							<div class="price-item">
								<span class="price-val">₹<?php echo isset($car['price_km']) ? $car['price_km'] : '12'; ?></span>
								<span class="price-label">KM</span>
							</div>
						</div>
						<a href="<?php echo site_url('login'); ?>" class="btn btn-primary" style="width: 100%; justify-content: center; text-decoration: none;">Book Now</a>
					</div>
				</div>
				<?php endforeach; ?>
			<?php else: ?>
				<!-- Fallback static items if DB is empty -->
				<div class="car-card reveal glow-border">
					<div class="car-img-container">
						<div class="car-img" style="background-image: url('<?php echo base_url('public/assets/img/ertiga.png'); ?>')"></div>
					</div>
					<div class="car-info">
						<div class="car-name">Maruti Ertiga <span style="font-size: 0.8rem; background: var(--primary); color: #fff; padding: 4px 12px; border-radius: 20px;">7 SEATER</span></div>
						<div class="pricing-wrap">
							<div class="price-item"><span class="price-val">₹250</span><span class="price-label">Hour</span></div>
							<div class="price-item"><span class="price-val">₹2.5k</span><span class="price-label">Day</span></div>
							<div class="price-item"><span class="price-val">₹12</span><span class="price-label">KM</span></div>
						</div>
						<a href="<?php echo site_url('login'); ?>" class="btn btn-primary" style="width: 100%; justify-content: center; text-decoration: none;">Book Now</a>
					</div>
				</div>
			<?php endif; ?>
		</div>
	</section>

	<!-- Support Panel Mockup -->
	<section id="support">
		<div class="glass-panel reveal glow-border" style="max-width: 900px; margin: 0 auto; text-align: center;">
			<i data-lucide="shield-check"
				style="width: 60px; height: 60px; color: var(--primary); margin-bottom: 2rem;"></i>
			<h2 style="font-family: 'Outfit'; font-size: 2.5rem; margin-bottom: 1rem;">Secure Booking & Safety</h2>
			<p style="color: var(--muted); margin-bottom: 2.5rem;">Every ride is insured and monitored 24/7. Our
				specialized safety protocols ensure you reach your destination with peace of mind.</p>
			<div style="display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap;">
				<div style="display: flex; align-items: center; gap: 10px; color: var(--muted);"><i
						data-lucide="check-circle" style="color: green;"></i> 24/7 Assistance</div>
				<div style="display: flex; align-items: center; gap: 10px; color: var(--muted);"><i
						data-lucide="check-circle" style="color: green;"></i> Zero Hidden Costs</div>
				<div style="display: flex; align-items: center; gap: 10px; color: var(--muted);"><i
						data-lucide="check-circle" style="color: green;"></i> Easy UPI Payments</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer>
		<div class="logo" style="margin-bottom: 1.5rem; justify-content: center;">CHAR<span>DHO</span></div>
		<p style="color: var(--muted); margin-bottom: 3rem; max-width: 450px; margin-inline: auto;">Redefining
			transportation in India. Join thousands of happy travelers today.</p>
		<div style="display: flex; gap: 2rem; justify-content: center; margin-bottom: 4rem;">
			<a href="#" style="color: var(--muted);"><i data-lucide="instagram"></i></a>
			<a href="#" style="color: var(--muted);"><i data-lucide="twitter"></i></a>
			<a href="#" style="color: var(--muted);"><i data-lucide="facebook"></i></a>
		</div>
		<p style="font-size: 0.8rem; color: #333;">&copy; 2026 CHARDHO RENTAL SYSTEMS. ALL RIGHTS RESERVED.</p>
	</footer>

	<script>
		// Init Lucide
		lucide.createIcons();

		// Navbar Scroll Logic
		window.addEventListener('scroll', () => {
			const nav = document.getElementById('navbar');
			if (window.scrollY > 50) nav.classList.add('scrolled');
			else nav.classList.remove('scrolled');
		});

		// Intersection Observer for Reveal Animations
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.classList.add('active');
				}
			});
		}, { threshold: 0.15 });

		document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
	</script>
</body>

</html>