const fs = require('fs');
const path = require('path');
const { h1, h2, h3, p, bullets, table } = require('./k.cjs');

const ftests = fs.readFileSync(path.join(__dirname, 'ftests.txt'), 'utf8').trim().split('\n').map((l) => l.split('|'));
const fileOf = (n) => (n <= 6 ? 'accountDeletion' : n <= 13 ? 'adminUsers' : n <= 16 ? 'broadcast' : n <= 22 ? 'cancel' : n <= 25 ? 'chatCleanup' : n <= 35 ? 'dispatch' : n <= 42 ? 'featured' : n <= 48 ? 'passwordReset' : n <= 49 ? 'planReminders' : 'verification');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const ch7 = [
  h1('Chapter 7: Conclusions and Future Works'),

  h2('7.1 Conclusions'),
  p('The project set out to solve a concrete local problem: finding a nearby, trustworthy artisan quickly and agreeing on a fair price. The team\'s questionnaires confirmed the problem, and Qareeb was designed and implemented to address it as a complete system: a single mobile application for customers and artisans, a web dashboard for the administrator, and a Firebase back end with sixteen Cloud Functions.'),
  table({
    key: 'tab:objectives',
    caption: 'Achievement of the project objectives',
    head: ['Objective (Section 1.3)', 'How it is achieved', 'Status'],
    widths: [26, 56, 18],
    rows: [
      ['Automatic nearest-artisan dispatch', 'Dispatch to verified, available artisans of the category within their working hours, from 2 km up to 12 km, with a 30-minute time-out', 'Achieved'],
      ['Transparent price competition', 'Several offers per request with price and arrival time; acceptance closes the others; reasons for declines', 'Achieved'],
      ['Trust and quality', 'Identity verification by the administrator, mandatory two-way rating, complaints, featured badge', 'Achieved'],
      ['Real-time follow-up and safe communication', 'Clear statuses, 22 notification types, encrypted chat with photos', 'Achieved (Android push needs a development build)'],
      ['Central administration', 'Dashboard with twelve pages for verification, users, catalog, complaints, support, notifications, prices, settings and analytics', 'Achieved'],
      ['Privacy and security', 'Tested security rules, private customer data, encrypted chat, SMS defense, administration log, backups', 'Achieved'],
    ],
  }),
  p('The incremental methodology proved suitable: five increments between July and November 2026 delivered the system step by step, each one driven by observations from real devices and checked by automated tests. All 66 automated tests passed on 27 November 2026. The work also produced practical lessons, in particular how to deliver SMS codes reliably to Palestinian mobile networks and how to keep a team that does not edit code able to run and publish the system.'),

  h2('7.2 Future Works'),
  table({
    key: 'tab:future',
    caption: 'Future works',
    head: ['Item', 'Description', 'Status'],
    widths: [24, 56, 20],
    rows: [
      ['Store builds', 'Produce development and store builds with EAS, enabling push notifications on Android and publishing on Google Play and the App Store', 'Planned (decision pending)'],
      ['Real electronic payment', 'Replace the payment simulator with a payment gateway that works in Palestine', 'Planned'],
      ['App Check', 'Restrict back-end access to the genuine applications with Firebase App Check', 'Planned'],
      ['Server-side automatic completion', 'Move the 48-hour completion from the application to the scheduled dispatchTick function', 'Planned'],
      ['Plan check in the rules', 'Require an active plan for offers in the security rules as well as in the application', 'Planned'],
      ['Scheduled requests', 'Allow the customer to book a later date instead of an immediate request', 'Proposed'],
      ['Live tracking', 'Show the artisan\'s position on a map while on the way', 'Proposed'],
      ['More flexibility', 'Editing a request after posting; a work radius chosen by the artisan; monitoring of ratings from the dashboard', 'Proposed'],
      ['Recommendations', 'Suggest suitable artisans from ratings and experience (recommended in the previous documentation)', 'Proposed'],
      ['Expansion and evaluation', 'Usability study with real users in Hebron, then expansion to other cities', 'Proposed'],
    ],
  }),

  h2('7.3 Closing Remarks'),
  p('Qareeb shows how a small team can build a secure, location-aware service platform with modern cross-platform and serverless technologies. The system is ready for a pilot with real customers and artisans; with a store build and a real payment gateway it can become a practical service for the local community and a contribution to the digital transformation of local services.'),
];

const refs = [
  h1('References', { unnumbered: true }),
  p('The references below are the official documentation of the technologies used in the project (accessed November 2026). Academic sources used by the team should be added here.'),
  { t: 'refs', items: [
    'Meta Platforms, "React Native documentation." [Online]. Available: https://reactnative.dev/docs/getting-started',
    'Expo, "Expo documentation." [Online]. Available: https://docs.expo.dev/',
    'Expo, "Expo Router." [Online]. Available: https://docs.expo.dev/router/introduction/',
    'Expo, "Push notifications overview." [Online]. Available: https://docs.expo.dev/push-notifications/overview/',
    'Google, "Cloud Firestore documentation." [Online]. Available: https://firebase.google.com/docs/firestore',
    'Google, "Firebase Security Rules." [Online]. Available: https://firebase.google.com/docs/rules',
    'Google, "Cloud Functions for Firebase." [Online]. Available: https://firebase.google.com/docs/functions',
    'Google, "Authenticate with Firebase using a phone number (web)." [Online]. Available: https://firebase.google.com/docs/auth/web/phone-auth',
    'Google, "Firebase Local Emulator Suite." [Online]. Available: https://firebase.google.com/docs/emulator-suite',
    'Google Cloud, "reCAPTCHA documentation." [Online]. Available: https://cloud.google.com/recaptcha/docs',
    'Vercel, "Next.js documentation." [Online]. Available: https://nextjs.org/docs',
    'D. Chestnykh, "TweetNaCl.js." [Online]. Available: https://github.com/dchest/tweetnacl-js',
    'OpenStreetMap Foundation, "Nominatim usage policy." [Online]. Available: https://operations.osmfoundation.org/policies/nominatim/',
    'TanStack, "TanStack Query." [Online]. Available: https://tanstack.com/query/latest',
    'Microsoft, "Playwright." [Online]. Available: https://playwright.dev/',
    'Mermaid, "Mermaid diagramming and charting tool." [Online]. Available: https://mermaid.js.org/',
    'PlantUML, "PlantUML." [Online]. Available: https://plantuml.com/',
  ] },
];

const appendices = [
  h1('Appendix A: Notification Types', { unnumbered: true }),
  table({
    key: 'tab:notif',
    caption: 'Notification types sent by the system',
    head: ['#', 'Type', 'Event', 'Recipient'],
    widths: [6, 26, 46, 22],
    fontSize: 9.5,
    rows: [
      ['newJob', 'A new request was dispatched to the artisan', 'Artisan'],
      ['newOffer', 'An artisan sent an offer', 'Customer'],
      ['offerAccepted', 'The customer accepted the artisan\'s offer', 'Hired artisan'],
      ['offerNotChosen', 'The customer accepted another offer', 'Other artisans'],
      ['offerRejected', 'The customer declined the offer, with the reason', 'Artisan'],
      ['offerExpired', 'The request expired while the offer was pending', 'Artisans who offered'],
      ['requestExpired', 'No offer was accepted within 30 minutes', 'Customer'],
      ['noOffers', 'No offer arrived within 30 minutes', 'Customer'],
      ['tooManyOpen', 'The request was over the open-request limit', 'Customer'],
      ['requestCancelledPending', 'The customer cancelled a request that was waiting for offers', 'Artisans who offered'],
      ['cancelledByOther', 'The other party cancelled the job, with the reason', 'Customer or hired artisan'],
      ['onTheWay', 'The artisan is on the way', 'Customer'],
      ['working', 'The artisan started the work', 'Customer'],
      ['completed', 'The job was completed', 'Customer and hired artisan'],
      ['newMessage', 'A new chat message (without its text)', 'Other party'],
      ['system', 'A system notification from the dashboard', 'Selected audience'],
      ['becameFeatured', 'The artisan earned the featured badge', 'Artisan'],
      ['planEndingSoon', 'The plan ends within 3 days', 'Artisan'],
      ['planEnded', 'The plan has ended', 'Artisan'],
      ['supportReply', 'The Qareeb team replied in the support chat', 'User'],
      ['verificationApproved', 'Verification approved', 'Artisan'],
      ['verificationRejected', 'Verification rejected, with the reason', 'Artisan'],
    ].map((r, i) => [String(i + 1), ...r]),
  }),
  h1('Appendix B: Cloud Functions Test Cases', { unnumbered: true }),
  p('All cases below were run on 27 November 2026 with the Firestore and Authentication emulators; each one produced the expected result (52 of 52 passed).'),
  table({
    key: 'tab:fn-all',
    caption: 'Cloud Functions test cases',
    head: ['ID', 'File', 'Test scenario (expected behaviour)', 'Status'],
    widths: [9, 17, 60, 14],
    fontSize: 8.5,
    rows: ftests.map(([n, name]) => [`FT-${String(n).padStart(2, '0')}`, fileOf(+n), cap(name), 'Passed']),
  }),
  h1('Appendix C: Diagram Sources', { unnumbered: true }),
  p('The diagrams of this report are kept as editable text in the repository under `docs/report/diagrams/`. Files ending in `.mmd` are Mermaid diagrams and files ending in `.puml` are PlantUML diagrams; the PNG image next to each file is the rendered version used in this report.'),
  table({
    key: 'tab:diagram-files',
    caption: 'Diagram source files',
    head: ['File', 'Diagram'],
    widths: [36, 64],
    fontSize: 9.5,
    rows: [
      ['01-architecture.puml', 'System architecture'],
      ['02-context.mmd', 'Context diagram'],
      ['03-uc-customer.puml to 06-uc-system.puml', 'Use-case diagrams'],
      ['07a-class-accounts.mmd, 07b-class-requests.mmd, 08a-class-artisan-admin.mmd, 08b-class-support.mmd, 09-class-app.mmd', 'Class diagrams'],
      ['10-seq-signup.mmd to 16-seq-suspend.mmd', 'Sequence diagrams'],
      ['17a-act-request.puml, 17b-act-job.puml, 18-act-artisan.puml, 19-act-reset.puml, 20-act-complaint.puml', 'Activity diagrams'],
      ['21-state-request.mmd', 'State diagram of a request'],
      ['22a-erd-accounts.mmd, 22b-erd-requests.mmd, 22c-erd-artisan-admin.mmd, 22d-erd-support.mmd', 'ER diagrams of the Firestore data model'],
      ['23-gantt.mmd', 'Implementation timeline'],
      ['_style.iuml', 'Shared PlantUML style'],
    ],
  }),
];

module.exports = { ch7, refs, appendices };
