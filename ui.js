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
  const wheel = document.getElementById("color-wheel");
  const swatchDisplay = colorToggle.querySelector(".color-swatch");

  function setPaletteOpen(open) {
    picker.setAttribute("aria-hidden", String(!open));
    palette.setAttribute("aria-hidden", String(!open));
  }

  colorToggle.addEventListener("click", () => {
    const open = picker.getAttribute("aria-hidden") === "true";
    setPaletteOpen(open);
    if (open) drawWheel(); // render when opening
  });

  // color wheel rendering + picking
  function drawWheel() {
    if (!wheel) return;
    const size = Math.min(220, window.innerWidth * 0.6);
    wheel.width = wheel.height = size;
    const ctx = wheel.getContext("2d");
    const cx = size / 2, cy = size / 2, radius = size / 2;
    ctx.clearRect(0,0,size,size);
    const image = ctx.createImageData(size, size);
    for (let y=0;y<size;y++){
      for (let x=0;x<size;x++){
        const dx = x - cx, dy = y - cy;
        const d = Math.sqrt(dx*dx+dy*dy);
        const idx = (y*size + x)*4;
        if (d > radius) { image.data[idx+3]=0; continue; }
        let angle = Math.atan2(dy, dx);
        let hue = (angle / (2*Math.PI) + 0.5) * 360;
        let sat = Math.min(1, d / radius);
        // convert HSV->RGB
        const c = hsvToRgb(hue, sat, 1);
        image.data[idx]=c[0]; image.data[idx+1]=c[1]; image.data[idx+2]=c[2]; image.data[idx+3]=255;
      }
    }
    ctx.putImageData(image,0,0);
  }

  function hsvToRgb(h, s, v){
    let c = v*s, x = c*(1-Math.abs((h/60)%2-1)), m = v-c, r=0,g=0,b=0;
    if (h<60){r=c;g=x;b=0;} else if (h<120){r=x;g=c;b=0;} else if (h<180){r=0;g=c;b=x;}
    else if (h<240){r=0;g=x;b=c;} else if (h<300){r=x;g=0;b=c;} else {r=c;g=0;b=x;}
    return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];
  }

  function pickFromWheel(clientX, clientY){
    if (!wheel) return;
    const rect = wheel.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    const cx = rect.width/2, cy = rect.height/2;
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx*dx+dy*dy);
    const radius = rect.width/2;
    if (dist > radius) return;
    let hue = (Math.atan2(dy, dx) / (2*Math.PI) + 0.5) * 360;
    let sat = Math.min(1, dist / radius);
    // convert to hex
    const rgb = hsvToRgb(hue, sat, 1);
    const hex = '#' + rgb.map(v => v.toString(16).padStart(2,'0')).join('');
    swatchDisplay.style.background = hex;
    if (typeof onColorChange === "function") onColorChange(hex);
  }

  let dragging = false;
  if (wheel) {
    wheel.addEventListener('pointerdown', (e) => { e.preventDefault(); dragging = true; pickFromWheel(e.clientX, e.clientY); });
    window.addEventListener('pointermove', (e) => { if (dragging) pickFromWheel(e.clientX, e.clientY); });
    window.addEventListener('pointerup', () => { if (dragging) { dragging = false; setPaletteOpen(false); }});
  }

  // initialize default swatch
  swatchDisplay.style.background = '#ff5a5a';

  slidersWrapper.hidden = true;
  onModeChange("navigate");
  onSizeChange(parseInt(size.value, 10));
  onStrengthChange(parseInt(strength.value, 10) / 100);
}
/* ...existing code... */