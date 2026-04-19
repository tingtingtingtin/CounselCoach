import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="w-full bg-primary-yellow/90 mt-auto">
      <div className="max-w-275 mx-auto px-xs py-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-xxs">
            <span className="text-section-heading font-semibold text-forest-dark tracking-tight">
              CounselCoach
            </span>
            <p className="text-small-text text-forest-dark/80 max-w-75 leading-relaxed">
              Empowering the next generation of therapists through immersive,
              AI-driven clinical simulations.
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="flex flex-col gap-xxs">
            <h4 className="text-small-text font-bold text-forest-dark uppercase tracking-wider">
              Platform
            </h4>
            <nav className="flex flex-col gap-xxxs">
              <Link
                href="/scenarios"
                className="text-small-text text-forest-dark hover:underline"
              >
                Scenarios
              </Link>
              <Link
                href="/pricing"
                className="text-small-text text-forest-dark hover:underline"
              >
                Pricing
              </Link>
              <Link
                href="/faq"
                className="text-small-text text-forest-dark hover:underline"
              >
                Resources
              </Link>
            </nav>
          </div>

          {/* Links Column 2 */}
          <div className="flex flex-col gap-xxs">
            <h4 className="text-small-text font-bold text-forest-dark uppercase tracking-wider">
              Legal
            </h4>
            <nav className="flex flex-col gap-xxxs">
              <Link
                href="/privacy"
                className="text-small-text text-forest-dark hover:underline"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-small-text text-forest-dark hover:underline"
              >
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-lg pt-xs border-t border-forest-dark/10 flex flex-col md:flex-row justify-between items-center gap-xxs">
          <p className="text-small-text text-forest-dark/60">
            © {new Date().getFullYear()} CounselCoach. Roleplay content is
            AI-generated. None of the observations are clinically-backed advice.
            Always use your own discretion.
          </p>
        </div>
      </div>
    </footer>
  );
};
