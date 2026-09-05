(function definePublicContent(root) {
  'use strict';

  const COLLECTIONS = Object.freeze([
    'siteSettings', 'navigationGroups', 'navigationItems', 'heroBanners', 'publicProgramProfiles',
    'publicBranchProfiles', 'publicTeacherProfiles', 'articles', 'articleCategories',
    'publicEvents', 'staticPages', 'contactChannels',
  ]);

  function published(type, state, at = null) {
    if (!COLLECTIONS.includes(type) || !Array.isArray(state?.[type])) return [];
    const moment = new Date(at || state.currentAt || state.seededAt || Date.now()).getTime();
    const byKey = new Map();
    state[type].forEach((item) => {
      if (item.status !== 'PUBLISHED') return;
      if (item.effectiveFrom && new Date(item.effectiveFrom).getTime() > moment) return;
      if (item.effectiveTo && new Date(item.effectiveTo).getTime() <= moment) return;
      const key = item.contentKey || item.id;
      const current = byKey.get(key);
      if (!current || Number(item.revision || 0) > Number(current.revision || 0)) byKey.set(key, item);
    });
    return [...byKey.values()].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  }

  function publicNavigation(state) {
    const groups = published('navigationGroups', state);
    const items = published('navigationItems', state);
    const programs = published('publicProgramProfiles', state).map((item) => ({
      id: `nav-${item.id}`, contentKey: `nav-${item.contentKey || item.id}`, groupId: 'nav-group-programs',
      label: item.name, href: `/chuong-trinh/${item.slug}`, order: item.order, status: 'PUBLISHED', sourceId: item.id,
    }));
    return groups.map((group) => ({
      ...group,
      items: [...items.filter((item) => item.groupId === group.id), ...(group.source === 'PROGRAMS' ? programs : [])]
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0)),
    })).filter((group) => group.items.length > 0);
  }

  function homepage(state, actor = null) {
    const contacts = published('contactChannels', state).filter((item) => String(item.value || '').trim() && item.status === 'PUBLISHED');
    const programs = published('publicProgramProfiles', state).map((item) => ({
      ...item,
      saved: actor?.role === 'VISITOR' && (actor.savedProgramIds || []).includes(item.programId),
    }));
    return {
      site: published('siteSettings', state)[0] || null,
      hero: published('heroBanners', state).find((item) => item.placement === 'HOME') || null,
      programs,
      branches: published('publicBranchProfiles', state),
      teachers: published('publicTeacherProfiles', state).filter((item) => item.publicOptIn === true),
      categories: published('articleCategories', state),
      articles: published('articles', state),
      events: published('publicEvents', state),
      contacts,
      navigation: publicNavigation(state),
      accountState: actor?.role === 'VISITOR' ? 'VISITOR' : actor ? 'LEARNER_OR_STAFF' : 'ANONYMOUS',
    };
  }

  root.YC.define('publicContent', Object.freeze({ COLLECTIONS, homepage, publicNavigation, published }));
})(globalThis);
