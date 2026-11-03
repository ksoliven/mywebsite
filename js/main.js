;(function () {
	
	'use strict';



	var compactLayout = window.matchMedia('(max-width: 1180px)');

	var fullHeight = function() {
		var resize = function() {
			// Small screens use CSS viewport units so browser toolbars do not crop content.
			$('.js-fullheight').css('height', compactLayout.matches ? '' : $(window).height());
		};
		resize();
		$(window).on('resize', resize);
	};

	var setMenuOpen = function(open) {
		$('body').toggleClass('offcanvas', open);
		$('.js-colorlib-nav-toggle').toggleClass('active', open)
			.attr('aria-expanded', String(open))
			.attr('aria-label', open ? 'Close navigation' : 'Open navigation');
		// Prevent keyboard focus from entering the drawer while it is offscreen.
		$('#colorlib-aside').prop('inert', compactLayout.matches && !open);
	};


	var counter = function() {
		$('.js-counter').countTo({
			 formatter: function (value, options) {
	      return value.toFixed(options.decimals);
	    },
		});
	};


	var counterWayPoint = function() {
		if ($('#colorlib-counter').length > 0 ) {
			$('#colorlib-counter').waypoint( function( direction ) {
										
				if( direction === 'down' && !$(this.element).hasClass('animated') ) {
					setTimeout( counter , 400);					
					$(this.element).addClass('animated');
				}
			} , { offset: '90%' } );
		}
	};



	var burgerMenu = function() {
		$('.js-colorlib-nav-toggle').on('click', function() {
			setMenuOpen(!$('body').hasClass('offcanvas'));
		});
		setMenuOpen(false);
		$(window).on('resize', function() {
			setMenuOpen(false);
		});
	};

	var mobileMenuOutsideClick = function() {
		$(document).on('click', function(event) {
			if (!$(event.target).closest('#colorlib-aside, .js-colorlib-nav-toggle').length) {
				setMenuOpen(false);
			}
		});
		$(document).on('keydown', function(event) {
			if (event.key === 'Escape' && $('body').hasClass('offcanvas')) {
				setMenuOpen(false);
				$('.js-colorlib-nav-toggle').trigger('focus');
			}
		});
	};


	// Keep section navigation smooth without waiting for staggered content reveals.
	var openSection = function(sectionName) {
		var section = document.querySelector('[data-section="' + sectionName + '"]');
		if (!section) return false;
		section.classList.add('section-open-immediately');
		document.dispatchEvent(new CustomEvent('portfolio:reveal', { detail: { section: section } }));
		$(section).find('.animate-box').removeClass('item-animate').addClass('animated');
		$('html, body').stop(true);
		setMenuOpen(false);
		var destination = Math.max(0, $(section).offset().top - 24);
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			window.scrollTo({ top: destination, behavior: 'instant' });
		} else {
			$('html, body').animate({ scrollTop: destination }, 360, 'swing', function() {
				navActive(sectionName);
			});
		}
		section.setAttribute('tabindex', '-1');
		section.focus({ preventScroll: true });
		navActive(sectionName);
		return true;
	};

	document.addEventListener('portfolio:navigate', function(event) {
		if (openSection(event.detail.section)) event.preventDefault();
	});

	var clickMenu = function() {

		$('#navbar a:not([class="external"]), .site-footer-links a[data-nav-section]').click(function(event){
			var section = $(this).data('nav-section');

			openSection(section);

			setMenuOpen(false);

		    event.preventDefault();
		    return false;
		});


	};

	// Reflect scrolling in navigation
	var navActive = function(section) {

		var $el = $('#navbar > ul');
		$el.find('li').removeClass('active');
		$el.each(function(){
			$(this).find('a[data-nav-section="'+ section +'"]').closest('li').addClass('active');
		});

	};

	var navigationSection = function() {

		var $section = $('section[data-section]');
		
		$section.waypoint(function(direction) {
		  	
		  	if (direction === 'down') {
		    	navActive($(this.element).data('section'));
		  	}
		}, {
	  		offset: '150px'
		});

		$section.waypoint(function(direction) {
		  	if (direction === 'up') {
		    	navActive($(this.element).data('section'));
		  	}
		}, {
		  	offset: function() { return -$(this.element).height() + 155; }
		});

	};






	var sliderMain = function() {
		
	  	$('#colorlib-hero .flexslider').flexslider({
			animation: "fade",
			slideshowSpeed: 5000,
			directionNav: true,
			start: function(){
				setTimeout(function(){
					$('.slider-text').removeClass('animated fadeInUp');
					$('.flex-active-slide').find('.slider-text').addClass('animated fadeInUp');
				}, 500);
			},
			before: function(){
				setTimeout(function(){
					$('.slider-text').removeClass('animated fadeInUp');
					$('.flex-active-slide').find('.slider-text').addClass('animated fadeInUp');
				}, 500);
			}

	  	});

	};

	var themeSwitch = function() {
		var root = document.documentElement;
		var button = document.getElementById('theme-switch');

		if (!button) {
			return;
		}

		var state = button.querySelector('.theme-switch-state');

		var setTheme = function(theme) {
			var isNight = theme === 'night';
			root.setAttribute('data-theme', isNight ? 'night' : 'blossom');
			button.setAttribute('aria-pressed', isNight ? 'true' : 'false');
			button.classList.toggle('is-night', isNight);
			if (state) {
				state.textContent = isNight ? 'Night Bloom' : 'Day Bloom';
			}
			try {
				localStorage.setItem('kate-theme', isNight ? 'night' : 'blossom');
			} catch (error) {}
		};

		setTheme(root.getAttribute('data-theme') || 'blossom');

		button.addEventListener('click', function() {
			var nextTheme = root.getAttribute('data-theme') === 'night' ? 'blossom' : 'night';
			setTheme(nextTheme);
		});
	};

	var stickyFunction = function() {

		var h = $('.image-content').outerHeight();

		if ($(window).width() <= 992 ) {
			$("#sticky_item").trigger("sticky_kit:detach");
		} else {
			$('.sticky-parent').removeClass('stick-detach');
			$("#sticky_item").trigger("sticky_kit:detach");
			$("#sticky_item").trigger("sticky_kit:unstick");
		}

		$(window).resize(function(){
			var h = $('.image-content').outerHeight();
			$('.sticky-parent').css('height', h);


			if ($(window).width() <= 992 ) {
				$("#sticky_item").trigger("sticky_kit:detach");
			} else {
				$('.sticky-parent').removeClass('stick-detach');
				$("#sticky_item").trigger("sticky_kit:detach");
				$("#sticky_item").trigger("sticky_kit:unstick");

			}
			

			

		});

		$('.sticky-parent').css('height', h);


	};

	// Expanding skills changes the positions cached by the section navigation.
	var refreshSkillsNavigation = function() {
		var refreshFrame;
		var refresh = function() {
			cancelAnimationFrame(refreshFrame);
			refreshFrame = requestAnimationFrame(function() {
				if (window.Waypoint) window.Waypoint.refreshAll();
			});
		};
		document.querySelectorAll('.skill-group').forEach(function(group) {
			group.addEventListener('toggle', refresh);
		});
		var skills = document.querySelector('.skill-groups');
		if (skills && window.ResizeObserver) {
			var resizeTimer;
			new ResizeObserver(function() {
				clearTimeout(resizeTimer);
				resizeTimer = setTimeout(refresh, 80);
			}).observe(skills);
		}
	};

	// Document on load.
	$(function(){
		$('#copyright-year').text(new Date().getFullYear());
		fullHeight();
		counter();
		counterWayPoint();
		burgerMenu();

		clickMenu();
		// navActive();
		navigationSection();
		refreshSkillsNavigation();
		// windowScroll();


		mobileMenuOutsideClick();
		sliderMain();
		themeSwitch();
		stickyFunction();
	});


}());
