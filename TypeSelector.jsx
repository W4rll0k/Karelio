import { useRef } from 'react';
import { ContactRound, Link2, Mail, MessageSquare, Phone, Text, Wifi } from 'lucide-react';
export const typeOptions = [
    { value: 'url', label: 'Bağlantı', Icon: Link2 },
    { value: 'text', label: 'Metin', Icon: Text },
    { value: 'wifi', label: 'Wi-Fi', Icon: Wifi },
    { value: 'vcard', label: 'Kişi kartı', Icon: ContactRound },
    { value: 'email', label: 'E-posta', Icon: Mail },
    { value: 'sms', label: 'SMS', Icon: MessageSquare },
    { value: 'phone', label: 'Telefon', Icon: Phone },
];
export default function TypeSelector({ value, onChange }) {
    const buttons = useRef([]);
    function navigate(event, index) {
        let next;
        switch (event.key) {
            case 'ArrowRight':
                next = (index + 1) % typeOptions.length;
                break;
            case 'ArrowLeft':
                next = (index - 1 + typeOptions.length) % typeOptions.length;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = typeOptions.length - 1;
                break;
            default: return;
        }
        event.preventDefault();
        onChange(typeOptions[next].value);
        buttons.current[next]?.focus();
    }
    return (<div className="type-selector">
      <div className="type-tabs" role="tablist" aria-label="QR kod türü" aria-orientation="horizontal">
        {typeOptions.map(({ value: type, label, Icon }, index) => (<button key={type} ref={(element) => { buttons.current[index] = element; }} className={`type-tab${value === type ? ' is-active' : ''}`} type="button" id={`type-${type}`} role="tab" aria-selected={value === type} aria-controls="content-panel" tabIndex={value === type ? 0 : -1} onClick={() => onChange(type)} onKeyDown={(event) => navigate(event, index)}>
            <Icon size={21} strokeWidth={1.8} aria-hidden="true"/>
            <span className="type-tab-label">{label}</span>
          </button>))}
      </div>
    </div>);
}
