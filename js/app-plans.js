// =====================================================================
// app-plans.js
// App methods: showPublicPlans, showPublicClasses, renderPlans, editPlan, cancelPlanEdit, savePlan, movePlan, togglePlanStar, deletePlanFromModal, renderPlanBin, restorePlan, deleteBinPlan, renderClosedDates, addClosedDate, deleteClosedDate
// Plain script (no ES modules). Methods attach to the global App object
// created in app-core.js. Load order is fixed in index.html.
// =====================================================================
Object.assign(App, {
            // --- PLAN MANAGEMENT ---
            // --- ACADEMY CLOSED DATES ---
            showPublicPlans: () => {
                const plans = DB.getPlans().filter(p => p.isPublic !== false);
                const list = document.getElementById('public-plans-list');

                if (plans.length === 0) {
                    list.innerHTML = '<p class="text-gray text-center" style="padding: 2rem 0;">No plans are currently available. Please see staff for details.</p>';
                } else {
                    list.innerHTML = plans.map(p => {
                        const color = p.color || '#2563eb';
                        const featuredHtml = p.starred ? `<span class="plan-featured-star-inline" style="margin-right:8px; vertical-align:middle;">★</span>` : '';
                        const descriptionContent = p.description ? Utils.renderPlanDescription(p.description, p.descriptionHtml === true) : null;
                        return `
                        <div class="card plan-card cursor-pointer" onclick="this.querySelector('.plan-details').classList.toggle('hidden')" style="margin-bottom: 1rem; border: 1px solid var(--gray-light); border-left: 6px solid ${color}; transition: 0.2s ease;">
                            <div class="public-card-head flex justify-between align-center">
                                <div style="min-width: 0;">
                                    <h3 style="margin: 0; color: ${color};">${featuredHtml}${Utils.escapeHTML(p.name)}</h3>
                                </div>
                                <strong style="font-size: 1.1rem; color: var(--dark); flex-shrink: 0;">${DB.getCurrency()}${parseFloat(p.price).toFixed(2)}</strong>
                            </div>
                            <div class="public-card-head flex justify-between align-center mt-1">
                                <div class="text-gray" style="font-size: 0.85rem; min-width: 0;">Valid for: <strong>${Utils.escapeHTML(Utils.formatPlanValidity(p))}</strong></div>
                                <div class="text-gray" style="font-size: 0.8rem; flex-shrink: 0;">Click to expand ▼</div>
                            </div>
                            <div class="plan-details hidden mt-1" style="border-top: 1px solid var(--gray-light); padding-top: 0.75rem;">
                                ${descriptionContent ? `<div style="font-size: 0.95rem; overflow-wrap: anywhere; word-break: break-word;">${descriptionContent}</div>` : '<p class="text-gray" style="font-size: 0.95rem;">No additional description provided.</p>'}
                            </div>
                        </div>`;
                    }).join('');
                }
                App.openModal('modal-public-plans');
            },

            showPublicClasses: () => {
                const classes = (DB.getSchedules() || []).filter(c => c.isPublic !== false);
                const list = document.getElementById('public-classes-list');
                const lang = App.currentKioskLang || 'en';
                const map = App.KIOSK_I18N[lang] || App.KIOSK_I18N.en;

                if (classes.length === 0) {
                    list.innerHTML = `<p class="text-gray text-center" style="padding: 2rem 0;">${Utils.escapeHTML(map.checkinNoClassesText || 'There are no classes scheduled at this time.')}</p>`;
                } else {
                    list.innerHTML = classes.map(cls => {
                        const color = cls.color || '#2563eb';
                        const descriptionContent = cls.description
                            ? Utils.escapeHTML(cls.description)
                            : `<span class="text-gray" style="font-style: italic;">${Utils.escapeHTML(map.classDetailsNoDescription || 'No description available.')}</span>`;
                        const scheduleSlots = (cls.slots || []).map(slot => {
                            const slotDayLabel = App.currentKioskLang && App.KIOSK_I18N[App.currentKioskLang]
                                ? App.KIOSK_I18N[App.currentKioskLang].days[slot.day] || slot.day
                                : slot.day;
                            return `
                            <div class="public-class-slot-row">
                                <span class="badge" style="background: var(--light); color: var(--dark); min-width: 92px; justify-content: flex-start;">${Utils.escapeHTML(slotDayLabel)}</span>
                                <span class="slot-time">${Utils.convertTo12Hour(slot.start)} - ${Utils.convertTo12Hour(slot.end)}</span>
                            </div>`;
                        }).join('');
                        return `
                        <div class="card plan-card public-class-card cursor-pointer" onclick="App.togglePublicClassDetails(this)" style="margin-bottom: 1rem; border: 1px solid var(--gray-light); border-left: 6px solid ${color}; transition: 0.2s ease;">
                            <div class="public-card-head flex justify-between align-center" style="gap: 0.75rem;">
                                <h3 style="margin: 0; color: ${color};">${Utils.escapeHTML(cls.name)}</h3>
                                <span class="text-gray public-class-expand-label" style="font-size: 0.8rem; flex-shrink: 0;">${Utils.escapeHTML(map.classExpandDetails || 'View schedule & details')} ▸</span>
                            </div>
                            <div class="public-class-details hidden mt-1" style="border-top: 1px solid var(--gray-light); padding-top: 0.75rem;">
                                <p class="text-gray" style="margin-top: 0; font-size: 0.95rem; overflow-wrap: anywhere; word-break: break-word;">${descriptionContent}</p>
                                ${cls.practitioners ? `<p style="margin:0 0 0.6rem 0; overflow-wrap: anywhere; word-break: break-word;"><strong>${Utils.escapeHTML(map.classDetailsPractitionersLabel || 'Practitioners / Members:')}</strong> ${Utils.escapeHTML(cls.practitioners)}</p>` : ''}
                                ${cls.requirements ? `<p style="margin:0 0 0.6rem 0; overflow-wrap: anywhere; word-break: break-word;"><strong>${Utils.escapeHTML(map.classDetailsRequirementsLabel || 'Requirements:')}</strong> ${Utils.escapeHTML(cls.requirements)}</p>` : ''}
                                <div style="margin-top: 0.5rem;">
                                    <div class="text-gray" style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.25rem;">${Utils.escapeHTML(map.classScheduleLabel || 'Schedule:')}</div>
                                    ${scheduleSlots || '<p class="text-gray" style="font-size:0.9rem;">' + Utils.escapeHTML(map.checkinScheduleUnavailable || 'Schedule details not available.') + '</p>'}
                                </div>
                            </div>
                        </div>`;
                    }).join('');
                }
                App.openModal('modal-public-classes');
            },

            togglePublicClassDetails: (card) => {
                if (!card) return;
                const details = card.querySelector('.public-class-details');
                const label = card.querySelector('.public-class-expand-label');
                if (!details) return;
                const willExpand = details.classList.contains('hidden');
                details.classList.toggle('hidden', !willExpand);
                const map = App.KIOSK_I18N[App.currentKioskLang || 'en'] || App.KIOSK_I18N.en;
                if (label) label.innerText = willExpand
                    ? (map.classCollapseDetails || 'Hide details') + ' ▾'
                    : (map.classExpandDetails || 'View schedule & details') + ' ▸';
            },

            renderPlans: () => {
                const list = document.getElementById('plans-list');
                const plans = DB.getPlans();
                list.innerHTML = plans.map((p, index) => `
                    <tr draggable="true"
                        ondragstart="App.dragPlanRowStart(event, ${index})"
                        ondragover="App.dragPlanRowOver(event)"
                        ondragenter="event.preventDefault()"
                        ondrop="App.dropPlanRow(${index})"
                        ondragend="App.dragPlanRowEnd()">
                        <td data-label="Plan Name">
                            <div class="flex align-center gap-1" style="flex-wrap: wrap;">
                                <div class="color-swatch" style="background: ${p.color || '#2563eb'}; width: 16px; height: 16px;"></div>
                                <div class="plan-name-cell"><strong>${Utils.escapeHTML(p.name)}</strong></div>
                                <button class="btn-outline btn-small" onclick="App.togglePlanStar('${p.id}')" title="Featured" style="padding: 0.25rem 0.5rem; line-height: 1;">${p.starred ? '<span style="color:#f59e0b;">★</span>' : '<span style="color:#cbd5e1;">★</span>'}</button>
                            </div>
                        </td>
                        <td data-label="Validity (Days)">${p.days != null && p.days !== '' ? p.days : '-'}</td>
                        <td data-label="Sessions">${p.sessions ? p.sessions : 'Unlimited'}</td>
                        <td data-label="On Kiosk">
                            <label class="closed-date-toggle" title="Visible on Member Kiosk">
                                <input type="checkbox" ${p.isPublic !== false ? 'checked' : ''} onchange="App.togglePlanVisibility('${p.id}', this.checked)">
                                <span class="closed-date-toggle-track"></span>
                            </label>
                        </td>
                        <td data-label="Price">${DB.getCurrency()}${parseFloat(p.price).toFixed(2)}</td>
                        <td data-label="Action"><button class="btn-primary btn-small" onclick="App.editPlan('${p.id}')">Edit</button></td>
                        <td data-label="Drag" class="drag-handle-cell" title="Drag to reorder"><span class="drag-handle">⠿</span></td>
                    </tr>
                `).join('') || '<tr><td colspan="7" class="text-center text-gray">No active plans found.</td></tr>';
                
                const select = document.getElementById('select-edit-plan');
                select.innerHTML = '<option value="">-- Create New Plan --</option>' + plans.map(p => `<option value="${p.id}">${Utils.escapeHTML(p.name)}</option>`).join('');
                App.updateUICurrency();
            },

            dragPlanRowStart: (e, index) => {
                App.draggedRowIndex = index;
                if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(index)); }
            },
            dragPlanRowOver: (e) => {
                e.preventDefault();
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
                const tr = e.currentTarget;
                if (tr) tr.classList.add('drag-over');
            },
            dragPlanRowEnd: () => {
                document.querySelectorAll('#plans-list tr').forEach(tr => tr.classList.remove('drag-over'));
                App.draggedRowIndex = null;
            },
            dropPlanRow: (targetIndex) => {
                const srcIndex = App.draggedRowIndex;
                document.querySelectorAll('#plans-list tr').forEach(tr => tr.classList.remove('drag-over'));
                App.draggedRowIndex = null;
                if (srcIndex === null || srcIndex === targetIndex) return;
                const plans = DB.getPlans();
                if (srcIndex < 0 || srcIndex >= plans.length) return;
                const [moved] = plans.splice(srcIndex, 1);
                plans.splice(targetIndex, 0, moved);
                DB.savePlans(plans);
                App.renderPlans();
            },

            editPlan: (id) => {
                const plan = DB.getPlans().find(p => p.id === id);
                if (!plan) return;
                document.getElementById('form-plan-id').value = plan.id;
                document.getElementById('form-plan-name').value = plan.name;
                document.getElementById('form-plan-desc').value = plan.description || '';
                document.getElementById('form-plan-desc-html').checked = plan.descriptionHtml === true;
                document.getElementById('form-plan-days').value = plan.days;
                document.getElementById('form-plan-sessions').value = plan.sessions || '';
                document.getElementById('form-plan-visible').checked = plan.isPublic !== false;
                document.getElementById('form-plan-starred').checked = plan.starred === true;
                document.getElementById('form-plan-price').value = plan.price;
                App.updatePlanVisibilityLabel();
                App.updatePlanStarredLabel();
                App.selectPlanColor(plan.color || '#2563eb');
                document.getElementById('btn-delete-plan').classList.remove('hidden');
                document.getElementById('btn-cancel-plan-edit').classList.remove('hidden');
                document.getElementById('select-edit-plan').value = plan.id;
                App.switchTab('plans', 'create');
            },

            cancelPlanEdit: () => {
                document.getElementById('plan-form').reset();
                document.getElementById('form-plan-id').value = '';
                document.getElementById('btn-delete-plan').classList.add('hidden');
                document.getElementById('btn-cancel-plan-edit').classList.add('hidden');
                document.getElementById('select-edit-plan').value = '';
                document.getElementById('form-plan-starred').checked = false;
                document.getElementById('form-plan-desc-html').checked = false;
                App.updatePlanVisibilityLabel();
                App.updatePlanStarredLabel();
                App.selectPlanColor('#2563eb');
            },

            savePlan: (e) => {
                e.preventDefault();
                const plans = DB.getPlans();
                const id = document.getElementById('form-plan-id').value || 'P-' + Date.now();
                const isNew = !document.getElementById('form-plan-id').value;
                const daysValue = document.getElementById('form-plan-days').value.trim();
                const sessionsValue = document.getElementById('form-plan-sessions').value.trim();
                const days = daysValue ? parseInt(daysValue, 10) : null;
                if (!daysValue && !sessionsValue) return alert('Enter either a validity window or a session count.');
                const newPlan = {
                    id,
                    name: document.getElementById('form-plan-name').value,
                    description: document.getElementById('form-plan-desc').value,
                    descriptionHtml: document.getElementById('form-plan-desc-html').checked,
                    color: document.getElementById('form-plan-color').value,
                    days: days !== null && !Number.isNaN(days) ? days : null,
                    sessions: sessionsValue || null,
                    isPublic: document.getElementById('form-plan-visible').checked,
                    starred: document.getElementById('form-plan-starred').checked,
                    price: document.getElementById('form-plan-price').value
                };

                if (isNew) plans.push(newPlan);
                else { const idx = plans.findIndex(p => p.id === id); if(idx > -1) plans[idx] = newPlan; }
                
                DB.savePlans(plans);
                App.cancelPlanEdit();
                App.renderPlans();
                App.switchTab('plans', 'list');
            },

            movePlan: (id, direction) => {
                const plans = DB.getPlans();
                const index = plans.findIndex(p => p.id === id);
                if (index === -1) return;
                const target = index + direction;
                if (target < 0 || target >= plans.length) return;
                const [moved] = plans.splice(index, 1);
                plans.splice(target, 0, moved);
                DB.savePlans(plans);
                App.renderPlans();
            },

            togglePlanStar: (id) => {
                const plans = DB.getPlans();
                const plan = plans.find(p => p.id === id);
                if (!plan) return;
                plan.starred = !plan.starred;
                DB.savePlans(plans);
                App.renderPlans();
            },

            togglePlanVisibility: (id, visible) => {
                const plans = DB.getPlans();
                const plan = plans.find(p => p.id === id);
                if (!plan) return;
                plan.isPublic = !!visible;
                DB.savePlans(plans);
                App.renderPlans();
            },

            updatePlanVisibilityLabel: () => {
                const cb = document.getElementById('form-plan-visible');
                const lbl = document.getElementById('form-plan-visible-label');
                if (cb && lbl) lbl.innerText = cb.checked ? 'Visible' : 'Hidden';
            },

            updatePlanStarredLabel: () => {
                const cb = document.getElementById('form-plan-starred');
                const lbl = document.getElementById('form-plan-starred-label');
                if (cb && lbl) lbl.innerText = cb.checked ? 'Starred' : 'Standard';
            },
 
            deletePlanFromModal: () => {
                if(!confirm('Delete this plan?')) return;
                const id = document.getElementById('form-plan-id').value;
                const plans = DB.getPlans();
                const plan = plans.find(p => p.id === id);
                if (plan) {
                    const bin = DB.getPlanBin();
                    plan.deletedAt = new Date().toISOString();
                    bin.push(plan);
                    DB.savePlanBin(bin);
                    DB.savePlans(plans.filter(p => p.id !== id));
                }
                App.cancelPlanEdit();
                App.renderPlans();
                App.renderPlanBin();
                App.switchTab('plans', 'list');
            },
            
            renderPlanBin: () => {
                const bin = DB.getPlanBin();
                document.getElementById('plan-bin-list').innerHTML = bin.map(p => `
                    <tr>
                        <td data-label="Plan Name">${Utils.escapeHTML(p.name)}</td>
                        <td data-label="Validity (Days)">${p.days != null && p.days !== '' ? p.days : '-'}</td>
                        <td data-label="Deleted Date">${Utils.formatDate(p.deletedAt)}</td>
                        <td data-label="Action" class="cell-actions">
                            <div class="flex gap-1">
                                <button class="btn-success btn-small" onclick="App.restorePlan('${p.id}')">Restore</button>
                                <button class="btn-danger btn-small" onclick="App.deleteBinPlan('${p.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="4" class="text-center text-gray">Recycle bin empty.</td></tr>';
            },

            restorePlan: (id) => {
                const bin = DB.getPlanBin();
                const idx = bin.findIndex(p => p.id === id);
                if(idx > -1) {
                    const plans = DB.getPlans();
                    plans.push(bin[idx]);
                    DB.savePlans(plans);
                    bin.splice(idx, 1);
                    DB.savePlanBin(bin);
                    App.renderPlans();
                    App.renderPlanBin();
                }
            },
            
            deleteBinPlan: (id) => {
                if(confirm('Permanently delete plan?')) {
                    DB.savePlanBin(DB.getPlanBin().filter(p => p.id !== id));
                    App.renderPlanBin();
                }
            },

            renderClosedDates: () => {
                const dates = DB.getClosedDates();
                const list = document.getElementById('closed-dates-list');

                list.innerHTML = dates.sort((a, b) => {
                    const da = typeof a === 'string' ? a : a.date;
                    const db = typeof b === 'string' ? b : b.date;
                    return new Date(da) - new Date(db);
                }).map((d, index) => {
                    const entry = typeof d === 'string' ? { date: d, reason: 'N/A' } : d;
                    let dateDisplay = Utils.formatDate(entry.date);
                    if (entry.dateEnd && entry.dateEnd !== entry.date) {
                        dateDisplay += ` &rarr; ${Utils.formatDate(entry.dateEnd)}`;
                    }
                    const repeatBadge = entry.repeat
                        ? '<span class="badge badge-inside" style="background:#dbeafe;color:#1e40af;">Yearly</span>'
                        : '<span class="text-gray" style="font-size:0.85rem;">—</span>';
                    return `
                    <tr>
                        <td data-label="Date / Range">${dateDisplay}</td>
                        <td data-label="Holiday / Reason">${Utils.escapeHTML(entry.reason || '')}</td>
                        <td data-label="Repeats">${repeatBadge}</td>
                        <td data-label="Action" class="cell-actions"><button class="btn-danger btn-small" onclick="App.deleteClosedDate(${index})">Remove</button></td>
                    </tr>
                `}).join('') || '<tr><td colspan="4" class="text-center text-gray">No closed dates configured.</td></tr>';
            },

            addClosedDate: () => {
                const d     = document.getElementById('form-closed-date').value;
                const dEnd  = document.getElementById('form-closed-date-end').value;
                const reason = document.getElementById('form-closed-reason').value;
                const repeat = document.getElementById('form-closed-repeat').checked;
                if (!d) return;
                if (dEnd && dEnd < d) return alert('End date must be on or after the start date.');

                const dates = DB.getClosedDates();
                dates.push({ date: d, dateEnd: dEnd || d, reason: reason || 'Academy Closed', repeat });
                DB.saveClosedDates(dates);

                document.getElementById('form-closed-date').value = '';
                document.getElementById('form-closed-date-end').value = '';
                document.getElementById('form-closed-reason').value = '';
                document.getElementById('form-closed-repeat').checked = false;
                App.renderClosedDates();
            },

            deleteClosedDate: (index) => {
                const dates = DB.getClosedDates();
                dates.splice(index, 1);
                DB.saveClosedDates(dates);
                App.renderClosedDates();
            },

});
