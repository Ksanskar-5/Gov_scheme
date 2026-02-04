import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserCircle,
  Search,
  Bookmark,
  Bell,
  ArrowRight,
  Clock,
  FileText,
  TrendingUp,
  Loader2
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import {
  getSavedSchemes,
  getPersonalizedRecommendations,
  getUserProfile,
  type Scheme,
  type SchemeWithScore,
  type UserProfile
} from "@/lib/api";
import { calculateProfileCompleteness } from "@/lib/profileUtils";

interface SavedSchemeData {
  schemeId: number;
  status: string;
  notes: string | null;
  savedAt: string;
  scheme: Scheme;
}

// Static alerts for now (could be fetched from API later)
const staticAlerts = [
  { id: 1, type: "info", message: "Complete your profile for better recommendations", scheme: "Profile" },
];

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State for API data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedSchemes, setSavedSchemes] = useState<SavedSchemeData[]>([]);
  const [recommendations, setRecommendations] = useState<SchemeWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate profile completeness using shared utility
  const profileCompleteness = calculateProfileCompleteness(profile);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch all data in parallel
        const [profileRes, savedRes, recsRes] = await Promise.all([
          getUserProfile(user.id),
          getSavedSchemes(user.id),
          getPersonalizedRecommendations(user.id, 5),
        ]);

        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        }

        if (savedRes.success && savedRes.data) {
          setSavedSchemes(savedRes.data);
        }

        if (recsRes.success && recsRes.data) {
          setRecommendations(recsRes.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated && user?.id) {
      fetchDashboardData();
    }
  }, [user?.id, isAuthenticated]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Show loading while auth is resolving
  if (authLoading) {
    return (
      <Layout>
        <div className="container-gov section-padding flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Get display name
  const displayName = profile?.name || user?.name || user?.email?.split('@')[0] || 'User';

  // Get alerts - add profile incomplete alert if needed
  const alerts = profileCompleteness < 100
    ? staticAlerts
    : [];

  return (
    <Layout>
      <div className="container-gov section-padding">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's your personalized scheme dashboard
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

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
                      <h3 className="font-semibold text-foreground">Complete Your Profile</h3>
                      <p className="text-sm text-muted-foreground">Get better scheme recommendations</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-accent">{profileCompleteness}%</span>
                </div>
                <Progress value={profileCompleteness} className="h-2 mb-4" />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {profileCompleteness < 100
                      ? "Add more details for accurate matches"
                      : "Your profile is complete!"}
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/profile">
                      {profileCompleteness < 100 ? "Complete Profile" : "View Profile"}
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
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.slice(0, 5).map((scheme) => (
                      <Link
                        key={scheme.id}
                        to={`/scheme/${scheme.slug || scheme.id}`}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground">{scheme.name}</h4>
                            {scheme.eligibilityStatus === 'eligible' && (
                              <span className="badge-eligible text-xs">Eligible</span>
                            )}
                            {scheme.eligibilityStatus === 'possibly_eligible' && (
                              <span className="badge-possibly text-xs">Possibly Eligible</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {scheme.details?.substring(0, 100) || scheme.category}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 ml-4" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Complete your profile to get personalized recommendations</p>
                    <Button asChild variant="outline" size="sm" className="mt-3">
                      <Link to="/profile">Complete Profile</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Schemes (replacing Recently Viewed) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                  My Saved Schemes
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/my-schemes">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
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
                          <h4 className="font-medium text-foreground truncate">
                            {saved.scheme?.name || `Scheme #${saved.schemeId}`}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {saved.status === 'saved' && 'Saved'}
                            {saved.status === 'applied' && '📋 Applied'}
                            {saved.status === 'completed' && '✅ Completed'}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Bookmark className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No saved schemes yet</p>
                    <Button asChild variant="outline" size="sm" className="mt-3">
                      <Link to="/search">Browse Schemes</Link>
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
            {alerts.length > 0 && (
              <Card className="border-warning/20">
                <CardHeader className="bg-warning/5">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-warning" />
                    Reminders
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
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-accent">{recommendations.length}</p>
                      <p className="text-xs text-muted-foreground">Recommended</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-primary">{savedSchemes.length}</p>
                      <p className="text-xs text-muted-foreground">Saved Schemes</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
