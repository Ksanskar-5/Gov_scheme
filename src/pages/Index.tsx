import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, 
  ArrowRight, 
  GraduationCap, 
  Tractor, 
  Building2, 
  Users, 
  Heart,
  Shield,
  UserCheck,
  Lock,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout/Layout";

const userCategories = [
  { 
    icon: GraduationCap, 
    title: "Students", 
    description: "Scholarships, education loans, skill programs",
    link: "/search?category=Education"
  },
  { 
    icon: Tractor, 
    title: "Farmers", 
    description: "Subsidies, crop insurance, equipment support",
    link: "/search?category=Agriculture"
  },
  { 
    icon: Building2, 
    title: "MSMEs", 
    description: "Business loans, training, market access",
    link: "/search?category=Business+%26+MSME"
  },
  { 
    icon: Users, 
    title: "Workers", 
    description: "Pension, insurance, skill development",
    link: "/search?category=Social+Security"
  },
  { 
    icon: Heart, 
    title: "Families in Need", 
    description: "Housing, healthcare, social security",
    link: "/search?category=Social+Security"
  }
];

const howItWorks = [
  {
    step: 1,
    title: "Tell us about yourself",
    description: "Share basic details like age, state, profession, and income. All data stays private."
  },
  {
    step: 2,
    title: "AI finds best schemes",
    description: "Our AI matches your profile with 1000+ government schemes across India."
  },
  {
    step: 3,
    title: "Apply with guidance",
    description: "Get step-by-step help to complete your application successfully."
  }
];

const trustIndicators = [
  { icon: Shield, title: "Government Data", description: "Direct from official sources" },
  { icon: UserCheck, title: "No Middlemen", description: "Apply directly, save money" },
  { icon: Lock, title: "Privacy First", description: "Your data is never shared" }
];

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        
        <div className="container-gov relative">
          <div className="py-16 md:py-24 lg:py-32 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              <span>AI-powered scheme discovery</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-in">
              Find government schemes you're{" "}
              <span className="text-gradient">actually eligible</span> for
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto animate-fade-in">
              Personalized. Simple. No agents. Discover and apply for 1000+ central & state schemes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up">
              <Link to="/profile" className="btn-hero">
                Check my eligibility
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/search" className="btn-hero-outline">
                Browse all schemes
              </Link>
            </div>

            {/* Natural Language Search */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto animate-slide-up">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search in your own words... e.g., 'my father died during construction work'"
                  className="pl-12 pr-4 h-14 text-base bg-card border-0 shadow-gov-lg rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search government schemes in natural language"
                />
                <Button 
                  type="submit" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent hover:bg-accent/90"
                >
                  Search
                </Button>
              </div>
              <p className="text-primary-foreground/60 text-sm mt-3">
                Try: "education loan for engineering" or "housing scheme for EWS"
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-background">
        <div className="container-gov">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              How JanScheme Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Three simple steps to find and apply for schemes you deserve
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative text-center">
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 relative z-10">
                  <span className="text-2xl font-bold text-accent">{item.step}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="section-padding" style={{ background: 'var(--gradient-subtle)' }}>
        <div className="container-gov">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Who Can Benefit?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Find schemes tailored for your situation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {userCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.title}
                  to={category.link}
                  className="group p-6 bg-card rounded-xl border border-border card-hover text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                    <Icon className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="section-padding bg-background">
        <div className="container-gov">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {trustIndicators.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-4 p-6 bg-card rounded-xl border border-border">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary">
        <div className="container-gov text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Don't miss out on benefits you deserve
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Create your profile now and get personalized scheme recommendations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/profile" className="btn-hero inline-flex items-center justify-center">
                Get Started — It's Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-4 text-primary-foreground/60 text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                No signup required
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                100% free
              </span>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
