// <nowiki>
(function() {
    const moduleObj = {
        selectedStatus: {},
        summaryMap: {
            disetujui: "disetujui",
            ditolak: "ditolak",
            petugas: "menyetujui diri sendiri",
            butuhinfo: "butuh informasi",
            dalamproses: "dalam proses",
            ditunda: "ditunda",
			relisted: "didaftarkan ulang",
			pengurus: "meminta bantuan pengurus",
			diperiksa: "telah diperiksa"
        },
        buildPanel(header) {
            const panelId = `ips-change-case-status-${header.replace(/\s+/g,'-')}`;
            if ($('#' + panelId).length) return;
            const $panel = $('<div>', {
                id: panelId,
                class: 'mw-ui-panel mw-ui-progressive',
                css: { marginBottom: '0.5em', padding: '0.5em' }
            });
            const groups = mw.config.get('wgUserGroups') || [];
            let options = [];
            if (groups.includes('checkuser')) {
                options.push(
                	{ value: "", label: "-- Pilih --" },
					{ value: "diperiksa", label: "Diperiksa" },
                    { value: "butuhinfo", label: "Butuh informasi" },
                    { value: "dalamproses", label: "Dalam proses" },
                    { value: "ditunda", label: "Ditunda" },
                    { value: "ditolak", label: "Ditolak" }
                );
            } else {
            	if (!groups.includes('sysop')) {
            		options.push(
            			{ value: "", label: "-- Pilih --" },
            			{ value: "butuhinfo", label: "Butuh informasi" },
            			{ value: "disetujui", label: "Disetujui" },
            			{ value: "ditolak", label: "Ditolak" },
            			{ value: "petugas", label: "Menyetujui diri sendiri" },
            			{ value: "relisted", label: "Daftarkan ulang" },
            			{ value: "pengurus", label: "Meminta bantuan pengurus" }
            		);
            	} else {
            		options.push(
            			{ value: "", label: "-- Pilih --" },
            			{ value: "butuhinfo", label: "Butuh informasi" },
            			{ value: "disetujui", label: "Disetujui" },
            			{ value: "ditolak", label: "Ditolak" },
            			{ value: "petugas", label: "Menyetujui diri sendiri" },
            			{ value: "relisted", label: "Daftarkan ulang" }
            		);
            	}
            }
            options = options.filter((obj, i, arr) =>
                i === arr.findIndex(o => o.value === obj.value)
            );
            const $select = $('<select>', { class: 'mw-ui-input' });
            options.forEach(opt => {
                $select.append($('<option>', {
                    value: opt.value,
                    text: opt.label,
                }));
            });
            if (moduleObj.selectedStatus[header]) {
                $select.val(moduleObj.selectedStatus[header]);
            }
            $select.on('change', function() {
            	const val = $(this).val();
            	if (val !== "") {
            		$(this).find('option[value=""]').prop('disabled', true);
            	}
            	moduleObj.selectedStatus[header] = val;
            });
            $panel.append($('<h4>').text('Ubah status kasus:'));
            $panel.append($select);
            $('#ips-module-container').append($panel);
        },
        init() {
            $(document).on('ips:open-module-change-case-status', function(event, header) {
                if (!header) return mw.notify('⚠️ Kasus tidak valid!');
                moduleObj.buildPanel(header);
            });
        }
    };
    IPSHelper.register('change-case-status', moduleObj);
})();
// </nowiki>
