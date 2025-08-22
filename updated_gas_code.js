/***********************
 * Coffee/Lunch/残飯 App
 * VERSION: v13
 ***********************/

// ===== CONFIG =====
const VERSION = 'v13';
const USERS_SHEET = 'Users';
const INVITES_SHEET = 'Invites';
const ORGANIZER_EMAIL = '2002kotaro.h@gmail.com'; // <-- set this
const WEBAPP_BASE_URL = 'https://script.google.com/macros/s/AKfycbxa-tqEsUHXEMQGGJ0Nn1_T2xynLJbGV7rr9qFYggVeSRwWKihyQ7pHVdzVi9Qmpfpd/exec';          // <-- set this (/exec)
const ACCEPT_WINDOW_MS = 5 * 60 * 1000;
// ==================

/** POST entrypoint */
function doPost(e) {
  try {
    ensureSheets_();
    const p = parseParams_(e);
    const action = (p.action || '').toLowerCase();

    if (action === 'register') {
      upsertUser_(
        p.email, p.name,
        p.category || 'coffee',
        numOrNull_(p.age),
        String(p.gender || ''),
        yn_(p.open),
        yn_(p.sameSex)
      );
      return json_({ ok: true, message: 'Saved', version: VERSION });
    }

    if (action === 'yap') {
      upsertUser_(
        p.email, p.name,
        p.category || 'coffee',
        numOrNull_(p.age),
        String(p.gender || ''),
        yn_(p.open),
        yn_(p.sameSex)
      );

      const minAge = numOrNull_(p.minAge), maxAge = numOrNull_(p.maxAge);
      const category = p.category || 'coffee';
      const sameSex = !!p.sameSex;
      const userGender = String(p.userGender || '');

      let gmin = numOrNull_(p.groupMin), gmax = numOrNull_(p.groupMax);
      if (category === 'coffee') { gmin = 1; gmax = 1; }
      gmin = clamp_(gmin || 1, 1, 8); gmax = clamp_(gmax || gmin, gmin, 8);

      const openList = getOpenUsers_({
        excludeEmail: p.email,
        category,
        minAge, maxAge,
        sameSexOnly: sameSex,
        userGender
      });

      const from = {
        name: p.name || '',
        email: String(p.email || '').toLowerCase(),
        category, minAge, maxAge,
        sameSex,
        userGender,
        groupMin: gmin, groupMax: gmax
      };

      MailApp.sendEmail({
        to: ORGANIZER_EMAIL,
        bcc: from.email, // mirror to requester
        replyTo: from.email,
        name: 'Coffee/Lunch Match Bot',
        subject: `Ping NOW from ${from.name} (${category}, group ${gmin}–${gmax}) [${VERSION}]`,
        htmlBody: organizerEmailHtml_(from, openList),
        textBody: organizerEmailText_(from, openList)
      });
      return json_({ ok: true, message: 'Sent to organizer', version: VERSION });
    }

    if (action === 'opencounts') {
      const ex = (p.excludeEmail || '').toLowerCase();
      const minAge = numOrNull_(p.minAge), maxAge = numOrNull_(p.maxAge);
      const sameSex = !!p.sameSex;
      const userGender = String(p.userGender || '');
      const data = {
        coffee: openCount_('coffee', ex, minAge, maxAge, sameSex, userGender),
        lunch:  openCount_('lunch',  ex, minAge, maxAge, sameSex, userGender),
        zanpan: openCount_('zanpan', ex, minAge, maxAge, sameSex, userGender),
      };
      return json_({ ok:true, data, version: VERSION });
    }

    // NEW: Get calendar stats for a user and month
    if (action === 'stats') {
      const email = String(p.email || '').toLowerCase();
      const month = p.month; // Expected format: YYYY-MM
      const category = p.category || 'all';
      
      if (!email || !month) {
        return json_({ ok: false, error: 'Missing email or month parameter' });
      }
      
      const [year, monthNum] = month.split('-').map(Number);
      if (!year || !monthNum) {
        return json_({ ok: false, error: 'Invalid month format. Use YYYY-MM' });
      }
      
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0); // Last day of month
      
      const stats = buildStats_(email, category, startDate, endDate);
      return json_({ ok: true, data: stats, version: VERSION });
    }

    // NEW: Get acceptance history for calendar highlighting
    if (action === 'getacceptancehistory') {
      const email = String(p.email || '').toLowerCase();
      if (!email) {
        return json_({ ok: false, error: 'Missing email parameter' });
      }
      
      const acceptedDates = getAcceptanceHistory_(email);
      return json_({ ok: true, data: acceptedDates, version: VERSION });
    }

    // NEW: Auto-match functionality
    if (action === 'automatch') {
      const email = String(p.email || '').toLowerCase();
      const name = p.name || '';
      const category = p.category || 'coffee';
      const minAge = numOrNull_(p.minAge);
      const maxAge = numOrNull_(p.maxAge);
      const sameSex = !!p.sameSex;
      const userGender = String(p.userGender || '');
      let groupMin = numOrNull_(p.groupMin) || 1;
      let groupMax = numOrNull_(p.groupMax) || 1;
      
      if (category === 'coffee') {
        groupMin = 1;
        groupMax = 1;
      }
      
      // Get available users
      const openList = getOpenUsers_({
        excludeEmail: email,
        category,
        minAge,
        maxAge,
        sameSexOnly: sameSex,
        userGender
      });
      
      if (openList.length === 0) {
        return json_({ ok: false, error: 'No available matches found' });
      }
      
      // Auto-select random users up to group size
      const numToSelect = Math.min(groupMax, openList.length);
      const shuffled = openList.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, numToSelect);
      
      // Send invitations automatically
      let invitesSent = 0;
      for (const user of selected) {
        try {
          const inv = createInvite_(category, name, email, user.name, user.email);
          sendInviteEmail_(inv);
          invitesSent++;
        } catch (error) {
          console.error('Failed to send invite to', user.email, error);
        }
      }
      
      const message = `Auto-match complete! Sent ${invitesSent} invitation${invitesSent !== 1 ? 's' : ''} for ${category}.`;
      return json_({ ok: true, message, version: VERSION });
    }

    if (action === 'accept') {
      const inviteId = p.inviteId, token = p.token;
      if (!inviteId || !token) return json_({ ok:false, error:'Missing invite id/token' }, 400);

      const { rowIndex, row } = findInvite_(inviteId);
      if (!rowIndex) return json_({ ok:false, error:'Invite not found' }, 404);

      const now = new Date();
      const status = row[7];              // status
      const storedToken = row[1];         // token
      const expiresAt = new Date(row[9]); // expiresAt
      const fromName = row[3], fromEmail = row[4], toName = row[5], toEmail = row[6];

      if (token !== storedToken) return json_({ ok:false, error:'Invalid token' }, 403);
      if (status !== 'pending')  return json_({ ok:false, error:'Already processed' }, 409);
      if (now.getTime() > expiresAt.getTime()) {
        setInviteStatus_(rowIndex, 'expired', null);
        return json_({ ok:false, error:'Expired' }, 410);
      }

      setInviteStatus_(rowIndex, 'accepted', now);
      MailApp.sendEmail({
        to: fromEmail,
        subject: `✅ ${toName} accepted your invite`,
        htmlBody: `<p>Good news! <b>${esc_(toName)}</b> &lt;${esc_(toEmail)}&gt; accepted your invite.</p>`
      });
      return json_({ ok:true, message:'Accepted' });
    }

    return json_({ ok: false, error: 'Unknown action', version: VERSION });
  } catch (err) {
    return json_({ ok: false, error: String(err), version: VERSION });
  }
}

/** GET entrypoint */
function doGet(e) {
  try {
    ensureSheets_();
    const action = (e.parameter.action || '').toLowerCase();

    if (action === 'version') return htmlPage_('Version', `<p>Running <b>${VERSION}</b></p>`);

    if (action === 'choose') {
      const fromEmail = e.parameter.fromEmail, fromName = e.parameter.fromName;
      const toEmail = e.parameter.toEmail, toName = e.parameter.toName;
      const category = e.parameter.category || 'coffee';
      if (!fromEmail || !toEmail) return htmlPage_('Error', '<p>Missing parameters.</p>');
      const inv = createInvite_(category, fromName, fromEmail, toName, toEmail);
      sendInviteEmail_(inv);
      return htmlPage_('Invitation sent',
        `<p>[${esc_(category)}] Invited <b>${esc_(toName)}</b> &lt;${esc_(toEmail)}&gt; on behalf of <b>${esc_(fromName)}</b>.</p>
         <p>Invite ID: ${inv.inviteId}<br>Expires: ${inv.expiresAt}</p>`);
    }

    // GET /accept -> confirmation form
    if (action === 'accept') {
      const inviteId = e.parameter.inviteId, token = e.parameter.token;
      if (!inviteId || !token) return htmlPage_('Error', '<p>Missing invite id or token.</p>');
      const { rowIndex, row } = findInvite_(inviteId);
      if (!rowIndex) return htmlPage_('Error', '<p>Invite not found.</p>');

      const now = new Date();
      const status = row[7];
      const expiresAt = new Date(row[9]);
      const toName = row[5], toEmail = row[6];

      if (status !== 'pending') return htmlPage_('Already processed', `<p>Status: ${esc_(status)}.</p>`);
      if (now.getTime() > expiresAt.getTime()) return htmlPage_('Expired', '<p>Sorry, this invite has expired.</p>');

      return acceptConfirmPage_(row[0], row[1], toName, toEmail);
    }

    return htmlPage_('Error', '<p>Unknown action.</p>');
  } catch (err) {
    return htmlPage_('Error', `<pre>${esc_(String(err))}</pre>`);
  }
}

// ---------- Helpers ----------
function parseParams_(e) {
  try { if (e.postData && e.postData.contents) return JSON.parse(e.postData.contents); } catch (_) {}
  return Object.assign({}, e.parameter || {});
}
function yn_(b){ return b ? 'yes' : 'no'; }
function numOrNull_(x){ const n = Number(x); return Number.isFinite(n) ? n : null; }
function clamp_(n,lo,hi){ n=Number(n); if(!isFinite(n)) n=lo; return Math.max(lo, Math.min(hi, n)); }
function ymd_(d){
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function ensureSheets_() {
  const ss = SpreadsheetApp.getActive();

  // Users schema:
  // email | name | category | age | gender | open | sameSexOnly | updatedAt
  let us = ss.getSheetByName(USERS_SHEET);
  if (!us) {
    us = ss.insertSheet(USERS_SHEET);
    us.getRange(1,1,1,8).setValues([['email','name','category','age','gender','open','sameSexOnly','updatedAt']]);
  } else {
    const want = ['email','name','category','age','gender','open','sameSexOnly','updatedAt'];
    const hdr = us.getRange(1,1,1,Math.max(8, us.getLastColumn())).getValues()[0];
    for (let i=0;i<want.length;i++) if (hdr[i] !== want[i]) us.getRange(1,i+1).setValue(want[i]);
    migrateUsersSheet_(us);
  }

  // Invites: inviteId | token | category | fromName | fromEmail | toName | toEmail | status | createdAt | expiresAt | acceptedAt
  if (!ss.getSheetByName(INVITES_SHEET)) {
    const ish = ss.insertSheet(INVITES_SHEET);
    ish.getRange(1,1,1,11).setValues([['inviteId','token','category','fromName','fromEmail','toName','toEmail','status','createdAt','expiresAt','acceptedAt']]);
  }
}

// migrate old Users layouts
function migrateUsersSheet_(us){
  const last = us.getLastRow();
  if (last < 2) return;
  const colCount = us.getLastColumn();
  if (colCount >= 8) return;

  const rows = us.getRange(2,1,last-1,colCount).getValues();
  const out = [];
  for (const r of rows) {
    if (colCount === 4) {
      // [email, name, open, updatedAt] -> assume coffee, no age/gender/same
      out.push([r[0], r[1], 'coffee', null, '', r[2], 'no', r[3] || new Date()]);
    } else if (colCount === 6) {
      // [email, name, category, age, open, updatedAt]
      out.push([r[0], r[1], (r[2]||'coffee'), (r[3]||null), '', r[4], 'no', r[5] || new Date()]);
    } else {
      out.push([r[0], r[1], 'coffee', null, '', 'no', 'no', new Date()]);
    }
  }
  us.getRange(2,1,last-1,8).clearContent();
  us.getRange(2,1,out.length,8).setValues(out);
}

function upsertUser_(email, name, category, age, gender, openStr, sameSexOnly) {
  if (!email) throw new Error('email required');
  email = String(email).toLowerCase();
  category = (category||'coffee').toLowerCase();
  const sh = SpreadsheetApp.getActive().getSheetByName(USERS_SHEET);
  const last = sh.getLastRow();
  const rows = last >= 2 ? sh.getRange(2, 1, last - 1, 8).getValues() : [];
  let rowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const e = String(rows[i][0]||'').toLowerCase();
    const c = String(rows[i][2]||'coffee').toLowerCase();
    if (e === email && c === category) { rowIndex = i + 2; break; }
  }
  const now = new Date();
  const aVal = numOrNull_(age);
  const gVal = String(gender || '').toLowerCase();
  const sVal = (sameSexOnly === 'yes' || sameSexOnly === 'no') ? sameSexOnly : yn_(sameSexOnly==='yes' || sameSexOnly===true);
  if (rowIndex === -1) sh.appendRow([email, name || '', category, aVal, gVal, openStr, sVal, now]);
  else sh.getRange(rowIndex, 2, 1, 7).setValues([[name || '', category, aVal, gVal, openStr, sVal, now]]);
}

// IMPROVED: Better counting with deduplication
function getOpenUsers_({ excludeEmail, category, minAge, maxAge, sameSexOnly, userGender }) {
  const sh = SpreadsheetApp.getActive().getSheetByName(USERS_SHEET);
  const last = sh.getLastRow();
  if (last < 2) return [];

  const rows = sh.getRange(2, 1, last - 1, 8).getValues();
  const ex   = String(excludeEmail || '').trim().toLowerCase();
  const cat  = String(category || 'coffee').trim().toLowerCase();
  const wantSame = !!sameSexOnly;
  const uG   = String(userGender || '').trim().toLowerCase();

  // First, collect all users and find the most recent entry per email+category
  const userMap = new Map();
  
  rows.forEach(r => {
    const email = String(r[0] || '').trim().toLowerCase();
    const userCategory = String(r[2] || 'coffee').trim().toLowerCase();
    const updatedAt = r[7] || new Date(0);
    
    if (!email || email === ex || userCategory !== cat) return;
    
    const key = `${email}:${userCategory}`;
    if (!userMap.has(key) || updatedAt > userMap.get(key).updatedAt) {
      userMap.set(key, {
        email,
        name: r[1] || '',
        category: userCategory,
        age: Number(r[3]),
        gender: String(r[4] || '').trim().toLowerCase(),
        open: String(r[5] || '').trim().toLowerCase(),
        updatedAt
      });
    }
  });

  // Now filter the deduplicated users
  return Array.from(userMap.values())
    .filter(r => (r.open === 'yes' || r.open === 'y' || r.open === 'true' || r.open === '1'))
    .filter(r => {
      if (!Number.isFinite(r.age)) return true;
      if (minAge != null && r.age < minAge) return false;
      if (maxAge != null && r.age > maxAge) return false;
      return true;
    })
    .filter(r => {
      if (!wantSame) return true;
      if (!uG) return true;      // requester gender unknown → allow
      if (!r.gender) return true;// candidate unknown → allow
      return r.gender === uG;
    })
    .map(r => ({ email: r.email, name: r.name, age: Number.isFinite(r.age) ? r.age : null, gender: r.gender }));
}

function openCount_(category, excludeEmail, minAge, maxAge, sameSexOnly, userGender){
  return getOpenUsers_({ excludeEmail, category, minAge, maxAge, sameSexOnly, userGender }).length;
}

// NEW: Get acceptance history for calendar highlighting
function getAcceptanceHistory_(userEmail) {
  const sh = SpreadsheetApp.getActive().getSheetByName(INVITES_SHEET);
  const last = sh.getLastRow();
  if (last < 2) return [];
  
  const rows = sh.getRange(2, 1, last - 1, 11).getValues();
  const acceptedDates = [];
  const email = userEmail.toLowerCase();
  
  for (const r of rows) {
    const fromEmail = String(r[4] || '').toLowerCase();
    const toEmail = String(r[6] || '').toLowerCase();
    const status = r[7];
    const acceptedAt = r[10];
    
    if (status === 'accepted' && 
        acceptedAt instanceof Date && 
        (fromEmail === email || toEmail === email)) {
      acceptedDates.push(ymd_(acceptedAt));
    }
  }
  
  // Remove duplicates
  return [...new Set(acceptedDates)];
}

// Invites
function createInvite_(category, fromName, fromEmail, toName, toEmail) {
  const sh = SpreadsheetApp.getActive().getSheetByName(INVITES_SHEET);
  const inviteId = Utilities.getUuid();
  const token = Utilities.getUuid();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + ACCEPT_WINDOW_MS);
  sh.appendRow([inviteId, token, category, fromName || '', String(fromEmail||'').toLowerCase(), toName || '', String(toEmail||'').toLowerCase(), 'pending', createdAt, expiresAt, '']);
  return { inviteId, token, category, fromName, fromEmail, toName, toEmail, expiresAt };
}
function findInvite_(inviteId) {
  const sh = SpreadsheetApp.getActive().getSheetByName(INVITES_SHEET);
  const last = sh.getLastRow();
  if (last < 2) return { rowIndex: null, row: null };
  const values = sh.getRange(2, 1, last - 1, 11).getValues();
  for (let i = 0; i < values.length; i++) if ((values[i][0] || '') === inviteId) return { rowIndex: i + 2, row: values[i] };
  return { rowIndex: null, row: null };
}
function setInviteStatus_(rowIndex, status, acceptedAt) {
  const sh = SpreadsheetApp.getActive().getSheetByName(INVITES_SHEET);
  sh.getRange(rowIndex, 8).setValue(status);
  if (acceptedAt) sh.getRange(rowIndex, 11).setValue(acceptedAt);
}

function sendInviteEmail_(inv) {
  const acceptUrl = buildUrl_({ action: 'accept', inviteId: inv.inviteId, token: inv.token });
  const categoryLabel = {coffee:'Coffee', lunch:'Lunch', zanpan:'残飯'}[inv.category] || inv.category;
  const html = `
    <p>Hi ${esc_(inv.toName || '')},</p>
    <p><b>${esc_(inv.fromName)}</b> &lt;${esc_(inv.fromEmail)}&gt; invites you for <b>${esc_(categoryLabel)}</b> now.</p>
    <p>Link valid for <b>5 minutes</b>:</p>
    <p><a href="${acceptUrl}" style="background:#0b5;color:#fff;padding:10px 14px;text-decoration:none;border-radius:8px;">Accept Invite</a></p>
    <p style="font-size:12px;color:#666">If the button doesn't show, open this link: <a href="${acceptUrl}">${acceptUrl}</a></p>
  `;
  MailApp.sendEmail({ to: inv.toEmail, subject: `Invite for ${categoryLabel} from ${inv.fromName} [${VERSION}]`, htmlBody: html });
}

// Emails to organizer
function organizerEmailHtml_(from, openList) {
  const catLabel = {coffee:'Coffee', lunch:'Lunch', zanpan:'残飯'}[from.category] || from.category;
  const rangeText = (from.minAge!=null && from.maxAge!=null) ? ` (age ${from.minAge}–${from.maxAge})` : '';
  const sameText  = from.sameSex ? ' — same-sex only' : '';
  const gRange    = `Group: ${from.groupMin}–${from.groupMax}`;

  const items = openList.length
    ? openList.map(p => {
        const chooseUrl = buildUrl_({
          action:'choose',
          category: from.category,
          fromEmail: from.email, fromName: from.name,
          toEmail: p.email,     toName:  p.name
        });
        const meta = [p.age?`age ${p.age}`:'', p.gender?`${p.gender}`:''].filter(Boolean).join(', ');
        return `<li>${esc_(p.name || '(no name)')} &lt;${esc_(p.email)}&gt; ${meta?`— ${esc_(meta)}`:''}
          &nbsp;<a href="${chooseUrl}" style="background:#06c;color:#fff;padding:6px 10px;text-decoration:none;border-radius:6px;">Invite</a>
          <div style="font-size:12px;color:#666">Link: <a href="${chooseUrl}">${chooseUrl}</a></div>
        </li>`;
      }).join('')
    : '<li><i>No one matches right now.</i></li>';

  return `
    <p><b>${esc_(from.name)}</b> &lt;${esc_(from.email)}&gt; pinged for <b>${esc_(catLabel)}</b>${esc_(rangeText)}${esc_(sameText)}.</p>
    <p><b>${esc_(gRange)}</b> — (${VERSION})</p>
    <p><b>Eligible candidates (${openList.length}):</b></p>
    <ul>${items}</ul>
    <p>Invite up to the desired group size range.</p>
  `;
}
function organizerEmailText_(from, openList) {
  const catLabel = {coffee:'Coffee', lunch:'Lunch', zanpan:'残飯'}[from.category] || from.category;
  const rangeText = (from.minAge!=null && from.maxAge!=null) ? ` (age ${from.minAge}–${from.maxAge})` : '';
  const sameText  = from.sameSex ? ' — same-sex only' : '';
  const lines = [];
  lines.push(`${from.name} <${from.email}> pinged for ${catLabel}${rangeText}${sameText}, group ${from.groupMin}-${from.groupMax}. [${VERSION}]`);
  if (!openList.length) lines.push('No candidates.');
  else for (const p of openList) {
    const chooseUrl = buildUrl_({
      action:'choose',
      category: from.category,
      fromEmail: from.email, fromName: from.name,
      toEmail: p.email,     toName:  p.name
    });
    lines.push(`- ${p.name || '(no name)'} <${p.email}> ${p.age?`(age ${p.age})`:''} ${p.gender?`[${p.gender}]`:''} INVITE: ${chooseUrl}`);
  }
  return lines.join('\n');
}

// Stats
function buildStats_(userEmail, category, start, end){
  const sh = SpreadsheetApp.getActive().getSheetByName(INVITES_SHEET);
  const last = sh.getLastRow(); const out = {};
  if (last < 2) return out;
  const rows = sh.getRange(2, 1, last-1, 11).getValues();
  for (const r of rows){
    const cat = r[2];
    const fromEmail = String(r[4]||'').toLowerCase();
    const toEmail   = String(r[6]||'').toLowerCase();
    const status = r[7];
    const acceptedAt = r[10];
    if (status !== 'accepted') continue;
    if (!(acceptedAt instanceof Date)) continue;
    if (acceptedAt < start || acceptedAt > end) continue;
    if (fromEmail !== userEmail && toEmail !== userEmail) continue;
    if (category !== 'all' && cat !== category) continue;

    const key = ymd_(acceptedAt);
    if (!out[key]) out[key] = { coffee:0, lunch:0, zanpan:0, total:0 };
    if (cat === 'coffee') out[key].coffee++;
    else if (cat === 'lunch') out[key].lunch++;
    else if (cat === 'zanpan') out[key].zanpan++;
    out[key].total++;
  }
  return out;
}

// Pages / utils
function acceptConfirmPage_(inviteId, token, toName, toEmail) {
  const form = `
    <form method="post" action="${WEBAPP_BASE_URL}">
      <input type="hidden" name="action" value="accept" />
      <input type="hidden" name="inviteId" value="${esc_(inviteId)}" />
      <input type="hidden" name="token" value="${esc_(token)}" />
      <button type="submit" style="background:#0b5;color:white;padding:10px 14px;border:none;border-radius:8px;cursor:pointer">
        Confirm Accept
      </button>
    </form>`;
  return htmlPage_('Confirm acceptance',
    `<p>Hello ${esc_(toName || '')} &lt;${esc_(toEmail)}&gt;.</p>
     <p>Press the button below to <b>accept</b> (valid 5 minutes).</p>
     ${form}`);
}

function buildUrl_(params) {
  const q = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k] == null ? '' : params[k])).join('&');
  return WEBAPP_BASE_URL + (WEBAPP_BASE_URL.indexOf('?') === -1 ? '?' : '&') + q;
}

function esc_(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// JSON helper (no setResponseCode to avoid errors)
function json_(obj /*, code */) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function htmlPage_(title, bodyHtml) {
  return HtmlService.createHtmlOutput(
    `<!doctype html><meta charset="utf-8"><title>${esc_(title)}</title>
     <body style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:40px auto">
     <h2>${esc_(title)}</h2>${bodyHtml}</body>`
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}