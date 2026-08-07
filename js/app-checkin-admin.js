// =====================================================================
// app-checkin-admin.js
// App methods: getContrastTextColor, renderCheckinNotice, saveCheckinNotice, clearCheckinNotice, handleAdminCheckinSearch, adminForceCheckin
// Plain script (no ES modules). Methods attach to the global App object
// created in app-core.js. Load order is fixed in index.html.
// =====================================================================
Object.assign(App, {
            getContrastTextColor: (bg) => {
                if (!bg || !bg.startsWith('#')) return '#000';
                const hex = bg.replace('#', '');
                const r = parseInt(hex.slice(0,2), 16);
                const g = parseInt(hex.slice(2,4), 16);
                const b = parseInt(hex.slice(4,6), 16);
                const yiq = ((r*299)+(g*587)+(b*114))/1000;
                return yiq >= 128 ? '#000' : '#fff';
            },

            renderCheckinNotice: () => {
                const msg = DB.getCheckinNotice();
                const color = DB.getCheckinNoticeColor();
                const textColor = App.getContrastTextColor(color);
                const noticeIds = ['kiosk-broadcast-notice', 'admin-checkin-notice', 'mobile-checkin-notice'];
                noticeIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    if (msg) {
                        if (id === 'kiosk-broadcast-notice') {
                            const textEl = document.getElementById('kiosk-broadcast-notice-text');
                            if (textEl) textEl.innerText = msg;
                            
                            // Use selected color as left border accent, and a soft tint as background
                            el.style.borderLeftColor = color;
                            
                            let bgTint = 'rgba(37, 99, 235, 0.08)'; // default primary tint
                            if (color && color.startsWith('#')) {
                                const hex = color.replace('#', '');
                                let r = 0, g = 0, b = 0;
                                if (hex.length === 3) {
                                    r = parseInt(hex[0] + hex[0], 16);
                                    g = parseInt(hex[1] + hex[1], 16);
                                    b = parseInt(hex[2] + hex[2], 16);
                                } else if (hex.length === 6) {
                                    r = parseInt(hex.slice(0, 2), 16);
                                    g = parseInt(hex.slice(2, 4), 16);
                                    b = parseInt(hex.slice(4, 6), 16);
                                }
                                bgTint = `rgba(${r}, ${g}, ${b}, 0.08)`;
                            }
                            el.style.backgroundColor = bgTint;
                            el.style.color = 'var(--dark)';
                            el.style.borderColor = 'rgba(0, 0, 0, 0.06)';
                        } else {
                            el.innerText = msg;
                            el.style.backgroundColor = color;
                            el.style.color = textColor;
                            el.style.borderColor = color;
                        }
                        el.classList.remove('hidden');
                    } else {
                        el.classList.add('hidden');
                        if (id === 'kiosk-broadcast-notice') {
                            const textEl = document.getElementById('kiosk-broadcast-notice-text');
                            if (textEl) textEl.innerText = '';
                        } else {
                            el.innerText = '';
                        }
                    }
                });
            },
 
            saveCheckinNotice: () => {
                const field = document.getElementById('form-checkin-notice');
                const colorField = document.getElementById('form-checkin-notice-color');
                if (!field || !colorField) return;
                const notice = field.value.trim();
                const color = colorField.value;
                DB.saveCheckinNotice(notice);
                DB.saveCheckinNoticeColor(color);
                App.renderCheckinNotice();
                alert('Check-in notice updated.');
            },
 
            clearCheckinNotice: () => {
                if (!confirm('Clear the current check-in notice?')) return;
                DB.saveCheckinNotice('');
                const field = document.getElementById('form-checkin-notice');
                if (field) field.value = '';
                App.renderCheckinNotice();
            },
 
            handleAdminCheckinSearch: () => {
                const query = document.getElementById('checkin-search').value.toLowerCase().trim();
                const resultCard = document.getElementById('checkin-member-card');
                if (!query) { resultCard.classList.add('hidden'); return; }
                
                const members = DB.getMembers();
                const m = members.find(m => 
                    m.id === query || 
                    m.firstName.toLowerCase().includes(query) || 
                    m.lastName.toLowerCase().includes(query) ||
                    (m.phone && m.phone.includes(query))
                );

                if (!m) { resultCard.classList.add('hidden'); return; }
                
                // Ensure auto-checkout is applied then determine active visit using expectedExitTime
                App.autoCheckoutStaleVisits();
                const now = new Date();
                const activeVisits = DB.getVisits().filter(v => v.exitTime === null && v.expectedExitTime && new Date(v.expectedExitTime) > now && v.memberId === m.id);
                const isInside = activeVisits.length > 0;
                // Member-level expiration: only consider expirationDate if present. Session-only members should not be reported as "expired" based on missing expiration.
                const isMemberExpired = m.expirationDate ? Utils.getDaysRemaining(m.expirationDate) < 0 : false;
                const isOutOfSessions = m.sessionsTotal && parseInt(m.sessionsLeft) <= 0;

                resultCard.classList.remove('hidden');
                let overrideBtn = isInside ? 
                    `<button class="btn-primary btn-large w-full mt-2" onclick="App.checkoutVisit('${activeVisits[0].id}')">Checkout Now</button>` : 
                    `<button class="btn-success btn-large w-full mt-2" onclick="App.adminForceCheckin('${m.id}')">Override Check-in (Skip Alerts)</button>`;

                // Display priority: Frozen > Inactive > expired (by date) > out of sessions > active
                let statusHtml = '';
                if (m.accountStatus === 'Frozen') statusHtml = `<div class="mt-2 kiosk-msg danger">ACCOUNT FROZEN</div>`;
                else if (m.accountStatus === 'Inactive') statusHtml = `<div class="mt-2 kiosk-msg danger">ACCOUNT INACTIVE</div>`;
                else if (isMemberExpired) statusHtml = `<div class="mt-2 kiosk-msg danger">MEMBERSHIP EXPIRED</div>`;
                else if (isOutOfSessions) statusHtml = `<div class="mt-2 kiosk-msg warning">NO SESSIONS LEFT</div>`;
                else statusHtml = `<div class="mt-2 kiosk-msg success">MEMBERSHIP ACTIVE</div>`;

                resultCard.innerHTML = `
                    <h3>${Utils.escapeHTML(m.firstName)} ${Utils.escapeHTML(m.lastName)}</h3>
                    <p class="text-gray">ID: ${m.id} | Belt: ${Utils.getBeltBadge(m.belt)}</p>
                    ${statusHtml}
                    ${overrideBtn}
                `;
            },

            adminForceCheckin: (id) => {
                const m = DB.getMembers().find(m => m.id === id);
                if (!m) return;
                const isUnpaidVisit = App.computeVisitUnpaid(m);
                App.pendingAdminCheckin = { member: m, isUnpaidVisit };
                App.openAdminCheckinClassModal();
            },

            openAdminCheckinClassModal: () => {
                const modal = document.getElementById('modal-admin-checkin-classes');
                const content = document.getElementById('admin-checkin-classes-content');
                const note = document.getElementById('admin-checkin-classes-note');
                const summary = document.getElementById('admin-checkin-member-summary');
                if (!modal || !content || !note || !summary || !App.pendingAdminCheckin) return;

                const member = App.pendingAdminCheckin.member;
                const isUnpaidVisit = App.pendingAdminCheckin.isUnpaidVisit;
                const statusBadge = isUnpaidVisit
                    ? '<span class="badge badge-inactive" style="font-size:0.7rem;">Needs Renew</span>'
                    : '<span class="badge badge-active" style="font-size:0.7rem;">Membership OK</span>';
                summary.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                        <div style="min-width:0; overflow-wrap:anywhere;">
                            <strong>${Utils.escapeHTML(member.firstName)} ${Utils.escapeHTML(member.lastName)}</strong>
                            <span class="text-gray" style="font-size:0.85rem;"> · ID: ${Utils.escapeHTML(member.id)}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:0.5rem; flex-shrink:0;">
                            ${Utils.getBeltBadge(member.belt)}
                            ${statusBadge}
                        </div>
                    </div>`;

                const todayIso = Utils.todayLocalIso();
                const dateInput = document.getElementById('admin-checkin-classes-date-input');
                if (dateInput) {
                    dateInput.max = todayIso;
                    dateInput.value = todayIso;
                }
                App.renderAdminCheckinClassList(todayIso);
                App.openModal('modal-admin-checkin-classes');
            },

            renderAdminCheckinClassList: (dateIso) => {
                const modal = document.getElementById('modal-admin-checkin-classes');
                const content = document.getElementById('admin-checkin-classes-content');
                const note = document.getElementById('admin-checkin-classes-note');
                const openMenu = document.getElementById('admin-checkin-classes-open-menu');
                const dateInput = document.getElementById('admin-checkin-classes-date-input');
                const todayBtn = document.getElementById('admin-checkin-classes-today-btn');
                const hint = document.getElementById('admin-checkin-classes-date-hint');
                if (!modal || !content || !note || !App.pendingAdminCheckin) return;

                const member = App.pendingAdminCheckin.member;
                const todayIso = Utils.todayLocalIso();
                const selectedDateIso = dateIso || todayIso;
                const isToday = selectedDateIso === todayIso;

                if (dateInput) dateInput.value = selectedDateIso;
                if (todayBtn) todayBtn.classList.toggle('hidden', isToday);
                if (hint) hint.classList.toggle('hidden', isToday);

                const selectedDate = new Date(selectedDateIso + 'T12:00:00');
                const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][selectedDate.getDay()];
                const schedules = (DB.getSchedules() || []).filter(cls => cls.isPublic !== false);
                const slotEntries = [];
                const alreadyCheckedInSlotIds = new Set(DB.getClassCheckins()
                    .filter(checkin => checkin.memberId === member.id && checkin.slotDate === selectedDateIso)
                    .map(checkin => App.normalizeScheduleSlotId(checkin.classId, checkin.slotDay, checkin.slotStart, checkin.slotEnd)));

                schedules.forEach(cls => {
                    (cls.slots || []).forEach(slot => {
                        if (slot.day !== dayName) return;
                        const slotId = App.normalizeScheduleSlotId(cls.id, slot.day, slot.start, slot.end);
                        slotEntries.push({ ...cls, slot, slotId, alreadyCheckedIn: alreadyCheckedInSlotIds.has(slotId) });
                    });
                });

                if (slotEntries.length === 0) {
                    content.innerHTML = `<p class="text-gray" style="padding: 1rem 0;">${isToday ? 'No classes are scheduled today.' : 'No classes are scheduled on this date.'} Confirm to record an open-gym check-in.</p>`;
                    note.innerText = 'You can still confirm this check-in without a class.';
                } else {
                    const sorted = slotEntries.sort((a, b) => {
                        if (a.slot.start !== b.slot.start) return a.slot.start.localeCompare(b.slot.start);
                        return a.name.localeCompare(b.name);
                    });
                    const availableCount = sorted.filter(entry => !entry.alreadyCheckedIn).length;
                    content.innerHTML = `<div class="checkin-class-grid">${sorted.map(entry => {
                        const dateDisplay = Utils.formatDateLocalized(selectedDateIso);
                        const timeDisplay = `${Utils.convertTo12Hour(entry.slot.start)} - ${Utils.convertTo12Hour(entry.slot.end)}`;
                        const cardClass = `checkin-class-card${entry.alreadyCheckedIn ? ' disabled' : ''}`;
                        const actionText = entry.alreadyCheckedIn ? 'Already Checked In' : 'Select';
                        const actionStyle = entry.alreadyCheckedIn ? 'background: #fde2e2; color: var(--danger);' : '';
                        const onclickAttr = entry.alreadyCheckedIn ? '' : `onclick="App.toggleAdminCheckinClass('${entry.slotId}')"`;
                        return `
                            <div id="admin-checkin-class-card-${entry.slotId}" class="${cardClass}" ${onclickAttr} style="border-left: 6px solid ${entry.color || '#2563eb'};">
                                <input type="checkbox" name="admin-checkin-class" value="${entry.slotId}" data-class-id="${Utils.escapeHTML(entry.id)}" data-slot-day="${Utils.escapeHTML(entry.slot.day)}" data-slot-start="${Utils.escapeHTML(entry.slot.start)}" data-slot-end="${Utils.escapeHTML(entry.slot.end)}" data-slot-date="${selectedDateIso}" ${entry.alreadyCheckedIn ? 'disabled' : ''} hidden>
                                <div style="display:flex; justify-content:space-between; align-items:center; gap: 0.75rem; flex-wrap: wrap;">
                                    <strong>${Utils.escapeHTML(entry.name)}</strong>
                                    <span class="badge badge-inside checkin-class-action-badge" style="font-size:0.8rem; ${actionStyle}">${Utils.escapeHTML(actionText)}</span>
                                </div>
                                <div class="text-gray" style="font-size:0.95rem; margin-top:0.5rem;">${Utils.escapeHTML(dateDisplay)}</div>
                                <div class="text-gray" style="font-size:0.95rem;">${Utils.escapeHTML(timeDisplay)}</div>
                            </div>
                        `;
                    }).join('')}</div>`;
                    note.innerText = availableCount > 0
                        ? 'Select one or more classes for this check-in, or leave empty for an open-gym check-in.'
                        : isToday
                            ? 'This member is already checked into all classes scheduled today. You can still confirm an open-gym check-in.'
                            : 'This member is already checked into all classes scheduled on this date. You can still confirm an open-gym check-in.';
                }

                // Hidden menu: allow checking in without choosing a class (open gym), shown only when there are classes to pick from.
                if (openMenu) {
                    const showMenu = slotEntries.length > 0;
                    openMenu.classList.toggle('hidden', !showMenu);
                    openMenu.innerHTML = showMenu ? `
                        <details class="checkin-open-details">
                            <summary class="checkin-open-summary">${isToday ? 'Not taking a class today?' : 'Not taking a class on this date?'}</summary>
                            <div class="checkin-open-body">
                                <p class="text-gray">Check this member in for open gym time without selecting a class.</p>
                                <button class="btn-outline w-full" style="font-weight:600;" onclick="App.adminCheckinWithoutClass()">Check In Without a Class (Open Gym)</button>
                            </div>
                        </details>` : '';
                }
            },

            resetAdminCheckinClassDate: () => {
                const dateInput = document.getElementById('admin-checkin-classes-date-input');
                if (dateInput) dateInput.value = Utils.todayLocalIso();
                App.renderAdminCheckinClassList(dateInput ? dateInput.value : '');
            },

            // Build the entry timestamp for an admin check-in. For today the check-in is recorded
            // at the current time (existing behavior). For a backdated training session it uses the
            // earliest selected class start on that date, or the current clock time on that date for
            // open-gym check-ins.
            buildAdminBackdatedEntryIso: (selectedDateIso, selectedClasses = [], todayIso) => {
                const now = new Date();
                if (selectedDateIso === todayIso) return now.toISOString();
                const [y, mo, d] = selectedDateIso.split('-').map(Number);
                if (selectedClasses && selectedClasses.length > 0) {
                    let earliestMs = Infinity;
                    selectedClasses.forEach(sel => {
                        if (!sel.slotStart) return;
                        const [sh, sm] = sel.slotStart.split(':').map(Number);
                        const start = new Date(y, mo - 1, d, sh, sm, 0, 0);
                        if (start.getTime() < earliestMs) earliestMs = start.getTime();
                    });
                    if (isFinite(earliestMs)) return new Date(earliestMs).toISOString();
                }
                return new Date(y, mo - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
            },

            adminCheckinWithoutClass: () => {
                App.confirmAdminCheckinSelection();
            },

            toggleAdminCheckinClass: (slotId) => {
                const card = document.getElementById(`admin-checkin-class-card-${slotId}`);
                const input = card ? card.querySelector('input[name="admin-checkin-class"]') : null;
                if (!input) return;
                input.checked = !input.checked;
                card.classList.toggle('selected', input.checked);
                const badge = card.querySelector('.checkin-class-action-badge');
                if (badge) badge.innerText = input.checked ? 'Selected' : 'Select';
            },

            cancelAdminCheckinSelection: () => {
                App.pendingAdminCheckin = null;
                App.closeModal('modal-admin-checkin-classes');
            },

            confirmAdminCheckinSelection: () => {
                if (!App.pendingAdminCheckin) return App.closeModal('modal-admin-checkin-classes');

                const allInputs = Array.from(document.querySelectorAll('#admin-checkin-classes-content input[name="admin-checkin-class"]'));
                const selectedInputs = allInputs.filter(input => input.checked);
                const selectedClasses = selectedInputs.map(input => ({
                    slotKey: input.value,
                    classId: input.dataset.classId,
                    slotDay: input.dataset.slotDay,
                    slotStart: input.dataset.slotStart,
                    slotEnd: input.dataset.slotEnd,
                    slotDate: input.dataset.slotDate
                }));

                const { member, isUnpaidVisit } = App.pendingAdminCheckin;
                App.pendingAdminCheckin = null;
                App.closeModal('modal-admin-checkin-classes');

                App.autoCheckoutStaleVisits();
                const visits = DB.getVisits();
                const now = new Date();
                const todayIso = Utils.dateToLocalIso(now);
                const dateInput = document.getElementById('admin-checkin-classes-date-input');
                const selectedDateIso = dateInput && dateInput.value ? dateInput.value : todayIso;
                const isBackdated = selectedDateIso !== todayIso;
                const entryIso = App.buildAdminBackdatedEntryIso(selectedDateIso, selectedClasses, todayIso);
                const expected = App.computeExpectedExitTime(entryIso, selectedClasses, selectedClasses.length === 0);
                const classIds = [...new Set(selectedClasses.map(sel => sel.classId))];

                // If the member is already inside an active visit, keep that visit open and attach the
                // new class(es) to it, so back-to-back classes all display next to the member's name.
                // Backdated sessions always create their own visit so they never merge with a live visit,
                // and neither does a check-in for a class that has already ended — such a check-in is a
                // historical/attendance record, so it gets its own visit that is finalized (checked out)
                // immediately instead of leaving the member "inside".
                const alreadyEnded = new Date(expected) <= now;
                let visitId;
                const activeVisit = !isBackdated && !alreadyEnded
                    ? visits.find(v => v.memberId === member.id && !v.exitTime && v.expectedExitTime && new Date(v.expectedExitTime) > now)
                    : null;
                if (activeVisit) {
                    visitId = activeVisit.id;
                    if (new Date(expected).getTime() > new Date(activeVisit.expectedExitTime).getTime()) {
                        activeVisit.expectedExitTime = expected;
                    }
                    activeVisit.classIds = [...new Set([...(activeVisit.classIds || []), ...classIds])];
                    activeVisit.isUnpaid = !!(activeVisit.isUnpaid || isUnpaidVisit);
                } else {
                    // Close any legacy open visit at this entry time to avoid duplicates (live check-ins only).
                    // Skip for ended-class check-ins so an unrelated live visit (member already inside) is left open.
                    if (!isBackdated && !alreadyEnded) {
                        const prevOpen = visits.find(v => v.memberId === member.id && !v.exitTime);
                        if (prevOpen) prevOpen.exitTime = entryIso;
                    }
                    visitId = 'V-' + Date.now();
                    visits.push({ id: visitId, memberId: member.id, entryTime: entryIso, expectedExitTime: expected, exitTime: alreadyEnded ? expected : null, isUnpaid: isUnpaidVisit, classIds });
                }
                DB.saveVisits(visits);

                if (selectedClasses.length > 0) {
                    const checkins = DB.getClassCheckins();
                    selectedClasses.forEach((selection, idx) => {
                        checkins.push({
                            id: 'CC-' + Date.now() + '-' + idx,
                            visitId,
                            memberId: member.id,
                            classId: selection.classId,
                            entryTime: entryIso,
                            slotDate: selection.slotDate,
                            slotDay: selection.slotDay,
                            slotStart: selection.slotStart,
                            slotEnd: selection.slotEnd
                        });
                    });
                    DB.saveClassCheckins(checkins);
                    App.cleanupClassCheckins();
                }

                // Decrement sessions only when the visit is paid
                // NOTE — session accounting is per CHECK-IN ACTION, not per class:
                //   * One check-in selecting 2 back-to-back classes consumes a single session.
                //   * Two separate check-ins consume one session each (1 session on the first,
                //     then the second is flagged as an unpaid/Needs-Renew visit because
                //     computeVisitUnpaid() treats sessionsLeft <= 0 as unpaid, and no further
                //     decrement happens). The merge above keeps both classes on one visit.
                if (member.sessionsTotal && !isUnpaidVisit) {
                    member.sessionsLeft = (parseInt(member.sessionsLeft) || 0) - 1;
                    let allMembers = DB.getMembers();
                    let mIdx = allMembers.findIndex(mem => mem.id === member.id);
                    if (mIdx > -1) {
                        allMembers[mIdx] = member;
                        DB.saveMembers(allMembers);
                    }
                }

                document.getElementById('checkin-search').value = '';
                document.getElementById('checkin-member-card').classList.add('hidden');
                App.renderLivePresent();
                // Backdated sessions happened in the past, so finalize them immediately so they
                // appear as completed entries in the check-in log rather than lingering open.
                if (isBackdated) App.autoCheckoutStaleVisits();
            },

            getCheckinQRUrl: () => {
                const stored = localStorage.getItem('gym_checkin_qr_url');
                if (stored) return stored;
                if (location.protocol === 'http:' || location.protocol === 'https:') {
                    return location.href.split('?')[0].split('#')[0] + '?checkin=1';
                }
                return '';
            },

            renderCheckinQR: () => {
                const input = document.getElementById('checkin-qr-url');
                const container = document.getElementById('checkin-qr-container');
                if (!input || !container) return;
                if (!input.value) input.value = App.getCheckinQRUrl();
                const url = input.value.trim();
                localStorage.setItem('gym_checkin_qr_url', url);
                container.innerHTML = '';
                if (!window.QRCode) {
                    container.innerHTML = '<p class="text-gray">QR library not loaded.</p>';
                    return;
                }
                if (!url) {
                    container.innerHTML = '<p class="text-gray">Enter your hosted check-in URL above to generate the QR code.</p>';
                    return;
                }
                try {
                    new QRCode(container, { text: url, width: 220, height: 220, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
                } catch (e) {
                    container.innerHTML = '<p class="text-gray">Could not generate QR code.</p>';
                }
            },

            copyCheckinQRUrl: () => {
                const input = document.getElementById('checkin-qr-url');
                if (!input) return;
                App.renderCheckinQR();
                const url = input.value.trim();
                if (!url) return alert('Enter a check-in URL first.');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(
                        () => alert('Check-in URL copied!'),
                        () => { input.select(); document.execCommand('copy'); alert('Check-in URL copied!'); }
                    );
                } else {
                    input.select();
                    document.execCommand('copy');
                    alert('Check-in URL copied!');
                }
            },

            printCheckinQR: () => {
                const container = document.getElementById('checkin-qr-container');
                if (!container) return;
                const img = container.querySelector('img');
                const canvas = container.querySelector('canvas');
                const src = img ? img.src : (canvas ? canvas.toDataURL('image/png') : '');
                if (!src) return alert('Generate the QR code first.');
                const w = window.open('', '_blank', 'width=520,height=620');
                if (!w) return alert('Allow pop-ups to print the QR code.');
                w.document.write(`<!DOCTYPE html><html><head><title>Member Check-in QR</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:Arial,sans-serif;} img{width:70vw;max-width:480px;border:1px solid #ddd;padding:12px;background:#fff;border-radius:8px;} h1{font-size:1.6rem;margin:1.2rem 0 0 0;} p{color:#666;margin:0.25rem 0 0 0;font-size:1rem;}</style></head><body><img src="${src}" alt="Check-in QR code"><h1>Scan to Check In</h1><p>Point your phone camera at this code</p></body></html>`);
                w.document.close();
                w.focus();
                setTimeout(() => { try { w.print(); } catch (e) {} }, 300);
            },

});
