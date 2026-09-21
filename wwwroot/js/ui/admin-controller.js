// Compilado desde ts/ui/admin-controller.ts
import { createProduct, deleteProduct, updateProduct } from "../data/product-repository.js";
import { categoryOf, normalizeImageUrl, validateNewProduct, withImageFallback } from "../services/product-service.js";
import { formatPrice } from "../domain/models.js";
const PLACEHOLDER_PREVIEW = "https://placehold.co/600x400/111111/E10600?text=Vista+previa";
export function setupAdmin(deps) {
  const backdrop = getEl("modalBackdrop");
  const adminPanel = getEl("adminPanel");
  const adminList = getEl("adminList");
  const adminBar = document.getElementById("adminBar");
  const modalEyebrow = document.getElementById("modalEyebrow");
  const modalTitle = getEl("modalTitle");
  const saveBtn = getEl("saveProductBtn");
  const fName = getInput("fName");
  const fPrice = getInput("fPrice");
  const fStock = getInput("fStock");
  const fCategory = getEl("fCategory");
  const fImageUrl = getInput("fImageUrl");
  const fImageFile = getEl("fImageFile");
  const fPreview = getEl("fPreview");
  const fDesc = getEl("fDesc");
  const formError = getEl("formError");
  const imgStatus = document.getElementById("imgStatus");
  let unlocked = false;
  let fileDataUrl = "";
  let editingId = null;
  function setUnlocked(v) {
    unlocked = v;
    adminPanel.style.display = v ? "block" : "none";
    if (adminBar) adminBar.hidden = !v;
    if (!v) closeModal();
  }
  function isUnlocked() { return unlocked; }
  function lock() { setUnlocked(false); deps.onLock?.(); }
  function resetForm() {
    fName.value = ""; fPrice.value = ""; fStock.value = "1";
    fCategory.value = "Consolas";
    fImageUrl.value = ""; fImageFile.value = ""; fileDataUrl = "";
    fDesc.value = ""; formError.textContent = "";
    setImgStatus("");
    syncPreview();
  }
  function openCreate() {
    if (!unlocked) return;
    editingId = null;
    resetForm();
    if (modalEyebrow) modalEyebrow.textContent = "Admin · Alta";
    modalTitle.textContent = "Nuevo producto";
    saveBtn.textContent = "Guardar producto";
    openModal();
  }
  function openEdit(p) {
    if (!unlocked) return;
    editingId = p.id;
    formError.textContent = "";
    fName.value = p.name;
    fPrice.value = String(p.price);
    fStock.value = String(p.stock);
    fCategory.value = String(p.category);
    if (p.imageUrl.startsWith("data:image/")) {
      fileDataUrl = p.imageUrl; fImageUrl.value = ""; fImageFile.value = "";
    } else {
      fileDataUrl = ""; fImageUrl.value = p.imageUrl; fImageFile.value = "";
    }
    fDesc.value = p.description ?? "";
    setImgStatus("");
    if (modalEyebrow) modalEyebrow.textContent = "Admin · Edición";
    modalTitle.textContent = "Editar producto";
    saveBtn.textContent = "Guardar cambios";
    openModal();
  }
  function openModal() {
    if (!unlocked) return;
    backdrop.classList.add("open");
    document.body.classList.add("modal-open");
    window.setTimeout(() => fName.focus(), 50);
  }
  function closeModal() { backdrop.classList.remove("open"); document.body.classList.remove("modal-open"); editingId = null; }
  function setImgStatus(msg) { if (imgStatus) imgStatus.textContent = msg; }
  function currentRawUrl() {
    const typed = fImageUrl.value.trim();
    return typed !== "" ? typed : fileDataUrl;
  }
  function syncPreview() {
    const raw = currentRawUrl();
    const url = normalizeImageUrl(raw);
    if (url === "") { fPreview.dataset.failed = ""; fPreview.src = PLACEHOLDER_PREVIEW; return; }
    fPreview.dataset.failed = "";
    if (fPreview.src !== url) fPreview.src = url;
  }
  fImageUrl.addEventListener("input", () => {
    if (fImageUrl.value.trim() !== "") { fileDataUrl = ""; fImageFile.value = ""; }
    setImgStatus("");
    syncPreview();
  });
  fImageFile.addEventListener("change", () => {
    const file = fImageFile.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setImgStatus("Ese archivo no es una imagen. Elige un JPG, PNG o WEBP."); return; }
    const reader = new FileReader();
    reader.onload = () => { fileDataUrl = String(reader.result ?? ""); fImageUrl.value = ""; setImgStatus(""); syncPreview(); };
    reader.onerror = () => setImgStatus("No se pudo leer ese archivo. Intenta con otro.");
    reader.readAsDataURL(file);
  });
  fPreview.addEventListener("error", () => {
    if (fPreview.dataset.failed === "1") return;
    fPreview.dataset.failed = "1";
    fPreview.src = PLACEHOLDER_PREVIEW;
    setImgStatus("Esa URL no cargó la imagen. Revisa que sea el link directo (termina en .jpg/.png/.webp) y que permita verla sin entrar a la página.");
  });
  fPreview.addEventListener("load", () => {
    if (fPreview.src.includes("placehold.co")) return;
    setImgStatus("");
  });
  syncPreview();
  getEl("closeModalBtn").addEventListener("click", closeModal);
  getEl("cancelModalBtn").addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (backdrop.classList.contains("open")) closeModal();
      else if (unlocked) lock();
    }
  });
  document.getElementById("newProductBtn")?.addEventListener("click", openCreate);
  document.getElementById("newProductBtn2")?.addEventListener("click", openCreate);
  document.getElementById("exitAdminBtn")?.addEventListener("click", lock);
  document.getElementById("lockAdminBtn")?.addEventListener("click", lock);
  getEl("saveProductBtn").addEventListener("click", async () => {
    const dto = withImageFallback({
      name: fName.value.trim(), price: Number(fPrice.value),
      category: categoryOf(fCategory.value),
      imageUrl: normalizeImageUrl(currentRawUrl()),
      description: fDesc.value.trim(), stock: Math.max(0, Number(fStock.value || 0)),
    });
    const err = validateNewProduct(dto);
    if (err) { formError.textContent = err; return; }
    formError.textContent = "";
    saveBtn.disabled = true;
    try {
      if (editingId) { await updateProduct(editingId, dto); }
      else { await createProduct(dto); }
      resetForm();
      closeModal();
      await deps.onChanged();
    } catch (e) {
      formError.textContent = e instanceof Error && e.message === "NO_AUTH"
        ? "Necesitas entrar con tu cuenta para guardar. Usa el botón Entrar de arriba."
        : "No se pudo guardar. Revisa los datos e intenta de nuevo.";
    }
    finally { saveBtn.disabled = false; }
  });
  function renderAdminList(items) {
    adminList.innerHTML = "";
    for (const p of items) {
      const row = document.createElement("div");
      row.className = "admin-row";
      row.innerHTML = `<img alt="" loading="lazy" /><div class="meta"><strong></strong><div class="muted"></div></div><div class="admin-actions"></div>`;
      const img = row.querySelector("img");
      img.src = p.imageUrl; img.alt = p.name;
      img.referrerPolicy = "no-referrer";
      img.onerror = () => { img.onerror = null; img.src = `https://placehold.co/600x400/111111/E10600?text=${encodeURIComponent(p.name)}`; };
      row.querySelector("strong").textContent = `${p.name} — ${formatPrice(p.price)}`;
      row.querySelector(".muted").textContent = `${String(p.category)} • Stock ${p.stock}`;
      const actions = row.querySelector(".admin-actions");
      const edit = document.createElement("button");
      edit.className = "btn btn-secondary btn-sm"; edit.textContent = "Editar";
      edit.addEventListener("click", () => openEdit(p));
      const del = document.createElement("button");
      del.className = "btn btn-danger btn-sm"; del.textContent = "Eliminar";
      del.addEventListener("click", async () => {
        if (!window.confirm(`¿Eliminar "${p.name}" del catálogo?`)) return;
        try {
          await deleteProduct(p.id); await deps.onChanged();
        } catch (e) {
          if (e instanceof Error && e.message === "NO_AUTH") {
            window.alert("Entra con tu cuenta (botón Entrar arriba) para eliminar productos.");
          }
        }
      });
      actions.append(edit, del);
      adminList.appendChild(row);
    }
  }
  return { openModal: openCreate, renderAdminList, setUnlocked, isUnlocked };
}
function getEl(id) { const el = document.getElementById(id); if (!el) throw new Error(`Falta #${id}`); return el; }
function getInput(id) { return getEl(id); }
