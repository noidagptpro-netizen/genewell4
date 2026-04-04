import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  Lock,
} from "lucide-react";

interface CheckoutData {
  planId: string;
  planName: string;
  planPrice: number;
  discount: number;
  selectedAddons: Array<{ id: string; name: string; price: number }>;
  totalPrice: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Load checkout data from localStorage
  useEffect(() => {
    const planConfig = localStorage.getItem("selectedPlan");
    const quizData = localStorage.getItem("quizData");

    if (planConfig && quizData) {
      try {
        const plan = JSON.parse(planConfig);
        const quiz = JSON.parse(quizData);

        // Mock plan data
        const plans: Record<string, { name: string; price: number }> = {
          "1": { name: "Pro", price: 1999 },
          "2": { name: "Elite", price: 4999 },
          "3": { name: "Expert", price: 9999 },
        };

        const planData = plans[plan.planId] || { name: "Pro", price: 1999 };
        const discountPercent = 45; // Launch offer
        const discountedPrice = Math.round(planData.price * (1 - discountPercent / 100));

        // Get add-ons from localStorage
        const addonsString = localStorage.getItem("selectedAddons");
        const addons = addonsString ? JSON.parse(addonsString) : [];
        const addonPrice = addons.reduce((sum: number, addon: any) => sum + (addon.price || 0), 0);

        const totalPrice = discountedPrice + addonPrice;

        setCheckoutData({
          planId: plan.planId,
          planName: planData.name,
          planPrice: planData.price,
          discount: discountPercent,
          selectedAddons: addons,
          totalPrice,
        });

        // Pre-fill form from quiz data
        setFormData({
          name: quiz.userName || "",
          email: quiz.userEmail || "",
          phone: quiz.userPhone || "",
        });
      } catch (err) {
        console.error("Failed to load checkout data:", err);
        setError("Failed to load plan details. Please go back and try again.");
      }
    } else {
      setError("No plan selected. Please go back to the subscription page.");
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckout = async () => {
    if (!formData.name || !formData.email || !checkoutData) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Call Instamojo checkout API
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: checkoutData.planId,
          plan_name: checkoutData.planName,
          amount: checkoutData.totalPrice,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          addons: checkoutData.selectedAddons,
        }),
      });

      if (!response.ok) {
        throw new Error(`Checkout failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.checkout_url) {
        // Redirect to Instamojo payment
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || "Failed to create checkout");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Failed to process checkout. Please try again.");
      setIsLoading(false);
    }
  };

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            {error ? (
              <>
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Error</h1>
                <p className="text-slate-600 mb-6">{error}</p>
                <Button onClick={() => navigate("/subscribe")} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Plans
                </Button>
              </>
            ) : (
              <>
                <Loader className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-slate-600">Loading checkout...</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const discountedPrice = Math.round(checkoutData.planPrice * (1 - checkoutData.discount / 100));
  const totalDiscount = checkoutData.planPrice - discountedPrice;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link to="/subscribe" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Plans</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Complete Your Order</h1>
            <p className="text-slate-600">Secure payment with Instamojo</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Details</CardTitle>
                  <CardDescription>We need these to process your payment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold mb-2 block">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold mb-2 block">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@example.com"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-semibold mb-2 block">
                      Phone (Optional)
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      className="w-full"
                    />
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-700 ml-2">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-2 mb-4">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-slate-600">
                        Secure payment powered by <strong>Instamojo</strong>
                      </span>
                    </div>
                    <Button
                      onClick={handleCheckout}
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white font-semibold text-lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-5 w-5" />
                          Proceed to Payment
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Notes */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>7-Day Trial:</strong> Start your free trial today. No credit card charged for the first 7 days.
                  Cancel anytime before trial ends at no charge.
                </p>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-3">
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Plan */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {checkoutData.planName} Plan
                      </span>
                      <span className="text-lg font-bold text-slate-900">
                        ₹{discountedPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-2">
                      <span>Original: ₹{checkoutData.planPrice.toLocaleString()}</span>
                      <Badge className="bg-red-100 text-red-800">
                        -₹{totalDiscount.toLocaleString()} ({checkoutData.discount}%)
                      </Badge>
                    </div>
                  </div>

                  {/* Add-ons */}
                  {checkoutData.selectedAddons.length > 0 && (
                    <div className="mb-6 pb-6 border-b">
                      <p className="text-xs font-semibold text-slate-600 mb-3 uppercase">Add-ons</p>
                      {checkoutData.selectedAddons.map((addon) => (
                        <div key={addon.id} className="flex justify-between items-center text-sm mb-2">
                          <span className="text-slate-700">{addon.name}</span>
                          <span className="font-semibold text-slate-900">+₹{addon.price}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900">Total Charge</span>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">₹{checkoutData.totalPrice.toLocaleString()}</p>
                        <p className="text-xs text-slate-600">/month after trial</p>
                      </div>
                    </div>
                  </div>

                  {/* Trial Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">7-day free trial</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">Cancel anytime</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">Instant access to reports</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
