import { describe, expect, it } from 'vitest';
import { buildPayload, createEmptyForms } from './payload';
describe('empty forms and validation', () => {
    it('has a genuine empty state for every QR type', () => {
        const forms = createEmptyForms();
        for (const type of Object.keys(forms)) {
            expect(buildPayload(type, forms[type])).toEqual({ payload: '', errors: {}, empty: true });
        }
    });
    it('creates independent form state without shared sensitive values', () => {
        const a = createEmptyForms();
        const b = createEmptyForms();
        a.wifi.password = 'private';
        expect(b.wifi.password).toBe('');
    });
    it('retains all user text including Turkish, Unicode and logical lines', () => {
        const text = '  İyi günler, Çığ ÖŞÜ!\nİkinci satır 😀\r\nÜçüncü satır  ';
        expect(buildPayload('text', { text }).payload).toBe(text);
        expect(buildPayload('text', { text: ' \n\t ' }).errors.text).toBeTruthy();
    });
    it('reports malformed Unicode rather than throwing in URI encoding', () => {
        expect(buildPayload('sms', { phone: '+905551234567', message: '\ud800' }).errors.message).toBeTruthy();
    });
    it('does not arbitrarily truncate long text before the QR encoder capacity check', () => {
        const text = 'Çok uzun metin '.repeat(1000);
        expect(buildPayload('text', { text }).payload).toBe(text);
    });
});
describe('URL payloads', () => {
    it('preserves the exact valid URL', () => {
        const url = 'https://örnek.com/İletişim?x=1&y=%20#Başlık';
        expect(buildPayload('url', { url }).payload).toBe(url);
    });
    it('offers protocol addition explicitly and never modifies form fields', () => {
        const fields = Object.freeze({ url: 'example.com/ürün?q=a%20b' });
        const result = buildPayload('url', fields);
        expect(result.payload).toBe('');
        expect(result.suggestion).toBe('https://example.com/ürün?q=a%20b');
        expect(result.errors.url).toBeTruthy();
        expect(fields.url).toBe('example.com/ürün?q=a%20b');
    });
    it('accepts protocol-less host:port as an explicit suggestion', () => {
        expect(buildPayload('url', { url: 'localhost:8080/qr' }).suggestion).toBe('https://localhost:8080/qr');
    });
    it.each(['javascript:alert(1)', 'ftp://example.com', 'https:/example.com', 'https://', '/relative', ' https://example.com', 'https://example.com/a b', 'https://example.com\\evil'])('rejects invalid URL %s without repairs', (url) => {
        const result = buildPayload('url', { url });
        expect(result.payload).toBe('');
        expect(result.errors.url).toBeTruthy();
        expect(result.suggestion).toBeUndefined();
    });
});
describe('Wi-Fi encoding', () => {
    it('escapes every delimiter and retains hidden-network configuration', () => {
        const fields = Object.freeze({ ssid: 'Ev;A:B,C"\\Ç', password: 'p;:q,"\\ş', security: 'WPA', hidden: true });
        const result = buildPayload('wifi', fields);
        expect(result.errors).toEqual({});
        expect(result.payload).toBe('WIFI:T:WPA;S:Ev\\;A\\:B\\,C\\"\\\\Ç;P:p\\;\\:q\\,\\"\\\\ş;H:true;;');
        expect(fields.password).toBe('p;:q,"\\ş');
    });
    it('omits a retained password from an open network', () => {
        const result = buildPayload('wifi', { ssid: 'Misafir', password: 'secret', security: 'nopass', hidden: false });
        expect(result.payload).toBe('WIFI:T:nopass;S:Misafir;H:false;;');
        expect(result.payload).not.toContain('secret');
    });
    it('requires SSID and a password for a secured network', () => {
        expect(buildPayload('wifi', { ssid: 'Ev', password: '', security: 'WPA' }).errors.password).toBeTruthy();
        expect(buildPayload('wifi', { ssid: '', password: 'secret', security: 'WEP' }).errors.ssid).toBeTruthy();
        expect(buildPayload('wifi', { ssid: 'Ev', password: 'secret', security: 'unexpected' }).errors.security).toBeTruthy();
    });
    it('counts SSID UTF-8 bytes and rejects controls', () => {
        expect(buildPayload('wifi', { ssid: 'ü'.repeat(16), security: 'nopass' }).errors).toEqual({});
        expect(buildPayload('wifi', { ssid: 'ü'.repeat(17), security: 'nopass' }).errors.ssid).toBeTruthy();
        expect(buildPayload('wifi', { ssid: 'a\nb', security: 'nopass' }).errors.ssid).toBeTruthy();
    });
});
describe('vCard 3.0', () => {
    it('produces a contact card with CRLF boundaries and encoded name components', () => {
        const result = buildPayload('vcard', {
            firstName: 'Çağrı', lastName: 'Öztürk', phone: '+90 (555) 123-45-67',
            email: 'cagri@example.com', company: 'Karelio, Tasarım; Ar-Ge', website: 'https://example.com',
        });
        expect(result.errors).toEqual({});
        expect(result.payload).toBe([
            'BEGIN:VCARD', 'VERSION:3.0', 'N:Öztürk;Çağrı;;;', 'FN:Çağrı Öztürk',
            'TEL;TYPE=CELL:+905551234567', 'EMAIL;TYPE=INTERNET:cagri@example.com',
            'ORG:Karelio\\, Tasarım\\; Ar-Ge', 'URL:https://example.com', 'END:VCARD', '',
        ].join('\r\n'));
    });
    it('escapes newlines and backslashes instead of permitting property injection', () => {
        const result = buildPayload('vcard', { firstName: 'Ada\r\nTEL:+1900', lastName: 'A;B,C\\D', company: 'İlk\rİkinci\nÜçüncü' });
        expect(result.payload).toContain('N:A\\;B\\,C\\\\D;Ada\\nTEL:+1900;;;\r\n');
        expect(result.payload).toContain('ORG:İlk\\nİkinci\\nÜçüncü\r\n');
        expect(result.payload.split('\r\n').filter((line) => line.startsWith('TEL:'))).toHaveLength(0);
    });
    it('folds by UTF-8 bytes, keeps Unicode intact and unfolds losslessly', () => {
        const company = 'İstanbul😀;\\,'.repeat(30);
        const result = buildPayload('vcard', { firstName: 'Özge', company });
        const lines = result.payload.split('\r\n');
        expect(lines.every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
        expect(lines.some((line) => line.startsWith(' '))).toBe(true);
        const unfolded = result.payload.replace(/\r\n /g, '');
        expect(unfolded).toContain(`ORG:${'İstanbul😀\\;\\\\\\,'.repeat(30)}\r\n`);
        expect(unfolded).not.toContain('\ufffd');
    });
    it('requires a name and checks optional contact fields', () => {
        expect(buildPayload('vcard', { company: 'Karelio' }).errors.firstName).toBeTruthy();
        const result = buildPayload('vcard', { lastName: 'Öz', phone: 'wrong', email: 'wrong', website: 'example.com' });
        expect(Object.keys(result.errors).sort()).toEqual(['email', 'phone', 'website']);
        expect(result.suggestion).toBe('https://example.com');
        expect(result.payload).toBe('');
        expect(buildPayload('vcard', { firstName: 'Ada', company: 'A\u0000B' }).errors.company).toBeTruthy();
    });
});
describe('email, SMS and phone', () => {
    it('encodes Turkish subjects and multiline mail bodies without injecting headers', () => {
        const result = buildPayload('email', { recipient: 'ada+qr@example.com', subject: 'İş & görüşme?', message: 'Merhaba,\nNasılsın? &bcc=evil@example.com' });
        expect(result.payload).toBe('mailto:ada%2Bqr@example.com?subject=%C4%B0%C5%9F%20%26%20g%C3%B6r%C3%BC%C5%9Fme%3F&body=Merhaba%2C%0D%0ANas%C4%B1ls%C4%B1n%3F%20%26bcc%3Devil%40example.com');
        expect(new URL(result.payload).searchParams.get('body')).toBe('Merhaba,\r\nNasılsın? &bcc=evil@example.com');
        expect(new URL(result.payload).searchParams.has('bcc')).toBe(false);
    });
    it('rejects missing recipients and newline injection in subject or recipient', () => {
        expect(buildPayload('email', { recipient: '', subject: 'Hi' }).errors.recipient).toBeTruthy();
        expect(buildPayload('email', { recipient: 'ada@example.com\r\nBcc:evil@example.com' }).errors.recipient).toBeTruthy();
        expect(buildPayload('email', { recipient: 'ada@example.com', subject: 'Hi\r\nBcc:evil@example.com' }).errors.subject).toBeTruthy();
    });
    it.each(['.ada@example.com', 'ada.@example.com', 'a:b@example.com', 'ada@-example.com', 'ada@example.com/path', 'ada@example.com:80'])('rejects malformed mailbox %s', (recipient) => {
        expect(buildPayload('email', { recipient }).errors.recipient).toBeTruthy();
    });
    it('preserves international email characters through URI percent encoding', () => {
        const recipient = 'çağrı@örnek.com';
        const result = buildPayload('email', { recipient });
        expect(result.errors).toEqual({});
        expect(decodeURIComponent(result.payload)).toBe(`mailto:${recipient}`);
    });
    it('encodes SMS reserved characters and UTF-8 while preserving message lines', () => {
        const message = "İyi günler!\nNasılsın? &x='evet'";
        const result = buildPayload('sms', { phone: '+90 (555) 123-45-67', message });
        expect(result.payload.startsWith('sms:+905551234567?body=')).toBe(true);
        expect(result.payload).toContain('%21%0A');
        expect(new URL(result.payload).searchParams.get('body')).toBe(message);
        expect(new URL(result.payload).searchParams.has('x')).toBe(false);
    });
    it('uses the entered country code and only removes visual phone formatting', () => {
        const fields = Object.freeze({ phone: '+90 (555) 123.45-67' });
        expect(buildPayload('phone', fields).payload).toBe('tel:+905551234567');
        expect(fields.phone).toBe('+90 (555) 123.45-67');
        expect(buildPayload('sms', { phone: '+15551234567', message: '' }).payload).toBe('sms:+15551234567');
    });
    it.each(['12', 'abc', '+90;ext=123', '+90\n5551234567', '++905551234567'])('rejects invalid phone %s', (phone) => {
        expect(buildPayload('phone', { phone }).errors.phone).toBeTruthy();
        expect(buildPayload('sms', { phone, message: 'Hi' }).payload).toBe('');
    });
});
