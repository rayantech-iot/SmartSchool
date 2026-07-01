const { Classe, EmploiDuTemps } = require('../models');
const { CYCLES, SECTIONS } = require('../config/schoolConfig');
const { getAnneeScolaireCourante, estAnneeScolaireCourante } = require('./schoolYearService');

function getLibelleComplet(niveau, section) {
  return `${niveau} ${section}`;
}

function getCapacitePourCycle(cycle) {
  return CYCLES[cycle]?.capacite || 40;
}

async function getProchaineSection(cycle, niveau, anneeScolaire) {
  const existantes = await Classe.findAll({
    where: { cycle, niveau, annee_scolaire: anneeScolaire },
    order: [['nom', 'ASC']]
  });
  const utilisees = new Set(existantes.map((c) => c.nom));
  for (const lettre of SECTIONS) {
    if (!utilisees.has(lettre)) return lettre;
  }
  throw new Error(`Nombre maximum de sections atteint pour ${niveau}.`);
}

function genererSalle(cycle, niveau, section) {
  const prefixe = CYCLES[cycle]?.prefixeSalle || 'SAL';
  const codeNiveau = niveau
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 3)
    .toUpperCase();
  return `${prefixe}-${codeNiveau}-${section}`;
}

async function creerClasse({ cycle, niveau, annee_scolaire }) {
  if (!CYCLES[cycle]) throw new Error('Cycle scolaire invalide.');
  if (!CYCLES[cycle].niveaux.includes(niveau)) throw new Error(`Niveau "${niveau}" invalide pour le cycle ${cycle}.`);

  const annee = annee_scolaire || getAnneeScolaireCourante();
  if (!estAnneeScolaireCourante(annee)) throw new Error(`Seule l'année scolaire courante (${getAnneeScolaireCourante()}) est autorisée.`);

  const section = await getProchaineSection(cycle, niveau, annee);
  const capacite = getCapacitePourCycle(cycle);
  const salle = genererSalle(cycle, niveau, section);

  const classe = await Classe.create({ cycle, niveau, nom: section, capacite, annee_scolaire: annee, salle });

  await EmploiDuTemps.create({ classe_id: classe.id, annee_scolaire: annee, actif: true });

  return { classe, libelle: getLibelleComplet(niveau, section) };
}

async function apercuCreation(cycle, niveau, anneeScolaire) {
  const annee = anneeScolaire || getAnneeScolaireCourante();
  const section = await getProchaineSection(cycle, niveau, annee);
  return { libelle: getLibelleComplet(niveau, section), section, capacite: getCapacitePourCycle(cycle), salle: genererSalle(cycle, niveau, section), annee_scolaire: annee };
}

module.exports = { getLibelleComplet, getCapacitePourCycle, getProchaineSection, genererSalle, creerClasse, apercuCreation };
