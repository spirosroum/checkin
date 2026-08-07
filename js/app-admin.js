// =====================================================================
// app-admin.js
// App methods: sendAdminPasswordReset, renderAdminDashboard, renderAnalyticalCalendar, filterVisitsByDate, exportMonthlyExcel, renderVisitLog, openVisitEditModal, saveVisitEdit, deleteVisitFromModal, searchDashboardHistory, renderAdminSettings, updatePortalName, updateCurrency, saveBeltVisibility
// Plain script (no ES modules). Methods attach to the global App object
// created in app-core.js. Load order is fixed in index.html.
// =====================================================================
Object.assign(App, {
            // --- ADMIN DASHBOARD & LOG ---
            // --- SETTINGS ---
            sendAdminPasswordReset: () => {
                const auth = getAuth();
                if (!auth) return alert('Firebase Auth is not available.');
                if (!ADMIN_EMAIL) return alert('No admin email configured for this app.');
                auth.sendPasswordResetEmail(ADMIN_EMAIL)
                    .then(() => alert(`Password reset email sent to ${ADMIN_EMAIL}. Check your inbox.`))
                    .catch(err => alert('Failed to send reset email: ' + (err && err.message ? err.message : err)));
            },

            renderAdminDashboard: () => {
                const visits = DB.getVisits();
                const members = DB.getMembers();
                const validMemberIds = new Set(members.map(m => m.id));
                // Run auto-checkout so counts are up-to-date
                App.autoCheckoutStaleVisits();
                // Count only visits that belong to existing members (ignore orphan/ghost visits). A visit is "currently inside" only if exitTime===null and expectedExitTime is in the future.
                const now = new Date();
                const active = visits.filter(v => v.exitTime === null && v.expectedExitTime && new Date(v.expectedExitTime) > now && validMemberIds.has(v.memberId) && App.isVisitVisibleNow(v, now)).length;
                const today = new Date().toISOString().split('T')[0];
                const todayVisits = visits.filter(v => v.entryTime.startsWith(today) && validMemberIds.has(v.memberId)).length;
                const activeMem = members.filter(m => m.accountStatus === 'Active' && Utils.getDaysRemaining(m.expirationDate) >= 0).length;

                const genderCounts = members.reduce((acc, m) => { const g = m.gender || 'Unspecified'; acc[g] = (acc[g] || 0) + 1; return acc; }, {});

                document.getElementById('admin-stats-grid').innerHTML = `
                    <div class="stat-card"><h3>Currently Inside</h3><div class="value">${active}</div></div>
                    <div class="stat-card"><h3>Total Visits Today</h3><div class="value">${todayVisits}</div></div>
                    <div class="stat-card"><h3>Active Subscriptions</h3><div class="value" style="color:var(--success)">${activeMem}</div></div>
                    <div class="stat-card"><h3>Total Members</h3><div class="value">${members.length}</div></div>
                    <div class="stat-card"><h3>Genders</h3><div style="font-size:0.9rem;">${Object.entries(genderCounts).map(([k,v]) => `<div>${k}: <strong>${v}</strong></div>`).join('')}</div></div>
                `;

                App.renderAnalyticalCalendar();
            },

            renderAnalyticalCalendar: () => {
                const monthStr = document.getElementById('export-month-picker').value; // 'YYYY-MM'
                if(!monthStr) return;
                
                const [year, month] = monthStr.split('-').map(Number);
                const daysInMonth = new Date(year, month, 0).getDate();
                
                const visits = DB.getVisits();
                const members = DB.getMembers();
                const validMemberIds = new Set(members.map(m => m.id));

                const container = document.getElementById('analytical-calendar-container');
                let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align:center;">`;
                
                // Days header (start on Sunday)
                ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => { html += `<div style="font-weight:bold; padding: 5px; background:var(--gray-light);">${d}</div>`; });

                const firstDayObj = new Date(year, month - 1, 1);
                // getDay() returns 0..6 where 0 is Sunday — with Sunday-first calendar we can use it directly
                let startDayOffset = firstDayObj.getDay(); 

                for(let i=0; i<startDayOffset; i++) { html += `<div></div>`; }

                for(let day=1; day<=daysInMonth; day++) {
                    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const dayVisits = visits.filter(v => v.entryTime.startsWith(dateStr) && validMemberIds.has(v.memberId));
                    const vCount = dayVisits.length;
                    
                        let bg = '#fff';
                        const unpaidCount = dayVisits.filter(v => v.isUnpaid).length;
                        if (unpaidCount > 0) {
                            bg = '#fee2e2';
                        } else if (vCount > 30) {
                            bg = '#86efac';
                        } else if (vCount > 15) {
                            bg = '#bbf7d0';
                        } else if (vCount > 0) {
                            bg = '#dcfce7';
                        }
 
                        html += `
                            <div style="border: 1px solid var(--gray-light); padding: 10px; background: ${bg}; border-radius: 4px; cursor:pointer;" onclick="App.filterVisitsByDate('${dateStr}')">
                                <strong style="display:block; margin-bottom:5px;">${day}</strong>
                                <span style="font-size:0.85rem; color:var(--dark); font-weight:600;">${vCount} v.</span>
                                ${unpaidCount > 0 ? `<span class="badge badge-inactive" style="margin-left:2px;">${unpaidCount} unpaid</span>` : ''}
                            </div>
                        `;
                }
                html += `</div>`;
                container.innerHTML = html;
            },

            filterVisitsByDate: (dateStr) => {
                App.switchTab('dashboard', 'log');
                document.getElementById('filter-visit-start').value = dateStr;
                document.getElementById('filter-visit-end').value = dateStr;
                document.getElementById('filter-visit-status').value = 'all';
                document.getElementById('filter-visit-sort').value = 'newest';
                const unpaidToggle = document.getElementById('filter-visit-unpaid');
                if (unpaidToggle) unpaidToggle.checked = false;
                App.renderVisitLog();
            },

            exportMonthlyExcel: () => {
                const monthStr = document.getElementById('export-month-picker').value; 
                if(!monthStr) return alert("Select a month first");
                const [year, month] = monthStr.split('-').map(Number);
                
                const visits = DB.getVisits();
                const members = DB.getMembers();
                const memMap = new Map(members.map(m => [m.id, m]));

                let csvContent = "data:text/csv;charset=utf-8,";
                csvContent += "Date,Time,Member ID,First Name,Last Name,Belt,Status\n";

                let hasData = false;
                visits.forEach(v => {
                    if (v.entryTime.startsWith(monthStr)) {
                        const m = memMap.get(v.memberId);
                        if (m) {
                            const date = v.entryTime.split('T')[0];
                            const time = new Date(v.entryTime).toLocaleTimeString();
                            const status = v.isUnpaid ? 'Unpaid/Expired' : 'Paid';
                            csvContent += `${date},${time},${m.id},${m.firstName},${m.lastName},${m.belt},${status}\n`;
                            hasData = true;
                        }
                    }
                });

                if(!hasData) return alert("No valid check-ins found for this month.");

                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `GymDesk_Checkins_${monthStr}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },

            renderVisitLog: () => {
                let visits = DB.getVisits();
                const members = DB.getMembers();
                const binMembers = DB.getBin();
                const startFilter = document.getElementById('filter-visit-start').value;
                const endFilter = document.getElementById('filter-visit-end').value;
                const unpaidOnly = document.getElementById('filter-visit-unpaid').checked;
                const statusFilter = unpaidOnly ? 'unpaid' : document.getElementById('filter-visit-status').value;
                const sortBy = document.getElementById('filter-visit-sort').value;

                if (startFilter) { const sd = new Date(startFilter); sd.setHours(0,0,0,0); visits = visits.filter(v => new Date(v.entryTime) >= sd); }
                if (endFilter) { const ed = new Date(endFilter); ed.setHours(23,59,59,999); visits = visits.filter(v => new Date(v.entryTime) <= ed); }
                if (statusFilter === 'active') { visits = visits.filter(v => !v.isUnpaid); }
                if (statusFilter === 'unpaid') { visits = visits.filter(v => v.isUnpaid); }

                const nameMap = new Map();
                members.forEach(m => nameMap.set(m.id, `${m.firstName} ${m.lastName}`.toLowerCase()));
                binMembers.forEach(m => { if (!nameMap.has(m.id)) nameMap.set(m.id, `${m.firstName} ${m.lastName}`.toLowerCase()); });

                if (sortBy === 'name-asc') {
                    visits.sort((a, b) => (nameMap.get(a.memberId) || '').localeCompare(nameMap.get(b.memberId) || ''));
                } else if (sortBy === 'name-desc') {
                    visits.sort((a, b) => (nameMap.get(b.memberId) || '').localeCompare(nameMap.get(a.memberId) || ''));
                } else {
                    visits.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));
                }

                const list = document.getElementById('visit-log-list');
                let unpaidCount = 0;

                list.innerHTML = visits.map(v => {
                    let m = members.find(m => m.id === v.memberId);
                    const isDeleted = !m;
                    if (isDeleted) m = binMembers.find(m => m.id === v.memberId);
                    if (!m) return ''; // visit belongs to a member not even in the bin (orphan) — skip
                    if (v.isUnpaid) unpaidCount++;

                    const nameHtml = isDeleted
                        ? `<strong>${Utils.escapeHTML(m.firstName)} ${Utils.escapeHTML(m.lastName)}</strong> <span class="text-gray">(${m.id})</span> <span class="badge badge-inactive" style="font-size:0.7rem;">Deleted Member</span>`
                        : `<strong>${Utils.escapeHTML(m.firstName)} ${Utils.escapeHTML(m.lastName)}</strong> <span class="text-gray">(${m.id})</span>`;
                    let statusHtml = v.isUnpaid ? `<span class="badge badge-inactive">Unpaid Check-in</span>` : `<span class="badge badge-active">OK</span>`;
                    return `
                    <tr${isDeleted ? ' style="opacity:0.6;"' : ''}>
                        <td data-label="Date">${Utils.formatDate(v.entryTime)}</td>
                        <td data-label="Member Name">${nameHtml}</td>
                        <td data-label="Belt">${Utils.getBeltBadge(m.belt)}</td>
                        <td data-label="Entry & Duration">
                            <div>${Utils.formatTime(v.entryTime)} ${v.exitTime ? ` - ${Utils.formatTime(v.exitTime)}` : '(Inside)'}</div>
                            <div class="text-gray" style="font-size:0.8rem;">${App.calcVisitDuration(v)}</div>
                        </td>
                        <td data-label="Status">${statusHtml}</td>
                        <td data-label="Action" class="cell-actions"><button class="btn-outline btn-small" onclick="App.openVisitEditModal('${v.id}')">Edit</button></td>
                    </tr>
                `}).join('') || '<tr><td colspan="6" class="text-center text-gray">No visits found matching filters.</td></tr>';

                document.getElementById('visit-summary-grid').innerHTML = `
                    <div class="stat-card" style="padding: 1rem;"><h3>Filtered Total</h3><div class="value" style="font-size: 1.5rem;">${visits.length}</div></div>
                    <div class="stat-card" style="padding: 1rem;"><h3>Unpaid / Expired Hits</h3><div class="value" style="font-size: 1.5rem; color:var(--danger);">${unpaidCount}</div></div>
                `;
            },

            openVisitEditModal: (id) => {
                const visit = DB.getVisits().find(v => v.id === id);
                if (!visit) return;
                document.getElementById('form-visit-id').value = visit.id;
                
                const entryInput = document.getElementById('form-visit-entry');
                entryInput.value = visit.entryTime ? new Date(visit.entryTime).toISOString().slice(0,16) : '';
                
                const exitInput = document.getElementById('form-visit-exit');
                exitInput.value = visit.exitTime ? new Date(visit.exitTime).toISOString().slice(0,16) : '';

                App.openModal('modal-visit');
            },

            saveVisitEdit: (e) => {
                e.preventDefault();
                const id = document.getElementById('form-visit-id').value;
                const visits = DB.getVisits();
                const v = visits.find(x => x.id === id);
                if(v) {
                    const entryVal = document.getElementById('form-visit-entry').value;
                    const exitVal = document.getElementById('form-visit-exit').value;
                    if(entryVal) v.entryTime = new Date(entryVal).toISOString();
                    if(exitVal) v.exitTime = new Date(exitVal).toISOString();
                    else v.exitTime = null;
                    DB.saveVisits(visits);
                    App.closeModal('modal-visit');
                    App.renderVisitLog();
                }
            },

            deleteVisitFromModal: () => {
                if(!confirm('Permanently delete this check-in record?')) return;
                const id = document.getElementById('form-visit-id').value;
                const visits = DB.getVisits();
                const remainingVisits = visits.filter(v => v.id !== id);
                DB.saveVisits(remainingVisits);
                App.cleanupClassCheckins();
                App.closeModal('modal-visit');
                App.renderVisitLog();
                App.renderLivePresent();
                App.renderKioskLeaderboard();
                if (!document.getElementById('pane-admin-dashboard').classList.contains('hidden')) {
                    App.renderAdminDashboard();
                }
            },

            searchDashboardHistory: () => {
                const q = document.getElementById('dashboard-history-search').value.toLowerCase().trim();
                const res = document.getElementById('dashboard-history-results');
                if(!q || q.length < 2) { res.innerHTML = ''; return; }
                const m = DB.getMembers().find(m => m.id === q || m.firstName.toLowerCase().includes(q) || m.lastName.toLowerCase().includes(q));
                if(m) {
                    res.innerHTML = `<div class="card" style="background:#e0f2fe; border-color:#38bdf8; margin-bottom: 1rem;">
                        <h3 style="margin:0;">Found: ${m.firstName} ${m.lastName} (${m.id})</h3>
                        <button class="btn-primary btn-small mt-1" onclick="App.renderMemberHistory('${m.id}', 'dashboard-history-container')">Load History</button>
                    </div>`;
                } else {
                    res.innerHTML = '<p class="text-gray">No member found.</p>';
                    document.getElementById('dashboard-history-container').innerHTML = '';
                }
            },

            renderAdminSettings: () => {
                document.getElementById('form-portal-name').value = DB.getPortalName();
                document.getElementById('form-currency').value = DB.getCurrency();
                const hidden = DB.getHiddenBelts();
                document.querySelectorAll('.setting-hide-belt').forEach(cb => {
                    cb.checked = hidden.includes(cb.value);
                });
            },
            
            updatePortalName: () => {
                const name = document.getElementById('form-portal-name').value.trim();
                if(!name) return;
                DB.setPortalName(name);
                document.getElementById('kiosk-title-display').innerText = name;
                alert("Portal name updated!");
            },

            updateCurrency: () => {
                const c = document.getElementById('form-currency').value;
                DB.setCurrency(c);
                App.updateUICurrency();
                alert("Currency symbol updated! Reloading schedules/plans to reflect...");
                App.renderPlans();
            },
            
            saveBeltVisibility: () => {
                const hidden = [];
                document.querySelectorAll('.setting-hide-belt:checked').forEach(cb => hidden.push(cb.value));
                DB.setHiddenBelts(hidden);
                alert("Belt visibility saved. Kiosk view updated.");
                App.renderLivePresent();
            },

});
