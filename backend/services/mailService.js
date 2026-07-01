


const nodemailer = require('nodemailer');

let transporter = null;

function estConfigure() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER);
}

function getConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || ''
    }
  };
}

function getTransporter() {
  if (transporter) return transporter;
  if (!estConfigure()) return null;

  transporter = nodemailer.createTransport(getConfig());
  return transporter;
}


function reinitialiser() {
  transporter = null;
}

const APP_NAME = process.env.APP_NAME || 'SmartSchool';

async function verifierConnexion() {
  if (!estConfigure()) {
    return {
      ok: false,
      mode: 'console',
      message: 'SMTP non configuré (SMTP_HOST et SMTP_USER requis dans .env).'
    };
  }

  const transport = getTransporter();
  try {
    await transport.verify();
    return {
      ok: true,
      mode: 'smtp',
      message: `Connexion SMTP OK (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587})`,
      user: process.env.SMTP_USER
    };
  } catch (err) {
    return {
      ok: false,
      mode: 'smtp',
      message: err.message,
      hint: hintErreurSmtp(err)
    };
  }
}

function hintErreurSmtp(err) {
  const msg = (err.message || '').toLowerCase();
  if (msg.includes('invalid login') || msg.includes('authentication')) {
    return 'Vérifiez SMTP_USER et SMTP_PASS. Pour Gmail, utilisez un mot de passe d\'application (pas le mot de passe du compte).';
  }
  if (msg.includes('self signed') || msg.includes('certificate')) {
    return 'Problème certificat SSL — essayez SMTP_SECURE=false avec le port 587.';
  }
  if (msg.includes('connect') || msg.includes('timeout')) {
    return 'Serveur SMTP injoignable — vérifiez SMTP_HOST, SMTP_PORT et votre connexion internet.';
  }
  return null;
}

async function envoyer({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || `"${APP_NAME}" <noreply@smartschool.tg>`;
  const payload = { from, to, subject, html, text: text || html.replace(/<[^>]+>/g, '') };

  const transport = getTransporter();
  if (!transport) {
    console.log('\n========== EMAIL (mode dev — SMTP non configuré) ==========');
    console.log('À:', to);
    console.log('Sujet:', subject);
    console.log(text || html);
    console.log('===========================================================');
    console.log('→ Configurez SMTP dans .env puis : npm run mail:test\n');
    return { ok: true, mode: 'console' };
  }

  try {
    const info = await transport.sendMail(payload);
    console.log(`📧 Email envoyé à ${to} (${info.messageId})`);
    return { ok: true, mode: 'smtp', messageId: info.messageId };
  } catch (err) {
    console.error('❌ Erreur envoi email:', err.message);
    if (hintErreurSmtp(err)) console.error('💡', hintErreurSmtp(err));
    throw err;
  }
}

async function envoyerTest(to) {
  return envoyer({
    to,
    subject: `${APP_NAME} — Test SMTP`,
    html: `
      <div style="font-family:sans-serif;max-width:480px">
        <h2 style="color:#1E3A8A">Test SMTP réussi</h2>
        <p>SmartSchool peut envoyer des emails (invitations, réinitialisation mot de passe).</p>
        <p style="font-size:12px;color:#888">Envoyé le ${new Date().toLocaleString('fr-FR')}</p>
      </div>`
  });
}

async function envoyerActivation({ to, prenom, url, roleLabel }) {
  const subject = `${APP_NAME} — Activez votre compte ${roleLabel}`;
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#1E3A8A">Bienvenue sur ${APP_NAME}</h2>
      <p>Bonjour <strong>${prenom}</strong>,</p>
      <p>Votre compte <strong>${roleLabel}</strong> a été créé. Cliquez sur le bouton ci-dessous pour définir votre mot de passe et accéder à la plateforme :</p>
      <p style="text-align:center;margin:28px 0">
        <a href="${url}" style="background:#1E3A8A;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
          Créer mon mot de passe
        </a>
      </p>
      <p style="font-size:13px;color:#666">Ce lien est valable <strong>48 heures</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      <p style="font-size:12px;color:#999;word-break:break-all">${url}</p>
    </div>`;
  return envoyer({ to, subject, html });
}

async function envoyerLiaisonValidee({ to, prenom, nomEleve }) {
  const subject = `${APP_NAME} — Liaison avec ${nomEleve} confirmée`;
  const html = `
    <div style="font-family:sans-serif;max-width:520px">
      <p>Bonjour <strong>${prenom}</strong>,</p>
      <p>Votre demande de liaison avec l'élève <strong>${nomEleve}</strong> a été <strong>validée</strong>.</p>
      <p>Vous pouvez vous connecter sur ${process.env.APP_URL || 'http://localhost:3000'}/login</p>
    </div>`;
  return envoyer({ to, subject, html });
}

async function envoyerInscriptionEnAttente({ to, prenom }) {
  const subject = `${APP_NAME} — Inscription en cours de validation`;
  const html = `
    <div style="font-family:sans-serif;max-width:520px">
      <p>Bonjour <strong>${prenom}</strong>,</p>
      <p>Votre inscription a bien été enregistrée. L'administration va la valider sous peu.</p>
      <p>Vous recevrez un email dès que votre compte sera activé.</p>
    </div>`;
  return envoyer({ to, subject, html });
}

module.exports = {
  estConfigure,
  getConfig,
  reinitialiser,
  verifierConnexion,
  envoyer,
  envoyerTest,
  envoyerActivation,
  envoyerLiaisonValidee,
  envoyerInscriptionEnAttente
};
