/**
 * =========================================================================
 * Footer.jsx - Application Footer
 * =========================================================================
 * Footer section with company info, links, and legal information.
 */

import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-c24-primary-deep text-white py-12 border-t border-c24-primary-medium mt-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: About */}
          <div>
            <h4 className="text-c24-highlight-yellow font-bold text-c24-base mb-4">About Check24</h4>
            <ul className="space-y-2">
              <li><a href="#company" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Our Company</a></li>
              <li><a href="#careers" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Careers</a></li>
              <li><a href="#press" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Press</a></li>
              <li><a href="#blog" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Column 2: Services */}
          <div>
            <h4 className="text-c24-highlight-yellow font-bold text-c24-base mb-4">Services</h4>
            <ul className="space-y-2">
              <li><a href="#insurance" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Insurance Comparison</a></li>
              <li><a href="#mortgages" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Mortgages</a></li>
              <li><a href="#energy" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Energy</a></li>
              <li><a href="#travel" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Travel</a></li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h4 className="text-c24-highlight-yellow font-bold text-c24-base mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#help" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Help Center</a></li>
              <li><a href="#contact" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Contact Us</a></li>
              <li><a href="#faq" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">FAQ</a></li>
              <li><a href="#feedback" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Feedback</a></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="text-c24-highlight-yellow font-bold text-c24-base mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#privacy" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Terms of Service</a></li>
              <li><a href="#cookies" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Cookie Policy</a></li>
              <li><a href="#disclaimer" className="text-white/80 text-c24-sm hover:text-c24-highlight-yellow transition-colors">Disclaimer</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-white/70 text-c24-sm">&copy; {currentYear} CHECK24. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#facebook" aria-label="Facebook" className="text-white/70 font-bold hover:text-c24-highlight-yellow transition-colors">f</a>
            <a href="#twitter" aria-label="Twitter" className="text-white/70 font-bold hover:text-c24-highlight-yellow transition-colors">𝕏</a>
            <a href="#linkedin" aria-label="LinkedIn" className="text-white/70 font-bold hover:text-c24-highlight-yellow transition-colors">in</a>
          </div>
        </div>
      </div>
    </footer>
  );
}