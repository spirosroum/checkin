// =====================================================================
// app-members.js
// App methods: generateRandomId, setDirectorySort, switchDirStatus, renderMemberDirectory, renderColumnConfigurator, toggleColumn, dragStart, dragOver, drop, renderMemberBin, restoreMember, deleteBinMember, exportFields, openExportModal, toggleExportField, toggleAllExportFields, exportMembersToExcel, massFreeze, massUnfreeze, openMemberModal, applyPlan, updateBeltColor, saveMember, deleteMemberFromModal, clearMemberDebt
// Plain script (no ES modules). Methods attach to the global App object
// created in app-core.js. Load order is fixed in index.html.
// =====================================================================
Object.assign(App, {
            // --- ADMIN MEMBERS DIRECTORY ---
            // ── Export Members to Excel (CSV) ──────────────────────────
            generateRandomId: () => {
                const members = DB.getMembers();
                let newId;
                while (true) {
                    newId = Math.floor(1000 + Math.random() * 9000).toString();
                    if (!members.find(m => m.id === newId)) break;
                }
                return newId;
            },

            setDirectorySort: (colId) => {
                if (App.dirSortCol === colId) { App.dirSortAsc = !App.dirSortAsc; } 
                else { App.dirSortCol = colId; App.dirSortAsc = true; }
                App.renderMemberDirectory();
            },

            switchDirStatus: (status) => {
                App.dirStatus = status;
                document.querySelectorAll('.tab-link-members').forEach(el => el.classList.remove('active'));
                const link = document.getElementById(`tab-link-members-${status}`);
                if (link) link.classList.add('active');
                document.querySelectorAll('.tab-content-members').forEach(el => el.classList.add('hidden'));
                const content = document.getElementById('tab-content-members-directory');
                if (content) content.classList.remove('hidden');
                App.renderMemberDirectory();
            },

            searchMemberDirectory: () => {
                const query = document.getElementById('member-directory-search').value.trim();
                if (query) {
                    App.switchTab('members', 'directory');
                }
                App.renderMemberDirectory();
            },

            clearMemberSearch: () => {
                const input = document.getElementById('member-directory-search');
                if (input) input.value = '';
                App.renderMemberDirectory();
            },

            renderMemberDirectory: () => {
                const members = DB.getMembers();
                const visits = DB.getVisits();
                const query = document.getElementById('member-directory-search').value.toLowerCase().trim();
                const activeCols = App.columnsConfig.filter(c => c.checked);

                // Setup headers based on active columns
                const headers = document.getElementById('directory-headers');
                let headersHTML = activeCols.map(c => {
                    const isSorted = App.dirSortCol === c.id;
                    const arrow = isSorted ? (App.dirSortAsc ? ' ↑' : ' ↓') : '';
                    return `<th class="sortable" onclick="App.setDirectorySort('${c.id}')">${c.label}${arrow}</th>`;
                }).join('');
                headersHTML += '<th>Action</th>';
                headers.innerHTML = headersHTML;
                
                // Filter members by query — match ID, first/last name, the combined
                // "First Last" (and "Last First") full name, phone, or email.
                let filtered = members.filter(m => {
                    if (!query) return true;
                    const fullName = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
                    const revName = `${m.lastName || ''} ${m.firstName || ''}`.toLowerCase();
                    return (m.id || '').toLowerCase().includes(query)
                        || (m.firstName || '').toLowerCase().includes(query)
                        || (m.lastName || '').toLowerCase().includes(query)
                        || fullName.includes(query)
                        || revName.includes(query)
                        || (m.phone && m.phone.includes(query))
                        || (m.email && m.email.toLowerCase().includes(query));
                });

                // Filter by selected status submenu (active / inactive / frozen).
                // When searching, ignore status so frozen/inactive members still show up.
                const dirStatus = App.dirStatus || 'active';
                if (!query && dirStatus === 'active') {
                    filtered = filtered.filter(m => (m.accountStatus || 'Active') === 'Active');
                } else if (!query && dirStatus === 'inactive') {
                    filtered = filtered.filter(m => (m.accountStatus || 'Active') === 'Inactive');
                } else if (!query && dirStatus === 'frozen') {
                    filtered = filtered.filter(m => (m.accountStatus || 'Active') === 'Frozen');
                }

                // While a search is active the status sub-filter is ignored, so drop the
                // status tab highlight to avoid implying the results belong to one status.
                document.querySelectorAll('.tab-link-members').forEach(el => el.classList.remove('active'));
                if (!query) {
                    const statusTab = document.getElementById(`tab-link-members-${dirStatus}`);
                    if (statusTab) statusTab.classList.add('active');
                }

                // Show a friendly summary + clear button while searching
                const hintEl = document.getElementById('member-search-hint');
                const hintTextEl = document.getElementById('member-search-hint-text');
                if (hintEl && hintTextEl) {
                    if (query) {
                        hintEl.classList.remove('hidden');
                        hintTextEl.innerHTML = `Found <strong>${filtered.length}</strong> member${filtered.length === 1 ? '' : 's'} matching &quot;<strong>${Utils.escapeHTML(query)}</strong>&quot; — includes all statuses.`;
                    } else {
                        hintEl.classList.add('hidden');
                    }
                }

                filtered.sort((a, b) => {
                    let valA, valB;
                    switch(App.dirSortCol) {
                        case 'name': {
                            const aLast = (a.lastName || '').toLowerCase();
                            const bLast = (b.lastName || '').toLowerCase();
                            if (aLast !== bLast) { valA = aLast; valB = bLast; break; }
                            valA = (a.firstName || '').toLowerCase();
                            valB = (b.firstName || '').toLowerCase();
                            break;
                        }
                        case 'id': {
                            // ID and Belt were merged into one column — clicking the ID header
                            // sorts by belt rank (white → black) first, then by numeric ID.
                            const beltOrder = { 'white': 0, 'blue': 1, 'purple': 2, 'brown': 3, 'black': 4 };
                            const beltA = beltOrder[(a.belt || 'White').split('/')[0].trim().toLowerCase()] ?? 99;
                            const beltB = beltOrder[(b.belt || 'White').split('/')[0].trim().toLowerCase()] ?? 99;
                            if (beltA !== beltB) { valA = beltA; valB = beltB; break; }
                            const na = parseInt(a.id, 10), nb = parseInt(b.id, 10);
                            if (!isNaN(na) && !isNaN(nb)) { valA = na; valB = nb; break; }
                            valA = a.id; valB = b.id;
                            break;
                        }
                        case 'belt': {
                            const beltOrder = { 'white': 0, 'blue': 1, 'purple': 2, 'brown': 3, 'black': 4 };
                            valA = beltOrder[(a.belt || 'White').split('/')[0].trim().toLowerCase()] ?? 99;
                            valB = beltOrder[(b.belt || 'White').split('/')[0].trim().toLowerCase()] ?? 99;
                            break;
                        }
                        case 'gender': valA = a.gender || ''; valB = b.gender || ''; break;
                        case 'age': valA = a.dob ? new Date(a.dob).getTime() : 0; valB = b.dob ? new Date(b.dob).getTime() : 0; break;
                        case 'status': valA = a.accountStatus; valB = b.accountStatus; break;
                        case 'exp': valA = a.expirationDate ? new Date(a.expirationDate).getTime() : 0; valB = b.expirationDate ? new Date(b.expirationDate).getTime() : 0; break;
                        case 'last-visit': 
                            const vA = visits.filter(v=>v.memberId===a.id).sort((x,y)=>new Date(y.entryTime)-new Date(x.entryTime))[0];
                            const vB = visits.filter(v=>v.memberId===b.id).sort((x,y)=>new Date(y.entryTime)-new Date(x.entryTime))[0];
                            valA = vA ? new Date(vA.entryTime).getTime() : 0;
                            valB = vB ? new Date(vB.entryTime).getTime() : 0;
                            break;
                        default: valA = a.id; valB = b.id;
                    }
                    if (typeof valA === 'string' && typeof valB === 'string') {
                        const cmp = valA.localeCompare(valB, ['el', 'en']);
                        if (cmp !== 0) return App.dirSortAsc ? cmp : -cmp;
                        return 0;
                    }
                    if (valA < valB) return App.dirSortAsc ? -1 : 1;
                    if (valA > valB) return App.dirSortAsc ? 1 : -1;
                    return 0;
                });
                
                const list = document.getElementById('member-directory-list');
                list.innerHTML = filtered.map(m => {
                    // Member-level expiration and sessions state
                    const isMemberExpired = m.expirationDate ? Utils.getDaysRemaining(m.expirationDate) < 0 : false;
                    const isOutOfSessions = m.sessionsTotal && parseInt(m.sessionsLeft) <= 0;

                    let statBadge = '';
                    if (m.accountStatus === 'Frozen') statBadge = `<span class="badge badge-frozen">Frozen</span>`;
                    else if (m.accountStatus === 'Inactive') statBadge = `<span class="badge badge-inactive">Inactive</span>`;
                    else if (isMemberExpired) statBadge = `<span class="badge badge-inactive">Expired</span>`;
                    else if (isOutOfSessions) statBadge = `<span class="badge badge-warning">No sessions</span>`;
                    else statBadge = `<span class="badge badge-active">Active</span>`;

                    let rowHTML = '';
                    activeCols.forEach(c => {
                        switch(c.id) {
                            case 'name': rowHTML += `<td data-label="${c.label}"><strong>${Utils.escapeHTML(m.firstName)} ${Utils.escapeHTML(m.lastName)}</strong></td>`; break;
                            case 'id': rowHTML += `<td data-label="${c.label}">${Utils.getMemberIdBadge(m)}</td>`; break;
                            case 'gender': rowHTML += `<td data-label="${c.label}">${Utils.escapeHTML(m.gender || 'Unspecified')}</td>`; break;
                            case 'age': rowHTML += `<td data-label="${c.label}">${Utils.calcAge(m.dob)}</td>`; break;
                            case 'phone': rowHTML += `<td data-label="${c.label}">${Utils.escapeHTML(m.phone || 'N/A')}</td>`; break;
                            case 'status': rowHTML += `<td data-label="${c.label}">${statBadge}</td>`; break;
                            case 'exp': {
                                // For session-only packages with no validity days, prefer showing a blank expiration field
                                let expDisplay = '';
                                if (m.expirationDate) expDisplay = Utils.formatDate(m.expirationDate);
                                else if (!m.sessionsTotal) expDisplay = 'N/A';
                                else expDisplay = '';
                                rowHTML += `<td data-label="${c.label}">${expDisplay}</td>`;
                                break;
                            }
                            case 'last-visit':
                                const lv = visits.filter(v=>v.memberId===m.id).sort((x,y)=>new Date(y.entryTime)-new Date(x.entryTime))[0];
                                rowHTML += `<td data-label="${c.label}">${lv ? Utils.formatDate(lv.entryTime) : 'Never'}</td>`;
                                break;
                        }
                    });

                    return `
                    <tr class="${(isMemberExpired || isOutOfSessions) && m.accountStatus !== 'Frozen' ? 'bg-red-50' : ''}">
                        ${rowHTML}
                        <td data-label="Action" class="cell-actions"><button class="btn-primary btn-small" onclick="App.openMemberModal('${m.id}')">Manage</button></td>
                    </tr>
                `}).join('') || `<tr><td colspan="${activeCols.length + 1}" class="text-center text-gray">${query ? `No members found matching &quot;${Utils.escapeHTML(query)}&quot;.` : 'No members found.'}</td></tr>`;
            },

            renderColumnConfigurator: () => {
                const container = document.getElementById('column-order-container');
                if(!container) return;
                
                container.innerHTML = App.columnsConfig.map((col, idx) => `
                    <label draggable="true" ondragstart="App.dragStart(${idx})" ondragover="App.dragOver(event)" ondrop="App.drop(${idx})" ondragenter="event.preventDefault()">
                        <input type="checkbox" ${col.checked ? 'checked' : ''} onchange="App.toggleColumn(${idx}, this.checked)"> ${col.label}
                    </label>
                `).join('');
            },

            toggleColumn: (idx, isChecked) => {
                App.columnsConfig[idx].checked = isChecked;
                App.renderMemberDirectory();
            },

            dragStart: (idx) => { App.draggedColIndex = idx; },
            dragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; },
            drop: (targetIdx) => {
                const srcIdx = App.draggedColIndex;
                if (srcIdx === null || srcIdx === targetIdx) return;
                const item = App.columnsConfig.splice(srcIdx, 1)[0];
                App.columnsConfig.splice(targetIdx, 0, item);
                App.renderColumnConfigurator();
                App.renderMemberDirectory();
            },

            renderMemberBin: () => {
                const bin = DB.getBin();
                document.getElementById('member-bin-list').innerHTML = bin.map(m => `
                    <tr>
                        <td data-label="ID">${Utils.getMemberIdBadge(m)}</td>
                        <td data-label="Name">${Utils.escapeHTML(m.firstName)} ${Utils.escapeHTML(m.lastName)}</td>
                        <td data-label="Deleted Date">${Utils.formatDate(m.deletedAt)}</td>
                        <td data-label="Action" class="cell-actions">
                            <div class="flex gap-1">
                                <button class="btn-success btn-small" onclick="App.restoreMember('${m.id}')">Restore</button>
                                <button class="btn-danger btn-small" onclick="App.deleteBinMember('${m.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="4" class="text-center text-gray">Recycle bin empty.</td></tr>';
            },

            restoreMember: (id) => {
                const bin = DB.getBin();
                const idx = bin.findIndex(m => m.id === id);
                if (idx > -1) {
                    const members = DB.getMembers();
                    if (members.find(m => m.id === id)) return alert('A member with this ID already exists. Cannot restore.');
                    members.push(bin[idx]);
                    DB.saveMembers(members);
                    bin.splice(idx, 1);
                    DB.saveBin(bin);
                    App.renderMemberDirectory();
                    App.renderMemberBin();
                }
            },
            
            deleteBinMember: (id) => {
                if(confirm('Permanently delete member?')) {
                    DB.saveBin(DB.getBin().filter(m => m.id !== id));
                    App.renderMemberBin();
                }
            },

            exportFields: [
                { id: 'id', label: 'ID', checked: true, getter: m => m.id },
                { id: 'firstName', label: 'First Name', checked: true, getter: m => m.firstName || '' },
                { id: 'lastName', label: 'Last Name', checked: true, getter: m => m.lastName || '' },
                { id: 'belt', label: 'Belt', checked: true, getter: m => m.belt || 'White' },
                { id: 'gender', label: 'Gender', checked: false, getter: m => m.gender || '' },
                { id: 'dob', label: 'Date of Birth', checked: false, getter: m => m.dob || '' },
                { id: 'age', label: 'Age', checked: false, getter: m => Utils.calcAge(m.dob) },
                { id: 'phone', label: 'Phone', checked: true, getter: m => m.phone || '' },
                { id: 'email', label: 'Email', checked: true, getter: m => m.email || '' },
                { id: 'accountStatus', label: 'Account Status', checked: true, getter: m => m.accountStatus || '' },
                { id: 'expirationDate', label: 'Expiration Date', checked: false, getter: m => m.expirationDate ? Utils.formatDate(m.expirationDate) : '' },
                { id: 'notes', label: 'Notes', checked: false, getter: m => m.notes || '' },
            ],

            openExportModal: () => {
                const container = document.getElementById('export-fields-container');
                container.innerHTML = App.exportFields.map((f, i) => `
                    <label style="display: flex; align-items: center; gap: 0.6rem; padding: 0.55rem 0.85rem; background: ${f.checked ? '#dbeafe' : 'var(--gray-light)'}; border-radius: 999px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: 0.2s; border: 2px solid ${f.checked ? 'var(--primary)' : 'transparent'}; user-select: none;">
                        <input type="checkbox" ${f.checked ? 'checked' : ''} onchange="App.toggleExportField(${i}, this.checked)" style="display:none;">
                        <span style="color: ${f.checked ? 'var(--primary)' : 'var(--dark)'};">${f.label}</span>
                    </label>
                `).join('');
                container.style.display = 'flex';
                container.style.flexWrap = 'wrap';
                container.style.gap = '0.5rem';
                App.openModal('modal-export');
            },

            toggleExportField: (index, checked) => {
                App.exportFields[index].checked = checked;
                App.openExportModal(); // re-render pills
            },

            toggleAllExportFields: (state) => {
                App.exportFields.forEach(f => f.checked = state);
                App.openExportModal(); // re-render pills
            },

            exportMembersToExcel: () => {
                const selected = App.exportFields.filter(f => f.checked);
                if (selected.length === 0) return alert('Please select at least one field to export.');

                const members = DB.getMembers();
                if (members.length === 0) return alert('No members to export.');

                // CSV escape helper: neutralize spreadsheet formulas (=, +, -, @) that
                // Excel/LibreOffice would otherwise execute when the file is opened.
                const esc = (val) => {
                    let str = String(val == null ? '' : val);
                    if (/^[=+\-@\t\r]/.test(str)) str = "'" + str;
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return '"' + str.replace(/"/g, '""') + '"';
                    }
                    return str;
                };

                // Build CSV
                const header = selected.map(f => esc(f.label)).join(',');
                const rows = members.map(m => selected.map(f => esc(f.getter(m))).join(','));
                const csv = '\uFEFF' + header + '\n' + rows.join('\n'); // UTF-8 BOM for Excel compat

                // Trigger download
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `members_export_${Utils.todayLocalIso()}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                App.closeModal('modal-export');
            },

            massFreeze: () => {
                if(!confirm('Are you sure you want to FREEZE ALL currently active members? Expired members will not be affected.')) return;
                const members = DB.getMembers();
                let count = 0;
                members.forEach(m => {
                    const daysLeft = Utils.getDaysRemaining(m.expirationDate);
                    if (daysLeft >= 0 && m.accountStatus === 'Active') {
                        m.accountStatus = 'Frozen';
                        count++;
                    }
                });
                DB.saveMembers(members);
                App.renderMemberDirectory();
                alert(`Successfully froze ${count} active members.`);
            },

            massUnfreeze: () => {
                if(!confirm('Are you sure you want to UNFREEZE ALL currently frozen members?')) return;
                const members = DB.getMembers();
                let count = 0;
                members.forEach(m => {
                    if (m.accountStatus === 'Frozen') {
                        m.accountStatus = 'Active';
                        count++;
                    }
                });
                DB.saveMembers(members);
                App.renderMemberDirectory();
                alert(`Successfully unfroze ${count} members.`);
            },

            openMemberModal: (id = null) => {
                document.getElementById('member-form').reset();
                document.getElementById('form-original-id').value = '';
                document.getElementById('btn-delete-member').classList.add('hidden');
                document.getElementById('admin-member-calendar-wrapper').classList.add('hidden');
                document.getElementById('admin-member-payments-wrapper').classList.add('hidden');
                document.getElementById('admin-member-stats').innerHTML = '';
                App.updateBeltColor(document.getElementById('form-belt'));
                
                const planSelect = document.getElementById('form-plan-select');
                planSelect.innerHTML = '<option value="">-- Custom/No Plan Update --</option>' + DB.getPlans().map(p => `<option value="${p.id}">${Utils.escapeHTML(p.name)} - ${DB.getCurrency()}${p.price}</option>`).join('');

                if (id) {
                    const m = DB.getMembers().find(x => x.id === id);
                    if (m) {
                        document.getElementById('modal-title').innerText = 'Edit Member Profile';
                        document.getElementById('form-original-id').value = m.id;
                        document.getElementById('form-member-id').value = m.id;
                        document.getElementById('form-first-name').value = m.firstName;
                        document.getElementById('form-last-name').value = m.lastName;
                        document.getElementById('form-dob').value = m.dob || '';
                        document.getElementById('form-belt').value = m.belt ? m.belt.split('/')[0].trim() : 'White';
                        document.getElementById('form-gender').value = m.gender || 'Unspecified';
                        document.getElementById('form-phone').value = m.phone || '';
                        document.getElementById('form-email').value = m.email || '';
                        document.getElementById('form-expiration').value = m.expirationDate || '';
                        document.getElementById('form-account-status').value = m.accountStatus || 'Active';
                        document.getElementById('form-notes').value = m.notes || '';
                        document.getElementById('form-start-date').value = Utils.todayLocalIso();
                        document.getElementById('btn-delete-member').classList.remove('hidden');
                        document.getElementById('admin-member-calendar-wrapper').classList.remove('hidden');
                        document.getElementById('admin-member-payments-wrapper').classList.remove('hidden');
                        
                        const expInput = document.getElementById('form-expiration');
                        expInput.style.backgroundColor = (Utils.getDaysRemaining(m.expirationDate) < 0) ? '#fee2e2' : '#dcfce7';

                        if(m.sessionsTotal) {
                            document.getElementById('member-sessions-wrapper').style.display = 'flex';
                            document.getElementById('form-sessions-left').value = m.sessionsLeft;
                        } else {
                            document.getElementById('member-sessions-wrapper').style.display = 'none';
                        }
                        
                        const unpaidVisits = DB.getVisits().filter(v => v.memberId === m.id && v.isUnpaid).sort((a,b)=>new Date(b.entryTime)-new Date(a.entryTime));
                        const unpaidCount = unpaidVisits.length;
                        const warnDiv = document.getElementById('member-unpaid-warning');
                        const unpaidAnalyticEl = document.getElementById('member-unpaid-analytic');
                        if (unpaidCount > 0) {
                            warnDiv.innerHTML = `<div class="kiosk-msg danger mt-1">This member has ${unpaidCount} unpaid trainings on record!</div>`;
                            // Build an analytical list of unpaid training dates for staff to review
                            unpaidAnalyticEl.innerHTML = `<strong>Unpaid Training Dates:</strong><ul style="margin-top:6px; padding-left:18px;">` + unpaidVisits.map(v => `<li>${Utils.formatDate(v.entryTime)} ${Utils.formatTime(v.entryTime)}</li>`).join('') + `</ul>`;
                            document.getElementById('btn-clear-member-debt').classList.remove('hidden');
                        } else {
                            warnDiv.innerHTML = '';
                            unpaidAnalyticEl.innerHTML = '';
                            document.getElementById('btn-clear-member-debt').classList.add('hidden');
                        }
                         
                        App.updateBeltColor(document.getElementById('form-belt'));
                        App.renderMemberHistory(m.id, 'admin-member-personal-history');
                        App.renderMemberPayments(m.id);
                        document.getElementById('admin-member-stats').innerHTML = App.getMemberStatsHTML(m.id);
                    }
                } else {
                    document.getElementById('modal-title').innerText = 'Register New Member';
                    document.getElementById('form-member-id').value = App.generateRandomId();
                    document.getElementById('form-start-date').value = Utils.todayLocalIso();
                    document.getElementById('form-expiration').style.backgroundColor = '#fff';
                    document.getElementById('member-unpaid-warning').innerHTML = '';
                    document.getElementById('member-sessions-wrapper').style.display = 'none';
                    // Default new registrations to Inactive so they cannot check in until staff activates / applies a plan
                    const statusEl = document.getElementById('form-account-status');
                    if (statusEl) statusEl.value = 'Inactive';
                }
                App.openModal('modal-member');
            },

            applyPlan: () => {
                const planId = document.getElementById('form-plan-select').value;
                const start = document.getElementById('form-start-date').value;
                const payInput = document.getElementById('form-last-payment');
                const expInput = document.getElementById('form-expiration');
                const sessWrap = document.getElementById('member-sessions-wrapper');
                
                if (!planId) {
                    payInput.value = '0.00';
                    sessWrap.style.display = 'none';
                    return;
                }
                const plan = DB.getPlans().find(p => p.id === planId);
                if (plan && start) {
                    expInput.value = Utils.calculateExpirationDate(start, plan.days);
                    expInput.style.backgroundColor = '#dbeafe';
                    payInput.value = parseFloat(plan.price).toFixed(2);

                    if (plan.sessions) {
                        sessWrap.style.display = 'flex';
                        document.getElementById('form-sessions-left').value = plan.sessions;
                    } else {
                        sessWrap.style.display = 'none';
                        document.getElementById('form-sessions-left').value = '';
                    }
                }
            },

            updateBeltColor: (selectEl) => {
                const colors = {
                    'White': {bg: '#ffffff', text: '#1e293b'},
                    'Blue': {bg: '#1d4ed8', text: '#ffffff'},
                    'Purple': {bg: '#6b21a8', text: '#ffffff'},
                    'Brown': {bg: '#78350f', text: '#ffffff'},
                    'Black': {bg: '#0f172a', text: '#ffffff'}
                };
                const val = selectEl.value;
                if(colors[val]) {
                    selectEl.style.backgroundColor = colors[val].bg;
                    selectEl.style.color = colors[val].text;
                }
            },

            saveMember: (e) => {
                e.preventDefault();
                const members = DB.getMembers();
                const originalId = document.getElementById('form-original-id').value;
                const id = document.getElementById('form-member-id').value;
                const beltBase = document.getElementById('form-belt').value;
                
                if (originalId !== id && members.find(m => m.id === id)) {
                    return alert("Member ID already exists.");
                }
                if (originalId !== id && DB.getBin().find(m => m.id === id)) {
                    return alert("This ID belongs to a member in the Recycle Bin. Restore or permanently delete them first.");
                }

                const mData = {
                    id,
                    firstName: document.getElementById('form-first-name').value,
                    lastName: document.getElementById('form-last-name').value,
                    dob: document.getElementById('form-dob').value,
                    gender: document.getElementById('form-gender').value,
                    belt: beltBase,
                    phone: document.getElementById('form-phone').value,
                    email: document.getElementById('form-email').value,
                    expirationDate: document.getElementById('form-expiration').value,
                    accountStatus: document.getElementById('form-account-status').value,
                    notes: document.getElementById('form-notes').value,
                };

                // Add sessions tracking if visible
                const sessWrap = document.getElementById('member-sessions-wrapper');
                if (sessWrap.style.display !== 'none') {
                    mData.sessionsTotal = true;
                    mData.sessionsLeft = document.getElementById('form-sessions-left').value;
                } else {
                    mData.sessionsTotal = false;
                    mData.sessionsLeft = null;
                }

                const paymentAmt = parseFloat(document.getElementById('form-last-payment').value) || 0;
                const planId = document.getElementById('form-plan-select').value || '';

                // If a plan/payment is provided at registration, activate the account automatically
                if (paymentAmt > 0 && planId) {
                    mData.accountStatus = 'Active';
                }

                // Ensure new registrations default to Inactive when no plan/payment was provided
                if (!originalId && !(paymentAmt > 0 && planId)) {
                    mData.accountStatus = 'Inactive';
                }

                let isNewRegistration = false;
                if (!originalId) { members.push(mData); isNewRegistration = true; }
                else { const idx = members.findIndex(m => m.id === originalId); if (idx > -1) { mData.hideFromLeaderboard = !!members[idx].hideFromLeaderboard; members[idx] = mData; } }

                // If the member's ID changed, rewrite class check-ins so attendance records
                // keep following the member (visits are rewritten below by the caller paths).
                if (originalId && originalId !== id) {
                    const checkins = DB.getClassCheckins();
                    let ccChanged = false;
                    checkins.forEach(c => { if (c.memberId === originalId) { c.memberId = id; ccChanged = true; } });
                    if (ccChanged) DB.saveClassCheckins(checkins);
                }

                // Ensure new registration accountStatus is enforced based on payment+plan
                if (isNewRegistration) {
                    const mIdx = members.findIndex(m => m.id === id);
                    if (mIdx > -1) {
                        if (paymentAmt > 0 && planId) {
                            members[mIdx].accountStatus = 'Active';
                        } else {
                            members[mIdx].accountStatus = 'Inactive';
                        }
                    }
                }

                // Process automatic payment log
                if (paymentAmt > 0 && planId) {
                    const plan = DB.getPlans().find(p=>p.id === planId);
                    const payments = DB.getPayments();
                    const prevExp = '';
                    const appliedExp = mData.expirationDate || null;
                    const appliedStartDate = document.getElementById('form-start-date') ? document.getElementById('form-start-date').value : null;
                    payments.push({
                        id: 'PAY-' + Date.now(),
                        memberId: id,
                        date: Utils.todayLocalIso(),
                        amount: paymentAmt,
                        note: `System Auto-Log: Applied Plan '${plan ? plan.name : 'Unknown'}'`,
                        appliedExpiration: appliedExp,
                        appliedStartDate: appliedStartDate,
                        prevExpiration: prevExp
                    });
                    DB.savePayments(payments);

                    // Clear unpaid flags for previous unpaid visits ONLY if they fall within the new validity window
                    let visits = DB.getVisits();
                    let changed = false;
                    visits.forEach(v => { 
                        if (v.memberId === id && v.isUnpaid) { 
                            let coversVisit = true;
                            if (appliedStartDate) {
                                const visitDateObj = new Date(v.entryTime);
                                const visitYMD = visitDateObj.getFullYear() + '-' + String(visitDateObj.getMonth()+1).padStart(2,'0') + '-' + String(visitDateObj.getDate()).padStart(2,'0');
                                
                                if (visitYMD < appliedStartDate) coversVisit = false;
                                if (appliedExp && visitYMD > appliedExp) coversVisit = false;
                            }
                            
                            if (coversVisit) {
                                v.isUnpaid = false; 
                                changed = true; 
                            }
                        } 
                    });
                    if (changed) DB.saveVisits(visits);
                }

                // Update visits if ID changed
                if (originalId && originalId !== id) {
                    const visits = DB.getVisits();
                    visits.forEach(v => { if(v.memberId === originalId) v.memberId = id; });
                    DB.saveVisits(visits);
                }

                DB.saveMembers(members);

                // Debug: log saved member status to console to verify Inactive enforcement
                try {
                    const saved = DB.getMembers().find(x => x.id === id);
                    console.log('[saveMember] saved member', id, 'accountStatus=', saved ? saved.accountStatus : '(not found)', 'expirationDate=', saved ? saved.expirationDate : '(n/a)');
                } catch (e) { console.warn('[saveMember] log failed', e); }

                if(isNewRegistration) App.addNotification('New Member Registered', `${mData.firstName} ${mData.lastName} was registered manually.`, 'success', mData.id);

                App.closeModal('modal-member');
                App.renderMemberDirectory();
            },

            deleteMemberFromModal: () => {
                if(!confirm('Move this member to the Recycle Bin? (Kept for 1 year)')) return;
                const id = document.getElementById('form-original-id').value;
                if(id) {
                    const members = DB.getMembers();
                    const bin = DB.getBin();
                    const m = members.find(x => x.id === id);
                    if(m) {
                        // Mark deleted and move to bin
                        m.deletedAt = new Date().toISOString();
                        bin.push(m);

                        // Auto-checkout any active visits for this member so they are not counted as "Currently Inside"
                        const visits = DB.getVisits();
                        let updated = false;
                        visits.forEach(v => {
                            if (v.memberId === id && !v.exitTime) {
                                v.exitTime = new Date().toISOString();
                                updated = true;
                            }
                        });
                        if (updated) DB.saveVisits(visits);

                        DB.saveBin(bin);
                        DB.saveMembers(members.filter(x => x.id !== id));
                    }
                    App.closeModal('modal-member');
                    App.renderMemberDirectory();
                    App.renderMemberBin();
                    // Refresh live lists and dashboard so deleted member is not counted
                    App.renderLivePresent();
                    const dashboardPane = document.getElementById('pane-admin-dashboard');
                    if (dashboardPane && !dashboardPane.classList.contains('hidden')) App.renderAdminDashboard();
                }
            },
 
            /**
             * Clears all outstanding unpaid training visits for a given member.
             * 
             * WHY IT BEHAVES THIS WAY:
             * Staff members frequently need to forgive or clear outstanding visit debts manually.
             * To ensure debt clearance is preserved across future payment reconciliations, we set
             * `isUnpaid = false` on all currently unpaid visits AND append a zero-amount system log
             * payment containing `clearedVisitIds`. This guarantees that future reconciliation passes
             * recognise these visits as explicitly cleared and will not mark them unpaid again.
             */
            clearMemberDebt: () => {
                const memberId = document.getElementById('form-original-id').value || document.getElementById('form-member-id').value;
                if (!memberId) return;
                if (!confirm('Clear all unpaid debt for this member? This will mark unpaid trainings as paid but keep their history.')) return;

                const visits = DB.getVisits();
                const unpaidVisits = visits.filter(v => v.memberId === memberId && v.isUnpaid);
                if (unpaidVisits.length === 0) return alert('No unpaid trainings found for this member.');

                // Step 1: Collect IDs of all visits being cleared and update local visit objects
                const clearedVisitIds = unpaidVisits.map(v => v.id);
                unpaidVisits.forEach(v => { v.isUnpaid = false; });
                DB.saveVisits(visits);

                // Step 2: Record a system debt-clearance payment entry so explicit clearance persists
                const payments = DB.getPayments();
                payments.push({
                    id: 'PAY-DEBT-' + Date.now(),
                    memberId,
                    date: Utils.todayLocalIso(),
                    amount: 0,
                    note: 'System Log: Debt Clearance',
                    clearedVisitIds
                });
                DB.savePayments(payments);

                // Step 3: Refresh all UI views across Payment Ledger, Visit Log, Calendar & Member History
                App.syncPaymentViews(memberId);
                if (document.getElementById('form-original-id').value === memberId) {
                    App.openMemberModal(memberId);
                }
                App.addNotification('Debt Cleared', `Unpaid trainings have been cleared for member ${memberId}.`, 'success', memberId);
            },
  
            // --- PAYMENTS SYSTEM ---

            /**
             * Opens the Add/Edit Payment modal and populates member & plan dropdown options.
             * 
             * HOW & WHY:
             * Populates the member dropdown and plan dropdown with available plans (including data-days
             * and data-sessions attributes). If a paymentId is passed, it loads existing payment values
             * into the form for editing.
             */
});
