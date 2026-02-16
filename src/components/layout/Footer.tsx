import { Link } from "react-router-dom";
import { Shield, Mail, Phone, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground relative">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-warning to-accent" />

      <div className="container-gov section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-primary-foreground/10 flex items-center justify-center backdrop-blur-sm border border-primary-foreground/10">
                <span className="font-bold text-lg">जन</span>
              </div>
              <span className="font-semibold text-lg">JanScheme</span>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Helping citizens discover and access government schemes with personalized recommendations.
              No middlemen. No confusion.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/search" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Browse All Schemes
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Check My Eligibility
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.india.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors inline-flex items-center gap-1"
                >
                  India.gov.in
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.myscheme.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors inline-flex items-center gap-1"
                >
                  MyScheme Portal
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <Link to="/faq" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-primary-foreground/80">
                <Mail className="h-4 w-4 shrink-0" />
                <span>support@janscheme.in</span>
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/80">
                <Phone className="h-4 w-4 shrink-0" />
                <span>1800-XXX-XXXX (Toll Free)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Trust & Privacy */}
            <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <Shield className="h-4 w-4" />
              <span>Your data is secure. We never share personal information.</span>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/privacy" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Terms of Use
              </Link>
              <Link to="/disclaimer" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Disclaimer
              </Link>
            </div>
          </div>

          {/* Copyright & Data Source */}
          <div className="mt-6 text-center text-xs text-primary-foreground/60">
            <p>© {new Date().getFullYear()} JanScheme. Data sourced from official government portals.</p>
            <p className="mt-1">
              This is an advisory platform. For official scheme details, please visit respective government websites.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
