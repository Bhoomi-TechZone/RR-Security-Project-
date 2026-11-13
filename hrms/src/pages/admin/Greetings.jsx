import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  ChevronRight,
  Copy,
  Calendar,
  Info,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  Building2,
  Users
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import greetingService from '../../services/greetingService';
import styles from './Greetings.module.css';

const DEFAULT_GREETINGS = {
  birthday: {
    enabled: true,
    subject: 'Happy Birthday {{first_name}}!',
    message: `Hello {{first_name}},

On your special day, we wish you a very Happy Birthday.
Have a wonderful day ahead!

HR Department
{{company_name}}`
  },
  workAnniversary: {
    enabled: true,
    subject: "You've completed {{work_years}} years with us, {{first_name}}!",
    message: `Hello {{first_name}},

Congratulations on completing {{work_years}} years with us.
We appreciate your dedication and hard work!

HR Department
{{company_name}}`
  }
};

export default function Greetings() {
  const navigate = useNavigate();
  const { currentCompanyId, activeCompany } = useCompany();

  const [greetings, setGreetings] = useState(DEFAULT_GREETINGS);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');
  const [companyName, setCompanyName] = useState('RR Security & Facilities');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Load isolated greetings settings & upcoming celebrations from backend
  const loadGreetings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await greetingService.getGreetings(currentCompanyId);
      if (data?.config) {
        setGreetings({
          birthday: {
            enabled: data.config.birthday?.enabled !== undefined ? Boolean(data.config.birthday.enabled) : DEFAULT_GREETINGS.birthday.enabled,
            subject: data.config.birthday?.subject || DEFAULT_GREETINGS.birthday.subject,
            message: data.config.birthday?.message || DEFAULT_GREETINGS.birthday.message
          },
          workAnniversary: {
            enabled: data.config.workAnniversary?.enabled !== undefined ? Boolean(data.config.workAnniversary.enabled) : DEFAULT_GREETINGS.workAnniversary.enabled,
            subject: data.config.workAnniversary?.subject || DEFAULT_GREETINGS.workAnniversary.subject,
            message: data.config.workAnniversary?.message || DEFAULT_GREETINGS.workAnniversary.message
          }
        });
      }
      setUpcomingEvents(Array.isArray(data?.upcomingEvents) ? data.upcomingEvents : []);
      setEmailConfigured(Boolean(data?.emailConfigured));
      setSenderEmail(data?.senderEmail || '');
      if (data?.companyName) {
        setCompanyName(data.companyName);
      }
    } catch (err) {
      console.warn('[Greetings] Could not load from backend, using defaults:', err.message);
      notify('Could not load company greetings config. Default templates displayed.', 'warning');
    } finally {
      setIsLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadGreetings();
  }, [loadGreetings]);

  // Toggle switch handler - immediately auto-saves to backend so toggle persists across refresh
  const handleToggle = async (type) => {
    const nextEnabled = !greetings[type]?.enabled;
    const updated = {
      ...greetings,
      [type]: {
        ...greetings[type],
        enabled: nextEnabled
      }
    };
    setGreetings(updated);
    try {
      await greetingService.saveGreetings(updated, currentCompanyId);
      const label = type === 'birthday' ? 'Birthday' : 'Work Anniversary';
      notify(`${label} greetings turned ${nextEnabled ? 'ON' : 'OFF'} and saved.`, 'success');
    } catch (err) {
      console.error('[Greetings] Failed to auto-save toggle state:', err);
      // Revert state on failure
      setGreetings(greetings);
      notify('Failed to save toggle state: ' + (err.message || 'Network error'), 'error');
    }
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

  // Save Settings to MongoDB strictly isolated to current active company
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await greetingService.saveGreetings(greetings, currentCompanyId);
      notify(`✓ Greetings configuration saved successfully for ${companyName || 'this company'}.`, 'success');
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to save greetings configuration.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger manual check and dispatch for today's celebrations (idempotent, skips already sent)
  const handleDispatchNow = async () => {
    setIsDispatching(true);
    try {
      const res = await greetingService.triggerDispatch(false, currentCompanyId);
      notify(res.message || 'Greetings checked & dispatched successfully!', 'success');
      // Refresh celebration events list
      loadGreetings();
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to run greetings dispatch.', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  // Copy chip tag to clipboard
  const handleCopyTag = (tag) => {
    navigator.clipboard?.writeText(tag);
    notify(`Copied ${tag} to clipboard!`, 'info');
  };

  const resolvedCompName = activeCompany?.name || activeCompany?.companyName || companyName || 'RR Security & Facilities';

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 className={styles.pageTitle}>Automated Greetings</h1>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#2563eb',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: '2px 10px',
                  borderRadius: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <Building2 size={13} /> {resolvedCompName}
              </span>
            </div>
            <p className={styles.pageSubtitle}>
              Configure automated birthday and work anniversary greetings sent directly to employee email and their portal panel.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={loadGreetings}
              disabled={isLoading}
              title="Refresh company greetings data"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={isLoading ? styles.spinning : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Email Deliverability Status Banner */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            background: emailConfigured ? '#ecfdf5' : '#fffbeb',
            border: `1px solid ${emailConfigured ? '#a7f3d0' : '#fef08a'}`,
            color: emailConfigured ? '#065f46' : '#92400e'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {emailConfigured ? (
              <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
            )}
            <span>
              {emailConfigured ? (
                <>
                  <strong>Dynamic Company SMTP Active:</strong> Emails will be delivered to employee inbox from{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{senderEmail}</span>.
                </>
              ) : (
                <>
                  <strong>SMTP Not Configured for this Company:</strong> In-app panel notifications will be generated automatically. To also dispatch professional emails directly to inboxes, configure SMTP credentials in Admin Preferences.
                </>
              )}
            </span>
          </div>

          {!emailConfigured && (
            <button
              type="button"
              onClick={() => navigate('/admin/preferences?tab=email')}
              style={{
                background: '#ffffff',
                border: '1px solid #fde047',
                color: '#b45309',
                fontWeight: 700,
                fontSize: 12,
                padding: '4px 12px',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              Configure SMTP &rarr;
            </button>
          )}
        </div>

        {/* 2-Column Main Layout Grid */}
        <div className={styles.mainLayoutGrid}>
          {/* LEFT COLUMN: 2 Greeting Cards */}
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
                        onChange={() => handleToggle('birthday')}
                      />
                      <span className={styles.slider}></span>
                    </span>
                    <span className={styles.toggleLabel}>Enable Birthday Greetings</span>
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
                        onChange={() => handleToggle('workAnniversary')}
                      />
                      <span className={styles.slider}></span>
                    </span>
                    <span className={styles.toggleLabel}>Enable Work Anniversary Greetings</span>
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

            {/* Bottom Action Row */}
            <div className={styles.actionRow} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={styles.btnSave}
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
              </button>

              <button
                type="button"
                onClick={handleDispatchNow}
                disabled={isDispatching}
                title="Immediately check today's celebrations and dispatch emails and panel notifications"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 38,
                  padding: '0 20px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isDispatching ? 'not-allowed' : 'pointer'
                }}
              >
                <Send size={15} />
                <span>{isDispatching ? 'Dispatching...' : "Dispatch Today's Greetings Now"}</span>
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
                  <strong>Daily Dispatch Schedule:</strong> Greetings are automatically generated every morning from active employee DOB and Joining Date records.
                </li>
                <li>
                  <strong>Delivery Channels:</strong> Dispatched directly to employee registered email (inbox deliverable) and pushed to their portal panel as an in-app celebration notification.
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
                    <div className={styles.tagRow}>
                      <span
                        className={styles.fieldChip}
                        onClick={() => handleCopyTag('{{company_name}}')}
                        title="Click to copy tag"
                      >
                        &#123;&#123;company_name&#125;&#125;
                      </span>
                      <span className={styles.tagDesc}>Current active company name</span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Dynamic Upcoming Greetings Widget */}
            <div className={styles.upcomingCard}>
              <div className={styles.upcomingHeader}>
                <h4 className={styles.upcomingTitle}>
                  <Calendar size={15} color="#2563eb" />
                  <span>Upcoming Celebrations ({upcomingEvents.length})</span>
                </h4>
              </div>

              {upcomingEvents.length === 0 ? (
                <div style={{ padding: '20px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  <Users size={24} style={{ margin: '0 auto 6px', display: 'block', color: '#cbd5e1' }} />
                  No upcoming birthdays or work anniversaries in the next 30 days for this company.
                </div>
              ) : (
                upcomingEvents.map((evt) => (
                  <div key={evt.id} className={styles.upcomingItem}>
                    <div>
                      <div className={styles.upcomingName}>{evt.name}</div>
                      <div className={styles.upcomingDate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{evt.date}</span>
                        {evt.designation && <span style={{ color: '#94a3b8' }}>&bull; {evt.designation}</span>}
                      </div>
                    </div>
                    <span
                      className={styles.eventBadge}
                      style={{
                        background: evt.type === 'birthday' ? '#fdf2f8' : '#ecfdf5',
                        color: evt.type === 'birthday' ? '#db2777' : '#059669',
                        border: `1px solid ${evt.type === 'birthday' ? '#fbcfe8' : '#a7f3d0'}`
                      }}
                    >
                      {evt.label}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
