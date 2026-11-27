// Cover data and preliminary pages. Values in [brackets] are waiting for the team's confirmation.
const COVER = {
  university: 'Hebron University',
  college: 'College of Information Technology',
  doc: 'Graduation Project Documentation',
  titleLabel: 'Project Title:',
  title: 'Qareeb: A Mobile Application for Managing Nearby Services',
  teamLabel: 'Team Members:',
  team: ['Jawad Fawarah', 'Mayyas Banat', 'Dania Al-Julani', 'Rama Zama\'rah'],
  supLabel: 'Supervised by:',
  supervisor: 'Dr. Amjad Al-Husseini',
  year: '2026 - 2027',
};

const dedication = {
  basmala: 'بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ',
  verse: '﴿يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ﴾ [المجادلة: 11]',
  verseEn: '"Allah will raise those who have believed among you and those who were given knowledge, by degrees." (Al-Mujadila, 11)',
  paras: [
    ['', 'To those who planted hope in us and paved the road of knowledge for us with love and endless patience...'],
    ['To our dear mothers:', 'the constant pulse of mercy, whose prayers accompanied us in every step, every exam and every long night. You were the light that kept our hearts from despair and the warmth in which our determination grew despite the fatigue.'],
    ['To our great fathers:', 'who carried our worries in silence and gave us strength despite their own fatigue. Thank you for your trust and your patience; you were, and still are, our first source of inspiration.'],
    ['To our brothers and sisters:', 'companions on the road, who eased our burdens, rejoiced in our joy and embraced us in difficult times.'],
    ['To the souls of the martyrs and to the free prisoners of Palestine:', 'you taught us that belonging is not words but action, patience and sacrifice. Your pure blood will remain the lamp from which we draw our love for the land and for giving.'],
    ['To Hebron, the city we dream of seeing more beautiful:', 'to you we dedicate this project, this effort and this vision.'],
    ['And finally,', 'to everyone who believed in us and pushed us forward when our steps almost slowed down: we dedicate this work to you, the fruit of our effort and of years of learning and dreaming.'],
  ],
};

const acknowledgments = {
  verse: '﴿وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ﴾ [التوبة: 105]',
  verseEn: '"And say: Work, for Allah will see your work, and so will His Messenger and the believers." (At-Tawbah, 105)',
  paras: [
    'Out of gratitude to everyone who supported us during our academic journey, we extend our sincere thanks and appreciation to all who contributed to our studies and took part in the completion of this project.',
    'We are deeply grateful to our professors at the College of Information Technology at Hebron University, who generously gave us their knowledge, guidance and valuable remarks throughout our years of study.',
    'We especially thank Dr. Amjad Al-Husseini, the supervisor of this project, whose remarks and careful supervision motivated us to develop the idea and to shape it with a realistic and ambitious vision.',
    'We also thank everyone who opened the doors of knowledge and information to us, including the customers and artisans who answered our questionnaires.',
    'And to everyone who lent us a hand, near or far, even with a single word of encouragement: thank you from the heart; you have left an unforgettable mark on this project.',
  ],
};

const abstract = [
  'Finding a nearby and trustworthy artisan for home maintenance still depends mostly on personal contacts, which is slow, gives no way to compare prices and says little about the artisan\'s reliability. A questionnaire answered by 75 customers and 14 artisans confirmed these problems: 77.3% of the customers obtain home services through friends or family, and 64.3% of the artisans named the small number of requests as a main challenge.',
  'This project presents Qareeb, an electronic system for managing nearby home services. It consists of a single cross-platform mobile application for customers and artisans, built with React Native and Expo, a web dashboard for the system administrator, built with Next.js, and a Firebase back end (Authentication, Cloud Firestore, Cloud Storage and sixteen Cloud Functions). A customer posts a request with a description, photos and location; the system dispatches it automatically to verified, available artisans of the same specialty within 2 km, widening the search by 2 km every 2 minutes up to 12 km. Artisans reply with price offers, the customer accepts one, follows the job through clear statuses and chats with the artisan through an encrypted chat, and both sides rate each other. The administrator verifies artisans\' identity documents, manages accounts, the service catalog, complaints, support conversations, system notifications and subscription prices.',
  'The system was developed with the incremental model in five increments between July and November 2026. Access to data is enforced by server-side security rules, chat messages are encrypted with XSalsa20-Poly1305, and SMS verification codes reach Palestinian mobile networks through reCAPTCHA Enterprise SMS defense. All 66 automated tests (14 security-rules tests and 52 Cloud Functions tests) passed. The remaining steps toward a public launch are a store build with full Android push notifications, a real payment gateway and a usability study with real users.',
];
const keywords = 'Keywords: home services, location-based dispatch, mobile application, React Native, Firebase, Cloud Functions, security rules.';

const abbreviations = [
  ['APNs', 'Apple Push Notification service'],
  ['API', 'Application Programming Interface'],
  ['CLI', 'Command-Line Interface'],
  ['E2E', 'End-to-End (test)'],
  ['EAS', 'Expo Application Services'],
  ['ERD', 'Entity Relationship Diagram'],
  ['ETA', 'Estimated Time of Arrival'],
  ['FCM', 'Firebase Cloud Messaging'],
  ['FR / NFR', 'Functional / Non-Functional Requirement'],
  ['GPS', 'Global Positioning System'],
  ['NoSQL', 'Non-relational ("not only SQL") database'],
  ['NPV', 'Net Present Value'],
  ['ROI', 'Return on Investment'],
  ['RTL', 'Right to Left'],
  ['SDK', 'Software Development Kit'],
  ['SMS', 'Short Message Service'],
  ['UC', 'Use Case'],
  ['UI / UX', 'User Interface / User Experience'],
  ['UML', 'Unified Modeling Language'],
];

module.exports = { COVER, dedication, acknowledgments, abstract, keywords, abbreviations };
