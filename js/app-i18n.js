// =====================================================================
// app-i18n.js
// Kiosk localization map (en/el) and language helpers. Sets the window.onload boot hook.
// Plain script (no ES modules). Methods attach to the global App object
// created in app-core.js. Load order is fixed in index.html.
// =====================================================================

// Kiosk localization map and helper methods (applies only to the public kiosk/check-in views)
App.KIOSK_I18N = {
    en: {
        portalTitle: '🥋 BJJ Kiosk Portal',
        viewPlans: 'View Plans',
        infoLogin: 'Member Login',
        memberCheckInTitle: 'Member Check-In',
        scanPrompt: 'Scan or enter your Member ID to Check-In.',
        numpadClear: 'Clear',
        numpadBack: 'Back',
        checkInButton: 'Check In',
        noticeTitle: 'Notice',
        noticeGotIt: 'Got it!',
        publicPlansTitle: 'Available Memberships',
        availableClasses: 'Available Classes',
        classRequirements: 'Class Requirements',
        loginHeader: 'Information Access',
        memberDashboard: 'Member Dashboard',
        enterMemberIdPlaceholder: '••••',
        accessDashboard: 'Access Dashboard',
        backToKiosk: '← Back to Kiosk',
        langFlag: '🇬🇧',
        toggleLanguageTitle: 'Toggle language',
        menuLabel: 'Menu',
        languageLabel: 'Language',
        leaderboardTitle: 'Most Trainings',
        leaderboardSubtitle: 'Ranked by check-ins over the last 3 months.',
        leaderboardBadge: 'Top 10',
        leaderboardRankColumn: 'Rank',
        leaderboardNoTrainings: 'No trainings recorded in the last 3 months yet.',
        leaderboardMemberColumn: 'Name',
        leaderboardBeltColumn: 'Belt',
        leaderboardSessionsColumn: 'Trainings',
        memberViewWelcome: 'Welcome',
        memberViewCurrentBelt: 'Current Belt:',
        memberViewAccountStatus: 'Account Status:',
        memberViewExpiration: 'Expiration Date:',
        memberChangeIdTitle: 'Change Member ID',
        memberChangeIdDesc: 'Update your login ID code.',
        memberChangeIdPlaceholder: 'New ID (max 8 digits)',
        memberChangeIdSave: 'Save ID',
        memberHistorySummary: 'My Personal Calendar & Check-in History',
        memberUnpaidTitle: 'Unpaid Training Sessions',
        memberUnpaidDesc: 'The following past visits were recorded while your account was expired or frozen.',
        memberUnpaidDateHeader: 'Date',
        memberUnpaidEntryHeader: 'Entry Time',
        memberUnpaidDurationHeader: 'Duration',
        memberViewNoUnpaid: 'You have no unpaid trainings!',
        memberViewNoHistory: 'No history found.',
        memberViewHistoryDate: 'Date',
        memberViewHistoryEntry: 'Entry',
        memberViewHistoryDuration: 'Duration',
        memberViewHistoryStatus: 'Status',
        memberViewStatusUnpaid: 'Unpaid',
        memberViewStatusPaid: 'Paid',
        memberViewRankLabel: 'Leaderboard Rank',
        memberViewRankUnranked: 'Unranked',
        memberHideLbTitle: 'Hide From Leaderboard',
        memberHideLbDesc: 'Hide your name and rank from the Most Trainings leaderboard.',
        memberHideLbVisible: 'Visible',
        memberHideLbHidden: 'Hidden',
        memberStatusFrozen: 'Frozen',
        memberStatusExpired: 'Expired',
        memberStatusActive: 'Active',
        memberStatusDaysLeft: 'days left',
        memberSessionsLeft: 'Sessions Left',
        memberPortalLogout: 'Logout',
        classDetailsTitle: 'Class Details',
        classDetailsClose: 'Close',
        classDetailsPractitionersLabel: 'Practitioners / Members:',
        classDetailsRequirementsLabel: 'Requirements:',
        classDetailsRecordedCheckins: 'Recorded Check-ins:',
        classDetailsRecentLabel: 'Recent:',
        classDetailsNoCheckins: 'No recorded check-ins yet.',
        classDetailsScheduledFor: 'Scheduled For:',
        classDetailsNoDescription: 'No description available.',
        classDetailsUnknownMember: 'Unknown',
        publicClassesTitle: 'Available Classes',
        classScheduleLabel: 'Schedule:',
        classExpandDetails: 'View schedule & details',
        classCollapseDetails: 'Hide details',
        checkinClassesTitle: 'Select Classes',
        checkinClassesNote: 'Select the class(es) you are attending before confirming your check-in.',
        checkinNoClassesText: 'There are no classes scheduled at this time. Confirm check-in to continue.',
        checkinFallbackNotice: 'Your check-in will still be recorded for gym access.',
        checkinAlreadyCheckedInBadge: 'Already Checked In',
        checkinAlreadyCheckedInText: 'You have already checked into all classes scheduled for today. Please ask staff for assistance.',
        checkinScheduleUnavailable: 'Schedule details not available.',
        checkinSelectButton: 'Select',
        checkinSelectedButton: 'Selected',
        checkinOpenGymSummary: 'Not taking a class today?',
        checkinOpenGymHint: 'You can still check in for open gym time without selecting a class.',
        checkinOpenGymButton: 'Check In Without a Class (Open Gym)',
        checkinSelectAtLeastOne: 'Please select at least one class to continue.',
        cancelButton: 'Cancel',
        checkinConfirmButton: 'Confirm Check-In',
        kioskAlertExpired: 'Attention: Your membership has expired or you are out of sessions. Please see staff.',
        kioskAlertSessions: 'Attention: You have used all your plan sessions. Please renew.',
        kioskAlertExpiring: 'Note: Your membership is about to end in ',
        kioskAlertExpiringDays: ' days.',
        kioskAlertMembershipTitle: 'Membership Alert',
        // Mobile self check-in view
        mobileCheckinSubtitle: 'Scan the QR at the gym to check in.',
        mobileEnterId: 'Enter your Member ID',
        mobileIdPlaceholder: 'Member ID',
        mobileCheckinButton: 'Check In',
        mobileOr: 'or',
        mobileGoogleSignIn: 'Sign in with Google',
        mobileLinkPrompt: 'No member is linked to this Google account yet. Enter your member ID once to link it.',
        mobileLinkContinue: 'Link & Continue',
        mobileUseIdInstead: 'Use member ID instead',
        mobileWelcomeBack: 'Welcome back, ',
        mobileWelcomeBackSuffix: '! Check in for your class below.',
        mobileSwitchMember: 'Not you? Switch member',
        mobileCheckinSuccessTitle: "You're checked in!",
        mobileCheckinSuccessText: 'Enjoy your training.',
        mobileCheckinAgain: 'Check In Again',
        mobileAuthUnavailable: 'Firebase Auth is not available.',
        mobileDomainUnauthorized: 'Domain not authorized for Google sign-in.',
        mobileGoogleFailed: 'Google sign-in failed.',
        mobileNoGoogleAccount: 'No Google account is signed in.',
        mobileMemberIdNotFoundStaff: 'Member ID not found. Please try again or see staff.',
        mobileMemberIdNotFound: 'Member ID not found.',
        mobileAccountFrozenTitle: 'Account Frozen',
        mobileAccountFrozenBody: 'Your account is frozen. Please see staff.',
        mobileLinkNoEmail: 'No email provided.',
        mobileLinkEmailMismatchPrefix: 'This member already has a different email linked (',
        mobileLinkEmailMismatchSuffix: '). Ask staff to update it.',
        mobileMemberRecordNotFound: 'Member record not found.',
        // Kiosk-specific headings
        gymSchedule: 'Gym Schedule',
        currentlyInside: 'Currently Inside',
        // Days mapping for kiosk schedule (full names)
        days: {
            'Sunday': 'Sunday',
            'Monday': 'Monday',
            'Tuesday': 'Tuesday',
            'Wednesday': 'Wednesday',
            'Thursday': 'Thursday',
            'Friday': 'Friday',
            'Saturday': 'Saturday'
        }
    },
    el: {
        portalTitle: '🥋 Πύλη Υποδοχής',
        viewPlans: 'Προβολή Συνδρομών',
        infoLogin: 'Σύνδεση Μέλους',
        memberCheckInTitle: 'Check-in Μέλους',
        scanPrompt: 'Σαρώστε ή εισάγετε τον κωδικό μέλους για να κάνετε check-in.',
        numpadClear: 'Καθάρισμα',
        numpadBack: 'Πίσω',
        checkInButton: 'Εγγραφή',
        noticeTitle: 'Ειδοποίηση',
        noticeGotIt: 'Εντάξει',
        publicPlansTitle: 'Διαθέσιμες Συνδρομές',
        availableClasses: 'Διαθέσιμα Μαθήματα',
        classRequirements: 'Απαιτήσεις Μαθήματος',
        loginHeader: 'Πρόσβαση Πληροφοριών',
        memberDashboard: 'Πίνακας Μέλους',
        enterMemberIdPlaceholder: '••••',
        accessDashboard: 'Πρόσβαση Πίνακα',
        backToKiosk: '← Πίσω στην Πύλη',
        langFlag: '🇬🇷',
        toggleLanguageTitle: 'Αλλαγή γλώσσας',
        menuLabel: 'Μενού',
        languageLabel: 'Γλώσσα',
        leaderboardTitle: 'Περισσότερες Προπονήσεις',
        leaderboardSubtitle: 'Κατάταξη με βάση τα check-in των τελευταίων 3 μηνών.',
        leaderboardBadge: 'Top 10',
        leaderboardRankColumn: 'Θέση',
        leaderboardNoTrainings: 'Δεν υπάρχουν προπονήσεις στους τελευταίους 3 μήνες ακόμα.',
        leaderboardMemberColumn: 'Όνομα',
        leaderboardBeltColumn: 'Ζώνη',
        leaderboardSessionsColumn: 'Προπονήσεις',
        memberViewWelcome: 'Καλώς ήρθες',
        memberViewCurrentBelt: 'Τρέχουσα Ζώνη:',
        memberViewAccountStatus: 'Κατάσταση Λογαριασμού:',
        memberViewExpiration: 'Ημερομηνία Λήξης:',
        memberChangeIdTitle: 'Αλλαγή Κωδικού Μέλους',
        memberChangeIdDesc: 'Ενημερώστε τον κωδικό εισόδου σας.',
        memberChangeIdPlaceholder: 'Νέος Κωδικός (έως 8 ψηφία)',
        memberChangeIdSave: 'Αποθήκευση Κωδικού',
        memberHistorySummary: 'Το Προσωπικό Μου Ημερολόγιο & Ιστορικό Check-in',
        memberUnpaidTitle: 'Ανεξόφλητες Προπονήσεις',
        memberUnpaidDesc: 'Τα παρακάτω προηγούμενα check-ins καταγράφηκαν ενώ ο λογαριασμός σας ήταν ληγμένος ή παγωμένος.',
        memberUnpaidDateHeader: 'Ημερομηνία',
        memberUnpaidEntryHeader: 'Ώρα Εισόδου',
        memberUnpaidDurationHeader: 'Διάρκεια',
        memberViewNoUnpaid: 'Δεν έχετε απλήρωτες προπονήσεις!',
        memberViewNoHistory: 'Δεν βρέθηκαν εγγραφές.',
        memberViewHistoryDate: 'Ημερομηνία',
        memberViewHistoryEntry: 'Είσοδος',
        memberViewHistoryDuration: 'Διάρκεια',
        memberViewHistoryStatus: 'Κατάσταση',
        memberViewStatusUnpaid: 'Απλήρωτο',
        memberViewStatusPaid: 'Πληρωμένο',
        memberViewRankLabel: 'Θέση στην Κατάταξη',
        memberViewRankUnranked: 'Χωρίς κατάταξη',
        memberHideLbTitle: 'Απόκρυψη από την Κατάταξη',
        memberHideLbDesc: 'Αποκρύψτε το όνομά σας και τη θέση σας από τον πίνακα Περισσότερες Προπονήσεις.',
        memberHideLbVisible: 'Ορατό',
        memberHideLbHidden: 'Απόκρυψη',
        memberStatusFrozen: 'Παγωμένος',
        memberStatusExpired: 'Έληξε',
        memberStatusActive: 'Ενεργός',
        memberStatusDaysLeft: 'ημέρες απομένουν',
        memberSessionsLeft: 'Υπολειπόμενες Συνεδρίες',
        memberPortalLogout: 'Αποσύνδεση',
        classDetailsTitle: 'Λεπτομέρειες Μαθήματος',
        classDetailsClose: 'Κλείσιμο',
        classDetailsPractitionersLabel: 'Συμμετέχοντες / Μέλη:',
        classDetailsRequirementsLabel: 'Απαιτήσεις:',
        classDetailsRecordedCheckins: 'Καταγεγραμμένα Check-ins:',
        classDetailsRecentLabel: 'Πρόσφατα:',
        classDetailsNoCheckins: 'Δεν υπάρχουν ακόμα καταγεγραμμένα check-ins.',
        classDetailsScheduledFor: 'Προγραμματισμένο για:',
        classDetailsNoDescription: 'Δεν υπάρχει διαθέσιμη περιγραφή.',
        classDetailsUnknownMember: 'Άγνωστο',
        publicClassesTitle: 'Διαθέσιμα Μαθήματα',
        classScheduleLabel: 'Πρόγραμμα:',
        classExpandDetails: 'Προβολή προγράμματος & λεπτομερειών',
        classCollapseDetails: 'Απόκρυψη λεπτομερειών',
        checkinClassesTitle: 'Επιλέξτε Μαθήματα',
        checkinClassesNote: 'Επιλέξτε το/τα μάθημα(τα) που παρακολουθείτε πριν επιβεβαιώσετε το check-in.',
        checkinNoClassesText: 'Δεν υπάρχουν προγραμματισμένα μαθήματα αυτή τη στιγμή. Επιβεβαιώστε το check-in για να συνεχίσετε.',
        checkinFallbackNotice: 'Το check-in σας θα καταγραφεί κανονικά για πρόσβαση στο γυμναστήριο.',
        checkinAlreadyCheckedInBadge: 'Ήδη Εγγεγραμμένος',
        checkinAlreadyCheckedInText: 'Έχετε ήδη κάνει check-in σε όλα τα προγραμματισμένα μαθήματα για σήμερα. Παρακαλώ επικοινωνήστε με το προσωπικό για βοήθεια.',
        checkinScheduleUnavailable: 'Δεν είναι διαθέσιμη η περιγραφή του προγράμματος.',
        checkinSelectButton: 'Επιλογή',
        checkinSelectedButton: 'Επιλέχθηκε',
        checkinOpenGymSummary: 'Δεν κάνετε κάποιο μάθημα σήμερα;',
        checkinOpenGymHint: 'Μπορείτε να κάνετε check-in για ελεύθερη προπόνηση χωρίς να επιλέξετε μάθημα.',
        checkinOpenGymButton: 'Check-in Χωρίς Μάθημα (Ελεύθερη Προπόνηση)',
        checkinSelectAtLeastOne: 'Παρακαλώ επιλέξτε τουλάχιστον ένα μάθημα για να συνεχίσετε.',
        cancelButton: 'Ακύρωση',
        checkinConfirmButton: 'Επιβεβαίωση Check-In',
        kioskAlertExpired: 'Προσοχή: Η συνδρομή σας έχει λήξει ή δεν έχετε διαθέσιμες συνεδρίες. Παρακαλώ απευθυνθείτε στη γραμματεία.',
        kioskAlertSessions: 'Προσοχή: Έχετε χρησιμοποιήσει όλες τις συνεδρίες της συνδρομής σας. Παρακαλώ ανανεώστε.',
        kioskAlertExpiring: 'Σημείωση: Η συνδρομή σας λήγει σε ',
        kioskAlertExpiringDays: ' ημέρες.',
        kioskAlertMembershipTitle: 'Ειδοποίηση Συνδρομής',
        // Mobile self check-in view
        mobileCheckinSubtitle: 'Σαρώστε το QR στο γυμναστήριο για να κάνετε check-in.',
        mobileEnterId: 'Εισάγετε τον κωδικό μέλους σας',
        mobileIdPlaceholder: 'Κωδικός Μέλους',
        mobileCheckinButton: 'Check-in',
        mobileOr: 'ή',
        mobileGoogleSignIn: 'Σύνδεση με Google',
        mobileLinkPrompt: 'Δεν υπάρχει μέλος συνδεδεμένο με αυτόν τον λογαριασμό Google. Εισάγετε μία φορά τον κωδικό μέλους σας για να τον συνδέσετε.',
        mobileLinkContinue: 'Σύνδεση & Συνέχεια',
        mobileUseIdInstead: 'Χρήση κωδικού μέλους αντί αυτού',
        mobileWelcomeBack: 'Καλώς ήρθες ξανά, ',
        mobileWelcomeBackSuffix: '! Κάντε check-in για το μάθημά σας παρακάτω.',
        mobileSwitchMember: 'Δεν είστε εσείς; Αλλαγή μέλους',
        mobileCheckinSuccessTitle: 'Έχετε κάνει check-in!',
        mobileCheckinSuccessText: 'Καλή προπόνηση.',
        mobileCheckinAgain: 'Check-in Ξανά',
        mobileAuthUnavailable: 'Η Firebase Auth δεν είναι διαθέσιμη.',
        mobileDomainUnauthorized: 'Ο τομέας δεν είναι εξουσιοδοτημένος για σύνδεση Google.',
        mobileGoogleFailed: 'Η σύνδεση Google απέτυχε.',
        mobileNoGoogleAccount: 'Δεν υπάρχει συνδεδεμένος λογαριασμός Google.',
        mobileMemberIdNotFoundStaff: 'Ο κωδικός μέλους δεν βρέθηκε. Δοκιμάστε ξανά ή απευθυνθείτε στη γραμματεία.',
        mobileMemberIdNotFound: 'Ο κωδικός μέλους δεν βρέθηκε.',
        mobileAccountFrozenTitle: 'Παγωμένος Λογαριασμός',
        mobileAccountFrozenBody: 'Ο λογαριασμός σας είναι παγωμένος. Απευθυνθείτε στη γραμματεία.',
        mobileLinkNoEmail: 'Δεν παρέχεται email.',
        mobileLinkEmailMismatchPrefix: 'Σε αυτό το μέλος έχει ήδη συνδεθεί διαφορετικό email (',
        mobileLinkEmailMismatchSuffix: '). Ζητήστε από τη γραμματεία να το ενημερώσει.',
        mobileMemberRecordNotFound: 'Δεν βρέθηκε το αρχείο του μέλους.',
        // Kiosk-specific headings
        gymSchedule: 'Πρόγραμμα Προπονήσεων',
        currentlyInside: 'Μέσα στο Γυμναστήριο',
        // Days mapping for kiosk schedule (full names)
        days: {
            'Sunday': 'Κυριακή',
            'Monday': 'Δευτέρα',
            'Tuesday': 'Τρίτη',
            'Wednesday': 'Τετάρτη',
            'Thursday': 'Πέμπτη',
            'Friday': 'Παρασκευή',
            'Saturday': 'Σάββατο'
        }
    }
};

App.setKioskLanguage = function(lang) {
    try {
        if (!lang) lang = localStorage.getItem('kiosk_lang') || 'en';
        localStorage.setItem('kiosk_lang', lang);
        App.currentKioskLang = lang;
        App.applyKioskTranslations();
    } catch (e) { console.warn('setKioskLanguage error', e); }
};

App.applyKioskTranslations = function() {
    try {
        const lang = App.currentKioskLang || 'en';
        const map = App.KIOSK_I18N[lang] || App.KIOSK_I18N.en;
        // Kiosk header
        const title = document.getElementById('kiosk-title-display'); if (title) title.innerText = (typeof DB !== "undefined" && DB.getPortalName) ? DB.getPortalName() : map.portalTitle;
        // Buttons in header
        const headerButtons = Array.from(document.querySelectorAll('#view-kiosk .kiosk-header .btn-primary, #view-kiosk .kiosk-header .btn-outline'));
        headerButtons.forEach(btn => {
            if (btn.getAttribute && btn.getAttribute('onclick')?.includes("App.showPublicPlans")) { btn.innerText = map.viewPlans; btn.title = map.viewPlans; }
            if (btn.getAttribute && btn.getAttribute('onclick')?.includes("App.showPublicClasses")) { btn.innerText = map.availableClasses || 'Available Classes'; btn.title = map.availableClasses || 'Available Classes'; }
            if (btn.getAttribute && btn.getAttribute('onclick')?.includes("modal-login")) { btn.innerText = map.infoLogin; btn.title = map.infoLogin; }
        });
        // Member header action buttons (desktop layout shows them directly)
        const memberHeaderButtons = Array.from(document.querySelectorAll('#view-member .member-header .btn-outline'));
        memberHeaderButtons.forEach(btn => {
            const oc = btn.getAttribute && btn.getAttribute('onclick');
            if (!oc) return;
            if (oc.includes('App.showPublicPlans')) { btn.innerText = map.viewPlans; btn.title = map.viewPlans; }
            else if (oc.includes('App.showPublicClasses')) { btn.innerText = map.availableClasses || 'Available Classes'; btn.title = map.availableClasses || 'Available Classes'; }
            else if (oc.includes('App.logout')) { btn.innerText = map.memberPortalLogout || 'Logout'; btn.title = map.memberPortalLogout || 'Logout'; }
        });

        // ---- Shared sliding drawer translations (kiosk & member portal) ----
        const kioskDrawerTitle = document.getElementById('kiosk-drawer-title');
        if (kioskDrawerTitle && (typeof DB !== "undefined" && DB.getPortalName)) kioskDrawerTitle.innerText = DB.getPortalName();
        const memberDrawerTitle = document.getElementById('member-drawer-title');
        if (memberDrawerTitle && (typeof DB !== "undefined" && DB.getPortalName)) memberDrawerTitle.innerText = DB.getPortalName();
        const drawerItemPlans = document.querySelectorAll('#kiosk-drawer-plans, #member-drawer-plans');
        drawerItemPlans.forEach(el => { if (el) el.innerText = map.viewPlans; });
        const drawerItemClasses = document.querySelectorAll('#kiosk-drawer-classes, #member-drawer-classes');
        drawerItemClasses.forEach(el => { if (el) el.innerText = map.availableClasses || 'Available Classes'; });
        const kioskDrawerLogin = document.getElementById('kiosk-drawer-login');
        if (kioskDrawerLogin) kioskDrawerLogin.innerText = map.infoLogin;
        const memberDrawerLogout = document.getElementById('member-drawer-logout');
        if (memberDrawerLogout) memberDrawerLogout.innerText = map.memberPortalLogout || 'Logout';
        document.querySelectorAll('#kiosk-drawer-section-menu, #member-drawer-section-menu').forEach(el => { if (el) el.innerText = map.menuLabel || 'Menu'; });
        document.querySelectorAll('#kiosk-drawer-section-lang, #member-drawer-section-lang').forEach(el => { if (el) el.innerText = map.languageLabel || 'Language'; });
        const langLabelText = lang === 'en' ? '🇬🇧 English' : '🇬🇷 Ελληνικά';
        const kioskDrawerLang = document.getElementById('kiosk-drawer-lang');
        if (kioskDrawerLang) kioskDrawerLang.innerText = langLabelText;
        const memberDrawerLang = document.getElementById('member-drawer-lang');
        if (memberDrawerLang) memberDrawerLang.innerText = langLabelText;
        // Header language buttons (kiosk & member) — flag only
        const langBtnTitle = map.toggleLanguageTitle || 'Toggle language';
        ['kiosk-lang-btn', 'member-lang-btn'].forEach(id => {
            const langBtn = document.getElementById(id);
            if (langBtn) {
                langBtn.innerText = map.langFlag || '🇬🇧';
                langBtn.title = langBtnTitle;
                langBtn.setAttribute('aria-label', langBtnTitle);
            }
        });
        // Keep hamburger toggles' accessible labels in sync with the active language
        const menuBtnTitle = map.menuLabel || 'Menu';
        const kioskMenuBtn = document.getElementById('kiosk-menu-btn');
        if (kioskMenuBtn) { kioskMenuBtn.title = menuBtnTitle; kioskMenuBtn.setAttribute('aria-label', menuBtnTitle); }
        const memberMenuBtn = document.getElementById('member-menu-btn');
        if (memberMenuBtn) { memberMenuBtn.title = menuBtnTitle; memberMenuBtn.setAttribute('aria-label', menuBtnTitle); }
        // Main kiosk texts
        const h2 = document.querySelector('#view-kiosk .kiosk-input-card h2'); if (h2) h2.innerText = map.memberCheckInTitle;
        const p = document.querySelector('#view-kiosk .kiosk-input-card p.text-gray'); if (p) p.innerText = map.scanPrompt;
        const kioskInput = document.getElementById('kiosk-id-input'); if (kioskInput) kioskInput.placeholder = map.enterMemberIdPlaceholder || '••••';
        // Numpad buttons
        Array.from(document.querySelectorAll('#view-kiosk .kiosk-numpad button')).forEach(btn => {
            const txt = btn.innerText.trim();
            if (txt === 'Clear' || txt === 'Καθάρισμα') btn.innerText = map.numpadClear;
            if (txt === 'Back' || txt === 'Πίσω') btn.innerText = map.numpadBack;
            if (txt === 'Check-In' || txt === 'Check In' || txt === 'Εγγραφή') btn.innerText = map.checkInButton;
        });
        // Desktop checkin button
        const desktopBtn = document.querySelector('.desktop-checkin-btn'); if (desktopBtn) desktopBtn.innerText = map.checkInButton;
        // Kiosk alert modal
        const alertTitle = document.getElementById('kiosk-alert-title'); if (alertTitle) alertTitle.innerText = map.noticeTitle;
        const alertBtn = document.querySelector('#modal-kiosk-alert .btn-primary'); if (alertBtn) alertBtn.innerText = map.noticeGotIt;
        // Public plans modal
        const publicPlansTitle = document.querySelector('#modal-public-plans h2'); if (publicPlansTitle) publicPlansTitle.innerText = map.publicPlansTitle;
        // Public classes modal
        const publicClassesTitle = document.querySelector('#modal-public-classes h2'); if (publicClassesTitle) publicClassesTitle.innerText = map.publicClassesTitle || map.availableClasses || 'Available Classes';
        // Login modal - translate only the kiosk-related section (Member Dashboard and header), but NOT the Admin Portal labels or buttons
        const loginHeader = document.querySelector('#modal-login .modal-content h2'); if (loginHeader) loginHeader.innerText = map.loginHeader;
        // Find the H3 that refers to Member Dashboard section specifically and update it
        Array.from(document.querySelectorAll('#modal-login h3')).forEach(h3 => {
            const text = h3.innerText.trim();
            if (/Member Dashboard/i.test(text) || /Πίνακας Μέλους/i.test(text)) h3.innerText = map.memberDashboard;
        });
        const memberLoginInput = document.getElementById('member-login-id'); if (memberLoginInput) memberLoginInput.placeholder = map.enterMemberIdPlaceholder;
        // Change the primary button that triggers loginAsMember (keep admin buttons unchanged)
        const accessBtn = Array.from(document.querySelectorAll('#modal-login .btn-primary')).find(b => b && b.onclick && b.onclick.toString().includes('loginAsMember'));
        if (accessBtn) accessBtn.innerText = map.accessDashboard;
        // Back button (kiosk) - ensure we only change the one in this modal that returns to kiosk
        const backBtn = Array.from(document.querySelectorAll('#modal-login .btn-outline')).find(b => b && b.innerText && (b.innerText.includes('Back') || b.innerText.includes('Πίσω')));
        if (backBtn) backBtn.innerText = map.backToKiosk;

        const leaderboardTitle = document.getElementById('kiosk-leaderboard-title'); if (leaderboardTitle) leaderboardTitle.innerText = map.leaderboardTitle || 'Most Trainings';
        const leaderboardSubtitle = document.getElementById('kiosk-leaderboard-subtitle'); if (leaderboardSubtitle) leaderboardSubtitle.innerText = map.leaderboardSubtitle || 'Ranked by check-ins over the last 3 months.';
        const leaderboardBadge = document.getElementById('kiosk-leaderboard-badge'); if (leaderboardBadge) leaderboardBadge.innerText = map.leaderboardBadge || 'Top 10';

        const classDetailsTitle = document.getElementById('class-details-title'); if (classDetailsTitle) classDetailsTitle.innerText = map.classDetailsTitle || 'Class Details';
        const classDetailsCloseBtn = document.querySelector('#modal-class-details .btn-primary'); if (classDetailsCloseBtn) classDetailsCloseBtn.innerText = map.classDetailsClose || 'Close';

        const checkinClassesTitle = document.querySelector('#modal-checkin-classes h2'); if (checkinClassesTitle) checkinClassesTitle.innerText = map.checkinClassesTitle || 'Select Classes';
        const checkinClassesNote = document.getElementById('checkin-classes-note'); if (checkinClassesNote) checkinClassesNote.innerText = map.checkinClassesNote || 'Select the class(es) you are attending before confirming your check-in.';
        const checkinClassesCancel = Array.from(document.querySelectorAll('#modal-checkin-classes .btn-outline')).find(b => b && b.onclick && (b.onclick.toString().includes('App.cancelCheckinSelection') || b.onclick.toString().includes('App.cancelKioskClassSelection')));
        if (checkinClassesCancel) checkinClassesCancel.innerText = map.cancelButton || 'Cancel';
        const checkinClassesConfirm = Array.from(document.querySelectorAll('#modal-checkin-classes .btn-primary')).find(b => b && b.onclick && (b.onclick.toString().includes('App.confirmCheckin') || b.onclick.toString().includes('App.confirmKioskClassSelection')));
        if (checkinClassesConfirm) checkinClassesConfirm.innerText = map.checkinConfirmButton || 'Confirm Check-In';

        const memberChangeIdTitle = document.getElementById('member-change-id-title'); if (memberChangeIdTitle) memberChangeIdTitle.innerText = map.memberChangeIdTitle || 'Change Member ID';
        const memberChangeIdDesc = document.getElementById('member-change-id-desc'); if (memberChangeIdDesc) memberChangeIdDesc.innerText = map.memberChangeIdDesc || 'Update your login ID code.';
        const memberNewIdInput = document.getElementById('member-new-id'); if (memberNewIdInput) memberNewIdInput.placeholder = map.memberChangeIdPlaceholder || 'New ID (max 8 digits)';
        const memberChangeIdSave = document.getElementById('member-change-id-save'); if (memberChangeIdSave) memberChangeIdSave.innerText = map.memberChangeIdSave || 'Save ID';
        const memberHideLbTitle = document.getElementById('member-hide-lb-title'); if (memberHideLbTitle) memberHideLbTitle.innerText = map.memberHideLbTitle || 'Hide From Leaderboard';
        const memberHideLbDesc = document.getElementById('member-hide-lb-desc'); if (memberHideLbDesc) memberHideLbDesc.innerText = map.memberHideLbDesc || 'Hide your name and rank from the Most Trainings leaderboard.';
        const memberHistorySummary = document.getElementById('member-history-summary'); if (memberHistorySummary) memberHistorySummary.innerText = map.memberHistorySummary || 'My Personal Calendar & Check-in History';
        const memberUnpaidTitle = document.getElementById('member-unpaid-title'); if (memberUnpaidTitle) memberUnpaidTitle.innerText = map.memberUnpaidTitle || 'Unpaid Training Sessions';
        const memberUnpaidDesc = document.getElementById('member-unpaid-desc'); if (memberUnpaidDesc) memberUnpaidDesc.innerText = map.memberUnpaidDesc || 'The following past visits were recorded while your account was expired or frozen.';
        const memberUnpaidDateHeader = document.getElementById('member-unpaid-date-header'); if (memberUnpaidDateHeader) memberUnpaidDateHeader.innerText = map.memberUnpaidDateHeader || 'Date';
        const memberUnpaidEntryHeader = document.getElementById('member-unpaid-entry-header'); if (memberUnpaidEntryHeader) memberUnpaidEntryHeader.innerText = map.memberUnpaidEntryHeader || 'Entry Time';
        const memberUnpaidDurationHeader = document.getElementById('member-unpaid-duration-header'); if (memberUnpaidDurationHeader) memberUnpaidDurationHeader.innerText = map.memberUnpaidDurationHeader || 'Duration';
        if (!document.getElementById('view-member').classList.contains('hidden')) App.renderMemberDashboard();

        // --- Additional kiosk-only translations requested ---
        // 1) Translate the "Currently Inside" heading in the kiosk present card (do not touch admin 'Currently Present')
        try {
            const presentCountEl = document.getElementById('kiosk-present-count');
            if (presentCountEl) {
                const parentRow = presentCountEl.parentElement;
                if (parentRow) {
                    const presentHeading = parentRow.querySelector('h3');
                    if (presentHeading) presentHeading.innerText = map.currentlyInside || map.currentlyInside === '' ? map.currentlyInside : 'Currently Inside';
                }
            }
        } catch (e) { /* non-fatal */ }

        // 2) Translate the "Gym Schedule" heading inside the kiosk schedule card (only within kiosk view)
        try {
            const scheduleHeadingLabels = new Set(Object.values(App.KIOSK_I18N).map(langMap => langMap.gymSchedule).filter(Boolean));
            Array.from(document.querySelectorAll('#view-kiosk h3')).forEach(h3 => {
                const txt = (h3.innerText || '').trim();
                if (scheduleHeadingLabels.has(txt)) h3.innerText = map.gymSchedule || 'Gym Schedule';
            });
        } catch (e) { /* non-fatal */ }

        // 3) Translate day names inside the kiosk schedule container (calendar-day-header elements generated by renderCalendarView)
        try {
            const scheduleContainer = document.getElementById('kiosk-schedule-container');
            if (scheduleContainer) {
                const targetDayMap = map.days || {};
                const dayLookup = {};
                Object.values(App.KIOSK_I18N).forEach(langMap => {
                    Object.entries(langMap.days || {}).forEach(([en, localized]) => {
                        dayLookup[en] = en;
                        dayLookup[localized] = en;
                    });
                });
                document.querySelectorAll('#kiosk-schedule-container .calendar-day-header').forEach(el => {
                    const currentText = (el.innerText || '').trim();
                    const sourceDay = dayLookup[currentText] || currentText;
                    if (targetDayMap[sourceDay]) el.innerText = targetDayMap[sourceDay];
                });
            }
        } catch (e) { /* non-fatal */ }

        // ---- Mobile self check-in view ----
        const mobileTitle = document.getElementById('mobile-checkin-title');
        if (mobileTitle) mobileTitle.innerText = map.memberCheckInTitle || 'Member Check-In';
        const mobileSubtitle = document.getElementById('mobile-checkin-subtitle');
        if (mobileSubtitle) mobileSubtitle.innerText = map.mobileCheckinSubtitle || 'Scan the QR at the gym to check in.';
        const mobileEnterId = document.getElementById('mobile-checkin-enter-id');
        if (mobileEnterId) mobileEnterId.innerText = map.mobileEnterId || 'Enter your Member ID';
        const mobileIdInput = document.getElementById('mobile-checkin-id');
        if (mobileIdInput) mobileIdInput.placeholder = map.mobileIdPlaceholder || 'Member ID';
        const mobileLinkIdInput = document.getElementById('mobile-link-id');
        if (mobileLinkIdInput) mobileLinkIdInput.placeholder = map.mobileIdPlaceholder || 'Member ID';
        const mobileSubmitBtn = document.getElementById('mobile-checkin-submit-btn');
        if (mobileSubmitBtn) mobileSubmitBtn.innerText = map.mobileCheckinButton || 'Check In';
        const mobileGoBtn = document.getElementById('mobile-checkin-go-btn');
        if (mobileGoBtn) mobileGoBtn.innerText = map.mobileCheckinButton || 'Check In';
        const mobileOr = document.getElementById('mobile-checkin-or');
        if (mobileOr) mobileOr.innerText = map.mobileOr || 'or';
        const mobileGoogleText = document.getElementById('mobile-google-btn-text');
        if (mobileGoogleText) mobileGoogleText.innerText = map.mobileGoogleSignIn || 'Sign in with Google';
        const mobileLinkText = document.getElementById('mobile-checkin-link-text');
        if (mobileLinkText) mobileLinkText.innerText = map.mobileLinkPrompt || 'No member is linked to this Google account yet. Enter your member ID once to link it.';
        const mobileLinkBtn = document.getElementById('mobile-link-continue-btn');
        if (mobileLinkBtn) mobileLinkBtn.innerText = map.mobileLinkContinue || 'Link & Continue';
        const mobileUseIdBtn = document.getElementById('mobile-use-id-btn');
        if (mobileUseIdBtn) mobileUseIdBtn.innerText = map.mobileUseIdInstead || 'Use member ID instead';
        const mobileSwitchBtn = document.getElementById('mobile-switch-member-btn');
        if (mobileSwitchBtn) mobileSwitchBtn.innerText = map.mobileSwitchMember || 'Not you? Switch member';
        const mobileSuccessTitle = document.getElementById('mobile-checkin-success-title');
        if (mobileSuccessTitle) mobileSuccessTitle.innerText = map.mobileCheckinSuccessTitle || "You're checked in!";
        const mobileSuccessText = document.getElementById('mobile-checkin-success-text');
        if (mobileSuccessText) mobileSuccessText.innerText = map.mobileCheckinSuccessText || 'Enjoy your training.';
        const mobileAgainBtn = document.getElementById('mobile-checkin-again-btn');
        if (mobileAgainBtn) mobileAgainBtn.innerText = map.mobileCheckinAgain || 'Check In Again';

    } catch (e) { console.warn('applyKioskTranslations error', e); }
};

App.toggleLanguage = function() {
    try {
        const current = App.currentKioskLang || localStorage.getItem('kiosk_lang') || 'en';
        const next = current === 'en' ? 'el' : 'en';
        App.setKioskLanguage(next);
        App.renderCalendarView('kiosk-schedule-container', false);
        App.renderKioskLeaderboard();
        if (document.getElementById('view-member') && !document.getElementById('view-member').classList.contains('hidden')) {
            App.renderMemberDashboard();
        }
    } catch (e) { console.warn('toggleLanguage error', e); }
};

        window.onload = App.init;
