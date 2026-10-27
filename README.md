# Kate Soliven Portfolio Website

Last updated: October 2026

<p align="center">
  <img src="images/about-cherry-blossoms.png" alt="Illustration overlooking the Washington Monument framed by cherry blossoms" width="320">
</p>

This is Kate Soliven's personal portfolio website, built with JavaScript, CSS, HTML, Bootstrap, and jQuery. It is based on a customized Colorlib template and presents a professional profile focused on systems engineering and software engineering. The site includes an About section, expertise overview, technical skills, education, professional certifications and badges, supported client organizations, work experience, portfolio projects, organizations, references, contact form integration, downloadable resume PDF, and a cherry blossom-inspired day/night theme.

Current styling note: the live site loads `css/style.css` and `css/switch.css` directly. The older `switch.scss` files in the repo are legacy placeholders and are not the current deployment source of truth. The project also uses local assets for the footer signature font and night-mode hero images.

## Built With

[<img src="https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white">](https://getbootstrap.com/) [<img src="https://img.shields.io/badge/CSS-239120?&style=for-the-badge&logo=css3&logoColor=white">](https://css3.com/) [<img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white">](https://html.com/)  [<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">](https://www.javascript.com/) [<img src="https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white">](https://jquery.com/)

Additional libraries and integrations used in the site:

- Bootstrap
- Flexslider
- Owl Carousel
- Animate.css
- EmailJS
- Font Awesome
- Local font assets for the footer signature

## Design Tools

[<img src="https://img.shields.io/badge/Adobe%20Illustrator-FF9A00?style=for-the-badge&logo=adobe%20illustrator&logoColor=white">](https://www.adobe.com/products/illustrator/campaign/pricing.html?sdid=KKQML&mv=search&ef_id=EAIaIQobChMI0d2RuZ6mhAMVAHFHAR1IagCzEAAYASAAEgLP5_D_BwE:G:s&s_kwcid=AL!3085!3!356518781933!e!!g!!illustrator!1711729586!70905759350&gad_source=1) [<img src="https://img.shields.io/badge/Adobe%20Photoshop-31A8FF?style=for-the-badge&logo=Adobe%20Photoshop&logoColor=black">](https://www.adobe.com/products/photoshop/landpa.html?sdid=P79NQKGF&mv=search&mv2=paidsearch&ef_id=EAIaIQobChMIt9DYjZ6mhAMVBWtHAR2hAQRuEAAYASAAEgIQp_D_BwE:G:s&s_kwcid=AL!3085!3!673842496258!e!!g!!photoshop!1712238394!67643541820&mv=search&gad_source=1) 

Mermaid is listed at 80% under Developer Tools for diagrams as code in systems and software engineering.

## Wireframing

[<img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white">](https://www.figma.com/) 

## Current Focus

- Validate the responsive layouts on physical phones and iPads, including Safari
- Add newer React, Angular, FastAPI, NestJS, and Rust portfolio work
- Tighten SEO and social metadata
- Keep improving section flow and visual consistency
- Continue cleaning up legacy template structure and styling
- Keep refining the cherry blossom night mode with dedicated assets instead of broad CSS overrides
- Keep site assets local where possible so portfolio thumbnails, resume links, and client imagery remain reliable

## Phone and iPad Support

- Responsive layouts use a navigation drawer up to 1180px, with full-width content and tablet grids.
- The drawer supports touch controls, Escape to close, and closes after choosing a section; hidden navigation is excluded from keyboard focus.
- Hero sizing follows the available mobile viewport, and project captions remain visible on touchscreens.
- Contact fields use mobile-friendly sizing, autofill, and an email keyboard. The form stacks on smaller screens.
- Phone and tablet content appears without waiting for scroll-animation queues. Both color themes share the responsive styles.

To preview, serve the repository with `python3 -m http.server 8000` and open `http://localhost:8000`. Use browser device emulation to check phone widths (320–390px), iPad portrait (768–834px), tablet landscape (1024–1180px), and desktop (1366px and above). Check both themes, navigation, project links, education panels, and the contact form. A physical iPhone/iPad Safari check remains useful for device-specific behavior.

## Changes - October 2026

- Updated skills, work experience, and the downloadable resume
- Added a personal touch to the About Me section
- Improved spacing, colors, and readability in both light and dark modes
- Made the site easier to browse on phones and iPads

## Other Content Updates

- Refined the About section with broader experience wording and a new optimized profile avatar
- Tightened the skills, expertise cards, organizations, and experience copy for a more consistent professional tone
- Updated Georgia Tech education content to reflect graduation in August 2026 with a final 4.0 GPA
- Updated the downloadable resume PDF to reflect Georgia Tech graduation and final GPA
- Added GTRI to the supported client organizations graphic while preserving the original client image
- Moved remote portfolio thumbnails into local image assets for more reliable loading
- Improved reference icon rendering in light and night mode so avatar graphics are not cropped
- Added more descriptive image alt text and safer external-link attributes
- Added the Foundry & AIP Builder Foundations digital badge to the certifications section with a local PDF credential
- Reduced older or less relevant experience entries to keep the timeline focused
- Curated the education section to emphasize the strongest and most relevant academic items
- Updated section labels and date formatting for better consistency across the site

## Future Enhancements

- Add stronger recent portfolio projects to replace older demo work where appropriate
- Improve SEO metadata and social preview content
- Continue reducing inline styles and legacy template markup as sections are refined

## Author

- **Kate Soliven** - [ksoliven](https://github.com/ksoliven)

## Acknowledgments

* Colorlib
* Coding Dojo
* Adobe

## Earlier Changes - April 2026

* Updated site structure and fixed broken HTML section nesting
* Added cherry blossom day/night theme support with a persistent toggle
* Added drifting petal animation and blossom styling refinements
* Added dedicated night-mode hero assets for better visual consistency
* Added a Sakura-style signature footer with custom local font assets
* Added animation and styling updates for the theme switch
* Updated mobile styling and responsive behavior
* Refined dark mode readability across portfolio, certifications, organizations, and contact sections
* Updated portfolio copy, section labels, education, and experience content to better match the current site
