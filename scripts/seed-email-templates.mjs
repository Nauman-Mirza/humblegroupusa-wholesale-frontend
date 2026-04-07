/**
 * Seed professional email templates
 * Usage:  TOKEN=<your-admin-token> node scripts/seed-email-templates.mjs
 *
 * Get your token: open browser DevTools → Application → localStorage → copy "token"
 */

const TOKEN = process.env.TOKEN;
const BASE  = 'https://api.humblegroupusa.com/api/admin';

if (!TOKEN) {
  console.error('❌  TOKEN env var is required.\n   Usage: TOKEN=<token> node scripts/seed-email-templates.mjs');
  process.exit(1);
}

// ─── Shared HTML building blocks ────────────────────────────────────────────

const emailWrapper = (content) => `
<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background-color:#f1f5f9;padding:48px 16px;font-family:Arial,Helvetica,sans-serif;margin:0">
  <tr>
    <td align="center" valign="top">
      <table width="600" cellpadding="0" cellspacing="0" border="0"
        style="max-width:600px;width:100%">

        <!-- ── Header ── -->
        <tr>
          <td style="background-color:#0f172a;padding:32px 48px;border-radius:12px 12px 0 0;text-align:center">
            {{logo}}
            <p style="margin:12px 0 0;color:#94a3b8;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-weight:700">
              Wholesale Portal
            </p>
          </td>
        </tr>

        <!-- ── Accent bar ── -->
        <tr>
          <td style="background:linear-gradient(90deg,#1e293b,#475569);height:3px;font-size:0;line-height:0">&nbsp;</td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style="background-color:#ffffff;padding:48px 48px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
            ${content}
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="background-color:#0f172a;padding:28px 48px;border-radius:0 0 12px 12px;text-align:center">
            <p style="color:#64748b;margin:0 0 6px;font-size:12px;line-height:1.6">
              © 2025 <strong style="color:#94a3b8">Humble Group USA</strong>. All rights reserved.
            </p>
            <p style="color:#475569;margin:0;font-size:11px">
              Questions? Contact our support team at
              <a href="mailto:support@humblegroupusa.com"
                style="color:#94a3b8;text-decoration:none">support@humblegroupusa.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>`;

const sectionHeading = (title) =>
  `<h3 style="margin:28px 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:#64748b;border-bottom:1px solid #e2e8f0;padding-bottom:10px">${title}</h3>`;

const detailRow = (label, value) => `
  <tr>
    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;width:40%">
      <span style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px">${label}</span>
    </td>
    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9">
      <span style="font-size:14px;color:#0f172a">${value}</span>
    </td>
  </tr>`;

const alertBox = (bg, borderColor, iconColor, iconChar, text) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:${bg};border-left:4px solid ${borderColor};border-radius:0 8px 8px 0;margin:24px 0">
    <tr>
      <td style="padding:16px 20px">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:top;padding-right:12px">
              <span style="font-size:18px;color:${iconColor}">${iconChar}</span>
            </td>
            <td>
              <p style="margin:0;font-size:13px;color:#0f172a;line-height:1.6">${text}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

// ─── Template definitions ────────────────────────────────────────────────────

const templates = [

  // ── 1. New user registration notification (to admin) ──────────────────────
  {
    key: 'new_user_registration_notification',
    subject: 'New Registration Request — {{first_name}} {{last_name}}',
    body_html: emailWrapper(`
      <h1 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#0f172a">
        New Registration Request
      </h1>
      <p style="margin:0 0 32px;font-size:14px;color:#64748b;line-height:1.6">
        A new wholesale customer has submitted a registration request and is awaiting review.
      </p>

      ${alertBox('#f0fdf4','#22c55e','#16a34a','✔',
        'This request has been received and is <strong>pending admin approval</strong>. Please review the details below and take action in the admin panel.'
      )}

      ${sectionHeading('Contact Information')}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${detailRow('Full Name',     '{{first_name}} {{last_name}}')}
        ${detailRow('Email',         '{{email}}')}
        ${detailRow('Phone',         '{{phone}}')}
        ${detailRow('Company',       '{{company_name}}')}
        ${detailRow('Website',       '{{website}}')}
      </table>

      ${sectionHeading('Shipping Address')}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${detailRow('Address 1',     '{{shipping_address_1}}')}
        ${detailRow('Address 2',     '{{shipping_address_2}}')}
        ${detailRow('City',          '{{shipping_city}}')}
        ${detailRow('State',         '{{shipping_state}} ({{shipping_state_code}})')}
        ${detailRow('Country',       '{{shipping_country}} ({{shipping_country_code}})')}
        ${detailRow('Postcode',      '{{shipping_postcode}}')}
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:36px">
        <tr>
          <td align="center">
            <p style="margin:0 0 14px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px">
              Action Required
            </p>
            <a href="#" style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;
              padding:14px 36px;border-radius:6px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase">
              Review in Admin Panel →
            </a>
          </td>
        </tr>
      </table>
    `),
    body_text: 'New registration request from {{first_name}} {{last_name}} ({{email}}). Company: {{company_name}}. Phone: {{phone}}. Please review in the admin panel.',
    is_active: '1',
  },

  // ── 2. Order created (to user) ─────────────────────────────────────────────
  {
    key: 'order_created_user',
    subject: 'Order Confirmation — #{{warehence_order_id}}',
    body_html: emailWrapper(`
      <p style="margin:0 0 4px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:2px;font-weight:700">
        Order Confirmation
      </p>
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#0f172a">
        Thank you, {{first_name}}!
      </h1>
      <p style="margin:0 0 32px;font-size:14px;color:#64748b;line-height:1.6">
        Your order has been received and is being processed. We'll keep you updated on its progress.
      </p>

      <!-- Order summary card -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:32px">
        <tr>
          <td style="padding:24px 28px">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;font-weight:700">Order Number</p>
                  <p style="margin:0;font-size:22px;font-weight:800;color:#0f172a">#{{warehence_order_id}}</p>
                </td>
                <td align="right">
                  <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;font-weight:700">Order Total</p>
                  <p style="margin:0;font-size:22px;font-weight:800;color:#0f172a">\${{order_total}}</p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:16px;border-top:1px solid #e2e8f0">
                  <p style="margin:0;font-size:12px;color:#94a3b8">
                    <strong style="color:#64748b">{{items_count}}</strong> item(s) ordered
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${sectionHeading('Order Items')}
      {{order_items_table}}

      <p style="margin:32px 0 0;font-size:14px;color:#64748b;line-height:1.6">
        If you have any questions about your order, please don't hesitate to reach out to our team.
      </p>

      <p style="margin:24px 0 0;font-size:14px;color:#0f172a;line-height:1.6">
        Best regards,<br>
        <strong>The Humble Group USA Team</strong>
      </p>
    `),
    body_text: 'Hello {{first_name}}, your order #{{warehence_order_id}} has been confirmed. Items: {{items_count}}. Total: ${{order_total}}. Thank you for your order.',
    is_active: '1',
  },

  // ── 3. Registration accepted ───────────────────────────────────────────────
  {
    key: 'registration_accepted',
    subject: 'Welcome to Humble Group USA — Your Account is Approved',
    body_html: emailWrapper(`
      <!-- Success badge -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px">
        <tr>
          <td align="center">
            <div style="display:inline-block;background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:50px;padding:10px 20px">
              <span style="font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:2px">
                ✔ &nbsp; Account Approved
              </span>
            </div>
          </td>
        </tr>
      </table>

      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;text-align:center">
        Welcome aboard, {{first_name}}!
      </h1>
      <p style="margin:0 0 36px;font-size:15px;color:#64748b;line-height:1.7;text-align:center">
        We're thrilled to have <strong style="color:#0f172a">{{company_name}}</strong> as part of the<br>
        Humble Group USA wholesale network.
      </p>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px">
        <tr>
          <td style="border-top:1px solid #e2e8f0"></td>
        </tr>
      </table>

      <!-- What's next -->
      ${sectionHeading("What's Next")}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px">
        ${[
          ['🔑', 'Log In to Your Account',    'Use your registered email and password to access the wholesale portal.'],
          ['📦', 'Browse Our Catalog',         'Explore our full product catalog and place your first wholesale order.'],
          ['💬', 'Contact Support',            'Our team is ready to help you with any questions about products or ordering.'],
        ].map(([icon, title, desc]) => `
          <tr>
            <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;width:44px">
              <span style="font-size:20px">${icon}</span>
            </td>
            <td style="padding:14px 0 14px 12px;border-bottom:1px solid #f1f5f9">
              <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0f172a">${title}</p>
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5">${desc}</p>
            </td>
          </tr>
        `).join('')}
      </table>

      <p style="margin:28px 0 0;font-size:14px;color:#0f172a;line-height:1.6">
        Best regards,<br>
        <strong>The Humble Group USA Team</strong>
      </p>
    `),
    body_text: 'Hello {{first_name}}, congratulations! Your registration request for {{company_name}} has been approved. Your account is now active and you can start placing wholesale orders.',
    is_active: '1',
  },

  // ── 4. Registration declined ───────────────────────────────────────────────
  {
    key: 'registration_declined',
    subject: 'Update on Your Humble Group USA Registration Request',
    body_html: emailWrapper(`
      <!-- Status badge -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px">
        <tr>
          <td align="center">
            <div style="display:inline-block;background-color:#fff7ed;border:1px solid #fed7aa;border-radius:50px;padding:10px 20px">
              <span style="font-size:13px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:2px">
                Registration Update
              </span>
            </div>
          </td>
        </tr>
      </table>

      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;text-align:center">
        Hello, {{first_name}}
      </h1>
      <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.7;text-align:center">
        Thank you for your interest in partnering with<br>
        <strong style="color:#0f172a">Humble Group USA</strong>.
      </p>

      ${alertBox(
        '#fff7ed', '#f97316', '#ea580c', '⚠',
        'After careful review, we are unable to approve your registration request at this time. This decision may be based on current business requirements, coverage area, or other internal criteria.'
      )}

      <p style="margin:28px 0;font-size:14px;color:#475569;line-height:1.7">
        We understand this may be disappointing, and we appreciate the time you took to apply.
        If you believe there has been an error or would like further clarification, our team is here to help.
      </p>

      ${sectionHeading('Need Help?')}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px">
        ${[
          ['📧', 'Email Us',    'support@humblegroupusa.com'],
          ['📞', 'Call Us',     'Available during business hours'],
        ].map(([icon, label, value]) => `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;width:44px;vertical-align:middle">
              <span style="font-size:18px">${icon}</span>
            </td>
            <td style="padding:12px 0 12px 12px;border-bottom:1px solid #f1f5f9">
              <p style="margin:0 0 2px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8">${label}</p>
              <p style="margin:0;font-size:14px;color:#0f172a">${value}</p>
            </td>
          </tr>
        `).join('')}
      </table>

      <p style="margin:28px 0 0;font-size:14px;color:#0f172a;line-height:1.6">
        Best regards,<br>
        <strong>The Humble Group USA Team</strong>
      </p>
    `),
    body_text: 'Hello {{first_name}}, thank you for your interest in Humble Group USA. After review, we are unable to approve your registration at this time. Please contact support@humblegroupusa.com if you have any questions.',
    is_active: '1',
  },

  // ── 5. User registration thank you (right after sign-up) ─────────────────
  {
    key: 'user_registration_thank_you',
    subject: 'We Received Your Registration — Humble Group USA',
    body_html: emailWrapper(`
      <!-- Icon -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px">
        <tr>
          <td align="center">
            <div style="width:64px;height:64px;background-color:#f1f5f9;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;line-height:64px;text-align:center">
              📬
            </div>
          </td>
        </tr>
      </table>

      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0f172a;text-align:center">
        Thanks for Registering, {{first_name}}!
      </h1>
      <p style="margin:0 0 36px;font-size:15px;color:#64748b;line-height:1.7;text-align:center">
        We've received your application for <strong style="color:#0f172a">{{company_name}}</strong><br>
        and our team is reviewing it now.
      </p>

      <!-- Status timeline -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:32px">
        <tr>
          <td style="padding:28px 32px">
            ${[
              ['✅', 'Application Submitted',  'Your registration details have been received.',          true],
              ['⏳', 'Under Review',            'Our team is currently reviewing your application.',      true],
              ['📬', 'Decision Notification',   'We\'ll email you once a decision has been made.',        false],
            ].map(([icon, step, desc, done]) => `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px">
                <tr>
                  <td style="vertical-align:top;width:36px">
                    <div style="width:32px;height:32px;border-radius:50%;
                      background-color:${done ? '#0f172a' : '#e2e8f0'};
                      color:${done ? '#ffffff' : '#94a3b8'};
                      text-align:center;line-height:32px;font-size:14px">
                      ${done ? icon : '○'}
                    </div>
                  </td>
                  <td style="padding-left:14px;vertical-align:middle">
                    <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${done ? '#0f172a' : '#94a3b8'}">${step}</p>
                    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.4">${desc}</p>
                  </td>
                </tr>
              </table>
            `).join('')}
          </td>
        </tr>
      </table>

      <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.7">
        Most applications are reviewed within <strong style="color:#0f172a">1–3 business days</strong>.
        We'll notify you at <strong style="color:#0f172a">{{email}}</strong> as soon as a decision is made.
      </p>

      <p style="margin:28px 0 0;font-size:14px;color:#0f172a;line-height:1.6">
        Best regards,<br>
        <strong>The Humble Group USA Team</strong>
      </p>
    `),
    body_text: 'Hello {{first_name}}, thank you for registering with Humble Group USA. We have received your application for {{company_name}} and our team is currently reviewing it. You will be notified at {{email}} once a decision has been made.',
    is_active: '1',
  },

];

// ─── Run updates ─────────────────────────────────────────────────────────────

async function updateTemplate(t) {
  const form = new FormData();
  form.append('key',       t.key);
  form.append('subject',   t.subject);
  form.append('body_html', t.body_html);
  form.append('body_text', t.body_text);
  form.append('is_active', t.is_active);

  const res = await fetch(`${BASE}/email-templates/update`, {
    method: 'POST',
    headers: { Accept: 'application/json', Token: TOKEN },
    body: form,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

(async () => {
  console.log(`\n🚀  Seeding ${templates.length} email templates…\n`);
  for (const t of templates) {
    process.stdout.write(`  Updating "${t.key}" … `);
    try {
      await updateTemplate(t);
      console.log('✅  done');
    } catch (err) {
      console.log(`❌  failed: ${err.message}`);
    }
  }
  console.log('\n✨  All templates processed.\n');
})();
