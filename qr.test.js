import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { contrastRatio, defaultDesign, generateQr, isLightForeground } from './qr';
async function rasterize(svg, size = 1024) {
    return sharp(Buffer.from(svg)).resize(size, size).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}
async function decode(svg, size = 1024) {
    const { data, info } = await rasterize(svg, size);
    return jsQR(new Uint8ClampedArray(data), info.width, info.height, { inversionAttempts: 'dontInvert' })?.data;
}
const payloads = [
    'https://karelio.example/merhaba?kampanya=yaz&dil=tr',
    'Merhaba İstanbul! Çığ, öğüt, şeker, ıhlamur. 👋',
    'WIFI:T:WPA;S:Karelio Misafir;P:güçlü\\;şifre\\:2026;H:false;;',
    'BEGIN:VCARD\r\nVERSION:3.0\r\nN:Yılmaz;Ayşe;;;\r\nFN:Ayşe Yılmaz\r\nORG:Karelio\r\nTEL:+905551234567\r\nEMAIL:ayse@example.com\r\nURL:https://example.com\r\nEND:VCARD',
    'mailto:merhaba@example.com?subject=Merhaba%20Karelio&body=Bir%20sorum%20var',
    'tel:+905551234567',
];
describe('QR codes decode with an independent reader', () => {
    for (const dots of ['square', 'rounded']) {
        for (const corners of ['square', 'rounded']) {
            it.each(payloads)(`${dots} dots, ${corners} corners: %s`, async (payload) => {
                const qr = generateQr(payload, { ...defaultDesign, dots, corners });
                expect(qr.errorCorrection).toBe('M');
                expect(await decode(qr.svg)).toBe(payload);
            });
        }
    }
    it.each([512, 1024, 2048])('decodes colored rounded modules and an embedded raster logo at %i px', async (size) => {
        const logo = await sharp({ create: { width: 48, height: 48, channels: 4, background: '#7247eb' } }).png().toBuffer();
        const design = { ...defaultDesign, foreground: '#493187', background: '#fffdf8', dots: 'rounded', corners: 'rounded', size, logo: `data:image/png;base64,${logo.toString('base64')}`, logoScale: 0.18 };
        for (const payload of [payloads[0], payloads[2], payloads[3]]) {
            const qr = generateQr(payload, design);
            expect(qr.errorCorrection).toBe('H');
            expect(qr.svg).toContain(`width="${size}" height="${size}"`);
            expect(await decode(qr.svg, size)).toBe(payload);
        }
    }, 15000);
    it('preserves central alignment information under the logo for a denser symbol', async () => {
        const logo = await sharp({ create: { width: 48, height: 48, channels: 4, background: '#171717' } }).png().toBuffer();
        const payload = 'İstanbul / QR doğrulama / '.repeat(18);
        const qr = generateQr(payload, { ...defaultDesign, dots: 'rounded', corners: 'rounded', logo: `data:image/png;base64,${logo.toString('base64')}`, logoScale: 0.18 });
        expect(qr.moduleCount).toBeGreaterThan(45);
        expect(await decode(qr.svg)).toBe(payload);
    });
});
describe('export invariants and validation', () => {
    it('includes a four-module empty margin on every side', async () => {
        const qr = generateQr('KARELIO');
        const dimension = qr.moduleCount + 8;
        expect(qr.svg).toContain(`viewBox="0 0 ${dimension} ${dimension}"`);
        const scale = 12;
        const { data, info } = await rasterize(qr.svg, dimension * scale);
        let darkPixelsInMargin = 0;
        for (let y = 0; y < info.height; y++) {
            for (let x = 0; x < info.width; x++) {
                if (x < 4 * scale || y < 4 * scale || x >= info.width - 4 * scale || y >= info.height - 4 * scale) {
                    const offset = (y * info.width + x) * 4;
                    if (data[offset] !== 255 || data[offset + 1] !== 255 || data[offset + 2] !== 255 || data[offset + 3] !== 255)
                        darkPixelsInMargin++;
                }
            }
        }
        expect(darkPixelsInMargin).toBe(0);
    });
    it('keeps the preview data URL identical to the exported SVG', () => {
        const qr = generateQr(payloads[1]);
        expect(decodeURIComponent(qr.dataUrl.split(',').slice(1).join(','))).toBe(qr.svg);
    });
    it('caps the complete logo area including padding', () => {
        const logo = 'data:image/png;base64,iVBORw0KGgo=';
        const qr = generateQr(payloads[0], { ...defaultDesign, logo, logoScale: 0.9 });
        const logoWidth = Number(qr.svg.match(/data-logo-width="([\d.]+)"/)[1]);
        expect(logoWidth).toBeLessThanOrEqual(qr.moduleCount * 0.18 + 0.0001);
    });
    it('rejects active, external and malformed logo sources', () => {
        for (const logo of ['https://example.com/logo.png', 'data:image/svg+xml;base64,PHN2Zy8+', 'data:image/png;base64,AAAA" onload="alert(1)']) {
            expect(() => generateQr('hello', { ...defaultDesign, logo })).toThrow(/PNG, JPG veya WebP/);
        }
        expect(() => generateQr('hello', { ...defaultDesign, foreground: 'red" onload="alert(1)' })).toThrow(/renk/);
    });
    it('reports empty input and capacity errors in Turkish', () => {
        expect(() => generateQr('  ')).toThrow(/içerik girin/);
        expect(() => generateQr('a'.repeat(3000))).toThrow(/kapasitesini aşıyor/);
        expect(() => generateQr('a'.repeat(1500), { ...defaultDesign, logo: 'data:image/png;base64,iVBORw0KGgo=' })).toThrow(/logolu/);
    });
    it('detects low contrast and inverted polarity', () => {
        expect(contrastRatio('#000000', '#ffffff')).toBe(21);
        expect(contrastRatio('#eeeeee', '#ffffff')).toBeLessThan(1.2);
        expect(isLightForeground('#ffffff', '#172033')).toBe(true);
        expect(isLightForeground('#172033', '#ffffff')).toBe(false);
    });
});
