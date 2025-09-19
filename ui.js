/* ...existing code... */
export function initUI({ onModeChange, onSizeChange, onStrengthChange, onToggleGrid }) {
  const btnNav = document.getElementById("mode-navigate");
  const btnRaise = document.getElementById("mode-raise");
  const btnLower = document.getElementById("mode-lower");
  const btnGrid = document.getElementById("toggle-grid");
  const size = document.getElementById("brush-size");
  const strength = document.getElementById("brush-strength");
  const slidersWrapper = document.getElementById("sliders");

  const buttons = [btnNav, btnRaise, btnLower];

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

  if (btnGrid) {
    btnGrid.addEventListener("click", () => {
      const now = btnGrid.getAttribute("aria-pressed") === "true";
      btnGrid.setAttribute("aria-pressed", String(!now));
      if (typeof onToggleGrid === "function") onToggleGrid(!now);
    });
  }

  size.addEventListener("input", () => onSizeChange(parseInt(size.value, 10)));
  strength.addEventListener("input", () => onStrengthChange(parseInt(strength.value, 10) / 100));

  slidersWrapper.hidden = true;
  onModeChange("navigate");
  onSizeChange(parseInt(size.value, 10));
  onStrengthChange(parseInt(strength.value, 10) / 100);
}
/* ...existing code... */