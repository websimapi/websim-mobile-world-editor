/* ...existing code... */
export function initUI({ onModeChange, onSizeChange, onStrengthChange }) {
  const btnNav = document.getElementById("mode-navigate");
  const btnRaise = document.getElementById("mode-raise");
  const btnLower = document.getElementById("mode-lower");
  const size = document.getElementById("brush-size");
  const strength = document.getElementById("brush-strength");

  const buttons = [btnNav, btnRaise, btnLower];

  function setActive(btn) {
    buttons.forEach(b => {
      const active = b === btn;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  btnNav.addEventListener("click", () => { setActive(btnNav); onModeChange("navigate"); });
  btnRaise.addEventListener("click", () => { setActive(btnRaise); onModeChange("raise"); });
  btnLower.addEventListener("click", () => { setActive(btnLower); onModeChange("lower"); });

  size.addEventListener("input", () => onSizeChange(parseInt(size.value, 10)));
  strength.addEventListener("input", () => onStrengthChange(parseInt(strength.value, 10) / 100));

  // Initialize callbacks with current values
  onModeChange("navigate");
  onSizeChange(parseInt(size.value, 10));
  onStrengthChange(parseInt(strength.value, 10) / 100);
}
/* ...existing code... */

