document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("toggle-btn");
  const sections = Array.from(document.querySelectorAll(".lang"));

  if (sections.length === 0) return;

  // Detect available languages on the page
  const availableLangs = sections.map(s => s.dataset.lang);

  // Detect browser language (en / ja)
  const browserLang = navigator.language.startsWith("ja") ? "ja" : "en";

  // Choose initial language:
  // 1. Browser language if available
  // 2. Otherwise first available language
  let currentLang = availableLangs.includes(browserLang)
    ? browserLang
    : availableLangs[0];

  // Apply language visibility
  function applyLanguage(lang) {
    sections.forEach(section => {
      section.classList.toggle(
        "active",
        section.dataset.lang === lang
      );
    });

    // Hide toggle button if only one language exists
    if (availableLangs.length === 1) {
      button.style.display = "none";
      return;
    }

    // Update button text
    button.textContent = lang === "en" ? "日本語" : "English";
  }

  // Initial render
  applyLanguage(currentLang);

  // Toggle handler
  button.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "ja" : "en";
    applyLanguage(currentLang);
  });
});
