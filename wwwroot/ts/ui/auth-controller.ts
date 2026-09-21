// Layer: ts/ui/auth-controller — modal entrar/crear cuenta + chip de sesión en el header.
import { login, register } from "../data/auth-repository.js";
import { clearSession, getSession, saveSession } from "../services/session-store.js";

interface AuthDeps {
  onSessionChanged: () => void;
}

export function setupAuth(deps: AuthDeps): {
  openAuth: (mode?: "login" | "register", notice?: string) => void;
  refreshHeader: () => void;
} {
  const backdrop = getEl("authBackdrop");
  const title = getEl("authTitle");
  const tabLogin = getEl("tabLogin");
  const tabRegister = getEl("tabRegister");
  const notice = getEl("authNotice");
  const user = getInput("aUser");
  const pass = getInput("aPass") as HTMLInputElement;
  const error = getEl("authError");
  const submit = getEl("authSubmitBtn") as HTMLButtonElement;
  const loginBtn = getEl("loginBtn");
  const userChip = getEl("userChip");
  const userName = getEl("userName");

  let mode: "login" | "register" = "login";

  function setMode(m: "login" | "register"): void {
    mode = m;
    tabLogin.classList.toggle("active", m === "login");
    tabRegister.classList.toggle("active", m === "register");
    title.textContent = m === "login" ? "Entrar" : "Crear cuenta";
    submit.textContent = m === "login" ? "Entrar" : "Crear cuenta";
    pass.setAttribute("autocomplete", m === "login" ? "current-password" : "new-password");
    error.textContent = "";
  }

  function openAuth(m: "login" | "register" = "login", noticeText = ""): void {
    setMode(m);
    notice.textContent = noticeText;
    user.value = "";
    pass.value = "";
    backdrop.classList.add("open");
    document.body.classList.add("modal-open");
    window.setTimeout(() => user.focus(), 50);
  }

  function closeAuth(): void {
    backdrop.classList.remove("open");
    document.body.classList.remove("modal-open");
  }

  function refreshHeader(): void {
    const s = getSession();
    loginBtn.style.display = s ? "none" : "";
    userChip.hidden = !s;
    if (s) userName.textContent = s.username;
  }

  tabLogin.addEventListener("click", () => setMode("login"));
  tabRegister.addEventListener("click", () => setMode("register"));
  loginBtn.addEventListener("click", () => openAuth("login"));
  getEl("closeAuthBtn").addEventListener("click", closeAuth);
  getEl("cancelAuthBtn").addEventListener("click", closeAuth);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeAuth();
  });
  getEl("logoutBtn").addEventListener("click", () => {
    clearSession();
    refreshHeader();
    deps.onSessionChanged();
  });

  async function submitAuth(): Promise<void> {
    const username = user.value.trim();
    const password = pass.value;
    if (username.length < 3) {
      error.textContent = "El nombre debe tener al menos 3 caracteres.";
      return;
    }
    if (password.length < 6) {
      error.textContent = "La contraseña debe tener al menos 6 caracteres.";
      return;
    }
    error.textContent = "";
    submit.disabled = true;
    try {
      const session = mode === "login"
        ? await login(username, password)
        : await register(username, password);
      saveSession(session);
      refreshHeader();
      closeAuth();
      deps.onSessionChanged();
    } catch (e) {
      error.textContent = e instanceof Error ? e.message : "No se pudo completar.";
    } finally {
      submit.disabled = false;
    }
  }

  submit.addEventListener("click", () => void submitAuth());
  pass.addEventListener("keydown", (e) => {
    if (e.key === "Enter") void submitAuth();
  });
  user.addEventListener("keydown", (e) => {
    if (e.key === "Enter") void submitAuth();
  });

  refreshHeader();
  return { openAuth, refreshHeader };
}

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta #${id} en index.html`);
  return el;
}

function getInput(id: string): HTMLInputElement {
  return getEl(id) as HTMLInputElement;
}
