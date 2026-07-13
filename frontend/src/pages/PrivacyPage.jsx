import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white pb-16">
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
      </div>

      <div className="px-5 prose prose-sm max-w-none text-gray-700 space-y-6">
        <p className="text-xs text-gray-400">Last updated: July 2026</p>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Who we are</h2>
          <p>Second Rise is a personal fitness app that uses your health data and daily check-in to recommend a personalized workout. It is operated by Karen Kagoo. You can reach us at <a href="mailto:secondriseapp@gmail.com" className="text-blue-500">secondriseapp@gmail.com</a>.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">What we collect</h2>
          <p>We collect only what is needed to give you a personalized recommendation:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Account information:</strong> email address and hashed password.</li>
            <li><strong>Profile data:</strong> fitness level, menopause stage, equipment, movement limitations.</li>
            <li><strong>Daily check-in data:</strong> energy level, time available, pain flags, sleep quality, workout preference.</li>
            <li><strong>Wearable data (if connected):</strong> resting heart rate, HRV, sleep duration, recovery score, and step count from Oura, Whoop, Apple Health, Google Health Connect, Fitbit, or Garmin.</li>
            <li><strong>Session history:</strong> which workouts you completed, post-session effort and soreness ratings.</li>
            <li><strong>Cycle phase (opt-in only):</strong> whether you are menstruating on a given day — only if you have explicitly enabled cycle tracking in your profile settings.</li>
          </ul>
          <p className="text-sm mt-2">We do not collect location, contacts, camera, microphone, or any data unrelated to fitness and recovery.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">How we use your data</h2>
          <p className="text-sm">Your data is used exclusively to generate your personalized daily workout recommendation and to track your progress over time. We do not use your data for advertising. We do not sell or share your data with third parties.</p>
          <p className="text-sm mt-2">Wearable data is fetched from third-party APIs (Oura, Whoop, Fitbit, Google, Garmin) using OAuth tokens you authorize. We store only the metrics needed for recommendations — we do not store raw sensor files or historical archives from these services.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Menstrual and cycle data</h2>
          <p className="text-sm">Cycle tracking is <strong>opt-in only</strong>. You must explicitly enable it in your profile settings. If enabled, we record whether you indicate you are menstruating on a given check-in day. This is used solely to adjust workout intensity recommendations.</p>
          <p className="text-sm mt-2">We understand that menstrual data is particularly sensitive, especially given the current legal landscape in the United States. We do not share this data with anyone. It is stored encrypted in transit and at rest on US-based servers. You can disable cycle tracking and delete all cycle data at any time from your profile.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Where your data is stored</h2>
          <p className="text-sm">Your data is stored on Railway, a US-based cloud infrastructure provider. Data is transmitted over HTTPS. We do not transfer your data outside the United States.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Who can see your data</h2>
          <p className="text-sm">Only you can see your full health and check-in data within the app. The Second Rise operator (Karen Kagoo) has access to aggregate usage metrics — such as whether you have been active recently and your current streak — for the purpose of supporting cohort participants. The operator does not access your individual health metric values (HRV, heart rate, sleep scores) through the admin interface.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Second Rise is not a HIPAA-covered entity</h2>
          <p className="text-sm">Second Rise is a consumer wellness app, not a healthcare provider. It is not covered by the Health Insurance Portability and Accountability Act (HIPAA). The FTC Health Breach Notification Rule does apply — if a security breach affects your identifiable health information, we will notify you promptly.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Your rights</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Access:</strong> You can view all your data within the app.</li>
            <li><strong>Deletion:</strong> You can delete your account and all associated data from Profile → Delete Account. Deletion is permanent and immediate.</li>
            <li><strong>Correction:</strong> You can update your profile at any time.</li>
            <li><strong>Opt-out of cycle tracking:</strong> Toggle it off in Profile settings at any time.</li>
            <li><strong>Data portability:</strong> Contact us at secondriseapp@gmail.com to request an export of your data.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Children</h2>
          <p className="text-sm">Second Rise is not intended for users under 18. We do not knowingly collect data from minors.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Changes to this policy</h2>
          <p className="text-sm">If we make material changes to this policy, we will notify you in the app. Continued use after notification constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Contact</h2>
          <p className="text-sm">Questions? Email us at <a href="mailto:secondriseapp@gmail.com" className="text-blue-500">secondriseapp@gmail.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
