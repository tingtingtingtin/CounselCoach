export function HeroSection() {
  function scrollToSelector() {
    document
      .getElementById("patient-selector")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="text-center py-xl w-full bg-background">
      <h1 className="text-5xl font-normal text-forest-dark leading-tight tracking-tight">
        Practice before the
        <br />
        session that <strong>matters</strong>.
      </h1>
      <p className="text-xl font-normal text-forest-medium mt-sm max-w-3xl mx-auto leading-relaxed">
        Roleplay with an AI patient. Get real-time response suggestions. Review
        your approach after every session.
      </p>
      <button
        onClick={scrollToSelector}
        className="mt-lg px-sm py-xxs rounded-circle bg-primary-yellow text-forest-dark font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity"
      >
        Get Started
      </button>
    </section>
  );
}
