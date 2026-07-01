


const crypto = require('crypto');

const MAJ = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MIN = 'abcdefghjkmnpqrstuvwxyz';
const CHIFFRES = '23456789';


function genererMotDePasseTemporaire(longueur = 10) {
  const tous = MAJ + MIN + CHIFFRES;
  let mdp = '';
  mdp += MAJ[crypto.randomInt(MAJ.length)];
  mdp += MIN[crypto.randomInt(MIN.length)];
  mdp += CHIFFRES[crypto.randomInt(CHIFFRES.length)];
  for (let i = 3; i < longueur; i++) {
    mdp += tous[crypto.randomInt(tous.length)];
  }
  return mdp.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

module.exports = { genererMotDePasseTemporaire };
