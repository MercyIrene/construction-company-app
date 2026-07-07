import Link from "next/link";

export default function Landing() {
  return (
    <>
      <section className="hero">
        <h1>
          Build your home in Kenya —<br />
          with proof at every step.
        </h1>
        <p>
          You&apos;ve heard the stories: money sent, walls that never rose.
          Msingi is your professional representative on the ground. Vetted
          professionals, milestone-locked payments, and photo-verified
          progress you can check from anywhere in the world.{" "}
          <strong>Your money doesn&apos;t move until you&apos;ve seen the work.</strong>
        </p>
        <div className="cta">
          <Link className="btn" href="/login">
            Start your project
          </Link>
          <Link className="btn ghost" href="/login">
            Owner sign in
          </Link>
        </div>
      </section>

      <section className="grid cols-3 pillars">
        <div className="card">
          <h3>Verified professionals</h3>
          <p>
            Five-gate vetting: licences (NCA, BORAQS, EBK), track record
            site-checked, references interviewed — before anyone touches your
            project.
          </p>
        </div>
        <div className="card">
          <h3>Your money, controlled</h3>
          <p>
            Funds sit in your own dual-mandate bank account. Payments release
            only against certified milestones you approve — never before, and
            never through us.
          </p>
        </div>
        <div className="card">
          <h3>Evidence, not assurances</h3>
          <p>
            Geotagged photos, independent inspections, and a weekly report.
            Every shilling traces to work you can see, in a record you keep
            forever.
          </p>
        </div>
      </section>
    </>
  );
}
