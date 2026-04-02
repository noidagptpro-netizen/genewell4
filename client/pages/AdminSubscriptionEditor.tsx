import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Save, Eye, Copy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Plan {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price?: number;
  trial_days: number;
  is_active: boolean;
  sort_order: number;
}

interface Feature {
  id?: string;
  plan_id?: string;
  name: string;
  description?: string;
  icon?: string;
  is_included: boolean;
  sort_order: number;
}

interface FAQ {
  id?: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

interface ComparisonRow {
  id?: string;
  metric: string;
  plan1_value: string;
  plan2_value: string;
  plan3_value: string;
  sort_order: number;
}

interface AddOn {
  id?: string;
  name: string;
  description: string;
  icon?: string;
  price: number;
  is_active: boolean;
  sort_order: number;
}

export default function AdminSubscriptionEditor() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form states
  const [newPlan, setNewPlan] = useState<Plan>({
    name: "",
    slug: "",
    description: "",
    price: 0,
    trial_days: 7,
    is_active: true,
    sort_order: 0,
  });

  const [newFeature, setNewFeature] = useState<Feature>({
    name: "",
    description: "",
    icon: "",
    is_included: true,
    sort_order: 0,
  });

  const [newFAQ, setNewFAQ] = useState<FAQ>({
    question: "",
    answer: "",
    category: "general",
    sort_order: 0,
    is_active: true,
  });

  const [newAddOn, setNewAddOn] = useState<AddOn>({
    name: "",
    description: "",
    price: 0,
    is_active: true,
    sort_order: 0,
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/subscription-data");
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans || []);
        setFeatures(data.features || []);
        setFaqs(data.faqs || []);
        setComparison(data.comparison || []);
        setAddOns(data.addons || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load subscription data");
    }
    setLoading(false);
  };

  // Plan Management
  const handleSavePlan = async () => {
    if (!newPlan.name || !newPlan.slug) {
      toast.error("Plan name and slug are required");
      return;
    }

    const payload = editingPlan ? { ...editingPlan, ...newPlan } : newPlan;

    try {
      const response = await fetch("/api/admin/subscription-plans", {
        method: editingPlan ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          editingPlan ? "Plan updated successfully" : "Plan created successfully"
        );
        loadData();
        setNewPlan({
          name: "",
          slug: "",
          description: "",
          price: 0,
          trial_days: 7,
          is_active: true,
          sort_order: 0,
        });
        setEditingPlan(null);
      }
    } catch (error) {
      toast.error("Failed to save plan");
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/subscription-plans/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Plan deleted");
        loadData();
      }
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  // Feature Management
  const handleSaveFeature = async (planId: string) => {
    if (!newFeature.name) {
      toast.error("Feature name is required");
      return;
    }

    try {
      const response = await fetch("/api/admin/subscription-features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          ...newFeature,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Feature added");
        loadData();
        setNewFeature({
          name: "",
          description: "",
          icon: "",
          is_included: true,
          sort_order: 0,
        });
      }
    } catch (error) {
      toast.error("Failed to save feature");
    }
  };

  // FAQ Management
  const handleSaveFAQ = async () => {
    if (!newFAQ.question || !newFAQ.answer) {
      toast.error("Question and answer are required");
      return;
    }

    try {
      const response = await fetch("/api/admin/subscription-faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFAQ),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("FAQ added");
        loadData();
        setNewFAQ({
          question: "",
          answer: "",
          category: "general",
          sort_order: 0,
          is_active: true,
        });
      }
    } catch (error) {
      toast.error("Failed to save FAQ");
    }
  };

  // AddOn Management
  const handleSaveAddOn = async () => {
    if (!newAddOn.name) {
      toast.error("Add-on name is required");
      return;
    }

    try {
      const response = await fetch("/api/admin/subscription-addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddOn),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Add-on created");
        loadData();
        setNewAddOn({
          name: "",
          description: "",
          price: 0,
          is_active: true,
          sort_order: 0,
        });
      }
    } catch (error) {
      toast.error("Failed to save add-on");
    }
  };

  // Save all changes
  const handlePublish = async () => {
    try {
      const response = await fetch("/api/admin/subscription-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plans,
          features,
          faqs,
          comparison,
          addons: addOns,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Changes published successfully!");
      }
    } catch (error) {
      toast.error("Failed to publish changes");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Subscription Editor
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? "Hide Preview" : "Preview"}
              </Button>
              <Button
                onClick={handlePublish}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Publish Changes
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="addons">Add-Ons</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
          </TabsList>

          {/* PLANS TAB */}
          <TabsContent value="plans" className="space-y-6">
            {/* Create/Edit Plan */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingPlan ? "Edit Plan" : "Create New Plan"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Plan Name *</Label>
                    <Input
                      value={newPlan.name}
                      onChange={(e) =>
                        setNewPlan({ ...newPlan, name: e.target.value })
                      }
                      placeholder="e.g., Pro, Elite, Expert"
                    />
                  </div>
                  <div>
                    <Label>Slug *</Label>
                    <Input
                      value={newPlan.slug}
                      onChange={(e) =>
                        setNewPlan({ ...newPlan, slug: e.target.value })
                      }
                      placeholder="e.g., pro, elite, expert"
                    />
                  </div>
                  <div>
                    <Label>Price (₹)</Label>
                    <Input
                      type="number"
                      value={newPlan.price}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          price: parseFloat(e.target.value),
                        })
                      }
                      placeholder="1999"
                    />
                  </div>
                  <div>
                    <Label>Original Price (₹)</Label>
                    <Input
                      type="number"
                      value={newPlan.original_price || ""}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          original_price: parseFloat(e.target.value),
                        })
                      }
                      placeholder="3999"
                    />
                  </div>
                  <div>
                    <Label>Trial Days</Label>
                    <Input
                      type="number"
                      value={newPlan.trial_days}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          trial_days: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={newPlan.sort_order}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          sort_order: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newPlan.description}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, description: e.target.value })
                    }
                    placeholder="Plan description..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={newPlan.is_active}
                    onCheckedChange={(checked) =>
                      setNewPlan({ ...newPlan, is_active: checked as boolean })
                    }
                  />
                  <Label>Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSavePlan} className="bg-purple-600">
                    <Save className="h-4 w-4 mr-2" />
                    {editingPlan ? "Update Plan" : "Create Plan"}
                  </Button>
                  {editingPlan && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingPlan(null);
                        setNewPlan({
                          name: "",
                          slug: "",
                          description: "",
                          price: 0,
                          trial_days: 7,
                          is_active: true,
                          sort_order: 0,
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plans List */}
            <div className="grid gap-4">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                        <p className="text-gray-600">{plan.description}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>Price: ₹{plan.price}/month</span>
                          <span>Trial: {plan.trial_days} days</span>
                          {plan.is_active ? (
                            <Badge className="bg-green-100 text-green-700">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPlan(plan);
                            setNewPlan(plan);
                          }}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete the plan and all associated
                              features.
                            </AlertDialogDescription>
                            <div className="flex gap-2">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeletePlan(plan.id as string)
                                }
                                className="bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* FEATURES TAB */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Feature to Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Feature Name *</Label>
                    <Input
                      value={newFeature.name}
                      onChange={(e) =>
                        setNewFeature({ ...newFeature, name: e.target.value })
                      }
                      placeholder="e.g., Personalized Blueprint"
                    />
                  </div>
                  <div>
                    <Label>Icon</Label>
                    <Input
                      value={newFeature.icon || ""}
                      onChange={(e) =>
                        setNewFeature({ ...newFeature, icon: e.target.value })
                      }
                      placeholder="FileText, Heart, etc."
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newFeature.description || ""}
                    onChange={(e) =>
                      setNewFeature({
                        ...newFeature,
                        description: e.target.value,
                      })
                    }
                    placeholder="Feature description..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={newFeature.is_included}
                    onCheckedChange={(checked) =>
                      setNewFeature({
                        ...newFeature,
                        is_included: checked as boolean,
                      })
                    }
                  />
                  <Label>Included in Pro Plan</Label>
                </div>

                <Button
                  onClick={() => handleSaveFeature(plans[0]?.id || "")}
                  className="bg-purple-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </CardContent>
            </Card>

            {/* Features List by Plan */}
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name} Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {features
                      .filter((f) => f.plan_id === plan.id)
                      .map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <span className="text-gray-700">{feature.name}</span>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* COMPARISON TAB */}
          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparison Table</CardTitle>
                <CardDescription>
                  Edit metrics for plan comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Metric</th>
                        {plans.slice(0, 3).map((plan) => (
                          <th key={plan.id} className="text-center p-2 font-semibold">
                            {plan.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.map((row, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2 font-semibold">{row.metric}</td>
                          <td className="p-2 text-center">{row.plan1_value}</td>
                          <td className="p-2 text-center">{row.plan2_value}</td>
                          <td className="p-2 text-center">{row.plan3_value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADDONS TAB */}
          <TabsContent value="addons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Add-On</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={newAddOn.name}
                      onChange={(e) =>
                        setNewAddOn({ ...newAddOn, name: e.target.value })
                      }
                      placeholder="e.g., DNA Analysis"
                    />
                  </div>
                  <div>
                    <Label>Price (₹)</Label>
                    <Input
                      type="number"
                      value={newAddOn.price}
                      onChange={(e) =>
                        setNewAddOn({
                          ...newAddOn,
                          price: parseFloat(e.target.value),
                        })
                      }
                      placeholder="999"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newAddOn.description}
                    onChange={(e) =>
                      setNewAddOn({
                        ...newAddOn,
                        description: e.target.value,
                      })
                    }
                    placeholder="Add-on description..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={newAddOn.is_active}
                    onCheckedChange={(checked) =>
                      setNewAddOn({
                        ...newAddOn,
                        is_active: checked as boolean,
                      })
                    }
                  />
                  <Label>Active</Label>
                </div>

                <Button onClick={handleSaveAddOn} className="bg-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Add-On
                </Button>
              </CardContent>
            </Card>

            {/* AddOns List */}
            <div className="grid gap-4">
              {addOns.map((addon) => (
                <Card key={addon.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{addon.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {addon.description}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>Price: ₹{addon.price}</span>
                          {addon.is_active ? (
                            <Badge className="bg-green-100 text-green-700">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* FAQS TAB */}
          <TabsContent value="faqs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add FAQ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Question *</Label>
                  <Input
                    value={newFAQ.question}
                    onChange={(e) =>
                      setNewFAQ({ ...newFAQ, question: e.target.value })
                    }
                    placeholder="e.g., Can I cancel anytime?"
                  />
                </div>

                <div>
                  <Label>Answer *</Label>
                  <Textarea
                    value={newFAQ.answer}
                    onChange={(e) =>
                      setNewFAQ({ ...newFAQ, answer: e.target.value })
                    }
                    placeholder="Answer text..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <select
                    value={newFAQ.category}
                    onChange={(e) =>
                      setNewFAQ({ ...newFAQ, category: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  >
                    <option value="general">General</option>
                    <option value="billing">Billing</option>
                    <option value="features">Features</option>
                    <option value="cancellation">Cancellation</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={newFAQ.is_active}
                    onCheckedChange={(checked) =>
                      setNewFAQ({ ...newFAQ, is_active: checked as boolean })
                    }
                  />
                  <Label>Active</Label>
                </div>

                <Button onClick={handleSaveFAQ} className="bg-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add FAQ
                </Button>
              </CardContent>
            </Card>

            {/* FAQs List */}
            <div className="grid gap-4">
              {faqs.map((faq, idx) => (
                <Card key={idx}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold">{faq.question}</h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {faq.answer}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <Badge variant="outline">{faq.category}</Badge>
                          {faq.is_active ? (
                            <Badge className="bg-green-100 text-green-700">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
