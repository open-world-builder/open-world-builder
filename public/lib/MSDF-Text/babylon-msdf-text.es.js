var Q = Object.defineProperty;
var Z = (e, t, n) => (t in e ? Q(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : (e[t] = n));
var T = (e, t, n) => (Z(e, typeof t != "symbol" ? t + "" : t, n), n);
import * as _ from "https://cdn.jsdelivr.net/npm/babylonjs@8.0.2/babylon.min.js";
const J = /\n/,
  O = `
`,
  j = /\s/;
function tt(e = "", t = {}) {
  const n = typeof t.width == "number" ? t.width : Number.MAX_VALUE,
    r = Math.max(0, t.start || 0),
    c = typeof t.end == "number" ? t.end : e.length,
    s = t.mode,
    f = t.measure || it;
  return t.width === 0 && t.mode !== "nowrap" ? [] : s === "pre" ? nt(f, e, r, c, n) : rt(f, e, r, c, n, s);
}
function et(e, t, n, r) {
  const c = e.indexOf(t, n);
  return c === -1 || c > r ? r : c;
}
function P(e) {
  return j.test(e);
}
function nt(e, t, n, r, c) {
  const s = [];
  let f = n;
  for (let o = n; o < r && o < t.length; o++) {
    const u = t.charAt(o),
      h = J.test(u);
    if (h || o === r - 1) {
      const i = h ? o : o + 1,
        d = e(t, f, i, c);
      s.push(d), (f = o + 1);
    }
  }
  return s;
}
function rt(e, t, n, r, c, s) {
  const f = [];
  let o = c;
  for (s === "nowrap" && (o = Number.MAX_VALUE); n < r && n < t.length; ) {
    const u = et(t, O, n, r);
    for (; n < u && P(t.charAt(n)); ) n++;
    const h = e(t, n, u, o);
    let i = n + (h.end - h.start),
      d = i + O.length;
    if (i < u) {
      for (; i > n && !P(t.charAt(i)); ) i--;
      if (i === n) d > n + O.length && d--, (i = d);
      else for (d = i; i > n && P(t.charAt(i - O.length)); ) i--;
    }
    if (i >= n) {
      const w = e(t, n, i, o);
      f.push(w);
    }
    n = d;
  }
  return f;
}
function it(e, t, n, r) {
  const c = Math.min(r, n - t);
  return {
    start: t,
    end: t + c,
    width: r,
  };
}
const ot = ["x", "e", "a", "o", "n", "s", "r", "c", "u", "m", "v", "w", "z"],
  st = ["m", "w"],
  lt = ["H", "I", "N", "E", "F", "K", "L", "T", "U", "V", "W", "X", "Y", "Z"],
  z = "	".charCodeAt(0),
  E = " ".charCodeAt(0),
  at = 0,
  Y = 1,
  $ = 2;
class ct {
  constructor(t) {
    T(this, "glyphs", []);
    T(this, "_width", 0);
    T(this, "_height", 0);
    T(this, "_descender", 0);
    T(this, "_ascender", 0);
    T(this, "_xHeight", 0);
    T(this, "_baseline", 0);
    T(this, "_capHeight", 0);
    T(this, "_lineHeight", 0);
    T(this, "_linesTotal", 0);
    T(this, "_lettersTotal", 0);
    T(this, "_wordsTotal", 0);
    T(this, "_options");
    T(this, "_fallbackSpaceGlyph", null);
    T(this, "_fallbackTabGlyph", null);
    this.update(t);
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  get descender() {
    return this._descender;
  }
  get ascender() {
    return this._ascender;
  }
  get xHeight() {
    return this._xHeight;
  }
  get baseline() {
    return this._baseline;
  }
  get capHeight() {
    return this._capHeight;
  }
  get lineHeight() {
    return this._lineHeight;
  }
  get linesTotal() {
    return this._linesTotal;
  }
  get lettersTotal() {
    return this._lettersTotal;
  }
  get wordsTotal() {
    return this._wordsTotal;
  }
  get glyphsArray() {
    return this.glyphs;
  }
  /**
   * Updates the text layout with new options
   * @param options - Text layout configuration
   */
  update(t) {
    if (((t = Object.assign({ measure: this.computeMetrics.bind(this) }, t)), (this._options = t), (this._options.tabSize = vt(t.tabSize, 4)), !t.font)) throw new Error("Must provide a valid bitmap font");
    const n = this.glyphs,
      r = t.text || "",
      c = t.font;
    this._setupSpaceGlyphs(c);
    const s = tt(r, t),
      f = t.width || 0,
      o = r.split(" ").filter(
        (l) =>
          l !==
          `
`
      ).length,
      u = r.split("").filter(
        (l) =>
          l !==
            `
` && l !== " "
      ).length;
    n.length = 0;
    const h = s.reduce((l, A) => Math.max(l, A.width, f), 0);
    let i = 0,
      d = 0;
    const w = t.lineHeight ?? 1,
      a = c.common.lineHeight * Math.max(w, 1),
      p = c.common.base,
      m = a - p,
      g = t.letterSpacing || 0,
      v = a * s.length - m,
      I = gt(t.align);
    (d -= v), (this._width = h), (this._height = v), (this._descender = a - p), (this._baseline = p), (this._xHeight = ut(c)), (this._capHeight = ft(c)), (this._lineHeight = a), (this._ascender = a - m - this._xHeight);
    let x = 0,
      b = 0;
    s.forEach((l, A) => {
      const L = l.start,
        y = l.end,
        W = l.width,
        D = r
          .slice(L, y)
          .split(" ")
          .filter((k) => k !== "").length,
        M = r.slice(L, y).split(" ").join("").length;
      let H = 0,
        G = 0,
        S;
      for (let k = L; k < y; k++) {
        const K = r.charCodeAt(k),
          C = this.getGlyph(c, K);
        if (C) {
          S && (i += R(c, S.id, C.id));
          let N = i;
          I === Y ? (N += (h - W) / 2) : I === $ && (N += h - W),
            n.push({
              position: [N, d],
              data: C,
              index: k,
              linesTotal: s.length,
              lineIndex: A,
              lineLettersTotal: M,
              lineLetterIndex: H,
              lineWordsTotal: D,
              lineWordIndex: G,
              wordsTotal: o,
              wordIndex: x,
              lettersTotal: u,
              letterIndex: b,
            }),
            C.id === E && (S == null ? void 0 : S.id) !== E && (G++, x++),
            C.id !== E && (H++, b++),
            (i += C.xadvance + g),
            (S = C);
        }
      }
      (d += a), (i = 0);
    }),
      (this._lettersTotal = u),
      (this._wordsTotal = o),
      (this._linesTotal = s.length);
  }
  /**
   * Gets a glyph by its character ID
   * @param font - Font data
   * @param id - Character ID
   * @returns Glyph data or null
   */
  getGlyph(t, n) {
    const r = X(t, n);
    return r || (n === z ? this._fallbackTabGlyph : n === E ? this._fallbackSpaceGlyph : null);
  }
  /**
   * Computes metrics for text layout
   */
  computeMetrics(t, n, r, c) {
    const s = this._options.letterSpacing || 0,
      f = this._options.font;
    let o = 0,
      u = 0,
      h = 0,
      i;
    if (!f.chars || f.chars.length === 0) return { start: n, end: n, width: 0 };
    r = Math.min(t.length, r);
    for (let d = n; d < r; d++) {
      const w = t.charCodeAt(d),
        a = this.getGlyph(f, w);
      if (a) {
        a.char = t[d];
        const p = i ? R(f, i.id, a.id) : 0;
        o += p;
        const m = o + a.xadvance + s,
          g = o + a.width;
        if (g >= c || m >= c) break;
        (o = m), (u = g), (i = a);
      }
      h++;
    }
    return i && (u += i.xoffset), { start: n, end: n + h, width: u };
  }
  /**
   * Sets up fallback glyphs for space and tab
   */
  _setupSpaceGlyphs(t) {
    if (((this._fallbackSpaceGlyph = null), (this._fallbackTabGlyph = null), !t.chars || t.chars.length === 0)) return;
    const n = X(t, E) || dt(t) || t.chars[0],
      r = this._options.tabSize || 0 * n.xadvance;
    (this._fallbackSpaceGlyph = n),
      (this._fallbackTabGlyph = {
        ...n,
        x: 0,
        y: 0,
        xadvance: r,
        id: z,
        xoffset: 0,
        yoffset: 0,
        width: 0,
        height: 0,
      });
  }
}
function ht(e) {
  return new ct(e);
}
function X(e, t) {
  if (!e.chars || e.chars.length === 0) return null;
  const n = V(e.chars, t);
  return n >= 0 ? e.chars[n] : null;
}
function ut(e) {
  for (const t of ot) {
    const n = t.charCodeAt(0),
      r = V(e.chars, n);
    if (r >= 0) return e.chars[r].height;
  }
  return 0;
}
function dt(e) {
  for (const t of st) {
    const n = t.charCodeAt(0),
      r = V(e.chars, n);
    if (r >= 0) return e.chars[r];
  }
  return null;
}
function ft(e) {
  for (const t of lt) {
    const n = t.charCodeAt(0),
      r = V(e.chars, n);
    if (r >= 0) return e.chars[r].height;
  }
  return 0;
}
function R(e, t, n) {
  if (!e.kernings || e.kernings.length === 0) return 0;
  for (const r of e.kernings) if (r.first === t && r.second === n) return r.amount;
  return 0;
}
function gt(e) {
  return e === "center" ? Y : e === "right" ? $ : at;
}
function V(e, t, n = 0) {
  for (let r = n; r < e.length; r++) if (e[r].id === t) return r;
  return -1;
}
function vt(e, t) {
  return typeof e == "number" ? e : typeof t == "number" ? t : 0;
}
var B;
((e) => {
  function t(r, c, s, f, o) {
    const u = new Float32Array(r.length * 4 * 2),
      h = new Float32Array(r.length * 4 * 2),
      i = new Float32Array(r.length * 4 * 3),
      d = new Float32Array(r.length * 4 * 2);
    let w = 0,
      a = 0,
      p = 0,
      m = 0;
    return (
      r.forEach((g) => {
        const v = g.data,
          I = v.x + v.width,
          x = v.y + v.height,
          b = v.x / c;
        let l = v.y / s;
        const A = I / c;
        let L = x / s;
        f && ((l = (s - v.y) / s), (L = (s - x) / s)), (u[w++] = b), (u[w++] = l), (u[w++] = b), (u[w++] = L), (u[w++] = A), (u[w++] = L), (u[w++] = A), (u[w++] = l), (h[m++] = g.position[0] / o.width), (h[m++] = (g.position[1] + o.height) / o.height), (h[m++] = g.position[0] / o.width), (h[m++] = (g.position[1] + o.height + v.height) / o.height), (h[m++] = (g.position[0] + v.width) / o.width), (h[m++] = (g.position[1] + o.height + v.height) / o.height), (h[m++] = (g.position[0] + v.width) / o.width), (h[m++] = (g.position[1] + o.height) / o.height);
        const y = g.position[0] + v.xoffset,
          W = g.position[1] + v.yoffset,
          F = 0,
          D = v.width,
          M = v.height;
        (i[a++] = y), (i[a++] = -W), (i[a++] = F), (i[a++] = y), (i[a++] = -(W + M)), (i[a++] = F), (i[a++] = y + D), (i[a++] = -(W + M)), (i[a++] = F), (i[a++] = y + D), (i[a++] = -W), (i[a++] = F);
        const H = y + D / 2,
          G = W + M / 2;
        for (let S = 0; S < 4; S++) (d[p++] = H), (d[p++] = G);
      }),
      { uvs: u, layoutUvs: h, positions: i, centers: d }
    );
  }
  e.create = t;
  function n(r, c, s) {
    const f = [
      [s.centers, "center", 2],
      [s.layoutUvs, "layoutUv", 2],
    ];
    for (const [o, u, h] of f) {
      const i = new _.VertexBuffer(r, o, u, !0, !1, h);
      c.setVerticesBuffer(i);
    }
  }
  e.setCustomAttributes = n;
})(B || (B = {}));
var U;
((e) => {
  function t(r) {
    const c = new Float32Array(r.length * 4),
      s = new Float32Array(r.length * 4),
      f = new Float32Array(r.length * 4),
      o = new Float32Array(r.length * 4),
      u = new Float32Array(r.length * 4),
      h = new Float32Array(r.length * 4),
      i = new Float32Array(r.length * 4);
    let d = 0,
      w = 0,
      a = 0,
      p = 0,
      m = 0,
      g = 0,
      v = 0,
      I = 0,
      x = 0,
      b = 0;
    for (const l of r) {
      for (let A = 0; A < 4; A++) (c[d++] = l.lineIndex), (s[w++] = l.lineLettersTotal), (f[a++] = l.lineLetterIndex), (o[p++] = l.lineWordsTotal), (u[m++] = l.lineWordIndex), (h[g++] = l.wordIndex), (i[v++] = l.letterIndex);
      (I = l.wordsTotal), (x = l.linesTotal), (b = l.lettersTotal);
    }
    return {
      linesTotal: x,
      lineIndex: c,
      lineLettersTotal: s,
      lineLetterIndex: f,
      lineWordsTotal: o,
      lineWordIndex: u,
      wordsTotal: I,
      wordIndex: h,
      lettersTotal: b,
      letterIndex: i,
    };
  }
  e.create = t;
  function n(r, c, s) {
    const f = [
      [s.lineIndex, "lineIndex", 1],
      [s.lineLettersTotal, "lineLettersTotal", 1],
      [s.lineLetterIndex, "lineLetterIndex", 1],
      [s.lineWordsTotal, "lineWordsTotal", 1],
      [s.lineWordIndex, "lineWordIndex", 1],
      [s.wordIndex, "wordIndex", 1],
      [s.letterIndex, "letterIndex", 1],
    ];
    for (const [o, u, h] of f) {
      const i = new _.VertexBuffer(r, o, u, !0, !1, h);
      c.setVerticesBuffer(i);
    }
  }
  e.setCustomAttributes = n;
})(U || (U = {}));
function wt(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var pt = function (e) {
    switch (e) {
      case "int8":
        return Int8Array;
      case "int16":
        return Int16Array;
      case "int32":
        return Int32Array;
      case "uint8":
        return Uint8Array;
      case "uint16":
        return Uint16Array;
      case "uint32":
        return Uint32Array;
      case "float32":
        return Float32Array;
      case "float64":
        return Float64Array;
      case "array":
        return Array;
      case "uint8_clamped":
        return Uint8ClampedArray;
    }
  },
  mt = Object.prototype.toString,
  Tt = xt;
function xt(e) {
  return (e.BYTES_PER_ELEMENT && mt.call(e.buffer) === "[object ArrayBuffer]") || Array.isArray(e);
}
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
var It = function (e) {
  return e != null && (q(e) || yt(e) || !!e._isBuffer);
};
function q(e) {
  return !!e.constructor && typeof e.constructor.isBuffer == "function" && e.constructor.isBuffer(e);
}
function yt(e) {
  return typeof e.readFloatLE == "function" && typeof e.slice == "function" && q(e.slice(0, 0));
}
var _t = pt,
  bt = Tt,
  At = It,
  Lt = [0, 2, 3],
  St = [2, 1, 3],
  Wt = function (t, n) {
    (!t || !(bt(t) || At(t))) && ((n = t || {}), (t = null)), typeof n == "number" ? (n = { count: n }) : (n = n || {});
    for (var r = typeof n.type == "string" ? n.type : "uint16", c = typeof n.count == "number" ? n.count : 1, s = n.start || 0, f = n.clockwise !== !1 ? Lt : St, o = f[0], u = f[1], h = f[2], i = c * 6, d = t || new (_t(r))(i), w = 0, a = 0; w < i; w += 6, a += 4) {
      var p = w + s;
      (d[p + 0] = a + 0), (d[p + 1] = a + 1), (d[p + 2] = a + 2), (d[p + 3] = a + o), (d[p + 4] = a + u), (d[p + 5] = a + h);
    }
    return d;
  };
const Ct = /* @__PURE__ */ wt(Wt);
function Mt(e, t, n) {
  const { color: r = new _.Color3(0, 0, 0), strokeColor: c = new _.Color3(0, 0, 0), opacity: s = 1, strokeWidth: f = 0.5, atlas: o, ...u } = t,
    h = n.getEngine(),
    i = ht(u),
    d = t.font,
    w = d.common.scaleW,
    a = d.common.scaleH,
    p = i.glyphs.filter((L) => {
      const y = L.data;
      return y.width * y.height > 0;
    }),
    m = B.create(p, w, a, !0, i),
    g = U.create(p),
    v = Ct([], {
      clockwise: !0,
      type: "uint16",
      count: p.length,
    }),
    I = new _.Mesh(e, n),
    x = new _.VertexData();
  (x.positions = m.positions), (x.indices = v), (x.uvs = m.uvs);
  const b = [];
  _.VertexData.ComputeNormals(m.positions, v, b), (x.normals = b), B.setCustomAttributes(h, I, m), U.setCustomAttributes(h, I, g), x.applyToMesh(I), (_.Effect.ShadersStore.MSDFVertexShader = kt), (_.Effect.ShadersStore.MSDFFragmentShader = Ft);
  const l = new _.ShaderMaterial(
      "msdfShader",
      n,
      {
        vertex: "MSDF",
        fragment: "MSDF",
      },
      {
        attributes: ["position", "normal", "uv", "center", "layoutUv", "lineIndex", "lineLettersTotal", "lineLetterIndex", "lineWordsTotal", "lineWordIndex", "wordIndex", "letterIndex"],
        uniforms: ["world", "worldView", "worldViewProjection", "view", "viewProjection", "projection", "uColor", "uThreshold", "uStrokeOutsetWidth", "uStrokeInsetWidth", "uOpacity", "uAlphaTest", "uStrokeColor", "uLinesTotal", "uWordsTotal", "uLettersTotal"],
        needAlphaBlending: !0,
      }
    ),
    A = o instanceof _.Texture ? o : new _.Texture(o, n);
  return l.setTexture("uFontAtlas", A), l.setColor3("uColor", r), l.setColor3("uStrokeColor", c), l.setFloat("uThreshold", 0.05), l.setFloat("uStrokeOutsetWidth", 0), l.setFloat("uStrokeInsetWidth", f), l.setFloat("uOpacity", s), l.setFloat("uAlphaTest", 0.01), l.setInt("uLinesTotal", g.linesTotal), l.setInt("uWordsTotal", g.wordsTotal), l.setInt("uLettersTotal", g.lettersTotal), (l.backFaceCulling = !1), (I.material = l), I;
}
const kt = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;
attribute vec2 center;
attribute float lineIndex;
attribute float lineLettersTotal;
attribute float lineLetterIndex;
attribute float lineWordsTotal;
attribute float lineWordIndex;
attribute float wordIndex;
attribute float letterIndex;

uniform mat4 viewProjection;

varying vec2 vUv;
varying vec2 vCenter;
varying float vLineIndex;
varying float vLineLettersTotal;
varying float vLineLetterIndex;
varying float vLineWordsTotal;
varying float vLineWordIndex;
varying float vWordIndex;
varying float vLetterIndex;

#include<instancesDeclaration>

void main(void) {
  #include<instancesVertex>
  gl_Position = viewProjection * finalWorld * vec4(position, 1.0);
  vUv = uv;
  vCenter = center;
  vLineIndex = lineIndex;
  vLineLettersTotal = lineLettersTotal;
  vLineLetterIndex = lineLetterIndex;
  vLineWordsTotal = lineWordsTotal;
  vLineWordIndex = lineWordIndex;
  vWordIndex = wordIndex;
  vLetterIndex = letterIndex;
}
`,
  Ft = `
precision highp float;

varying vec2 vUv;
varying vec2 vCenter;
varying float vLineIndex;
varying float vLineLettersTotal;
varying float vLineLetterIndex;
varying float vLineWordsTotal;
varying float vLineWordIndex;
varying float vWordIndex;
varying float vLetterIndex;

uniform sampler2D uFontAtlas;
uniform vec3 uStrokeColor;
uniform vec3 uColor;
uniform float uThreshold;
uniform float uStrokeOutsetWidth;
uniform float uStrokeInsetWidth;
uniform float uOpacity;
uniform float uAlphaTest;
uniform int uLinesTotal;
uniform int uWordsTotal;
uniform int uLettersTotal;

float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

void main(void) {
  float thickness = 0.5;
  float softness = 0.5;

  vec3 s = texture2D(uFontAtlas, vUv).rgb;
  float sigDist = median(s.r, s.g, s.b) - 0.5;
  float afwidth = 1.4142135623730951 / 2.0;

  #ifdef IS_SMALL
  float alpha = smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDist);
  #else
  float alpha = clamp(sigDist / fwidth(sigDist) + 0.5, 0.0, 1.0);
  #endif

  float sigDistOutset = sigDist + uStrokeOutsetWidth * 0.5;
  float sigDistInset = sigDist - uStrokeInsetWidth * 0.5;

  #ifdef IS_SMALL
  float outset = smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDistOutset);
  float inset = 1.0 - smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDistInset);
  #else
  float outset = clamp(sigDistOutset / fwidth(sigDistOutset) + 0.5, 0.0, 1.0);
  float inset = 1.0 - clamp(sigDistInset / fwidth(sigDistInset) + 0.5, 0.0, 1.0);
  #endif

  float border = outset * inset;

  if (alpha < uAlphaTest) discard;

  vec4 filledFragColor = vec4(uColor, uOpacity * alpha);
  vec4 strokedFragColor = vec4(uStrokeColor, uOpacity * border);

  gl_FragColor = mix(filledFragColor, strokedFragColor, border);
}
`;
export { Mt as createTextMesh };
