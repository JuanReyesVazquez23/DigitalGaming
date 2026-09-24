// Layer: ts/ui/countdown — cuenta regresiva al lanzamiento (banner GTA VI).
export function setupCountdown(targetIso: string): void {
  const box = document.getElementById("gtaCountdown");
  const live = document.getElementById("gtaLive");
  const d = document.getElementById("cdDays");
  const h = document.getElementById("cdHours");
  const m = document.getElementById("cdMins");
  const s = document.getElementById("cdSecs");
  if (!box || !d || !h || !m || !s) return;
  const target = new Date(targetIso).getTime();
  if (!Number.isFinite(target)) return;

  const pad = (n: number): string => String(n).padStart(2, "0");

  function tick(): void {
    const diff = target - Date.now();
    if (diff <= 0) {
      box.style.display = "none";
      if (live) live.hidden = false;
      window.clearInterval(timer);
      return;
    }
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    const secs = Math.floor((diff % 60_000) / 1000);
    d.textContent = String(days);
    h.textContent = pad(hours);
    m.textContent = pad(mins);
    s.textContent = pad(secs);
  }

  const timer = window.setInterval(tick, 1000);
  tick();
}
