import fs from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';

/**
 * Enquiry endpoint for every form on the site (contact, request BIM professionals, book a
 * consultation, careers). Same behaviour as the WordPress theme:
 *  - validation (name, valid email, a few details), honeypot and per-connection rate limit
 *  - every enquiry is saved to data/enquiries.jsonl, so nothing is lost if email fails
 *  - emailed with Reply-To set to the sender when SMTP is configured (.env.local: SMTP_HOST,
 *    SMTP_PORT, SMTP_USER, SMTP_PASS, ENQUIRY_TO, ENQUIRY_FROM)
 * JavaScript forms get JSON; forms posted without JavaScript are redirected back with ?enquiry=sent.
 */
export const runtime = 'nodejs';

const LABELS: Record<string, string> = {
  country: 'Country / city', discipline: 'Discipline', quantity: 'Number of professionals', mode: 'Onsite / remote', experience: 'Experience',
  software: 'Software', duration: 'Duration', timeline: 'Mobilization timeline', position: 'Position', notice: 'Availability', cv: 'CV / portfolio',
  topic: 'Consultation topic', date: 'Preferred date', time: 'Preferred time', format: 'Meeting format',
};
const hits = new Map<string, { n: number; t: number }>();

function reply(req: Request, ok: boolean, message: string, errors: string[] = []) {
  const type = req.headers.get('content-type') || '';
  if (type.includes('application/x-www-form-urlencoded')) {
    const back = new URL(req.headers.get('referer') || '/contact/', req.url);
    back.searchParams.set('enquiry', ok ? 'sent' : 'error');
    back.hash = 'qform';
    return Response.redirect(back.toString(), 303);
  }
  return Response.json({ ok, message, errors }, { status: ok ? 200 : 422 });
}

export async function POST(req: Request) {
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return Response.json({ ok: false, message: 'Invalid request.' }, { status: 400 });
  }
  const get = (k: string) => String(fd.get(k) ?? '').trim().slice(0, 5000);
  const kind = ['requirement', 'application', 'consultation'].includes(get('kind')) ? get('kind') : 'contact';

  // spam: bots fill the hidden "website" field; answer as if it worked so they learn nothing
  if (get('website')) return reply(req, true, 'Thank you. Your enquiry has been sent.');

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  const now = Date.now();
  const h = hits.get(ip);
  const n = h && now - h.t < 10 * 60 * 1000 ? h.n : 0;
  if (n >= 5) return reply(req, false, 'Too many enquiries from this connection. Please email us directly.');

  const f = { name: get('name'), company: get('company'), email: get('email'), phone: get('phone'), service: get('service'), msg: get('msg') };
  const errors: string[] = [];
  if (!f.name) errors.push('name');
  if (!/^\S+@\S+\.\S+$/.test(f.email)) errors.push('email');
  if (f.msg.length < 5) errors.push('msg');
  if (errors.length) return reply(req, false, 'Please add your name, a valid email and a few project details.', errors);
  hits.set(ip, { n: n + 1, t: n ? h!.t : now });

  const extra: Record<string, string> = {};
  for (const [k, label] of Object.entries(LABELS)) if (get(k)) extra[label] = get(k);
  if (kind === 'requirement') f.service = `Requirement: ${extra['Discipline'] || ''}${extra['Number of professionals'] ? ' x' + extra['Number of professionals'] : ''}`;
  if (kind === 'application') f.service = `Job application: ${extra['Position'] || ''}${extra['Discipline'] ? ' (' + extra['Discipline'] + ')' : ''}`;
  if (kind === 'consultation') f.service = `Consultation: ${extra['Consultation topic'] || 'General'}`;

  const subject = kind === 'requirement' ? `BIM staffing requirement: ${f.service}` : kind === 'contact' ? `BIM enquiry: ${f.service || 'General'}` : f.service;
  const body = [`Name: ${f.name}`, `Company: ${f.company}`, `Email: ${f.email}`, `Phone: ${f.phone}`, `What they need: ${f.service}`, ...Object.entries(extra).map(([k, v]) => `${k}: ${v}`), '', f.msg, '', `— Sent from ${req.headers.get('referer') || 'the website'}`].join('\n');

  // 1. always stored
  const dir = path.join(process.cwd(), 'data');
  await fs.mkdir(dir, { recursive: true });
  let mailed = false;
  // 2. emailed when SMTP is configured
  if (process.env.SMTP_HOST) {
    try {
      const t = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
      await t.sendMail({ from: process.env.ENQUIRY_FROM || process.env.SMTP_USER, to: process.env.ENQUIRY_TO || 'enquiry@engisoftengineering.com', replyTo: `${f.name} <${f.email}>`, subject, text: body });
      mailed = true;
    } catch (e) {
      console.error('enquiry email failed', e);
    }
  }
  await fs.appendFile(path.join(dir, 'enquiries.jsonl'), JSON.stringify({ at: new Date().toISOString(), kind, ...f, extra, mailed }) + '\n');
  return reply(req, true, 'Thank you. Your enquiry has reached ENGISOFT and we will reply by email.');
}
