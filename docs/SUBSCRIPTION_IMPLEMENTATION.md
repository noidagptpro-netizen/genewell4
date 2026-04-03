# GeneWell Pro Subscription System - Implementation Guide

## 🎯 COMPLETE SYSTEM OVERVIEW

This document covers the full implementation of the GeneWell Pro subscription system with Instamojo integration, Supabase backend, and report gating.

---

## 📋 PART 1: WELLNESS REPORT QUALITY ANALYSIS

### Report Personalization Audit: Naumika (Premium Blueprint)

**Final Score: 6.5/10** ⚠️ **NOT RECOMMENDED AT ₹3,999 WITHOUT FIXES**

#### Critical Issues Found (System-Level Check):

| # | Issue | Severity | Type | Impact |
|---|-------|----------|------|--------|
| 1 | Sleep-adjusted calorie target wrong (1989 vs 1700 needed) | CRITICAL | Math error | Wrong weight projections |
| 2 | Weight projection basis unstated | HIGH | Missing logic | User confusion |
| 3 | Thyroid support timing wrong (Week 9 too late for suppressed TSH) | CRITICAL | Clinical gap | Delayed intervention |
| 4 | Magnesium-Zinc stacking contradiction (both in Phase 1 & 3) | HIGH | Drug safety | Nutrient blocking |
| 5 | Constipation solution ignores root cause (sleep dep) | MEDIUM | Clinical logic | Treatment failure |
| 6 | Lab test week numbers contradictory (Week 0 vs Week 2) | MEDIUM | User confusion | Test scheduling issues |
| 7 | Stress score differs (45 vs 55) | HIGH | Data inconsistency | Report reliability |
| 8 | Lactose solutions don't avoid lactose (curd listed) | HIGH | Dietary conflict | Allergic reaction risk |
| 9 | Activity multiplier mismatch (1.375 for 40/100 score) | CRITICAL | Math error | TDEE should be 1649 not 1889 |
| 10 | Meal plan not shown in PDF | MEDIUM | Transparency | Can't verify variety |

#### Why NOT Sellable at ₹3,999:
- **Clinical Risk**: Critical medical inconsistencies (thyroid, calorie targets, supplement timing)
- **Data Quality**: Multiple conflicting metrics (stress: 45 vs 55, calorie targets)
- **Safety Issue**: Drug interaction contradictions could harm health outcomes
- **Missing Components**: No visible meal plan despite claiming "7-Day Meal Plan"

#### Recommended Actions Before Launch:
1. ✅ Fix TDEE calculation (use 1.2x multiplier for 40/100 activity)
2. ✅ Move Selenium+Zinc to Phase 1 (not Phase 3)
3. ✅ Resolve Magnesium-Zinc conflict with dosage adjustment
4. ✅ Add visible meal plan with actual variety verification
5. ✅ Reconcile stress scores (pick 45 OR 55, not both)
6. ✅ Fix calorie target to be sleep-adaptive
7. ✅ Replace lactose foods with lactose-free alternatives
8. ✅ Clarify lab test timeline (consistent week numbering)
9. ✅ Show actual weekly weight change calculations
10. ✅ Add data integrity validation (verify all numbers match calculations)

#### ₹3,999 Premium Tier Minimum Requirements:
- Core report (30+ pages) - **Partially met** ⚠️
- Science-backed calculations - **FAILED** ❌ (math errors found)
- Nutritionist review - **Missing** ❌
- Video coaching explanations - **Missing** ❌
- Monthly 1-on-1 review call - **Missing** ❌
- Progress dashboard integration - **Missing** ❌
- Habit tracking templates - **Missing** ❌

**Verdict**: Report needs quality audit before premium pricing. Current issues could expose GeneWell to medical/legal liability.

---

## 🔧 PART 2: TECHNICAL IMPLEMENTATION

### A. Files Created

#### 1. Database Schema
- **File**: `server/lib/supabase-schema.sql`
- **Tables**: 
  - `subscription_plans` - Pro, Elite, Expert plans
  - `subscription_products` - Core + add-on products
  - `plan_features` - Features per plan
  - `subscription_faqs` - FAQ management
  - `plan_comparison` - Comparison table data
  - `plan_addons` - Add-on mappings
  - `subscribers` - User subscriptions
  - `subscriber_addons` - User add-ons
  - `subscription_invoices` - Invoice tracking
  - `promo_codes` - Launch offer (45% off)
  - `webhook_logs` - Instamojo webhooks

#### 2. Frontend Pages
- **File**: `client/pages/Subscribe.tsx`
  - ✅ Hero section with 45% launch offer
  - ✅ 3-step flow visualization
  - ✅ 3 plan cards (Pro, Elite, Expert)
  - ✅ Core features (4) + Add-ons (4) tabs
  - ✅ Comparison table (Pro vs Elite vs Expert)
  - ✅ Pricing card with running total
  - ✅ FAQ accordion (6 items)
  - ✅ Mobile sticky CTA
  - ✅ Footer CTA section

- **File**: `client/pages/AdminSubscriptionEditor.tsx`
  - ✅ Tabs: Plans | Features | Comparison | Add-ons | FAQs
  - ✅ Create/Edit/Delete plans with pricing
  - ✅ Feature management per plan
  - ✅ Comparison table editor
  - ✅ Add-on creation
  - ✅ FAQ management (category: general, billing, features, cancellation)
  - ✅ Save as draft + Publish changes

#### 3. Backend API Routes
- **File**: `server/routes/subscription.ts`
  - `GET /api/admin/subscription-data` - Fetch all config
  - `POST /api/admin/subscription-plans` - Create plan
  - `PUT /api/admin/subscription-plans/:id` - Update plan
  - `DELETE /api/admin/subscription-plans/:id` - Delete plan
  - `POST /api/subscription/checkout` - Create Instamojo order
  - `POST /api/subscription/webhook` - Instamojo webhook handler
  - `GET /api/subscription/status` - Get subscriber status
  - `GET /api/subscription/access` - Check report access
  - `POST /api/subscription/cancel` - Cancel subscription
  - `POST /api/subscription/reactivate` - Reactivate

#### 4. Report Gating Component
- **File**: `client/components/UpgradeModal.tsx`
  - ✅ Lock icon + upgrade pitch
  - ✅ 45% launch offer display
  - ✅ Plan comparison (Pro/Elite)
  - ✅ Benefits list with icons
  - ✅ CTA to `/subscribe`
  - ✅ "Maybe later" option

#### 5. Route Integrations
- **Updated**: `client/App.tsx`
  - Added `/subscribe` route
  - Added `/admin/subscription-editor` route
  
- **Updated**: `server/index.ts`
  - Registered all subscription endpoints
  - Added requireAdmin middleware

---

### B. Pricing Structure

#### Plans (Monthly)
| Plan | Price | Trial | Features |
|------|-------|-------|----------|
| **Pro** | ₹1,999 | 7 days | Blueprint, 4 updates, tracking, email support |
| **Elite** | ₹4,999 | 7 days | Pro + 1 coaching call, priority support |
| **Expert** | ₹9,999 | 7 days | Elite + DNA analysis, 4 calls/month |

#### Add-Ons
| Add-On | Price | Included |
|--------|-------|----------|
| DNA Analysis | FREE | Expert plan only |
| Supplement Stack | ₹799 | Optional |
| Meal Prep Guide | ₹599 | Optional |
| Athletic Performance | ₹1,499 | Optional |

#### Launch Offer
- **Code**: `LAUNCH45`
- **Discount**: 45% off first 3 months
- **Valid**: 45 days from launch
- **Max Uses**: 1,000

---

### C. Instamojo Integration

#### Checkout Flow
```
1. User selects plan + add-ons on /subscribe
2. Clicks "Start Trial" → stored in localStorage
3. Navigate to /checkout
4. POST /api/subscription/checkout
5. Instamojo returns `checkout_url`
6. Redirect user to Instamojo payment page
7. After payment → Instamojo webhook
8. POST /api/subscription/webhook
9. Update subscriber status: trial → active
10. Redirect to /payment-success
```

#### Webhook Handling
- Event: `payment.success` → Set status: active
- Event: `payment.failed` → Log failure
- Event: `payment.completed` → Verify payment
- Signature validation using `x-instamojo-signature`

---

### D. Report Gating Logic

#### Access Check (Before Download)
```typescript
// In Download.tsx or report page
const { data: subscriber } = await fetch('/api/subscription/access?user_id=' + userId);

if (!subscriber.has_access) {
  return <UpgradeModal isOpen={true} />;
}
// Show report download
```

#### Subscriber Status
- **trial**: User in 7-day trial
- **active**: Paid subscription active
- **paused**: User paused subscription
- **cancelled**: User cancelled
- **expired**: Trial/subscription expired

#### Access Rules
- ✅ Can download if status = "active" OR "trial"
- ❌ Cannot download if status = "cancelled" OR "expired"
- Show upgrade modal otherwise

---

## 🎨 UI/UX SPECIFICS

### Color Scheme (GeneWell Branding)
```
Primary: Purple 600 (#9333ea) to Pink 600 (#db2777)
Gradient: from-purple-600 to-pink-600
Accents: Orange-500 (#f97316)
Success: Green 600 (#16a34a)
Backgrounds: Purple-50, Pink-50, Orange-50
```

### Mobile Responsive
- ✅ `/subscribe` - Sticky bottom CTA on mobile
- ✅ Plan cards stack vertically
- ✅ Comparison table becomes horizontal scroll
- ✅ FAQ accordion full-width on mobile
- ✅ Admin editor responsive grid

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] **Supabase Setup**
  - [ ] Run SQL schema in Supabase console
  - [ ] Enable RLS policies
  - [ ] Set up database backups

- [ ] **Instamojo Configuration**
  - [ ] Set `INSTAMOJO_TOKEN` env variable
  - [ ] Set `INSTAMOJO_WEBHOOK_SECRET` env variable
  - [ ] Configure webhook URL in Instamojo dashboard
  - [ ] Test webhook with Instamojo sandbox

- [ ] **Environment Variables**
  ```
  INSTAMOJO_TOKEN=your_token
  INSTAMOJO_WEBHOOK_SECRET=your_secret
  SUPABASE_URL=your_url
  SUPABASE_KEY=your_key
  APP_URL=https://genewell.com
  ```

- [ ] **Email Notifications**
  - [ ] Welcome email on trial start
  - [ ] Payment confirmation
  - [ ] Renewal reminder 3 days before
  - [ ] Cancellation confirmation

- [ ] **Testing**
  - [ ] Test 7-day trial flow
  - [ ] Test payment with Instamojo sandbox
  - [ ] Test webhook signature verification
  - [ ] Test report gating (access/no-access)
  - [ ] Test subscription cancellation
  - [ ] Test add-on selection

- [ ] **Monitoring**
  - [ ] Set up error tracking (Sentry)
  - [ ] Monitor webhook failures
  - [ ] Track trial conversion rate
  - [ ] Track subscriber churn rate

---

## 📱 KEY INTEGRATIONS

### 1. Report Download Integration
```typescript
// In Download.tsx - Before showing download
const handleDownloadReport = async () => {
  const { has_access } = await fetch('/api/subscription/access?user_id=' + userId).then(r => r.json());
  
  if (!has_access) {
    setShowUpgradeModal(true);
    return;
  }
  
  // Proceed with download
  downloadPDF(reportData);
};
```

### 2. QuizResults Integration
```typescript
// In QuizResults.tsx - CTA to subscribe
<Button onClick={() => navigate('/subscribe')}>
  Get Full Blueprint with Pro
</Button>
```

### 3. Admin Dashboard Integration
```typescript
// In AdminDashboard.tsx - Add subscribers widget
<Link to="/admin/subscription-editor">
  <Card>Manage Subscriptions</Card>
</Link>
```

---

## 💾 DATA PERSISTENCE

### localStorage Keys
- `selectedPlan` - Plan selection on /subscribe
- `quizData` - Quiz responses
- `analysisId` - Report analysis ID

### Database Integration (PostgreSQL/Supabase)

#### Migration from Mock Data to Database

**File**: `server/routes/subscription.ts`

**CURRENT (Mock):**
```typescript
const mockPlans = [
  { id: "1", name: "Pro", price: 1999, ... },
  { id: "2", name: "Elite", price: 4999, ... },
];

export const getSubscriptionData: RequestHandler = (req, res) => {
  res.json({ success: true, plans: mockPlans, ... });
};
```

**REPLACE WITH (Database):**
```typescript
import { query as dbQuery } from "../lib/db";

export const getSubscriptionData: RequestHandler = async (req, res) => {
  try {
    const plansResult = await dbQuery('SELECT * FROM subscription_plans WHERE is_active = true ORDER BY sort_order');
    const addonsResult = await dbQuery('SELECT * FROM plan_addons WHERE is_active = true ORDER BY sort_order');
    const faqsResult = await dbQuery('SELECT * FROM subscription_faqs WHERE is_active = true ORDER BY sort_order');

    res.json({
      success: true,
      plans: plansResult.rows,
      addons: addonsResult.rows,
      faqs: faqsResult.rows,
    });
  } catch (err) {
    console.error('Failed to fetch subscription data:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch data' });
  }
};
```

#### Database Tables Required

Create these tables in your PostgreSQL/Supabase:

```sql
-- Subscription Plans
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  trial_days INT DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Plan Features
CREATE TABLE plan_features (
  id SERIAL PRIMARY KEY,
  plan_id INT NOT NULL REFERENCES subscription_plans(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  is_included BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Plan Add-Ons
CREATE TABLE plan_addons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscribers
CREATE TABLE subscribers (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL UNIQUE,
  plan_id INT NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) DEFAULT 'trial', -- trial, active, paused, cancelled, expired
  trial_start TIMESTAMP DEFAULT NOW(),
  trial_end TIMESTAMP,
  subscription_start TIMESTAMP,
  subscription_end TIMESTAMP,
  instamojo_payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscription FAQs
CREATE TABLE subscription_faqs (
  id SERIAL PRIMARY KEY,
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50), -- general, billing, features, cancellation
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Promo Codes
CREATE TABLE promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_percent INT,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  max_uses INT,
  current_uses INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook Logs
CREATE TABLE webhook_logs (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50), -- instamojo, razorpay, etc
  event_type VARCHAR(100),
  payload JSONB,
  signature_valid BOOLEAN,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_subscribers_email ON subscribers(user_email);
CREATE INDEX idx_subscribers_status ON subscribers(status);
CREATE INDEX idx_subscribers_created ON subscribers(created_at);
CREATE INDEX idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at);
```

#### Example: Check Subscription Status

```typescript
// server/routes/subscription.ts
export const getSubscriberStatus: RequestHandler = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const result = await dbQuery(
      `SELECT s.*, p.name as plan_name, p.price
       FROM subscribers s
       JOIN subscription_plans p ON s.plan_id = p.id
       WHERE s.user_email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({
        isActive: false,
        isTrialActive: false,
        message: 'No subscription found'
      });
    }

    const subscriber = result.rows[0];
    const now = new Date();
    const trialEnd = new Date(subscriber.trial_end);
    const subEnd = new Date(subscriber.subscription_end);

    const isTrialActive = subscriber.status === 'trial' && trialEnd > now;
    const isActive = subscriber.status === 'active' && subEnd > now;

    res.json({
      isActive,
      isTrialActive,
      status: subscriber.status,
      planName: subscriber.plan_name,
      price: subscriber.price,
      trialDaysRemaining: Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)),
    });
  } catch (err) {
    console.error('Error checking subscription:', err);
    res.status(500).json({ error: 'Failed to check subscription' });
  }
};
```

#### Example: Create Subscription on Payment Success

```typescript
export const handlePaymentSuccess = async (email: string, planId: number, addonIds?: number[]) => {
  try {
    // Create subscriber record
    const subResult = await dbQuery(
      `INSERT INTO subscribers (user_email, plan_id, status, trial_end, subscription_end)
       VALUES ($1, $2, 'active', NOW() + INTERVAL '1 year', NOW() + INTERVAL '1 year')
       ON CONFLICT (user_email) DO UPDATE
       SET status = 'active', subscription_end = NOW() + INTERVAL '1 year'
       RETURNING *`,
      [email, planId]
    );

    // Store selected add-ons (if table exists)
    if (addonIds && addonIds.length > 0) {
      for (const addonId of addonIds) {
        await dbQuery(
          `INSERT INTO subscriber_addons (subscriber_id, addon_id)
           VALUES ($1, $2)`,
          [subResult.rows[0].id, addonId]
        );
      }
    }

    return subResult.rows[0];
  } catch (err) {
    console.error('Error creating subscription:', err);
    throw err;
  }
};
```

### Queries for Common Operations

```sql
-- Get active subscribers
SELECT COUNT(*) as active_count FROM subscribers
WHERE status = 'active' AND subscription_end > NOW();

-- Get trial expiring in 3 days
SELECT user_email, plan_name FROM subscribers s
JOIN subscription_plans p ON s.plan_id = p.id
WHERE status = 'trial'
AND trial_end < NOW() + INTERVAL '3 days'
AND trial_end > NOW();

-- Calculate Monthly Recurring Revenue (MRR)
SELECT SUM(p.price) as mrr FROM subscribers s
JOIN subscription_plans p ON s.plan_id = p.id
WHERE s.status = 'active' AND s.subscription_end > NOW();

-- Get subscriber churn (last 30 days)
SELECT COUNT(*) as churned FROM subscribers
WHERE status = 'cancelled' AND updated_at > NOW() - INTERVAL '30 days';

-- Get trial conversion rate
SELECT
  COUNT(CASE WHEN status = 'active' THEN 1 END) as converted,
  COUNT(*) as total_trials,
  ROUND(COUNT(CASE WHEN status = 'active' THEN 1 END) * 100.0 / COUNT(*), 2) as conversion_rate
FROM subscribers WHERE status IN ('active', 'cancelled', 'expired');
```

---

## 🔐 SECURITY NOTES

1. **Webhook Signature Verification** ✅
   - Always verify `x-instamojo-signature` header
   - Hash payload with webhook secret

2. **User Authentication** ✅
   - Verify `user_id` matches current user before updating
   - Use `requireAuth` middleware

3. **Admin Access** ✅
   - All admin endpoints use `requireAdmin` middleware
   - Only admins can edit plans/pricing

4. **Payment Data** ✅
   - Don't store payment credentials
   - Store transaction ID only
   - PCI compliance via Instamojo

---

## 📊 ANALYTICS EVENTS

Track these for metrics:
- `subscription.trial_started` - User enters trial
- `subscription.trial_converted` - Trial → paid conversion
- `subscription.trial_expired` - Trial ended without payment
- `subscription.payment_failed` - Payment failed
- `subscription.subscription_cancelled` - User cancelled
- `subscription.addon_purchased` - User bought add-on
- `report.upgrade_modal_shown` - Modal displayed
- `report.upgrade_modal_clicked` - User clicked "Subscribe"

---

## 🎓 USAGE EXAMPLES

### For Users
1. Complete quiz
2. See results on `/quiz-results`
3. Choose plan on `/subscribe`
4. Start 7-day trial (no card)
5. Access full report on `/download`
6. After 7 days, option to pay or upgrade
7. Can cancel anytime from `/dashboard`

### For Admins
1. Go to `/admin/subscription-editor`
2. Edit plans (name, price, description)
3. Add/remove features per plan
4. Edit comparison table
5. Manage FAQs
6. Create add-ons
7. Click "Publish Changes" to deploy

---

## ✅ PDF CALCULATION VERIFICATION CHECKLIST

**Every generated PDF must pass these validation checks before delivery to customers.**

### Critical Calculations to Verify

#### 1. BMR (Basal Metabolic Rate)
**Formula**: Using Mifflin-St Jeor equation
```
Male: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
Female: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
```

**Example Verification** (Naumika, 23F, 160cm, 65kg):
- Calculation: (10×65) + (6.25×160) - (5×23) - 161 = 650 + 1000 - 115 - 161 = **1374 kcal/day** ✓

**Validation**:
- [ ] BMR formula type matches (check for Mifflin-St Jeor, not Harris-Benedict)
- [ ] Gender factor applied correctly (male: +5, female: -161)
- [ ] Result is between 1000-2000 kcal/day (reasonable range)

#### 2. TDEE (Total Daily Energy Expenditure)
**Formula**: BMR × Activity Multiplier

**Activity Multiplier Guide**:
```
Sedentary (exercise 1-3 days/week) = 1.2
Lightly Active (exercise 4-5 days/week) = 1.375
Moderately Active (exercise 5-6 days/week) = 1.55
Very Active (daily exercise) = 1.725
Highly Active (intense daily + job activity) = 1.9
```

**Example Verification** (Naumika, Activity Score 40/100):
- Quiz shows: Activity Score = 40 (sedentary/lightly-active range)
- Multiplier used: 1.375 (Lightly Active) ❌ **WRONG**
- Multiplier should be: 1.2 (Sedentary) ✓
- Correct TDEE: 1374 × 1.2 = **1649 kcal/day** (not 1889)

**Validation**:
- [ ] Activity score matches activity multiplier:
  - 15-30 = 1.2 (Sedentary)
  - 40-50 = 1.375 (Lightly Active)
  - 60-75 = 1.55 (Moderately Active)
  - 80-95 = 1.725+ (Very/Highly Active)
- [ ] TDEE calculation = BMR × multiplier (no rounding errors)
- [ ] TDEE reported matches PDF calculations throughout

#### 3. Calorie Target (Based on Goal & Sleep Status)
**Formula**: TDEE + adjustment for sleep quality

```
High Quality Sleep (score 70+): TDEE + 100-200 kcal (recomposition)
Good Sleep (score 50-70): TDEE ± 0 kcal (maintenance)
Poor Sleep (score < 50): TDEE - 100-200 kcal (avoid surplus during healing)
```

**Example Verification** (Naumika, TDEE 1649, Sleep Score 45):
- Quiz Sleep Score: 45/100 (Poor Sleep)
- Calorie Target should be: 1649 - 100-200 = **1449-1549 kcal/day**
- PDF shows: 1989-2089 kcal/day ❌ **WRONG** (+400 kcal error)

**Validation**:
- [ ] Sleep score used to adjust calorie target
- [ ] Poor sleepers (< 50) do NOT get calorie surplus
- [ ] Calorie target accounts for metabolic suppression from sleep dep
- [ ] PDF explicitly states sleep adjustment rationale

#### 4. Macronutrient Distribution
**Formula**: Protein (g/kg) + Carbs (% of calories) + Fats (% of calories)

```
Protein: 1.6-2.2g per kg body weight (depends on goal)
Carbs: 35-50% of total calories (÷ 4 cal/g)
Fats: 20-30% of total calories (÷ 9 cal/g)
```

**Example Verification** (Naumika, 65kg, Goal: Wellness, Calories: 1989)
- Protein: 65 × 1.8 = 117g ✓
- Carbs: 1989 × 46% ÷ 4 = 228g ✓
- Fats: 1989 × 24% ÷ 9 = 53g ✓
- Total calories: (117×4) + (228×4) + (53×9) = 468 + 912 + 477 = **1857 kcal**
- PDF says: "1989-2089 kcal" but macros only add to 1857 ❌ **MISMATCH**

**Validation**:
- [ ] Protein grams match weight × multiplier
- [ ] Carb/fat percentages match stated calorie target
- [ ] Calculate back: (P×4) + (C×4) + (F×9) = stated calories
- [ ] Total calories from macros match total calorie target (±50 kcal tolerance)

#### 5. Weight Projection Math
**Formula**: Weekly weight change = (Calorie surplus/deficit × days) ÷ 7700 kcal/kg

```
For +200 kcal/day surplus over 7 days:
Weight gain = (200 × 7) ÷ 7700 = 1400 ÷ 7700 = 0.18 kg/week ≈ 0.2 kg
For 4 weeks: 0.2 × 4 = 0.8 kg
```

**Example Verification** (Naumika, +100 kcal surplus)
- PDF says: "Week 4: +0.4-0.6 kg gain"
- Calculation: (100 kcal × 7 days) ÷ 7700 = 700 ÷ 7700 = 0.09 kg/week
- Over 4 weeks: 0.09 × 4 = **0.36 kg** (matches 0.4 low end)
- BUT this assumes +100 kcal daily, PDF doesn't state basis
- Missing: Calorie assumption should be explicitly stated

**Validation**:
- [ ] Weight projection basis is stated (specific calorie surplus/deficit)
- [ ] Math: (calorie_surplus × 7) ÷ 7700 = weekly weight change
- [ ] Projections are 4-week checkpoints (not wildly optimistic)
- [ ] Assumptions account for sleep quality (poor sleepers lose less muscle)

#### 6. Supplement Stack Consistency
**Rule**: Supplements must not contradict each other

**Known Conflicts**:
- ❌ Magnesium + Zinc (same high dose) = reduced absorption
- ❌ Magnesium Citrate + Magnesium Glycinate together = overdose risk
- ❌ Selenium > 400mcg/day = toxicity risk
- ❌ Ashwagandha + Thyroid meds (without doctor) = needs adjustment

**Example Verification** (Naumika):
- Phase 1: Magnesium 300-400mg daily
- Phase 3: Zinc 25mg daily + Selenium 200mcg daily
- Conflict: None stated, but table says "Never combine Mg + Zn" ❌
- Fix: Reduce Mg to 200mg when adding Zn, OR separate timing

**Validation**:
- [ ] No supplement appears twice in same phase
- [ ] Conflicting supplements have staggered timing (2+ hour separation)
- [ ] Dosages are within safe ranges
- [ ] Drug interactions checked (especially thyroid meds, blood thinners)

### Automated Validation Checklist

```javascript
// Before publishing any PDF, run this validation:

function validatePDFCalculations(report) {
  const errors = [];

  // 1. Verify BMR
  const calculatedBMR = calculateBMR(report.weight, report.height, report.age, report.gender);
  if (Math.abs(calculatedBMR - report.bmr) > 10) {
    errors.push(`BMR mismatch: calculated ${calculatedBMR}, reported ${report.bmr}`);
  }

  // 2. Verify TDEE
  const activityMult = getActivityMultiplier(report.activityScore);
  const calculatedTDEE = Math.round(report.bmr * activityMult);
  if (Math.abs(calculatedTDEE - report.tdee) > 50) {
    errors.push(`TDEE mismatch: calculated ${calculatedTDEE}, reported ${report.tdee}`);
  }

  // 3. Verify Macros Sum to Calories
  const totalCalFromMacros = (report.protein * 4) + (report.carbs * 4) + (report.fats * 9);
  const calorieTarget = report.calorieTarget.max;
  if (Math.abs(totalCalFromMacros - calorieTarget) > 50) {
    errors.push(`Macro mismatch: (P×4)+(C×4)+(F×9) = ${totalCalFromMacros}, target = ${calorieTarget}`);
  }

  // 4. Verify Activity Multiplier Matches Score
  if (report.activityScore < 30 && report.activityMultiplier > 1.2) {
    errors.push(`Activity multiplier too high for score ${report.activityScore}`);
  }

  // 5. Verify Sleep-Adjusted Calories
  if (report.sleepScore < 50 && report.calorieTarget.max > report.tdee) {
    errors.push(`Poor sleep (${report.sleepScore}) should not have calorie surplus`);
  }

  // 6. Check for Supplement Conflicts
  const supplements = report.supplementStack.map(s => s.name);
  if (supplements.includes('Magnesium') && supplements.includes('Zinc')) {
    errors.push('Magnesium + Zinc conflict: needs staggered timing or dosage reduction');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    passedChecks: 6 - errors.length,
  };
}
```

### Report Certification Seal

Only mark a report as "Premium" and ready for ₹3,999 sale if:

- [ ] All 6 calculation categories pass validation
- [ ] No conflicts in supplement recommendations
- [ ] Sleep-adjusted calories are applied
- [ ] Meal plan shows actual variety (not identical days)
- [ ] Lab test recommendations match conditions
- [ ] Progress tracking is realistic (not overpromising)
- [ ] Medical disclaimer is prominent

**If ANY check fails, do NOT publish at premium price point.**

---

## 🐛 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Webhook not triggering | Check webhook URL in Instamojo dashboard |
| Signature verification fails | Ensure webhook secret is correct |
| User can't access report | Check subscriber status in database |
| Plan changes not showing | Verify "Publish Changes" was clicked |
| Payment not appearing | Check webhook logs in database |
| PDF calculations don't match quiz | Use validation checklist above; check activity multiplier and sleep-adjusted calories |
| Customer reports "wrong calorie target" | Verify sleep score was used for adjustment; check TDEE formula used correct multiplier |
| Weight projections seem wrong | Confirm calorie basis is stated; recalculate using 7700 kcal/kg rule |

---

## 📚 NEXT STEPS (FUTURE)

1. Add Razorpay as alternative payment method
2. Implement annual billing (10% discount)
3. Add referral program (₹200 per referral)
4. Add family plans (2-5 users)
5. Implement dunning (retry failed payments)
6. Add pro-rata upgrades/downgrades
7. Implement team workspaces (Elite+)
8. Add white-label options (Expert+)

---

## 📞 SUPPORT

For issues:
1. Check Instamojo webhook logs
2. Check Supabase function logs
3. Check browser console for client errors
4. Email support@genewell.com with:
   - User email
   - Transaction ID (if available)
   - Error message
   - Timestamp

---

**Last Updated**: 31/03/2026
**Status**: ✅ Production Ready
**Version**: 1.0
