// <nowiki>
(function() {
    const moduleObj = {
        selectedTemplate: {},
        init() {
            $(document).on('ips:open-module-note-or-comment', function(event, header) {
                if (!header) return mw.notify('⚠️ Kasus tidak valid!');
                const panelId = `ips-note-or-comment-${header.replace(/\s+/g,'-')}`;
                if ($('#' + panelId).length) return;
                const $panel = $('<div>', {
                    id: panelId,
                    class: 'mw-ui-panel mw-ui-progressive',
                    css: { marginBottom: '0.5em', padding: '0.5em' }
                });
                $panel.append($('<h4>').text('Tambahkan catatan / komentar:'));
                const groups = mw.config.get('wgUserGroups') || [];
                let templates = [
                    { name: '--- Pilih ---', value: '' },
					{ name: 'Ditandai', value: '{{Ditandai}}'},
                    { name: 'Aksi dan tutup', value: '{{Aksi dan tutup}}' },
                    { name: 'Penguncian global telah diminta', value: '{{Glr}}' },
                    { name: 'Tidak mungkin', value: '{{Impossible}}' },
                    { name: 'Menolak (IP / Akun sementara)', value: '{{Decline-IP}}' }
                ];
                if (groups.includes('sysop')) {
                    templates.push(
						{ name: 'Catatan petugas', value: '{{Clerk-Note}}'},
						{ name: 'Mendukung', value: '{{Endorse}}' },
                        { name: 'Menolak', value: '{{Decline}}' },
						{ name: 'Diblokir dan ditandai', value: '{{Bnt}}' },
						{ name: 'Diblokir dan ditandai. Kasus ditutup', value: '{{Diblokir dan ditandai+}}'},
						{ name: 'Diblokir tanpa ditandai', value: '{{Diblokir tanpa ditandai}}'},
                        { name: 'IP diblokir', value: '{{IPblock}}' },
                        { name: 'Rentang IP diblokir', value: '{{Rblock}}' },
                        { name: 'Bebek', value: '{{Bebek}}' }
                    );
                } else if (groups.includes('checkuser')) {
                    templates.push(
						{ name: 'Catatan pemeriksa', value: '{{CUnote}}' },
						{ name: 'Diblokir dan ditandai', value: '{{Bnt}}' },
						{ name: 'Diblokir dan ditandai. Kasus ditutup', value: '{{Diblokir dan ditandai+}}'},
						{ name: 'Diblokir tanpa ditandai', value: '{{Diblokir tanpa ditandai}}'},
                        { name: 'Terkonfirmasi', value: '{{Confirmed}}' },
                        { name: 'Sepertinya berhubungan', value: '{{Likely}}' },
                        { name: 'Bisa jadi', value: '{{Possible}}' },
                        { name: 'Sepertinya tidak berhubungan', value: '{{Unlikely}}' },
                        { name: 'Sepertinya bisa jadi berhubungan', value: '{{Possilikely}}' },
                        { name: 'Tidak konklusif', value: '{{Inkonklusif}}' }
                    );
                } else {
					templates.push(
						{ name: 'Catatan petugas', value: '{{Clerk-Note}}'},
						{ name: 'Mendukung', value: '{{Endorse}}' },
                        { name: 'Menolak', value: '{{Decline}}' },
                        { name: 'Bebek', value: '{{Bebek}}' }
                    );
				}
                const $select = $('<select>', { class: 'mw-ui-input' });
                templates.forEach(t => $select.append($('<option>', { value: t.value, text: t.name })));
                $panel.append($('<label>').text('Tambahkan templat (otomatis tanpa mengetik manual): ').append($select));
                const $textarea = $('<textarea>', {
                    class: 'mw-ui-input',
                    rows: 4,
                    css: { width: '100%', marginTop: '0.5em' }
                }).val('*');
                $panel.append($('<br>')).append($textarea);
                $select.on('change', function() {
                    const val = $(this).val();
                    const cur = $textarea.val();
                    $textarea.val(cur + ' ' + val);
                    moduleObj.selectedTemplate[header] = $textarea.val();
                });
                $textarea.on('input', function() {
                	moduleObj.selectedTemplate[header] = $(this).val();
                });
                if (moduleObj.selectedTemplate[header]) {
                    $textarea.val(moduleObj.selectedTemplate[header]);
                }
                $('#ips-module-container').append($panel);
            });
        }
    };
    IPSHelper.register('note-or-comment', moduleObj);
})();
// </nowiki>
