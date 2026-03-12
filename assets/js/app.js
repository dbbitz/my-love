const els = {
  pageTitle: document.querySelector("#pageTitle"),
  pageSubtitle: document.querySelector("#pageSubtitle"),
  stepIcon: document.querySelector("#stepIcon"),
  stepCounter: document.querySelector("#stepCounter"),
  stepTitle: document.querySelector("#stepTitle"),
  stepText: document.querySelector("#stepText"),
  gallery: document.querySelector("#gallery"),
  storyCard: document.querySelector("#storyCard"),
  nextButton: document.querySelector("#nextButton"),
  musicButton: document.querySelector("#musicButton"),
  statusMessage: document.querySelector("#statusMessage"),
  unlockActions: document.querySelector("#unlockActions"),
  kissYesButton: document.querySelector("#kissYesButton"),
  kissNoButton: document.querySelector("#kissNoButton"),
  giftCodeCard: document.querySelector("#giftCodeCard"),
  giftCodeValue: document.querySelector("#giftCodeValue"),
};

const state = {
  config: null,
  stepIndex: 0,
  audio: null,
  isMusicPlaying: false,
  isGiftUnlocked: false,
};

const defaultIcon = "❤";

async function init() {
  try {
    const config = await loadContent();
    validateContent(config);
    state.config = config;

    els.pageTitle.textContent = config.pageTitle || "Nossa Historia";
    els.pageSubtitle.textContent =
      config.pageSubtitle || "Uma homenagem especial para voce.";
    els.nextButton.textContent =
      config.nextButtonLabel || "Clique para avancar";

    setupMusic(config.music);
    setupAdvanceButton();
    renderStep();
  } catch (error) {
    showError(error);
  }
}

async function loadContent() {
  const response = await fetch("./data/content.json");
  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o arquivo data/content.json.");
  }
  return response.json();
}

function validateContent(config) {
  if (!config || !Array.isArray(config.steps) || config.steps.length === 0) {
    throw new Error("O content.json precisa ter ao menos uma etapa em steps.");
  }
}

function setupAdvanceButton() {
  els.nextButton.addEventListener("click", () => {
    if (!state.config) return;
    const lastIndex = state.config.steps.length - 1;

    if (state.stepIndex < lastIndex) {
      state.stepIndex += 1;
      animateCard(renderStep);
      return;
    }

    if (state.stepIndex === lastIndex) {
      state.stepIndex += 1;
      animateCard(renderUnlockVerificationScreen);
      return;
    }

    if (state.stepIndex === lastIndex + 1 && state.isGiftUnlocked) {
      state.stepIndex = 0;
      state.isGiftUnlocked = false;
      animateCard(renderStep);
      return;
    }

    state.stepIndex = 0;
    state.isGiftUnlocked = false;
    animateCard(renderStep);
  });
}

function setupUnlockButtons() {
  if (!els.kissYesButton || !els.kissNoButton) return;

  els.kissYesButton.addEventListener("click", () => {
    state.isGiftUnlocked = true;
    animateCard(renderGiftCodeScreen);
  });

  els.kissNoButton.addEventListener("click", () => {
    setStatus("Sem beijinho, sem presente. Tente novamente depois do beijo.");
  });
}

function setupMusic(musicConfig) {
  if (!musicConfig || !musicConfig.enabled || !musicConfig.src) {
    return;
  }

  const audio = new Audio(musicConfig.src);
  audio.loop = Boolean(musicConfig.loop);
  state.audio = audio;
  els.musicButton.classList.remove("hidden");

  els.musicButton.addEventListener("click", async () => {
    if (!state.audio) return;

    if (state.isMusicPlaying) {
      state.audio.pause();
      state.isMusicPlaying = false;
      els.musicButton.textContent = "Tocar musica";
      return;
    }

    try {
      await state.audio.play();
      state.isMusicPlaying = true;
      els.musicButton.textContent = "Pausar musica";
    } catch (_error) {
      setStatus("Toque novamente para iniciar a musica.");
    }
  });

  if (musicConfig.autoplay) {
    setStatus("Toque em 'Tocar musica' para iniciar a trilha sonora.");
  }
}

function renderStep() {
  const step = state.config.steps[state.stepIndex];
  if (!step) return;

  const stepNumber = state.stepIndex + 1;
  const total = state.config.steps.length;

  els.stepIcon.textContent = step.accentIcon || defaultIcon;

  els.stepTitle.textContent = step.title;
  els.stepText.textContent = step.text || "";
  resetUnlockFlow();
  renderImages(step.images || []);

  if (state.stepIndex === total - 1) {
    const unlockButtonLabel =
      state.config.unlockFlow?.buttonLabel ||
      state.config.finishButtonLabel ||
      "Desbloquear o meu presente 🔒";
    els.nextButton.textContent = unlockButtonLabel;
  } else {
    els.nextButton.textContent =
      state.config.nextButtonLabel || "Clique para avancar";
  }

  setStatus(step.hint || "");
}

function renderUnlockVerificationScreen() {
  const unlockFlow = state.config.unlockFlow || {};
  const total = state.config.steps.length;

  state.isGiftUnlocked = false;
  resetUnlockFlow();
  renderImages([]);
  els.stepIcon.textContent = unlockFlow.accentIcon || "🔒";
  if (els.stepCounter) {
    els.stepCounter.textContent = `Verificacao (${total} momentos)`;
  }
  els.stepTitle.textContent = unlockFlow.title || "Area protegida";
  els.stepText.textContent =
    unlockFlow.verificationMessage ||
    "Verificação de dois fatores, dê um beijinho no seu amor para resgatar o seu presente.";

  if (els.unlockActions) {
    els.unlockActions.classList.remove("hidden");
  }

  if (els.kissYesButton) {
    els.kissYesButton.textContent =
      unlockFlow.yesLabel || "Já dei um beijinho no meu amor";
  }
  if (els.kissNoButton) {
    els.kissNoButton.textContent =
      unlockFlow.noLabel || "Não dei um beijinho :(, odeio ele";
  }

  els.nextButton.classList.add("hidden");
  setStatus(unlockFlow.hint || "");
}

function renderGiftCodeScreen() {
  const giftData = state.config.gift || {};
  const finalData = state.config.final || {};

  if (!state.isGiftUnlocked) return;

  resetUnlockFlow();
  renderImages(giftData.images || []);
  els.stepIcon.textContent = giftData.accentIcon || "🎁";
  if (els.stepCounter) {
    els.stepCounter.textContent = "Presente desbloqueado";
  }
  els.stepTitle.textContent = giftData.title || "Presente desbloqueado!";
  els.stepText.textContent =
    giftData.text || "Use o codigo abaixo para resgatar o seu cartao presente.";
  els.giftCodeValue.textContent = giftData.code || "AMOR-6-MESES";
  els.giftCodeCard.classList.remove("hidden");
  els.nextButton.textContent = finalData.restartButtonLabel || "Recomecar";
  els.nextButton.classList.remove("hidden");
  setStatus(giftData.hint || "Presente liberado com sucesso.");
}

function renderImages(images) {
  els.gallery.innerHTML = "";

  if (!images.length) {
    const empty = document.createElement("p");
    empty.className = "status-message";
    els.gallery.appendChild(empty);
    return;
  }

  images.forEach((imageItem, index) => {
    const source = typeof imageItem === "string" ? imageItem : imageItem.src;
    const caption =
      typeof imageItem === "string" ? `Foto ${index + 1}` : imageItem.caption;

    if (!source) return;

    const figure = document.createElement("figure");
    figure.className = "photo-frame";

    const img = document.createElement("img");
    img.src = source;
    img.alt = caption || `Foto da etapa ${state.stepIndex + 1}`;
    img.loading = "lazy";

    figure.appendChild(img);

    if (caption) {
      const figCaption = document.createElement("figcaption");
      figCaption.textContent = caption;
      figure.appendChild(figCaption);
    }

    els.gallery.appendChild(figure);
  });
}

function animateCard(onMidpoint) {
  els.storyCard.classList.add("fade");
  window.setTimeout(() => {
    onMidpoint();
    els.storyCard.classList.remove("fade");
  }, 220);
}

function resetUnlockFlow() {
  if (els.unlockActions) {
    els.unlockActions.classList.add("hidden");
  }
  if (els.giftCodeCard) {
    els.giftCodeCard.classList.add("hidden");
  }
  if (els.nextButton) {
    els.nextButton.classList.remove("hidden");
  }
}

function setStatus(message) {
  els.statusMessage.textContent = message;
}

function showError(error) {
  const msg =
    error instanceof Error
      ? error.message
      : "Ocorreu um erro ao carregar a pagina.";

  els.stepTitle.textContent = "Nao foi possivel iniciar a homenagem";
  els.stepText.textContent = `${msg} Se abriu o arquivo direto no navegador, use um servidor local para habilitar o carregamento do JSON.`;
  els.gallery.innerHTML = "";
  resetUnlockFlow();
  els.nextButton.disabled = true;
  els.musicButton.classList.add("hidden");
  setStatus("Verifique data/content.json e tente novamente.");
}

setupUnlockButtons();
init();
