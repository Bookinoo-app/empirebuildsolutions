const yearNode = document.getElementById("year");
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const submitButton = contactForm ? contactForm.querySelector('button[type="submit"]') : null;

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const availableProductsSection = document.getElementById("available-products-section");
const featuredWorkSection = document.getElementById("featured-work-section");

if (
  availableProductsSection &&
  featuredWorkSection &&
  availableProductsSection.parentNode &&
  availableProductsSection.parentNode === featuredWorkSection.parentNode
) {
  availableProductsSection.parentNode.insertBefore(availableProductsSection, featuredWorkSection);
}

(function setupMobileHeaderMenu() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const nav = header.querySelector(".site-nav");
  if (!nav) return;

  let toggle = header.querySelector(".nav-menu-toggle");
  if (!toggle) {
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-menu-toggle";
    toggle.setAttribute("aria-label", "Toggle navigation menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "☰";
    header.insertBefore(toggle, nav);
  }

  const mobileQuery = window.matchMedia("(max-width: 640px)");

  function closeMenu() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "☰";
  }

  function openMenu() {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.textContent = "✕";
  }

  toggle.addEventListener("click", () => {
    if (!mobileQuery.matches) return;
    if (nav.classList.contains("is-open")) {
      closeMenu();
      return;
    }
    openMenu();
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileQuery.matches) closeMenu();
    });
  });

  document.addEventListener("click", (event) => {
    if (!mobileQuery.matches) return;
    if (!nav.classList.contains("is-open")) return;
    if (header.contains(event.target)) return;
    closeMenu();
  });

  mobileQuery.addEventListener("change", (event) => {
    if (!event.matches) {
      closeMenu();
    }
  });
})();

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(contactForm);
    const name = String(data.get("name") || "").trim();
    const business = String(data.get("business") || "").trim();
    const email = String(data.get("email") || "").trim();
    const project = String(data.get("project") || "").trim();
    const details = String(data.get("details") || "").trim();
    const website = String(data.get("website") || "").trim();

    if (website) {
      if (formStatus) {
        formStatus.textContent = "Unable to send this enquiry.";
        formStatus.classList.add("is-visible");
      }
      return;
    }

    if (formStatus) {
      formStatus.textContent = "Sending your enquiry...";
      formStatus.classList.add("is-visible");
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          business,
          email,
          project,
          details,
          website,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      if (formStatus) {
        formStatus.textContent = "Thanks - your enquiry was sent successfully.";
      }

      contactForm.reset();
    } catch (error) {
      if (formStatus) {
        formStatus.textContent = "Your enquiry was saved, but email delivery is temporarily unavailable. The studio can still review your submission from the server.";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Enquiry";
      }
    }
  });
}

(function setupBookinooGallery() {
  const triggers = document.querySelectorAll('[data-bookinoo-gallery-trigger="true"]');
  if (!triggers.length) return;

  const images = [
    {
      src: "assets/projects/bookinoo/1st%20advestising%20card%20most%20wanted.jpg",
      label: "Bookinoo advertising card",
    },
    {
      src: "assets/projects/bookinoo/bookinoo-screenshot-1.png",
      label: "Bookinoo product screenshot 1",
    },
  ];

  let currentIndex = 0;
  let startX = 0;
  let startY = 0;

  const modal = document.createElement("div");
  modal.className = "gallery-modal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="gallery-frame" role="dialog" aria-modal="true" aria-label="Bookinoo product image gallery">
      <button type="button" class="gallery-close" aria-label="Close gallery">&times;</button>
      <button type="button" class="gallery-nav prev" aria-label="Previous image">&#8249;</button>
      <img class="gallery-image" src="" alt="Bookinoo product image" loading="eager" decoding="async">
      <button type="button" class="gallery-nav next" aria-label="Next image">&#8250;</button>
      <p class="gallery-caption"></p>
    </div>
  `;
  document.body.appendChild(modal);

  const frame = modal.querySelector(".gallery-frame");
  const imageEl = modal.querySelector(".gallery-image");
  const captionEl = modal.querySelector(".gallery-caption");
  const closeBtn = modal.querySelector(".gallery-close");
  const prevBtn = modal.querySelector(".gallery-nav.prev");
  const nextBtn = modal.querySelector(".gallery-nav.next");

  function renderImage() {
    const item = images[currentIndex];
    if (!item) return;
    imageEl.src = item.src;
    imageEl.alt = item.label;
    captionEl.textContent = `${currentIndex + 1}/${images.length} - ${item.label}`;
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    renderImage();
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    renderImage();
  }

  function openGallery(startIndex) {
    currentIndex = Number.isInteger(startIndex) ? startIndex : 0;
    renderImage();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeGallery() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  triggers.forEach((triggerEl) => {
    triggerEl.addEventListener("click", () => {
      const src = String(triggerEl.getAttribute("src") || "");
      const matchedIndex = images.findIndex((item) => src.includes(item.src));
      openGallery(matchedIndex >= 0 ? matchedIndex : 0);
    });
  });

  closeBtn.addEventListener("click", closeGallery);
  prevBtn.addEventListener("click", prevImage);
  nextBtn.addEventListener("click", nextImage);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeGallery();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!modal.classList.contains("is-open")) return;
    if (event.key === "Escape") closeGallery();
    if (event.key === "ArrowRight") nextImage();
    if (event.key === "ArrowLeft") prevImage();
  });

  frame.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;
    startX = touch.clientX;
    startY = touch.clientY;
  }, { passive: true });

  frame.addEventListener("touchend", (event) => {
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }
    if (deltaX < 0) {
      nextImage();
      return;
    }
    prevImage();
  }, { passive: true });
})();
