#!/usr/bin/env node
// scripts/test-smtp.js — Vérifier la configuration SMTP
require('dotenv').config();
const mailService = require('../services/mailService');

async function main() {
  console.log('\n🔍 Test configuration SMTP SmartSchool\n');

  const check = await mailService.verifierConnexion();
  console.log(check.ok ? '✅' : '❌', check.message);
  if (check.hint) console.log('💡', check.hint);
  if (check.user) console.log('   Compte:', check.user);

  if (!check.ok) {
    if (check.mode === 'console') {
      console.log('\n📝 Ajoutez dans votre fichier .env :\n');
      console.log('   SMTP_HOST=smtp.gmail.com');
      console.log('   SMTP_PORT=587');
      console.log('   SMTP_SECURE=false');
      console.log('   SMTP_USER=votre.email@gmail.com');
      console.log('   SMTP_PASS=xxxx xxxx xxxx xxxx   # mot de passe d\'application Gmail');
      console.log('   MAIL_FROM="SmartSchool <votre.email@gmail.com>"');
      console.log('\n   Puis relancez : npm run mail:test votre.email@gmail.com\n');
    }
    process.exit(1);
  }

  const dest = process.argv[2] || process.env.SMTP_USER;
  if (!dest) {
    console.log('\n⚠️  Connexion OK. Pour envoyer un email test :');
    console.log('   npm run mail:test votre@email.com\n');
    process.exit(0);
  }

  console.log(`\n📤 Envoi email test à ${dest}...`);
  try {
    await mailService.envoyerTest(dest);
    console.log('✅ Email de test envoyé ! Vérifiez votre boîte (et les spams).\n');
  } catch (err) {
    console.error('❌ Échec envoi:', err.message);
    process.exit(1);
  }
}

main();
