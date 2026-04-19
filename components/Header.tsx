import Link from "next/link";

export const Header = () => {
  return (
    <header className="w-full bg-pure-white border-b border-smoke-gray">
      <div className="max-w-275 mx-auto px-xs flex items-center justify-between h-14">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-xxxs group">
          <div className="w-8 h-8 bg-primary-yellow rounded-xs flex items-center justify-center">
            <span className="text-forest-dark font-bold text-lg">C</span>
          </div>
          <span className="text-section-heading font-semibold text-forest-dark tracking-tight">
            CounselCoach
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-md">
          <Link
            href="/about"
            className="text-small-text font-semibold text-forest-medium hover:text-forest-dark transition-colors"
          >
            About
          </Link>
          <Link
            href="/pricing"
            className="text-small-text font-semibold text-forest-medium hover:text-forest-dark transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/#patient-selector"
            scroll={true}
            className="bg-primary-yellow text-forest-dark px-sm py-xxxs rounded-radius-md font-semibold text-small-text hover:brightness-95 transition-all rounded-3xl"
          >
            Practice Now
          </Link>
        </nav>
      </div>
    </header>
  );
};
