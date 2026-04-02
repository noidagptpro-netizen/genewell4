import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  X,
  Check,
  Sparkles,
  Lock,
  Gift,
  ArrowRight,
  Heart,
  Brain,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle?: string;
  remainingDays?: number;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  reportTitle = "Your Wellness Blueprint",
  remainingDays = 0,
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const handleUpgrade = () => {
    navigate("/subscribe");
    onClose();
  };

  const plans = [
    {
      name: "Pro",
      price: "₹1,999",
      period: "/month",
      features: [
        "Full personalized blueprint",
        "4 monthly updates",
        "Progress tracking app",
        "Email support",
        "7-day free trial",
      ],
      popular: true,
    },
    {
      name: "Elite",
      price: "₹4,999",
      period: "/month",
      features: [
        "Everything in Pro",
        "1 coaching call/month",
        "Priority support",
        "Habit tracking AI",
        "7-day free trial",
      ],
      popular: false,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-md hover:bg-gray-100 p-1"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Step 1: Upgrade Pitch */}
        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: Hero */}
            <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white p-8 md:p-12 flex flex-col justify-between">
              <div>
                <Lock className="h-12 w-12 mb-4" />
                <h2 className="text-3xl font-bold mb-4">Unlock Your Full Report</h2>
                <p className="text-purple-100 text-lg mb-6">
                  This {reportTitle} requires a GeneWell Pro subscription to access
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5" />
                    <span>Access all 30+ pages instantly</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5" />
                    <span>Monthly AI-powered updates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5" />
                    <span>Expert support & coaching</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <p className="text-sm text-purple-100">
                  💚 {remainingDays > 0
                    ? `${remainingDays} days of free trial remaining`
                    : "7-day free trial available"}
                </p>
              </div>
            </div>

            {/* Right: CTA */}
            <div className="p-8 md:p-12 bg-white flex flex-col justify-between">
              <div>
                <div className="mb-8">
                  <Badge className="bg-green-100 text-green-700 mb-4">
                    <Gift className="h-4 w-4 mr-2" /> Limited Time
                  </Badge>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    45% Off First 3 Months
                  </h3>
                  <p className="text-gray-600">
                    Special launch offer - subscribe now and get up to 3 months at 45% discount
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 mb-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      ₹1,099
                    </div>
                    <div className="text-sm text-gray-600">
                      First month <span className="line-through">₹1,999</span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "Full 30+ page wellness blueprint",
                    "Monthly AI-powered revisions",
                    "Nutrition + fitness plans",
                    "Sleep & stress protocols",
                    "Email & chat support",
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleUpgrade}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-semibold py-6 text-lg"
                >
                  Start 7-Day Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-center text-xs text-gray-500">
                  No credit card. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Plan Comparison */}
        {step === 2 && (
          <div className="p-8 md:p-12">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl">Choose Your Plan</DialogTitle>
              <DialogDescription>
                All plans include your personalized wellness report
              </DialogDescription>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {plans.map((plan, idx) => (
                <Card
                  key={idx}
                  className={`relative ${
                    plan.popular
                      ? "border-2 border-purple-600 ring-2 ring-purple-200"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                      Most Popular
                    </Badge>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      {plan.price}
                      <span className="text-lg text-gray-600">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-green-600 text-sm font-semibold mb-6">
                      45% off first 3 months
                    </p>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, fidx) => (
                        <li
                          key={fidx}
                          className="flex items-center gap-2 text-gray-700"
                        >
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={handleUpgrade}
                      className={`w-full py-3 ${
                        plan.popular
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-semibold"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200 font-semibold"
                      }`}
                    >
                      Get {plan.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-gray-600"
            >
              Maybe later
            </Button>
          </div>
        )}

        {/* Footer Note */}
        <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-600 border-t">
          <Sparkles className="h-4 w-4 inline mr-2 text-purple-600" />
          Your report will be available immediately after subscription
        </div>
      </DialogContent>
    </Dialog>
  );
}
