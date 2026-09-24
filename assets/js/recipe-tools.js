document.addEventListener("DOMContentLoaded", () => {
  const wakeToggle = document.getElementById("wake-lock-toggle");
  const wakeLabel = document.querySelector(".wake-lock-label");
  const resetButton = document.getElementById("reset-progress-btn");
  const tools = document.querySelector(".recipe-tools");
  const status = document.getElementById("recipe-tools-status");

  if (!wakeToggle || !resetButton) return;

  const LABELS = {
    en: {
      ingredient: name => `Mark ${name} complete`,
      step: number => `Mark step ${number} complete`,
      tools: "Recipe tools",
      wake: "Keep screen awake",
      wakeUnavailable: "Keep screen awake unavailable",
      wakeOn: "Screen will stay awake",
      wakeOff: "Screen wake lock released",
      reset: "Reset checklist",
      resetConfirm: "Reset all checked ingredients and steps?",
      resetDone: "Checklist reset"
    },
    ja: {
      ingredient: name => `${name}を完了にする`,
      step: number => `手順${number}を完了にする`,
      tools: "レシピツール",
      wake: "画面をオンのままにする",
      wakeUnavailable: "画面オン機能は利用できません",
      wakeOn: "画面をオンのままにします",
      wakeOff: "画面オン機能を解除しました",
      reset: "チェックリストをリセット",
      resetConfirm: "材料と手順のチェックをすべてリセットしますか？",
      resetDone: "チェックリストをリセットしました"
    }
  };

  const storageKey = `recipeProgress:${window.location.pathname}`;
  let progress = { ingredient: {}, step: {} };
  let wakeLock = null;
  let wakeLockWanted = false;

  try {
    const savedProgress = JSON.parse(localStorage.getItem(storageKey));
    if (savedProgress?.ingredient && savedProgress?.step) progress = savedProgress;
  } catch (error) {
    console.warn("recipe-tools: could not restore checklist", error);
  }

  const currentLanguage = () => document.documentElement.lang === "ja" ? "ja" : "en";

  const announce = message => {
    if (status) status.textContent = message;
  };

  const saveProgress = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch (error) {
      console.warn("recipe-tools: could not save checklist", error);
    }
  };

  const syncChecklistItem = (type, index, checked) => {
    document.querySelectorAll(`[data-progress-type="${type}"][data-progress-index="${index}"]`)
      .forEach(input => {
        input.checked = checked;
        input.parentElement.classList.toggle("recipe-progress-complete", checked);
      });
  };

  const addChecklist = (section, lang) => {
    const ingredientRows = Array.from(section.querySelectorAll(".ingredient-quantity"));
    const instructionHeading = section.querySelector(".title-instruction");
    const instructionContainer = instructionHeading?.closest(".container");
    const steps = instructionContainer
      ? Array.from(instructionContainer.querySelectorAll("ol > li"))
      : [];

    instructionContainer?.querySelectorAll("ol").forEach(list => {
      list.classList.add("step-checklist");
    });

    const addCheckbox = (item, type, index, label, displayNumber = index + 1) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "recipe-progress-checkbox";
      checkbox.dataset.progressType = type;
      checkbox.dataset.progressIndex = String(index);
      checkbox.setAttribute("aria-label", label);
      checkbox.checked = Boolean(progress[type][index]);

      if (type === "step") {
        checkbox.className += " step-progress-checkbox";
        checkbox.dataset.stepNumber = String(displayNumber);
        item.classList.add("recipe-step-item");
      }

      item.classList.toggle("recipe-progress-complete", checkbox.checked);

      const updateProgress = () => {
        progress[type][index] = checkbox.checked;
        saveProgress();
        syncChecklistItem(type, index, checkbox.checked);
      };

      checkbox.addEventListener("change", updateProgress);

      if (type === "step") {
        item.addEventListener("click", event => {
          if (event.target === checkbox) return;
          checkbox.checked = !checkbox.checked;
          updateProgress();
        });
      }

      item.prepend(checkbox);
    };

    ingredientRows.forEach((row, index) => {
      const name = row.querySelector(".column-left-ingredient")?.textContent.trim() || `${index + 1}`;
      addCheckbox(row, "ingredient", index, LABELS[lang].ingredient(name));
    });

    steps.forEach((step, index) => {
      const siblings = step.parentElement ? Array.from(step.parentElement.children) : steps;
      const displayNumber = siblings.indexOf(step) + 1;
      addCheckbox(step, "step", index, LABELS[lang].step(displayNumber), displayNumber);
    });
  };

  document.querySelectorAll(".lang").forEach(section => {
    addChecklist(section, section.dataset.lang === "ja" ? "ja" : "en");
  });

  const updateLabels = lang => {
    const labels = LABELS[lang];
    wakeLabel.textContent = "wakeLock" in navigator ? labels.wake : labels.wakeUnavailable;
    resetButton.textContent = labels.reset;
    if (tools) tools.setAttribute("aria-label", labels.tools);
  };

  const requestWakeLock = async () => {
    if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;

    try {
      wakeLock = await navigator.wakeLock.request("screen");
      announce(LABELS[currentLanguage()].wakeOn);
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
        if (!wakeLockWanted) wakeToggle.checked = false;
      });
    } catch (error) {
      wakeToggle.checked = false;
      wakeLockWanted = false;
      announce(LABELS[currentLanguage()].wakeUnavailable);
      console.warn("recipe-tools: could not acquire wake lock", error);
    }
  };

  if (!("wakeLock" in navigator)) wakeToggle.disabled = true;
  updateLabels(currentLanguage());

  wakeToggle.addEventListener("change", async () => {
    wakeLockWanted = wakeToggle.checked;
    if (wakeLockWanted) {
      await requestWakeLock();
    } else {
      await wakeLock?.release();
      wakeLock = null;
      announce(LABELS[currentLanguage()].wakeOff);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (wakeLockWanted && document.visibilityState === "visible" && !wakeLock) requestWakeLock();
  });

  resetButton.addEventListener("click", () => {
    const labels = LABELS[currentLanguage()];
    if (!window.confirm(labels.resetConfirm)) return;

    progress = { ingredient: {}, step: {} };
    saveProgress();
    document.querySelectorAll(".recipe-progress-checkbox").forEach(input => {
      input.checked = false;
      input.parentElement.classList.remove("recipe-progress-complete");
    });
    announce(labels.resetDone);
  });

  document.addEventListener("languageChanged", event => updateLabels(event.detail.lang));
});
