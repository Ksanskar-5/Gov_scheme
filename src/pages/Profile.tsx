import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Briefcase,
  IndianRupee,
  HelpCircle,
  Save,
  CheckCircle2,
  LogOut
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
import { Checkbox } from "@/components/ui/checkbox";
import { states } from "@/data/mockSchemes";
import { toast } from "sonner";
import { useAuth } from "@/context/authContext";
import { getUserProfile, updateUserProfile, createUserProfile } from "@/lib/api";

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
  { value: "below_1lakh", label: "Below ₹1 lakh" },
  { value: "1lakh_2.5lakh", label: "₹1-2.5 lakh" },
  { value: "2.5lakh_5lakh", label: "₹2.5-5 lakh" },
  { value: "5lakh_10lakh", label: "₹5-10 lakh" },
  { value: "above_10lakh", label: "Above ₹10 lakh" }
];

const categories = [
  { value: "general", label: "General" },
  { value: "obc", label: "OBC" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
  { value: "ews", label: "EWS" }
];

interface FormData {
  fullName: string;
  age: string;
  gender: string;
  state: string;
  district: string;
  profession: string;
  incomeRange: string;
  category: string;
  isDisabled: boolean;
  isMinority: boolean;
  isBPL: boolean;
  isStudent: boolean;
  isFarmer: boolean;
  isBusinessOwner: boolean;
  isWorker: boolean;
  isWidow: boolean;
  isSeniorCitizen: boolean;
}

export default function Profile() {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: authLoading, user, profileId, logout, refreshProfile } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    age: "",
    gender: "",
    state: "",
    district: "",
    profession: "",
    incomeRange: "",
    category: "",
    isDisabled: false,
    isMinority: false,
    isBPL: false,
    isStudent: false,
    isFarmer: false,
    isBusinessOwner: false,
    isWorker: false,
    isWidow: false,
    isSeniorCitizen: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [authLoading, isLoggedIn, navigate]);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (profileId) {
        try {
          const result = await getUserProfile(profileId);
          if (result.success && result.data) {
            const profile = result.data;
            setFormData({
              fullName: profile.name || "",
              age: profile.age?.toString() || "",
              gender: profile.gender || "",
              state: profile.state || "",
              district: profile.district || "",
              profession: profile.profession || "",
              incomeRange: profile.incomeRange || "",
              category: profile.category || "",
              isDisabled: profile.isDisabled || false,
              isMinority: profile.isMinority || false,
              isBPL: profile.isBPL || false,
              isStudent: profile.isStudent || false,
              isFarmer: profile.isFarmer || false,
              isBusinessOwner: profile.isBusinessOwner || false,
              isWorker: profile.isWorker || false,
              isWidow: profile.isWidow || false,
              isSeniorCitizen: profile.isSeniorCitizen || false
            });
          }
        } catch (error) {
          console.error("Error loading profile:", error);
        }
      }
      setIsLoadingProfile(false);
    };

    if (!authLoading && isLoggedIn) {
      loadProfile();
    }
  }, [profileId, authLoading, isLoggedIn]);

  const calculateCompleteness = () => {
    const requiredFields = [
      formData.fullName,
      formData.age,
      formData.gender,
      formData.state,
      formData.profession,
      formData.incomeRange,
      formData.category
    ];
    const filled = requiredFields.filter(v => v !== "").length;
    return Math.round((filled / requiredFields.length) * 100);
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const profilePayload = {
        name: formData.fullName,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender as 'male' | 'female' | 'other' | undefined,
        state: formData.state,
        district: formData.district,
        profession: formData.profession,
        incomeRange: formData.incomeRange,
        category: formData.category as 'general' | 'obc' | 'sc' | 'st' | 'ews' | undefined,
        isDisabled: formData.isDisabled,
        isMinority: formData.isMinority,
        isBPL: formData.isBPL,
        isStudent: formData.isStudent,
        isFarmer: formData.isFarmer,
        isBusinessOwner: formData.isBusinessOwner,
        isWorker: formData.isWorker,
        isWidow: formData.isWidow,
        isSeniorCitizen: formData.isSeniorCitizen
      };

      let result;
      if (profileId) {
        result = await updateUserProfile(profileId, profilePayload);
      } else {
        result = await createUserProfile(profilePayload);
      }

      if (result.success) {
        toast.success("Profile saved successfully!", {
          description: "Your eligibility will be recalculated."
        });
        await refreshProfile();
      } else {
        toast.error(result.error || "Failed to save profile");
      }
    } catch (error) {
      toast.error("An error occurred while saving profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const completeness = calculateCompleteness();

  if (authLoading || isLoadingProfile) {
    return (
      <Layout>
        <div className="container-gov section-padding max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-gov section-padding max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Your Profile
            </h1>
            <p className="text-muted-foreground">
              Complete your profile for accurate scheme recommendations.
            </p>
            {user && (
              <p className="text-sm text-muted-foreground mt-1">
                Logged in as: <span className="font-medium text-foreground">{user.email}</span>
              </p>
            )}
          </div>
          <Button variant="outline" onClick={handleLogout} className="self-start sm:self-auto">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
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
                    value={formData.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    min="1"
                    max="120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleChange("gender", value)}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="flex items-center gap-1">
                    Category
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Many schemes have reservations based on category</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange("category", value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
                  State and district information for state-specific schemes
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleChange("state", value)}
                  >
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District (Optional)</Label>
                  <Input
                    id="district"
                    placeholder="Enter your district"
                    value={formData.district}
                    onChange={(e) => handleChange("district", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Occupation & Income */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Occupation & Income
                </CardTitle>
                <CardDescription>
                  Many schemes are targeted at specific professions or income groups
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="profession">Profession</Label>
                  <Select
                    value={formData.profession}
                    onValueChange={(value) => handleChange("profession", value)}
                  >
                    <SelectTrigger id="profession">
                      <SelectValue placeholder="Select profession" />
                    </SelectTrigger>
                    <SelectContent>
                      {professions.map(prof => (
                        <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income" className="flex items-center gap-1">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Annual Income
                  </Label>
                  <Select
                    value={formData.incomeRange}
                    onValueChange={(value) => handleChange("incomeRange", value)}
                  >
                    <SelectTrigger id="income">
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                    <SelectContent>
                      {incomeRanges.map(range => (
                        <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Additional Criteria */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Additional Criteria
                </CardTitle>
                <CardDescription>
                  Select any that apply to get more relevant recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isDisabled"
                      checked={formData.isDisabled}
                      onCheckedChange={(checked) => handleChange("isDisabled", !!checked)}
                    />
                    <label htmlFor="isDisabled" className="text-sm cursor-pointer">
                      Person with Disability
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isMinority"
                      checked={formData.isMinority}
                      onCheckedChange={(checked) => handleChange("isMinority", !!checked)}
                    />
                    <label htmlFor="isMinority" className="text-sm cursor-pointer">
                      Minority Community
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isBPL"
                      checked={formData.isBPL}
                      onCheckedChange={(checked) => handleChange("isBPL", !!checked)}
                    />
                    <label htmlFor="isBPL" className="text-sm cursor-pointer">
                      Below Poverty Line (BPL)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isStudent"
                      checked={formData.isStudent}
                      onCheckedChange={(checked) => handleChange("isStudent", !!checked)}
                    />
                    <label htmlFor="isStudent" className="text-sm cursor-pointer">
                      Student
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFarmer"
                      checked={formData.isFarmer}
                      onCheckedChange={(checked) => handleChange("isFarmer", !!checked)}
                    />
                    <label htmlFor="isFarmer" className="text-sm cursor-pointer">
                      Farmer
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isBusinessOwner"
                      checked={formData.isBusinessOwner}
                      onCheckedChange={(checked) => handleChange("isBusinessOwner", !!checked)}
                    />
                    <label htmlFor="isBusinessOwner" className="text-sm cursor-pointer">
                      Business Owner
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isWorker"
                      checked={formData.isWorker}
                      onCheckedChange={(checked) => handleChange("isWorker", !!checked)}
                    />
                    <label htmlFor="isWorker" className="text-sm cursor-pointer">
                      Daily Wage Worker
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isWidow"
                      checked={formData.isWidow}
                      onCheckedChange={(checked) => handleChange("isWidow", !!checked)}
                    />
                    <label htmlFor="isWidow" className="text-sm cursor-pointer">
                      Widow
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isSeniorCitizen"
                      checked={formData.isSeniorCitizen}
                      onCheckedChange={(checked) => handleChange("isSeniorCitizen", !!checked)}
                    />
                    <label htmlFor="isSeniorCitizen" className="text-sm cursor-pointer">
                      Senior Citizen (60+)
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/90"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
