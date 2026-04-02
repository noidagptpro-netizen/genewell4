import { RequestHandler } from "express";
import crypto from "crypto";

// Types
interface SubscriptionData {
  success: boolean;
  plans?: any[];
  features?: any[];
  faqs?: any[];
  comparison?: any[];
  addons?: any[];
}

interface InstamojoWebhookPayload {
  event: string;
  payment: {
    id: string;
    order_id: string;
    transaction_id: string;
    status: string;
    amount: string;
    buyer_email: string;
    buyer_phone: string;
  };
}

// Mock database for now (will be replaced with Supabase)
const mockPlans = [
  {
    id: "1",
    name: "Pro",
    slug: "pro",
    description: "Full wellness transformation",
    price: 1999,
    trial_days: 7,
    is_active: true,
  },
  {
    id: "2",
    name: "Elite",
    slug: "elite",
    description: "Pro + coaching + priority",
    price: 4999,
    trial_days: 7,
    is_active: true,
  },
  {
    id: "3",
    name: "Expert",
    slug: "expert",
    description: "Elite + DNA analysis",
    price: 9999,
    trial_days: 7,
    is_active: true,
  },
];

const mockAddOns = [
  {
    id: "5",
    name: "DNA Analysis",
    description: "Genetic predisposition",
    price: 0,
    is_addon: true,
  },
  {
    id: "6",
    name: "Supplement Stack",
    description: "Personalized supplements",
    price: 799,
    is_addon: true,
  },
];

// Get all subscription data (admin)
export const getSubscriptionData: RequestHandler = (req, res) => {
  const data: SubscriptionData = {
    success: true,
    plans: mockPlans,
    addons: mockAddOns,
    features: [],
    faqs: [
      {
        question: "What's included in the free trial?",
        answer:
          "Full access to all Pro features for 7 days. No credit card required.",
        category: "general",
        is_active: true,
      },
      {
        question: "Can I cancel anytime?",
        answer:
          "Yes! Cancel anytime. You keep access until the end of your billing cycle.",
        category: "cancellation",
        is_active: true,
      },
    ],
    comparison: [],
  };

  res.json(data);
};

// Save plan (admin)
export const savePlan: RequestHandler = (req, res) => {
  const { name, slug, description, price, trial_days, is_active } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ success: false, error: "Name and slug required" });
  }

  // In real app, save to Supabase
  const newPlan = {
    id: Date.now().toString(),
    name,
    slug,
    description,
    price,
    trial_days,
    is_active,
  };

  mockPlans.push(newPlan);

  res.json({
    success: true,
    message: "Plan created",
    plan: newPlan,
  });
};

// Update plan (admin)
export const updatePlan: RequestHandler = (req, res) => {
  const { id, name, slug, description, price, trial_days, is_active } = req.body;

  const plan = mockPlans.find((p) => p.id === id);
  if (!plan) {
    return res.status(404).json({ success: false, error: "Plan not found" });
  }

  Object.assign(plan, { name, slug, description, price, trial_days, is_active });

  res.json({ success: true, message: "Plan updated", plan });
};

// Delete plan (admin)
export const deletePlan: RequestHandler = (req, res) => {
  const { id } = req.params;

  const index = mockPlans.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Plan not found" });
  }

  mockPlans.splice(index, 1);

  res.json({ success: true, message: "Plan deleted" });
};

// Instamojo checkout
export const createCheckout: RequestHandler = async (req, res) => {
  const {
    plan_id,
    plan_name,
    amount,
    user_id,
    email,
    name,
    phone,
    addons = [],
  } = req.body;

  if (!email || !amount) {
    return res
      .status(400)
      .json({ success: false, error: "Email and amount required" });
  }

  try {
    // Call Instamojo API
    const instamojoResponse = await fetch(
      "https://api.instamojo.com/oauth2/orderless/initiate/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.INSTAMOJO_TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          purpose: `GeneWell Pro - ${plan_name}`,
          amount: amount.toString(),
          buyer_name: name || "Customer",
          buyer_email: email,
          buyer_phone: phone || "",
          redirect_url: `${process.env.APP_URL}/checkout-success`,
          webhook_url: `${process.env.APP_URL}/api/subscription/webhook`,
          allow_repeated_use: "false",
        }).toString(),
      }
    );

    const data = await instamojoResponse.json();

    if (!data.success) {
      return res.status(400).json({ success: false, error: data.message });
    }

    // Store order in database
    // await supabase.from('subscribers').insert({...})

    res.json({
      success: true,
      checkout_url: data.longurl,
      order_id: data.id,
      payment_request_id: data.payment_request_id,
    });
  } catch (error: any) {
    console.error("Instamojo error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to create checkout",
        details: error.message,
      });
  }
};

// Instamojo webhook
export const handleWebhook: RequestHandler = async (req, res) => {
  const { event, payment } = req.body as InstamojoWebhookPayload;

  try {
    // Verify webhook signature
    const mac = crypto
      .createHmac(
        "sha256",
        process.env.INSTAMOJO_WEBHOOK_SECRET || ""
      )
      .update(JSON.stringify(req.body))
      .digest("hex");

    const incomingMac = req.headers["x-instamojo-signature"];
    if (mac !== incomingMac) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Handle different event types
    switch (event) {
      case "payment.success":
        // Update subscriber status to 'active'
        // Send welcome email
        console.log(`Payment success: ${payment.transaction_id}`);
        break;

      case "payment.failed":
        // Mark subscription as failed
        console.log(`Payment failed: ${payment.transaction_id}`);
        break;

      case "payment.completed":
        // Mark subscription as verified
        console.log(`Payment completed: ${payment.transaction_id}`);
        break;
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Webhook processing failed",
        details: error.message,
      });
  }
};

// Get subscriber status
export const getSubscriberStatus: RequestHandler = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res
      .status(400)
      .json({ success: false, error: "user_id required" });
  }

  try {
    // Query Supabase for subscriber status
    // const { data } = await supabase
    //   .from('subscribers')
    //   .select('*')
    //   .eq('user_id', user_id)
    //   .single()

    // Mock response
    const mockSubscriber = {
      id: "123",
      user_id,
      plan: "pro",
      status: "active", // active, trial, cancelled
      subscription_start: new Date(),
      trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      can_access_report: true,
      days_remaining: 5,
    };

    res.json({ success: true, subscriber: mockSubscriber });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch subscriber status",
        details: error.message,
      });
  }
};

// Cancel subscription
export const cancelSubscription: RequestHandler = async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res
      .status(400)
      .json({ success: false, error: "user_id required" });
  }

  try {
    // Update subscriber status in Supabase
    // await supabase
    //   .from('subscribers')
    //   .update({ status: 'cancelled', cancelled_at: new Date() })
    //   .eq('user_id', user_id)

    res.json({ success: true, message: "Subscription cancelled" });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to cancel subscription",
        details: error.message,
      });
  }
};

// Reactivate subscription
export const reactivateSubscription: RequestHandler = async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res
      .status(400)
      .json({ success: false, error: "user_id required" });
  }

  try {
    // Update subscriber status in Supabase
    // await supabase
    //   .from('subscribers')
    //   .update({ status: 'active', cancelled_at: null })
    //   .eq('user_id', user_id)

    res.json({ success: true, message: "Subscription reactivated" });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to reactivate subscription",
        details: error.message,
      });
  }
};

// Check if user can access report
export const checkReportAccess: RequestHandler = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ success: false, error: "user_id required" });
  }

  try {
    // Query subscriber status
    // const { data: subscriber } = await supabase
    //   .from('subscribers')
    //   .select('*')
    //   .eq('user_id', user_id)
    //   .single()

    // Mock response
    const hasAccess = true; // Should check actual status
    const status = "active"; // active, trial, cancelled, expired

    res.json({
      success: true,
      has_access: hasAccess,
      status,
      message: hasAccess
        ? "User has report access"
        : "User needs to subscribe",
    });
  } catch (error: any) {
    // Assume no access on error
    res.json({
      success: true,
      has_access: false,
      status: "unknown",
      message: "User needs to subscribe to access reports",
    });
  }
};

// Admin: Get all subscribers
export const getSubscribers: RequestHandler = async (req, res) => {
  try {
    // const { data: subscribers } = await supabase
    //   .from('subscribers')
    //   .select('*')
    //   .order('created_at', { ascending: false })

    res.json({ success: true, subscribers: [] });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch subscribers",
        details: error.message,
      });
  }
};

// Admin: Publish changes
export const publishChanges: RequestHandler = async (req, res) => {
  const { plans, features, faqs, comparison, addons } = req.body;

  try {
    // In real app, update all Supabase tables atomically
    // await Promise.all([
    //   supabase.from('subscription_plans').delete().neq('id', ''),
    //   // ... insert new data
    // ])

    res.json({ success: true, message: "Changes published successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to publish changes",
        details: error.message,
      });
  }
};
