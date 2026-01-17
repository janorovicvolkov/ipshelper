// <nowiki>
(function() {
    const $content = $('#mw-content-text');
    const $panel = $('<div>', { id: 'ips-panel', class: 'mw-ui-panel mw-ui-progressive' })
        .css({
            marginBottom: '1em',
            padding: '1em',
            border: '1px solid #ccc',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            borderRadius: '4px'
        });
    $panel.append('<center><h2>IPSHelper.js – v2.0</h2></center>');
    const $headerContainer = $('<div>', { id: 'ips-header-container' });
    const headers = $content.find('h3');
    if (headers.length === 0) {
        $headerContainer.text('Saat ini belum ada kasus yang dilaporkan')
            .css({ fontStyle: 'italic', color: '#555', marginBottom: '1em' });
    } else {
        $headerContainer.append('<h3>Pilih kasus yang ingin ditangani:</h3>');
        headers.each(function(i) {
            const text = $(this).text().trim();
            const $radio = $('<label>', { class: 'mw-ui-radio', css: { display: 'block', margin: '0.2em 0' } });
            $radio.append(
                $('<input>', { type: 'radio', name: 'ips-header', value: text }),
                ` ${text}`
            );
            $headerContainer.append($radio);
        });
    }
    $panel.append($headerContainer);
    function autoSyncModules() {
    	const selectedHeader = $('input[name="ips-header"]:checked').val();
    	if (!selectedHeader) return;
    	const selectedModules = $('#ips-checklist input:checked')
        	.map((_, el) => el.value)
        	.get();
       	if (selectedModules.length === 0) {
       		$('#ips-module-container').empty();
       		return;
       	}
       	syncModulePanels(selectedHeader, selectedModules);
    }
    const disableMap = {
    	'change-case-status': ['close-case', 'cross-wiki', 'archive-case'],
    	'block-and-tag': ['cross-wiki', 'archive-case'],
    	'note-or-comment': ['cross-wiki', 'archive-case'],
    	'close-case': ['change-case-status', 'cross-wiki', 'archive-case'],
    	'cross-wiki': ['change-case-status', 'block-and-tag', 'note-or-comment', 'close-case', 'archive-case'],
    	'archive-case': ['change-case-status', 'block-and-tag', 'note-or-comment', 'close-case', 'cross-wiki']
    };
    function updateDisabledActions() {
    	const $all = $('#ips-checklist input[type="checkbox"]');
    	$all.prop('disabled', false);
    	const $noteBox = $('#ips-checklist input[value="note-or-comment"]');
    	const baseActive = $all
        	.filter(':checked')
        	.map((_, el) => el.value)
        	.get();
       	const requiresNote = baseActive.includes('close-case');
        if (requiresNote) {
        	$noteBox
            	.prop('checked', true)
            	.prop('disabled', true)
            	.data('forced', true);
        } else if ($noteBox.data('forced')) {
        	$noteBox
             	.prop('checked', false)
             	.prop('disabled', false)
             	.removeData('forced');
        }
        const active = $all
            .filter(':checked')
            .map((_, el) => el.value)
            .get();
        const toDisable = new Set();
        active.forEach(a => {
        	(disableMap[a] || []).forEach(d => toDisable.add(d));
        });
        toDisable.forEach(key => {
        	$(`#ips-checklist input[value="${key}"]`)
             	.prop('disabled', true)
             	.prop('checked', false);
            });
    }
    const modules = [
        { name: 'Ubah status kasus', key: 'change-case-status' },
        { name: 'Blokir/tandai siluman', key: 'block-and-tag' },
        { name: 'Catatan/komentar', key: 'note-or-comment' },
        { name: 'Tutup kasus', key: 'close-case' },
        { name: 'Tambahkan penanda lintas-wiki', key: 'cross-wiki' },
        { name: 'Arsipkan kasus', key: 'archive-case' }
    ];
    const $checklistContainer = $('<div>', { id: 'ips-checklist', css: { marginTop: '1em' } });
    $checklistContainer.append('<h3>Pilih aksi yang ingin dijalankan:</h3>');
    modules.forEach(mod => {
        const $label = $('<label>', { class: 'mw-ui-checkbox', css: { display: 'block', margin: '0.2em 0' } });
        $label.append(
            $('<input>', { type: 'checkbox', value: mod.key }),
            ` ${mod.name}`
        );
        $checklistContainer.append($label);
    });
    $panel.append($checklistContainer);
    $panel.on('change', 'input[name="ips-header"]', autoSyncModules);
    $panel.on('change', '#ips-checklist input[type="checkbox"]', () => {
    	updateDisabledActions();
    	autoSyncModules();
    });
    function syncModulePanels(selectedHeader, selectedModules) {
    	const $container = $('#ips-module-container');
    	$container.children().each(function() {
    		const id = $(this).attr('id');
    		const matches = id.match(/^ips-(.*?)-/);
    		if (!matches) return;
    		const modKey = matches[1];
    		if (!selectedModules.includes(modKey)) {
    			$(this).remove();
    		}
    	});
    	modules.forEach(m => {
    		if (!selectedModules.includes(m.key)) return;
    		const panelId = `ips-${m.key}-${selectedHeader.replace(/\s+/g, '-')}`;
    		if ($(`#${panelId}`).length) return;
    		$(document).trigger(`ips:open-module-${m.key}`, [selectedHeader]);
    	});
    }
    const $applyBtn = $('<button>', { text: 'Terapkan', class: 'mw-ui-button mw-ui-destructive', css: { marginTop: '0.5em' } });
    $applyBtn.on('click', async () => {
    	const selectedHeader = $('input[name="ips-header"]:checked').val();
    	if (!selectedHeader) return mw.notify('⚠️ Pilih kasus yang perlu ditangani!');
    	const selectedModules = $('#ips-checklist input:checked').map((_, el) => el.value).get();
    	if (selectedModules.length === 0) return mw.notify('⚠️ Pilih setidaknya satu aksi!');
    	try {
    		await IPSHelper.api.applyModules(selectedHeader, selectedModules);
    		mw.notify('🟢 Tindakan yang diminta telah selesai');
    	} catch (e) {
    		mw.notify(`⚠️ Terjadi kesalahan dalam menjalankan tindakan yang diminta: ${e.message}`);
    	}
    });
    $panel.append($applyBtn);
    $panel.append('<br><hr>');
    const $moduleContainer = $('<div>', { id: 'ips-module-container' });
    $panel.append($moduleContainer);
    $content.prepend($panel);
})();
// </nowiki>
