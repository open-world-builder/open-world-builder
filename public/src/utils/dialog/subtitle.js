// subtitle.js
// A concise global subtitle component with blurred backdrop, optional overlay image, and smooth fade.
class Subtitle {
  constructor() {
    this.el = document.createElement("div");
    Object.assign(this.el.style, {
      position: "absolute",
      top: "50px",
      left: "50%",
      transform: "translateX(-50%)",
      maxWidth: "90%",
      width: "90%",
      height: "100px",
      padding: "8px 12px",
      // backgroundColor: 'rgba(0, 0, 0, 0.4)',
      color: "#fff",
      fontSize: "16px",
      textAlign: "center",
      borderRadius: "4px",
      zIndex: "9998",
      display: "none",
      opacity: "0",
      paddingTop: "40px",
      // backdropFilter: 'blur(8px)',
      // WebkitBackdropFilter: 'blur(8px)',
      backgroundSize: "90vw 100px",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      transition: "opacity 0.5s ease, backdrop-filter 0.5s ease",
      backgroundImage: "url('/assets/util/ui/backgrounds/subtitle background.png')",
      pointerEvents: "none",
      textShadow: "rgba(0, 0, 0, 0.97) 1px 0px 5px",
    });
    document.body.appendChild(this.el);
  }

  show(text, duration = 3000, imageUrl = null) {
    clearTimeout(this._timer);

    // If already visible, fade out first
    if (+this.el.style.opacity === 1) {
      this.el.style.opacity = "0";
      setTimeout(() => this._swapIn(text, imageUrl, duration), 500);
    } else {
      this._swapIn(text, imageUrl, duration);
    }
  }

  _swapIn(text, imageUrl, duration) {
    // swap content/background
    this.el.textContent = text;
    if (imageUrl) this.el.style.backgroundImage = `url('${imageUrl}')`;

    // show & fade in
    this.el.style.display = "block";
    void this.el.offsetWidth;
    this.el.style.opacity = "1";

    // schedule auto‑hide
    this._timer = setTimeout(() => this.hide(), duration);
  }

  hide() {
    // Fade out
    this.el.style.opacity = "0";
    // After transition, hide element
    setTimeout(() => {
      this.el.style.display = "none";
    }, 500);
  }
}

// Singleton instance
const subtitle = new Subtitle();

// Exported functions
/**
 * Show a subtitle at top center.
 * @param {string} text - The text to display.
 * @param {number} duration - Duration in ms (default 3000).
 * @param {string|null} imageUrl - Optional background image URL.
 */
export function showSubtitle(text, duration, imageUrl) {
  subtitle.show(text, duration, imageUrl);
}

/** Hide the subtitle immediately (with fade-out). */
export function hideSubtitle() {
  subtitle.hide();
}
