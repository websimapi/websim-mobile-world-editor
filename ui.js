/* ...existing code... */
export function initUI({ onModeChange, onSizeChange, onStrengthChange, onToggleGrid, onColorChange }) {
  const btnNav = document.getElementById("mode-navigate");
  const btnRaise = document.getElementById("mode-raise");
  const btnLower = document.getElementById("mode-lower");
  const btnPaint = document.getElementById("mode-paint");
  const btnGrid = document.getElementById("toggle-grid");
  const size = document.getElementById("brush-size");
  const strength = document.getElementById("brush-strength");
  const slidersWrapper = document.getElementById("sliders");

  const buttons = [btnNav, btnRaise, btnLower, btnPaint];

  const toggle = document.getElementById("toggle-ui");
  const toolbar = document.querySelector(".toolbar");
  toggle.addEventListener("click", () => {
    const nowHidden = !toolbar.hidden ? true : false;
    toolbar.hidden = nowHidden;
    toggle.setAttribute("aria-expanded", String(!nowHidden));
  });

  function setActive(btn) {
    buttons.forEach(b => {
      const active = b === btn;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  btnNav.addEventListener("click", () => { setActive(btnNav); slidersWrapper.hidden = true; onModeChange("navigate"); });
  btnRaise.addEventListener("click", () => { setActive(btnRaise); slidersWrapper.hidden = false; onModeChange("raise"); });
  btnLower.addEventListener("click", () => { setActive(btnLower); slidersWrapper.hidden = false; onModeChange("lower"); });
  btnPaint.addEventListener("click", () => { setActive(btnPaint); slidersWrapper.hidden = false; onModeChange("paint"); });

  if (btnGrid) {
    btnGrid.addEventListener("click", () => {
      const now = btnGrid.getAttribute("aria-pressed") === "true";
      btnGrid.setAttribute("aria-pressed", String(!now));
      if (typeof onToggleGrid === "function") onToggleGrid(!now);
    });
  }

  size.addEventListener("input", () => onSizeChange(parseInt(size.value, 10)));
  strength.addEventListener("input", () => onStrengthChange(parseInt(strength.value, 10) / 100));

  // color picker wiring
  const picker = document.getElementById("color-picker");
  const colorToggle = document.getElementById("color-toggle");
  const palette = document.getElementById("palette");
  const swatches = Array.from(palette.querySelectorAll(".swatch"));
  const swatchDisplay = colorToggle.querySelector(".color-swatch");

  function setPaletteOpen(open) {
    picker.setAttribute("aria-hidden", String(!open));
    picker.setAttribute("aria-hidden", open ? "false" : "true");
  }

  colorToggle.addEventListener("click", () => {
    const open = picker.getAttribute("aria-hidden") === "true";
    setPaletteOpen(open);
  });

  swatches.forEach(s => {
    s.addEventListener("click", () => {
      swatches.forEach(x => x.classList.remove("selected"));
      s.classList.add("selected");
      const color = s.dataset.color;
      swatchDisplay.style.background = color;
      setPaletteOpen(false);
      if (typeof onColorChange === "function") onColorChange(color);
    });
  });

  // default selection
  const first = swatches[0];
  if (first) { first.classList.add("selected"); swatchDisplay.style.background = first.dataset.color; }

  slidersWrapper.hidden = true;
  onModeChange("navigate");
  onSizeChange(parseInt(size.value, 10));
  onStrengthChange(parseInt(strength.value, 10) / 100);
}
/* ...existing code... */