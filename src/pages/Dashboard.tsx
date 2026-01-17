import { Link } from "react-router-dom";
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
import { mockSchemes } from "@/data/mockSchemes";

const recentlyViewed = mockSchemes.slice(0, 3);
const recommendedSchemes = mockSchemes.filter(s => s.eligibility.status === "eligible").slice(0, 3);

const alerts = [
  { id: 1, type: "deadline", message: "PM-KISAN registration deadline in 5 days", scheme: "PM-KISAN" },
  { id: 2, type: "document", message: "Upload income certificate for PMAY", scheme: "PMAY-Urban" }
];

export default function Dashboard() {
  const profileCompleteness = 65;

  return (
    <Layout>
      <div className="container-gov section-padding">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's your personalized scheme dashboard
          </p>
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
                      <h3 className="font-semibold text-foreground">Complete Your Profile</h3>
                      <p className="text-sm text-muted-foreground">Get better scheme recommendations</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-accent">{profileCompleteness}%</span>
                </div>
                <Progress value={profileCompleteness} className="h-2 mb-4" />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Add income details for more accurate matches
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/profile">
                      Complete Profile
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
                <div className="space-y-4">
                  {recommendedSchemes.map((scheme) => (
                    <Link 
                      key={scheme.id}
                      to={`/scheme/${scheme.id}`}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">{scheme.name}</h4>
                          <span className="badge-eligible text-xs">Eligible</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {scheme.shortDescription}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 ml-4" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recently Viewed */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Recently Viewed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentlyViewed.map((scheme) => (
                    <Link 
                      key={scheme.id}
                      to={`/scheme/${scheme.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{scheme.name}</h4>
                        <p className="text-sm text-muted-foreground">{scheme.category}</p>
                      </div>
                    </Link>
                  ))}
                </div>
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
            <Card className="border-warning/20">
              <CardHeader className="bg-warning/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-warning" />
                  Alerts & Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id}
                        className="p-3 rounded-lg bg-warning/5 border border-warning/20"
                      >
                        <p className="text-sm text-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Related: {alert.scheme}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No alerts at the moment
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-accent">12</p>
                  <p className="text-xs text-muted-foreground">Eligible Schemes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">3</p>
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
