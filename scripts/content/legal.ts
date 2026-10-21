/**
 * Starting drafts of the privacy policy and terms, written to match what this site actually
 * does. They are not legal advice: the client must review them (ideally with a solicitor),
 * fill in every [bracketed] detail and publish them from the admin.
 */

export const PRIVACY = {
  title: 'Privacy policy',
  slug: 'privacy',
  intro: 'What we collect when you read Melanated Online, why, and the choices you have.',
  content: `
## Who we are

Melanated Online is run by [business or legal name], [registered address]. We are the controller of the personal data described here. Questions about privacy: [privacy contact email].

## What we collect, and why

We have designed the site to collect as little as possible. You do not need an account to read it, and we do not use advertising or analytics cookies.

### When you read the site

- **Hearts.** When you heart a story, we set a cookie called mo_voter containing a random code. It lets us count one heart per browser and lets only you remove your own heart. It is not linked to your name or any other information, and it lasts one year.
- **Protection against abuse.** To stop automated scripts inflating heart counts, we record a scrambled (hashed) version of your network address for at most 24 hours. It is mixed with a secret that changes every day, so we cannot turn it back into your address or link it from one day to the next.
- **Server logs.** Our hosting provider records technical information such as your IP address and browser type when you visit, to keep the site running and secure. These logs are kept for [retention period] and are not used to identify you.

### When you contact us

If you email us, we use your email address and message to reply. We keep the conversation for [retention period], then delete it unless we need it for a legal reason.

### If you write for us

If we give you an account to write for the site, we store your name, email address, password (in a protected, hashed form), and any bio or photo you add. Your name, bio and photo appear on your articles. We keep this while you write for us and for [retention period] afterwards.

### Community groups

Our social media pages are run on those platforms. Their own privacy policies apply to anything you share there.

## Our legal basis

We rely on our legitimate interests to run a secure website, count hearts fairly and prevent abuse, and to answer messages you send us. For contributors, we process your details to work with you.

## Cookies

We set only cookies that are strictly necessary for features you choose to use:

- **mo_voter:** remembers your hearts, as described above. One year.
- **payload-token:** keeps contributors signed in to the editing area. Only set if you sign in. [Duration]

Links to shops in our articles may take you to sites that set their own cookies, including for affiliate tracking. Their policies apply on their sites.

## Who we share data with

We do not sell your data. We use these service providers, who process it only on our instructions:

- **Vercel** (website hosting and image storage), [location]
- **[database provider]** (database hosting), [location]
- **[email provider]** (if you email us)

Where a provider is outside the UK, we rely on [the UK International Data Transfer Agreement, the UK Extension to the EU-US Data Privacy Framework, or another safeguard] to protect your data.

## How long we keep it

Hashed network data: up to 24 hours. Heart cookie: one year in your browser. Other data: as described in each section above.

## Your rights

You can ask to see the personal data we hold about you, correct it, delete it, restrict or object to how we use it, or receive a copy in a portable format. Email [privacy contact email] and we will respond within one month. You can clear the heart cookie at any time in your browser settings.

If you are unhappy with how we handle your data, please tell us first. You also have the right to complain to the Information Commissioner's Office (ico.org.uk).

## Children

The site is written for adults and is not directed at children under 13.

## Changes

We will update this page if what we collect or why changes, and change the "last updated" date at the top.
`,
}

export const TERMS = {
  title: 'Terms of use',
  slug: 'terms',
  intro:
    'The rules for using Melanated Online. Please read them; by using the site you agree to them.',
  content: `
## About these terms

Melanated Online is run by [business or legal name], [registered address] ("we", "us"). These terms apply to anyone who reads or uses the site. If you do not agree to them, please do not use the site.

## Using the site

You may read, share links to and print articles for your own personal, non-commercial use. Please do not copy, republish or sell our articles or photographs, or present them as your own, without our written permission. Short quotes with a credit and a link back are welcome.

Do not use the site in a way that is unlawful, harms the site or other readers, or tries to manipulate it, for example by automating hearts.

## Our content is general information

Our wellness, beauty, fashion and business content is for general information and inspiration. It is not medical, health, legal, financial or professional advice. Always seek advice from a qualified professional about your own situation, and check product ingredients and suitability for yourself before trying anything we feature.

## Advertising, affiliate links and gifts

Some articles are paid partnerships, contain affiliate links (we may earn a commission if you buy through them, at no extra cost to you) or feature products we were gifted. We label these clearly at the top of the article. Our opinions are our own, and brands do not approve our editorial content unless an article is labelled as an ad.

## Photographs and credits

Photographs are owned by us or used with permission and credited where required. If you believe we have used your work without permission, contact [contact email] and we will look into it promptly.

## Other websites

We link to other websites, including shops and social media. We are not responsible for their content, products or privacy practices.

## Availability and changes

We aim to keep the site available and accurate but cannot guarantee that it will always be available, error-free or up to date. We may change or remove content at any time.

## Our liability

We are not liable for any loss arising from your use of the site or reliance on its content, except where the law does not allow us to exclude or limit liability, including for death or personal injury caused by our negligence, or for fraud.

## Governing law

These terms are governed by the law of England and Wales, and the courts of England and Wales have jurisdiction, unless you live in Scotland or Northern Ireland, where you may also bring proceedings in your local courts.

## Contact

Questions about these terms: [contact email].

## Changes to these terms

We may update these terms and will change the "last updated" date at the top. Continuing to use the site after a change means you accept the updated terms.
`,
}
