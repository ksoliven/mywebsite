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

	// Animations
	var contentWayPoint = function() {
		if (compactLayout.matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			$('.animate-box').addClass('animated');
			return;
		}
		var i = 0;
		$('.animate-box').waypoint( function( direction ) {

			if( direction === 'down' && !$(this.element).hasClass('animated') ) {
				
				i++;

				$(this.element).addClass('item-animate');
				setTimeout(function(){

					$('body .animate-box.item-animate').each(function(k){
						var el = $(this);
						setTimeout( function () {
							var effect = el.data('animate-effect');
							if ( effect === 'fadeIn') {
								el.addClass('fadeIn animated');
							} else if ( effect === 'fadeInLeft') {
								el.addClass('fadeInLeft animated');
							} else if ( effect === 'fadeInRight') {
								el.addClass('fadeInRight animated');
							} else {
								el.addClass('fadeInUp animated');
							}

							el.removeClass('item-animate');
						},  k * 200, 'easeInOutExpo' );
					});
					
				}, 100);
				
			}

		} , { offset: '85%' } );
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


	var clickMenu = function() {

		$('#navbar a:not([class="external"])').click(function(event){
			var section = $(this).data('nav-section');

				if ( $('[data-section="' + section + '"]').length ) {
			    	$('html, body').animate({
			        	scrollTop: $('[data-section="' + section + '"]').offset().top - 55
			    	}, 500);
			   }

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

	var owlCrouselFeatureSlide = function() {
		$('.owl-carousel').owlCarousel({
			animateOut: 'fadeOut',
		   animateIn: 'fadeIn',
		   autoplay: true,
		   loop:true,
		   margin:0,
		   nav:true,
		   dots: false,
		   autoHeight: true,
		   items: 1,
		   navText: [
		      "<i class='icon-arrow-left3 owl-direction'></i>",
		      "<i class='icon-arrow-right3 owl-direction'></i>"
	     	]
		})
	};

	// Document on load.
	$(function(){
		fullHeight();
		counter();
		counterWayPoint();
		contentWayPoint();
		burgerMenu();

		clickMenu();
		// navActive();
		navigationSection();
		// windowScroll();


		mobileMenuOutsideClick();
		sliderMain();
		themeSwitch();
		stickyFunction();
		owlCrouselFeatureSlide();
	});


}());
