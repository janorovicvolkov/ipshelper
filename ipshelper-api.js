// <nowiki>
window.IPSHelper.api = {
    applyModules: async function(header, modules) {
        const api = new mw.Api();
        const metaApi = new mw.ForeignApi('https://meta.wikimedia.org/w/api.php');
        const page = mw.config.get('wgPageName');
		const cfg = mw.config.get();
		const groups = cfg.wgUserGroups || [];
        const sockmaster = page.replace('Wikipedia:Investigasi_pengguna_siluman/', '').replace(/_/g, ' ');
        const resp = await api.get({ 
            action: 'query', 
            prop: 'revisions', 
            titles: page, 
            rvprop: 'content' 
        });
        const pageText = Object.values(resp.query.pages)[0].revisions[0]['*'];
        let text = pageText;
        let ads = `${IPSHelper.ads}`;
        let summary = "";
        const headerRegex = new RegExp(
        	`(^===\\s*${header}\\s*===\\s*\\n)([\\s\\S]*?)(----<!--- Semua komentar harus ditulis DI ATAS baris ini. -->)`,
        	'm'
        );
        const match = text.match(headerRegex);
        let headerStart = match[1];
        let headerContent = match[2];
        let headerEnd = match[3];
        /**
         * +----------------------------------------+
         * Fungsi aksi modul ubah status, komentar, 
         * dan penutupan kasus
         * +----------------------------------------+
         */
        if (modules.includes('change-case-status') || 
            modules.includes('note-or-comment') || 
            modules.includes('close-case')) {
            if (modules.includes('change-case-status')) {
            	const status = IPSHelper.modules['change-case-status'].selectedStatus[header];
            	const statusmap = IPSHelper.modules['change-case-status'].summaryMap[status];
            	const regex = /{{\s*SPI case status\s*(?:\|\s*([^}]+))?\s*}}/i;
            	if (headerContent.match(regex)) {
            		headerContent = headerContent.replace(regex, `{{SPI case status|${status}}}`);
            		summary += `Mengubah status kasus ${sockmaster} (${header}) menjadi ${statusmap}`;
            	} else {
            		mw.notify('⚠️ Terjadi kesalahan ketika mengubah status kasus!');
            	}
            }
            if (modules.includes('close-case')) {
            	const regex = /{{\s*SPI case status\s*(?:\|\s*([^}]+))?\s*}}/i;
            	if (headerContent.match(regex)) {
            		headerContent = headerContent.replace(regex, `{{SPI case status|ditutup}}`);
            		summary += `Menutup kasus ${sockmaster} (${header})`;
            	} else {
            		mw.notify('⚠️ Terjadi kesalahan ketika menutup kasus!');
            	}
            }
            if (modules.includes('note-or-comment')) {
            	const comment = IPSHelper.modules['note-or-comment'].selectedTemplate[header];
            	const regex = /^\s*----<!--- Semua komentar harus ditulis DI ATAS baris ini. -->/m;
            	if (headerEnd.match(regex)) {
            		headerEnd = headerEnd.replace(regex, `${comment} ~~~~\n$&`);
            		if (modules.includes('change-case-status') || modules.includes('close-case')) {
                    	summary += `, menambahkan komentar`;	
            		} else {
            			summary += `Menambahkan komentar di kasus ${sockmaster} (${header})`;
            		}
            	} else {
            		mw.notify('⚠️ Terjadi kesalahan ketika menambahkan komentar!');
            	}
            }
            text = text.replace(headerRegex, `$1${headerContent}${headerEnd}`);
            summary += ` ${ads}`;
            await api.postWithToken('csrf', {
            	action: 'edit',
            	title: page,
            	text,
            	summary
            });
        }
        /**
         * +----------------------------------------+
         * Fungsi aksi modul pengarsipan
         * +----------------------------------------+
         */
        if (modules.includes('archive-case')) {
        	let aftertext = text.replace(headerRegex, '');
        	const arstxt = match[0];
        	const archivetitle = `Wikipedia:Investigasi pengguna siluman/${sockmaster}/Arsip`;
        	const ars = await api.get({
       			action: 'query',
       			prop: 'revisions',
       			rvprop: 'content',
       			titles: archivetitle,
       			formatversion: 2
       		});
        	const arspage = ars.query.pages[0];
        	let archivetext = (arspage.revisions && arspage.revisions[0].content) || '';
        	if (!arspage.revisions) {
        		archivetext = `__TOC__\n{{SPIarchive|${sockmaster}}}\n{{SPIpriorcases}}\n${arstxt}`;
        	} else {
        		archivetext += `\n${arstxt}`;
        	}
        	await api.postWithToken('csrf', {
            	action: 'edit',
            	title: page,
            	text: aftertext,
            	summary: `Mengarsipkan kasus yang telah ditutup ke arsip ${ads}`,
            	minor: true
            });
            await api.postWithToken('csrf', {
            	action: 'edit',
            	title: archivetitle,
            	text: archivetext,
            	summary: `Menambahkan kasus yang telah ditutup ${ads}`,
            	minor: true
            });
        }
        /**
         * +----------------------------------------+
         * Fungsi aksi modul penanda lintas-wiki
         * +----------------------------------------+
         */
        if (modules.includes('cross-wiki')) {
        	const regex = /{{\s*SPIarchive notice\s*(?:\|\s*([^}]+))?\s*}}/i;
        	text = text.replace(regex, `{{SPIarchive notice|${sockmaster}|crosswiki=yes}}`);
        	await api.postWithToken('csrf', {
            	action: 'edit',
            	title: page,
            	text: text,
            	summary: `Menandai kasus ${sockmaster} menjadi kasus penyalahgunaan lintas-wiki ${ads}`,
            	minor: true
            });
        }
        /**
         * +----------------------------------------+
         * Fungsi aksi modul pemblokiran dan 
         * dan penandaan
         * +----------------------------------------+
         */
         if (modules.includes('block-and-tag')) {
         	const selected = IPSHelper.modules['block-and-tag'].selectedUsers[header] || {};
         	const flags = selected._flags || { reportSRG: false, hideSRG: false };
         	const users = Object.keys(selected)
         	.filter(u => u !== "_flags")
         	.map(u => u.trim());
         	for (const uRaw of users) {
         		const u = uRaw.replace(/^User:/i, '').trim();
         		const conf = selected[u];    // { block: true / false, tag: true / false, glock: true / false }
         		if (!conf) continue;
         		const isSockmaster = (u.toLowerCase() === sockmaster.toLowerCase());
         		const reason = `[[w:id:Wikipedia:Pengguna siluman#Akun boneka yang dilarang|Menyalahgunakan beberapa akun]]: [[w:id:Wikipedia:Investigasi pengguna siluman/${sockmaster}]]`;
         		if (conf.block) {
         			if (!isSockmaster) {
               			await api.postWithEditToken({
            				action: 'block',
            				user: u,
            				expiry: 'indefinite',
            				reason,
            				nocreate: true,
            				autoblock: true,
            				allowusertalk: false,
            				noemail: true
            			});
         			} if (isSockmaster) {
               			await api.postWithEditToken({
            				action: 'block',
            				user: u,
            				expiry: 'indefinite',
            				reason,
            				nocreate: true,
            				autoblock: true,
            				allowusertalk: true,
            				noemail: false
            			});
         			}
         		}
         		if (conf.tag) {
         			let prepend;
         			if (!isSockmaster) {
						if (groups.includes('checkuser')) {
         		    		prepend = `{{Sockpuppet|${sockmaster}|confirmed}}\n`;
						} else {
							prepend = `{{Sockpuppet|${sockmaster}|proven}}\n`
						}
         				await api.postWithEditToken({
         	    			action: 'edit',
             				title: `Pengguna:${u}`,
            				prependtext: prepend,
            				summary: `Menandai ${u} sebagai akun siluman ${sockmaster} ${ads}`,
            				minor: true
             			});
         				await api.postWithEditToken({
         					action: 'edit',
         					title: `Pembicaraan Pengguna:${u}`,
         					text: `== Pemblokiran sebagai akun siluman ${sockmaster} ==\n\n{{subst:SockBlock|master=${sockmaster}|blocked=yes|notalk=yes|sig=yes}}`,
         					summary: `Pemberitahuan pemblokiran sebagai akun siluman ${sockmaster} ${ads}`,
         					minor: true
         				});
         			} if (isSockmaster) {
						if (groups.includes('checkuser')) {
							prepend = `{{Sockpuppeteer|blocked|checked=yes}}\n`;
						} else {
							prepend = `{{Sockpuppeteer|blocked}}\n`;
						}
         				await api.postWithEditToken({
             				action: 'edit',
            				title: `Pengguna:${u}`,
            				prependtext: prepend,
            				summary: `Menandai ${u} sebagai pengendali siluman ${ads}`,
            				minor: true
            			});
         				await api.postWithEditToken({
         					action: 'edit',
         					title: `Pembicaraan Pengguna:${u}`,
         					text: `== Pemblokiran sebagai pengendali akun siluman ==\n\n{{subst:SockmasterProven|sig=yes}}`,
         					summary: `Pemberitahuan pemblokiran sebagai pengendali akun siluman ${ads}`,
         					minor: true
         				});
         			}
         		}
         	}
         	if (flags.reportSRG) {
       			const hideuser = flags.hideSRG;
       			const srgcomment = flags.srgComment;
       			const glockUsers = users.filter(u => selected[u].glock);
       			if (glockUsers.length === 0) return;
       			let total = glockUsers.length;
       			const hasSockmaster = glockUsers.some(u => u.toLowerCase() === sockmaster.toLowerCase());
       			const others = glockUsers.filter(u => u.toLowerCase() !== sockmaster.toLowerCase());
       			let count = hasSockmaster ? total - 1 : total;
       			let multilockTemplate = "";
       			let summary = "";
       			let heading = "";
       			let comment = "";
           		if (hideuser) {
           			heading = `=== Global lock ===`;
           			if (hasSockmaster) {
           				multilockTemplate = `* {{Multilock|${[sockmaster, ...others].map((u) => `${u}`).join('|')}|hidename=1}}`;
           				if (count === 0) {
           		    		summary = `Global lock request for a sock ${ads}`;
           		    		comment = `Sockpuppet found in idwiki sockpuppet investigations, see [[w:id:Wikipedia:Investigasi pengguna siluman/${sockmaster}]]. Abusive username.`;
           				} else if (glockUsers.length > 1) {
           		     		summary = `Global lock request for ${count} socks ${ads}`;
           	    			comment = `Sockpuppets found in idwiki sockpuppet investigations, see [[w:id:Wikipedia:Investigasi pengguna siluman/${sockmaster}]]. Abusive usernames.`;
           				}
          			} else {
          			    if (glockUsers.length === 1) {
            				multilockTemplate = `* {{LockHide|1=${others}|hidename=1}}`;
            				summary = `Global lock request for a sock ${ads}`;
            				comment = `Sockpuppet found in idwiki sockpuppet investigations, see [[w:id:Wikipedia:Investigasi pengguna siluman/${sockmaster}]]. Abusive username.`;
          			    } else if (glockUsers.length > 1) {
             				multilockTemplate = `* {{Multilock|${others.map((u) => `${u}`).join('|')}|hidename=1}}`;
             				summary = `Global lock request for ${count} socks ${ads}`;
          			        comment = `Sockpuppets found in idwiki sockpuppet investigations, see [[w:id:Wikipedia:Investigasi pengguna siluman/${sockmaster}]]. Abusive usernames.`;
          			    }
          			}
           		} else {
           			if (hasSockmaster) {
           				multilockTemplate = `* {{Multilock|${[sockmaster, ...others].map((u) => `${u}`).join('|')}}}`;
           				if (count === 0) {
       			    		heading = `=== Global lock for [[Special:CentralAuth/${sockmaster}|${sockmaster}]] sock ===`;
            	    		summary = `Global lock request for [[Special:CentralAuth/${sockmaster}|${sockmaster}]] sock ${ads}`;
                    		comment = `Sockpuppet found in idwiki sockpuppet investigations, see [[w:id:Wikipedia:Investigasi pengguna siluman/${sockmaster}]].`;
           				} else {
           					heading = `=== Global lock for [[Special:CentralAuth/${sockmaster}|${sockmaster}]] socks ===`;
           					summary = `Global lock request for ${count} [[Special:CentralAuth/${sockmaster}|${sockmaster}]] socks ${ads}`;
           					comment = `Sockpuppets found in idwiki sockpuppet investigations, see [[w:id:Wikipedia:Investigasi pengguna siluman/${sockmaster}]].`;
           				}
          			} else {
          				if (glockUsers.length === 1) {
              		        multilockTemplate = `* {{LockHide|1=${others}}}`;
             		        heading = `=== Global lock for [[Special:CentralAuth/${sockmaster}|${sockmaster}]] sock ===`;
                			summary = `Global lock request for [[Special:CentralAuth/${sockmaster}|${sockmaster}]] sock ${ads}`;
                     		comment = `Sockpuppet found in idwiki sockpuppet investigations, see [[w:id:Wikipedia:Investigasi pengguna siluman/${sockmaster}]].`;
          				} else if (glockUsers.length > 1) {
          					multilockTemplate = `* {{Multilock|${others.map((u) => `${u}`).join('|')}}}`;
          					heading = `=== Global lock for [[Special:CentralAuth/${sockmaster}|${sockmaster}]] socks ===`;
          					summary = `Global lock request for ${count} [[Special:CentralAuth/${sockmaster}|${sockmaster}]] socks ${ads}`;
          					comment = `Sockpuppets found in idwiki sockpuppet investigations, see [[w:id:Wikipedia:Investigasi pengguna siluman/${sockmaster}]].`;
          				}
          			}
           		}
           		if (srgcomment) {
           			comment += ` ${srgcomment} --~~~~`;
           		} else {
           			comment += ' --~~~~';
           		}
           		const pageTitle = "Steward requests/Global";
           		const metaText = await metaApi.get({
           			action: "query",
           			prop: "revisions",
           			rvprop: "content",
           			titles: pageTitle,
           			formatversion: 2
           		});
           		let metaContent = metaText.query.pages[0].revisions[0].content || '';
           		const seeAlsoIndex = metaContent.indexOf("== See also ==");
       			const before = metaContent.slice(0, seeAlsoIndex).trimEnd();
       			const after = metaContent.slice(seeAlsoIndex);
       			if (glockUsers.length > 7) {
       	    		metaContent = `${before}\n${heading}\n{{Status}}\n{{Collapse top|Users list}}\n${multilockTemplate}\n{{Collapse bottom}}\n${comment}\n${after}`;
       	    	} else {
       	    		metaContent = `${before}\n${heading}\n{{Status}}\n${multilockTemplate}\n${comment}\n${after}`;
       	    	}
      			await metaApi.postWithToken("csrf", {
       				action: "edit",
       				title: pageTitle,
       				text: metaContent,
       				summary
        		});
       		}
        }
    }
};
// </nowiki>
