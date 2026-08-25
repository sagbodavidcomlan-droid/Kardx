import QRCode from 'qrcode';

export interface QRCodeCustomOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
  // Gradient configuration
  enableGradient?: boolean;
  gradientType?: 'linear_vertical' | 'linear_horizontal' | 'linear_diagonal' | 'radial';
  gradientStartColor?: string;
  gradientEndColor?: string;
  
  // Center logo & monogram
  centerLogoUrl?: string;
  logoShape?: 'circle' | 'square' | 'rounded';
  logoSize?: 'small' | 'medium' | 'large';
  logoBgColor?: string;
  centerText?: string;
  
  // Frame text & background
  frameText?: string;
  transparentBackground?: boolean;
}

/**
 * Generate a Data URL (PNG) from a given string (e.g. profile URL) with optional brand logo & gradient styling.
 */
export async function generateQRCodeDataUrl(
  text: string,
  options?: QRCodeCustomOptions
): Promise<string> {
  try {
    const width = options?.width || 600;
    const margin = options?.margin !== undefined ? options.margin : 2;
    const darkColor = options?.color?.dark || '#0f172a';
    const lightColor = options?.transparentBackground ? '#00000000' : (options?.color?.light || '#ffffff');
    const ecLevel = options?.errorCorrectionLevel || (options?.centerLogoUrl || options?.centerText ? 'H' : 'M');

    // First generate base QR code on a temporary canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = width + (options?.frameText ? Math.round(width * 0.18) : 0);

    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, text, {
      width: width,
      margin: margin,
      color: {
        dark: options?.enableGradient ? '#000000' : darkColor,
        light: '#ffffff', // Render solid white background first so we can apply gradients cleanly
      },
      errorCorrectionLevel: ecLevel,
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) return qrCanvas.toDataURL('image/png');

    // If gradient is requested, paint gradient over dark QR pixels
    if (options?.enableGradient && options.gradientStartColor && options.gradientEndColor) {
      const gradientCanvas = document.createElement('canvas');
      gradientCanvas.width = width;
      gradientCanvas.height = width;
      const gCtx = gradientCanvas.getContext('2d');

      if (gCtx) {
        let grad: CanvasGradient;
        const gType = options.gradientType || 'linear_diagonal';

        if (gType === 'linear_horizontal') {
          grad = gCtx.createLinearGradient(0, 0, width, 0);
        } else if (gType === 'linear_vertical') {
          grad = gCtx.createLinearGradient(0, 0, 0, width);
        } else if (gType === 'radial') {
          grad = gCtx.createRadialGradient(width / 2, width / 2, width * 0.05, width / 2, width / 2, width * 0.7);
        } else {
          // linear_diagonal default
          grad = gCtx.createLinearGradient(0, 0, width, width);
        }

        grad.addColorStop(0, options.gradientStartColor);
        grad.addColorStop(1, options.gradientEndColor);

        // 1. Draw base QR
        gCtx.drawImage(qrCanvas, 0, 0);

        // 2. Composite gradient only over dark pixels (source-in)
        // Extract black pixels mask
        const imgData = gCtx.getImageData(0, 0, width, width);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // If close to black (QR module)
          const isDark = (r + g + b) / 3 < 128;
          if (isDark) {
            // Keep alpha solid
            data[i + 3] = 255;
          } else {
            // Make light pixels transparent
            data[i + 3] = 0;
          }
        }
        gCtx.putImageData(imgData, 0, 0);

        // Composite gradient over the masked modules
        gCtx.globalCompositeOperation = 'source-in';
        gCtx.fillStyle = grad;
        gCtx.fillRect(0, 0, width, width);
        gCtx.globalCompositeOperation = 'source-over';

        // Now draw back onto main canvas with background
        if (!options.transparentBackground) {
          ctx.fillStyle = options.color?.light || '#ffffff';
          ctx.fillRect(0, 0, width, width);
        }
        ctx.drawImage(gradientCanvas, 0, 0);
      }
    } else {
      // Standard solid fill QR
      if (options?.transparentBackground) {
        const tCanvas = document.createElement('canvas');
        tCanvas.width = width;
        tCanvas.height = width;
        const tCtx = tCanvas.getContext('2d');
        if (tCtx) {
          tCtx.drawImage(qrCanvas, 0, 0);
          const imgData = tCtx.getImageData(0, 0, width, width);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if ((r + g + b) / 3 > 200) {
              data[i + 3] = 0; // transparent
            }
          }
          tCtx.putImageData(imgData, 0, 0);
          ctx.drawImage(tCanvas, 0, 0);
        }
      } else {
        ctx.fillStyle = lightColor;
        ctx.fillRect(0, 0, width, width);
        ctx.drawImage(qrCanvas, 0, 0);
      }
    }

    // Frame text at the bottom if enabled
    if (options?.frameText) {
      if (!options?.transparentBackground) {
        ctx.fillStyle = options?.color?.light || '#ffffff';
        if (ctx.roundRect) {
          ctx.roundRect(0, 0, canvas.width, canvas.height, 16);
        } else {
          ctx.rect(0, 0, canvas.width, canvas.height);
        }
        ctx.fill();
      }

      const bannerHeight = Math.round(width * 0.16);
      const bannerY = width + 4;
      ctx.fillStyle = options?.enableGradient && options.gradientStartColor ? options.gradientStartColor : darkColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.max(14, Math.round(width * 0.045))}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(options.frameText.toUpperCase(), canvas.width / 2, bannerY + bannerHeight / 2 - 4);
    }

    // Embed Brand Center Logo if provided
    if (options?.centerLogoUrl) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => resolve(); // fallback gracefully
          logoImg.src = options.centerLogoUrl!;
        });

        if (logoImg.width > 0) {
          // Determine size
          let sizeMultiplier = 0.22;
          if (options.logoSize === 'small') sizeMultiplier = 0.18;
          if (options.logoSize === 'large') sizeMultiplier = 0.26;

          const logoSize = Math.round(width * sizeMultiplier);
          const logoX = (width - logoSize) / 2;
          const logoY = (width - logoSize) / 2;
          const pad = Math.round(logoSize * 0.14);
          const totalBadgeSize = logoSize + pad * 2;
          const badgeX = (width - totalBadgeSize) / 2;
          const badgeY = (width - totalBadgeSize) / 2;
          const shape = options.logoShape || 'circle';

          // 1. Draw badge background (white / custom with subtle border or shadow)
          ctx.fillStyle = options.logoBgColor || '#ffffff';
          ctx.save();
          
          if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(width / 2, width / 2, totalBadgeSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = Math.max(2, Math.round(width * 0.008));
            ctx.strokeStyle = options.enableGradient && options.gradientStartColor ? options.gradientStartColor : darkColor;
            ctx.stroke();
          } else if (shape === 'rounded') {
            const rad = Math.round(totalBadgeSize * 0.25);
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(badgeX, badgeY, totalBadgeSize, totalBadgeSize, rad);
            } else {
              ctx.rect(badgeX, badgeY, totalBadgeSize, totalBadgeSize);
            }
            ctx.fill();
            ctx.lineWidth = Math.max(2, Math.round(width * 0.008));
            ctx.strokeStyle = options.enableGradient && options.gradientStartColor ? options.gradientStartColor : darkColor;
            ctx.stroke();
          } else {
            // square
            ctx.beginPath();
            ctx.rect(badgeX, badgeY, totalBadgeSize, totalBadgeSize);
            ctx.fill();
            ctx.lineWidth = Math.max(2, Math.round(width * 0.008));
            ctx.strokeStyle = options.enableGradient && options.gradientStartColor ? options.gradientStartColor : darkColor;
            ctx.stroke();
          }

          // 2. Draw brand image clipped inside shape
          ctx.save();
          ctx.beginPath();
          if (shape === 'circle') {
            ctx.arc(width / 2, width / 2, logoSize / 2, 0, Math.PI * 2);
          } else if (shape === 'rounded') {
            const rad = Math.round(logoSize * 0.2);
            if (ctx.roundRect) {
              ctx.roundRect(logoX, logoY, logoSize, logoSize, rad);
            } else {
              ctx.rect(logoX, logoY, logoSize, logoSize);
            }
          } else {
            ctx.rect(logoX, logoY, logoSize, logoSize);
          }
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          ctx.restore();
          ctx.restore();
        }
      } catch (e) {
        console.warn('Could not draw center brand logo on QR code canvas:', e);
      }
    } else if (options?.centerText) {
      // Center monogram fallback
      const badgeSize = Math.round(width * 0.2);
      const pad = Math.round(badgeSize * 0.1);

      ctx.fillStyle = options?.color?.light || '#ffffff';
      ctx.beginPath();
      ctx.arc(width / 2, width / 2, (badgeSize / 2) + pad, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = Math.max(2, Math.round(width * 0.008));
      ctx.strokeStyle = options.enableGradient && options.gradientStartColor ? options.gradientStartColor : darkColor;
      ctx.stroke();

      ctx.fillStyle = options.enableGradient && options.gradientStartColor ? options.gradientStartColor : darkColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.round(badgeSize * 0.55)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(options.centerText.slice(0, 3).toUpperCase(), width / 2, width / 2 + 1);
    }

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Failed to generate QR Code Data URL:', err);
    return '';
  }
}

/**
 * Generate an SVG string from a given string.
 */
export async function generateQRCodeSvg(
  text: string,
  options?: QRCodeCustomOptions
): Promise<string> {
  try {
    const margin = options?.margin !== undefined ? options.margin : 2;
    const darkColor = options?.enableGradient && options.gradientStartColor ? options.gradientStartColor : (options?.color?.dark || '#0f172a');
    const lightColor = options?.transparentBackground ? '#00000000' : (options?.color?.light || '#ffffff');
    const ecLevel = options?.errorCorrectionLevel || (options?.centerLogoUrl || options?.centerText ? 'H' : 'M');

    let svg = await QRCode.toString(text, {
      type: 'svg',
      margin: margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: ecLevel,
    });

    if (options?.transparentBackground) {
      svg = svg.replace(/<rect width="100%" height="100%" fill=".*?"\/>/, '');
    }

    return svg;
  } catch (err) {
    console.error('Failed to generate QR Code SVG:', err);
    return '';
  }
}

/**
 * Download high-resolution PNG file (e.g. 2048px print ready).
 */
export async function downloadHighResQRPng(
  text: string,
  filename: string = 'kardx_qrcode_print.png',
  options?: QRCodeCustomOptions
): Promise<void> {
  const dataUrl = await generateQRCodeDataUrl(text, {
    width: options?.width || 2048,
    margin: options?.margin !== undefined ? options.margin : 2,
    color: { 
      dark: options?.color?.dark || '#0f172a', 
      light: options?.color?.light || '#ffffff' 
    },
    enableGradient: options?.enableGradient,
    gradientType: options?.gradientType,
    gradientStartColor: options?.gradientStartColor,
    gradientEndColor: options?.gradientEndColor,
    centerLogoUrl: options?.centerLogoUrl,
    logoShape: options?.logoShape,
    logoSize: options?.logoSize,
    logoBgColor: options?.logoBgColor,
    centerText: options?.centerText,
    frameText: options?.frameText,
    transparentBackground: options?.transparentBackground,
    errorCorrectionLevel: options?.errorCorrectionLevel || 'H',
  });

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download SVG file for vector usage.
 */
export async function downloadQRSvg(
  text: string,
  filename: string = 'kardx_qrcode_vector.svg',
  options?: QRCodeCustomOptions
): Promise<void> {
  const svgString = await generateQRCodeSvg(text, {
    margin: options?.margin !== undefined ? options.margin : 2,
    color: { 
      dark: options?.color?.dark || '#0f172a', 
      light: options?.color?.light || '#ffffff' 
    },
    enableGradient: options?.enableGradient,
    gradientStartColor: options?.gradientStartColor,
    gradientEndColor: options?.gradientEndColor,
    transparentBackground: options?.transparentBackground,
    errorCorrectionLevel: options?.errorCorrectionLevel || 'H',
  });

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy PNG QR Code image directly to system clipboard.
 */
export async function copyQRCodeToClipboard(
  text: string,
  options?: QRCodeCustomOptions
): Promise<boolean> {
  try {
    const dataUrl = await generateQRCodeDataUrl(text, {
      width: 1024,
      margin: options?.margin !== undefined ? options.margin : 2,
      color: options?.color,
      enableGradient: options?.enableGradient,
      gradientType: options?.gradientType,
      gradientStartColor: options?.gradientStartColor,
      gradientEndColor: options?.gradientEndColor,
      centerLogoUrl: options?.centerLogoUrl,
      logoShape: options?.logoShape,
      logoSize: options?.logoSize,
      logoBgColor: options?.logoBgColor,
      centerText: options?.centerText,
      frameText: options?.frameText,
      transparentBackground: options?.transparentBackground,
    });

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy QR code image to clipboard:', err);
    return false;
  }
}
