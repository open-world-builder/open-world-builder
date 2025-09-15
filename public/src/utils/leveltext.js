// leveltext.js

// --- public API ---
// await showLevelTitle('CHAPTER III — THE BLACKENED GROVE', { subtitle: 'Whispers in the Fog' });
// revealCanvasWhenReady(scene)  // call once when your scene is created

export async function showLevelTitle(
    title,
    {
        subtitle = '',
        fadeIn = 1400,
        hold = 1800,
        fadeOut = 1200,
        top = '16%',
        zIndex = 3000
    } = {}
) {
    ensureLevelTitleCSS();

    // Remove any existing overlay
    const old = document.getElementById('level-title-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'level-title-overlay';
    overlay.style.top = top;
    overlay.style.zIndex = String(zIndex);

    // Safer text
    const esc = s => String(s).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));

    overlay.innerHTML = `
      <div class="lt-title">${esc(title)}</div>
      ${subtitle ? `<div class="lt-sub">${esc(subtitle)}</div>` : ''}
      <div class="ornament"><i class="diamond"></i></div>
    `;

    document.body.appendChild(overlay);

    // Respect reduced motion
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
        overlay.style.opacity = '1';
        overlay.style.filter = 'none';
        await sleep(hold);
        overlay.remove();
        return;
    }

    // Fade in (with lift + deblur)
    const animIn = overlay.animate(
        [
            { opacity: 0, filter: 'blur(10px)', transform: 'translateX(-50%) translateY(10px)' },
            { opacity: 1, filter: 'blur(0px)', transform: 'translateX(-50%) translateY(0px)' }
        ],
        { duration: fadeIn, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
    );
    await animIn.finished;

    // Run a single “sheen” pass on the title after it’s visible
    // overlay.querySelector('.lt-title')?.classList.add('sheen-once');

    await sleep(hold);

    // Fade out (with slight rise)
    const animOut = overlay.animate(
        [
            { opacity: 1, filter: 'blur(0px) ', transform: 'translateX(-50%) translateY(0px)' },
            { opacity: 0, filter: 'blur(10px) ', transform: 'translateX(-50%) translateY(10px)' }
        ],
        { duration: fadeOut, easing: 'ease', fill: 'forwards' }
    );
    await animOut.finished;

    // overlay.remove();
}

export function revealCanvasWhenReady(sceneOrEngine) {
    const canvas = document.getElementById('renderCanvas');
    if (!canvas) return;

    const reveal = () => {
        canvas.classList.add('visible');   // your CSS already clears blur+opacity on .visible
        canvas.classList.remove('blurry'); // if you keep this class around
    };

    // 1) Babylon scene ready (preferred, Babylon 5–8)
    if (sceneOrEngine?.executeWhenReady) {
        sceneOrEngine.executeWhenReady(reveal);
    }

    // 2) First real frame rendered (belt & suspenders)
    if (sceneOrEngine?.onAfterRenderObservable) {
        const cb = () => { reveal(); sceneOrEngine.onAfterRenderObservable.remove(cb); };
        sceneOrEngine.onAfterRenderObservable.add(cb);
    }

    // 3) DOM loaded fallback
    window.addEventListener('load', () => requestAnimationFrame(reveal), { once: true });

    // 4) Last-resort timeout (in case nothing fires)
    setTimeout(reveal, 5000);
}

// --- helpers & CSS injector ---

const sleep = ms => new Promise(r => setTimeout(r, ms));

function ensureLevelTitleCSS() {
    if (document.getElementById('level-title-css')) return;
    const style = document.createElement('style');
    style.id = 'level-title-css';
    style.textContent = `
      #level-title-overlay {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        width: min(90vw, 1200px);
        pointer-events: none;
        text-align: center;
        opacity: 0;
        filter: blur(0px) translateY(120px);
      }
  
      /* Main title: gold gradient + heavy stroke for readability */
      #level-title-overlay .lt-title{
        /*font-family: "Cinzel", "Cormorant Garamond", Georgia, serif;*/
        font-family: "Veranda", "Cormorant Garamond", Georgia, sans-serif;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .14em;
        line-height: 1;
        font-size: clamp(34px, 4.0vw, 120px);
  
        /* gold gradient fill with clipped text */
        background-image: linear-gradient(180deg, #ffd074 0%, #ffc85c 28%, #ffc44f 52%, #ffbf42 78%, #ffd074 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
  
        /* dark RPG edge + glow */
       
        filter: drop-shadow(0 0 14px rgba(0,0,0,.99));
        position: relative;
      }
  
      /* One-time shimmer sweep */
      #level-title-overlay .lt-title.sheen-once::after{
        content:"";
        position:absolute; inset:-6px;
        background:
          linear-gradient(115deg, transparent 0%,
            rgba(255,255,255,.5) 10%, rgba(255,255,255,.15) 12%,
            transparent 20% 100%);
        mix-blend-mode: screen;
        animation: lt-sheen 1600ms ease-out 1 forwards;
        pointer-events:none;
      }
      @keyframes lt-sheen {
        0%   { transform: translateX(-120%); opacity: 0; }
        40%  { opacity: .7; }
        100% { transform: translateX(120%); opacity: 0; }
      }
  
      /* Optional subtitle: elegant, softer */
      #level-title-overlay .lt-sub{
        margin-top: .65rem;
        font-family: "Cormorant Garamond", Georgia, serif;
        font-style: italic;
        font-weight: 600;
        letter-spacing: .12em;
        font-size: clamp(14px, 2.6vw, 28px);
        color: rgba(236, 226, 200, .95);
        text-shadow: 0 0 18px rgba(0,0,0,.95);
        opacity:.9;
      }
  
      /* Ornate lines + center diamond */
      #level-title-overlay .ornament{
        position: relative;
        margin: .75rem auto 0;
        width: min(78vw, 680px);
        height: 14px;
        opacity: .95;
        filter: drop-shadow(0 0 8px rgba(0,0,0,.9));
      }
      #level-title-overlay .ornament::before,
      #level-title-overlay .ornament::after{
        content:"";
        position:absolute; top:50%; width:44%; height:2px;
        background: linear-gradient(to right,
          rgba(255,255,255,0) 0%,
          rgba(245,202,86,.85) 50%,
          rgba(255,255,255,0) 100%);
      }
      #level-title-overlay .ornament::before{ left:0; }
      #level-title-overlay .ornament::after{ right:0; transform: scaleX(-1); }
      #level-title-overlay .ornament .diamond{
        position:absolute; left:50%; top:50%; width:12px; height:12px;
        transform: translate(-50%,-50%) rotate(45deg);
        background: radial-gradient(circle at 30% 30%, #fff 0%, #d69c00 60%, #ff9200 100%);
        box-shadow: 0 0 10px rgba(245,202,86,.6);
      }
    `;
    document.head.appendChild(style);
}
