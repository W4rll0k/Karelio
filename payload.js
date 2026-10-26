export function createEmptyForms() {
    return {
        url: { url: '' },
        text: { text: '' },
        wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
        vcard: { firstName: '', lastName: '', phone: '', email: '', company: '', website: '' },
        email: { recipient: '', subject: '', message: '' },
        sms: { phone: '', message: '' },
        phone: { phone: '' },
    };
}
const contentFields = {
    url: ['url'],
    text: ['text'],
    wifi: ['ssid', 'password'],
    vcard: ['firstName', 'lastName', 'phone', 'email', 'company', 'website'],
    email: ['recipient', 'subject', 'message'],
    sms: ['phone', 'message'],
    phone: ['phone'],
};
const utf8 = new TextEncoder();
function hasUnpairedSurrogate(value) {
    for (let i = 0; i < value.length; i++) {
        const code = value.charCodeAt(i);
        if (code >= 0xd800 && code <= 0xdbff) {
            const next = value.charCodeAt(++i);
            if (!(next >= 0xdc00 && next <= 0xdfff))
                return true;
        }
        else if (code >= 0xdc00 && code <= 0xdfff) {
            return true;
        }
    }
    return false;
}
function isHttpUrl(value) {
    // URL() alone silently repairs whitespace, backslashes and missing slashes.
    if (!/^https?:\/\/[^/]/i.test(value) || /[\s\\\u0000-\u001f\u007f]/u.test(value))
        return false;
    try {
        const parsed = new URL(value);
        return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
    }
    catch {
        return false;
    }
}
function checkUrl(value) {
    if (!value)
        return { error: 'Web adresini girin.' };
    if (value !== value.trim())
        return { error: 'Adresin başındaki ve sonundaki boşlukları kaldırın.' };
    if (/[\s\\\u0000-\u001f\u007f]/u.test(value)) {
        return { error: 'Adres boşluk, satır sonu veya ters eğik çizgi içeremez.' };
    }
    if (isHttpUrl(value))
        return {};
    // A hostname with a port is not a URI scheme. Never suggest rewriting a
    // different scheme (such as ftp:, javascript: or mailto:) into an HTTPS URL.
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(value) && !/^[^:/]+:\d+(?:[/?#]|$)/.test(value);
    const suggestion = `https://${value}`;
    if (!hasScheme && !value.startsWith('/') && isHttpUrl(suggestion)) {
        return { error: 'Adresin başına https:// veya http:// ekleyin.', suggestion };
    }
    return { error: 'Geçerli bir http:// veya https:// adresi girin.' };
}
function validEmail(value) {
    // One unquoted mailbox, including international letters. Reject header
    // delimiters, invalid dot-atoms and URL-like domains without rewriting them.
    const parts = value.split('@');
    if (parts.length !== 2 || utf8.encode(value).length > 254)
        return false;
    const [local, domain] = parts;
    if (!local || !domain || utf8.encode(local).length > 64)
        return false;
    if (!/^[\p{L}\p{N}.!#$%&'*+/=?^_`{|}~-]+$/u.test(local))
        return false;
    if (local.startsWith('.') || local.endsWith('.') || local.includes('..'))
        return false;
    const labels = domain.split('.');
    if (labels.length < 2 || labels.some((label) => !/^[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?$/u.test(label)))
        return false;
    try {
        // Check IDNA label lengths as ASCII, but retain the original field value.
        return new URL(`https://${domain}`).hostname.split('.').every((label) => label.length <= 63);
    }
    catch {
        return false;
    }
}
function validPhone(value) {
    const digits = value.replace(/\D/g, '');
    return /^\+?[\d ().-]+$/.test(value) && digits.length >= 3 && digits.length <= 20;
}
// The form explains this formatting explicitly. The supplied fields themselves
// are never changed, and no country code is inferred or inserted.
function phoneForUri(value) {
    return value.replace(/[ ().-]/g, '');
}
function escapeWifi(value) {
    return value.replace(/[\\;:,"]/g, '\\$&');
}
function escapeVcard(value) {
    return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}
function foldVcardLine(line) {
    const parts = [];
    let current = '';
    let byteLength = 0;
    // Iterate complete Unicode code points so a fold never splits a UTF-8
    // character. Include the continuation space in the 75-byte line budget.
    for (const char of line) {
        const charLength = utf8.encode(char).length;
        if (byteLength + charLength > 75) {
            parts.push(current);
            current = ' ';
            byteLength = 1;
        }
        current += char;
        byteLength += charLength;
    }
    parts.push(current);
    return parts.join('\r\n');
}
function encodeQuery(value) {
    // RFC 3986: encodeURIComponent leaves these reserved characters unescaped.
    return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}
export function buildPayload(type, fields) {
    const read = (key) => typeof fields[key] === 'string' ? fields[key] : '';
    const errors = {};
    const empty = contentFields[type].every((key) => read(key) === '');
    if (empty)
        return { payload: '', errors, empty: true };
    for (const key of contentFields[type]) {
        if (hasUnpairedSurrogate(read(key)))
            errors[key] = 'Bu alanda geçersiz bir karakter var. Lütfen yeniden yazın.';
    }
    if (Object.keys(errors).length)
        return { payload: '', errors, empty: false };
    let payload = '';
    let suggestion;
    switch (type) {
        case 'url': {
            const validation = checkUrl(read('url'));
            if (validation.error)
                errors.url = validation.error;
            suggestion = validation.suggestion;
            payload = read('url');
            break;
        }
        case 'text': {
            if (!read('text').trim())
                errors.text = 'QR kod için en az bir görünür karakter girin.';
            payload = read('text');
            break;
        }
        case 'wifi': {
            const ssid = read('ssid');
            const password = read('password');
            const security = read('security');
            if (!ssid)
                errors.ssid = 'Ağ adını girin.';
            else if (utf8.encode(ssid).length > 32)
                errors.ssid = 'Ağ adı UTF-8 biçiminde en fazla 32 bayt olabilir; Türkçe harfler birden fazla bayt kullanabilir.';
            else if (/[\u0000-\u001f\u007f]/.test(ssid))
                errors.ssid = 'Ağ adında satır sonu veya kontrol karakteri kullanmayın.';
            if (!['WPA', 'WEP', 'nopass'].includes(security))
                errors.security = 'Desteklenen bir güvenlik türü seçin.';
            if (security !== 'nopass' && !password)
                errors.password = 'Şifreli ağ için Wi-Fi şifresini girin.';
            else if (security !== 'nopass' && /[\u0000-\u001f\u007f]/.test(password))
                errors.password = 'Şifrede satır sonu veya kontrol karakteri kullanmayın.';
            const passwordPart = security === 'nopass' ? '' : `P:${escapeWifi(password)};`;
            payload = `WIFI:T:${security};S:${escapeWifi(ssid)};${passwordPart}H:${fields.hidden === true};`;
            // The format ends in a second semicolon, including when no password exists.
            payload += ';';
            break;
        }
        case 'vcard': {
            const first = read('firstName');
            const last = read('lastName');
            if (!first.trim() && !last.trim())
                errors.firstName = 'En az bir ad veya soyad girin.';
            for (const key of ['firstName', 'lastName', 'company']) {
                if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(read(key)))
                    errors[key] = 'Bu alanda kontrol karakteri kullanmayın.';
            }
            if (read('phone') && !validPhone(read('phone')))
                errors.phone = 'Geçerli bir telefon numarası girin; örnek: +90 555 123 45 67.';
            if (read('email') && !validEmail(read('email')))
                errors.email = 'Geçerli bir e-posta adresi girin.';
            if (read('website')) {
                const validation = checkUrl(read('website'));
                if (validation.error)
                    errors.website = validation.error;
                suggestion = validation.suggestion;
            }
            const fullName = [first, last].filter((name) => name !== '').join(' ');
            const lines = [
                'BEGIN:VCARD',
                'VERSION:3.0',
                `N:${escapeVcard(last)};${escapeVcard(first)};;;`,
                `FN:${escapeVcard(fullName)}`,
            ];
            if (read('phone'))
                lines.push(`TEL;TYPE=CELL:${phoneForUri(read('phone'))}`);
            if (read('email'))
                lines.push(`EMAIL;TYPE=INTERNET:${escapeVcard(read('email'))}`);
            if (read('company'))
                lines.push(`ORG:${escapeVcard(read('company'))}`);
            if (read('website'))
                lines.push(`URL:${read('website')}`);
            lines.push('END:VCARD');
            payload = `${lines.map(foldVcardLine).join('\r\n')}\r\n`;
            break;
        }
        case 'email': {
            if (!read('recipient'))
                errors.recipient = 'Alıcının e-posta adresini girin.';
            else if (!validEmail(read('recipient')))
                errors.recipient = 'Tek bir geçerli e-posta adresi girin.';
            if (/[\r\n\u0000-\u001f\u007f]/.test(read('subject')))
                errors.subject = 'Konu tek satır olmalı ve kontrol karakteri içermemeli.';
            const query = [];
            if (read('subject'))
                query.push(`subject=${encodeQuery(read('subject'))}`);
            // RFC 6068 represents message line breaks as CRLF. This preserves the
            // user's logical lines while using the mail format's line separator.
            if (read('message'))
                query.push(`body=${encodeQuery(read('message').replace(/\r\n|\r|\n/g, '\r\n'))}`);
            payload = `mailto:${encodeQuery(read('recipient')).replace(/%40/g, '@')}${query.length ? `?${query.join('&')}` : ''}`;
            break;
        }
        case 'sms': {
            if (!read('phone'))
                errors.phone = 'Mesajın gönderileceği numarayı girin.';
            else if (!validPhone(read('phone')))
                errors.phone = 'Geçerli bir telefon numarası girin; örnek: +90 555 123 45 67.';
            payload = `sms:${phoneForUri(read('phone'))}${read('message') ? `?body=${encodeQuery(read('message'))}` : ''}`;
            break;
        }
        case 'phone': {
            if (!validPhone(read('phone')))
                errors.phone = 'Geçerli bir telefon numarası girin; örnek: +90 555 123 45 67.';
            payload = `tel:${phoneForUri(read('phone'))}`;
            break;
        }
    }
    return { payload: Object.keys(errors).length ? '' : payload, errors, empty: false, ...(suggestion ? { suggestion } : {}) };
}
