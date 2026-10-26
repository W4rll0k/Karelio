import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Check, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import TypeSelector from './TypeSelector';
import ContentForm from './ContentForm';
import DesignControls from './DesignControls';
import Preview from './Preview';
import ThemeToggle from './ThemeToggle';
import Information from './Information';
import InterfaceMotion from './InterfaceMotion';
import BrandMotion from './BrandMotion';
import { buildPayload, createEmptyForms } from './payload';
import { defaultDesign, generateQr } from './qr';
function Brand({ footer = false }) { return <a className={`brand ${footer ? 'footer-brand' : ''}`} href="#olustur" aria-label="Karelio ana sayfa"><svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect width="40" height="40" rx="11" fill="currentColor"/><g stroke="white" strokeWidth="3"><rect x="9" y="9" width="7" height="7" rx="1"/><rect x="24" y="9" width="7" height="7" rx="1"/><rect x="9" y="24" width="7" height="7" rx="1"/></g><path fill="white" d="M23 23h4v4h-4zm5 5h4v4h-4zm-5 0h4v4h-4zm5-5h4v4h-4z"/></svg><span>karelio<span className="brand-period">.</span></span></a>; }
export default function App() {
    const [type, setType] = useState('url');
    const [forms, setForms] = useState(createEmptyForms);
    const [design, setDesign] = useState({ ...defaultDesign });
    const [result, setResult] = useState({ key: '', type: 'url', qr: null, error: '' });
    const [notice, setNotice] = useState('');
    const [clearVersion, setClearVersion] = useState(0);
    const noticeTimer = useRef(null);
    const active = forms[type];
    const validation = useMemo(() => buildPayload(type, active), [type, active]);
    const key = useMemo(() => JSON.stringify([type, active, design]), [type, active, design]);
    const valid = !!validation.payload && Object.keys(validation.errors).length === 0;
    const busy = valid && result.key !== key;
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!valid) {
                setResult({ key, type, qr: null, error: '' });
                return;
            }
            try {
                setResult({ key, type, qr: generateQr(validation.payload, design), error: '' });
            }
            catch (err) {
                setResult({ key, type, qr: null, error: err instanceof Error ? err.message : 'QR oluşturulamadı.' });
            }
        }, 280);
        return () => clearTimeout(timer);
    }, [key, valid, validation.payload, design, type]);
    useEffect(() => () => { if (noticeTimer.current)
        clearTimeout(noticeTimer.current); }, []);
    const notify = (message) => { setNotice(''); if (noticeTimer.current)
        clearTimeout(noticeTimer.current); requestAnimationFrame(() => setNotice(message)); noticeTimer.current = setTimeout(() => setNotice(''), 5500); };
    const changeField = (field, value) => setForms(old => ({ ...old, [type]: { ...old[type], [field]: value } }));
    const clearAll = () => { setForms(createEmptyForms()); setDesign(old => ({ ...old, logo: null })); setResult({ key: '', type, qr: null, error: '' }); setClearVersion(x => x + 1); notify('Tüm türlerdeki içerikler ve yüklenen logo temizlendi.'); };
    // Keep the last preview steady while this type updates; export stays disabled until current.
    const qr = valid && result.type === type ? result.qr : null;
    return <><InterfaceMotion /><a className="skip-link" href="#content-panel">İçerik formuna geç</a><header className="site-header"><div className="header-inner"><Brand /><nav aria-label="Ana menü"><a className="nav-active" href="#olustur">Oluştur</a><a href="#nasil-calisir">Nasıl çalışır?</a><a href="#sss">Sık sorulan sorular</a></nav><div className="header-actions"><span className="free-label">Her zaman ücretsiz</span><ThemeToggle /></div></div></header><main className="page-container" id="olustur"><section className="intro"><BrandMotion /><div className="eyebrow"><span className="eyebrow-square"/>KÜÇÜK BİR KARE, BÜYÜK OLASILIKLAR</div><h1>Bir kare. <span>Binlerce bağlantı.</span></h1><p className="intro-description">Linklerini, Wi-Fi bilgilerini ve iletişim kartını saniyeler içinde QR koda dönüştür.</p><div className="benefits"><span><Check />Ücretsiz</span><i /><span>Üyelik gerektirmez</span><i /><span><ShieldCheck />Tarayıcıda oluşturulur</span></div></section><div className="workspace"><section className="panel content-panel" aria-labelledby="content-heading"><div className="section-heading"><div className="section-title"><span className="step-number">01</span><h2 id="content-heading">Ne paylaşmak istersin?</h2></div><span className="section-helper">Bir tür seç, içeriğini ekle.</span></div><TypeSelector value={type} onChange={setType}/><div className="form-section"><ContentForm key={`${type}-${clearVersion}`} type={type} fields={active} errors={validation.errors} suggestion={validation.suggestion} onChange={changeField}/>{type === 'url' && validation.empty && <button className="example-link" onClick={() => changeField('url', 'https://example.com')}><Sparkles size={14}/>Örnek bağlantıyla dene<ArrowUpRight size={13}/></button>}<div className="form-bottom"><span><ShieldCheck size={14}/>Yalnızca bu oturumda saklanır</span><button className="text-button" onClick={clearAll}><Trash2 size={14}/>Formu temizle</button></div></div></section><Preview qr={qr} design={design} type={type} busy={busy} error={result.key === key ? result.error : ''} onSize={size => setDesign(old => ({ ...old, size }))} notify={notify}/><DesignControls key={clearVersion} design={design} onChange={patch => setDesign(old => ({ ...old, ...patch }))} onReset={() => { setDesign({ ...defaultDesign }); notify('Tasarım başlangıç ayarlarına döndürüldü.'); }} notify={notify}/></div><Information /></main><footer className="site-footer"><div className="footer-inner"><div><Brand footer/><p>Bağlantını kareye dönüştür.</p></div><span>Az şeyle, çok şey paylaş.</span><a href="#gizlilik">Gizlilik hakkında <ArrowUpRight size={14}/></a></div></footer><div className={`toast ${notice ? 'visible' : ''}`} role="status" aria-live="polite" aria-atomic="true">{notice && <><Check size={17}/><span>{notice}</span></>}</div></>;
}
