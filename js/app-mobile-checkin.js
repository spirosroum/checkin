// =====================================================================
// app-mobile-checkin.js
// App methods: getMobileSessionMember, saveMobileSession, clearMobileSession, showKioskCheckinPortal, showMobileCheckinLanding, showMobileCheckinView, mobileCheckinSubmit, mobileCheckinGo, beginMobileCheckin, confirmCheckin, mobileCheckinConfirm, showMobileCheckinSuccess, mobileCheckinAgain, mobileCheckinSwitch, cancelCheckinSelection
// Plain script (no ES modules). Methods attach to the global App object
// created in app-core.js. Load order is fixed in index.html.
// =====================================================================
Object.assign(App, {
            getMobileSessionMember: () => {
                const id = localStorage.getItem('gym_member_session');
                if (!id) return null;
                return DB.getMembers().find(m => m.id === id) || null;
            },

            saveMobileSession: (id) => {
                localStorage.setItem('gym_member_session', id || '');
            },

            clearMobileSession: () => {
                localStorage.removeItem('gym_member_session');
            },

            showKioskCheckinPortal: () => {
                App.isMobileCheckinMode = true;
                document.querySelectorAll('.app-container').forEach(el => el.classList.add('hidden'));
                const kioskView = document.getElementById('view-kiosk');
                if (kioskView) kioskView.classList.remove('hidden');
                const mobileView = document.getElementById('view-mobile-checkin');
                if (mobileView) mobileView.classList.add('hidden');
                App.renderCheckinNotice();
            },

            // Shows the dedicated mobile check-in screen (ID entry or "welcome back" landing).
            // Used for the first-time ID entry and as a landing after cancelling the class chooser.
            showMobileCheckinLanding: () => {
                App.isMobileCheckinMode = true;
                document.querySelectorAll('.app-container').forEach(el => el.classList.add('hidden'));
                const kioskView = document.getElementById('view-kiosk');
                if (kioskView) kioskView.classList.add('hidden');
                const adminView = document.getElementById('view-admin');
                if (adminView) adminView.classList.add('hidden');
                const memberView = document.getElementById('view-member');
                if (memberView) memberView.classList.add('hidden');
                const mobileView = document.getElementById('view-mobile-checkin');
                if (mobileView) mobileView.classList.remove('hidden');
                App.renderCheckinNotice();

                const identify = document.getElementById('mobile-checkin-identify');
                const greeting = document.getElementById('mobile-checkin-greeting');
                const success = document.getElementById('mobile-checkin-success');
                const link = document.getElementById('mobile-checkin-link');
                if (!identify || !greeting || !success) return;

                // A Google account already signed in resolves to a member automatically
                // (redirect sign-ins land back here on reload).
                const remembered = App.getMobileSessionMember() || App.getMemberByFirebaseEmail();
                if (remembered) {
                    if (!App.currentUser) App.setMemberSession(remembered);
                    identify.classList.add('hidden');
                    success.classList.add('hidden');
                    if (link) link.classList.add('hidden');
                    greeting.classList.remove('hidden');
                    const nameEl = document.getElementById('mobile-checkin-greeting-name');
                    if (nameEl) nameEl.innerText = `Welcome back, ${remembered.firstName}! Check in for your class below.`;
                } else {
                    greeting.classList.add('hidden');
                    success.classList.add('hidden');
                    if (link) link.classList.add('hidden');
                    identify.classList.remove('hidden');
                    const input = document.getElementById('mobile-checkin-id');
                    if (input) { input.value = ''; setTimeout(() => input.focus(), 300); }
                }
            },

            showMobileCheckinView: () => {
                const remembered = App.getMobileSessionMember() || App.getMemberByFirebaseEmail();
                if (remembered) {
                    // Return to the main check-in portal with the class chooser ready to go.
                    App.showKioskCheckinPortal();
                    App.beginMobileCheckin(remembered);
                    return;
                }
                App.showMobileCheckinLanding();
            },

            // "Sign in with Google" on the mobile check-in screen.
            mobileGoogleLogin: () => {
                const auth = getAuth();
                if (!auth) return App.showKioskMessage('Firebase Auth is not available.', 'danger');
                const provider = new firebase.auth.GoogleAuthProvider();
                const finish = () => {
                    const member = App.getMemberByFirebaseEmail();
                    if (member) {
                        App.setMemberSession(member);
                        App.showMobileCheckinLanding();
                    } else {
                        const link = document.getElementById('mobile-checkin-link');
                        const identify = document.getElementById('mobile-checkin-identify');
                        if (identify) identify.classList.add('hidden');
                        if (link) link.classList.remove('hidden');
                        const input = document.getElementById('mobile-link-id');
                        if (input) setTimeout(() => input.focus(), 300);
                    }
                };
                const fail = (err) => {
                    if (!err) return;
                    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
                    if (err.code === 'auth/unauthorized-domain') return App.showKioskMessage('Domain not authorized for Google sign-in.', 'danger');
                    App.showKioskMessage(err.message || 'Google sign-in failed.', 'danger');
                };
                if (App.isTouchDevice()) {
                    auth.signInWithRedirect(provider).catch(fail);
                } else {
                    auth.signInWithPopup(provider).then(finish).catch(fail);
                }
            },

            // Submit the member ID on the "link your Google account" screen.
            mobileLinkSubmit: () => {
                const input = document.getElementById('mobile-link-id');
                const msg = document.getElementById('mobile-link-msg');
                const auth = getAuth();
                if (!auth || !auth.currentUser) {
                    App.showKioskMessage('No Google account is signed in.', 'danger');
                    return;
                }
                const id = input.value.trim();
                if (!id) return;
                const member = DB.getMembers().find(m => m.id === id);
                if (!member) {
                    input.value = '';
                    msg.innerText = 'Member ID not found. Please try again or see staff.';
                    msg.className = 'kiosk-msg danger';
                    msg.classList.remove('hidden');
                    return;
                }
                const linkResult = App.linkGoogleEmailToMember(member, auth.currentUser.email);
                if (linkResult.error) {
                    input.value = '';
                    msg.innerText = linkResult.error;
                    msg.className = 'kiosk-msg danger';
                    msg.classList.remove('hidden');
                    return;
                }
                input.value = '';
                msg.classList.add('hidden');
                App.setMemberSession(member);
                App.showMobileCheckinLanding();
            },

            mobileCheckinSubmit: () => {
                const input = document.getElementById('mobile-checkin-id');
                if (!input) return;
                const id = input.value.trim();
                if (!id) return;
                const member = DB.getMembers().find(m => m.id === id);
                if (!member) {
                    App.showKioskMessage('Member ID not found.', 'danger');
                    return;
                }
                // If a Google account is signed in, link it to this member (one-time).
                const auth = getAuth();
                if (auth && auth.currentUser && auth.currentUser.email) {
                    const linkResult = App.linkGoogleEmailToMember(member, auth.currentUser.email);
                    if (linkResult.error) {
                        App.showKioskMessage(linkResult.error, 'danger');
                        return;
                    }
                }
                App.saveMobileSession(member.id);
                input.value = '';
                App.showKioskCheckinPortal();
                App.beginMobileCheckin(member);
            },

            mobileCheckinGo: () => {
                const member = App.getMobileSessionMember();
                if (!member) { App.mobileCheckinSwitch(); return; }
                App.showKioskCheckinPortal();
                App.beginMobileCheckin(member);
            },

            beginMobileCheckin: (member) => {
                if (!member) return;
                if (member.accountStatus === 'Frozen') {
                    App.showKioskAlert('Account Frozen', 'Your account is frozen. Please see staff.', 'var(--warning)');
                    return;
                }
                const isUnpaidVisit = App.computeVisitUnpaid(member);
                const planDays = member.planDays != null ? parseInt(member.planDays, 10) : null;
                const daysRemaining = Utils.getDaysRemaining(member.expirationDate);
                let membershipAlert = '';
                if (member.sessionsTotal && (parseInt(member.sessionsLeft) || 0) <= 0) {
                    membershipAlert = 'Attention: You have used all your plan sessions. Please renew.';
                } else if (planDays && daysRemaining >= 0 && daysRemaining <= 2) {
                    membershipAlert = 'Note: Your membership is about to end in ' + daysRemaining + ' days.';
                }
                App.pendingCheckinMember = { member, isUnpaidVisit, membershipAlert };
                App.openCheckinClassModal();
            },

            // Dispatcher: shared class modal is used by both the kiosk and mobile self check-in.
            confirmCheckin: (skipClassRequired = false) => {
                if (App.isMobileCheckinMode) {
                    App.mobileCheckinConfirm(!!skipClassRequired);
                } else {
                    App.confirmKioskClassSelection(!!skipClassRequired);
                }
            },

            mobileCheckinConfirm: (skipClassRequired) => {
                App.confirmKioskClassSelection(!!skipClassRequired);
                if (App.pendingCheckinMember) return; // validation failed, message already shown
                App.showMobileCheckinSuccess();
            },

            showMobileCheckinSuccess: () => {
                App.isMobileCheckinMode = true;
                document.querySelectorAll('.app-container').forEach(el => el.classList.add('hidden'));
                const kioskView = document.getElementById('view-kiosk');
                if (kioskView) kioskView.classList.add('hidden');
                const adminView = document.getElementById('view-admin');
                if (adminView) adminView.classList.add('hidden');
                const memberView = document.getElementById('view-member');
                if (memberView) memberView.classList.add('hidden');
                const mobileView = document.getElementById('view-mobile-checkin');
                if (mobileView) mobileView.classList.remove('hidden');
                const identify = document.getElementById('mobile-checkin-identify');
                const greeting = document.getElementById('mobile-checkin-greeting');
                const success = document.getElementById('mobile-checkin-success');
                if (identify) identify.classList.add('hidden');
                if (greeting) greeting.classList.add('hidden');
                if (success) success.classList.remove('hidden');
            },

            mobileCheckinAgain: () => {
                App.showMobileCheckinView();
            },

            mobileCheckinSwitch: () => {
                App.clearMobileSession();
                const input = document.getElementById('mobile-checkin-id');
                if (input) input.value = '';
                const linkInput = document.getElementById('mobile-link-id');
                if (linkInput) linkInput.value = '';
                const link = document.getElementById('mobile-checkin-link');
                if (link) link.classList.add('hidden');
                const linkMsg = document.getElementById('mobile-link-msg');
                if (linkMsg) { linkMsg.classList.add('hidden'); linkMsg.innerText = ''; }
                const success = document.getElementById('mobile-checkin-success');
                if (success) success.classList.add('hidden');
                const greeting = document.getElementById('mobile-checkin-greeting');
                if (greeting) greeting.classList.add('hidden');
                const identify = document.getElementById('mobile-checkin-identify');
                if (identify) identify.classList.remove('hidden');
                if (input) setTimeout(() => input.focus(), 100);
            },

            // Dispatcher: shared class modal cancel/X buttons.
            // In the mobile self check-in, cancelling returns the member to the
            // check-in portal (view-kiosk) so they can start again.
            cancelCheckinSelection: () => {
                if (App.isMobileCheckinMode) {
                    App.pendingCheckinMember = null;
                    App.closeModal('modal-checkin-classes');
                    App.showKioskCheckinPortal();
                } else {
                    App.cancelKioskClassSelection();
                }
            },

});
