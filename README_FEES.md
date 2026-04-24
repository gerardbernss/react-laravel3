# Enrollment Fee Assessment — How It Works

This guide explains how fees are set up, calculated, discounted, and collected during student enrollment. It is written for school administrators, registrars, and cashiers — no technical background needed.

---

## Overview

Collecting enrollment fees happens in five steps:

1. **Admin sets up fee types and rates** — what fees exist and how much each costs per grade level and semester.
2. **Student submits enrollment** — the system automatically calculates the fees that apply to that student and produces a billing summary called an **assessment**.
3. **Admin may apply discounts** — qualifying discounts are attached to the assessment, reducing the total amount owed.
4. **Cashier records payments** — each payment is logged against the assessment.
5. **Enrollment becomes Active** — once the student pays at least the minimum required amount, their enrollment is confirmed.

---

## Step 1 — Setting Up Fees (Admin)

Before any student can enroll, the admin must configure two things: **fee types** and **fee rates**.

### Fee Types

A fee type is a named category of charge — for example, *Tuition Fee*, *Library Fee*, *Computer Lab Fee*, or *Registration Fee*. Each fee type has a few important settings:

- **Category** — groups the fee into one of four buckets: *Tuition*, *Miscellaneous*, *Laboratory*, or *Special*. These buckets are used to build the billing summary.
- **Charged per unit or as a flat fee?** — If a fee is charged per unit (like Tuition), the system will multiply the rate by the number of units the student is enrolled in. If it is a flat fee (like Registration), every student pays the same fixed amount regardless of their load.
- **Required or optional?** — Required fees are automatically included for all students who qualify. Optional fees are only added if specifically selected.
- **Who does it apply to?** — A fee type can be set to apply to *everyone*, or only to a specific group: Elementary students (Grades 1–6), Junior High students (Grades 7–10), or Senior High students (Grades 11–12).

Fee types are managed at: **Admin → Fee Types**

### Fee Rates

A fee rate is the actual peso amount for a specific fee type in a specific context. One fee type can have different rates depending on:

- The **school year** (e.g., 2025–2026)
- The **semester** (1st Semester, 2nd Semester, Summer, or Yearly)
- The **grade level group** (Elementary, Junior High, Senior High, or All)

The system always picks the most specific rate available. If a rate exists for a specific grade level, it takes priority over a general "all grades" rate.

**Sample rates for 2025–2026:**

| Fee | Who It Applies To | Amount |
|-----|-------------------|--------|
| Tuition Fee | Grades 1–6 | ₱800 per unit |
| Tuition Fee | Grades 7–10 | ₱1,000 per unit |
| Tuition Fee | Grades 11–12 | ₱1,200 per unit |
| Registration Fee | All students | ₱500–₱700 |
| Computer Lab Fee | Grades 11–12 only | ₱1,200–₱1,500 |
| Energy Fee | All students | ₱300 |

Rates are managed at: **Admin → Fee Rates**. Rates from a previous school year can be copied as a starting point for the new year.

---

## Step 2 — When a Student Enrolls

When a student submits their enrollment through the portal, the system does the following automatically:

1. **Finds the applicable fees** — it looks at the student's grade level and the current school year, then selects all required fee types that apply to that student.
2. **Calculates each fee amount:**
   - For per-unit fees (like Tuition): *rate × maximum enrolled units*
   - For flat fees (like Registration): the fixed rate amount
3. **Builds a billing summary** by grouping fees:
   - Tuition total
   - Miscellaneous fees total
   - Laboratory fees total
   - Other/special fees total
   - **Grand total** (the sum of all four groups, before any discounts)
4. **Determines the minimum payment** the student must make:
   - If paying in full: the minimum is 100% of the amount owed
   - If paying in installments: the minimum is 30% of the amount owed
5. **Creates the assessment** — a formal billing record tied to that student for that semester, with an initial status of *Finalized*.
6. **Sets the student's enrollment status to Pending** until payment is confirmed.

---

## Step 3 — Discounts

Discounts reduce the total amount a student owes. They are attached to the student's assessment.

### How Discounts Work

Each discount type has:

- **Type** — either a *percentage* (e.g., 20% off) or a *fixed amount* (e.g., ₱2,000 off)
- **What it applies to** — either *tuition fees only*, *miscellaneous fees only*, or *all fees combined*
- **Stackable or not** — stackable discounts can be combined with other discounts. Non-stackable discounts are mutually exclusive — the student can only use one of them.
- **Requires verification?** — Some discounts (like the Sibling Discount) require an admin to review and approve them before they are subtracted from the total. Discounts waiting for verification are stored on the account but **do not reduce the balance yet**.
- **Maximum cap** — some discounts have an upper limit on how much they can reduce the amount, regardless of the calculated percentage.

Once a discount is verified (or if it does not require verification), it is subtracted from the grand total to arrive at the **net amount owed**.

### Available Discount Types

| Discount | How It Works | Applies To | Can Stack? | Needs Approval? |
|----------|-------------|------------|------------|-----------------|
| Sibling Discount | 20% off | Tuition only | No | Yes |
| Academic Scholar — Full | 100% off | Tuition only | No | No |
| Academic Scholar — Half | 50% off | Tuition only | No | No |
| Academic Scholar — Partial | 25% off | Tuition only | No | No |
| Early Bird | 5% off | All fees | Yes | No |
| Employee Dependent | 50% off | Tuition only | No | Yes |
| PWD Discount | 20% off | All fees | Yes | Yes |
| Senior Citizen Dependent | 15% off | Tuition only | Yes | No |
| Loyalty Discount | ₱2,000 off | All fees | Yes | Yes |
| Cash Payment Discount | 3% off | All fees | Yes | No |

---

## Step 4 — The Assessment Record

The **assessment** is the official billing document for one student for one semester. Think of it as the student's bill.

Key figures on an assessment:

| Label | What It Means |
|-------|---------------|
| **Assessment Number** | A unique reference ID (e.g., ASS-20252026-00001) |
| **Total Before Discounts** | The sum of all applicable fees before any discount is applied |
| **Total Discounts** | The combined value of all verified discounts |
| **Amount Owed** | What the student actually owes (Total Before Discounts minus Total Discounts) |
| **Minimum Payment** | The least the student must pay to activate their enrollment |
| **Status** | The current stage of the billing record (see below) |

### Assessment Status

An assessment moves through the following stages:

- **Draft** — created internally, not yet finalized
- **Finalized** — the bill has been locked in; the student owes the full amount and no payment has been made yet
- **Partial** — the student has made at least one payment, but the full amount has not been paid
- **Paid** — the student has paid the full amount owed
- **Cancelled** — the assessment was manually cancelled (e.g., the student withdrew)

---

## Step 5 — Recording Payments (Cashier)

The cashier records each payment at: **Admin → Finance → Assessments → [Student's Assessment] → Record Payment**

For each payment, the cashier enters:

- The **amount paid**
- The **payment method** — Cash, Check, Bank Transfer, GCash, or Maya
- A **reference number** if applicable (check number, GCash confirmation code, etc.)
- The **date of payment**

After each payment is saved, the system automatically:

1. **Adds up all payments made** on this assessment
2. **Updates the remaining balance** (Amount Owed minus total paid so far)
3. **Updates the assessment status:**
   - If total paid = full amount owed → status becomes **Paid**
   - If total paid > ₱0 but less than full → status becomes **Partial**
   - If no payment yet → status stays **Finalized**
4. **Updates the student's enrollment status:**
   - If total paid ≥ minimum payment → enrollment becomes **Active** (student is officially enrolled)
   - If total paid drops below the minimum → enrollment reverts to **Pending**

---

## Status Summary

### Assessment Status

| Status | What It Means |
|--------|---------------|
| Finalized | Bill is locked; no payment yet |
| Partial | Some payment received; balance remains |
| Paid | Fully paid |
| Cancelled | Voided by admin |

### Student Enrollment Status

| Status | What It Means |
|--------|---------------|
| Pending | Assessment exists but minimum payment not yet met |
| Active | Student has paid at least the minimum; enrollment is confirmed |

---

## Who Does What

| Role | Responsibilities |
|------|-----------------|
| **Admin** | Sets up fee types, fee rates, and discount types each school year. Verifies discounts that require approval. Can override the minimum payment amount if needed. Can cancel an assessment. |
| **Student** | Submits enrollment through the portal. Can select applicable discounts when enrolling. |
| **Cashier** | Records payments as they are received. Can edit or delete a payment entry if a correction is needed. |

---

## Where to Find These Pages

| Task | Where to Go |
|------|------------|
| Manage fee types | Admin → Fee Types |
| Manage fee rates | Admin → Fee Rates |
| Manage discount types | Admin → Discount Types |
| View all student assessments | Admin → Finance → Assessments |
| View a specific student's bill | Admin → Finance → Assessments → [Student Name] |
| Record a payment | Admin → Finance → Assessments → [Student Name] → Record Payment |
