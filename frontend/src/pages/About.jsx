const About = () => (
  <div className="container-px mx-auto max-w-[900px] py-16 sm:py-24" data-testid="about-page">
    <p className="overline text-muted-foreground mb-3">Our Story</p>
    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]">
      We curate. <span className="italic font-medium">You live beautifully.</span>
    </h1>
    <div className="aspect-[16/9] bg-muted overflow-hidden my-12">
      <img src="https://images.unsplash.com/photo-1757262798620-c2cc40cfb440?w=1400&q=85" alt="EzHome" className="w-full h-full object-cover" />
    </div>
    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-base sm:text-lg leading-relaxed text-foreground">
      <p>EzHome was founded on a simple idea: shopping should feel like discovery, not overwhelm. We sift through millions of products on Amazon, Temu, and SHEIN — testing, comparing, and curating — so you only see the best.</p>
      <p>Every product on EzHome is selected by real humans who care about quality, design, and value. We're not a marketplace. We're a taste-maker for the modern home.</p>
      <p className="text-muted-foreground">From smart organization that clears your counters, to heirloom-quality kitchen pieces that elevate everyday cooking, we believe a well-curated home is an act of self-care.</p>
    </div>
    <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-16 pt-12 border-t border-border">
      <div>
        <p className="font-display text-3xl sm:text-5xl font-bold">2.4M+</p>
        <p className="overline text-muted-foreground mt-2">Happy shoppers</p>
      </div>
      <div>
        <p className="font-display text-3xl sm:text-5xl font-bold">15K+</p>
        <p className="overline text-muted-foreground mt-2">Curated items</p>
      </div>
      <div>
        <p className="font-display text-3xl sm:text-5xl font-bold">120+</p>
        <p className="overline text-muted-foreground mt-2">Countries served</p>
      </div>
    </div>
  </div>
);

export default About;
