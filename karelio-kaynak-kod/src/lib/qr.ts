import QRCode from 'qrcode';

export type Design = {
  foreground: string;
  background: string;
  dots: 'square' | 'rounded';
  corners: 'square' | 'rounded';
  size: 512 | 1024 | 2048;
  logo: string | null;
  logoScale: number;
};

export const defaultDesign: Design = {
  foreground: '#172033',
  background: '#ffffff',
  dots: 'square',
  corners: 'square',
  size: 1024,
  logo: null,
  logoScale: 0.15,
};

export type GeneratedQr = {
  svg: string;
  dataUrl: string;
  moduleCount: number;
  errorCorrection: 'M' | 'H';
};

const QUIET_ZONE = 4;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const HEX_COLOR = /^#[\da-f]{6}$/i;
const RASTER_DATA_URL = /^data:image\/(?:png|jpeg|webp);base64,[a-z\d+/]+={0,2}$/i;

function color(value: string): string {
  if (!HEX_COLOR.test(value)) throw new Error('Geçerli bir renk seçin (ör. #172033).');
  return value;
}

function luminance(hex: string): number {
  const rgb = color(hex).slice(1).match(/.{2}/g)!.map((part) => {
    const value = parseInt(part, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

export function contrastRatio(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function isLightForeground(foreground: string, background: string): boolean {
  return luminance(foreground) >= luminance(background);
}

function rect(x: number, y: number, width: number, fill: string, radius = 0): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${width}"${radius ? ` rx="${radius}"` : ''} fill="${fill}"/>`;
}

/** Encode locally; the four-module margin is part of every preview and export. */
export function generateQr(payload: string, design: Design = defaultDesign): GeneratedQr {
  if (!payload.trim()) throw new Error('QR kod oluşturmak için bir içerik girin.');
  const foreground = color(design.foreground);
  const background = color(design.background);
  if (![512, 1024, 2048].includes(design.size)) throw new Error('Geçerli bir indirme boyutu seçin.');
  if (!['square', 'rounded'].includes(design.dots) || !['square', 'rounded'].includes(design.corners)) {
    throw new Error('Geçerli bir QR kod stili seçin.');
  }
  if (design.logo && (!RASTER_DATA_URL.test(design.logo) || design.logo.length > MAX_LOGO_BYTES * 1.5)) {
    throw new Error('Logo için geçerli bir PNG, JPG veya WebP görseli yükleyin.');
  }

  const errorCorrection = design.logo ? 'H' : 'M';
  let matrix: ReturnType<typeof QRCode.create>['modules'];
  try {
    if (payload.length > 10000) throw new Error('Capacity exceeded');
    matrix = QRCode.create(payload, { errorCorrectionLevel: errorCorrection }).modules;
  } catch {
    throw new Error(design.logo
      ? 'Bu içerik logolu QR kodun kapasitesini aşıyor. Metni kısaltın veya logoyu kaldırın.'
      : 'Bu içerik QR kod kapasitesini aşıyor. Lütfen metni veya bağlantıyı kısaltın.');
  }

  const count = matrix.size;
  const dimension = count + QUIET_ZONE * 2;
  const finderOrigins = [[0, 0], [count - 7, 0], [0, count - 7]];
  const isFinder = (x: number, y: number) => finderOrigins.some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${design.size}" height="${design.size}" viewBox="0 0 ${dimension} ${dimension}" role="img" aria-label="QR kod" data-quiet-zone="4">`,
    rect(0, 0, dimension, background),
  ];

  // Keep timing, alignment and format modules square even in the rounded style.
  let squarePath = '';
  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count; x++) {
      if (!matrix.get(y, x) || isFinder(x, y)) continue;
      const px = x + QUIET_ZONE;
      const py = y + QUIET_ZONE;
      if (design.dots === 'rounded' && !matrix.isReserved(y, x)) {
        parts.push(rect(px, py, 1, foreground, 0.23));
      } else {
        squarePath += `M${px} ${py}h1v1h-1z`;
      }
    }
  }
  if (squarePath) parts.push(`<path d="${squarePath}" fill="${foreground}"/>`);

  for (const [x, y] of finderOrigins) {
    const px = x + QUIET_ZONE;
    const py = y + QUIET_ZONE;
    const rounded = design.corners === 'rounded';
    parts.push(rect(px, py, 7, foreground, rounded ? 1.5 : 0));
    parts.push(rect(px + 1, py + 1, 5, background, rounded ? 0.8 : 0));
    parts.push(rect(px + 2, py + 2, 3, foreground, rounded ? 0.6 : 0));
  }

  if (design.logo) {
    // The complete occluded area, including padding, is capped at 18% of core width.
    const requestedScale = Number.isFinite(design.logoScale) ? design.logoScale : defaultDesign.logoScale;
    const extent = Number((count * Math.max(0.08, Math.min(0.18, requestedScale))).toFixed(4));
    const padding = Math.min(0.45, extent * 0.12);
    const origin = (dimension - extent) / 2;
    const imageWidth = extent - 2 * padding;
    parts.push(`<g data-logo-width="${extent}">`);
    parts.push(rect(origin, origin, extent, background, 0.35));
    parts.push(`<image href="${design.logo}" x="${origin + padding}" y="${origin + padding}" width="${imageWidth}" height="${imageWidth}" preserveAspectRatio="xMidYMid meet"/>`);
    parts.push('</g>');

    // A large symbol can have an alignment pattern at its center. Restore reserved
    // modules above the logo so no positioning or format information is covered.
    const first = Math.max(0, Math.floor(origin - QUIET_ZONE));
    const last = Math.min(count, Math.ceil(origin + extent - QUIET_ZONE));
    for (let y = first; y < last; y++) {
      for (let x = first; x < last; x++) {
        if (matrix.isReserved(y, x)) {
          parts.push(rect(x + QUIET_ZONE, y + QUIET_ZONE, 1, matrix.get(y, x) ? foreground : background));
        }
      }
    }
  }

  parts.push('</svg>');
  const svg = parts.join('');
  return { svg, dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, moduleCount: count, errorCorrection };
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Görsel okunamadı. Başka bir görsel deneyin.'));
    image.src = source;
  });
}

/** Rasterize exactly the SVG used by the preview, including logo and quiet zone. */
export async function svgToPng(svg: string, size: number): Promise<Blob> {
  if (![512, 1024, 2048].includes(size)) throw new Error('Geçerli bir indirme boyutu seçin.');
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Tarayıcınız PNG indirmeyi desteklemiyor. SVG biçimini deneyin.');
  context.drawImage(image, 0, 0, size, size);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG hazırlanamadı. Lütfen yeniden deneyin.')), 'image/png');
  });
}

/** Decode and re-encode locally so uploaded metadata and active formats never enter exports. */
export async function readLogo(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('PNG, JPG veya WebP biçiminde bir logo seçin.');
  }
  if (!file.size || file.size > MAX_LOGO_BYTES) throw new Error('Logo dosyası boş olmamalı ve en fazla 2 MB olmalı.');
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isPng = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => header[index] === byte);
  const isJpeg = header[0] === 255 && header[1] === 216 && header[2] === 255;
  const isWebp = String.fromCharCode(...header.slice(0, 4)) === 'RIFF' && String.fromCharCode(...header.slice(8, 12)) === 'WEBP';
  const signatureMatches = (file.type === 'image/png' && isPng) || (file.type === 'image/jpeg' && isJpeg) || (file.type === 'image/webp' && isWebp);
  if (!signatureMatches) throw new Error('Dosya içeriği geçerli bir PNG, JPG veya WebP görseli değil.');

  const source = URL.createObjectURL(file);
  try {
    const image = await loadImage(source);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height || width * height > 25000000 || width > 10000 || height > 10000) {
      throw new Error('Bu görselin boyutları çok büyük. Daha küçük bir logo seçin.');
    }
    const factor = Math.min(1, 512 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * factor));
    canvas.height = Math.max(1, Math.round(height * factor));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Logo işlenemedi. Güncel bir tarayıcıyla yeniden deneyin.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(source);
  }
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
