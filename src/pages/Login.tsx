import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, ArrowRight, Shield } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (type: "email" | "phone") => {
    if (!consentGiven) {
      toast.error("Please accept the data usage consent");
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setOtpSent(true);
    setIsLoading(false);
    toast.success(`OTP sent to your ${type}`);
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    toast.success("Login successful!");
    window.location.href = "/dashboard";
  };

  return (
    <Layout>
      <div className="container-gov section-padding max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">जन</span>
            </div>
            <CardTitle className="text-2xl">Welcome to JanScheme</CardTitle>
            <CardDescription>
              Login to get personalized scheme recommendations
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="phone" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="phone" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="w-16 flex items-center justify-center bg-muted rounded-md border border-input text-sm">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      disabled={otpSent}
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="6-digit OTP"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    />
                    <button 
                      className="text-sm text-primary hover:underline"
                      onClick={() => handleSendOtp("phone")}
                    >
                      Resend OTP
                    </button>
                  </div>
                )}

                <Button 
                  className="w-full bg-accent hover:bg-accent/90"
                  disabled={isLoading || phone.length !== 10 || (otpSent && otp.length !== 6)}
                  onClick={() => otpSent ? handleVerifyOtp() : handleSendOtp("phone")}
                >
                  {isLoading ? "Please wait..." : otpSent ? "Verify & Login" : "Send OTP"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={otpSent}
                  />
                </div>

                {otpSent && (
                  <div className="space-y-2">
                    <Label htmlFor="emailOtp">Enter OTP</Label>
                    <Input
                      id="emailOtp"
                      type="text"
                      placeholder="6-digit OTP"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    />
                    <button 
                      className="text-sm text-primary hover:underline"
                      onClick={() => handleSendOtp("email")}
                    >
                      Resend OTP
                    </button>
                  </div>
                )}

                <Button 
                  className="w-full bg-accent hover:bg-accent/90"
                  disabled={isLoading || !email.includes("@") || (otpSent && otp.length !== 6)}
                  onClick={() => otpSent ? handleVerifyOtp() : handleSendOtp("email")}
                >
                  {isLoading ? "Please wait..." : otpSent ? "Verify & Login" : "Send OTP"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </TabsContent>
            </Tabs>

            {/* Consent Checkbox */}
            <div className="mt-6 flex items-start gap-3">
              <Checkbox 
                id="consent" 
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
              />
              <label htmlFor="consent" className="text-sm text-muted-foreground cursor-pointer">
                I consent to JanScheme using my data to provide personalized scheme recommendations. 
                My data will not be shared with third parties.{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Trust Badge */}
            <div className="mt-6 p-4 rounded-lg bg-success/5 border border-success/20 flex items-start gap-3">
              <Shield className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Your data is secure</p>
                <p className="text-muted-foreground">
                  We use industry-standard encryption. No Aadhaar required.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <span className="text-foreground">Your account will be created automatically on first login.</span>
        </p>
      </div>
    </Layout>
  );
}
