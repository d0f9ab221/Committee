# Security Specification & Test Matrix

## 1. Data Invariants

1. **Admin Authorization Gate**:
   - Only `kfmughal79@gmail.com` with `email_verified == true` is granted Admin privilege.
   - Client claims or self-reported roles in document bodies are NEVER trusted.
2. **Read-Only General Access**:
   - Authenticated non-admin users have read-only access to published committee content (`page/main`, `lists`, `members`).
   - Non-admin users are strictly forbidden from creating, updating, or deleting page settings, committee lists, members, payments, or notes.
3. **Visitor Privacy & Isolation**:
   - `visitorStats` and `visitorEvents` collections are strictly PRIVATE to the admin (`kfmughal79@gmail.com`).
   - Normal users CANNOT list, read, or alter visitor stats or visitor logs of other users.
4. **Secure Visitor Event Logging**:
   - Standard authenticated users can only create a single `visitorEvents` record for their own `uid` (`incoming().uid == request.auth.uid`), with server timestamp `request.time`.
   - Users cannot edit or delete recorded visit events once written.
5. **System Immutability**:
   - Timestamps and UIDs in `visitorEvents` and `visitorStats` cannot be overwritten or altered retroactively.

---

## 2. The Dirty Dozen Payloads (Security Attack Scenarios)

1. **Payload 1: Non-admin write to Page Header**
   - *Attack*: A non-admin user attempts to write or modify `page/main` title.
   - *Expected Outcome*: PERMISSION_DENIED.

2. **Payload 2: Email Spoofing without verification**
   - *Attack*: An attacker creates an account with email `kfmughal79@gmail.com` on an unverified provider (`email_verified: false`) and attempts to delete a member.
   - *Expected Outcome*: PERMISSION_DENIED (requires `email_verified == true`).

3. **Payload 3: Non-admin adding a Committee List**
   - *Attack*: Authenticated user `user123@gmail.com` posts a new document to `/lists/new-list`.
   - *Expected Outcome*: PERMISSION_DENIED.

4. **Payload 4: Non-admin updating Payment Status**
   - *Attack*: A member attempts to alter `paymentStatus` from "Pending" to "Paid" on `/members/m123`.
   - *Expected Outcome*: PERMISSION_DENIED.

5. **Payload 5: Normal user reading Visitor Analytics**
   - *Attack*: `user123@gmail.com` attempts a list query on `/visitorStats` or `/visitorEvents`.
   - *Expected Outcome*: PERMISSION_DENIED.

6. **Payload 6: Visitor Event UID Poisoning**
   - *Attack*: `user123@gmail.com` attempts to create a visit log with `uid: "admin_uid_fake"`.
   - *Expected Outcome*: PERMISSION_DENIED (incoming UID must match `request.auth.uid`).

7. **Payload 7: Client Tampering with Visitor Stats Total**
   - *Attack*: A client sends `totalVisits: 99999` directly to `/visitorStats/user123`.
   - *Expected Outcome*: PERMISSION_DENIED (only admin or trusted backend function can write/update visitorStats).

8. **Payload 8: Modifying an Existing Visit Event**
   - *Attack*: `user123@gmail.com` sends an update request to `/visitorEvents/event_001` to erase evidence.
   - *Expected Outcome*: PERMISSION_DENIED (no update allowed).

9. **Payload 9: Deleting a Committee Member as Non-Admin**
   - *Attack*: `user123@gmail.com` calls `deleteDoc(doc(db, 'members', 'm1'))`.
   - *Expected Outcome*: PERMISSION_DENIED.

10. **Payload 10: Anonymous Write Attack**
    - *Attack*: Unauthenticated user attempts to write to `/lists/l1`.
    - *Expected Outcome*: PERMISSION_DENIED.

11. **Payload 11: Oversized Junk Field Injection (Denial of Wallet)**
    - *Attack*: Admin payload contains a 2MB string in `notes`.
    - *Expected Outcome*: PERMISSION_DENIED (string size <= 500).

12. **Payload 12: Invalid Enum Injection**
    - *Attack*: Setting `paymentStatus` to `"FREE_MONEY"`.
    - *Expected Outcome*: PERMISSION_DENIED (status must be in `['Paid', 'Pending', 'Overdue']`).
