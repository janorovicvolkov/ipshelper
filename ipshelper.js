// <nowiki>
(async () => {
    const cfg = mw.config.get();
    const user = mw.user.getName();
    let IPSRoles = {             
        clerks: [],
        checkusers: []
    };
    async function loadIPSRoles() {
        const api = new mw.Api();
        const res = await api.get({
            action: "query",
            titles: "Wikipedia:Investigasi pengguna siluman/IPS/Authorized.json",
            prop: "revisions",
            rvprop: "content",
            rvslots: "main",
            format: "json"
        });
        const page = Object.values(res.query.pages)[0];
        if (!page.revisions) {
            throw new Error("Data petugas IPS tidak ditemukan");
        }
        const raw = page.revisions[0].slots.main['*'].trim();
        const data = JSON.parse(raw);
        IPSRoles.clerks = data.clerks || [];
        IPSRoles.checkusers = data.checkusers || [];
    }
    const page = cfg.wgPageName;
    if (!page.startsWith('Wikipedia:Investigasi_pengguna_siluman/')) return;
    const excludedPatterns = [
        '/Arsip/',
        '/Arsip',
        'Kasus/',
        'Indikator',
        'header',
        'IPS/'
    ];
    if (excludedPatterns.some(p => page.includes(p))) return;
    if (
        cfg.wgAction === 'history' ||
        cfg.wgDiffNewId ||
        cfg.wgDiffOldId ||
        cfg.wgCurRevisionId !== cfg.wgRevisionId
    ) return;
    await loadIPSRoles();
    const isIPSPetugas =
        IPSRoles.clerks.includes(user) ||
        IPSRoles.checkusers.includes(user);
    if (!isIPSPetugas) return;
    const IPS = (window.IPSHelper = {
        version: "2.0",
        modules: {},
        ads: "([[w:id:WP:ipshelper.js|ipshelper.js]])",
        mainPath: "Pengguna:Janorovic Volkov/Perkakas/",
        initModule(name) {
            if (!IPS.modules[name]) {
                importScript(`${IPS.mainPath}ipshelper-module/${name}.js`);
            }
        },
        register(name, moduleObj) {
            IPS.modules[name] = moduleObj;
            console.log(`[ipshelper.js v2] Modul ${name} terdaftar.`);
            if (moduleObj.init) moduleObj.init();
        }
    });
    await mw.loader.using([
        'mediawiki.api',
        'mediawiki.util',
        'oojs-ui',
        'mediawiki.ui.button'
    ]);
    ['change-case-status', 'block-and-tag', 'note-or-comment']
        .forEach(m => IPS.initModule(m));
    importScript(`${IPS.mainPath}ipshelper-api.js`);
    importScript(`${IPS.mainPath}ipshelper-panel.js`);
})();
// </nowiki>
