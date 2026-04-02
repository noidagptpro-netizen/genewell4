import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Check,
  X,
  ChevronRight,
  Gift,
  Heart,
  Brain,
  Zap,
  Phone,
  FileText,
  BarChart3,
  HeartHandshake,
  Dna,
  Pill,
  UtensilsCrossed,
  HelpCircle,
  ArrowRight,
  Clock,
} from "lucide-react";
import LegalFooter from "@/components/LegalFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_cycle: string;
  trial_days: number;
  features: string[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  icon: string;
  price?: number;
  is_addon: boolean;
}

const plans: Plan[] = [
  {
    id: "1",
    name: "Pro",
    slug: "pro",
    description: "Full wellness transformation",
    price: 1999,
    billing_cycle: "monthly",
    trial_days: 7,
    features: [
      "Personalized 90-day blueprint",
      "4 monthly updates",
      "Progress tracking app",
      "Email support",
      "Access to meal plans",
      "Supplement recommendations",
    ],
  },
  {
    id: "2",
    name: "Elite",
    slug: "elite",
    description: "Pro + coaching + priority support",
    price: 4999,
    billing_cycle: "monthly",
    trial_days: 7,
    features: [
      "Everything in Pro",
      "1 coaching call/month",
      "Priority support",
      "Habit tracking AI",
      "Monthly progress reports",
      "Custom meal prep",
    ],
  },
  {
    id: "3",
    name: "Expert",
    slug: "expert",
    description: "Elite + DNA analysis + 4 calls/month",
    price: 9999,
    billing_cycle: "monthly",
    trial_days: 7,
    features: [
      "Everything in Elite",
      "4 coaching calls/month",
      "DNA analysis included",
      "Weekly check-ins",
      "Personalized supplements",
      "Athletic performance module",
    ],
  },
];

const coreProducts: Product[] = [
  {
    id: "1",
    name: "Personalized Blueprint",
    description: "Your AI-generated 90-day wellness plan (30+ pages)",
    icon: "FileText",
    is_addon: false,
  },
  {
    id: "2",
    name: "Monthly Updates",
    description: "4 blueprint revisions per month based on your progress",
    icon: "RefreshCw",
    is_addon: false,
  },
  {
    id: "3",
    name: "Progress Tracking",
    description: "App integration + habit tracking dashboard",
    icon: "BarChart3",
    is_addon: false,
  },
  {
    id: "4",
    name: "Expert Support",
    description: "Email + chat support from wellness experts",
    icon: "HeartHandshake",
    is_addon: false,
  },
];

const addOnProducts: Product[] = [
  {
    id: "5",
    name: "DNA Analysis",
    description: "Genetic predisposition analysis (₹2,999 value)",
    icon: "Dna",
    price: 0,
    is_addon: true,
  },
  {
    id: "6",
    name: "Supplement Stack",
    description: "Personalized supplement recommendations",
    icon: "Pill",
    price: 799,
    is_addon: true,
  },
  {
    id: "7",
    name: "Meal Prep Guide",
    description: "Weekly meal prep templates + shopping lists",
    icon: "UtensilsCrossed",
    price: 599,
    is_addon: true,
  },
  {
    id: "8",
    name: "Athletic Performance",
    description: "Sports-specific optimization",
    icon: "Zap",
    price: 1499,
    is_addon: true,
  },
];

const faqs = [
  {
    question: "What's included in the free trial?",
    answer:
      "You get full access to all Pro features for 7 days. No credit card required after trial - we just need an email to create your account.",
    category: "general",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes! Cancel anytime from your account settings. You'll keep access until the end of your billing cycle.",
    category: "cancellation",
  },
  {
    question: "How do updates work?",
    answer:
      "Your blueprint auto-updates based on your progress data. You can request manual revisions monthly based on your feedback.",
    category: "features",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We use Instamojo for secure payments. You can pay via UPI, card, netbanking, or wallet.",
    category: "billing",
  },
  {
    question: "Can I upgrade my plan?",
    answer:
      "Absolutely! Upgrade anytime and we'll prorate the difference. You'll keep all your data and progress.",
    category: "billing",
  },
  {
    question: "Is my data secure?",
    answer:
      "Your health data is encrypted and stored securely on Supabase. We never sell or share your data with third parties.",
    category: "general",
  },
];

export default function Subscribe() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("1");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [launchDiscount, setLaunchDiscount] = useState(45);
  const [showMobileSticky, setShowMobileSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowMobileSticky(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const plan = plans.find((p) => p.id === selectedPlan)!;
  const basePrice = plan.price;
  const discountedPrice = Math.round(basePrice * (1 - launchDiscount / 100));
  const addonPrice = selectedAddons.reduce(
    (acc, addonId) => acc + (addOnProducts.find((p) => p.id === addonId)?.price || 0),
    0
  );
  const totalPrice = discountedPrice + addonPrice;

  const handleStartTrial = () => {
    localStorage.setItem("selectedPlan", JSON.stringify({
      plan_id: plan.id,
      plan_name: plan.name,
      price: basePrice,
      discounted_price: discountedPrice,
      addons: selectedAddons,
      addon_price: addonPrice,
      total: totalPrice,
      trial_days: plan.trial_days,
    }));
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Genewell
              </span>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <Gift className="h-4 w-4 mr-2" /> 45% Off - Launch Special
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            GeneWell Pro Subscription
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlimited personalized wellness blueprints, monthly updates, and expert
            coaching. Transform your health with AI-powered guidance.
          </p>
        </div>

        {/* 3-Step Flow */}
        <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              1
            </div>
            <h3 className="font-bold text-lg mb-2">Choose Your Plan</h3>
            <p className="text-gray-600 text-sm">
              Pick Pro, Elite, or Expert based on your needs and budget
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              2
            </div>
            <h3 className="font-bold text-lg mb-2">Add Optional Add-ons</h3>
            <p className="text-gray-600 text-sm">
              Enhance with DNA analysis, supplements, meal prep, or athletics
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              3
            </div>
            <h3 className="font-bold text-lg mb-2">Start Your Trial</h3>
            <p className="text-gray-600 text-sm">
              Get 7 days free. No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <Card
              key={p.id}
              className={`cursor-pointer transition-all ${
                selectedPlan === p.id
                  ? "border-2 border-purple-600 ring-2 ring-purple-200"
                  : "border border-gray-200 hover:border-purple-300"
              }`}
              onClick={() => setSelectedPlan(p.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <CardTitle className="text-2xl">{p.name}</CardTitle>
                    <CardDescription>{p.description}</CardDescription>
                  </div>
                  {p.name === "Elite" && (
                    <Badge className="bg-green-100 text-green-700">Popular</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    ₹{Math.round(p.price * (1 - launchDiscount / 100))}/month
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 line-through">
                      ₹{p.price}
                    </span>
                    <Badge className="bg-red-100 text-red-700">
                      Save {launchDiscount}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {p.trial_days}-day free trial. Cancel anytime.
                  </p>
                </div>
                <div className="space-y-3">
                  {p.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 className="text-3xl font-bold mb-8 text-center">What's Included</h2>

        <Tabs defaultValue="core" className="max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="core">Core Features (4)</TabsTrigger>
            <TabsTrigger value="addons">Add-Ons (4)</TabsTrigger>
          </TabsList>

          <TabsContent value="core" className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {coreProducts.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="addons" className="mt-6">
            <div className="space-y-3">
              {addOnProducts.map((addon) => (
                <Card
                  key={addon.id}
                  className={`cursor-pointer transition-all ${
                    selectedAddons.includes(addon.id)
                      ? "border-2 border-purple-600 bg-purple-50"
                      : "border border-gray-200 hover:border-purple-300"
                  }`}
                  onClick={() => toggleAddon(addon.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <Dna className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {addon.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {addon.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {addon.price ? (
                          <div className="text-sm font-semibold text-gray-900">
                            +₹{addon.price}
                          </div>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">
                            FREE
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Comparison Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 className="text-3xl font-bold mb-8 text-center">Plan Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-4 px-4 font-semibold text-gray-900">
                  Feature
                </th>
                {plans.map((p) => (
                  <th key={p.id} className="text-center py-4 px-4 font-semibold text-gray-900">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-4 px-4 font-semibold text-gray-900">
                  Personalized Blueprint
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="text-center py-4 px-4">
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-4 px-4 font-semibold text-gray-900">
                  Monthly Updates
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="text-center py-4 px-4">
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-4 px-4 font-semibold text-gray-900">
                  Coaching Calls
                </td>
                <td className="text-center py-4 px-4 text-gray-500">-</td>
                <td className="text-center py-4 px-4 font-semibold">1/month</td>
                <td className="text-center py-4 px-4 font-semibold">4/month</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-4 px-4 font-semibold text-gray-900">
                  DNA Analysis
                </td>
                <td className="text-center py-4 px-4 text-gray-500">-</td>
                <td className="text-center py-4 px-4 text-gray-500">-</td>
                <td className="text-center py-4 px-4">
                  <Check className="h-5 w-5 text-green-600 mx-auto" />
                </td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-4 px-4 font-semibold text-gray-900">
                  Priority Support
                </td>
                <td className="text-center py-4 px-4 text-gray-500">Email</td>
                <td className="text-center py-4 px-4">
                  <Check className="h-5 w-5 text-green-600 mx-auto" />
                </td>
                <td className="text-center py-4 px-4">
                  <Check className="h-5 w-5 text-green-600 mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <Card className="border-2 border-purple-300 bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl">Your Selection</CardTitle>
            <CardDescription>
              Plan + add-ons. 45% off for the first 3 months!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Summary */}
            <div className="space-y-3 pb-6 border-b">
              <div className="flex justify-between">
                <span className="text-gray-700">
                  {plan.name} Plan (First Month)
                </span>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ₹{discountedPrice}
                  </div>
                  <div className="text-sm text-gray-500 line-through">
                    ₹{basePrice}
                  </div>
                </div>
              </div>

              {selectedAddons.length > 0 && (
                <div className="pt-3 space-y-2">
                  <div className="text-sm font-semibold text-gray-700">
                    Add-Ons:
                  </div>
                  {selectedAddons.map((addonId) => {
                    const addon = addOnProducts.find((p) => p.id === addonId);
                    return (
                      <div key={addonId} className="flex justify-between text-sm">
                        <span className="text-gray-700">• {addon?.name}</span>
                        <span className="font-semibold text-gray-900">
                          {addon?.price ? `+₹${addon.price}` : "FREE"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">Monthly Total</div>
                <div className="text-sm text-gray-500">
                  After trial: {basePrice > 0 ? `₹${basePrice + addonPrice}/month` : "Free"}
                </div>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ₹{totalPrice}
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={handleStartTrial}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-semibold py-6 text-lg"
            >
              Start {plan.trial_days}-Day Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-center text-sm text-gray-600">
              <Clock className="h-4 w-4 inline mr-1" />
              {plan.trial_days} days free. No credit card. Cancel anytime.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={`faq-${idx}`} className="border border-gray-200 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-start gap-3 text-left">
                  <HelpCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold text-gray-900">
                    {faq.question}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12 mb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Health?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Join thousands getting personalized wellness guidance
          </p>
          <Button
            onClick={handleStartTrial}
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-50 font-semibold py-6 text-lg"
          >
            Start Free Trial Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      {showMobileSticky && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-lg text-gray-900">
                ₹{totalPrice}/month
              </div>
              <div className="text-sm text-gray-600">
                Starting after {plan.trial_days}-day trial
              </div>
            </div>
            <Button
              onClick={handleStartTrial}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
            >
              Start Trial
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className={showMobileSticky ? "pb-24" : ""} />

      {/* Footer */}
      <LegalFooter />
    </div>
  );
}
