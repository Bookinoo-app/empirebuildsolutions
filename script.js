const yearNode = document.getElementById("year");
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const submitButton = contactForm ? contactForm.querySelector('button[type="submit"]') : null;

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

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
      const subject = encodeURIComponent(`Project enquiry: ${project || "Empire Build Solutions"}`);
      const body = encodeURIComponent([
        `Name: ${name}`,
        `Business: ${business}`,
        `Email: ${email}`,
        `Project: ${project}`,
        "",
        "Project details:",
        details,
      ].join("\n"));

      if (formStatus) {
        formStatus.textContent = "Direct form delivery is not available yet here, so your email app is opening instead.";
      }

      window.location.href = `mailto:empirebuildsolutionsltd@gmail.com?subject=${subject}&body=${body}`;
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Enquiry";
      }
    }
  });
}
