document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("toggle-btn");
  const sections = Array.from(document.querySelectorAll(".lang"));
  const badges = document.querySelectorAll(".lang-badge");

  if (sections.length === 0 || !button) return;

  const availableLangs = sections.map(s => s.dataset.lang);
  const browserLang = navigator.language.startsWith("ja") ? "ja" : "en";

  let currentLang = availableLangs.includes(browserLang)
    ? browserLang
    : availableLangs[0];

  function applyLanguage(lang) {
    sections.forEach(section => {
      section.classList.toggle("active", section.dataset.lang === lang);
    });

    badges.forEach(badge => {
      badge.classList.toggle("active", badge.dataset.lang === lang);
    });

    // Hide toggle if only one language exists
    if (availableLangs.length === 1) {
      button.style.display = "none";
    }
    // Update header title if bilingual
const titleEl = document.querySelector(".site-title");
if (titleEl) {
  const activeSection = sections.find(s => s.dataset.lang === lang);
  const h1 = activeSection?.querySelector("h1");
  if (h1) titleEl.textContent = h1.textContent;
}

  }

  // Initial render
  applyLanguage(currentLang);

  // Toggle language on click
  button.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "ja" : "en";
    applyLanguage(currentLang);
  });
});
