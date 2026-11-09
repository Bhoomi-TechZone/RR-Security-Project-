import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  ChevronRight,
  Copy,
  Calendar,
  Info
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import styles from './Greetings.module.css';

const LOCAL_STORAGE_KEY = 'novaspark_greetings_config';

const DEFAULT_GREETINGS = {
  birthday: {
    enabled: true,
    sendToManager: true,
    postOnFeed: true,
    subject: 'Happy Birthday {{first_name}}!',
    message: `Hello {{first_name}},

On your special day, we wish you a very Happy Birthday.
Have a wonderful day ahead!

HR Department
RR SECURITY FACILITIES`
  },
  workAnniversary: {
    enabled: true,
    sendToManager: true,
    postOnFeed: true,
    subject: "You've completed {{work_years}} years with us, {{first_name}}!",
    message: `Hello {{first_name}},

Congratulations on completing {{work_years}} years with us.
We appreciate your dedication and hard work!

HR Department
RR SECURITY FACILITIES`
  },
  weddingAnniversary: {
    enabled: true,
    sendToManager: true,
    postOnFeed: true,
    subject: 'Happy Wedding Anniversary {{first_name}}!',
    message: `Hello {{first_name}},

Wishing you a very Happy Wedding Anniversary.
May your love grow stronger and inspire all, like the moon and the sun!

HR Department
RR SECURITY FACILITIES`
  }
};

// Mock Upcoming Events for the Widget
const UPCOMING_EVENTS = [
  { id: 1, name: 'Bandna Rana', type: 'birthday', label: 'Birthday', date: 'Tomorrow (10 Nov)', badgeClass: styles.badgeBday },
  { id: 2, name: 'Mahesh Chandra Sharma', type: 'work', label: '5 Yrs Work Anniv.', date: '14 Nov 2026', badgeClass: styles.badgeWork },
  { id: 3, name: 'Amit Sharma', type: 'wedding', label: 'Wedding Anniv.', date: '18 Nov 2026', badgeClass: styles.badgeWedding }
];

export default function Greetings() {
  const navigate = useNavigate();

  // Load stored settings or defaults
  const [greetings, setGreetings] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_GREETINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load greetings config:', e);
    }
    return DEFAULT_GREETINGS;
  });

  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Toggle switch handler
  const handleToggle = (type, key) => {
    setGreetings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: !prev[type][key]
      }
    }));
  };

  // Text change handler
  const handleTextChange = (type, key, value) => {
    setGreetings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: value
      }
    }));
  };

  // Save Settings
  const handleSave = (e) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(greetings));
      notify('✓ Greetings configuration saved successfully.', 'success');
    } catch (err) {
      console.error(err);
      notify('Failed to save greetings configuration.', 'error');
    }
  };

  // Copy chip tag to clipboard
  const handleCopyTag = (tag) => {
    navigator.clipboard?.writeText(tag);
    notify(`Copied ${tag} to clipboard!`, 'info');
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Dynamic Breadcrumb */}
        <div className={styles.breadcrumb}>
          <span onClick={() => navigate('/admin/dashboard')}>Dashboard</span>
          <ChevronRight size={14} />
          <span>Settings</span>
          <ChevronRight size={14} />
          <strong>Greetings</strong>
        </div>

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerTitles}>
            <h1 className={styles.pageTitle}>Greetings</h1>
            <p className={styles.pageSubtitle}>
              Configure automatic greetings for birthdays, work anniversaries, and wedding anniversaries.
            </p>
          </div>
        </header>

        {/* 2-Column Main Layout Grid */}
        <div className={styles.mainLayoutGrid}>
          {/* LEFT COLUMN: 3 Greeting Cards */}
          <div className={styles.cardsCol}>
            {/* 1. Birthday Greetings Card */}
            <div className={styles.greetingCard}>
              <h2 className={styles.cardTitle}>Birthday Greetings</h2>

              {/* Toggles & Flat Icon Row */}
              <div className={styles.togglesRowWrapper}>
                <div className={styles.togglesList}>
                  <label className={styles.toggleRow}>
                    <span className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={greetings.birthday.enabled}
                        onChange={() => handleToggle('birthday', 'enabled')}
                      />
                      <span className={styles.slider}></span>
                    </span>
                    <span className={styles.toggleLabel}>Enable Birthday Greetings</span>
                  </label>

                  <label className={styles.toggleRow}>
                    <span className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={greetings.birthday.sendToManager}
                        onChange={() => handleToggle('birthday', 'sendToManager')}
                      />
                      <span className={styles.slider}></span>
                    </span>
                    <span className={styles.toggleLabel}>
                      Send copy to Managers{' '}
                      <span className={styles.infoIcon} title="Sends a CC copy to the employee's reporting manager">i</span>
                    </span>
                  </label>

                  <label className={styles.toggleRow}>
                    <span className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={greetings.birthday.postOnFeed}
                        onChange={() => handleToggle('birthday', 'postOnFeed')}
                      />
                      <span className={styles.slider}></span>
                    </span>
                    <span className={styles.toggleLabel}>
                      Post on Organization Feed{' '}
                      <span className={styles.infoIcon} title="Publishes a celebration card on company social feed">i</span>
                    </span>
                  </label>
                </div>

                <div className={styles.flatIconImgWrapper}>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/8816/8816312.png"
                    alt="Birthday Cake"
                    className={styles.flatIconImg}
                  />
                </div>
              </div>

              {/* Customize Message */}
              <div className={styles.customizeSection}>
                <span className={styles.sectionSubLabel}>Customize Message</span>
                <input
                  type="text"
                  className={styles.subjectInput}
                  value={greetings.birthday.subject}
                  onChange={(e) => handleTextChange('birthday', 'subject', e.target.value)}
                  placeholder="Subject template..."
                />
                <textarea
                  className={styles.messageTextarea}
                  rows={6}
                  value={greetings.birthday.message}
                  onChange={(e) => handleTextChange('birthday', 'message', e.target.value)}
                  placeholder="Message body template..."
                />
              </div>
            </div>

            {/* 2. Work Anniversary Greetings Card */}
            <div className={styles.greetingCard}>
              <h2 className={styles.cardTitle}>Work Anniversary Greetings</h2>

              {/* Toggles & Flat Icon Row */}
              <div className={styles.togglesRowWrapper}>
                <div className={styles.togglesList}>
                  <label className={styles.toggleRow}>
                    <span className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={greetings.workAnniversary.enabled}
                        onChange={() => handleToggle('workAnniversary', 'enabled')}
                      />
                      <span className={styles.slider}></span>
                    </span>
                    <span className={styles.toggleLabel}>Enable Work Anniversary Greetings</span>
                  </label>

                  <label className={styles.toggleRow}>
                    <span className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={greetings.workAnniversary.sendToManager}
                        onChange={() => handleToggle('workAnniversary', 'sendToManager')}
                      />
                      <span className={styles.slider}></span>
                    </span>
                    <span className={styles.toggleLabel}>
                      Send copy to Managers{' '}
                      <span className={styles.infoIcon} title="Sends a CC copy to reporting manager">i</span>
                    </span>
                  </label>

                  <label className={styles.toggleRow}>
                    <span className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={greetings.workAnniversary.postOnFeed}
                        onChange={() => handleToggle('workAnniversary', 'postOnFeed')}
                      />
                      <span className={styles.slider}></span>
                    </span>
                    <span className={styles.toggleLabel}>
                      Post on Organization Feed{' '}
                      <span className={styles.infoIcon} title="Publishes achievement on organization feed">i</span>
                    </span>
                  </label>
                </div>

                <div className={styles.flatIconImgWrapper}>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/3386/3386773.png"
                    alt="Work Anniversary"
                    className={styles.flatIconImg}
                  />
                </div>
              </div>

              {/* Customize Message */}
              <div className={styles.customizeSection}>
                <span className={styles.sectionSubLabel}>Customize Message</span>
                <input
                  type="text"
                  className={styles.subjectInput}
                  value={greetings.workAnniversary.subject}
                  onChange={(e) => handleTextChange('workAnniversary', 'subject', e.target.value)}
                  placeholder="Subject template..."
                />
                <textarea
                  className={styles.messageTextarea}
                  rows={6}
                  value={greetings.workAnniversary.message}
                  onChange={(e) => handleTextChange('workAnniversary', 'message', e.target.value)}
                  placeholder="Message body template..."
                />
              </div>
            </div>

            {/* 3. Wedding Anniversary Greetings Card */}
            <div className={styles.greetingCard}>
              <h2 className={styles.cardTitle}>Wedding Anniversary Greetings</h2>

              {/* Toggles & Flat Icon Row */}
              <div className={styles.togglesRowWrapper}>
                <div className={styles.togglesList}>
                  <label className={styles.toggleRow}>
                    <span className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={greetings.weddingAnniversary.enabled}
                        onChange={() => handleToggle('weddingAnniversary', 'enabled')}
                      />
                      <span className={styles.slider}></span>
                    </span>
                    <span className={styles.toggleLabel}>Enable Wedding Anniversary Greetings</span>
                  </label>

                  <label className={styles.toggleRow}>
                    <span className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={greetings.weddingAnniversary.sendToManager}
                        onChange={() => handleToggle('weddingAnniversary', 'sendToManager')}
                      />
                      <span className={styles.slider}></span>
                    </span>
                    <span className={styles.toggleLabel}>
                      Send copy to Managers{' '}
                      <span className={styles.infoIcon} title="Sends a CC copy to reporting manager">i</span>
                    </span>
                  </label>

                  <label className={styles.toggleRow}>
                    <span className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={greetings.weddingAnniversary.postOnFeed}
                        onChange={() => handleToggle('weddingAnniversary', 'postOnFeed')}
                      />
                      <span className={styles.slider}></span>
                    </span>
                    <span className={styles.toggleLabel}>
                      Post on Organization Feed{' '}
                      <span className={styles.infoIcon} title="Publishes anniversary greeting on company feed">i</span>
                    </span>
                  </label>
                </div>

                <div className={styles.flatIconImgWrapper}>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/14685/14685948.png"
                    alt="Wedding Anniversary"
                    className={styles.flatIconImg}
                  />
                </div>
              </div>

              {/* Customize Message */}
              <div className={styles.customizeSection}>
                <span className={styles.sectionSubLabel}>Customize Message</span>
                <input
                  type="text"
                  className={styles.subjectInput}
                  value={greetings.weddingAnniversary.subject}
                  onChange={(e) => handleTextChange('weddingAnniversary', 'subject', e.target.value)}
                  placeholder="Subject template..."
                />
                <textarea
                  className={styles.messageTextarea}
                  rows={6}
                  value={greetings.weddingAnniversary.message}
                  onChange={(e) => handleTextChange('weddingAnniversary', 'message', e.target.value)}
                  placeholder="Message body template..."
                />
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.btnSave}
                onClick={handleSave}
              >
                <Save size={16} />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: General Instructions & Dynamic Tags */}
          <div className={styles.sideCol}>
            <div className={styles.instructionsCard}>
              <h3 className={styles.instructionsTitle}>
                <Info size={16} color="var(--primary, #2563eb)" />
                <span>General Instructions</span>
              </h3>

              <ul className={styles.instructionsList}>
                <li>
                  <strong>Daily Dispatch Schedule:</strong> Greetings are generated and processed every morning based on employee records.
                </li>
                <li>
                  <strong>Delivery Channels:</strong> Sent directly via official email and mobile app notifications, with optional manager CC and organization feed posts.
                </li>
                <li>
                  <strong>Dynamic Message Placeholders:</strong> Click any tag below to copy and paste it into your message template:
                  <div className={styles.tagsContainer}>
                    <div className={styles.tagRow}>
                      <span
                        className={styles.fieldChip}
                        onClick={() => handleCopyTag('{{first_name}}')}
                        title="Click to copy tag"
                      >
                        &#123;&#123;first_name&#125;&#125;
                      </span>
                      <span className={styles.tagDesc}>Employee's first name</span>
                    </div>
                    <div className={styles.tagRow}>
                      <span
                        className={styles.fieldChip}
                        onClick={() => handleCopyTag('{{last_name}}')}
                        title="Click to copy tag"
                      >
                        &#123;&#123;last_name&#125;&#125;
                      </span>
                      <span className={styles.tagDesc}>Employee's last name</span>
                    </div>
                    <div className={styles.tagRow}>
                      <span
                        className={styles.fieldChip}
                        onClick={() => handleCopyTag('{{work_years}}')}
                        title="Click to copy tag"
                      >
                        &#123;&#123;work_years&#125;&#125;
                      </span>
                      <span className={styles.tagDesc}>Completed years in case of work anniversary</span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Upcoming Greetings Widget */}
            <div className={styles.upcomingCard}>
              <div className={styles.upcomingHeader}>
                <h4 className={styles.upcomingTitle}>
                  <Calendar size={15} color="#2563eb" />
                  <span>Upcoming Celebrations</span>
                </h4>
              </div>

              {UPCOMING_EVENTS.map((evt) => (
                <div key={evt.id} className={styles.upcomingItem}>
                  <div>
                    <div className={styles.upcomingName}>{evt.name}</div>
                    <div className={styles.upcomingDate}>{evt.date}</div>
                  </div>
                  <span className={`${styles.eventBadge} ${evt.badgeClass}`}>
                    {evt.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

