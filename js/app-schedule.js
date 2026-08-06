// =====================================================================
// app-schedule.js
// App methods: addDraftSlot, renderDraftSlots, removeDraftSlot, editDraftSlot, saveClassSchedule, cancelScheduleEdit, editScheduleClass, deleteScheduleDirect, renderScheduleBin, restoreSchedule, deleteBinSchedule, renderSchedules, renderCalendarView
// Plain script (no ES modules). Methods attach to the global App object
// created in app-core.js. Load order is fixed in index.html.
// =====================================================================
Object.assign(App, {
            // --- SCHEDULES SYSTEM ---
            addDraftSlot: () => {
                const checkedDays = Array.from(document.querySelectorAll('#draft-days input:checked')).map(cb => cb.value);
                const start = document.getElementById('draft-start-time').value;
                const end = document.getElementById('draft-end-time').value;
                const editingId = document.getElementById('draft-editing-id').value;

                if (checkedDays.length === 0 || !start || !end) return alert('Select at least one day, start time, and end time.');
                if (start >= end) return alert('End time must be after start time.');

                if (editingId) {
                    const idx = App.draftClassSlots.findIndex(s => s.id === editingId);
                    if (idx > -1) {
                        // Update the existing slot with the first selected day
                        App.draftClassSlots[idx] = { ...App.draftClassSlots[idx], day: checkedDays[0], start, end };
                        // Any additional checked days create new slots
                        for (let i = 1; i < checkedDays.length; i++) {
                            App.draftClassSlots.push({ id: 'SLOT-' + Date.now() + Math.random(), day: checkedDays[i], start, end });
                        }
                    }
                    document.getElementById('draft-editing-id').value = '';
                    const addBtn = document.querySelector('#tab-content-schedule-builder button[onclick="App.addDraftSlot()"]');
                    if (addBtn) addBtn.innerText = '+ Add Time Slot to Class';
                } else {
                    checkedDays.forEach(day => {
                        App.draftClassSlots.push({ id: 'SLOT-' + Date.now() + Math.random(), day, start, end });
                    });
                }

                document.querySelectorAll('#draft-days input').forEach(cb => cb.checked = false);
                document.getElementById('draft-start-time').value = '';
                document.getElementById('draft-end-time').value = '';
                App.renderDraftSlots();
            },


            renderDraftSlots: () => {
                const container = document.getElementById('draft-slots-container');
                const list = document.getElementById('draft-slots-list');
                
                if (App.draftClassSlots.length === 0) {
                    container.classList.add('hidden');
                } else {
                    container.classList.remove('hidden');
                    const sorted = [...App.draftClassSlots].sort((a,b) => {
                        const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
                        if(days.indexOf(a.day) !== days.indexOf(b.day)) return days.indexOf(a.day) - days.indexOf(b.day);
                        return a.start.localeCompare(b.start);
                    });
                    
                    list.innerHTML = sorted.map(slot => `
                        <div class="slot-card" style="display:flex; justify-content:space-between; align-items:center; gap: 0.5rem;">
                            <div><strong>${slot.day}</strong>: ${Utils.convertTo12Hour(slot.start)} - ${Utils.convertTo12Hour(slot.end)}</div>
                            <div style="display:flex; gap:0.5rem;">
                                <button class="btn-outline btn-small" onclick="App.editDraftSlot('${slot.id}')">Edit</button>
                                <button class="btn-danger btn-small" onclick="App.removeDraftSlot('${slot.id}')">✕</button>
                            </div>
                        </div>
                    `).join('');
                }
            },

            removeDraftSlot: (id) => {
                App.draftClassSlots = App.draftClassSlots.filter(s => s.id !== id);
                App.renderDraftSlots();
            },

            editDraftSlot: (id) => {
                const slot = App.draftClassSlots.find(s => s.id === id);
                if (!slot) return;
                // set day checkboxes
                document.querySelectorAll('#draft-days input').forEach(cb => cb.checked = (cb.value === slot.day));
                document.getElementById('draft-start-time').value = slot.start;
                document.getElementById('draft-end-time').value = slot.end;
                document.getElementById('draft-editing-id').value = slot.id;
                // change add button to indicate saving
                const addBtn = document.querySelector('#tab-content-schedule-builder button[onclick="App.addDraftSlot()"]');
                if (addBtn) addBtn.innerText = 'Save Changes';
                // scroll to top of builder if needed
                const parent = document.getElementById('tab-content-schedule-builder');
                if (parent) parent.scrollIntoView({ behavior: 'smooth' });
            },

            saveClassSchedule: () => {
                const name = document.getElementById('form-sched-class-name').value.trim();
                if (!name) return alert('Enter a class name.');
                if (App.draftClassSlots.length === 0) return alert('Add at least one time slot for this class.');

                const schedules = DB.getSchedules();
                const id = document.getElementById('form-sched-id').value || 'CLS-' + Date.now();
                const isNew = !document.getElementById('form-sched-id').value;
                const color = document.getElementById('form-sched-color').value || '#2563eb';
                 
                const description = document.getElementById('form-sched-desc').value;
                const practitioners = document.getElementById('form-sched-practitioners').value.trim();
                const requirements = document.getElementById('form-sched-requirements').value.trim();
                const newClass = { id, name, description, practitioners, requirements, color, isPublic: document.getElementById('form-sched-visible').checked, slots: App.draftClassSlots };

                if (isNew) schedules.push(newClass);
                else { const idx = schedules.findIndex(c => c.id === id); if(idx > -1) schedules[idx] = newClass; }
                
                DB.saveSchedules(schedules);
                App.cancelScheduleEdit();
                App.renderSchedules();
                App.switchTab('schedule', 'master');
                App.renderCalendarView('kiosk-schedule-container', false);
            },

            cancelScheduleEdit: () => {
                document.getElementById('form-sched-id').value = '';
                document.getElementById('form-sched-class-name').value = '';
                document.getElementById('form-sched-desc').value = '';
                document.getElementById('form-sched-practitioners').value = '';
                document.getElementById('form-sched-requirements').value = '';
                document.getElementById('form-sched-visible').checked = true;
                App.updateClassVisibilityLabel();
                App.selectPaletteColor('form-sched-color', 'preset-sched-color-palette', '#2563eb');
                document.getElementById('btn-delete-schedule').classList.add('hidden');
                document.getElementById('btn-cancel-schedule-edit').classList.add('hidden');
                document.getElementById('schedule-builder-title').innerText = 'Add New Class';
                App.draftClassSlots = [];
                App.renderDraftSlots();
            },

            editScheduleClass: (id) => {
                const cls = DB.getSchedules().find(c => c.id === id);
                if (!cls) return;
                
                document.getElementById('schedule-builder-title').innerText = 'Edit Class: ' + cls.name;
                document.getElementById('form-sched-id').value = cls.id;
                document.getElementById('form-sched-class-name').value = cls.name;
                document.getElementById('form-sched-desc').value = cls.description || '';
                document.getElementById('form-sched-practitioners').value = cls.practitioners || '';
                document.getElementById('form-sched-requirements').value = cls.requirements || '';
                document.getElementById('form-sched-visible').checked = cls.isPublic !== false;
                App.updateClassVisibilityLabel();
                App.selectPaletteColor('form-sched-color', 'preset-sched-color-palette', cls.color || '#2563eb');
                App.draftClassSlots = [...cls.slots];
                App.renderDraftSlots();
                
                document.getElementById('btn-delete-schedule').classList.remove('hidden');
                document.getElementById('btn-cancel-schedule-edit').classList.remove('hidden');
                App.switchTab('schedule', 'builder');
            },

            deleteScheduleDirect: () => {
                if(!confirm('Delete this entire class and all its slots?')) return;
                const id = document.getElementById('form-sched-id').value;
                const schedules = DB.getSchedules();
                const bin = DB.getScheduleBin();
                const cls = schedules.find(c => c.id === id);
                if(cls) {
                    cls.deletedAt = new Date().toISOString();
                    bin.push(cls);
                    DB.saveScheduleBin(bin);
                    DB.saveSchedules(schedules.filter(c => c.id !== id));
                }
                App.cancelScheduleEdit();
                App.renderSchedules();
                App.renderScheduleBin();
                App.switchTab('schedule', 'master');
                App.renderCalendarView('kiosk-schedule-container', false);
            },
            
            renderScheduleBin: () => {
                const bin = DB.getScheduleBin();
                document.getElementById('schedule-bin-list').innerHTML = bin.map(c => `
                    <tr>
                        <td data-label="Class Name">${Utils.escapeHTML(c.name)}</td>
                        <td data-label="Deleted Date">${Utils.formatDate(c.deletedAt)}</td>
                        <td data-label="Action" class="cell-actions">
                            <div class="flex gap-1">
                                <button class="btn-success btn-small" onclick="App.restoreSchedule('${c.id}')">Restore</button>
                                <button class="btn-danger btn-small" onclick="App.deleteBinSchedule('${c.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="3" class="text-center text-gray">Recycle bin empty.</td></tr>';
            },

            restoreSchedule: (id) => {
                const bin = DB.getScheduleBin();
                const idx = bin.findIndex(c => c.id === id);
                if (idx > -1) {
                    const schedules = DB.getSchedules();
                    schedules.push(bin[idx]);
                    DB.saveSchedules(schedules);
                    bin.splice(idx, 1);
                    DB.saveScheduleBin(bin);
                    App.renderSchedules();
                    App.renderScheduleBin();
                    App.renderCalendarView('kiosk-schedule-container', false);
                }
            },
            
            deleteBinSchedule: (id) => {
                if(confirm('Permanently delete schedule?')) {
                    DB.saveScheduleBin(DB.getScheduleBin().filter(s => s.id !== id));
                    App.renderScheduleBin();
                }
            },

            renderSchedules: () => { App.renderCalendarView('master-schedule-container', true); App.renderClassList(); },

            renderClassList: () => {
                const list = document.getElementById('schedule-classes-list');
                if (!list) return;
                const schedules = DB.getSchedules();
                const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
                list.innerHTML = schedules.map((cls, index) => {
                    const color = cls.color || '#2563eb';
                    const slotSummary = (cls.slots || []).slice().sort((a, b) => {
                        const dayDiff = days.indexOf(a.day) - days.indexOf(b.day);
                        if (dayDiff !== 0) return dayDiff;
                        return a.start.localeCompare(b.start);
                    }).map(s => `${s.day}: ${Utils.convertTo12Hour(s.start)} - ${Utils.convertTo12Hour(s.end)}`).join('<br>') || 'No time slots';
                    return `
                    <tr draggable="true"
                        ondragstart="App.dragScheduleRowStart(event, ${index})"
                        ondragover="App.dragScheduleRowOver(event)"
                        ondragenter="event.preventDefault()"
                        ondrop="App.dropScheduleRow(${index})"
                        ondragend="App.dragScheduleRowEnd()">
                        <td data-label="Class">
                            <div class="flex align-center gap-1" style="flex-wrap: wrap;">
                                <div class="color-swatch" style="background: ${color}; width: 16px; height: 16px;"></div>
                                <div class="plan-name-cell"><strong>${Utils.escapeHTML(cls.name)}</strong></div>
                                <button class="btn-primary btn-small" onclick="App.editScheduleClass('${cls.id}')">Edit</button>
                            </div>
                        </td>
                        <td data-label="Schedule" style="white-space: normal;">${slotSummary}</td>
                        <td data-label="Visible on Kiosk">
                            <label class="closed-date-toggle" title="Visible on Kiosk">
                                <input type="checkbox" ${cls.isPublic !== false ? 'checked' : ''} onchange="App.toggleClassVisibility('${cls.id}', this.checked)">
                                <span class="closed-date-toggle-track"></span>
                            </label>
                        </td>
                        <td data-label="Drag" class="drag-handle-cell" title="Drag to reorder"><span class="drag-handle">⠿</span></td>
                    </tr>
                    `;
                }).join('') || '<tr><td colspan="4" class="text-center text-gray">No classes found. Add a class to get started.</td></tr>';
            },

            toggleClassVisibility: (id, visible) => {
                const schedules = DB.getSchedules();
                const cls = schedules.find(c => c.id === id);
                if (!cls) return;
                cls.isPublic = !!visible;
                DB.saveSchedules(schedules);
                App.renderClassList();
                App.renderCalendarView('kiosk-schedule-container', false);
                App.renderCalendarView('master-schedule-container', true);
            },

            updateClassVisibilityLabel: () => {
                const cb = document.getElementById('form-sched-visible');
                const lbl = document.getElementById('form-sched-visible-label');
                if (cb && lbl) lbl.innerText = cb.checked ? 'Visible' : 'Hidden';
            },

            dragScheduleRowStart: (e, index) => {
                App.draggedRowIndex = index;
                if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(index)); }
            },
            dragScheduleRowOver: (e) => {
                e.preventDefault();
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
                const tr = e.currentTarget;
                if (tr) tr.classList.add('drag-over');
            },
            dragScheduleRowEnd: () => {
                document.querySelectorAll('#schedule-classes-list tr').forEach(tr => tr.classList.remove('drag-over'));
                App.draggedRowIndex = null;
            },
            dropScheduleRow: (targetIndex) => {
                const srcIndex = App.draggedRowIndex;
                document.querySelectorAll('#schedule-classes-list tr').forEach(tr => tr.classList.remove('drag-over'));
                App.draggedRowIndex = null;
                if (srcIndex === null || srcIndex === targetIndex) return;
                const schedules = DB.getSchedules();
                if (srcIndex < 0 || srcIndex >= schedules.length) return;
                const [moved] = schedules.splice(srcIndex, 1);
                schedules.splice(targetIndex, 0, moved);
                DB.saveSchedules(schedules);
                App.renderClassList();
                App.renderCalendarView('kiosk-schedule-container', false);
                App.renderCalendarView('master-schedule-container', true);
            },

            renderCalendarView: (containerId, isAdminView) => {
                const schedules = (DB.getSchedules() || []).filter(cls => isAdminView || cls.isPublic !== false);
                const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
                const container = document.getElementById(containerId);

                // Build each day column HTML first so we can count how many are rendered (weekends may be omitted)
                const renderedDayColumns = [];

                days.forEach(day => {
                    let daySlots = [];
                    schedules.forEach(cls => {
                        (cls.slots || []).filter(s => s.day === day).forEach(slot => {
                            daySlots.push({ ...slot, className: cls.name, classId: cls.id, color: cls.color || '#2563eb' });
                        });
                    });

                    daySlots.sort((a,b) => a.start.localeCompare(b.start));

                    // Hide Saturday or Sunday columns only when they have no classes
                    if ((day === 'Saturday' || day === 'Sunday') && daySlots.length === 0) return;

                    const visibleDay = (containerId === 'kiosk-schedule-container' && App.currentKioskLang && App.KIOSK_I18N[App.currentKioskLang])
                        ? App.KIOSK_I18N[App.currentKioskLang].days[day] || day
                        : day;
                    let colHtml = `<div class="calendar-day-col">
                        <div class="calendar-day-header">${visibleDay}</div>`;

                    if (daySlots.length === 0) {
                        colHtml += `<div class="text-gray" style="text-align:center; padding: 1rem; font-size: 0.85rem;">No classes</div>`;
                    } else {
                        colHtml += daySlots.map(slot => `
                            <div class="sched-card cursor-pointer" ${isAdminView ? `onclick="App.editScheduleClass('${slot.classId}')" title="Click to edit this class"` : `onclick="App.openClassDetails('${slot.classId}','${slot.day}','${slot.start}','${slot.end}')" title="Click to view class details"`} style="border-left: 6px solid ${slot.color};">
                                <div class="sched-time">${Utils.convertTo12Hour(slot.start)} - ${Utils.convertTo12Hour(slot.end)}</div>
                                <div class="sched-name">${Utils.escapeHTML(slot.className)}</div>
                            </div>
                        `).join('');
                    }

                    colHtml += `</div>`;
                    renderedDayColumns.push(colHtml);
                });

                const daysCount = Math.max(1, renderedDayColumns.length);
                const gridHtml = `<div class="calendar-grid" style="--days-count: ${daysCount};">${renderedDayColumns.join('')}</div>`;
                container.innerHTML = gridHtml;
            }
});
