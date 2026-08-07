// =====================================================================
// app-payments.js
// App methods: openPaymentModal, onPaymentPlanChange, onPaymentMemberOrPlanChange, renderPaymentUnpaidSummary, reconcileMemberPaymentVisitStatus, savePayment, syncPaymentViews, deletePayment, renderMemberPayments, renderAllPayments
// Plain script (no ES modules). Methods attach to the global App object
// created in app-core.js. Load order is fixed in index.html.
// =====================================================================
// Tracks whether the admin has manually overridden the auto-computed
// expiration date in the payment modal. A plan/start-date change resets it.
let paymentExpManualOverride = false;

Object.assign(App, {
            openPaymentModal: (presetMemberId = null, paymentId = null) => {
                const form = document.getElementById('payment-form');
                form.reset();
                paymentExpManualOverride = false;

                // Reset quantity selector
                const qtyInput = document.getElementById('form-pay-qty');
                if (qtyInput) qtyInput.value = 1;

                // Reset member search (hidden input holds the selected member ID)
                document.getElementById('form-pay-member').value = '';
                const memberSearch = document.getElementById('form-pay-member-search');
                if (memberSearch) memberSearch.value = '';
                const memberResults = document.getElementById('form-pay-member-results');
                if (memberResults) memberResults.classList.add('hidden');

                // Populate plan dropdown with price, duration days, and session counts
                const planSelect = document.getElementById('form-pay-plan');
                planSelect.innerHTML = '<option value="">-- Custom Payment / No Plan --</option>' + DB.getPlans().map(p => `<option value="${p.id}" data-days="${p.days || ''}" data-sessions="${p.sessions || ''}" data-price="${p.price}">${Utils.escapeHTML(p.name)} - ${DB.getCurrency()}${p.price}</option>`).join('');

                if (presetMemberId) App.setPaymentMemberDisplay(presetMemberId);
                
                const today = Utils.todayLocalIso();
                document.getElementById('form-pay-date').value = today;
                document.getElementById('form-pay-start').value = today;
                document.getElementById('btn-delete-payment').classList.add('hidden');
                document.getElementById('form-pay-id').value = '';

                // Populate form fields if editing an existing payment
                if (paymentId) {
                    const pay = DB.getPayments().find(p => p.id === paymentId);
                    if (pay) {
                        document.getElementById('form-pay-id').value = pay.id;
                        App.setPaymentMemberDisplay(pay.memberId);
                        document.getElementById('form-pay-date').value = pay.date;
                        document.getElementById('form-pay-start').value = pay.appliedStartDate || pay.date;
                        document.getElementById('form-pay-amount').value = pay.amount;
                        document.getElementById('form-pay-note').value = pay.note || '';
                        if (pay.planId) {
                            planSelect.value = pay.planId;
                        }
                        if (pay.appliedExpiration) {
                            document.getElementById('form-pay-exp').value = pay.appliedExpiration;
                            paymentExpManualOverride = true;
                        }
                        document.getElementById('btn-delete-payment').classList.remove('hidden');
                    }
                }
                App.renderPaymentUnpaidSummary();
                App.openModal('modal-payment');
            },

            /**
             * Sets the selected member on the hidden field and mirrors the display text
             * into the searchable input.
             */
            setPaymentMemberDisplay: (memberId) => {
                const hiddenInput = document.getElementById('form-pay-member');
                const searchInput = document.getElementById('form-pay-member-search');
                if (hiddenInput) hiddenInput.value = memberId || '';
                if (searchInput) {
                    const m = DB.getMembers().find(x => x.id === memberId);
                    searchInput.value = m ? `${m.firstName} ${m.lastName} (${m.id})` : '';
                }
            },

            /**
             * Live filters members by name/ID as the admin types in the searchable
             * member field and shows a picker list of matches.
             */
            onPaymentMemberSearch: () => {
                const input = document.getElementById('form-pay-member-search');
                const results = document.getElementById('form-pay-member-results');
                if (!input || !results) return;
                const query = Utils.normalizeSearch(input.value);
                const members = DB.getMembers();
                let filtered = members;
                if (query) {
                    filtered = members.filter(m => {
                        const fullName = Utils.normalizeSearch(`${m.firstName || ''} ${m.lastName || ''}`);
                        return Utils.normalizeSearch(m.id || '').includes(query) ||
                            Utils.normalizeSearch(m.firstName || '').includes(query) ||
                            Utils.normalizeSearch(m.lastName || '').includes(query) ||
                            fullName.includes(query);
                    });
                }
                filtered.sort((a, b) => Utils.sortKey(a.firstName).localeCompare(Utils.sortKey(b.firstName)));
                if (filtered.length === 0) {
                    results.innerHTML = '<div class="pay-member-result text-gray" style="cursor: default;">No members found.</div>';
                } else {
                    results.innerHTML = filtered.slice(0, 30).map(m => `
                        <div class="pay-member-result" onmousedown="App.selectPaymentMember('${Utils.escapeHTML(m.id)}', event)">
                            <strong>${Utils.escapeHTML(m.firstName)} ${Utils.escapeHTML(m.lastName)}</strong>
                            <span class="text-gray" style="font-size:0.8rem; flex-shrink:0;">(${Utils.escapeHTML(m.id)})</span>
                        </div>`).join('');
                }
                results.classList.remove('hidden');
            },

            /**
             * Handles picking a member from the search results. Uses onmousedown so it
             * fires before the input's blur handler hides the picker.
             */
            selectPaymentMember: (memberId, e) => {
                if (e) e.preventDefault();
                const m = DB.getMembers().find(x => x.id === memberId);
                if (!m) return;
                App.setPaymentMemberDisplay(memberId);
                const results = document.getElementById('form-pay-member-results');
                if (results) results.classList.add('hidden');
                App.onPaymentMemberOrPlanChange();
            },

            /**
             * Event handler triggered when a user changes the selected plan in the payment modal.
             * Automatically populates the amount input and note field with the selected plan's details.
             */
            onPaymentPlanChange: () => {
                const planSelect = document.getElementById('form-pay-plan');
                const selectedOption = planSelect.options[planSelect.selectedIndex];
                const qty = parseInt(document.getElementById('form-pay-qty').value, 10) || 1;
                if (selectedOption.value) {
                    const price = parseFloat(selectedOption.getAttribute('data-price')) || 0;
                    document.getElementById('form-pay-amount').value = (price * qty).toFixed(2);
                    const planName = selectedOption.innerText.split('-')[0].trim();
                    document.getElementById('form-pay-note').value = qty > 1
                        ? `Payment for Plan: ${planName} (x${qty})`
                        : `Payment for Plan: ${planName}`;
                } else {
                    document.getElementById('form-pay-exp').value = '';
                }
                // Selecting a plan drives the auto-computed starting/expiration dates
                paymentExpManualOverride = false;
                App.computePaymentDates();
                App.renderPaymentUnpaidSummary();
            },

            /**
             * Event handler triggered when member, plan, or payment date selection changes
             * in the payment modal. Recomputes the projected starting & expiration dates.
             */
            onPaymentMemberOrPlanChange: () => {
                App.computePaymentDates();
                App.renderPaymentUnpaidSummary();
            },

            /**
             * Event handler triggered when the Starting Date changes.
             * The starting date drives the expiration date while a plan is selected.
             */
            onPaymentStartChange: () => {
                paymentExpManualOverride = false;
                App.computePaymentDates();
            },

            /**
             * Event handler triggered when the Expiration Date changes.
             * Marks the field as manually overridden so later member/payment-date
             * changes don't overwrite the admin's custom expiration.
             */
            onPaymentExpChange: () => {
                paymentExpManualOverride = true;
            },

            /**
             * Core auto-connect logic for the payment modal dates.
             *
             * HOW & WHY:
             * 1. When a plan is selected, the Starting Date defaults to the payment date —
             *    or stacks onto the member's current unexpired expiration for seamless renewals.
             * 2. The Expiration Date auto-fills as Starting Date + plan validity window.
             * 3. Admins can override either date with custom values; a manual expiration is
             *    preserved until the plan or starting date changes again.
             */
            computePaymentDates: () => {
                const planSelect = document.getElementById('form-pay-plan');
                const selectedOption = planSelect.options[planSelect.selectedIndex];
                const mId = document.getElementById('form-pay-member').value;
                const payDate = document.getElementById('form-pay-date').value;
                const startInput = document.getElementById('form-pay-start');
                const expInput = document.getElementById('form-pay-exp');

                if (!selectedOption || !selectedOption.value) return;

                const days = selectedOption.getAttribute('data-days');
                const qty = parseInt(document.getElementById('form-pay-qty').value, 10) || 1;
                const member = DB.getMembers().find(m => m.id === mId);

                // Starting date: keep the admin's value, otherwise default to the payment
                // date — stacking onto an active unexpired membership when it ends later.
                let startVal = startInput.value || payDate;
                if (!startInput.value && member && member.expirationDate && Utils.getDaysRemaining(member.expirationDate) >= 0) {
                    const curExp = new Date(member.expirationDate);
                    const payDateObj = new Date(payDate);
                    if (curExp > payDateObj) {
                        startVal = member.expirationDate;
                    }
                }
                startInput.value = startVal;

                // Expiration date: auto-connect from starting date + plan duration,
                // unless the admin manually overrode the expiration. The quantity
                // selector lets the same membership be purchased multiple times, so
                // the validity window is multiplied accordingly.
                if (days && !paymentExpManualOverride) {
                    expInput.value = Utils.calculateExpirationDate(startVal, parseInt(days, 10) * qty);
                }
            },
 
            /**
             * Renders an informational summary inside the payment modal showing any outstanding unpaid trainings for the selected member.
             */
            renderPaymentUnpaidSummary: () => {
                const memberId = document.getElementById('form-pay-member').value;
                const container = document.getElementById('payment-unpaid-info');
                const countEl = document.getElementById('payment-unpaid-count');
                const listEl = document.getElementById('payment-unpaid-list');
                if (!memberId || !container || !countEl || !listEl) return;
                const unpaidVisits = DB.getVisits().filter(v => v.memberId === memberId && v.isUnpaid).sort((a,b) => new Date(b.entryTime) - new Date(a.entryTime));
                if (unpaidVisits.length === 0) {
                    container.classList.add('hidden');
                    return;
                }
                container.classList.remove('hidden');
                countEl.innerHTML = `This member has <strong>${unpaidVisits.length}</strong> unpaid training${unpaidVisits.length === 1 ? '' : 's'} on record.`;
                listEl.innerHTML = `<ul style="margin:0; padding-left:18px;">` + unpaidVisits.map(v => `<li>${Utils.formatDate(v.entryTime)} ${Utils.formatTime(v.entryTime)}</li>`).join('') + `</ul>`;
            },
 
            /**
             * CORE SINGLE SOURCE OF TRUTH RECONCILIATION ENGINE
             * Re-evaluates every visit for a specific member against all remaining valid payments in DB.
             * 
             * HOW IT WORKS:
             * 1. Collects all explicitly cleared visit IDs stored in remaining payment records.
             * 2. Collects all date range expiration windows granted by remaining time-based payments.
             * 3. Calculates total session quota granted by remaining session-based payments.
             * 4. Iterates through all member visits chronologically (oldest first):
             *    - Marks visit as PAID if explicitly cleared by a payment log.
             *    - Marks visit as PAID if entry timestamp falls within a paid date window.
             *    - Marks visit as PAID if covered by available session quota.
             *    - Marks visit as UNPAID if no remaining valid payment or plan covers it.
             * 
             * WHY IT BEHAVES THIS WAY:
             * When payments are added, modified, or deleted (e.g. deleting an 8-session plan payment),
             * visits must not remain hardcoded as paid. This single source of truth engine ensures
             * that deleting a payment automatically updates all affected visits to UNPAID across
             * Payment Ledger, Visit History, Analytical Calendar, and Member History views.
             */
            // Returns the Date of the member's FIRST UNPAID DAY: the first visit (chronologically)
            // that is not covered by explicit clearance, a payment's date window, or drop-in session
            // quota. The membership window starts here, so visits already paid by sessions are never
            // re-tagged as membership dates (and their sessions are not refunded). Returns null when
            // every visit is covered by other means.
            computeMemberFirstUnpaidDay: (member, payments, visits) => {
                const explicitIds = new Set();
                payments.forEach(p => {
                    if (Array.isArray(p.clearedVisitIds)) {
                        // Mirror the reconciliation rule: session-granting payments never
                        // clear visits explicitly.
                        const grantsSessions = p.sessionsGranted && parseInt(p.sessionsGranted, 10) > 0;
                        if (grantsSessions) return;
                        p.clearedVisitIds.forEach(id => explicitIds.add(id));
                    }
                });
                const timeWindows = [];
                payments.forEach(p => {
                    if (p.appliedExpiration) {
                        // Mirror the reconciliation rule: session-granting payments are
                        // quota-based and never create time-coverage windows.
                        const grantsSessions = p.sessionsGranted && parseInt(p.sessionsGranted, 10) > 0;
                        if (grantsSessions) return;
                        const start = new Date(p.appliedStartDate || p.date);
                        const end = new Date(p.appliedExpiration);
                        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) timeWindows.push({ start, end });
                    }
                });
                const capacity = payments.reduce((s, p) => {
                    return s + (p.sessionsGranted && parseInt(p.sessionsGranted, 10) > 0 ? parseInt(p.sessionsGranted, 10) : 0);
                }, 0);
                const fallbackLimit = member && member.sessionsTotal ? (parseInt(member.sessionsLeft, 10) || 0) : 0;
                let used = 0;
                const sorted = [...visits].sort((a, b) => new Date(a.entryTime) - new Date(b.entryTime));
                for (const v of sorted) {
                    const entry = v.entryTime ? new Date(v.entryTime) : null;
                    if (!entry || isNaN(entry.getTime())) continue;
                    if (explicitIds.has(v.id)) continue;
                    if (timeWindows.some(w => entry >= w.start && entry <= w.end)) continue;
                    const limit = capacity > 0 ? capacity : fallbackLimit;
                    if (used < limit) { used++; continue; }
                    return entry;
                }
                return null;
            },

            reconcileMemberPaymentVisitStatus: (memberId, deletedPayment = null) => {
                if (!memberId) return;
                const payments = DB.getPayments().filter(p => p.memberId === memberId);
                const visits = DB.getVisits();
                const memberVisits = visits.filter(v => v.memberId === memberId).sort((a,b) => new Date(a.entryTime) - new Date(b.entryTime));
                const members = DB.getMembers();
                const member = members.find(m => m.id === memberId);

                // Step 1: Gather explicitly cleared visit IDs from remaining active payments.
                // Legacy-data heal: clearedVisitIds recorded on SESSION-GRANTING payments are
                // ignored — older versions cleared unpaid visits there without consuming the
                // purchased sessions. Those visits must be re-evaluated against the session
                // quota (and the balance recomputed) so the errors self-heal. Time-based and
                // generic debt payments keep their explicit clearance.
                const explicitPaidVisitIds = new Set();
                payments.forEach(payment => {
                    if (Array.isArray(payment.clearedVisitIds)) {
                        const grantsSessions = payment.sessionsGranted && parseInt(payment.sessionsGranted, 10) > 0;
                        if (grantsSessions) return;
                        payment.clearedVisitIds.forEach(id => explicitPaidVisitIds.add(id));
                    }
                });

                // Step 2: Gather date coverage windows from remaining active payments.
                // A payment's own window starts at its appliedStartDate (or payment date) —
                // never at the epoch — so it can't retroactively cover visits that predate it.
                // Session-granting payments are quota-based and must NOT create windows: their
                // validity days would time-cover outstanding unpaid check-ins (e.g. a window
                // anchored to the first unpaid day) and pay off the debt WITHOUT consuming the
                // purchased sessions (an 8-session membership must consume its quota, leaving
                // 8 - debt instead of 8 with the debt marked paid).
                const timeWindows = [];
                payments.forEach(payment => {
                    if (payment.appliedExpiration) {
                        const grantsSessions = payment.sessionsGranted && parseInt(payment.sessionsGranted, 10) > 0;
                        if (grantsSessions) return;
                        const startStr = payment.appliedStartDate || payment.date;
                        if (!startStr) return;
                        const start = new Date(startStr);
                        const end = new Date(payment.appliedExpiration);
                        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                            timeWindows.push({ start, end });
                        }
                    }
                });
                // Member membership window: the active membership covers visits from the FIRST
                // UNPAID DAY (the first visit not covered by explicit clearing, a payment window,
                // or drop-in session quota) up to the expiration date. It must NOT start at the
                // epoch: visits already paid by drop-in sessions were purchased separately and
                // must not be re-tagged as membership dates (that refunded consumed sessions).
                const isTimeCoveredMember = member && (!member.sessionsTotal || member.planDays != null);
                const memberExpires = (member && member.expirationDate) ? new Date(member.expirationDate) : null;
                const memberWindowActive = isTimeCoveredMember && memberExpires
                    && !isNaN(memberExpires.getTime()) && Utils.getDaysRemaining(member.expirationDate) >= 0;
                let memberWindowStart = null;
                if (memberWindowActive) {
                    memberWindowStart = App.computeMemberFirstUnpaidDay(member, payments, memberVisits);
                }

                // Step 3: Calculate total session quota granted by remaining active payments
                let totalSessionsCapacity = 0;
                payments.forEach(payment => {
                    if (payment.sessionsGranted && parseInt(payment.sessionsGranted, 10) > 0) {
                        totalSessionsCapacity += parseInt(payment.sessionsGranted, 10);
                    }
                });

                // Step 4: Re-evaluate visit statuses chronologically
                let sessionsUsed = 0;
                let changed = false;

                memberVisits.forEach(v => {
                    const entry = v.entryTime ? new Date(v.entryTime) : null;
                    let isPaidByExplicit = explicitPaidVisitIds.has(v.id);
                    let isPaidByTime = false;

                    if (!isPaidByExplicit && entry) {
                        isPaidByTime = timeWindows.some(w => entry >= w.start && entry <= w.end);
                    }

                    let shouldBePaid = false;
                    if (isPaidByExplicit || isPaidByTime) {
                        shouldBePaid = true;
                    } else if (totalSessionsCapacity > 0) {
                        // Covered by session quota from valid payments
                        if (sessionsUsed < totalSessionsCapacity) {
                            shouldBePaid = true;
                            sessionsUsed++;
                        } else {
                            shouldBePaid = false;
                        }
                    } else if (member && member.sessionsTotal && (parseInt(member.sessionsLeft, 10) || 0) > 0) {
                        // Fallback for initial member sessions without payment logs
                        if (sessionsUsed < (parseInt(member.sessionsLeft, 10) || 0)) {
                            shouldBePaid = true;
                            sessionsUsed++;
                        } else {
                            shouldBePaid = false;
                        }
                    } else {
                        shouldBePaid = false;
                    }

                    // Membership window: once the first unpaid day is reached, every following
                    // visit up to the expiration date is covered by the membership — without
                    // consuming any session quota (those visits were never session-covered).
                    if (!shouldBePaid && memberWindowStart && entry && !isNaN(entry.getTime())
                        && entry >= memberWindowStart && entry <= memberExpires) {
                        shouldBePaid = true;
                    }

                    // Mutate isUnpaid flag only if status changed
                    if (v.isUnpaid && shouldBePaid) {
                        v.isUnpaid = false;
                        changed = true;
                    } else if (!v.isUnpaid && !shouldBePaid) {
                        v.isUnpaid = true;
                        changed = true;
                    }
                });

                // Keep the member's session balance in sync with the reconciled state:
                // sessionsLeft = total session quota granted by remaining payments minus the
                // sessions already consumed by visits covered through that quota. This ensures
                // that when a session bundle is added after one or more unpaid check-ins, the
                // sessions consumed by those (now-paid) visits are subtracted immediately
                // (e.g. an 8-session bundle added after 1 unpaid training leaves 7 sessions).
                let memberSessionChanged = false;
                if (member && totalSessionsCapacity > 0) {
                    const recomputedLeft = Math.max(0, totalSessionsCapacity - sessionsUsed);
                    if (member.sessionsTotal !== true || (parseInt(member.sessionsLeft, 10) || 0) !== recomputedLeft) {
                        member.sessionsTotal = true;
                        member.sessionsLeft = recomputedLeft;
                        memberSessionChanged = true;
                    }
                }

                // Legacy-data heal: planDays was never written by older builds, so derive it
                // from the latest time-based-only payment (appliedExpiration without sessions).
                // This makes mixed legacy members (sessions + monthly) behave correctly: their
                // banked sessions are no longer consumed during the active membership period.
                let memberHealed = false;
                if (member && member.planDays == null) {
                    const timePays = payments
                        .filter(p => p.appliedExpiration && !(p.sessionsGranted && parseInt(p.sessionsGranted, 10) > 0))
                        .sort((a, b) => new Date(b.date) - new Date(a.date));
                    const latestTimePay = timePays[0];
                    if (latestTimePay) {
                        const tp = latestTimePay.planId ? DB.getPlans().find(pl => pl.id === latestTimePay.planId) : null;
                        let days = null;
                        if (tp && tp.days != null && tp.days !== '') days = parseInt(tp.days, 10);
                        if (days == null) {
                            const s = new Date(latestTimePay.appliedStartDate || latestTimePay.date);
                            const e = new Date(latestTimePay.appliedExpiration);
                            if (!isNaN(s.getTime()) && !isNaN(e.getTime())) days = Math.max(1, Math.round((e - s) / 86400000));
                        }
                        if (days != null) {
                            member.planDays = days;
                            memberHealed = true;
                        }
                    }
                }

                // Legacy-data heal: members wrongly left Active with zero usable coverage
                // (activated by a generic payment, or by a session bundle consumed by debt)
                // converge back to Inactive whenever reconciliation runs.
                if (member && member.accountStatus === 'Active') {
                    const hasUsableCoverage = (member.sessionsTotal && (parseInt(member.sessionsLeft, 10) || 0) > 0)
                        || (member.expirationDate && Utils.getDaysRemaining(member.expirationDate) >= 0);
                    if (!hasUsableCoverage) {
                        member.accountStatus = 'Inactive';
                        memberHealed = true;
                    }
                }

                if (changed) DB.saveVisits(visits);
                if (memberSessionChanged || memberHealed) DB.saveMembers(members);
            },

            /**
             * Handles saving a payment record from the payment modal form.
             * 
             * HOW & WHY:
             * 1. Constructs or updates payment object with amount, date, note, planId, sessionsGranted, and clearedVisitIds.
             * 2. Updates member session balance (`sessionsLeft`) if payment includes a session plan.
             * 3. Updates member expiration date if payment includes a duration plan.
             * 4. Auto-activates account if positive payment is logged.
             * 5. Triggers visit reconciliation (`reconcileMemberPaymentVisitStatus`) and updates all UI views (`syncPaymentViews`).
             */
            savePayment: (e) => {
                e.preventDefault();
                const pays = DB.getPayments();
                const id = document.getElementById('form-pay-id').value || 'PAY-' + Date.now();
                const isNew = !document.getElementById('form-pay-id').value;
                const memberId = document.getElementById('form-pay-member').value;
                if (!memberId) return alert('Please search and select a member.');
                const newExp = document.getElementById('form-pay-exp').value;
                const planSelect = document.getElementById('form-pay-plan');
                const selectedOption = planSelect ? planSelect.options[planSelect.selectedIndex] : null;
                const planId = selectedOption && selectedOption.value ? selectedOption.value : null;

                const members = DB.getMembers();
                const m = members.find(x => x.id === memberId);
                const prevExp = m ? (m.expirationDate || '') : '';
                const originalPayment = !isNew ? pays.find(p => p.id === id) : null;

                // Extract session count from plan definition if applicable
                // (multiplied by the quantity selector for multiple memberships)
                let sessionsGranted = null;
                if (planId) {
                    const plan = DB.getPlans().find(p => p.id === planId);
                    const qty = parseInt(document.getElementById('form-pay-qty').value, 10) || 1;
                    if (plan && plan.sessions != null && plan.sessions !== '') {
                        sessionsGranted = (parseInt(plan.sessions, 10) || 0) * qty;
                    } else if (selectedOption && selectedOption.getAttribute('data-sessions')) {
                        sessionsGranted = (parseInt(selectedOption.getAttribute('data-sessions'), 10) || 0) * qty;
                    }
                }

                // Capture outstanding unpaid visit IDs at the moment of payment creation
                // Only clear visits covered by the plan's validity window (or all past if it's a generic debt payment)
                let clearedVisitIds = [];
                if (originalPayment && Array.isArray(originalPayment.clearedVisitIds) && originalPayment.memberId === memberId) {
                    clearedVisitIds = Array.from(new Set(originalPayment.clearedVisitIds));
                } else if (!planId) {
                    clearedVisitIds = DB.getVisits().filter(v => v.memberId === memberId && v.isUnpaid).map(v => v.id);
                } else if (sessionsGranted != null && sessionsGranted > 0) {
                    // Session bundles: do NOT explicitly clear unpaid visits here. The
                    // reconciliation engine covers them chronologically with the session quota,
                    // so the purchased sessions are actually CONSUMED by the outstanding debt
                    // (e.g. a 1-session bundle after 2 unpaid check-ins pays for one visit and
                    // leaves 0 sessions) instead of clearing the visits for free and leaving
                    // the member with a full balance + Active status.
                    clearedVisitIds = [];
                } else {
                    const formPayStart = document.getElementById('form-pay-start').value || document.getElementById('form-pay-date').value;
                    const formPayExp = document.getElementById('form-pay-exp').value;
                    clearedVisitIds = DB.getVisits().filter(v => {
                        if (v.memberId !== memberId || !v.isUnpaid) return false;
                        let coversVisit = true;
                        if (formPayStart) {
                            const visitDateObj = new Date(v.entryTime);
                            const visitYMD = visitDateObj.getFullYear() + '-' + String(visitDateObj.getMonth()+1).padStart(2,'0') + '-' + String(visitDateObj.getDate()).padStart(2,'0');
                            if (visitYMD < formPayStart) coversVisit = false;
                            if (formPayExp && visitYMD > formPayExp) coversVisit = false;
                        }
                        return coversVisit;
                    }).map(v => v.id);
                }

                // For session-granting payments (e.g. a drop-in bundle), anchor the bundle's
                // starting day to the member's first unpaid training: the newly granted sessions
                // are consumed starting from that date, so the recorded start must match it.
                let bundleStartIso = null;
                if (sessionsGranted != null && sessionsGranted > 0) {
                    const unpaidVisits = DB.getVisits().filter(v => v.memberId === memberId && v.isUnpaid);
                    let earliestMs = Infinity;
                    unpaidVisits.forEach(v => {
                        const t = v.entryTime ? new Date(v.entryTime).getTime() : NaN;
                        if (!isNaN(t) && t < earliestMs) earliestMs = t;
                    });
                    if (isFinite(earliestMs)) {
                        const d = new Date(earliestMs);
                        bundleStartIso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                    }
                }

                const newPay = {
                    id,
                    memberId,
                    date: document.getElementById('form-pay-date').value,
                    amount: parseFloat(document.getElementById('form-pay-amount').value),
                    note: document.getElementById('form-pay-note').value,
                    planId: planId || (originalPayment ? originalPayment.planId : null),
                    sessionsGranted: sessionsGranted !== null ? sessionsGranted : (originalPayment ? originalPayment.sessionsGranted : null),
                    appliedExpiration: newExp || null,
                    appliedStartDate: bundleStartIso || document.getElementById('form-pay-start').value || document.getElementById('form-pay-date').value,
                    prevExpiration: prevExp || null,
                    clearedVisitIds
                };

                if (isNew) pays.push(newPay);
                else {
                    const idx = pays.findIndex(p => p.id === id);
                    if (idx > -1) pays[idx] = newPay;
                }
                DB.savePayments(pays);

                // Apply session plan updates to member profile
                if (m && sessionsGranted != null && sessionsGranted > 0) {
                    m.sessionsTotal = true;
                    const oldSessionsGranted = (originalPayment && originalPayment.sessionsGranted) ? parseInt(originalPayment.sessionsGranted, 10) : 0;
                    const netChange = isNew ? sessionsGranted : (sessionsGranted - oldSessionsGranted);
                    m.sessionsLeft = Math.max(0, (parseInt(m.sessionsLeft, 10) || 0) + netChange);
                    DB.saveMembers(members);
                }

                // Track the active plan type on the member. A pure time-based plan (validity days,
                // no sessions) marks an unlimited membership — its active period must not consume
                // leftover session bundles. Any session-granting plan resets planDays to null so
                // the member is treated as session-based.
                if (m && planId) {
                    const plan = DB.getPlans().find(p => p.id === planId);
                    const isTimeBasedPlan = !!(plan && plan.days != null && plan.days !== ''
                        && !(plan.sessions != null && plan.sessions !== ''));
                    const newPlanDays = isTimeBasedPlan ? (parseInt(plan.days, 10) || 0) * qty : null;
                    if ((m.planDays != null ? m.planDays : null) !== newPlanDays) {
                        m.planDays = newPlanDays;
                        DB.saveMembers(members);
                    }
                }

                // Apply expiration plan updates to member profile
                if (newExp && m) {
                    m.expirationDate = newExp;
                    DB.saveMembers(members);
                    if (!document.getElementById('modal-member').classList.contains('hidden') && document.getElementById('form-member-id').value === memberId) {
                        document.getElementById('form-expiration').value = newExp;
                    }
                }

                // Reconcile visit payment status after saving this payment
                if (originalPayment && originalPayment.memberId && originalPayment.memberId !== memberId) {
                    App.reconcileMemberPaymentVisitStatus(originalPayment.memberId);
                }
                App.reconcileMemberPaymentVisitStatus(memberId);

                // Auto-activate member on positive payment amount — only when the member has
                // USABLE coverage left AFTER reconciliation. If the purchased sessions were
                // immediately consumed by outstanding unpaid check-ins (e.g. a 1-session bundle
                // after 2 unpaid visits), the member ends with 0 sessions and must NOT be
                // activated. A generic custom payment with no plan must not activate either.
                if (m && m.accountStatus !== 'Active' && newPay.amount && parseFloat(newPay.amount) > 0) {
                    const hasUsableCoverage = (m.sessionsTotal && (parseInt(m.sessionsLeft, 10) || 0) > 0)
                        || (m.expirationDate && Utils.getDaysRemaining(m.expirationDate) >= 0);
                    if (hasUsableCoverage) {
                        m.accountStatus = 'Active';
                        DB.saveMembers(members);
                        App.addNotification('Member Activated', `${m.firstName} ${m.lastName} was activated by recorded payment.`, 'success', m.id);
                    }
                }

                App.closeModal('modal-payment');
                App.syncPaymentViews(memberId);
            },

            /**
             * Synchronizes and re-renders all UI views that display payment & visit information.
             * 
             * WHY IT BEHAVES THIS WAY:
             * Prevents UI state desynchronization across tabs. Re-renders:
             * 1. Payment Ledger (renderAllPayments)
             * 2. Visit History Log (renderVisitLog)
             * 3. Check-in Analytical Calendar (renderAnalyticalCalendar)
             * 4. Member Check-in History (renderMemberHistory)
             */
            syncPaymentViews: (memberId) => {
                App.renderLivePresent();
                App.renderKioskLeaderboard();
                App.renderAllPayments();
                App.renderVisitLog();
                App.renderAnalyticalCalendar();

                if (memberId) {
                    const historyContainer = document.getElementById('dashboard-history-container');
                    if (historyContainer && historyContainer.dataset.memberId === memberId) {
                        App.renderMemberHistory(memberId, 'dashboard-history-container');
                    }

                    const memberModalOpen = !document.getElementById('modal-member').classList.contains('hidden');
                    if (memberModalOpen) {
                        App.renderMemberPayments(memberId);
                        App.renderMemberHistory(memberId, 'admin-member-personal-history');

                        // Refresh form fields in the member modal to reflect updated member data
                        // (expiration date, account status, sessions — may have changed after payment deletion)
                        const updatedMember = DB.getMembers().find(m => m.id === memberId);
                        if (updatedMember && document.getElementById('form-member-id').value === memberId) {
                            const expInput = document.getElementById('form-expiration');
                            expInput.value = updatedMember.expirationDate || '';
                            expInput.style.backgroundColor = updatedMember.expirationDate
                                ? (Utils.getDaysRemaining(updatedMember.expirationDate) < 0 ? '#fee2e2' : '#dcfce7')
                                : '#fff';

                            document.getElementById('form-account-status').value = updatedMember.accountStatus || 'Inactive';

                            const sessWrap = document.getElementById('member-sessions-wrapper');
                            if (updatedMember.sessionsTotal) {
                                sessWrap.style.display = 'flex';
                                document.getElementById('form-sessions-left').value = updatedMember.sessionsLeft != null ? updatedMember.sessionsLeft : '';
                            } else {
                                sessWrap.style.display = 'none';
                                document.getElementById('form-sessions-left').value = '';
                            }

                            // Refresh unpaid warning banner
                            const unpaidVisits = DB.getVisits().filter(v => v.memberId === memberId && v.isUnpaid)
                                .sort((a,b) => new Date(b.entryTime) - new Date(a.entryTime));
                            const warnDiv = document.getElementById('member-unpaid-warning');
                            const unpaidAnalyticEl = document.getElementById('member-unpaid-analytic');
                            if (unpaidVisits.length > 0) {
                                warnDiv.innerHTML = `<div class="kiosk-msg danger mt-1">This member has ${unpaidVisits.length} unpaid trainings on record!</div>`;
                                unpaidAnalyticEl.innerHTML = `<strong>Unpaid Training Dates:</strong><ul style="margin-top:6px; padding-left:18px;">` + unpaidVisits.map(v => `<li>${Utils.formatDate(v.entryTime)} ${Utils.formatTime(v.entryTime)}</li>`).join('') + `</ul>`;
                                document.getElementById('btn-clear-member-debt').classList.remove('hidden');
                            } else {
                                warnDiv.innerHTML = '';
                                unpaidAnalyticEl.innerHTML = '';
                                document.getElementById('btn-clear-member-debt').classList.add('hidden');
                            }
                        }
                    }
                }
            },

            /**
             * Handles deleting a payment record from the Payment Ledger.
             *
             * HOW & WHY:
             * 1. Removes payment object from DB.getPayments().
             * 2. Recomputes sessionsLeft/sessionsTotal from remaining session payments.
             *    If no remaining payments grant sessions, clears sessionsTotal & sessionsLeft entirely.
             * 3. Recomputes expirationDate from the latest appliedExpiration in remaining payments.
             *    If no remaining payments set an expiration, clears the member's expirationDate.
             * 4. Sets accountStatus to Inactive if no remaining payments cover the member.
             * 5. Invokes reconcileMemberPaymentVisitStatus so visits that were covered by this
             *    payment are correctly re-evaluated (marked unpaid when no other coverage exists).
             * 6. Invokes syncPaymentViews to immediately update all 4 system views.
             */
            deletePayment: () => {
                if (!confirm('Permanently delete this payment record?')) return;
                const id = document.getElementById('form-pay-id').value;
                const pays = DB.getPayments();
                const toDelete = pays.find(p => p.id === id);
                if (!toDelete) return;

                // Remove payment record from database
                const remainingPays = pays.filter(p => p.id !== id);
                DB.savePayments(remainingPays);

                const members = DB.getMembers();
                const mIdx = members.findIndex(x => x.id === toDelete.memberId);

                if (mIdx > -1) {
                    const memberPays = remainingPays.filter(p => p.memberId === toDelete.memberId);

                    // --- Sessions: recompute from remaining session-granting payments ---
                    const totalRemainingSessionsGranted = memberPays.reduce((sum, p) => {
                        return sum + (p.sessionsGranted && parseInt(p.sessionsGranted, 10) > 0 ? parseInt(p.sessionsGranted, 10) : 0);
                    }, 0);

                    if (totalRemainingSessionsGranted > 0) {
                        // Keep sessionsTotal; recalculate sessionsLeft by subtracting sessions already used
                        const usedSessions = DB.getVisits().filter(v => v.memberId === toDelete.memberId && !v.isUnpaid).length;
                        members[mIdx].sessionsTotal = true;
                        members[mIdx].sessionsLeft = Math.max(0, totalRemainingSessionsGranted - usedSessions);
                    } else if (members[mIdx].sessionsTotal) {
                        // Deleted payment was the only session source — clear sessions entirely
                        members[mIdx].sessionsTotal = false;
                        members[mIdx].sessionsLeft = null;
                    }

                    // --- Expiration: recompute from the latest appliedExpiration in remaining payments ---
                    const expDates = memberPays
                        .filter(p => p.appliedExpiration)
                        .map(p => p.appliedExpiration)
                        .sort();
                    if (expDates.length > 0) {
                        members[mIdx].expirationDate = expDates[expDates.length - 1];
                    } else if (toDelete.appliedExpiration) {
                        // Deleted payment was the only one that set an expiration — clear it
                        members[mIdx].expirationDate = '';
                    }

                    // --- planDays: recompute from the remaining time-based (unlimited) payments ---
                    const timePayments = memberPays
                        .filter(p => p.planId && p.appliedExpiration)
                        .sort((a, b) => new Date(b.date) - new Date(a.date));
                    const latestTimePayment = timePayments[0];
                    const timePlan = latestTimePayment ? DB.getPlans().find(pl => pl.id === latestTimePayment.planId) : null;
                    const isTimeBasedPlan = !!(timePlan && timePlan.days != null && timePlan.days !== ''
                        && !(timePlan.sessions != null && timePlan.sessions !== ''));
                    members[mIdx].planDays = isTimeBasedPlan ? (parseInt(timePlan.days, 10) || 0) : null;

                    // --- Account Status: set Inactive if no remaining payments cover this member ---
                    const hasRemainingCoverage = memberPays.length > 0 && (
                        totalRemainingSessionsGranted > 0 ||
                        expDates.some(d => Utils.getDaysRemaining(d) >= 0)
                    );
                    if (!hasRemainingCoverage) {
                        members[mIdx].accountStatus = 'Inactive';
                    }

                    DB.saveMembers(members);
                }

                // Reconcile visit payment status based on remaining active payments
                if (toDelete.memberId) {
                    App.reconcileMemberPaymentVisitStatus(toDelete.memberId, toDelete);
                }

                App.closeModal('modal-payment');
                App.syncPaymentViews(toDelete.memberId);
            },

            renderMemberPayments: (memberId) => {
                const pays = DB.getPayments().filter(p => p.memberId === memberId).sort((a,b) => new Date(b.date) - new Date(a.date));
                const list = document.getElementById('member-payments-list');
                list.innerHTML = pays.map(p => `
                    <tr>
                        <td data-label="Date">${Utils.formatDate(p.date)}</td>
                        <td data-label="Amount">${DB.getCurrency()}${parseFloat(p.amount).toFixed(2)}</td>
                        <td data-label="Note">${Utils.escapeHTML(p.note || '')}</td>
                        <td data-label="Action" class="cell-actions"><button class="btn-outline btn-small" onclick="App.openPaymentModal(null, '${p.id}')">Edit</button></td>
                    </tr>
                `).join('') || '<tr><td colspan="4" class="text-center text-gray">No payment history found.</td></tr>';
            },

            renderAllPayments: () => {
                const pays = DB.getPayments().sort((a,b) => new Date(b.date) - new Date(a.date));
                const members = DB.getMembers();
                const list = document.getElementById('all-payments-list');
                
                list.innerHTML = pays.map(p => {
                    const m = members.find(x => x.id === p.memberId);
                    const mName = m ? `${Utils.escapeHTML(m.firstName)} ${Utils.escapeHTML(m.lastName)}` : 'Unknown Member';
                    return `<tr>
                        <td data-label="Date">${Utils.formatDate(p.date)}</td>
                        <td data-label="Member Name"><strong>${mName}</strong></td>
                        <td data-label="Amount">${DB.getCurrency()}${parseFloat(p.amount).toFixed(2)}</td>
                        <td data-label="New Exp. Date">${m ? Utils.formatDate(m.expirationDate) : 'N/A'}</td>
                        <td data-label="Note" style="max-width: 200px; white-space: normal;">${Utils.escapeHTML(p.note || '')}</td>
                        <td data-label="Action" class="cell-actions"><button class="btn-outline btn-small" onclick="App.openPaymentModal(null, '${p.id}')">Edit</button></td>
                    </tr>`;
                }).join('') || '<tr><td colspan="6" class="text-center text-gray">No payments recorded.</td></tr>';
            },

});
