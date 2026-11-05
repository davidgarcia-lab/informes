'use strict';
(() => {
  const pointsPerPixel = 72 / 96;
  const a4 = [210 * 72 / 25.4, 297 * 72 / 25.4];

  function collectText(source, origin, context) {
    const words = [];
    const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const style = getComputedStyle(node.parentElement);
      const size = parseFloat(style.fontSize);
      const cssFont = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.font = cssFont;
      const metrics = context.measureText('Ágj');
      const ascent = metrics.fontBoundingBoxAscent ?? size * 0.85;
      const channels = style.color.match(/[\d.]+/g).slice(0, 3).map(channel => Number(channel) / 255);
      const color = window.PDFLib.rgb(...channels);
      const bold = Number(style.fontWeight) >= 600;
      function add(text, rect) {
        if (!rect.width || !rect.height) return;
        words.push({text, cssFont, size, color, cssColor: style.color, bold, x: rect.left-origin.left, y: rect.top-origin.top+ascent});
      }
      for (const match of node.data.matchAll(/\S+/gu)) {
        const [text] = match;
        range.setStart(node, match.index);
        range.setEnd(node, match.index + text.length);
        const rects = range.getClientRects();
        if (rects.length === 1) {
          add(text, rects[0]);
          continue;
        }
        // A long unbroken value can wrap within a word.
        let offset = match.index;
        for (const character of text) {
          range.setStart(node, offset);
          offset += character.length;
          range.setEnd(node, offset);
          add(character, range.getBoundingClientRect());
        }
      }
    }
    return words;
  }

  function snapshot(source, context) {
    const origin = source.getBoundingClientRect();
    const images = Array.from(source.querySelectorAll('img'), image => {
      const rect = image.getBoundingClientRect();
      return {image, x: rect.left-origin.left, y: rect.top-origin.top, width: rect.width, height: rect.height};
    });
    const rules = Array.from(source.querySelectorAll('hr'), line => {
      const rect = line.getBoundingClientRect();
      return {x: rect.left-origin.left, y: rect.top-origin.top, width: rect.width};
    });
    return {words: collectText(source, origin, context), images, rules};
  }

  async function embedImage(pdf, image) {
    if (image.src.startsWith('data:image/jpeg;')) return pdf.embedJpg(image.src);
    if (image.src.startsWith('data:image/png;')) return pdf.embedPng(image.src);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext('2d').drawImage(image, 0, 0);
    return pdf.embedPng(canvas.toDataURL('image/png'));
  }

  async function drawWord(pdf, page, word, font) {
    const x = word.x * pointsPerPixel;
    const baseline = page.getHeight() - word.y * pointsPerPixel;
    try {
      font.encodeText(word.text);
    } catch {
      // Use the browser glyphs for characters outside the PDF standard font.
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = word.cssFont;
      const metrics = context.measureText(word.text);
      const top = Math.ceil(metrics.actualBoundingBoxAscent) + 2;
      const height = top + Math.ceil(metrics.actualBoundingBoxDescent) + 2;
      const width = Math.ceil(metrics.width) + 4;
      canvas.width = width * 2;
      canvas.height = height * 2;
      context.scale(2, 2);
      context.font = word.cssFont;
      context.fillStyle = word.cssColor;
      context.fillText(word.text, 2, top);
      const glyphs = await pdf.embedPng(canvas.toDataURL('image/png'));
      page.drawImage(glyphs, {x: x-2*pointsPerPixel, y: baseline-(height-top)*pointsPerPixel, width: width*pointsPerPixel, height: height*pointsPerPixel});
      return;
    }
    page.drawText(word.text, {x, y: baseline, size: word.size*pointsPerPixel, font, color: word.color});
  }

  async function download(container, filename) {
    const sources = Array.from(container.children);
    const context = document.createElement('canvas').getContext('2d');
    const layouts = sources.map(source => snapshot(source, context));
    await Promise.all(layouts.flatMap(layout => layout.images.map(({image}) => image.decode())));
    const {PDFDocument, StandardFonts, rgb} = window.PDFLib;
    const pdf = await PDFDocument.create();
    pdf.setTitle(filename);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    for (const layout of layouts) {
      const page = pdf.addPage(a4);
      for (const {image, x, y, width, height} of layout.images) {
        const asset = await embedImage(pdf, image);
        const scale = Math.min(width/asset.width, height/asset.height);
        const fitted = asset.scale(scale);
        page.drawImage(asset, {
          x: (x+(width-fitted.width)/2)*pointsPerPixel,
          y: page.getHeight()-(y+(height+fitted.height)/2)*pointsPerPixel,
          width: fitted.width*pointsPerPixel,
          height: fitted.height*pointsPerPixel
        });
      }
      for (const line of layout.rules) {
        const y = page.getHeight()-line.y*pointsPerPixel;
        page.drawLine({start:{x:line.x*pointsPerPixel,y},end:{x:(line.x+line.width)*pointsPerPixel,y},thickness:0.6,color:rgb(0.27,0.27,0.27)});
      }
      for (const word of layout.words) await drawWord(pdf, page, word, word.bold ? bold : regular);
    }
    const url = URL.createObjectURL(new Blob([await pdf.save()], {type:'application/pdf'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  window.P65PDF = Object.freeze({download});
})();
