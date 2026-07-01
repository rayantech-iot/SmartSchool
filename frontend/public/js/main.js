
(function () {
  'use strict';

  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }

  window.fetchWithCsrf = function (url, options = {}) {
    options.headers = options.headers || {};
    options.headers['X-CSRF-Token'] = getCsrfToken();
    return fetch(url, options);
  };

  const btnMenu = document.getElementById('menu-mobile');
  const menuItems = document.getElementById('menu-mobile-items');
  if (btnMenu && menuItems) {
    btnMenu.addEventListener('click', () => menuItems.classList.toggle('hidden'));
  }

  function chargerMessagesNonLus(roleType) {
    const badgeEl = document.getElementById('badge-nonlus');
    if (!badgeEl || !['professeur', 'parent', 'eleve'].includes(roleType)) return;

    fetch(`/${roleType}/messages/non-lus`)
      .then((r) => r.json())
      .then((data) => {
        if (data.nonLus > 0) {
          badgeEl.textContent = data.nonLus > 9 ? '9+' : data.nonLus;
          badgeEl.classList.remove('hidden');
        } else {
          badgeEl.classList.add('hidden');
        }
      })
      .catch(() => {});
  }

  function chargerBadgeNotifications() {
    const badgeEl = document.getElementById('badge-notifications');
    if (!badgeEl) return;

    fetch('/notifications/non-lues')
      .then((r) => r.json())
      .then((data) => {
        if (data.nonLues > 0) {
          badgeEl.textContent = data.nonLues > 9 ? '9+' : data.nonLues;
          badgeEl.classList.remove('hidden');
        } else {
          badgeEl.classList.add('hidden');
        }
      })
      .catch(() => {});
  }

  function afficherPanneauNotifications() {
    const panel = document.getElementById('notif-panel');
    const list = document.getElementById('notif-list');
    if (!panel || !list) return;

    panel.classList.toggle('hidden');
    if (panel.classList.contains('hidden')) return;

    list.innerHTML = '<li class="p-4 text-gray-400 italic">Chargement…</li>';

    fetch('/notifications')
      .then((r) => r.json())
      .then((data) => {
        if (!data.notifications || !data.notifications.length) {
          list.innerHTML = '<li class="p-4 text-gray-400 italic">Aucune notification</li>';
          return;
        }
        list.innerHTML = data.notifications.map((n) => {
          const date = n.createdAt ? new Date(n.createdAt).toLocaleString('fr-FR') : '';
          const lien = n.lien ? `href="${n.lien}"` : 'href="#"';
          return `<li class="p-3 hover:bg-gray-50 ${n.lu ? '' : 'bg-blue-50/40'}">
            <a ${lien} class="block" data-notif-id="${n.id}">
              <p class="font-semibold text-gray-800 text-xs">${n.titre}</p>
              <p class="text-gray-600 text-xs mt-0.5">${n.contenu || ''}</p>
              <p class="text-[10px] text-gray-400 mt-1">${date}</p>
            </a>
          </li>`;
        }).join('');

        list.querySelectorAll('[data-notif-id]').forEach((a) => {
          a.addEventListener('click', () => {
            const id = a.getAttribute('data-notif-id');
            fetchWithCsrf(`/notifications/${id}/lire`, { method: 'POST' }).catch(() => {});
          });
        });
      })
      .catch(() => {
        list.innerHTML = '<li class="p-4 text-red-500 text-xs">Impossible de charger les notifications</li>';
      });
  }

  const btnNotif = document.getElementById('btn-notifications');
  const btnNotifClose = document.getElementById('notif-panel-close');
  if (btnNotif) {
    btnNotif.addEventListener('click', (e) => {
      e.preventDefault();
      afficherPanneauNotifications();
    });
  }
  if (btnNotifClose) {
    btnNotifClose.addEventListener('click', () => {
      const panel = document.getElementById('notif-panel');
      if (panel) panel.classList.add('hidden');
    });
  }

  document.addEventListener('click', (e) => {
    const panel = document.getElementById('notif-panel');
    const btn = document.getElementById('btn-notifications');
    if (!panel || panel.classList.contains('hidden')) return;
    if (!panel.contains(e.target) && btn && !btn.contains(e.target)) {
      panel.classList.add('hidden');
    }
  });

  const userType = document.body.getAttribute('data-user-type');
  if (userType) {
    chargerBadgeNotifications();
    chargerMessagesNonLus(userType);
    setInterval(() => {
      chargerBadgeNotifications();
      chargerMessagesNonLus(userType);
    }, 60000);
  }

  document.querySelectorAll('.flash-success, .flash-error').forEach((el) => {
    setTimeout(() => {
      el.style.transition = 'opacity 0.5s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    }, 5000);
  });

  window.exporterEmploiDuTempsPDF = function () {
    window.print();
  };

  window.readMessage = function (messageId) {
    const roleMatch = window.location.pathname.match(/^\/(professeur|parent|eleve)\//);
    if (!roleMatch) return;

    fetchWithCsrf(`/${roleMatch[1]}/messages/${messageId}`)
      .then((r) => r.json())
      .then((msg) => {
        const modal = document.getElementById('read-message-modal');
        if (!modal) return;
        const sujet = document.getElementById('read-msg-sujet');
        const contenu = document.getElementById('read-msg-contenu');
        const expediteur = document.getElementById('read-msg-expediteur');
        if (sujet) sujet.textContent = msg.sujet;
        if (contenu) contenu.textContent = msg.contenu;
        if (expediteur) {
          const auteur = msg.expediteur
            ? `${msg.expediteur.prenom} ${msg.expediteur.nom}`
            : 'Inconnu';
          const date = msg.createdAt ? new Date(msg.createdAt).toLocaleString('fr-FR') : '';
          expediteur.textContent = `De : ${auteur} — ${date}`;
        }
        modal.classList.remove('hidden');
      })
      .catch((err) => console.error('Erreur lecture message:', err));
  };

  window.closeReadMessageModal = function () {
    const modal = document.getElementById('read-message-modal');
    if (modal) modal.classList.add('hidden');
    if (window.location.pathname.includes('/messages')) {
      window.location.reload();
    }
  };
})();
