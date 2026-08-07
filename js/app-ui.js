// =====================================================================
// app-ui.js
// App methods: renderColorPaletteUI, selectPaletteColor, openColorPicker, saveCustomColor, selectPlanColor, updatePaletteSelection, hexToRgb, updateUICurrency, toggleSidebar, switchTab, addNotification, updateNotificationBadge, renderNotifications, markNotificationRead, deleteNotification, clearAllNotifications, renderNotificationBin, restoreNotification, deleteBinNotification, openModal, closeModal, navigate, loginAsAdmin
// Plain script (no ES modules). Methods attach to the global App object
// created in app-core.js. Load order is fixed in index.html.
// =====================================================================
Object.assign(App, {
            renderColorPaletteUI: () => {
                const planPalette = document.getElementById('preset-color-palette');
                const schedPalette = document.getElementById('preset-sched-color-palette');
 
                const planColorInput = document.getElementById('form-plan-color');
                const planColorValue = planColorInput ? planColorInput.value : '#2563eb';
                const paletteHtml = PRESET_PALETTE.map(c => `<div class="color-swatch" data-color="${c}" style="background:${c};" onclick="App.selectPaletteColor('form-plan-color', 'preset-color-palette', '${c}')"></div>`).join('') + `<div class="color-swatch custom-color-swatch" data-color="${planColorValue}" style="background:${planColorValue};" onclick="App.openColorPicker('form-plan-color')" title="Custom color"></div>`;
                if (planPalette) planPalette.innerHTML = paletteHtml;
 
                const schedColorInput = document.getElementById('form-sched-color');
                const schedColorValue = schedColorInput ? schedColorInput.value : '#2563eb';
                const schedHtml = PRESET_PALETTE.map(c => `<div class="color-swatch" data-color="${c}" style="background:${c};" onclick="App.selectPaletteColor('form-sched-color', 'preset-sched-color-palette', '${c}')"></div>`).join('') + `<div class="color-swatch custom-color-swatch" data-color="${schedColorValue}" style="background:${schedColorValue};" onclick="App.openColorPicker('form-sched-color')" title="Custom color"></div>`;
                if (schedPalette) schedPalette.innerHTML = schedHtml;
 
                // Keep the selected swatches in sync with current input values
                if (planColorInput) App.updatePaletteSelection('preset-color-palette', planColorInput.value);
                if (schedColorInput) App.updatePaletteSelection('preset-sched-color-palette', schedColorInput.value);
            },
 
            selectPaletteColor: (inputId, paletteId, color) => {
                const input = document.getElementById(inputId);
                if (input) input.value = color;
                App.updatePaletteSelection(paletteId, color);
            },
 
            openColorPicker: (inputId) => {
                // Open a small modal that allows choosing via color picker or entering a hex value
                App.pendingColorInputId = inputId;
                const input = document.getElementById(inputId);
                const val = input ? (input.value || '#2563eb') : '#2563eb';
                const colorPicker = document.getElementById('custom-color-picker');
                const colorHex = document.getElementById('custom-color-hex');
                if (colorPicker) colorPicker.value = val;
                if (colorHex) colorHex.value = val;
                // keep inputs in sync
                if (colorPicker) colorPicker.oninput = () => { if (colorHex) colorHex.value = colorPicker.value; };
                App.openModal('modal-custom-color');
            },

            saveCustomColor: () => {
                const colorHex = document.getElementById('custom-color-hex');
                if (!colorHex) return; const raw = colorHex.value.trim();
                if (!raw) return alert('Enter a color value (e.g. #ff00aa)');
                const normalized = raw.startsWith('#') ? raw : ('#' + raw);
                const target = document.getElementById(App.pendingColorInputId);
                if (target) target.value = normalized;
                // update the appropriate palette swatch
                if (App.pendingColorInputId === 'form-plan-color') App.updatePaletteSelection('preset-color-palette', normalized);
                if (App.pendingColorInputId === 'form-sched-color') App.updatePaletteSelection('preset-sched-color-palette', normalized);
                App.closeModal('modal-custom-color');
                App.pendingColorInputId = null;
            },

            selectPlanColor: (color) => {
                App.selectPaletteColor('form-plan-color', 'preset-color-palette', color);
            },

            updatePaletteSelection: (paletteId, color) => {
                const container = document.getElementById(paletteId);
                if (!container) return;
                container.querySelectorAll('.color-swatch').forEach(sw => {
                    if (sw.classList.contains('custom-color-swatch')) {
                        sw.dataset.color = color;
                        sw.style.background = color;
                    }
                    sw.classList.toggle('selected', sw.dataset.color === color);
                });
            },

            hexToRgb: (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : hex;
            },

            updateUICurrency: () => {
                const c = DB.getCurrency();
                const planPriceTh = document.getElementById('label-plan-price-th');
                if (planPriceTh) planPriceTh.innerText = `Price (${c})`;
                const planPriceLabel = document.getElementById('label-plan-price');
                if (planPriceLabel) planPriceLabel.innerText = `Price (${c})`;
                const payLabel = document.getElementById('label-payment-applied');
                if (payLabel) payLabel.innerText = `Payment Applied (${c})`;
            },

            toggleSidebar: () => {
                document.querySelector('.sidebar').classList.toggle('open');
                document.getElementById('sidebar-overlay').classList.toggle('open');
            },

            switchTab: (group, tabId) => {
                document.querySelectorAll(`.tab-link-${group}`).forEach(el => el.classList.remove('active'));
                document.querySelectorAll(`.tab-content-${group}`).forEach(el => el.classList.add('hidden'));
                const link = document.getElementById(`tab-link-${group}-${tabId}`);
                if (link) link.classList.add('active');
                const content = document.getElementById(`tab-content-${group}-${tabId}`);
                if (content) content.classList.remove('hidden');

                if(group === 'plans' && tabId === 'closed') { App.renderClosedDates(); }
                if(group === 'schedule' && tabId === 'list') { App.renderClassList(); }
            },

            addNotification: (title, msg, type = 'info', memberId = null) => {
                const notifs = DB.getNotifications();
                notifs.unshift({ id: 'N-'+Date.now(), title, msg, type, date: new Date().toISOString(), read: false, memberId });
                DB.saveNotifications(notifs);
                App.updateNotificationBadge();
            },
            
            updateNotificationBadge: () => {
                const unread = DB.getNotifications().filter(n => !n.read).length;
                const badge = document.getElementById('nav-notif-badge');
                if (!badge) return;
                if (unread > 0) {
                    badge.innerText = unread;
                    badge.classList.remove('hidden');
                    badge.style.background = 'var(--danger)';
                    badge.style.color = 'white';
                } else {
                    badge.classList.add('hidden');
                }
            },

            renderNotifications: () => {
                const notifs = DB.getNotifications();
                const list = document.getElementById('notifications-list');
                list.innerHTML = notifs.map(n => `
                    <div class="notif-item ${n.read ? '' : 'unread'}">
                        <div>
                            <strong style="color: ${n.type === 'danger' ? 'var(--danger)' : 'var(--dark)'}">${Utils.escapeHTML(n.title)}</strong>
                            <span class="notif-time">${Utils.formatDate(n.date)} at ${Utils.formatTime(n.date)}</span>
                            <div class="mt-1 text-gray">${Utils.escapeHTML(n.msg)}</div>
                        </div>
                        <div class="flex-col gap-1">
                            ${!n.read ? `<button class="btn-outline btn-small" onclick="App.markNotificationRead('${n.id}')">Mark Read</button>` : ''}
                            <button class="btn-danger btn-small" onclick="App.deleteNotification('${n.id}')">Delete</button>
                        </div>
                    </div>
                `).join('') || '<div class="text-gray" style="text-align:center; padding: 2rem;">No notifications.</div>';
                App.updateNotificationBadge();
            },
 
            markNotificationRead: (id) => {
                const notifs = DB.getNotifications();
                const n = notifs.find(x => x.id === id);
                if(n) n.read = true;
                DB.saveNotifications(notifs);
                App.renderNotifications();
            },

            deleteNotification: (id) => {
                const notifs = DB.getNotifications();
                const n = notifs.find(x => x.id === id);
                const bin = DB.getNotificationBin();
                if(n) {
                    bin.unshift({ ...n, deletedAt: new Date().toISOString() });
                    DB.saveNotificationBin(bin);
                }
                DB.saveNotifications(notifs.filter(x => x.id !== id));
                App.renderNotifications();
                App.renderNotificationBin();
            },

            clearAllNotifications: () => {
                if(confirm('Clear all notifications?')) {
                    const bin = DB.getNotificationBin();
                    const now = new Date().toISOString();
                    bin.unshift(...DB.getNotifications().map(n => ({ ...n, deletedAt: now })));
                    DB.saveNotificationBin(bin);
                    DB.saveNotifications([]);
                    App.renderNotifications();
                    App.renderNotificationBin();
                }
            },

            renderNotificationBin: () => {
                const bin = DB.getNotificationBin();
                const list = document.getElementById('notifications-bin-list');
                list.innerHTML = bin.map(n => `
                    <div class="notif-item">
                        <div>
                            <strong style="color: ${n.type === 'danger' ? 'var(--danger)' : 'var(--dark)'}">${Utils.escapeHTML(n.title)}</strong>
                            <span class="notif-time">Deleted ${Utils.formatDate(n.deletedAt)} at ${Utils.formatTime(n.deletedAt)}</span>
                            <div class="mt-1 text-gray">${Utils.escapeHTML(n.msg)}</div>
                        </div>
                        <div class="flex-col gap-1">
                            <button class="btn-success btn-small" onclick="App.restoreNotification('${n.id}')">Restore</button>
                            <button class="btn-danger btn-small" onclick="App.deleteBinNotification('${n.id}')">Delete</button>
                        </div>
                    </div>
                `).join('') || '<div class="text-gray" style="text-align:center; padding: 2rem;">Recycle bin empty.</div>';
            },

            restoreNotification: (id) => {
                const bin = DB.getNotificationBin();
                const idx = bin.findIndex(n => n.id === id);
                if(idx > -1) {
                    const notifs = DB.getNotifications();
                    const { deletedAt, ...rest } = bin[idx];
                    notifs.unshift(rest);
                    DB.saveNotifications(notifs);
                    bin.splice(idx, 1);
                    DB.saveNotificationBin(bin);
                    App.renderNotifications();
                    App.renderNotificationBin();
                }
            },

            deleteBinNotification: (id) => {
                if(confirm('Permanently delete notification?')) {
                    DB.saveNotificationBin(DB.getNotificationBin().filter(n => n.id !== id));
                    App.renderNotificationBin();
                }
            },

            toggleAdminSection: () => {
                const section = document.getElementById('admin-section');
                const toggle = document.getElementById('admin-section-toggle');
                const chevron = document.getElementById('admin-section-chevron');
                if (!section) return;
                const expanding = section.classList.contains('hidden');
                section.classList.toggle('hidden');
                if (toggle) toggle.setAttribute('aria-expanded', String(expanding));
                if (chevron) chevron.textContent = expanding ? '▴' : '▾';
                if (expanding) {
                    const email = document.getElementById('admin-login-email');
                    if (email) email.focus();
                }
            },

            openModal: (id) => {
                const modal = document.getElementById(id);
                if (!modal) return;
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                modal.setAttribute('role', 'dialog');
                modal.setAttribute('aria-modal', 'true');
                const titleEl = modal.querySelector('h1, h2, h3');
                modal.setAttribute('aria-label', modal.getAttribute('data-title') || (titleEl && titleEl.textContent.trim()) || id);
                if (!App._modalStack) App._modalStack = [];
                App._modalStack.push({ id, prevFocus: document.activeElement });
                if (!App._modalKeydownBound) {
                    App._modalKeydownBound = true;
                    document.addEventListener('keydown', App._onModalKeydown);
                }
                const focusables = Array.from(modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
                if (focusables.length) focusables[0].focus();
            },
            closeModal: (id) => {
                const modal = document.getElementById(id);
                if (!modal) return;
                modal.classList.add('hidden');
                modal.removeAttribute('role');
                modal.removeAttribute('aria-modal');
                if(id === 'modal-login') {
                    document.getElementById('admin-login-pwd').value = '';
                    document.getElementById('admin-login-email').value = '';
                    const adminSection = document.getElementById('admin-section');
                    if (adminSection && !adminSection.classList.contains('hidden')) App.toggleAdminSection();
                }
                const anyModalOpen = Array.from(document.querySelectorAll('.modal-overlay')).some(m => !m.classList.contains('hidden'));
                if (!anyModalOpen) document.body.style.overflow = '';
                let prevFocus = null;
                if (App._modalStack) {
                    const idx = App._modalStack.map(entry => entry.id).lastIndexOf(id);
                    if (idx !== -1) prevFocus = App._modalStack.splice(idx, 1)[0].prevFocus;
                }
                if (prevFocus && document.contains(prevFocus)) {
                    const topEntry = App._modalStack && App._modalStack.length ? App._modalStack[App._modalStack.length - 1] : null;
                    const topModal = topEntry ? document.getElementById(topEntry.id) : null;
                    if (!topModal || topModal.contains(prevFocus) || !prevFocus.closest('.modal-overlay')) {
                        prevFocus.focus({ preventScroll: true });
                    }
                }
            },

            _onModalKeydown: (e) => {
                if (!App._modalStack || App._modalStack.length === 0) return;
                const top = App._modalStack[App._modalStack.length - 1];
                const modal = document.getElementById(top.id);
                if (!modal || modal.classList.contains('hidden')) return;
                if (e.key === 'Escape') {
                    e.preventDefault();
                    App.closeModal(top.id);
                    return;
                }
                if (e.key !== 'Tab') return;
                const focusables = Array.from(modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
                if (focusables.length === 0) { e.preventDefault(); return; }
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                const active = document.activeElement;
                if (e.shiftKey && (active === first || !modal.contains(active))) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && (active === last || !modal.contains(active))) { e.preventDefault(); first.focus(); }
            },

            navigate: (targetPane) => {
                // Hard gate: admin panes are unreachable without an authenticated admin session.
                if (targetPane && targetPane.startsWith('admin-') && !App.isAdminAuthed()) {
                    App.lockAdmin();
                    return;
                }

                if(event && event.currentTarget && event.currentTarget.classList.contains('nav-item')) {
                    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                    event.currentTarget.classList.add('active');
                }
                
                document.querySelectorAll('.view-pane').forEach(el => el.classList.add('hidden'));
                document.getElementById(`pane-${targetPane}`).classList.remove('hidden');

                const paneTitles = {
                    'admin-checkin': 'Staff Check-in',
                    'admin-dashboard': 'Dashboard',
                    'admin-notifications': 'Notifications',
                    'admin-members': 'Member Directory',
                    'admin-payments': 'Payments',
                    'admin-schedules': 'Training Schedules',
                    'admin-plans': 'Membership Plans',
                    'admin-settings': 'General Settings'
                };
                const mobileTitle = document.getElementById('mobile-page-title');
                if (mobileTitle) mobileTitle.innerText = paneTitles[targetPane] || 'Admin Portal';

                if (targetPane === 'admin-checkin') { 
                    document.getElementById('checkin-search').value = ''; 
                    App.handleAdminCheckinSearch(); 
                    App.renderLivePresent(); 
                    App.renderCheckinQR(); 
                    const noticeField = document.getElementById('form-checkin-notice');
                    if (noticeField) noticeField.value = DB.getCheckinNotice();
                    const noticeColorField = document.getElementById('form-checkin-notice-color');
                    if (noticeColorField) noticeColorField.value = DB.getCheckinNoticeColor();
                    App.renderCheckinNotice();
                }
                if (targetPane === 'admin-dashboard') { 
                    App.switchTab('dashboard', 'overview');
                    App.renderAdminDashboard(); 
                    document.getElementById('filter-visit-start').value = ''; 
                    document.getElementById('filter-visit-end').value = ''; 
                    document.getElementById('filter-visit-status').value = 'all';
                    const sortEl = document.getElementById('filter-visit-sort');
                    if (sortEl) sortEl.value = 'newest';
                    App.renderVisitLog(); 
                }
                if (targetPane === 'admin-notifications') { App.renderNotifications(); App.renderNotificationBin(); App.switchTab('notifications', 'list'); }
                if (targetPane === 'admin-members') { App.renderMemberDirectory(); App.renderMemberBin(); App.switchDirStatus('active'); }
                if (targetPane === 'admin-payments') { App.renderAllPayments(); }
                if (targetPane === 'admin-plans') { App.renderPlans(); App.renderPlanBin(); App.switchTab('plans', 'list'); }
                if (targetPane === 'admin-schedules') { App.renderSchedules(); App.renderScheduleBin(); App.switchTab('schedule', 'list'); }
                if (targetPane === 'admin-settings') App.renderAdminSettings();

                if (window.innerWidth <= 768) {
                    document.querySelector('.sidebar').classList.remove('open');
                    document.getElementById('sidebar-overlay').classList.remove('open');
                }
            },

            loginWithGoogle: () => {
                const auth = getAuth();
                if (!auth) return alert('Firebase Auth is not available.');
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider)
                    .then((cred) => {
                        if (isAdminUser(cred.user)) {
                            App.closeModal('modal-login');
                            App.unlockAdmin();
                        } else {
                            // Signed in with Google, but not the admin account — revoke immediately.
                            auth.signOut();
                            alert('This Google account does not have admin access.');
                        }
                    })
                    .catch((err) => {
                        if (!err) return;
                        if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
                        if (err.code === 'auth/popup-blocked') return alert('Google popup was blocked. Allow popups for this site and try again.');
                        if (err.code === 'auth/unauthorized-domain') return alert('This domain is not authorized for Google sign-in. Add it in Firebase Console -> Authentication -> Settings -> Authorized domains.');
                        alert(err.message || 'Google sign-in failed. Please try again.');
                    });
            },

            loginAsAdmin: () => {
                const emailInput = document.getElementById('admin-login-email');
                const pwdInput = document.getElementById('admin-login-pwd');
                const email = (emailInput.value || '').trim();
                const pwd = pwdInput.value;
                if (!email || !pwd) return alert('Please enter the admin email and password.');
                const auth = getAuth();
                if (!auth) return alert('Firebase Auth is not available. Check your connection.');
                auth.signInWithEmailAndPassword(email, pwd)
                    .then((cred) => {
                        if (isAdminUser(cred.user)) {
                            pwdInput.value = '';
                            App.closeModal('modal-login');
                            App.unlockAdmin();
                        } else {
                            // Signed in, but not the admin account — revoke immediately.
                            auth.signOut();
                            alert('This account does not have admin access.');
                        }
                    })
                    .catch((err) => {
                        let msg = 'Sign-in failed. Please try again.';
                        if (err && err.code === 'auth/invalid-credential') msg = 'Incorrect email or password.';
                        else if (err && err.code === 'auth/wrong-password') msg = 'Incorrect email or password.';
                        else if (err && err.code === 'auth/user-not-found') msg = 'No account found with this email.';
                        else if (err && err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
                        else if (err && err.code === 'auth/too-many-requests') msg = 'Too many failed attempts. Try again later.';
                        else if (err && err.message) msg = err.message;
                        alert(msg);
                    });
            },

});

(() => {
    const syncDrawerAria = (el) => {
        el.setAttribute('aria-hidden', el.classList.contains('open') ? 'false' : 'true');
    };
    const drawerObserver = new MutationObserver(muts => {
        muts.forEach(mut => {
            if (mut.type === 'attributes' && mut.attributeName === 'class') syncDrawerAria(mut.target);
        });
    });
    document.querySelectorAll('.portal-drawer, .portal-drawer-overlay').forEach(el => {
        syncDrawerAria(el);
        drawerObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
})();
