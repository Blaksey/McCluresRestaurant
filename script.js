// Load navbar and footer
async function loadComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
    }
}

// Set active navigation link based on current page
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-menu a');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

async function fetchJson(filePath) {
    const response = await fetch(filePath);

    if (!response.ok) {
        throw new Error(`Failed to load ${filePath}: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

function createElement(tagName, options = {}) {
    const { className, text, attributes = {} } = options;
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (typeof text === 'string') {
        element.textContent = text;
    }

    Object.entries(attributes).forEach(([name, value]) => {
        if (value !== undefined && value !== null) {
            element.setAttribute(name, value);
        }
    });

    return element;
}

function createMenuItemElement(item) {
    const itemElement = createElement('div', { className: 'menu-list-item' });
    const nameElement = createElement('span', { className: 'item-name' });

    if (item.title) {
        nameElement.appendChild(createElement('span', { className: 'item-title', text: item.title }));
    } else {
        nameElement.textContent = item.name || '';
    }

    if (item.description) {
        nameElement.appendChild(createElement('span', { className: 'item-description', text: item.description }));
    }

    itemElement.appendChild(nameElement);

    if (item.badge) {
        itemElement.appendChild(createElement('span', { className: 'location-badge', text: item.badge }));
    }

    if (item.price) {
        itemElement.appendChild(createElement('span', { className: 'item-price', text: item.price }));
    }

    return itemElement;
}

function createMenuBlockElement(block) {
    switch (block.type) {
        case 'note': {
            const fragment = document.createDocumentFragment();

            if (block.label) {
                fragment.appendChild(createElement('p', { className: 'menu-block-label', text: `${block.label}:` }));
            }

            fragment.appendChild(createElement('p', { className: 'category-note', text: block.text }));
            return fragment;
        }
        case 'badge':
            return createElement('span', { className: 'location-badge', text: block.text });
        case 'subheading':
            return createElement('h3', { className: 'dessert-subsection-heading', text: block.text });
        case 'list': {
            const listElement = createElement('div', { className: 'menu-list' });
            (block.items || []).forEach(item => {
                listElement.appendChild(createMenuItemElement(item));
            });
            return listElement;
        }
        case 'featured-item': {
            const featuredItemElement = createElement('div', { className: 'featured-menu-item' });
            const headerElement = createElement('div', { className: 'item-header' });

            headerElement.appendChild(createElement('span', { className: 'item-title', text: block.title }));
            headerElement.appendChild(createElement('span', { className: 'item-price', text: block.price }));

            featuredItemElement.appendChild(headerElement);
            featuredItemElement.appendChild(createElement('p', { className: 'item-description', text: block.description }));

            return featuredItemElement;
        }
        case 'chip-group': {
            const fragment = document.createDocumentFragment();

            if (block.label) {
                fragment.appendChild(createElement('p', { className: 'menu-block-label', text: `${block.label}:` }));
            }

            const chipGridElement = createElement('div', { className: 'flavor-grid' });
            (block.items || []).forEach(item => {
                chipGridElement.appendChild(createElement('div', { className: 'flavor-item', text: item }));
            });

            fragment.appendChild(chipGridElement);
            return fragment;
        }
        default:
            return document.createDocumentFragment();
    }
}

function renderMenuPage(menuData) {
    const menuRoot = document.querySelector('[data-menu-content]');
    const subnavContainer = document.querySelector('[data-menu-subnav]');
    const menuSubnav = document.querySelector('.menu-subnav');

    if (!menuRoot || !subnavContainer) {
        return;
    }

    menuRoot.replaceChildren();
    subnavContainer.replaceChildren();

    const contentFragment = document.createDocumentFragment();
    const categories = menuData.categories || [];

    contentFragment.appendChild(createElement('h1', { text: menuData.pageTitle || 'Our Menu' }));

    if (Array.isArray(menuData.pdfLinks) && menuData.pdfLinks.length > 0) {
        const pdfLinksElement = createElement('div', { className: 'menu-pdf-links' });

        menuData.pdfLinks.forEach(link => {
            pdfLinksElement.appendChild(createElement('a', {
                className: 'btn',
                text: `📄 ${link.label}`,
                attributes: {
                    href: link.href,
                    target: '_blank',
                    rel: 'noopener noreferrer'
                }
            }));
        });

        contentFragment.appendChild(pdfLinksElement);
    }

    if (Array.isArray(menuData.menuInfo) && menuData.menuInfo.length > 0) {
        const menuInfoElement = createElement('div', { className: 'menu-info' });

        menuData.menuInfo.forEach(section => {
            menuInfoElement.appendChild(createElement('h3', { text: section.title }));
            (section.details || []).forEach(detail => {
                menuInfoElement.appendChild(createElement('p', { text: detail }));
            });
        });

        contentFragment.appendChild(menuInfoElement);
    }

    categories.forEach(category => {
        const categoryElement = createElement('div', {
            className: 'menu-category',
            attributes: { id: category.id }
        });

        categoryElement.appendChild(createElement('h2', { text: category.title }));
        (category.content || []).forEach(block => {
            categoryElement.appendChild(createMenuBlockElement(block));
        });

        contentFragment.appendChild(categoryElement);
    });

    const subnavFragment = document.createDocumentFragment();
    categories.forEach(category => {
        subnavFragment.appendChild(createElement('a', {
            className: 'subnav-link',
            text: category.navLabel || category.title,
            attributes: { href: `#${category.id}` }
        }));
    });

    menuRoot.appendChild(contentFragment);
    subnavContainer.appendChild(subnavFragment);

    if (menuSubnav) {
        menuSubnav.hidden = categories.length === 0;
    }
}

async function initializeMenuPage() {
    const menuRoot = document.querySelector('[data-menu-content]');

    if (!menuRoot) {
        return;
    }

    try {
        const menuData = await fetchJson('menu-data.json');
        renderMenuPage(menuData);
    } catch (error) {
        const menuSubnav = document.querySelector('.menu-subnav');

        if (menuSubnav) {
            menuSubnav.hidden = true;
        }

        menuRoot.replaceChildren(
            createElement('p', {
                className: 'menu-error',
                text: 'Unable to load the menu right now. Please try again shortly or use the printable menu PDFs.'
            })
        );

        console.error('Error loading menu data:', error);
    }
}

// Initialize mobile menu and load components
document.addEventListener('DOMContentLoaded', async function() {
    // Load navbar and footer
    await loadComponent('navbar-placeholder', 'navbar.html');
    await loadComponent('footer-placeholder', 'footer.html');
    await initializeMenuPage();

    // Move menu subnav inside navbar placeholder if it exists
    const menuSubnav = document.querySelector('.menu-subnav');
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (menuSubnav && navbarPlaceholder) {
        navbarPlaceholder.appendChild(menuSubnav);
    }

    // Set active nav link
    setActiveNavLink();

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navMenu.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);

        if (!isClickInsideNav && !isClickOnToggle && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    });

    // Close menu when window is resized to desktop size
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    });

    // Menu sub-navigation smooth scrolling and active state
    const subnavLinks = document.querySelectorAll('.subnav-link');

    if (subnavLinks.length > 0) {
        // Smooth scroll to sections (handled by CSS scroll-behavior and scroll-padding-top)
        subnavLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Highlight active section on scroll
        const sections = Array.from(subnavLinks).map(link => {
            const id = link.getAttribute('href').substring(1);
            return document.getElementById(id);
        }).filter(section => section !== null);

        function updateActiveLink() {
            const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
            const subnavHeight = document.querySelector('.menu-subnav')?.offsetHeight || 0;
            const scrollPosition = window.scrollY + navbarHeight + subnavHeight + 100;

            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });

            subnavLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        }

        // Update on scroll with throttling for performance
        let ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    updateActiveLink();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Initial update
        updateActiveLink();
    }

    // Back to Top Button
    const backToTopButton = document.getElementById('backToTop');

    if (backToTopButton) {
        // Show/hide button based on scroll position
        function toggleBackToTopButton() {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        }

        // Scroll to top when clicked
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Add to existing scroll listener
        let backToTopTicking = false;
        window.addEventListener('scroll', function() {
            if (!backToTopTicking) {
                window.requestAnimationFrame(function() {
                    toggleBackToTopButton();
                    backToTopTicking = false;
                });
                backToTopTicking = true;
            }
        });

        // Initial check
        toggleBackToTopButton();
    }
});
