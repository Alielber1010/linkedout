export default function PrivacyPage() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold">Privacy &amp; Terms</h1>
        <p className="text-sm text-secondary mt-1">
          The boring page. We tried to make it short and actually mean it.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold">1. What we collect</h2>
        <p className="text-sm text-secondary leading-relaxed">
          If you sign in anonymously, we don&apos;t collect anything
          identifying — just a random account ID. If you sign up with email,
          we store that email and your password (hashed, we never see it in
          plain text) purely to log you back in. That&apos;s it. We&apos;re
          not tracking your browsing habits or building an ad profile on you;
          this isn&apos;t that kind of website.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">2. We don&apos;t sell or share your data</h2>
        <p className="text-sm text-secondary leading-relaxed">
          We do not sell, rent, or share your personal data (email, account
          info) with advertisers, data brokers, or anyone else. No
          third-party trackers, no &quot;partners.&quot; The only exception is
          if we&apos;re legally required to disclose something — a valid
          court order, not a strongly worded email.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">
          3. Your posts, your responsibility
        </h2>
        <p className="text-sm text-secondary leading-relaxed">
          Everything you post is your own words and your own call. You are
          solely responsible for what you say here, including if it turns
          out to be defamatory, false, or gets you in trouble with a former
          (or current) employer. We don&apos;t review posts before they go
          live, and posting here doesn&apos;t make you anonymous to a
          determined subpoena — it makes you anonymous to other users.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">
          4. Don&apos;t leak trade secrets or dox people
        </h2>
        <p className="text-sm text-secondary leading-relaxed">
          Vent about your job, not your NDA. Don&apos;t post confidential
          business information, trade secrets, source code, financials, or
          other intellectual property belonging to an employer. And don&apos;t
          post information that could identify a real, specific coworker or
          private individual (full names, contact info, anything doxx-y).
          Roast the situation, not a person who can be found by it. We can
          and will remove content that crosses these lines.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">5. Content moderation</h2>
        <p className="text-sm text-secondary leading-relaxed">
          We reserve the right to remove posts or accounts that violate the
          above — illegal content, harassment, doxxing, or genuine trade
          secret leaks. Everything else, including your complaints about
          your manager, stays up.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">6. Changes</h2>
        <p className="text-sm text-secondary leading-relaxed">
          If this policy changes, we&apos;ll update this page. We&apos;re not
          going to email you about it — you didn&apos;t give us permission to
          spam you, and we don&apos;t want to anyway.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">7. Not legal advice</h2>
        <p className="text-sm text-secondary leading-relaxed">
          This is a small, satirical project, not a law firm. This page
          describes how we actually operate, in plain English, but it
          isn&apos;t a substitute for professional legal advice — for you or
          for us.
        </p>
      </section>
    </div>
  );
}
