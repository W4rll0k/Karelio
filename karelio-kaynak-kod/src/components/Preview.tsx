import { useState } from 'react';
import { ArrowDownToLine, Check, Copy, FileCode2, QrCode, ScanLine, ShieldCheck, AlertTriangle, LockKeyhole } from 'lucide-react';
import { saveBlob, svgToPng, contrastRatio, isLightForeground, type Design, type GeneratedQr } from '../lib/qr';
import type { QrType } from '../lib/payload';
const filenames: Record<QrType, string> = { url: 'baglanti', text: 'metin', wifi: 'wifi', vcard: 'kisi-karti', email: 'eposta', sms: 'sms', phone: 'telefon' };
export default function Preview({ qr, design, type, busy, error, onSize, notify }: { qr: GeneratedQr | null; design: Design; type: QrType; busy: boolean; error: string; onSize: (size: Design['size']) => void; notify: (message: string) => void }) {
  const [action, setAction] = useState('');
  const lowContrast = contrastRatio(design.foreground, design.background) < 4.5 || isLightForeground(design.foreground, design.background);
  const disabled = !qr || busy || !!action;
  const download = async (format: 'png' | 'svg') => {
    if (!qr || disabled) return;
    setAction(format);
    try { const blob = format === 'png' ? await svgToPng(qr.svg, design.size) : new Blob([qr.svg], { type: 'image/svg+xml;charset=utf-8' }); saveBlob(blob, `karelio-${filenames[type]}.${format}`); notify(`${format.toUpperCase()} dosyası indirmeye hazırlandı.`); }
    catch (err) { notify(err instanceof Error ? err.message : 'Dosya hazırlanamadı. Yeniden dene.'); }
    finally { setAction(''); }
  };
  const copy = async () => {
    if (!qr || disabled) return;
    if (!window.isSecureContext || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined' || (ClipboardItem.supports && !ClipboardItem.supports('image/png'))) { notify('Bu tarayıcı görsel kopyalamayı desteklemiyor. PNG olarak indirebilirsin.'); return; }
    setAction('copy');
    try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': svgToPng(qr.svg, design.size) })]); notify('QR görseli panoya kopyalandı.'); }
    catch { notify('Panoya erişilemedi. Tarayıcı iznini kontrol et veya PNG olarak indir.'); }
    finally { setAction(''); }
  };
  return <aside className="preview-column" aria-label="QR önizlemesi ve indirme"><section className="panel preview-panel"><div className="preview-heading"><h2>Canlı önizleme</h2><span className={`live-badge ${qr && !busy ? 'ready' : ''}`}><span />{busy ? 'Güncelleniyor' : qr ? 'Hazır' : 'İçerik bekleniyor'}</span></div><div className="preview-stage" aria-busy={busy}><div className={`qr-sheet ${qr ? 'has-qr' : ''}`}>{qr ? <img src={qr.dataUrl} alt="Oluşturduğun QR kod" /> : <div className="empty-qr"><div className="empty-scan"><ScanLine size={52} strokeWidth={1.1} /></div><strong>{error ? 'Küçük bir düzeltme gerekli' : 'Bağlantın burada şekillenecek'}</strong><p>{error ? 'İçeriği kontrol et, kodun hemen hazır olsun.' : 'İçeriğini ekle, sana özel QR kodunu anında gör.'}</p></div>}</div><span className="preview-caption"><QrCode size={13} />{qr ? `${design.size} × ${design.size} px · ${qr.errorCorrection === 'H' ? 'Yüksek hata düzeltme' : '4 modül güvenli kenar'}` : 'Senin içeriğin. Senin tasarımın.'}</span></div><div className="download-section">{error && <div className="warning" role="alert"><AlertTriangle size={17} /><p>{error}</p></div>}{lowContrast && <div className="warning" role="status"><AlertTriangle size={17} /><p>Bu renkler taramayı zorlaştırabilir. Açık bir arka plan ve daha koyu bir QR rengi seç.</p></div>}<fieldset className="size-field"><legend>Çıktı boyutu <span>PNG & SVG</span></legend><div className="size-options">{([512, 1024, 2048] as const).map(size => <button key={size} aria-pressed={design.size === size} onClick={() => onSize(size)}>{size}<span>px</span>{design.size === size && <Check size={13} />}</button>)}</div></fieldset><button className="primary-button" disabled={disabled} onClick={() => download('png')}><ArrowDownToLine size={19} />{action === 'png' ? 'PNG hazırlanıyor…' : 'PNG olarak indir'}</button><div className="secondary-downloads"><button className="secondary-button" disabled={disabled} onClick={() => download('svg')}><FileCode2 size={17} />{action === 'svg' ? 'Hazırlanıyor…' : 'SVG indir'}</button><button className="secondary-button" disabled={disabled} onClick={copy}><Copy size={16} />{action === 'copy' ? 'Kopyalanıyor…' : 'Görseli kopyala'}</button></div><p className="scan-note"><ScanLine size={15} />Paylaşmadan önce telefonunla taramayı dene.</p></div></section><div className="privacy-note"><span><LockKeyhole size={18} /></span><div><strong>Bilgilerin sende kalır.</strong><p>QR kodun tarayıcında oluşturulur. İçeriğin bir sunucuya gönderilmez.</p></div><ShieldCheck className="privacy-check" size={17} /></div></aside>;
}
