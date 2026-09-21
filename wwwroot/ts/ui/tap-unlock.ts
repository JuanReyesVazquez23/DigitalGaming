// Layer: ts/ui/tap-unlock — 10 toques en el nombre para abrir el modo admin.
export interface TapUnlock {
  taps: number;
  unlocked: boolean;
  /** Vuelve a bloquear y limpia el contador (salida del modo admin). */
  lock: () => void;
}

export function setupTapUnlock(
  titleEl: HTMLElement,
  hintEl: HTMLElement,
  onUnlock: () => void,
  requiredTaps = 10,
  windowMs = 3000
): TapUnlock {
  const state: TapUnlock = {
    taps: 0,
    unlocked: false,
    lock: () => {
      state.taps = 0;
      state.unlocked = false;
      firstTapAt = 0;
      renderHint();
    },
  };
  let firstTapAt = 0;

  function renderHint(): void {
    if (state.unlocked) {
      hintEl.textContent = "";
      return;
    }
    if (state.taps === 0) {
      hintEl.textContent = "";
    } else if (state.taps < requiredTaps - 2) {
      hintEl.textContent = ".".repeat(state.taps);
    } else if (state.taps < requiredTaps) {
      hintEl.textContent = `Casi... ${state.taps}/${requiredTaps}`;
      titleEl.classList.remove("unlock-shake");
      void titleEl.offsetWidth; // reinicia animación
      titleEl.classList.add("unlock-shake");
    }
  }

  titleEl.addEventListener("click", () => {
    if (state.unlocked) return;
    const now = Date.now();
    // Why ventana de tiempo: evita toques accidentales dispersos.
    if (now - firstTapAt > windowMs) {
      state.taps = 0;
      firstTapAt = now;
    }
    if (state.taps === 0) firstTapAt = now;
    state.taps += 1;
    renderHint();
    if (state.taps >= requiredTaps) {
      state.unlocked = true;
      state.taps = 0;
      renderHint();
      onUnlock();
    }
  });

  return state;
}
