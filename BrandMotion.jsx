import { useEffect, useRef } from 'react';
import './brand-motion.css';
// An abstract Karelio mark, separate from the user's scannable QR preview.
const tiles = [
    { x: 39, y: 30, dx: -28, dy: -15, ring: true },
    { x: 111, y: 30, dx: 32, dy: -22, ring: true },
    { x: 39, y: 102, dx: -22, dy: 27, ring: true },
    { x: 108, y: 99, dx: 38, dy: 18 },
    { x: 132, y: 99, dx: 37, dy: -12 },
    { x: 108, y: 123, dx: -12, dy: 39 },
    { x: 132, y: 123, dx: 25, dy: 36 },
];
export default function BrandMotion() {
    const ref = useRef(null);
    useEffect(() => {
        const element = ref.current;
        if (!element)
            return;
        let visible = true;
        const sync = () => { element.dataset.running = String(visible && !document.hidden); };
        const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
        observer.observe(element);
        document.addEventListener('visibilitychange', sync);
        sync();
        return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
    }, []);
    return <div ref={ref} className="brand-motion" aria-hidden="true">
    <div className="brand-motion-plane"/>
    {tiles.map((tile, index) => <span key={index} className={`brand-motion-tile ${tile.ring ? 'is-ring' : ''}`} style={{ left: tile.x, top: tile.y, '--tile-x': `${tile.dx}px`, '--tile-y': `${tile.dy}px`, '--tile-delay': `${index * 75}ms` }}/>)}
    <span className="brand-motion-caption">BAĞLAN. KARELE. PAYLAŞ.</span>
  </div>;
}
