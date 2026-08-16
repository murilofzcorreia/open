/**
 * Memory Postcard & Poster Exporter
 * Generates a high-resolution commemorative polaroid memory card using HTML5 Canvas
 * with support for direct download and Web Share API.
 */

export function generateMemoryPostcard(photoSrc, coupleQuote = 'Cada segundo ao seu lado é uma memória inesquecível.') {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context not available'));
      return;
    }

    // High resolution dimensions (1200 x 1600 portrait poster)
    const W = 1200;
    const H = 1600;
    canvas.width = W;
    canvas.height = H;

    // 1. Background deep gradient
    const bgGradient = ctx.createLinearGradient(0, 0, W, H);
    bgGradient.addColorStop(0, '#0a001a');
    bgGradient.addColorStop(0.5, '#160033');
    bgGradient.addColorStop(1, '#050010');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    // 2. Ambient glowing orbs
    function drawGlow(x, y, radius, color) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    drawGlow(W * 0.2, H * 0.15, 400, 'rgba(244, 114, 182, 0.18)');
    drawGlow(W * 0.85, H * 0.8, 500, 'rgba(168, 85, 247, 0.22)');
    drawGlow(W * 0.5, H * 0.5, 350, 'rgba(192, 132, 252, 0.12)');

    // 3. Stardust particles on background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 80; i++) {
      const px = Math.random() * W;
      const py = Math.random() * H;
      const size = Math.random() * 2.5 + 0.5;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. White Polaroid Frame
    const frameX = 100;
    const frameY = 120;
    const frameW = W - 200;
    const frameH = 1100;
    const frameRadius = 24;

    // Soft drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 45;
    ctx.shadowOffsetY = 25;
    ctx.fillStyle = '#fcf8ff';
    roundRect(ctx, frameX, frameY, frameW, frameH, frameRadius);
    ctx.fill();
    ctx.restore();

    // 5. Load and draw Image inside Polaroid
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const imgPad = 40;
      const imgX = frameX + imgPad;
      const imgY = frameY + imgPad;
      const imgW = frameW - imgPad * 2;
      const imgH = frameH - 240;

      ctx.save();
      roundRect(ctx, imgX, imgY, imgW, imgH, 16);
      ctx.clip();

      // Cover scaling for image
      const scale = Math.max(imgW / img.width, imgH / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      const sx = imgX + (imgW - sw) / 2;
      const sy = imgY + (imgH - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh);
      ctx.restore();

      // 6. Text inside polaroid footer
      ctx.fillStyle = '#2b104a';
      ctx.font = 'italic 42px "Cormorant Garamond", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Murilo & Ana Paula', W / 2, frameY + frameH - 140);

      ctx.fillStyle = '#7c3aed';
      ctx.font = '500 24px "Montserrat", sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText('NOSSA HISTÓRIA DE AMOR', W / 2, frameY + frameH - 90);

      // 7. Poster Footer Information
      ctx.fillStyle = '#f3ddff';
      ctx.font = '300 28px "Montserrat", sans-serif';
      ctx.fillText('✨ Desde 12 de Maio de 2026 ✨', W / 2, 1300);

      // Quote
      ctx.fillStyle = '#e9d5ff';
      ctx.font = 'italic 34px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(`"${coupleQuote}"`, W / 2, 1380);

      ctx.fillStyle = 'rgba(216, 180, 254, 0.7)';
      ctx.font = '400 22px "Montserrat", sans-serif';
      ctx.fillText('Murilo Fuzi Correia & Ana Paula Germano de Oliveira', W / 2, 1460);

      // Resolve base64 data
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    };

    img.onerror = () => {
      // Fallback if image fails: render elegant monogram inside polaroid
      const imgPad = 40;
      const imgX = frameX + imgPad;
      const imgY = frameY + imgPad;
      const imgW = frameW - imgPad * 2;
      const imgH = frameH - 240;

      ctx.fillStyle = '#1e0836';
      roundRect(ctx, imgX, imgY, imgW, imgH, 16);
      ctx.fill();

      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 96px "Cormorant Garamond", serif';
      ctx.textAlign = 'center';
      ctx.fillText('M 💜 A', W / 2, imgY + imgH / 2);

      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    };

    img.src = photoSrc;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function downloadMemoryCard(photoSrc, quote) {
  try {
    const dataUrl = await generateMemoryPostcard(photoSrc, quote);
    const link = document.createElement('a');
    link.download = `Murilo_e_Ana_Lembranca_${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    return true;
  } catch (err) {
    console.error('Falha ao exportar cartão:', err);
    return false;
  }
}
