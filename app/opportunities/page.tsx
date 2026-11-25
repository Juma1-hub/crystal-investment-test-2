import Link from "next/link";
import SiteContentText from "@/components/SiteContentText";
import PublicInvestmentDivisions from "@/components/PublicInvestmentDivisions";

const process = [
  ["01", "Opportunity sourcing", "Identify relevant opportunities through research, networks, industry relationships and market analysis across countries and regions."],
  ["02", "Initial screening", "Assess strategic fit, commercial rationale, jurisdiction, counterparties, eligibility and whether the opportunity merits deeper review."],
  ["03", "Due diligence & valuation", "Examine financial, legal, operational, technical, market, environmental and governance factors; test assumptions and downside scenarios."],
  ["04", "Approval & structuring", "Define the investment structure, capital requirements, investor eligibility, rights, fees, risk disclosures and approval responsibilities."],
  ["05", "Execution & monitoring", "Proceed only when required approvals and documentation are in place; monitor performance, risks and material developments."],
  ["06", "Reporting & realisation", "Provide appropriate reporting and manage distributions, refinancing, sale or exit in line with the governing agreements."],
];

export default function Opportunities() {
  return <>
    <section className="page-hero"><div className="container"><div className="eyebrow">Investment opportunities</div><h1>Global reach. Selective investment. Disciplined execution.</h1><p><SiteContentText field="opportunitiesIntro" fallback="Crystal Investments invests globally in relevant opportunities across businesses, real assets, industries and financial markets. Each opportunity is assessed on its own merits, risks and terms."/></p></div></section>
    <section className="section"><div className="container"><div className="section-head"><div className="eyebrow">Where opportunities may arise</div><h2>A global opportunity landscape.</h2><p>The eight divisions below define our investment focus. They are sector divisions, not a statement that a particular asset is currently held or open for participation.</p></div>
      <PublicInvestmentDivisions/>
    </div></section>
    <section className="section section-soft"><div className="container"><div className="section-head"><div className="eyebrow">From research to investment</div><h2>How an opportunity moves forward.</h2><p>Our investment process is designed to bring consistency, accountability and clear decision-making to opportunities wherever they arise.</p></div><div className="cards">{process.map(([number, title, text]) => <article className="card" key={number}><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
    <section className="section"><div className="container split"><div><div className="eyebrow">Participation & transparency</div><div className="section-head"><h2>Clear terms before any commitment.</h2><p>Where an opportunity is approved for external presentation, its information should explain the asset or business, jurisdiction, structure, intended use of capital, minimum participation requirements (if any), time horizon, fees, valuation approach, key risks and exit or liquidity provisions.</p><p>Investors participate through individual investment accounts. Where capital is combined for a shared project, each participant's contribution, economic interest, allocations, costs and results are recorded separately under the applicable project documentation.</p></div><Link className="text-link" href="/approach">Read our investment approach <span>→</span></Link></div><div className="disclaimer"><strong>Important investment information</strong><br/>All investments carry risk, including the possible loss of capital. Returns are not guaranteed. Actual opportunities, structures and participation terms vary by transaction and jurisdiction. Any investment activity or offer is subject to applicable legal and regulatory approvals, investor eligibility checks, definitive agreements and risk disclosures. Nothing on this page is an offer to invest or a recommendation to buy or sell a security.</div></div></section>
    <section className="cta-band"><div className="container cta-inner"><div><div className="eyebrow">Investment enquiries</div><h2>Discuss a relevant opportunity.</h2><p>We welcome enquiries from businesses, project sponsors and potential strategic partners worldwide.</p></div><Link className="button button-gold" href="/contact">Contact our team <span>↗</span></Link></div></section>
  </>;
}
