Implement a complete payment workflow system for the freelance platform with proper state handling and Razorpay integration.

Flow:
1. When client accepts a bid → status becomes "accepted"
2. On freelancer side, show "Accepted"
3. Freelancer uploads the completed project file → status becomes "completed"
4. Only after upload, client should see "Make Payment" button
5. If project is not uploaded, show message:
   "You can't make payment because project is not uploaded"

Payment:
- Integrate Razorpay payment gateway
- Support UPI (GPay, PhonePe), QR, cards
- On successful payment → update status to "released"

UI Behavior:
- Client side:
  - Accepted → waiting
  - Completed → show "Make Payment"
  - After payment → show "RELEASED"
- Freelancer side:
  - Accepted → show status
  - After upload → waiting for payment
  - After payment → allow download of project file

Restrictions:
- Client cannot delete project after payment is completed
- Freelancer can download uploaded project after payment
- Prevent multiple payments for same project

Database:
- Add fields:
  - status: pending | accepted | completed | released
  - paymentStatus: unpaid | paid
  - fileUrl: uploaded project file

Technical:
- Ensure proper API handling for:
  - accept bid
  - upload file
  - make payment
  - update status
- Handle errors properly (no UI crash)
- Update UI instantly without full page reload

Keep UI consistent with current design and ensure smooth user experience.