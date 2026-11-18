type PageIntroProps = {
  eyebrow: string;
  title: string;
  accent: string;
  description?: string;
};

export default function PageIntro({ eyebrow, title, accent, description }: PageIntroProps) {
  return (
    <div className="customer-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>
        {title}
        <br />
        <em>{accent}</em>
      </h1>
      {description ? <p className="customer-intro-copy">{description}</p> : null}
    </div>
  );
}
