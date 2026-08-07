// =====================================================================
// app-admin.js
// App methods: sendAdminPasswordReset, renderAdminDashboard, renderAnalyticalCalendar, filterVisitsByDate, exportMonthlyExcel, getVisitPaidByInfo, renderVisitLog, openVisitEditModal, saveVisitEdit, deleteVisitFromModal, searchDashboardHistory, renderAdminSettings, updatePortalName, updateCurrency, saveBeltVisibility, repairDuplicateMembers
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
                const today = Utils.todayLocalIso();
                const todayVisits = visits.filter(v => v.entryTime && Utils.dateToLocalIso(new Date(v.entryTime)) === today && validMemberIds.has(v.memberId)).length;
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

                // Sync supporting UI: Today button + export section month label
                const todayBtn = document.getElementById('analytical-month-today');
                if (todayBtn) todayBtn.classList.toggle('hidden', monthStr === Utils.currentMonthLocal());
                const exportLabel = document.getElementById('export-month-label');
                if (exportLabel) {
                    exportLabel.innerText = monthStr
                        ? new Date(Number(monthStr.split('-')[0]), Number(monthStr.split('-')[1]) - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                        : 'this month';
                }

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
                            <div style="border: 1px solid var(--gray-light); padding: 10px; background: ${bg}; border-radius: 4px; cursor:pointer; display:flex; flex-direction:column; align-items:center;" onclick="App.filterVisitsByDate('${dateStr}')">
                                <strong style="display:block; margin-bottom:5px;">${day}</strong>
                                <span style="font-size:0.85rem; color:var(--dark); font-weight:600;">${vCount} people</span>
                                ${unpaidCount > 0 ? `<span style="font-size:0.7rem; color:var(--danger); font-weight:600;">${unpaidCount} unpaid</span>` : ''}
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
                App.renderVisitLog();
            },

            changeAnalyticalMonth: (delta) => {
                const input = document.getElementById('export-month-picker');
                if (!input || !input.value) return;
                const [year, month] = input.value.split('-').map(Number);
                const d = new Date(year, month - 1 + delta, 1);
                input.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                App.renderAnalyticalCalendar();
            },

            goToCurrentMonth: () => {
                const input = document.getElementById('export-month-picker');
                if (!input) return;
                input.value = Utils.currentMonthLocal();
                App.renderAnalyticalCalendar();
            },

            onAnalyticalMonthChange: () => {
                App.renderAnalyticalCalendar();
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

                let hasData = false;
                visits.forEach(v => {
                    const visitLocalDate = v.entryTime ? Utils.dateToLocalIso(new Date(v.entryTime)) : '';
                    if (visitLocalDate.startsWith(monthStr)) {
                        const m = memMap.get(v.memberId);
                        if (m) {
                            const date = visitLocalDate;
                            const time = new Date(v.entryTime).toLocaleTimeString();
                            const status = v.isUnpaid ? 'Unpaid/Expired' : 'Paid';
                            csvContent += `${esc(date)},${esc(time)},${esc(m.id)},${esc(m.firstName)},${esc(m.lastName)},${esc(m.belt)},${esc(status)}\n`;
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

            /**
             * Returns the payment record that covers a given paid check-in visit,
             * or null if no payment record can be attributed.
             * Mirrors the reconciliation logic in reconcileMemberPaymentVisitStatus:
             * 1. Payment explicitly cleared the visit (clearedVisitIds)
             * 2. Visit falls inside a payment's applied date window (or the member's expiration window)
             * 3. Visit is covered by remaining session quota (chronological consumption)
             */
            getVisitPaidByInfo: (v) => {
                if (!v || v.isUnpaid) return null;
                const payments = DB.getPayments().filter(p => p.memberId === v.memberId);
                const member = DB.getMembers().find(m => m.id === v.memberId);

                // 1. Explicitly cleared by a payment record
                const explicit = payments.find(p => Array.isArray(p.clearedVisitIds) && p.clearedVisitIds.includes(v.id));
                if (explicit) return explicit;

                const entry = v.entryTime ? new Date(v.entryTime) : null;

                // 2. Covered by a payment's applied date window (newest payment wins)
                if (entry && !isNaN(entry.getTime())) {
                    const datedPays = payments.filter(p => p.appliedExpiration).sort((a, b) => new Date(b.date) - new Date(a.date));
                    const timePay = datedPays.find(p => {
                        const start = new Date(p.appliedStartDate || p.date);
                        const end = new Date(p.appliedExpiration);
                        return !isNaN(start.getTime()) && !isNaN(end.getTime()) && entry >= start && entry <= end;
                    });
                    if (timePay) return timePay;

                    // Covered by the member's current expiration window — attribute to the payment that set it
                    if (member && member.expirationDate && Utils.getDaysRemaining(member.expirationDate) >= 0) {
                        const end = new Date(member.expirationDate);
                        if (!isNaN(end.getTime()) && entry <= end) {
                            const expPay = payments
                                .filter(p => p.appliedExpiration === member.expirationDate)
                                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                            if (expPay) return expPay;
                        }
                    }
                }

                // 3. Covered by session quota — replicate chronological session consumption
                const sessionPayments = payments.filter(p => p.sessionsGranted && parseInt(p.sessionsGranted, 10) > 0);
                if (sessionPayments.length > 0) {
                    const totalCapacity = sessionPayments.reduce((s, p) => s + parseInt(p.sessionsGranted, 10), 0);
                    const memberVisits = DB.getVisits()
                        .filter(x => x.memberId === v.memberId)
                        .sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
                    let sessionsUsed = 0;
                    const sessionsCoveredIds = [];
                    memberVisits.forEach(x => {
                        const xEntry = x.entryTime ? new Date(x.entryTime) : null;
                        const xExplicit = payments.some(p => Array.isArray(p.clearedVisitIds) && p.clearedVisitIds.includes(x.id));
                        const xTime = xEntry && !isNaN(xEntry.getTime()) && payments.some(p => {
                            if (!p.appliedExpiration) return false;
                            const start = new Date(p.appliedStartDate || p.date);
                            const end = new Date(p.appliedExpiration);
                            return !isNaN(start.getTime()) && !isNaN(end.getTime()) && xEntry >= start && xEntry <= end;
                        });
                        if (!xExplicit && !xTime && sessionsUsed < totalCapacity) {
                            sessionsUsed++;
                            sessionsCoveredIds.push(x.id);
                        }
                    });
                    if (sessionsCoveredIds.includes(v.id)) {
                        return sessionPayments.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
                    }
                }

                return null;
            },

            renderVisitLog: () => {
                let visits = DB.getVisits();
                const members = DB.getMembers();
                const binMembers = DB.getBin();
                const startFilter = document.getElementById('filter-visit-start').value;
                const endFilter = document.getElementById('filter-visit-end').value;
                const statusFilter = document.getElementById('filter-visit-status').value;
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
                        ? `<strong>${Utils.escapeHTML(m.firstName)} ${Utils.escapeHTML(m.lastName)}</strong> <span class="badge badge-inactive" style="font-size:0.7rem;">Deleted Member</span>`
                        : `<strong>${Utils.escapeHTML(m.firstName)} ${Utils.escapeHTML(m.lastName)}</strong>`;
                    // Member ID inside the belt-styled box; every box keeps the same fixed width
                    const idBadge = Utils.getMemberIdBadge(m);
                    // Combined Status & Payment: unpaid check-ins show "Unpaid",
                    // paid ones show the covering payment record that makes it OK
                    let statusHtml = `<span class="badge badge-inactive">Unpaid</span>`;
                    if (!v.isUnpaid) {
                        const pay = App.getVisitPaidByInfo(v);
                        if (pay) {
                            const plan = pay.planId ? DB.getPlans().find(p => p.id === pay.planId) : null;
                            const planName = plan ? ` · ${Utils.escapeHTML(plan.name)}` : '';
                            const payLabel = `<span class="badge badge-active" style="font-size:0.7rem;">Paid</span> ${DB.getCurrency()}${parseFloat(pay.amount).toFixed(2)}${planName} <span class="text-gray" style="font-size:0.8rem;">(${Utils.formatDate(pay.date)})</span>`;
                            statusHtml = pay.note
                                ? `<div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">${payLabel}</div><div class="text-gray" style="font-size:0.8rem;">${Utils.escapeHTML(pay.note)}</div>`
                                : `<div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">${payLabel}</div>`;
                        } else {
                            statusHtml = `<span class="badge badge-active" style="font-size:0.7rem;">Paid</span> <span class="text-gray" style="font-size:0.8rem;">covered (no payment record)</span>`;
                        }
                    }

                    // If a specific class was chosen at check-in (kiosk or admin portal), show the
                    // class instead of the entry/exit times. Plain open-gym check-ins keep showing
                    // their entry time and duration. buildVisitClassTags safely falls back to a
                    // generic "Class" label if the class was later deleted from the schedule.
                    // Tags stack the class hours below the class name so the column stays narrow.
                    const classTags = App.buildVisitClassTags(v, false, true);
                    let entryHtml = classTags
                        ? classTags
                        : `<div>${Utils.formatTime(v.entryTime)} ${v.exitTime ? ` - ${Utils.formatTime(v.exitTime)}` : '(Inside)'}</div>
                           <div class="text-gray" style="font-size:0.8rem;">${App.calcVisitDuration(v)}</div>`;

                    return `
                    <tr${isDeleted ? ' style="opacity:0.6;"' : ''}>
                        <td data-label="Date">${Utils.formatDate(v.entryTime)}</td>
                        <td data-label="Entry & Class">${entryHtml}</td>
                        <td data-label="Member Name">${nameHtml}</td>
                        <td data-label="ID">${idBadge}</td>
                        <td data-label="Status & Payment">${statusHtml}</td>
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
                entryInput.value = Utils.toLocalDatetimeInput(visit.entryTime);
                
                const exitInput = document.getElementById('form-visit-exit');
                exitInput.value = Utils.toLocalDatetimeInput(visit.exitTime);

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
                        <h3 style="margin:0;">Found: ${Utils.escapeHTML(m.firstName)} ${Utils.escapeHTML(m.lastName)} (${Utils.escapeHTML(m.id)})</h3>
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

            // One-time repair for members that were duplicated by an ID change:
            // groups records by email (or name when no email), keeps the record
            // with the most check-in history, and rewrites every visit / class
            // check-in / payment / notification reference onto the keeper.
            repairDuplicateMembers: () => {
                if (!App.isAdminAuthed()) return alert('Only the admin can repair duplicate members.');
                const members = DB.getMembers();
                const groups = new Map();
                members.forEach(m => {
                    if (!m || !m.id) return;
                    const emailKey = (m.email || '').trim().toLowerCase();
                    const nameKey = `${(m.firstName || '').trim()}|${(m.lastName || '').trim()}`.toLowerCase();
                    const key = emailKey || nameKey;
                    if (!key) return;
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key).push(m);
                });
                const dupGroups = [...groups.values()].filter(g => g.length > 1);
                if (!dupGroups.length) return alert('No duplicate members found.');
                const summary = dupGroups.map(g => g.map(m => `${m.firstName || '?'} ${m.lastName || ''} (${m.id})`).join('  ↔  ')).join('\n');
                if (!confirm(`Found ${dupGroups.length} duplicate group(s):\n\n${summary}\n\nEach group keeps the record with the most check-in history; the rest are merged into it and removed. Continue?`)) return;

                const visits = DB.getVisits();
                const checkins = DB.getClassCheckins();
                const payments = DB.getPayments();
                const notifs = DB.getNotifications();
                const keepIds = new Set();
                let mergedCount = 0;
                dupGroups.forEach(group => {
                    const score = m => App.getMemberTrainingCount(m.id) * 10 + visits.filter(v => v.memberId === m.id).length;
                    let keep = group[0];
                    group.forEach(m => { if (score(m) > score(keep)) keep = m; });
                    keepIds.add(keep.id);
                    group.forEach(m => {
                        if (m.id === keep.id) return;
                        mergedCount++;
                        visits.forEach(v => { if (v.memberId === m.id) v.memberId = keep.id; });
                        checkins.forEach(c => { if (c.memberId === m.id) c.memberId = keep.id; });
                        payments.forEach(p => { if (p.memberId === m.id) p.memberId = keep.id; });
                        notifs.forEach(n => { if (n.memberId === m.id) n.memberId = keep.id; });
                        if (!keep.email && m.email) keep.email = m.email;
                    });
                });
                DB.saveMembers(members.filter(m => keepIds.has(m.id)));
                DB.saveVisits(visits);
                DB.saveClassCheckins(checkins);
                DB.savePayments(payments);
                DB.saveNotifications(notifs);
                App.renderMemberDirectory();
                alert(`Merged ${mergedCount} duplicate record(s) into ${dupGroups.length} keeper(s). Check the member directory and verify.`);
            },

});
