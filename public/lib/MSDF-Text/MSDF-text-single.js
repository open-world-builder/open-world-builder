/* -------------------------------------------------
 *  Babylon-MSDF Text - single-file edition
 *  (c) 2025 – freely usable under MIT licence
 *-------------------------------------------------*/
(function (root) {
  "use strict";

  /* ---------- helpers ---------------------------------------------------- */

  const ALIGN_LEFT = 0;
  const ALIGN_CENTER = 1;
  const ALIGN_RIGHT = 2;
  const TAB_ID = "\t".charCodeAt(0);
  const SPACE_ID = " ".charCodeAt(0);

  const X_HEIGHTS = ["x", "e", "a", "o", "n", "s", "r", "c", "u", "m", "v", "w", "z"];
  const M_WIDTHS = ["m", "w"];
  const CAP_HEIGHTS = ["H", "I", "N", "E", "F", "K", "L", "T", "U", "V", "W", "X", "Y", "Z"];

  function number(n, def) {
    return typeof n === "number" ? n : def || 0;
  }

  /* ---------- quad-indices ------------------------------------------------ */

  /**
   * Build CW / CCW quad indices.
   * @param {number} count   – number of quads
   * @param {boolean} clockwise – true ⇢ CW, false ⇢ CCW
   * @param {'uint16'|'uint32'} type – index type
   * @param {number} startOffset – base vertex offset
   */
  function createQuadIndices({ count = 1, clockwise = true, type = "uint16", start = 0 } = {}) {
    const dir = clockwise ? [0, 2, 3] : [2, 1, 3];
    const [a, b, c] = dir;
    const len = count * 6;

    const TA = type === "uint32" ? Uint32Array : Uint16Array;
    const out = new TA(len);

    for (let i = 0, v = 0; i < len; i += 6, v += 4) {
      const o = i + start;
      out[o + 0] = v + 0;
      out[o + 1] = v + 1;
      out[o + 2] = v + 2;
      out[o + 3] = v + a;
      out[o + 4] = v + b;
      out[o + 5] = v + c;
    }
    return out;
  }

  /* ---------- word-wrap (greedy/monospace) -------------------------------- */

  const RE_NEWLINE = /\n/;
  const RE_WS = /\s/;
  const NL_CHAR = "\n";

  function idxOf(txt, ch, st, en) {
    const i = txt.indexOf(ch, st);
    return i === -1 || i > en ? en : i;
  }
  const isWS = (ch) => RE_WS.test(ch);

  function monospace(text, start, end, width) {
    const glyphs = Math.min(width, end - start);
    return { start, end: start + glyphs, width };
  }

  function pre(measure, text, start, end, width) {
    const lines = [];
    let lineStart = start;
    for (let i = start; i < end && i < text.length; i++) {
      const chr = text.charAt(i),
        br = RE_NEWLINE.test(chr);
      if (br || i === end - 1) {
        const lineEnd = br ? i : i + 1;
        lines.push(measure(text, lineStart, lineEnd, width));
        lineStart = i + 1;
      }
    }
    return lines;
  }

  function greedy(measure, text, start, end, width, mode) {
    const lines = [];
    let testW = mode === "nowrap" ? Number.MAX_VALUE : width;
    while (start < end && start < text.length) {
      const nl = idxOf(text, NL_CHAR, start, end);
      while (start < nl && isWS(text.charAt(start))) start++;

      const m = measure(text, start, nl, testW);
      let lineEnd = start + (m.end - m.start);
      let next = lineEnd + NL_CHAR.length;

      if (lineEnd < nl) {
        while (lineEnd > start && !isWS(text.charAt(lineEnd))) lineEnd--;
        if (lineEnd === start) {
          if (next > start + 1) next--;
          lineEnd = next;
        } else {
          next = lineEnd;
          while (isWS(text.charAt(lineEnd - 1))) lineEnd--;
        }
      }
      if (lineEnd >= start) lines.push(measure(text, start, lineEnd, testW));
      start = next;
    }
    return lines;
  }

  function wordwrapLines(text = "", opt = {}) {
    const width = number(opt.width, Number.MAX_VALUE);
    const start = Math.max(0, opt.start || 0);
    const end = typeof opt.end === "number" ? opt.end : text.length;
    const mode = opt.mode;
    const measure = opt.measure || monospace;

    if (opt.width === 0 && opt.mode !== "nowrap") return [];
    if (mode === "pre") return pre(measure, text, start, end, width);
    return greedy(measure, text, start, end, width, mode);
  }

  function wordwrap(text = "", opt = {}) {
    const lines = wordwrapLines(text, opt);
    return lines.map((l) => text.substring(l.start, l.end)).join("\n");
  }

  /* ---------- TextLayout -------------------------------------------------- */

  class TextLayout {
    constructor(options) {
      this.update(options);
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

    update(opt) {
      opt = Object.assign({ measure: this._measure.bind(this) }, opt);
      this._opt = opt;
      this._opt.tabSize = number(opt.tabSize, 4);

      if (!opt.font) throw Error("Must provide a bitmap-font JSON");

      const font = opt.font,
        glyphs = (this.glyphs = []);
      this._setupSpaceGlyphs(font);

      const lines = wordwrapLines(opt.text || "", opt);
      const minW = opt.width || 0;
      const maxLine = lines.reduce((p, l) => Math.max(p, l.width, minW), 0);

      const optionLH = number(opt.lineHeight, 1);
      const lh = font.common.lineHeight * Math.max(optionLH, 1);
      const base = font.common.base;
      const desc = lh - base;
      const letterSp = opt.letterSpacing || 0;
      const alignT = getAlignType(opt.align);

      let x = 0,
        y = -(lh * lines.length - desc);
      let wordI = 0,
        letterI = 0;

      lines.forEach((ln, lineIdx) => {
        const lnTxt = (opt.text || "").slice(ln.start, ln.end);
        const lnWordsTot = lnTxt.split(" ").filter(Boolean).length;
        const lnLettersTot = lnTxt.split(" ").join("").length;
        let lnLetterIdx = 0,
          lnWordIdx = 0;
        let lastGlyph;

        for (let i = ln.start; i < ln.end; i++) {
          const id = (opt.text || "").charCodeAt(i);
          const g = this._getGlyph(font, id);
          if (g) {
            if (lastGlyph) x += getKerning(font, lastGlyph.id, g.id);
            let tx = x;
            if (alignT === ALIGN_CENTER) tx += (maxLine - ln.width) / 2;
            else if (alignT === ALIGN_RIGHT) tx += maxLine - ln.width;

            glyphs.push({
              position: [tx, y],
              data: g,
              index: i,
              linesTotal: lines.length,
              lineIndex: lineIdx,
              lineLettersTotal: lnLettersTot,
              lineLetterIndex: lnLetterIdx,
              lineWordsTotal: lnWordsTot,
              lineWordIndex: lnWordIdx,
              wordsTotal: this._wordsTotal,
              wordIndex: wordI,
              lettersTotal: this._lettersTotal,
              letterIndex: letterI,
            });

            if (g.id === SPACE_ID && lastGlyph?.id !== SPACE_ID) {
              lnWordIdx++;
              wordI++;
            }
            if (g.id !== SPACE_ID) {
              lnLetterIdx++;
              letterI++;
            }

            x += g.xadvance + letterSp;
            lastGlyph = g;
          }
        }
        y += lh;
        x = 0;
      });

      // summary metrics
      this._width = maxLine;
      this._height = lh * lines.length - desc;
      this._descender = desc;
      this._baseline = base;
      this._xHeight = getXHeight(font);
      this._capHeight = getCapHeight(font);
      this._lineHeight = lh;
      this._ascender = lh - desc - this._xHeight;
      this._lettersTotal = letterI;
      this._wordsTotal = wordI;
      this._linesTotal = lines.length;
    }

    /* -------------- private ------------------------------------------------ */

    _measure(text, start, end, width) {
      const font = this._opt.font,
        letterSp = this._opt.letterSpacing || 0;
      let pen = 0,
        curW = 0,
        cnt = 0,
        lastGlyph;

      for (let i = start; i < Math.min(text.length, end); i++) {
        const id = text.charCodeAt(i);
        const g = this._getGlyph(font, id);
        if (g) {
          const kern = lastGlyph ? getKerning(font, lastGlyph.id, g.id) : 0;
          pen += kern;
          const nextPen = pen + g.xadvance + letterSp;
          const nextW = pen + g.width;
          if (nextW >= width || nextPen >= width) break;
          pen = nextPen;
          curW = nextW;
          lastGlyph = g;
        }
        cnt++;
      }
      if (lastGlyph) curW += lastGlyph.xoffset;
      return { start, end: start + cnt, width: curW };
    }

    _getGlyph(font, id) {
      const g = getGlyphById(font, id);
      if (g) return g;
      if (id === TAB_ID) return this._tabGlyph;
      if (id === SPACE_ID) return this._spaceGlyph;
      return null;
    }

    _setupSpaceGlyphs(font) {
      const space = getGlyphById(font, SPACE_ID) || getMGlyph(font) || font.chars[0];
      const tabW = (this._opt.tabSize || 0) * space.xadvance;
      this._spaceGlyph = space;
      this._tabGlyph = { ...space, x: 0, y: 0, xadvance: tabW, id: TAB_ID, width: 0, height: 0, xoffset: 0, yoffset: 0 };
    }
  }

  /* ---------- TextMeshAttributes / Infos --------------------------------- */

  const TextMeshAttributes = {
    create(glyphs, texW, texH, flipY, layout) {
      const uvs = new Float32Array(glyphs.length * 4 * 2);
      const layoutUvs = new Float32Array(glyphs.length * 4 * 2);
      const positions = new Float32Array(glyphs.length * 4 * 3);
      const centers = new Float32Array(glyphs.length * 4 * 2);

      let ui = 0,
        li = 0,
        pi = 0,
        ci = 0;

      glyphs.forEach((g) => {
        const bm = g.data;

        /* uv */
        const bw = bm.x + bm.width,
          bh = bm.y + bm.height;
        let u0 = bm.x / texW,
          v1 = bm.y / texH;
        let u1 = bw / texW,
          v0 = bh / texH;
        if (flipY) {
          v1 = (texH - bm.y) / texH;
          v0 = (texH - bh) / texH;
        }

        uvs.set([u0, v1, u0, v0, u1, v0, u1, v1], ui);
        ui += 8;

        /* layout-uv */
        const [gx, gy] = g.position;
        const ly = gy + layout.height;
        layoutUvs.set([gx / layout.width, ly / layout.height, gx / layout.width, (ly + bm.height) / layout.height, (gx + bm.width) / layout.width, (ly + bm.height) / layout.height, (gx + bm.width) / layout.width, ly / layout.height], li);
        li += 8;

        /* positions */
        const x = gx + bm.xoffset,
          y = gy + bm.yoffset,
          z = 0,
          w = bm.width,
          h = bm.height;
        positions.set([x, -y, z, x, -y - h, z, x + w, -y - h, z, x + w, -y, z], pi);
        pi += 12;

        /* centers */
        const cx = x + w / 2,
          cy = y + h / 2;
        centers.set([cx, cy, cx, cy, cx, cy, cx, cy], ci);
        ci += 8;
      });

      return { uvs, layoutUvs, positions, centers };
    },

    setCustomAttributes(engine, mesh, attrib) {
      const defs = [
        [attrib.centers, "center", 2],
        [attrib.layoutUvs, "layoutUv", 2],
      ];
      defs.forEach(([data, kind, stride]) => {
        mesh.setVerticesBuffer(new BABYLON.VertexBuffer(engine, data, kind, true, false, stride));
      });
    },
  };

  const TextMeshInfos = {
    create(glyphs) {
      const sz = glyphs.length * 4;
      const info = {
        lineIndex: new Float32Array(sz),
        lineLettersTotal: new Float32Array(sz),
        lineLetterIndex: new Float32Array(sz),
        lineWordsTotal: new Float32Array(sz),
        lineWordIndex: new Float32Array(sz),
        wordIndex: new Float32Array(sz),
        letterIndex: new Float32Array(sz),
        linesTotal: 0,
        wordsTotal: 0,
        lettersTotal: 0,
      };

      let i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        p = 0;
      glyphs.forEach((g) => {
        for (let q = 0; q < 4; q++) {
          info.lineIndex[i++] = g.lineIndex;
          info.lineLettersTotal[j++] = g.lineLettersTotal;
          info.lineLetterIndex[k++] = g.lineLetterIndex;
          info.lineWordsTotal[l++] = g.lineWordsTotal;
          info.lineWordIndex[m++] = g.lineWordIndex;
          info.wordIndex[n++] = g.wordIndex;
          info.letterIndex[p++] = g.letterIndex;
        }
        info.linesTotal = g.linesTotal;
        info.wordsTotal = g.wordsTotal;
        info.lettersTotal = g.lettersTotal;
      });
      return info;
    },

    setCustomAttributes(engine, mesh, inf) {
      const defs = [
        [inf.lineIndex, "lineIndex", 1],
        [inf.lineLettersTotal, "lineLettersTotal", 1],
        [inf.lineLetterIndex, "lineLetterIndex", 1],
        [inf.lineWordsTotal, "lineWordsTotal", 1],
        [inf.lineWordIndex, "lineWordIndex", 1],
        [inf.wordIndex, "wordIndex", 1],
        [inf.letterIndex, "letterIndex", 1],
      ];
      defs.forEach(([data, kind, stride]) => {
        mesh.setVerticesBuffer(new BABYLON.VertexBuffer(engine, data, kind, true, false, stride));
      });
    },
  };

  /* ---------- shader sources --------------------------------------------- */

  const VERT = `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  attribute vec2 center;
  attribute float lineIndex,lineLettersTotal,lineLetterIndex,lineWordsTotal,lineWordIndex,wordIndex,letterIndex;
  uniform mat4 viewProjection;
  varying vec2 vUv,vCenter;
  varying float vLineIndex,vLineLettersTotal,vLineLetterIndex,vLineWordsTotal,vLineWordIndex,vWordIndex,vLetterIndex;
  #include<instancesDeclaration>
  void main(){
    #include<instancesVertex>
    gl_Position = viewProjection * finalWorld * vec4(position,1.);
    vUv=uv; vCenter=center;
    vLineIndex=lineIndex; vLineLettersTotal=lineLettersTotal; vLineLetterIndex=lineLetterIndex;
    vLineWordsTotal=lineWordsTotal; vLineWordIndex=lineWordIndex; vWordIndex=wordIndex; vLetterIndex=letterIndex;
  }`;

  const FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uFontAtlas;
  uniform vec3 uStrokeColor,uColor;
  uniform float uThreshold,uStrokeOutsetWidth,uStrokeInsetWidth,uOpacity,uAlphaTest;
  float median(float r,float g,float b){ return max(min(r,g),min(max(r,g),b)); }
  void main(){
    vec3  s = texture2D(uFontAtlas,vUv).rgb;
    float sd= median(s.r,s.g,s.b)-0.5;
    float alpha = clamp(sd/fwidth(sd)+0.5,0.,1.);
    float sdOut = sd+uStrokeOutsetWidth*.5;
    float sdIn  = sd-uStrokeInsetWidth*.5;
    float outset=clamp(sdOut/fwidth(sdOut)+.5,0.,1.);
    float inset =1.-clamp(sdIn /fwidth(sdIn )+.5,0.,1.);
    float border=outset*inset;
    if(alpha<uAlphaTest) discard;
    vec4 fill = vec4(uColor, uOpacity*alpha);
    vec4 stroke = vec4(uStrokeColor, uOpacity*border);
    gl_FragColor=mix(fill,stroke,border);
  }`;

  /* ---------- main factory ------------------------------------------------ */

  /**
   * Build a Babylon Mesh that draws MSDF text.
   * @param {string} name
   * @param {Object} options – see docs
   * @param {BABYLON.Scene} scene
   * @returns {BABYLON.Mesh}
   */
  function createTextMesh(name, options, scene) {
    const { atlas, color = new BABYLON.Color3(0, 0, 0), strokeColor = new BABYLON.Color3(0, 0, 0), opacity = 1, strokeWidth = 0.5, ...layoutOpt } = options;

    const engine = scene.getEngine();
    const layout = new TextLayout(layoutOpt);
    const font = options.font;
    const texW = font.common.scaleW;
    const texH = font.common.scaleH;

    const glyphs = layout.glyphsArray.filter((g) => g.data.width * g.data.height > 0);

    const attrib = TextMeshAttributes.create(glyphs, texW, texH, true, layout);
    const info = TextMeshInfos.create(glyphs);
    const indices = createQuadIndices({ count: glyphs.length });

    const mesh = new BABYLON.Mesh(name, scene);
    const vData = new BABYLON.VertexData();
    vData.positions = attrib.positions;
    vData.uvs = attrib.uvs;
    vData.indices = indices;

    const normals = [];
    BABYLON.VertexData.ComputeNormals(attrib.positions, indices, normals);
    vData.normals = normals;
    TextMeshAttributes.setCustomAttributes(engine, mesh, attrib);
    TextMeshInfos.setCustomAttributes(engine, mesh, info);
    vData.applyToMesh(mesh);

    /* 💡 move geometry so its local origin is the exact
   centre‑bottom of the layout rectangle               */
    mesh.bakeTransformIntoVertices(BABYLON.Matrix.Translation(-layout.width * 0.5, 0, 0));
    mesh.refreshBoundingInfo(); // optional but tidy

    // shader registration (once per page)
    if (!BABYLON.Effect.ShadersStore.MSDFVertexShader) BABYLON.Effect.ShadersStore.MSDFVertexShader = VERT;
    if (!BABYLON.Effect.ShadersStore.MSDFFragmentShader) BABYLON.Effect.ShadersStore.MSDFFragmentShader = FRAG;

    const mat = new BABYLON.ShaderMaterial("msdfShader", scene, { vertex: "MSDF", fragment: "MSDF" }, { attributes: ["position", "normal", "uv", "center", "layoutUv", "lineIndex", "lineLettersTotal", "lineLetterIndex", "lineWordsTotal", "lineWordIndex", "wordIndex", "letterIndex"], uniforms: ["world", "worldView", "worldViewProjection", "view", "viewProjection", "projection", "uColor", "uThreshold", "uStrokeOutsetWidth", "uStrokeInsetWidth", "uOpacity", "uAlphaTest", "uStrokeColor", "uLinesTotal", "uWordsTotal", "uLettersTotal"], needAlphaBlending: true });

    const tex = atlas instanceof BABYLON.Texture ? atlas : new BABYLON.Texture(atlas, scene);
    mat.setTexture("uFontAtlas", tex);
    mat.setColor3("uColor", color);
    mat.setColor3("uStrokeColor", strokeColor);
    mat.setFloat("uThreshold", 0.05);
    mat.setFloat("uStrokeOutsetWidth", 0);
    mat.setFloat("uStrokeInsetWidth", strokeWidth);
    mat.setFloat("uOpacity", opacity);
    mat.setFloat("uAlphaTest", 0.01);
    mat.setInt("uLinesTotal", info.linesTotal);
    mat.setInt("uWordsTotal", info.wordsTotal);
    mat.setInt("uLettersTotal", info.lettersTotal);
    mat.backFaceCulling = false;

    mesh.material = mat;
    return mesh;
  }

  /* ---------- font helpers ------------------------------------------------ */

  function findChar(arr, val) {
    for (let i = 0; i < arr.length; i++) if (arr[i].id === val) return i;
    return -1;
  }
  function getGlyphById(font, id) {
    const idx = findChar(font.chars, id);
    return idx >= 0 ? font.chars[idx] : null;
  }
  function getXHeight(font) {
    for (const c of X_HEIGHTS) {
      const g = getGlyphById(font, c.charCodeAt(0));
      if (g) return g.height;
    }
    return 0;
  }
  function getMGlyph(font) {
    for (const c of M_WIDTHS) {
      const g = getGlyphById(font, c.charCodeAt(0));
      if (g) return g;
    }
    return null;
  }
  function getCapHeight(font) {
    for (const c of CAP_HEIGHTS) {
      const g = getGlyphById(font, c.charCodeAt(0));
      if (g) return g.height;
    }
    return 0;
  }
  function getKerning(font, lft, rgt) {
    if (!font.kernings) return 0;
    const k = font.kernings.find((k) => k.first === lft && k.second === rgt);
    return k ? k.amount : 0;
  }
  function getAlignType(a) {
    return a === "center" ? ALIGN_CENTER : a === "right" ? ALIGN_RIGHT : ALIGN_LEFT;
  }

  /* ---------- exports ----------------------------------------------------- */

  root.createMSDFTextMesh = createTextMesh; // convenience global
  root.MSDFText = {
    // full namespace
    createTextMesh,
    TextLayout,
    wordwrap,
    TextMeshAttributes,
    TextMeshInfos,
    createQuadIndices,
  };
})(typeof window !== "undefined" ? window : globalThis);
