(() => {
  const init = () => {
    const grid = document.getElementById('profilesGrid');
    if (!grid || grid.dataset.cardNavigationReady === '1') return;
    grid.dataset.cardNavigationReady = '1';

    grid.addEventListener('click', (event) => {
      const card = event.target.closest('.people-theme-card[data-profile-id]');
      if (!card || !grid.contains(card)) return;

      // Action controls keep their own behavior; they must not open the profile.
      if (event.target.closest('button, a, input, select, textarea, label')) return;

      const profileId = card.dataset.profileId;
      if (!profileId || typeof window.openUserProfile !== 'function') return;

      window.openUserProfile(profileId);
    });

    const style = document.createElement('style');
    style.id = 'peopleCardNavigationStyles';
    style.textContent = `
      #profilesGrid .people-theme-card[data-profile-id] { cursor: pointer; }
      #profilesGrid .people-theme-card[data-profile-id] .member-card-actions,
      #profilesGrid .people-theme-card[data-profile-id] button { cursor: default; }
    `;
    document.head.appendChild(style);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // People cards can be rebuilt after filters/search, but the delegated listener
  // stays attached to #profilesGrid, so no per-card rebinding is required.
})();
