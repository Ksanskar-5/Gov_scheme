import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserCircle,
  Search,
  Bookmark,
  Bell,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/authContext";
import { getPersonalizedRecommendations, getSavedSchemes, type SchemeWithScore, type Scheme } from "@/lib/api";

interface SavedScheme {
  schemeId: number;
  status: string;
  notes: string | null;
  savedAt: string;
  scheme: Scheme;
}

const alerts = [
  { id: 1, type: "deadline", message: "Complete your profile for personalized recommendations", scheme: "Profile" },
  { id: 2, type: "info", message: "Explore schemes based on your eligibility", scheme: "Search" }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: authLoading, user, profile, profileId } = useAuth();

  const [recommendations, setRecommendations] = useState<SchemeWithScore[]>([]);
  const [savedSchemes, setSavedSchemes] = useState<SavedScheme[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(true);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [authLoading, isLoggedIn, navigate]);

  // Load recommendations based on profile
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!profileId) {
        setIsLoadingRecs(false);
        return;
      }

      try {
        const result = await getPersonalizedRecommendations(profileId, 10);

        if (result.success && result.data) {
          setRecommendations(result.data.slice(0, 5));
        }
      } catch (error) {
        console.error("Error loading recommendations:", error);
      } finally {
        setIsLoadingRecs(false);
      }
    };

    if (!authLoading && isLoggedIn && profileId) {
      loadRecommendations();
    } else if (!authLoading && isLoggedIn && !profileId) {
      // No profile yet, stop loading
      setIsLoadingRecs(false);
    }
  }, [profileId, authLoading, isLoggedIn]);

  // Load saved schemes
  useEffect(() => {
    const loadSavedSchemes = async () => {
      if (!profileId) {
        setIsLoadingSaved(false);
        return;
      }

      try {
        const result = await getSavedSchemes(profileId);
        if (result.success && result.data) {
          setSavedSchemes(result.data);
        }
      } catch (error) {
        console.error("Error loading saved schemes:", error);
      } finally {
        setIsLoadingSaved(false);
      }
    };

    if (!authLoading && isLoggedIn && profileId) {
      loadSavedSchemes();
    }
  }, [profileId, authLoading, isLoggedIn]);

  // Calculate profile completeness
  const calculateCompleteness = () => {
    if (!profile) return 0;
    const fields = [
      profile.name,
      profile.age,
      profile.gender,
      profile.state,
      profile.profession,
      profile.incomeRange,
      profile.category
    ];
    const filled = fields.filter(v => v !== undefined && v !== null && v !== "").length;
    return Math.round((filled / fields.length) * 100);
  };

  const profileCompleteness = calculateCompleteness();

  if (authLoading) {
    return (
      <Layout>
        <div className="container-gov section-padding">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-gov section-padding">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome back{profile?.name ? `, ${profile.name}` : ""}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's your personalized scheme dashboard
          </p>
          {user && (
            <p className="text-sm text-muted-foreground mt-1">
              {user.email}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Completeness */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {profileCompleteness === 100 ? "Profile Complete!" : "Complete Your Profile"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {profileCompleteness === 100
                          ? "You're getting the best recommendations"
                          : "Get better scheme recommendations"}
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-accent">{profileCompleteness}%</span>
                </div>
                <Progress value={profileCompleteness} className="h-2 mb-4" />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {profileCompleteness < 100
                      ? "Add more details for accurate matches"
                      : "Your profile is fully optimized"}
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/profile">
                      {profileCompleteness === 100 ? "View Profile" : "Complete Profile"}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Schemes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Recommended for You
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/search">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingRecs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((scheme) => (
                      <Link
                        key={scheme.id}
                        to={`/scheme/${scheme.slug || scheme.id}`}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground">{scheme.name}</h4>
                            {scheme.eligibilityStatus === "eligible" && (
                              <span className="bg-success/10 text-success px-2 py-0.5 rounded text-xs">
                                Eligible
                              </span>
                            )}
                            {scheme.eligibilityStatus === "possibly_eligible" && (
                              <span className="bg-warning/10 text-warning px-2 py-0.5 rounded text-xs">
                                Likely Eligible
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {scheme.benefits || scheme.details}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{scheme.category}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{scheme.level}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 ml-4" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      {profile ? "No recommendations yet. Try exploring schemes." : "Complete your profile to get personalized recommendations."}
                    </p>
                    <Button asChild variant="outline">
                      <Link to={profile ? "/search" : "/profile"}>
                        {profile ? "Explore Schemes" : "Complete Profile"}
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Schemes (Recently Viewed alternative) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                  Saved Schemes
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/my-schemes">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingSaved ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  </div>
                ) : savedSchemes.length > 0 ? (
                  <div className="space-y-3">
                    {savedSchemes.slice(0, 3).map((saved) => (
                      <Link
                        key={saved.schemeId}
                        to={`/scheme/${saved.scheme?.slug || saved.schemeId}`}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{saved.scheme?.name || `Scheme #${saved.schemeId}`}</h4>
                          <p className="text-sm text-muted-foreground">{saved.scheme?.category}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${saved.status === 'applied' ? 'bg-success/10 text-success' :
                          saved.status === 'completed' ? 'bg-primary/10 text-primary' :
                            'bg-muted text-muted-foreground'
                          }`}>
                          {saved.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No saved schemes yet</p>
                    <Button asChild variant="outline">
                      <Link to="/search">Explore Schemes</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/search">
                    <Search className="h-4 w-4 mr-2" />
                    Search Schemes
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/my-schemes">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Saved Schemes
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/profile">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Update Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Alerts & Reminders */}
            {profileCompleteness < 100 && (
              <Card className="border-warning/20">
                <CardHeader className="bg-warning/5">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-warning" />
                    Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 rounded-lg bg-warning/5 border border-warning/20"
                      >
                        <p className="text-sm text-foreground">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-accent">{recommendations.length}</p>
                  <p className="text-xs text-muted-foreground">Recommended</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{savedSchemes.length}</p>
                  <p className="text-xs text-muted-foreground">Saved Schemes</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
