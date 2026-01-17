// <nowiki>
(function () {
    const moduleObj = {
        selectedUsers: {},
        init() {
            $(document).on('ips:open-module-block-and-tag', async (event, header) => {
                if (!header) return mw.notify('⚠️ Kasus tidak valid!');
                const panelId = `ips-block-and-tag-${header.replace(/\s+/g, '-')}`;
                if ($('#' + panelId).length) return;
                const $panel = $('<div>', {
                    id: panelId,
                    class: 'mw-ui-panel mw-ui-progressive',
                    css: { marginBottom: '0.5em', padding: '0.5em' }
                });
                $panel.append($('<h4>').text('Blokir / tandai siluman'));
                const users = await extractUsers(header);
                if (!moduleObj.selectedUsers[header]) {
                    moduleObj.selectedUsers[header] = {};
                }
                if (!moduleObj.selectedUsers[header]._flags) {
                    moduleObj.selectedUsers[header]._flags = {
                        reportSRG: false,
                        hideSRG: false
                    };
                }
                const flags = moduleObj.selectedUsers[header]._flags;
                const $srgDiv = $('<div>', { css: { marginTop: '0.5em' } });
                const $chkSRG = $('<input>', {
                    type: 'checkbox',
                    id: panelId + '-report-srg',
                    checked: flags.reportSRG
                });
                const $lblSRG = $('<label>', {
                    for: panelId + '-report-srg',
                    text: ' Laporkan ke Steward requests/Global (SRG)'
                });
                const $chkHide = $('<input>', {
                    type: 'checkbox',
                    id: panelId + '-hide-srg',
                    disabled: !flags.reportSRG,
                    checked: flags.hideSRG
                });
                const $lblHide = $('<label>', {
                    for: panelId + '-hide-srg',
                    text: ' Sembunyikan nama pengguna di SRG'
                });
                const $srgcomment = $('<input>', {
                	class: 'mw-ui-input',
                	placeholder: 'Tambahkan komentar di SRG (opsional)...',
                	disabled: !flags.reportSRG
                });
                $chkSRG.on('change', () => {
                	flags.reportSRG = $chkSRG.is(':checked');
                	$srgcomment.prop('disabled', !flags.reportSRG);
                	if (flags.reportSRG) {
                		$chkHide.prop('disabled', false);
                		for (const u of Object.keys(moduleObj.selectedUsers[header])) {
                			if (u === "_flags") continue;
                			moduleObj.selectedUsers[header][u].glock = true;
                			$('#' + panelId + '-row-' + u.replace(/\W/g, '') + ' .glock-user')
                			.prop('checked', true)
                			.prop('disabled', false);
                		}
                	} else {
                		$chkHide.prop({ checked: false, disabled: true });
                		flags.hideSRG = false;
                		for (const u of Object.keys(moduleObj.selectedUsers[header])) {
                			if (u === "_flags") continue;
                			moduleObj.selectedUsers[header][u].glock = false;
                			$('#' + panelId + '-row-' + u.replace(/\W/g, '') + ' .glock-user')
                			.prop('checked', false)
                			.prop('disabled', true);
                		}
                	}
                });
                $chkHide.on('change', () => {
                    flags.hideSRG = $chkHide.is(':checked');
                });
                $srgcomment.on('input', () => {
                	flags.srgComment = $srgcomment.val();
                });
                $srgDiv.append($chkSRG, $lblSRG, '<br>', $chkHide, $lblHide, '<br>', $srgcomment);
                $panel.append($srgDiv);
                const $table = $('<table>', {
                    class: 'wikitable',
                    css: { width: '100%', marginTop: '0.5em' }
                });
                $table.append(`
                    <tr>
                        <th>Pengguna</th>
                        <th>Blokir?</th>
                        <th>Tandai?</th>
                        <th>Kunci global?</th>
                    </tr>
                `);
                function appendUserRow(u) {
                    if (!moduleObj.selectedUsers[header][u]) {
                        moduleObj.selectedUsers[header][u] = {
                            block: true,
                            tag: true,
                            glock: flags.reportSRG ? true : false
                        };
                    }
                    const rowId = panelId + '-row-' + u.replace(/\W/g, '');
                    if ($('#' + rowId).length) return;
                    const d = moduleObj.selectedUsers[header][u];
                    const $row = $(`
                        <tr id="${rowId}">
                            <td>${u}</td>
                            <td><input type="checkbox" class="block-user" checked></td>
                            <td><input type="checkbox" class="tag-user" checked></td>
                            <td><input type="checkbox" class="glock-user"></td>
                        </tr>
                    `);
                    $row.find('.block-user')
                        .prop('checked', d.block)
                        .on('change', function () { d.block = this.checked; });
                    $row.find('.tag-user')
                        .prop('checked', d.tag)
                        .on('change', function () { d.tag = this.checked; });
                    $row.find('.glock-user')
                        .prop('checked', d.glock)
                        .prop('disabled', !flags.reportSRG)
                        .on('change', function () { d.glock = this.checked; });
                    $table.append($row);
                }
                users.forEach(u => appendUserRow(u));
                $panel.append($('<h5>').text('Daftar terduga siluman'));
                $panel.append($table);
                const $addDiv = $('<div>', { css: { marginTop: '1em' } });
                const $input = $('<input>', {
                    class: 'mw-ui-input',
                    placeholder: 'Tambahkan pengguna (opsional)...'
                });
                const $btnAdd = $('<button>', {
                    class: 'mw-ui-button mw-ui-progressive',
                    text: 'Tambahkan'
                });
                $btnAdd.on('click', () => {
                    const user = $input.val().trim();
                    if (!user) return;
                    appendUserRow(user);
                    $input.val('');
                });
                $addDiv.append($input, '<br>', $btnAdd);
                $panel.append($addDiv);
                $('#ips-module-container').append($panel);
            });
        }
    };
    async function extractUsers(header) {
    	const api = new mw.Api();
    	const page = mw.config.get('wgPageName');
    	const resp = await api.get({
    		action: 'query',
    		prop: 'revisions',
    		titles: page,
    		rvprop: 'content',
    		formatversion: 2
    	});
    	const text = resp.query.pages[0].revisions[0].content;
    	const headerRegex = new RegExp(
    		`(^===\\s*${header}\\s*===\\s*\\n)([\\s\\S]*?)(----<!--- Semua komentar harus ditulis DI ATAS baris ini. -->)`,
    		'm'
    	);
    	const match = text.match(headerRegex);
    	if (!match) return [];
    	const content = match[2];
    	const out = [];
    	const multiRegex = /\{\{\s*MultiCU\s*\|([^}]+)\}\}/gi;
    	let m;
    	while ((m = multiRegex.exec(content)) !== null) {
    		const params = m[1].split('|');
    		for (const p of params) {
    			const clean = p.trim().split('=');
    			if (clean.length === 1) {
    				if (clean[0]) out.push(clean[0].trim());
    			} else if (clean.length === 2) {
    				if (clean[1]) out.push(clean[1].trim());
    			}
    		}
    	}
    	return [...new Set(out)];
    }
    IPSHelper.register('block-and-tag', moduleObj);
})();
// </nowiki>
