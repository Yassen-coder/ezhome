const AffiliateDisclosure = () => (
  <div className="container-px mx-auto max-w-[800px] py-16 sm:py-24" data-testid="affiliate-page">
    <p className="overline text-muted-foreground mb-3">Transparency First</p>
    <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Affiliate Disclosure</h1>
    <div className="mt-10 space-y-8 text-base leading-relaxed">
      <p className="text-lg">EzHome is a participant in affiliate programs including the Amazon Services LLC Associates Program, Temu's affiliate program, and SHEIN's affiliate program.</p>
      <p className="text-muted-foreground">When you click a product link on EzHome and make a purchase, we may earn a small commission — at no additional cost to you. This commission helps us run the site, curate new products, and keep EzHome free for our community.</p>
      <section>
        <h2 className="font-display text-2xl font-bold mb-3">Editorial independence</h2>
        <p className="text-muted-foreground">Our product picks are never influenced by commissions. We curate based on quality, design, value, and real customer reviews. If we don't believe in it, it doesn't make the cut.</p>
      </section>
      <section>
        <h2 className="font-display text-2xl font-bold mb-3">Pricing accuracy</h2>
        <p className="text-muted-foreground">Prices, discounts, and availability are subject to change without notice. While we update regularly, always confirm pricing on the merchant's site at checkout.</p>
      </section>
      <section>
        <h2 className="font-display text-2xl font-bold mb-3">Questions?</h2>
        <p className="text-muted-foreground">Email <a href="mailto:hello@ezhome.shop" className="underline">hello@ezhome.shop</a> — we're happy to clarify anything.</p>
      </section>
    </div>
  </div>
);

export default AffiliateDisclosure;
