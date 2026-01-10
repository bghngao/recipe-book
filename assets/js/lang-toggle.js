document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("toggle-btn");
  const sections = document.querySelectorAll(".lang");

  let currentLang = "en";

  button.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "ja" : "en";

    sections.forEach(section => {
      section.classList.toggle(
        "active",
        section.dataset.lang === currentLang
      );
    });

    button.textContent = currentLang === "en" ? "日本語" : "English";
  });
});
