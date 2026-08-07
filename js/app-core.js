// =====================================================================
// app-core.js
// Firebase config, global STATE, persistence, DB layer, Utils, and base App object.
// Plain script (no ES modules). Methods attach to the global App object
// created in app-core.js. Load order is fixed in index.html.
// =====================================================================
        // Your web app's Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyCByr-xf2ptBhLEb8GXtiChJGKSNBIWDp4",
            authDomain: "ssg-desk.firebaseapp.com",
            databaseURL: "https://ssg-desk-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "ssg-desk",
            storageBucket: "ssg-desk.firebasestorage.app",
            messagingSenderId: "999682511515",
            appId: "1:999682511515:web:4ef0be1919233eaef1ec3e"
        };

        // Initialize Firebase
        if (window.firebase) {
            firebase.initializeApp(firebaseConfig);
        }

        // =====================================================================
        // ADMIN AUTH (Firebase Authentication, email/password)
        // Only this email is recognized as the gym administrator.
        // Create this user in Firebase Console -> Authentication -> Users.
        // =====================================================================
        const ADMIN_EMAIL = 'spirosroumeliotis29@gmail.com';

        function getAuth() {
            return (window.firebase && firebase.auth) ? firebase.auth() : null;
        }

        function isAdminUser(user) {
            return !!(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
        }

const PRESET_PALETTE = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#dc2626', '#0891b2', '#db2777', '#334155', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0f766e', '#86198f'];

        // CLOUD-SYNCED DATA LAYER (Firestore)
        const STATE = {
            members: JSON.parse(localStorage.getItem('gym_members') || '[]'),
            visits: JSON.parse(localStorage.getItem('gym_visits') || '[]'),
            payments: JSON.parse(localStorage.getItem('gym_payments') || '[]'),
            plans: JSON.parse(localStorage.getItem('gym_plans') || '[]'),
            planBin: JSON.parse(localStorage.getItem('gym_plan_bin') || '[]'),
            closedDates: JSON.parse(localStorage.getItem('gym_closed_dates') || '[]'),
            schedules: JSON.parse(localStorage.getItem('gym_schedules') || '[]'),
            scheduleBin: JSON.parse(localStorage.getItem('gym_schedule_bin') || '[]'),
            notifications: JSON.parse(localStorage.getItem('gym_notifications') || '[]'),
            notificationBin: JSON.parse(localStorage.getItem('gym_notification_bin') || '[]'),
            bin: JSON.parse(localStorage.getItem('gym_bin') || '[]'),
            classCheckins: JSON.parse(localStorage.getItem('gym_class_checkins') || '[]'),
            portalName: localStorage.getItem('gym_portal_name') || '🥋 BJJ Kiosk Portal',
            hiddenBelts: JSON.parse(localStorage.getItem('gym_hidden_belts') || '[]'),
            currency: localStorage.getItem('gym_currency') || '€',
            checkinNotice: localStorage.getItem('gym_checkin_notice') || '',
            checkinNoticeColor: localStorage.getItem('gym_checkin_notice_color') || '#fde68a'
        };

        let db = null; // firebase.firestore() compat instance

        function fallbackToLocal() {
            try {
                localStorage.setItem('gym_members', JSON.stringify(STATE.members || []));
                localStorage.setItem('gym_visits', JSON.stringify(STATE.visits || []));
                localStorage.setItem('gym_payments', JSON.stringify(STATE.payments || []));
                localStorage.setItem('gym_plans', JSON.stringify(STATE.plans || []));
                localStorage.setItem('gym_plan_bin', JSON.stringify(STATE.planBin || []));
                localStorage.setItem('gym_closed_dates', JSON.stringify(STATE.closedDates || []));
                localStorage.setItem('gym_schedules', JSON.stringify(STATE.schedules || []));
                localStorage.setItem('gym_schedule_bin', JSON.stringify(STATE.scheduleBin || []));
                localStorage.setItem('gym_notifications', JSON.stringify(STATE.notifications || []));
                localStorage.setItem('gym_notification_bin', JSON.stringify(STATE.notificationBin || []));
                localStorage.setItem('gym_bin', JSON.stringify(STATE.bin || []));
                localStorage.setItem('gym_class_checkins', JSON.stringify(STATE.classCheckins || []));
                localStorage.setItem('gym_portal_name', STATE.portalName || '🥋 BJJ Kiosk Portal');
                localStorage.setItem('gym_hidden_belts', JSON.stringify(STATE.hiddenBelts || []));
                localStorage.setItem('gym_currency', STATE.currency || '€');
                localStorage.setItem('gym_checkin_notice', STATE.checkinNotice || '');
                localStorage.setItem('gym_checkin_notice_color', STATE.checkinNoticeColor || '#fde68a');
            } catch (err) {
                console.warn('Failed to persist to localStorage fallback', err);
            }
        }

        function saveToCloud() {
            // Ensure db initialized
            if (!db || !db.collection) {
                fallbackToLocal();
                return Promise.resolve();
            }

            const payload = {
                members: STATE.members || [],
                visits: STATE.visits || [],
                payments: STATE.payments || [],
                plans: STATE.plans || [],
                planBin: STATE.planBin || [],
                closedDates: STATE.closedDates || [],
                schedules: STATE.schedules || [],
                scheduleBin: STATE.scheduleBin || [],
                notifications: STATE.notifications || [],
                notificationBin: STATE.notificationBin || [],
                bin: STATE.bin || [],
                classCheckins: STATE.classCheckins || [],
                portalName: STATE.portalName || '🥋 BJJ Kiosk Portal',
                hiddenBelts: STATE.hiddenBelts || [],
                currency: STATE.currency || '€',
                checkinNotice: STATE.checkinNotice || '',
                checkinNoticeColor: STATE.checkinNoticeColor || '#fde68a',
                updatedAt: new Date().toISOString()
            };

            return db.collection('gym').doc('data').set(payload).catch(err => {
                console.error('Failed to save to Firestore, falling back to local:', err);
                fallbackToLocal();
            });
        }

        function initRealtimeSync() {
            try {
                if (!window.firebase || !firebase.firestore) {
                    console.warn('Firebase compat not available yet — realtime sync disabled.');
                    return;
                }
                db = firebase.firestore();
                const docRef = db.collection('gym').doc('data');

                docRef.onSnapshot((doc) => {
                    if (!doc.exists) {
                        // No doc yet — write initial state
                        saveToCloud();
                        return;
                    }

                    const data = doc.data() || {};

                    // Only overwrite STATE properties that are present in the cloud snapshot.
                    // This avoids accidentally clearing fields when a snapshot omits a key.
                    try {
                        if (Object.prototype.hasOwnProperty.call(data, 'members')) STATE.members = Array.isArray(data.members) ? data.members : STATE.members || [];
                        if (Object.prototype.hasOwnProperty.call(data, 'visits')) STATE.visits = Array.isArray(data.visits) ? data.visits : STATE.visits || [];
                        if (Object.prototype.hasOwnProperty.call(data, 'payments')) STATE.payments = Array.isArray(data.payments) ? data.payments : STATE.payments || [];
                        if (Object.prototype.hasOwnProperty.call(data, 'plans')) STATE.plans = Array.isArray(data.plans) ? data.plans : STATE.plans || [];
                        if (Object.prototype.hasOwnProperty.call(data, 'planBin')) STATE.planBin = Array.isArray(data.planBin) ? data.planBin : STATE.planBin || [];
                        if (Object.prototype.hasOwnProperty.call(data, 'closedDates')) STATE.closedDates = Array.isArray(data.closedDates) ? data.closedDates : STATE.closedDates || [];
                        if (Object.prototype.hasOwnProperty.call(data, 'schedules')) STATE.schedules = Array.isArray(data.schedules) ? data.schedules : STATE.schedules || [];
                        if (Object.prototype.hasOwnProperty.call(data, 'scheduleBin')) STATE.scheduleBin = Array.isArray(data.scheduleBin) ? data.scheduleBin : STATE.scheduleBin || [];
                        if (Object.prototype.hasOwnProperty.call(data, 'notifications')) STATE.notifications = Array.isArray(data.notifications) ? data.notifications : STATE.notifications || [];
                        if (Object.prototype.hasOwnProperty.call(data, 'notificationBin')) STATE.notificationBin = Array.isArray(data.notificationBin) ? data.notificationBin : STATE.notificationBin || [];
                        if (Object.prototype.hasOwnProperty.call(data, 'bin')) STATE.bin = Array.isArray(data.bin) ? data.bin : STATE.bin || [];
                        if (Object.prototype.hasOwnProperty.call(data, 'classCheckins')) STATE.classCheckins = Array.isArray(data.classCheckins) ? data.classCheckins : STATE.classCheckins || [];
 
                        if (Object.prototype.hasOwnProperty.call(data, 'portalName')) STATE.portalName = data.portalName || STATE.portalName || '🥋 BJJ Kiosk Portal';
                        if (Object.prototype.hasOwnProperty.call(data, 'hiddenBelts')) STATE.hiddenBelts = Array.isArray(data.hiddenBelts) ? data.hiddenBelts : STATE.hiddenBelts || [];
                        if (Object.prototype.hasOwnProperty.call(data, 'currency')) STATE.currency = data.currency || STATE.currency || '€';
                        if (Object.prototype.hasOwnProperty.call(data, 'checkinNotice')) STATE.checkinNotice = data.checkinNotice || STATE.checkinNotice || '';
                        if (Object.prototype.hasOwnProperty.call(data, 'checkinNoticeColor')) STATE.checkinNoticeColor = data.checkinNoticeColor || STATE.checkinNoticeColor || '#fde68a';
                    } catch (e) {
                        console.warn('Error applying snapshot to local STATE:', e);
                    }

                    // Persist snapshot into localStorage so local fallback won't later re-introduce stale data.
                    try {
                        localStorage.setItem('gym_members', JSON.stringify(STATE.members || []));
                        localStorage.setItem('gym_visits', JSON.stringify(STATE.visits || []));
                        localStorage.setItem('gym_payments', JSON.stringify(STATE.payments || []));
                        localStorage.setItem('gym_plans', JSON.stringify(STATE.plans || []));
                        localStorage.setItem('gym_plan_bin', JSON.stringify(STATE.planBin || []));
                        localStorage.setItem('gym_closed_dates', JSON.stringify(STATE.closedDates || []));
                        localStorage.setItem('gym_schedules', JSON.stringify(STATE.schedules || []));
                        localStorage.setItem('gym_schedule_bin', JSON.stringify(STATE.scheduleBin || []));
                        localStorage.setItem('gym_notifications', JSON.stringify(STATE.notifications || []));
                        localStorage.setItem('gym_notification_bin', JSON.stringify(STATE.notificationBin || []));
                        localStorage.setItem('gym_bin', JSON.stringify(STATE.bin || []));
                        localStorage.setItem('gym_class_checkins', JSON.stringify(STATE.classCheckins || []));
                        localStorage.setItem('gym_portal_name', STATE.portalName || '🥋 BJJ Kiosk Portal');
                        localStorage.setItem('gym_hidden_belts', JSON.stringify(STATE.hiddenBelts || []));
                        localStorage.setItem('gym_currency', STATE.currency || '€');
                        localStorage.setItem('gym_checkin_notice', STATE.checkinNotice || '');
                        localStorage.setItem('gym_checkin_notice_color', STATE.checkinNoticeColor || '#fde68a');
                    } catch (e) { console.warn('Failed to persist snapshot to localStorage', e); }

                    // Update UI elements that depend on settings
                    try { document.getElementById('kiosk-title-display').innerText = STATE.portalName; } catch(e){}

                    // Explicitly call all known render/update functions so DOM immediately reflects cloud data.
                    try {
                        // Core renders (kiosk + member)
                        App.renderLivePresent && App.renderLivePresent();
                        App.renderKioskLeaderboard && App.renderKioskLeaderboard();
                        App.renderCheckinNotice && App.renderCheckinNotice();
                        App.updateNotificationBadge && App.updateNotificationBadge();

                        // Admin-only renders — only run while an authenticated admin session exists.
                        // These target elements inside #view-admin, which is removed from the DOM
                        // unless the admin is signed in.
                        if (App.isAdminAuthed()) {
                            App.renderMemberDirectory && App.renderMemberDirectory();
                            App.renderMemberBin && App.renderMemberBin();
                            App.renderPlans && App.renderPlans();
                            App.renderPlanBin && App.renderPlanBin();
                            App.renderSchedules && App.renderSchedules();
                            App.renderScheduleBin && App.renderScheduleBin();
                            App.renderNotifications && App.renderNotifications();
                            App.renderNotificationBin && App.renderNotificationBin();
                            App.renderVisitLog && App.renderVisitLog();
                            App.renderAdminDashboard && App.renderAdminDashboard();
                            App.renderAllPayments && App.renderAllPayments();
                            App.renderAnalyticalCalendar && App.renderAnalyticalCalendar();
                        }

                        // Ensure calendar/kiosk schedule containers are refreshed
                        try { App.renderCalendarView && App.renderCalendarView('kiosk-schedule-container', false); } catch(e){}
                        if (App.isAdminAuthed()) {
                            try { App.renderCalendarView && App.renderCalendarView('master-schedule-container', true); } catch(e){}
                        }

                        // Call any legacy or external-named renderers if they exist on the page
                        if (typeof window.renderSchedule === 'function') try { window.renderSchedule(); } catch(e) {}
                        if (typeof window.renderUI === 'function') try { window.renderUI(); } catch(e) {}
                        if (typeof window.updateDashboard === 'function') try { window.updateDashboard(); } catch(e) {}

                    } catch (e) { console.warn('Error while re-rendering after Firestore update', e); }

                }, (err) => {
                    console.error('Realtime listener error:', err);
                });

            } catch (err) {
                console.warn('Failed to initialize realtime sync', err);
            }
        }

        const DB = {
            // getters
            getMembers: () => STATE.members || [],
            getBin: () => STATE.bin || [],
            getVisits: () => STATE.visits || [],
            getPlans: () => STATE.plans || [],
            getPlanBin: () => STATE.planBin || [],
            getClosedDates: () => STATE.closedDates || [],
            getSchedules: () => STATE.schedules || [],
            getScheduleBin: () => STATE.scheduleBin || [],
            getClassCheckins: () => STATE.classCheckins || [],
            getNotifications: () => STATE.notifications || [],
            getNotificationBin: () => STATE.notificationBin || [],
            getPayments: () => STATE.payments || [],
            getPortalName: () => STATE.portalName || '🥋 BJJ Kiosk Portal',
            getHiddenBelts: () => STATE.hiddenBelts || [],
            getCurrency: () => STATE.currency || '€',
            getCheckinNotice: () => STATE.checkinNotice || '',
            getCheckinNoticeColor: () => STATE.checkinNoticeColor || '#fde68a',

            // setters (update state and persist)
            saveMembers: (data) => { STATE.members = data || []; return saveToCloud(); },
            saveBin: (data) => { STATE.bin = data || []; return saveToCloud(); },
            saveVisits: (data) => { STATE.visits = data || []; return saveToCloud(); },
            savePlans: (data) => { STATE.plans = data || []; return saveToCloud(); },
            savePlanBin: (data) => { STATE.planBin = data || []; return saveToCloud(); },
            saveClosedDates: (data) => { STATE.closedDates = data || []; return saveToCloud(); },
            saveSchedules: (data) => { STATE.schedules = data || []; return saveToCloud(); },
            saveScheduleBin: (data) => { STATE.scheduleBin = data || []; return saveToCloud(); },
            saveClassCheckins: (data) => { STATE.classCheckins = data || []; return saveToCloud(); },
            saveNotifications: (data) => { STATE.notifications = data || []; return saveToCloud(); },
            saveNotificationBin: (data) => { STATE.notificationBin = data || []; return saveToCloud(); },
            savePayments: (data) => { STATE.payments = data || []; return saveToCloud(); },
            setPortalName: (name) => { STATE.portalName = name; return saveToCloud(); },
            setHiddenBelts: (data) => { STATE.hiddenBelts = data || []; return saveToCloud(); },
            setCurrency: (c) => { STATE.currency = c; return saveToCloud(); },
            saveCheckinNotice: (msg) => { STATE.checkinNotice = msg || ''; return saveToCloud(); },
            saveCheckinNoticeColor: (color) => { STATE.checkinNoticeColor = color || '#fde68a'; return saveToCloud(); },

            exportData: () => {
                const data = {
                    members: STATE.members || [], visits: STATE.visits || [], payments: STATE.payments || [],
                    plans: STATE.plans || [], planBin: STATE.planBin || [], closedDates: STATE.closedDates || [], schedules: STATE.schedules || [], scheduleBin: STATE.scheduleBin || [],
                    portalName: STATE.portalName || '🥋 BJJ Kiosk Portal', hiddenBelts: STATE.hiddenBelts || [],
                    bin: STATE.bin || [], classCheckins: STATE.classCheckins || [], notifications: STATE.notifications || [],
                    notificationBin: STATE.notificationBin || [],
                    adminPassword: null, // legacy field — never stored anymore
                    currency: STATE.currency || '€', checkinNoticeColor: STATE.checkinNoticeColor || '#fde68a'
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = `GymDesk_Backup_${new Date().toISOString().split('T')[0]}.json`; a.click();
            },

            importData: () => {
                const fileInput = document.getElementById('import-file');
                if (!fileInput.files.length) return alert('Please select a file first.');
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result) || {};
                        STATE.members = data.members || STATE.members;
                        STATE.visits = data.visits || STATE.visits;
                        STATE.payments = data.payments || STATE.payments;
                        if (data.plans) STATE.plans = data.plans;
                        if (data.planBin) STATE.planBin = data.planBin;
                        if (data.closedDates) STATE.closedDates = data.closedDates;
                        if (data.schedules) STATE.schedules = data.schedules;
                        if (data.scheduleBin) STATE.scheduleBin = data.scheduleBin;
                        if (data.notifications) STATE.notifications = data.notifications;
                        if (data.notificationBin) STATE.notificationBin = data.notificationBin;
                        if (data.portalName) STATE.portalName = data.portalName;
                        if (data.hiddenBelts) STATE.hiddenBelts = data.hiddenBelts;
                        if (data.bin) STATE.bin = data.bin;
                        if (data.classCheckins) STATE.classCheckins = data.classCheckins;
                        if (data.currency) STATE.currency = data.currency;
                        if (data.checkinNoticeColor) STATE.checkinNoticeColor = data.checkinNoticeColor;

                        saveToCloud().then(() => {
                            alert('Backup restored successfully!');
                            location.reload();
                        }).catch(() => {
                            // Even if cloud save fails, persist locally and reload
                            fallbackToLocal();
                            alert('Backup restored locally (cloud save failed).');
                            location.reload();
                        });

                    } catch (err) { alert('Error parsing JSON file.'); }
                };
                reader.readAsText(fileInput.files[0]);
            }
        };

        const Utils = {
            formatDate: (dateStr) => { if (!dateStr) return 'N/A'; return new Date(dateStr).toLocaleDateString(); },
            formatDateLocalized: (dateStr, lang = 'en') => {
                if (!dateStr) return 'N/A';
                try {
                    const locale = lang === 'el' ? 'el-GR' : 'en-US';
                    return new Date(dateStr).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
                } catch (e) {
                    return Utils.formatDate(dateStr);
                }
            },
            formatTime: (dateStr) => { if (!dateStr) return '--:--'; return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); },
            getDaysRemaining: (expDateStr) => { 
                if (!expDateStr) return -1;
                // Parse date as local time so it expires at midnight local time
                const expDate = new Date(expDateStr + 'T23:59:59'); 
                const now = new Date();
                return Math.floor((expDate - now) / (1000 * 60 * 60 * 24)); 
            },
            formatDurationMins: (mins) => {
                if (mins == null || isNaN(mins)) return '';
                if (mins < 0) mins = 0;
                return mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins}m`;
            },
            calcDuration: (entry, exit) => {
                if (!exit) return 'In Progress';
                const mins = Math.round((new Date(exit) - new Date(entry)) / 60000);
                return Utils.formatDurationMins(mins);
            },
            escapeHTML: (str) => { if (!str) return ''; const div = document.createElement('div'); div.innerText = str; return div.innerHTML; },
            renderRichText: (text) => {
                if (!text) return '';
                const normalized = text.replace(/\r\n?/g, '\n');
                const escaped = Utils.escapeHTML(normalized);
                const escapedWithBreaks = escaped.replace(/<br\s*\/?>/gi, '\n');
                const inline = escapedWithBreaks
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>');
                const lines = inline.split('\n');
                let html = '';
                let inList = false;
                lines.forEach(line => {
                    const trimmed = line.trim();
                    const listMatch = trimmed.match(/^[-•]\s+(.*)$/);
                    if (listMatch) {
                        if (!inList) {
                            inList = true;
                            html += '<ul style="margin:0.5rem 0 0.75rem 1.25rem; padding-left: 0;">';
                        }
                        html += `<li style="margin-bottom:0.35rem;">${listMatch[1]}</li>`;
                    } else {
                        if (inList) {
                            html += '</ul>';
                            inList = false;
                        }
                        if (trimmed === '') {
                            html += '<br>';
                        } else {
                            html += `<p style="margin:0 0 0.75rem 0;">${trimmed}</p>`;
                        }
                    }
                });
                if (inList) html += '</ul>';
                return html;
            },
            renderRichHtml: (text) => {
                if (!text) return '';
                const normalized = text.replace(/\r\n?/g, '\n');
                return normalized.replace(/\n/g, '<br>');
            },
            renderPlanDescription: (text, allowHtml) => {
                if (allowHtml) return Utils.renderRichHtml(text);
                return Utils.renderRichText(text);
            },
            formatPlanValidity: (plan) => {
                const daysValue = plan && plan.days != null && plan.days !== '' ? parseInt(plan.days, 10) : NaN;
                const hasDays = !Number.isNaN(daysValue) && daysValue > 0;
                const hasSessions = plan && plan.sessions != null && plan.sessions !== '';
                if (hasDays) {
                    return `${daysValue} Days${hasSessions ? ` | Sessions: ${Utils.escapeHTML(plan.sessions)}` : ''}`;
                }
                if (hasSessions) {
                    return `Sessions Only (${Utils.escapeHTML(plan.sessions)})`;
                }
                return 'No validity configured';
            },
            convertTo12Hour: (time24) => {
                if(!time24) return '';
                let [hours, minutes] = time24.split(':');
                let h = parseInt(hours);
                let ampm = h >= 12 ? 'PM' : 'AM';
                h = h % 12 || 12;
                return `${h}:${minutes} ${ampm}`;
            },
            calcAge: (dob) => {
                if(!dob) return 'N/A';
                return Math.floor((new Date() - new Date(dob)) / 31557600000);
            },
            getBeltBadge: (rawBelt) => {
                const b = rawBelt || 'White';
                const baseBelt = b.split('/')[0].trim();
                const beltClass = baseBelt.toLowerCase();
                return `<span class="belt-badge belt-${beltClass}">${baseBelt}</span>`;
            },
            // Combined ID badge: the member ID inside the belt-colored box.
            // All boxes keep the same fixed width so rows align uniformly.
            getMemberIdBadge: (m) => {
                const beltBase = (m && m.belt) ? m.belt.split('/')[0].trim() : 'White';
                const beltClass = beltBase.toLowerCase();
                const id = (m && m.id) ? m.id : '—';
                return `<span class="belt-badge belt-${beltClass}" style="width: 84px; text-align: center; overflow-wrap: anywhere;">${Utils.escapeHTML(id)}</span>`;
            },

            // CALCULATE EXPIRATION DATE SKIPPING CLOSED ACADEMY DATES
            // Builds a full set of closed date strings, expanding ranges and yearly-repeating entries.
            buildClosedSet: (forYear) => {
                const closedList = DB.getClosedDates();
                const closed = new Set();
                closedList.forEach(c => {
                    const entry = typeof c === 'string' ? { date: c } : c;
                    const startStr = entry.date;
                    const endStr   = entry.dateEnd || entry.date;
                    const repeat   = !!entry.repeat;

                    // Parse base start/end components
                    const [sy, sm, sd] = startStr.split('-').map(Number);
                    const [ey, em, ed] = endStr.split('-').map(Number);

                    // For repeating entries, generate for every year from base year up to forYear
                    const maxYear = (repeat && forYear) ? Math.max(forYear, sy) : sy;
                    for (let yr = sy; yr <= maxYear; yr++) {
                        const yearOffset = yr - sy;
                        let cur = new Date(Date.UTC(sy + yearOffset, sm - 1, sd));
                        const end = new Date(Date.UTC(ey + yearOffset, em - 1, ed));
                        while (cur <= end) {
                            closed.add(cur.toISOString().split('T')[0]);
                            cur.setUTCDate(cur.getUTCDate() + 1);
                        }
                    }
                });
                return closed;
            },

            calculateExpirationDate: (startDateStr, durationDays) => {
                if (!startDateStr || !durationDays) return '';
                let current = new Date(startDateStr);
                let daysLeft = parseInt(durationDays);

                let count = 0;
                let ymd = current.toISOString().split('T')[0];
                // Build set using current year and span years as needed
                const closedSet = Utils.buildClosedSet(new Date(startDateStr).getUTCFullYear() + 5);

                if (!closedSet.has(ymd)) count++;
                while (count < daysLeft) {
                    current.setUTCDate(current.getUTCDate() + 1);
                    ymd = current.toISOString().split('T')[0];
                    if (!closedSet.has(ymd)) count++;
                }
                return ymd;
            }
        };


        const App = {
            kioskMsgTimer: null,
            draftClassSlots: [], 
            currentUser: null,
            authUser: null,
            adminAuthed: false,
            adminViewTemplate: null,
            adminListenersBound: false,
            dirSortCol: 'name',
            dirSortAsc: true,
            dirStatus: 'active',
            pendingCheckinMember: null,
            pendingAdminCheckin: null,
            isMobileCheckinMode: false,
            columnsConfig: [
                {id: 'name', label: 'Name', checked: true},
                {id: 'id', label: 'ID', checked: true},
                {id: 'gender', label: 'Gender', checked: false},
                {id: 'age', label: 'Age', checked: true},
                {id: 'phone', label: 'Phone', checked: true},
                {id: 'status', label: 'Account Status', checked: true},
                {id: 'exp', label: 'Expiration', checked: true},
                {id: 'last-visit', label: 'Last Training', checked: false}
            ],
            draggedColIndex: null,
            visitTimeoutHours: 1, // default timeout hours for non-class check-ins
            // Compute expectedExitTime for a given entry timestamp (ISO string). If checking in during a scheduled class
            // the expected exit is class end time + 15 minutes. Otherwise use the configurable timeout (default 1 hour).
            // Pass forceDefault=true for explicit open-gym (no-class) check-ins so they always use the 1-hour default.
            computeExpectedExitTime: (entryIso, selectedClasses = [], forceDefault = false) => {
                const now = entryIso ? new Date(entryIso) : new Date();

                if (selectedClasses && selectedClasses.length > 0) {
                    let latestEndMs = 0;
                    selectedClasses.forEach(sel => {
                        if (!sel.slotEnd) return;
                        const [eh, em] = sel.slotEnd.split(':').map(Number);
                        const endDt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em);
                        if (endDt.getTime() > latestEndMs) {
                            latestEndMs = endDt.getTime();
                        }
                    });
                    if (latestEndMs > 0) {
                        return new Date(latestEndMs + (15 * 60 * 1000)).toISOString();
                    }
                }

                if (forceDefault) {
                    const hours = App.visitTimeoutHours || 1;
                    return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
                }

                const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                const todayName = dayNames[now.getDay()];
                const schedules = DB.getSchedules() || [];
                for (const cls of schedules) {
                    for (const slot of (cls.slots || [])) {
                        if (slot.day !== todayName) continue;
                        // slot.start / slot.end expected format: 'HH:MM'
                        const [sh, sm] = (slot.start || '00:00').split(':').map(Number);
                        const [eh, em] = (slot.end || '00:00').split(':').map(Number);
                        const startDt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm);
                        const endDt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em);
                        if (now >= startDt && now <= endDt) {
                            // Ongoing class — expected exit is class end + 15 minutes
                            return new Date(endDt.getTime() + (15 * 60 * 1000)).toISOString();
                        }
                    }
                }
                // Default: entry + timeout hours
                const hours = App.visitTimeoutHours || 1;
                return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
            },

            // Build a local Date for a class start from a check-in's slotDate/slotStart (YYYY-MM-DD, HH:MM).
            getClassStartTime: (checkin) => {
                if (!checkin) return null;
                let y = null, mo = null, d = null;
                if (checkin.slotDate) {
                    const parts = checkin.slotDate.split('-').map(Number);
                    y = parts[0]; mo = parts[1]; d = parts[2];
                }
                let hh = 0, mm = 0;
                if (checkin.slotStart) {
                    const t = checkin.slotStart.split(':').map(Number);
                    hh = t[0] || 0; mm = t[1] || 0;
                }
                if (y == null || isNaN(y) || isNaN(mo) || isNaN(d)) return null;
                return new Date(y, mo - 1, d, hh, mm, 0, 0);
            },

            // For a visit tied to scheduled class(es), returns an array of [from, until] Date pairs
            // during which the member should be shown in "Currently Inside". Each class window runs
            // from 30 minutes before the class start until 15 minutes after the class end.
            // Returns an empty array when there is no class info (open gym / admin force check-in),
            // meaning the member is always visible.
            getVisitVisibleWindows: (visit) => {
                const windows = [];
                if (!visit || !visit.id) return windows;
                const checkins = DB.getClassCheckins().filter(c => c.visitId === visit.id);
                checkins.forEach(c => {
                    const start = App.getClassStartTime(c);
                    if (!start) return;
                    let end = null;
                    if (c.slotEnd) {
                        const t = c.slotEnd.split(':').map(Number);
                        end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), t[0] || 0, t[1] || 0, 0, 0);
                    }
                    if (!end || isNaN(end.getTime())) {
                        // Fallback: assume a 1-hour class duration
                        end = new Date(start.getTime() + 60 * 60 * 1000);
                    }
                    windows.push({
                        from: new Date(start.getTime() - 30 * 60 * 1000),
                        until: new Date(end.getTime() + 15 * 60 * 1000)
                    });
                });
                return windows;
            },

            // Whether a visit should be visible in "Currently Inside" at the given time.
            isVisitVisibleNow: (visit, now) => {
                const windows = App.getVisitVisibleWindows(visit);
                if (windows.length === 0) return true;
                const t = now.getTime();
                return windows.some(w => t >= w.from.getTime() && t <= w.until.getTime());
            },

            // Duration to display for a closed visit. For visits tied to scheduled class(es)
            // the displayed duration is the class window (earliest class start to latest class
            // end), independent of the actual check-in/check-out times, so that late check-ins
            // after a class has finished don't produce a negative duration. Open-gym and other
            // visits fall back to the entry->exit duration.
            calcVisitDuration: (visit) => {
                if (!visit || !visit.id) return Utils.calcDuration(visit && visit.entryTime, visit && visit.exitTime);
                if (!visit.exitTime) return 'In Progress';
                const checkins = DB.getClassCheckins().filter(c => c.visitId === visit.id);
                if (checkins.length === 0) return Utils.calcDuration(visit.entryTime, visit.exitTime);
                let minStart = null;
                let maxEnd = null;
                checkins.forEach(c => {
                    const start = App.getClassStartTime(c);
                    if (!start) return;
                    if (!minStart || start.getTime() < minStart.getTime()) minStart = start;
                    let end = null;
                    if (c.slotEnd) {
                        const t = c.slotEnd.split(':').map(Number);
                        end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), t[0] || 0, t[1] || 0, 0, 0);
                    }
                    if (!end || isNaN(end.getTime())) {
                        // Fallback: assume a 1-hour class duration
                        end = new Date(start.getTime() + 60 * 60 * 1000);
                    }
                    if (!maxEnd || end.getTime() > maxEnd.getTime()) maxEnd = end;
                });
                if (minStart && maxEnd) {
                    return Utils.formatDurationMins(Math.round((maxEnd.getTime() - minStart.getTime()) / 60000));
                }
                return Utils.calcDuration(visit.entryTime, visit.exitTime);
            },

            // Determine whether a visit created for this member should be marked unpaid by default
            // Logic:
            // - Frozen accounts are treated as unpaid/needs-attention
            // - If member has a validity window (planDays / expirationDate) and it's expired -> unpaid
            // - If member is session-based (planDays falsy, sessionsTotal true) and sessionsLeft <= 0 -> unpaid
            // - Otherwise consider the visit paid (staff may still mark unpaid via payments UI)
            // NOTE: Because a session is consumed per CHECK-IN ACTION (not per class), a member who
            // checks in separately for 2 back-to-back classes with only 1 session left will have the
            // first check-in consume the session and the second check-in flagged as unpaid here.
            computeVisitUnpaid: (member) => {
                if (!member) return true;
                if (member.accountStatus === 'Frozen') return true;
                if (member.accountStatus === 'Inactive') return true;
                const planDays = member.planDays != null ? parseInt(member.planDays, 10) : null;
                if (planDays && (!member.expirationDate || Utils.getDaysRemaining(member.expirationDate) < 0)) return true;
                if (member.sessionsTotal && (parseInt(member.sessionsLeft) || 0) <= 0) return true;
                return false;
            },

            normalizeScheduleSlotId: (classId, slotDay, slotStart, slotEnd) => {
                const rawId = `checkin-slot-${classId}-${slotDay}-${slotStart}-${slotEnd}`;
                return rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
            },

            getWeekdayDateForCurrentWeek: (dayName) => {
                if (!dayName) return null;
                const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
                const targetIndex = days.indexOf(dayName);
                if (targetIndex === -1) return null;
                const now = new Date();
                const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
                const offset = targetIndex - currentDayIndex;
                const date = new Date(now);
                date.setDate(now.getDate() + offset);
                return date;
            },

            // ---------- ADMIN AUTH & VIEW GATING ----------
            // True only while the Firebase Auth user matches ADMIN_EMAIL.
            // Every admin entry point (navigate, renders) checks this flag,
            // and the admin view is physically removed from the DOM when locked.
            isAdminAuthed: () => !!App.adminAuthed,

            initAuth: () => {
                const auth = getAuth();
                if (!auth) {
                    console.warn('Firebase Auth not available — admin login disabled.');
                    return;
                }
                auth.onAuthStateChanged((user) => {
                    if (isAdminUser(user)) {
                        App.authUser = user;
                        App.unlockAdmin();
                    } else {
                        App.authUser = user || null;
                        App.lockAdmin();
                    }
                });
            },

            // Rebind event listeners for elements inside #view-admin.
            // The admin view is removed from the DOM when locked, so listeners
            // attached at init are lost and must be re-attached after unlock.
            bindAdminListeners: () => {
                if (App.adminListenersBound) return;
                const bind = (id, evt, fn) => {
                    const el = document.getElementById(id);
                    if (el) el.addEventListener(evt, fn);
                };
                bind('checkin-search', 'input', App.handleAdminCheckinSearch);
                bind('member-form', 'submit', App.saveMember);
                bind('plan-form', 'submit', App.savePlan);
                bind('visit-form', 'submit', App.saveVisitEdit);
                bind('payment-form', 'submit', App.savePayment);
                App.adminListenersBound = true;
            },

            // Remove the admin view from the DOM entirely (not just CSS-hidden)
            // and force the kiosk (unless a member/mobile view is active).
            lockAdmin: () => {
                App.adminAuthed = false;
                App.adminListenersBound = false;
                const adminView = document.getElementById('view-admin');
                if (adminView) {
                    if (!App.adminViewTemplate) App.adminViewTemplate = adminView.outerHTML;
                    adminView.remove();
                }
                const memberVisible = document.getElementById('view-member') && !document.getElementById('view-member').classList.contains('hidden');
                const mobileVisible = document.getElementById('view-mobile-checkin') && !document.getElementById('view-mobile-checkin').classList.contains('hidden');
                if (!memberVisible && !mobileVisible) {
                    document.querySelectorAll('.app-container').forEach(el => el.classList.add('hidden'));
                    const kiosk = document.getElementById('view-kiosk');
                    if (kiosk) kiosk.classList.remove('hidden');
                }
                App.closeModal('modal-login');
                App.renderCheckinNotice && App.renderCheckinNotice();
            },

            // Re-insert the admin view from the cached template after successful auth.
            unlockAdmin: () => {
                App.adminAuthed = true;
                if (!document.getElementById('view-admin')) {
                    if (App.adminViewTemplate) {
                        document.body.insertAdjacentHTML('beforeend', App.adminViewTemplate);
                    } else {
                        console.warn('No admin view template cached — cannot unlock admin portal.');
                        App.adminAuthed = false;
                        return;
                    }
                }
                App.bindAdminListeners();
                App.renderColorPaletteUI && App.renderColorPaletteUI();
                App.renderColumnConfigurator && App.renderColumnConfigurator();
                const monthInput = document.getElementById('export-month-picker');
                if (monthInput && !monthInput.value) monthInput.value = new Date().toISOString().slice(0, 7);
                // Steal focus only when no member/mobile session is active.
                const memberVisible = document.getElementById('view-member') && !document.getElementById('view-member').classList.contains('hidden');
                const mobileVisible = document.getElementById('view-mobile-checkin') && !document.getElementById('view-mobile-checkin').classList.contains('hidden');
                if (!memberVisible && !mobileVisible) {
                    document.querySelectorAll('.app-container').forEach(el => el.classList.add('hidden'));
                    const kiosk = document.getElementById('view-kiosk');
                    if (kiosk) kiosk.classList.add('hidden');
                    const adminView = document.getElementById('view-admin');
                    if (adminView) adminView.classList.remove('hidden');
                    App.navigate('admin-checkin');
                }
            },

            init: () => {
                App.cleanBin(); 
                App.updateUICurrency();
 
                document.getElementById('member-login-id').addEventListener('keyup', (e) => { if (e.key === 'Enter') App.loginAsMember(); });
                // Admin-view listeners (forms/search inside #view-admin) are bound here
                // and re-bound after each unlock (see bindAdminListeners).
                App.bindAdminListeners();
                 
                document.getElementById('kiosk-title-display').innerText = DB.getPortalName();
 
                // Setup export month default picker
                const nowYm = new Date().toISOString().slice(0, 7);
                document.getElementById('export-month-picker').value = nowYm;
 
                App.renderColorPaletteUI();
                App.renderLivePresent(); 
                App.renderKioskLeaderboard();
                App.renderCheckinNotice();
                App.updateNotificationBadge();
                App.renderCalendarView('kiosk-schedule-container', false);
                App.updateKioskInputMode();
                document.getElementById('kiosk-id-input').focus();
                App.cleanupClassCheckins();
 
                // Apply kiosk language (persisted or default)
                if (typeof App.setKioskLanguage === 'function') App.setKioskLanguage(localStorage.getItem('kiosk_lang') || 'en');
                 
                App.renderColumnConfigurator();
                window.addEventListener('resize', App.updateKioskInputMode);
                window.addEventListener('orientationchange', App.updateKioskInputMode);

                // Initialize Firestore realtime sync (if available)
                try { initRealtimeSync(); } catch(e) { console.warn('initRealtimeSync error', e); }

                // Admin auth: cache the admin view template, lock it out of the DOM,
                // then let onAuthStateChanged unlock it if a valid admin session exists.
                const adminView = document.getElementById('view-admin');
                if (adminView) App.adminViewTemplate = adminView.outerHTML;
                App.lockAdmin();
                App.initAuth();

                App.autoCheckoutStaleVisits();
                setInterval(App.autoCheckoutStaleVisits, 60000);

                App.renderCheckinQR();
                const queryParams = new URLSearchParams(window.location.search);
                if (queryParams.has('checkin')) {
                    App.showMobileCheckinView();
                }
            },

            cleanBin: () => {
                const bin = DB.getBin();
                const now = new Date();
                const filtered = bin.filter(m => (now - new Date(m.deletedAt)) < (365 * 24 * 60 * 60 * 1000));
                DB.saveBin(filtered);
            },
            
            autoCheckoutStaleVisits: () => {
                const visits = DB.getVisits();
                let updated = false;
                const now = new Date();
                visits.forEach(v => {
                    // Ensure we have an expectedExitTime for legacy visits
                    if (!v.expectedExitTime) {
                        v.expectedExitTime = App.computeExpectedExitTime(v.entryTime);
                        updated = true;
                    }
                    // If there is no explicit exitTime and expectedExitTime is reached, auto-close at expectedExitTime
                    if (!v.exitTime) {
                        const expected = v.expectedExitTime ? new Date(v.expectedExitTime) : null;
                        if (expected && expected <= now) {
                            v.exitTime = v.expectedExitTime; // set exitTime to the expectedExitTime
                            updated = true;
                        }
                    }
                });
                if (updated) {
                    DB.saveVisits(visits);
                    App.renderLivePresent();
                    const dashboardPane = document.getElementById('pane-admin-dashboard');
                    if (dashboardPane && !dashboardPane.classList.contains('hidden')) App.renderAdminDashboard();
                }
            },

        };

window.App = App;
window.DB = DB;
window.Utils = Utils;

{
// Initialize Firebase compat app (used by the firestore-compat API)
      const firebaseConfig = {
        apiKey: "AIzaSyCByr-xf2ptBhLEb8GXtiChJGKSNBIWDp4",
        authDomain: "ssg-desk.firebaseapp.com",
        databaseURL: "https://ssg-desk-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "ssg-desk",
        storageBucket: "ssg-desk.firebasestorage.app",
        messagingSenderId: "999682511515",
        appId: "1:999682511515:web:4ef0be1919233eaef1ec3e"
      };
      try {
        if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
      } catch (e) { console.warn('Firebase compat init:', e); }
}


