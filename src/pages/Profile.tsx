import { useState } from "react";
import { 
  User, 
  MapPin, 
  Briefcase, 
  IndianRupee,
  HelpCircle,
  Save,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { states } from "@/data/mockSchemes";
import { toast } from "sonner";

const professions = [
  "Farmer",
  "Self-employed",
  "Salaried Employee",
  "Business Owner",
  "Student",
  "Homemaker",
  "Daily Wage Worker",
  "Artisan / Craftsperson",
  "Other"
];

const incomeRanges = [
  "Below ₹1 lakh",
  "₹1-3 lakh",
  "₹3-5 lakh",
  "₹5-8 lakh",
  "₹8-12 lakh",
  "Above ₹12 lakh"
];

const categories = [
  "General",
  "OBC",
  "SC",
  "ST",
  "EWS",
  "Prefer not to say"
];

export default function Profile() {
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    gender: "",
    state: "",
    district: "",
    profession: "",
    incomeRange: "",
    category: ""
  });

  const [isSaving, setIsSaving] = useState(false);

  const calculateCompleteness = () => {
    const fields = Object.values(formData);
    const filled = fields.filter(v => v !== "").length;
    return Math.round((filled / fields.length) * 100);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Profile saved successfully!", {
      description: "Your eligibility will be recalculated."
    });
  };

  const completeness = calculateCompleteness();

  return (
    <Layout>
      <div className="container-gov section-padding max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Your Profile
          </h1>
          <p className="text-muted-foreground">
            Complete your profile for accurate scheme recommendations. Your data is private and secure.
          </p>
        </div>

        {/* Progress Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Profile Completeness</h3>
                <p className="text-sm text-muted-foreground">
                  {completeness === 100 
                    ? "Great! Your profile is complete." 
                    : "Complete your profile for better matches"
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent">{completeness}%</span>
                {completeness === 100 && (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                )}
              </div>
            </div>
            <Progress value={completeness} className="h-2" />
          </CardContent>
        </Card>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  This helps us match you with relevant schemes
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Your age"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="category">Category / Caste</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>This helps identify schemes specifically designed for your community. Optional but recommended.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={formData.category} onValueChange={(v) => handleChange("category", v)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat.toLowerCase().replace(/\s/g, '-')}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
                <CardDescription>
                  State-specific schemes need your location
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={formData.state} onValueChange={(v) => handleChange("state", v)}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.filter(s => s !== "All India").map((state) => (
                        <SelectItem key={state} value={state.toLowerCase().replace(/\s/g, '-')}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    placeholder="Enter your district"
                    value={formData.district}
                    onChange={(e) => handleChange("district", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Employment & Income */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Employment & Income
                </CardTitle>
                <CardDescription>
                  Many schemes have income-based eligibility
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="profession">Profession</Label>
                  <Select value={formData.profession} onValueChange={(v) => handleChange("profession", v)}>
                    <SelectTrigger id="profession">
                      <SelectValue placeholder="Select profession" />
                    </SelectTrigger>
                    <SelectContent>
                      {professions.map((prof) => (
                        <SelectItem key={prof} value={prof.toLowerCase().replace(/\s/g, '-')}>
                          {prof}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="incomeRange">Annual Family Income</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Total annual income of all earning members in your household. This is crucial for BPL and EWS schemes.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={formData.incomeRange} onValueChange={(v) => handleChange("incomeRange", v)}>
                    <SelectTrigger id="incomeRange">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      {incomeRanges.map((range) => (
                        <SelectItem key={range} value={range.toLowerCase().replace(/[₹\s]/g, '')}>
                          {range}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-check Eligibility
              </Button>
              <Button 
                type="submit" 
                className="bg-accent hover:bg-accent/90"
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>
        </form>

        {/* Privacy Notice */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            🔒 Your data is encrypted and never shared with third parties. 
            We only use it to find relevant government schemes for you.
          </p>
        </div>
      </div>
    </Layout>
  );
}
