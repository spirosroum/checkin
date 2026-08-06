// =====================================================================
// app-kiosk.js
// App methods: numpadPress, updateKioskInputMode, openClassDetails, cancelKioskClassSelection, showKioskAlert, kioskSubmit, openCheckinClassModal, toggleCheckinClass, cleanupClassCheckins, confirmKioskClassSelection, showKioskMessage, renderLivePresent, getLeaderboardStandings, leaderboardRankCell, renderKioskLeaderboard, checkoutVisit
// Plain script (no ES modules). Methods attach to the global App object
// created in app-core.js. Load order is fixed in index.html.
// =====================================================================
Object.assign(App, {
            toggleKioskMenu: () => {
                const drawer = document.getElementById('kiosk-drawer');
                const overlay = document.getElementById('kiosk-drawer-overlay');
                if (drawer) drawer.classList.toggle('open');
                if (overlay) overlay.classList.toggle('open');
            },

            numpadPress: (val) => {
                const input = document.getElementById('kiosk-id-input');
                if (val === 'clear') { input.value = ''; }
                else if (val === 'back') { input.value = input.value.slice(0, -1); }
                else { if(input.value.length < 8) input.value += val; }
                input.focus();
            },
 
            updateKioskInputMode: () => {
                const input = document.getElementById('kiosk-id-input');
                if (!input) return;
 
                const isSmallLayout = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
                const useOnScreenKeys = isSmallLayout;
 
                if (useOnScreenKeys) {
                    input.setAttribute('readonly', 'readonly');
                    input.setAttribute('inputmode', 'none');
                } else {
                    input.removeAttribute('readonly');
                    input.setAttribute('inputmode', 'numeric');
                }
            },
 
            openClassDetails: (classId, slotDay, slotStart, slotEnd) => {
                const cls = DB.getSchedules().find(c => c.id === classId);
                if (!cls) return;
                const content = document.getElementById('class-details-content');
                if (!content) return;
                const lang = App.currentKioskLang || 'en';
                const map = App.KIOSK_I18N[lang] || App.KIOSK_I18N.en;
                const scheduleDate = App.getWeekdayDateForCurrentWeek(slotDay);
                const scheduleDateStr = scheduleDate ? scheduleDate.toISOString().split('T')[0] : null;
                const displayDate = scheduleDateStr ? Utils.formatDateLocalized(scheduleDateStr, lang) : null;
                const activeMembers = DB.getMembers();
                const activeMemberIds = new Set(activeMembers.map(m => m.id));
                const checkins = DB.getClassCheckins().filter(checkin => {
                    if (checkin.classId !== classId) return false;
                    // Exclude check-ins from deleted members
                    if (!activeMemberIds.has(checkin.memberId)) return false;
                    if (!scheduleDateStr) return true;

                    const checkinDate = checkin.slotDate || (checkin.entryTime ? checkin.entryTime.split('T')[0] : null);
                    if (checkinDate !== scheduleDateStr) return false;

                    if (slotStart && slotEnd) {
                        if (checkin.slotStart && checkin.slotStart !== slotStart) return false;
                        if (checkin.slotEnd && checkin.slotEnd !== slotEnd) return false;

                        if (!checkin.slotStart || !checkin.slotEnd) {
                            const entryTime = checkin.entryTime ? new Date(checkin.entryTime) : null;
                            if (entryTime) {
                                const [startHour, startMin] = slotStart.split(':').map(Number);
                                const [endHour, endMin] = slotEnd.split(':').map(Number);
                                const slotStartDate = new Date(scheduleDateStr + 'T' + slotStart + ':00');
                                const slotEndDate = new Date(scheduleDateStr + 'T' + slotEnd + ':00');
                                if (entryTime < slotStartDate || entryTime > slotEndDate) return false;
                            }
                        }
                    }

                    return true;
                });
                const recentCheckins = [...checkins].sort((a,b) => new Date(b.entryTime) - new Date(a.entryTime)).slice(0, 5);
                const slotDayLabel = App.currentKioskLang && App.KIOSK_I18N[App.currentKioskLang]
                    ? App.KIOSK_I18N[App.currentKioskLang].days[slotDay] || slotDay
                    : slotDay;

                content.innerHTML = `
                    <div class="card plan-card public-class-card cursor-pointer" onclick="App.togglePublicClassDetails(this)" style="margin-bottom: 1rem; border: 1px solid var(--gray-light); border-left: 6px solid ${cls.color || '#2563eb'}; transition: 0.2s ease;">
                        <div class="public-card-head flex justify-between align-center" style="gap: 0.75rem;">
                            <h3 style="margin: 0; color: ${cls.color || '#2563eb'};">${Utils.escapeHTML(cls.name)}</h3>
                            <span class="text-gray public-class-expand-label" style="font-size: 0.8rem; flex-shrink: 0;">${Utils.escapeHTML(map.classExpandDetails || 'View schedule & details')} ▸</span>
                        </div>
                        <div class="text-gray mt-1" style="font-size: 0.85rem; overflow-wrap: anywhere; word-break: break-word;">${Utils.escapeHTML(slotDayLabel)}${displayDate ? ` • ${Utils.escapeHTML(displayDate)}` : ''}${slotStart ? ` • ${Utils.escapeHTML(Utils.convertTo12Hour(slotStart))} - ${Utils.escapeHTML(Utils.convertTo12Hour(slotEnd))}` : ''}</div>
                        <div class="public-class-details hidden mt-1" style="border-top: 1px solid var(--gray-light); padding-top: 0.75rem;">
                            ${cls.description
                                ? `<p class="text-gray" style="margin-top: 0; font-size: 0.95rem; overflow-wrap: anywhere; word-break: break-word;">${Utils.escapeHTML(cls.description)}</p>`
                                : `<p class="text-gray" style="margin-top: 0; font-size: 0.95rem; font-style: italic;">${Utils.escapeHTML(map.classDetailsNoDescription || 'No description available.')}</p>`}
                            ${cls.practitioners ? `<p style="margin:0 0 0.75rem 0; overflow-wrap: anywhere; word-break: break-word;"><strong>${Utils.escapeHTML(map.classDetailsPractitionersLabel || 'Practitioners / Members:')}</strong> ${Utils.escapeHTML(cls.practitioners)}</p>` : ''}
                            ${cls.requirements ? `<p style="margin:0 0 0.75rem 0; overflow-wrap: anywhere; word-break: break-word;"><strong>${Utils.escapeHTML(map.classDetailsRequirementsLabel || 'Requirements:')}</strong> ${Utils.escapeHTML(cls.requirements)}</p>` : ''}
                            <div style="margin-top: 0.5rem;">
                                <div class="text-gray" style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.25rem;">${Utils.escapeHTML(map.classScheduleLabel || 'Schedule:')}</div>
                                ${cls.slots.map(slot => {
                                    const slotDayLabelI18n = App.currentKioskLang && App.KIOSK_I18N[App.currentKioskLang]
                                        ? App.KIOSK_I18N[App.currentKioskLang].days[slot.day] || slot.day
                                        : slot.day;
                                    return `<div class="public-class-slot-row">
                                        <span class="badge" style="background: var(--light); color: var(--dark); min-width: 92px; justify-content: flex-start;">${Utils.escapeHTML(slotDayLabelI18n)}</span>
                                        <span class="slot-time">${Utils.escapeHTML(Utils.convertTo12Hour(slot.start))} - ${Utils.escapeHTML(Utils.convertTo12Hour(slot.end))}</span>
                                    </div>`;
                                }).join('')}
                            </div>
                            <div style="margin-top: 0.75rem; border-top: 1px solid var(--gray-light); padding-top: 0.75rem;" onclick="event.stopPropagation()">
                                <details style="cursor: pointer;">
                                    <summary style="font-weight: bold; outline: none; margin-bottom: 0.5rem;">${Utils.escapeHTML(map.classDetailsRecordedCheckins || 'Recorded Check-ins:')} <span class="badge" style="background: var(--gray); color: white;">${checkins.length}</span></summary>
                                    ${recentCheckins.length ? `<div class="text-gray" style="margin-top:0.5rem; font-size:0.95rem; padding-left: 1rem;"><strong>${Utils.escapeHTML(map.classDetailsRecentLabel || 'Recent:')}</strong><br> ${recentCheckins.map(checkin => {
                                        const member = DB.getMembers().find(m => m.id === checkin.memberId);
                                        const name = member ? `${Utils.escapeHTML(member.firstName)} ${Utils.escapeHTML(member.lastName)}` : Utils.escapeHTML(map.classDetailsUnknownMember || 'Unknown');
                                        const checkinDateText = checkin.slotDate ? Utils.formatDateLocalized(checkin.slotDate, lang) : Utils.formatDate(checkin.entryTime);
                                        return `• ${name} <span style="font-size: 0.85em;">(${checkinDateText})</span>`;
                                    }).join('<br>')}</div>` : `<div class="text-gray" style="margin-top:0.5rem; font-size:0.95rem; padding-left: 1rem;">${Utils.escapeHTML(map.classDetailsNoCheckins || 'No recorded check-ins yet.')}</div>`}
                                </details>
                            </div>
                        </div>
                    </div>
                `;
                App.openModal('modal-class-details');
            },

            cancelKioskClassSelection: () => {
                App.pendingCheckinMember = null;
                App.closeModal('modal-checkin-classes');
                App.showKioskMessage('Check-in cancelled. Enter your ID again to start over.', 'warning');
            },

            // PUBLIC PLANS UI (Filter by visibility)
            showKioskAlert: (title, msg, color) => {
                document.getElementById('kiosk-alert-title').innerText = title;
                document.getElementById('kiosk-alert-title').style.color = color;
                document.getElementById('kiosk-alert-msg').innerText = msg;
                App.openModal('modal-kiosk-alert');
                
                setTimeout(() => { 
                    if (!document.getElementById('modal-kiosk-alert').classList.contains('hidden')) {
                        App.closeModal('modal-kiosk-alert');
                    }
                }, 5000);
            },

            kioskSubmit: () => {
                const input = document.getElementById('kiosk-id-input');
                const id = input.value.trim();
                if (!id) return;
                input.value = ''; input.focus();

                const member = DB.getMembers().find(m => m.id === id);
                if (!member) return App.showKioskMessage('Invalid ID. Member not found.', 'danger');
                if (member.accountStatus === 'Frozen') {
                    App.addNotification('Frozen Check-in Attempt', `${member.firstName} ${member.lastName} attempted to check in, but account is frozen.`, 'warning', member.id);
                    return App.showKioskMessage('Account is Frozen. Please see staff.', 'warning');
                }

                // Inactive members are allowed to check in; their visit will be marked unpaid
                // and they will receive a post-check-in alert to see staff.

                // Determine unpaid/expired state using plan metadata
                const planDays = member.planDays != null ? parseInt(member.planDays, 10) : null;
                const daysRemaining = Utils.getDaysRemaining(member.expirationDate);
                // Default membership alert
                let membershipAlert = '';

                // Decide whether this visit should be marked unpaid by default
                const isUnpaidVisit = App.computeVisitUnpaid(member);

                const lang = App.currentKioskLang || 'en';
                const map = App.KIOSK_I18N[lang] || App.KIOSK_I18N.en;

                // If the member is session-based (no planDays) but has zero sessions left, show a sessions warning instead of treating as unpaid for presentation
                if (member.sessionsTotal && (parseInt(member.sessionsLeft) || 0) <= 0) {
                    membershipAlert = map.kioskAlertSessions || 'Attention: You have used all your plan sessions. Please renew.';
                }

                if (planDays && daysRemaining >= 0 && daysRemaining <= 2) {
                    membershipAlert = (map.kioskAlertExpiring || 'Note: Your membership is about to end in ') + daysRemaining + (map.kioskAlertExpiringDays || ' days.');
                }

                App.pendingCheckinMember = { member, isUnpaidVisit, membershipAlert };
                App.openCheckinClassModal();
            },

            openCheckinClassModal: () => {
                const modal = document.getElementById('modal-checkin-classes');
                const content = document.getElementById('checkin-classes-content');
                const note = document.getElementById('checkin-classes-note');
                if (!modal || !content || !note || !App.pendingCheckinMember) return;
   
                const lang = App.currentKioskLang || 'en';
                const map = App.KIOSK_I18N[lang] || App.KIOSK_I18N.en;
                const noClassesText = map.checkinNoClassesText || 'There are no classes scheduled at this time. Confirm check-in to continue.';
                const noteText = map.checkinClassesNote || 'Select the class(es) you are attending before confirming your check-in.';
                const fallbackCheckinNotice = map.checkinFallbackNotice || 'Your check-in will still be recorded for gym access.';
                const selectText = map.checkinSelectButton || 'Select';
                const selectedText = map.checkinSelectedButton || 'Selected';
                const openGymSummary = map.checkinOpenGymSummary || 'Not taking a class today?';
                const openGymHint = map.checkinOpenGymHint || 'You can still check in for open gym time without selecting a class.';
                const openGymButton = map.checkinOpenGymButton || 'Check In Without a Class (Open Gym)';
   
                const member = App.pendingCheckinMember.member;
                const todayDate = new Date();
                const todayIso = todayDate.toISOString().split('T')[0];
                const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][todayDate.getDay()];
                const schedules = (DB.getSchedules() || []).filter(cls => cls.isPublic !== false);
                const todaySlotEntries = [];
                const alreadyCheckedInSlotIds = new Set(DB.getClassCheckins()
                    .filter(checkin => checkin.memberId === member.id && checkin.slotDate === todayIso)
                    .map(checkin => App.normalizeScheduleSlotId(checkin.classId, checkin.slotDay, checkin.slotStart, checkin.slotEnd)));
   
                schedules.forEach(cls => {
                    (cls.slots || []).forEach(slot => {
                        if (slot.day !== todayName) return;
                        const slotId = App.normalizeScheduleSlotId(cls.id, slot.day, slot.start, slot.end);
                        todaySlotEntries.push({ ...cls, slot, slotId, alreadyCheckedIn: alreadyCheckedInSlotIds.has(slotId) });
                    });
                });
   
                if (todaySlotEntries.length === 0) {
                    content.innerHTML = `<p class="text-gray" style="padding: 1rem 0;">${Utils.escapeHTML(noClassesText)}</p>`;
                    note.innerText = fallbackCheckinNotice;
                } else {
                    const sorted = todaySlotEntries.sort((a, b) => {
                        if (a.slot.start !== b.slot.start) return a.slot.start.localeCompare(b.slot.start);
                        return a.name.localeCompare(b.name);
                    });
                    const availableCount = sorted.filter(entry => !entry.alreadyCheckedIn).length;
                    content.innerHTML = `<div class="checkin-class-grid">${sorted.map(entry => {
                        const dayLabel = App.currentKioskLang && App.KIOSK_I18N[App.currentKioskLang]
                            ? App.KIOSK_I18N[App.currentKioskLang].days[entry.slot.day] || entry.slot.day
                            : entry.slot.day;
                        const dateDisplay = Utils.formatDateLocalized(todayIso, lang);
                        const timeDisplay = `${Utils.convertTo12Hour(entry.slot.start)} - ${Utils.convertTo12Hour(entry.slot.end)}`;
                        const cardClass = `checkin-class-card${entry.alreadyCheckedIn ? ' disabled' : ''}`;
                        const actionText = entry.alreadyCheckedIn ? (map.checkinAlreadyCheckedInBadge || 'Already Checked In') : selectText;
                        const actionStyle = entry.alreadyCheckedIn ? 'background: #fde2e2; color: var(--danger);' : '';
                        const onclickAttr = entry.alreadyCheckedIn ? '' : `onclick="App.toggleCheckinClass('${entry.slotId}')"`;
                        return `
                            <div id="checkin-class-card-${entry.slotId}" class="${cardClass}" ${onclickAttr} style="border-left: 6px solid ${entry.color || '#2563eb'};">
                                <input type="checkbox" name="checkin-class" value="${entry.slotId}" data-class-id="${Utils.escapeHTML(entry.id)}" data-slot-day="${Utils.escapeHTML(entry.slot.day)}" data-slot-start="${Utils.escapeHTML(entry.slot.start)}" data-slot-end="${Utils.escapeHTML(entry.slot.end)}" data-slot-date="${todayIso}" ${entry.alreadyCheckedIn ? 'disabled' : ''} hidden>
                                <div style="display:flex; justify-content:space-between; align-items:center; gap: 0.75rem; flex-wrap: wrap;">
                                    <strong>${Utils.escapeHTML(entry.name)}</strong>
                                    <span class="badge badge-inside checkin-class-action-badge" style="font-size:0.8rem; ${actionStyle}">${Utils.escapeHTML(actionText)}</span>
                                </div>
                                <div class="text-gray" style="font-size:0.95rem; margin-top:0.5rem; overflow-wrap: anywhere; word-break: break-word;">${Utils.escapeHTML(dayLabel)} • ${Utils.escapeHTML(dateDisplay)}</div>
                                <div class="text-gray" style="font-size:0.95rem;">${Utils.escapeHTML(timeDisplay)}</div>
                            </div>
                        `;
                    }).join('')}</div>`;
                    note.innerText = availableCount > 0 ? noteText : (map.checkinAlreadyCheckedInText || 'You have already checked into all classes scheduled for today. Please ask staff for assistance.');
                }

                // Hidden menu: allow checking in without choosing a class (open gym), shown only when there are classes to pick from.
                const openMenu = document.getElementById('checkin-classes-open-menu');
                if (openMenu) {
                    const showMenu = todaySlotEntries.length > 0;
                    openMenu.classList.toggle('hidden', !showMenu);
                    openMenu.innerHTML = showMenu ? `
                        <details class="checkin-open-details">
                            <summary class="checkin-open-summary">${Utils.escapeHTML(openGymSummary)}</summary>
                            <div class="checkin-open-body">
                                <p class="text-gray">${Utils.escapeHTML(openGymHint)}</p>
                                <button class="btn-outline w-full" style="font-weight:600;" onclick="App.confirmCheckin(true)">${Utils.escapeHTML(openGymButton)}</button>
                            </div>
                        </details>` : '';
                }
   
                App.openModal('modal-checkin-classes');
            },

            kioskCheckinWithoutClass: () => {
                App.confirmCheckin(true);
            },
 
            toggleCheckinClass: (slotId) => {
                const card = document.getElementById(`checkin-class-card-${slotId}`);
                const input = card ? card.querySelector('input[name="checkin-class"]') : null;
                if (!input) return;
                input.checked = !input.checked;
                card.classList.toggle('selected', input.checked);
                const lang = App.currentKioskLang || 'en';
                const map = App.KIOSK_I18N[lang] || App.KIOSK_I18N.en;
                const selectText = map.checkinSelectButton || 'Select';
                const selectedText = map.checkinSelectedButton || 'Selected';
                const badge = card.querySelector('.checkin-class-action-badge');
                if (badge) badge.innerText = input.checked ? selectedText : selectText;
            },

            cleanupClassCheckins: () => {
                const visits = DB.getVisits();
                const validVisitIds = new Set(visits.map(v => v.id));
                const filteredCheckins = DB.getClassCheckins().filter(checkin => validVisitIds.has(checkin.visitId));
                if (filteredCheckins.length !== DB.getClassCheckins().length) {
                    DB.saveClassCheckins(filteredCheckins);
                }
            },
 
            confirmKioskClassSelection: (skipClassRequired = false) => {
                if (!App.pendingCheckinMember) return App.closeModal('modal-checkin-classes');
   
                const allInputs = Array.from(document.querySelectorAll('#checkin-classes-content input[name="checkin-class"]'));
                const selectedInputs = allInputs.filter(input => input.checked);
                const selectedClasses = selectedInputs.map(input => ({
                    slotKey: input.value,
                    classId: input.dataset.classId,
                    slotDay: input.dataset.slotDay,
                    slotStart: input.dataset.slotStart,
                    slotEnd: input.dataset.slotEnd,
                    slotDate: input.dataset.slotDate
                }));
                const availableSlotKeys = new Set(allInputs.map(input => input.value));
                const uniqueSelectionKeys = new Set();
                const validSelections = [];
                selectedClasses.forEach(selection => {
                    const key = `${selection.classId}|${selection.slotDate}|${selection.slotStart}|${selection.slotEnd}`;
                    if (!uniqueSelectionKeys.has(key) && availableSlotKeys.has(selection.slotKey)) {
                        uniqueSelectionKeys.add(key);
                        validSelections.push(selection);
                    }
                });
                const availableInputs = allInputs.filter(input => !input.disabled);
                if (availableInputs.length === 0 && !skipClassRequired) {
                    const lang = App.currentKioskLang || 'en';
                    const map = App.KIOSK_I18N[lang] || App.KIOSK_I18N.en;
                    return App.showKioskMessage(map.checkinAlreadyCheckedInText || 'You have already checked into all classes scheduled for today. Please ask staff for assistance.', 'warning');
                }
   
                if (availableSlotKeys.size > 0 && validSelections.length === 0 && !skipClassRequired) {
                    return App.showKioskMessage('Please select at least one class to continue.', 'danger');
                }
 
                const member = App.pendingCheckinMember.member;
                // pendingCheckinMember now stores isUnpaidVisit
                const isUnpaidVisit = !!App.pendingCheckinMember.isUnpaidVisit;
                const membershipAlert = App.pendingCheckinMember.membershipAlert;
                App.pendingCheckinMember = null;
                App.closeModal('modal-checkin-classes');
 
                App.autoCheckoutStaleVisits();
                const visits = DB.getVisits();
                const now = new Date();
                const entryIso = now.toISOString();
                const expected = App.computeExpectedExitTime(entryIso, validSelections, validSelections.length === 0);
                const classIds = [...new Set(validSelections.map(sel => sel.classId))];

                // If the member is already inside an active visit, keep that visit open and attach the
                // new class(es) to it, so back-to-back classes all display next to the member's name.
                let visitId;
                const activeVisit = visits.find(v => v.memberId === member.id && !v.exitTime && v.expectedExitTime && new Date(v.expectedExitTime) > now);
                if (activeVisit) {
                    visitId = activeVisit.id;
                    if (new Date(expected).getTime() > new Date(activeVisit.expectedExitTime).getTime()) {
                        activeVisit.expectedExitTime = expected;
                    }
                    activeVisit.classIds = [...new Set([...(activeVisit.classIds || []), ...classIds])];
                    activeVisit.isUnpaid = !!(activeVisit.isUnpaid || isUnpaidVisit);
                } else {
                    const prevOpen = visits.find(v => v.memberId === member.id && !v.exitTime);
                    if (prevOpen) prevOpen.exitTime = entryIso;
                    visitId = 'V-' + Date.now();
                    visits.push({ id: visitId, memberId: member.id, entryTime: entryIso, expectedExitTime: expected, exitTime: null, isUnpaid: isUnpaidVisit, classIds });
                }
                DB.saveVisits(visits);

                const checkins = DB.getClassCheckins();
                validSelections.forEach((selection, idx) => {
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

                // Decrement sessionsLeft only when the visit is considered paid (i.e., not unpaid)
                // NOTE — session accounting is per CHECK-IN ACTION, not per class:
                //   * One check-in selecting 2 back-to-back classes consumes a single session.
                //   * Two separate check-ins consume one session each (1 session on the first,
                //     then the second is flagged as an unpaid/Needs-Renew visit because
                //     computeVisitUnpaid() treats sessionsLeft <= 0 as unpaid, and no further
                //     decrement happens). The merge above keeps both classes on one visit.
                if (member.sessionsTotal && !isUnpaidVisit) {
                    member.sessionsLeft = (parseInt(member.sessionsLeft) || 0) - 1;
                    const allMembers = DB.getMembers();
                    const mIdx = allMembers.findIndex(m => m.id === member.id);
                    if (mIdx > -1) {
                        allMembers[mIdx] = member;
                        DB.saveMembers(allMembers);
                    }
                }

                if (isUnpaidVisit) {
                    const lang = App.currentKioskLang || 'en';
                    const map = App.KIOSK_I18N[lang] || App.KIOSK_I18N.en;
                    App.addNotification('Expired/Unpaid Member Check-in', `${member.firstName} ${member.lastName} checked in, but their visit is unpaid or they are out of sessions.`, 'danger', member.id);
                    App.showKioskAlert('Membership Alert', membershipAlert || map.kioskAlertExpired || 'Attention: Your membership has expired or you are out of sessions. Please see staff.', 'var(--danger)');
                } else if (membershipAlert) {
                    App.showKioskAlert('Membership Notice', membershipAlert, 'var(--warning)');
                }

                App.renderLivePresent();
                App.renderKioskLeaderboard();
            },

            showKioskMessage: (text, type) => {
                const el = document.getElementById('kiosk-message');
                el.innerText = text;
                el.className = `kiosk-msg ${type}`;
                clearTimeout(App.kioskMsgTimer);
                App.kioskMsgTimer = setTimeout(() => { el.className = 'kiosk-msg hidden'; el.innerText = ''; }, 3500);
                const m = document.getElementById('mobile-checkin-msg');
                if (m) {
                    m.innerText = text;
                    m.className = `kiosk-msg ${type}`;
                    clearTimeout(App.mobileMsgTimer);
                    App.mobileMsgTimer = setTimeout(() => { m.className = 'kiosk-msg hidden'; m.innerText = ''; }, 3500);
                }
            },

            // Build small class tags (name + time range) for a visit's class check-ins.
            // Each class checked into for the visit is shown with its own check-in/out
            // time range so multi-class visits display every class correctly.
            buildVisitClassTags: (visit, small = false) => {
                if (!visit || !visit.id) return '';
                const checkins = DB.getClassCheckins().filter(c => c.visitId === visit.id);
                if (checkins.length === 0) return '';
                const schedules = DB.getSchedules() || [];
                const sizeStyle = small ? ' font-size:0.72rem; padding:0.15rem 0.5rem;' : ' font-size:0.8rem; padding:0.3rem 0.6rem;';
                return `<div class="kiosk-class-tags">${checkins.map(c => {
                    const cls = schedules.find(s => s.id === c.classId);
                    const name = cls ? cls.name : 'Class';
                    const color = (cls && cls.color) || '#2563eb';
                    const time = `${Utils.convertTo12Hour(c.slotStart)} - ${Utils.convertTo12Hour(c.slotEnd)}`;
                    return `<span class="kiosk-class-tag" style="${sizeStyle} border-left: 3px solid ${color};">
                        <strong>${Utils.escapeHTML(name)}</strong>
                        <small>${Utils.escapeHTML(time)}</small>
                    </span>`;
                }).join('')}</div>`;
            },

            renderLivePresent: () => {
                // Ensure any expectedExitTime-based auto-checkouts run first
                App.autoCheckoutStaleVisits();
                const members = DB.getMembers();
                const now = new Date();
                const activeVisits = DB.getVisits().filter(v => v.exitTime === null && v.expectedExitTime && new Date(v.expectedExitTime) > now && members.some(m => m.id === v.memberId) && App.isVisitVisibleNow(v, now));
                const hiddenBelts = DB.getHiddenBelts();
                
                const countEls = [document.getElementById('kiosk-present-count'), document.getElementById('live-present-count')];
                countEls.forEach(el => { if(el) el.innerText = activeVisits.length; });
                
                const generateRow = (visit, isKiosk) => {
                    const m = members.find(m => m.id === visit.memberId);
                    if(!m) return '';

                    // Member-level state
                    const isMemberExpired = m.expirationDate ? Utils.getDaysRemaining(m.expirationDate) < 0 : true;
                    const isOutOfSessions = m.sessionsTotal && parseInt(m.sessionsLeft) <= 0;
                    const isFrozen = m.accountStatus === 'Frozen';

                    // Visit-level payment state should drive the unpaid indicator
                    const isUnpaidVisit = !!visit.isUnpaid;

                    // Badge displayed in admin/live list (Frozen > Unpaid Visit > Out of Sessions)
                    let expiredTag = '';
                    if (isFrozen) expiredTag = `<span class="badge badge-frozen" style="font-size: 0.65rem;">FROZEN</span>`;
                    else if (isUnpaidVisit) expiredTag = `<span class="badge badge-inactive" style="font-size: 0.65rem;">Needs Renew</span>`;
                    else if (isOutOfSessions) expiredTag = `<span class="badge badge-warning" style="font-size: 0.65rem;">No sessions left</span>`;

                    if (isKiosk) {
                        const rawBeltStr = (m.belt || 'White').split('/')[0].trim();
                        if(hiddenBelts.includes(rawBeltStr)) return '';

                        // Red dot now reflects visit-level unpaid status only
                        const expiredDot = isUnpaidVisit ? `<span title="Membership unpaid for this visit" style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--danger); margin-right:8px; vertical-align:middle;"></span>` : '';
                        // If the visit is paid but the member has no sessions left, show a subtle warning (yellow dot)
                        const sessionsDot = (!isUnpaidVisit && isOutOfSessions) ? `<span title="Member has no sessions left after this" style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#f59e0b; margin-right:6px; vertical-align:middle;"></span>` : '';

                        return `<tr><td>
                            <div class="flex-col gap-1">
                                <div class="kiosk-present-name-row">
                                    <span class="kiosk-present-name">${expiredDot}${sessionsDot}${Utils.escapeHTML(m.firstName)} ${Utils.escapeHTML(m.lastName)}</span>
                                    ${App.buildVisitClassTags(visit)}
                                </div>
                                <span class="text-gray" style="font-size: 0.9rem;">${Utils.formatTime(visit.entryTime)}</span>
                            </div>
                            ${Utils.getBeltBadge(m.belt)}
                        </td></tr>`;
                    } else {
                        // Admin list: row background indicates unpaid visit or frozen status
                        let rowBg = '';
                        if (isFrozen) rowBg = 'background: #fffbeb;';
                        else if (isUnpaidVisit) rowBg = 'background: #fef2f2;';

                        return `<tr style="${rowBg}">
                            <td data-label="Name">
                                <div class="admin-present-name-cell">
                                    <strong>${Utils.escapeHTML(m.firstName)} ${Utils.escapeHTML(m.lastName)}</strong>
                                    ${App.buildVisitClassTags(visit, true)}
                                </div>
                            </td>
                            <td data-label="ID" class="text-gray" style="font-size:0.85rem;">${Utils.escapeHTML(m.id)}</td>
                            <td data-label="Belt">${Utils.getBeltBadge(m.belt)}</td>
                            <td data-label="Entry & Duration">
                                <div>${Utils.formatTime(visit.entryTime)}</div>
                                <div class="text-gray" style="font-size:0.8rem;">${Utils.calcDuration(visit.entryTime, null)} inside</div>
                            </td>
                            <td data-label="Status">${isUnpaidVisit ? '<span class="badge badge-inactive">Needs Renew</span>' : (isOutOfSessions ? '<span class="badge badge-warning">No sessions left</span>' : '<span class="badge badge-active">OK</span>')}</td>
                            <td data-label="Action" class="cell-actions">
                                <button class="btn-primary btn-small" onclick="App.checkoutVisit('${visit.id}')">Checkout</button>
                            </td>
                        </tr>`;
                    }
                };

                const kioskList = document.getElementById('kiosk-present-list');
                const adminList = document.getElementById('live-present-list');
                
                if (kioskList) kioskList.innerHTML = activeVisits.map(v => generateRow(v, true)).join('');
                if (adminList) adminList.innerHTML = activeVisits.map(v => generateRow(v, false)).join('') || '<tr><td colspan="6" class="text-center text-gray">No members currently inside.</td></tr>';
            },

            getLeaderboardStandings: () => {
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                const standings = DB.getMembers()
                    .filter(member => !member.hideFromLeaderboard)
                    .map(member => ({
                        member,
                        count: App.getMemberTrainingCount(member.id, threeMonthsAgo)
                    }))
                    .filter(entry => entry.count > 0)
                    .sort((a, b) => b.count - a.count || a.member.lastName.localeCompare(b.member.lastName));
                let prevCount = null;
                let prevRank = 0;
                standings.forEach((entry, index) => {
                    if (index === 0 || entry.count !== prevCount) {
                        entry.rank = index + 1;
                    } else {
                        entry.rank = prevRank;
                    }
                    prevCount = entry.count;
                    prevRank = entry.rank;
                });
                return standings;
            },

            leaderboardRankCell: (rank) => {
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                const medalClass = rank === 1 ? 'kiosk-lb-rank--gold' : rank === 2 ? 'kiosk-lb-rank--silver' : rank === 3 ? 'kiosk-lb-rank--bronze' : '';
                return `<span class="kiosk-lb-rank-num ${medalClass}">${medal}<span>${rank}</span></span>`;
            },

            renderKioskLeaderboard: () => {
                const standings = App.getLeaderboardStandings();
                const top = standings.slice(0, 10);
                const container = document.getElementById('kiosk-leaderboard-container');
                if (!container) return;
                const lang = App.currentKioskLang || 'en';
                const map = App.KIOSK_I18N[lang] || App.KIOSK_I18N.en;

                if (top.length === 0) {
                    container.innerHTML = `<p class="text-gray" style="padding: 1rem 0; text-align:center;">${Utils.escapeHTML(map.leaderboardNoTrainings || 'No trainings recorded in the last 3 months yet.')}</p>`;
                    return;
                }

                container.innerHTML = `
                    <div class="table-responsive kiosk-leaderboard-wrap" style="border:none;">
                        <table class="kiosk-leaderboard-table">
                            <thead>
                                <tr>
                                    <th class="kiosk-lb-rank-col">${Utils.escapeHTML(map.leaderboardRankColumn || 'Rank')}</th>
                                    <th class="kiosk-lb-member-col">${Utils.escapeHTML(map.leaderboardMemberColumn || 'Member')}</th>
                                    <th>${Utils.escapeHTML(map.leaderboardBeltColumn || 'Belt')}</th>
                                    <th class="kiosk-lb-count-col">${Utils.escapeHTML(map.leaderboardSessionsColumn || 'Trainings')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${top.map(entry => `
                                    <tr class="kiosk-lb-row${entry.rank <= 3 ? ' kiosk-lb-row--podium' : ''}">
                                        <td class="kiosk-lb-rank">${App.leaderboardRankCell(entry.rank)}</td>
                                        <td class="kiosk-lb-member"><strong class="kiosk-lb-name">${Utils.escapeHTML(entry.member.firstName)} ${Utils.escapeHTML(entry.member.lastName)}</strong></td>
                                        <td>${Utils.getBeltBadge(entry.member.belt)}</td>
                                        <td class="kiosk-lb-count"><span class="kiosk-lb-count-badge">${entry.count}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            },

            checkoutVisit: (visitId) => {
                const visits = DB.getVisits();
                const visit = visits.find(v => v.id === visitId);
                if (visit && !visit.exitTime) {
                    visit.exitTime = new Date().toISOString();
                    DB.saveVisits(visits);
                    App.renderLivePresent();
                    const dashboardPane = document.getElementById('pane-admin-dashboard');
                    if (dashboardPane && !dashboardPane.classList.contains('hidden')) App.renderAdminDashboard();
                }
            },

});
