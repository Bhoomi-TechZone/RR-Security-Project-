import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  ChevronRight,
  Info,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  Calendar,
  Users,
  Image as ImageIcon,
  HelpCircle,
  X,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import greetingService from '../../services/greetingService';
import styles from './Greetings.module.css';

const DEFAULT_GREETINGS = {
  birthday: {
    enabled: true,
    sendCopyToManagers: true,
    postOnFeed: true,
    sticker: 'https://cdn-icons-png.flaticon.com/512/8816/8816312.png',
    subject: 'Happy Birthday {{first_name}}!',
    message: `On your special day, we wish you a very Happy Birthday.
Have a wonderful day ahead!

HR Department
{{company_name}}`
  },
  workAnniversary: {
    enabled: true,
    sendCopyToManagers: true,
    postOnFeed: true,
    sticker: 'https://cdn-icons-png.flaticon.com/512/3386/3386773.png',
    subject: "You've completed {{work_years}} years with us, {{first_name}}!",
    message: `Congratulations on completing {{work_years}} years with us.
We appreciate your dedication and hard work!

HR Department
{{company_name}}`
  },
  weddingAnniversary: {
    enabled: true,
    sendCopyToManagers: true,
    postOnFeed: true,
    sticker: 'https://cdn-icons-png.flaticon.com/512/3656/3656860.png',
    subject: 'Happy Wedding Anniversary {{first_name}}!',
    message: `Wishing you and your partner a lifetime of love, joy, and togetherness!
Happy Wedding Anniversary!

HR Department
{{company_name}}`
  },
  newJoining: {
    enabled: false,
    sendCopyToManagers: false,
    postOnFeed: false,
    sticker: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    subject: 'Welcome to the team, {{first_name}}!',
    message: `A warm welcome to {{company_name}}!
We are thrilled to have you onboard and wish you tremendous success.

HR Department
{{company_name}}`
  }
};

// Curated library of festive celebration stickers for each category
const PRESET_STICKERS = {
  birthday: [
    'https://cdn-icons-png.flaticon.com/512/8816/8816312.png',
    'https://cdn-icons-png.flaticon.com/512/4213/4213958.png',
    'https://cdn-icons-png.flaticon.com/512/3159/3159066.png',
    'https://cdn-icons-png.flaticon.com/512/1161/1161670.png'
  ],
  workAnniversary: [
    'https://cdn-icons-png.flaticon.com/512/3386/3386773.png',
    'https://cdn-icons-png.flaticon.com/512/2583/2583344.png',
    'https://cdn-icons-png.flaticon.com/512/3135/3135763.png',
    'https://cdn-icons-png.flaticon.com/512/1040/1040230.png'
  ],
  weddingAnniversary: [
    'https://cdn-icons-png.flaticon.com/512/3656/3656860.png',
    'https://cdn-icons-png.flaticon.com/512/1077/1077035.png',
    'https://cdn-icons-png.flaticon.com/512/2904/2904973.png',
    'https://cdn-icons-png.flaticon.com/512/3656/3656885.png'
  ],
  newJoining: [
    'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    'https://cdn-icons-png.flaticon.com/512/3898/3898082.png',
    'https://cdn-icons-png.flaticon.com/512/924/924915.png',
    'https://cdn-icons-png.flaticon.com/512/1256/1256650.png'
  ]
};

const TEMPLATE_METADATA = [
  {
    key: 'birthday',
    title: 'Birthday Greetings',
    enableLabel: 'Enable Birthday Greetings',
    defaultSticker: 'https://cdn-icons-png.flaticon.com/512/8816/8816312.png'
  },
  {
    key: 'workAnniversary',
    title: 'Work Anniversary Greetings',
    enableLabel: 'Enable Work Anniversary Greetings',
    defaultSticker: 'https://cdn-icons-png.flaticon.com/512/3386/3386773.png'
  },
  {
    key: 'weddingAnniversary',
    title: 'Wedding Anniversary Greetings',
    enableLabel: 'Enable Wedding Anniversary Greetings',
    defaultSticker: 'https://cdn-icons-png.flaticon.com/512/3656/3656860.png'
  },
  {
    key: 'newJoining',
    title: 'New Joinings',
    enableLabel: 'Enable New Joining Greetings',
    defaultSticker: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
  }
];

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

  // Sticker Picker Modal State
  const [editingStickerType, setEditingStickerType] = useState(null);
  const [selectedStickerUrl, setSelectedStickerUrl] = useState('');
  const [customStickerInput, setCustomStickerInput] = useState('');
  const fileInputRef = useRef(null);

  // Read Help Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);

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
            sendCopyToManagers: data.config.birthday?.sendCopyToManagers !== undefined ? Boolean(data.config.birthday.sendCopyToManagers) : DEFAULT_GREETINGS.birthday.sendCopyToManagers,
            postOnFeed: data.config.birthday?.postOnFeed !== undefined ? Boolean(data.config.birthday.postOnFeed) : DEFAULT_GREETINGS.birthday.postOnFeed,
            sticker: data.config.birthday?.sticker || DEFAULT_GREETINGS.birthday.sticker,
            subject: data.config.birthday?.subject || DEFAULT_GREETINGS.birthday.subject,
            message: data.config.birthday?.message || DEFAULT_GREETINGS.birthday.message
          },
          workAnniversary: {
            enabled: data.config.workAnniversary?.enabled !== undefined ? Boolean(data.config.workAnniversary.enabled) : DEFAULT_GREETINGS.workAnniversary.enabled,
            sendCopyToManagers: data.config.workAnniversary?.sendCopyToManagers !== undefined ? Boolean(data.config.workAnniversary.sendCopyToManagers) : DEFAULT_GREETINGS.workAnniversary.sendCopyToManagers,
            postOnFeed: data.config.workAnniversary?.postOnFeed !== undefined ? Boolean(data.config.workAnniversary.postOnFeed) : DEFAULT_GREETINGS.workAnniversary.postOnFeed,
            sticker: data.config.workAnniversary?.sticker || DEFAULT_GREETINGS.workAnniversary.sticker,
            subject: data.config.workAnniversary?.subject || DEFAULT_GREETINGS.workAnniversary.subject,
            message: data.config.workAnniversary?.message || DEFAULT_GREETINGS.workAnniversary.message
          },
          weddingAnniversary: {
            enabled: data.config.weddingAnniversary?.enabled !== undefined ? Boolean(data.config.weddingAnniversary.enabled) : DEFAULT_GREETINGS.weddingAnniversary.enabled,
            sendCopyToManagers: data.config.weddingAnniversary?.sendCopyToManagers !== undefined ? Boolean(data.config.weddingAnniversary.sendCopyToManagers) : DEFAULT_GREETINGS.weddingAnniversary.sendCopyToManagers,
            postOnFeed: data.config.weddingAnniversary?.postOnFeed !== undefined ? Boolean(data.config.weddingAnniversary.postOnFeed) : DEFAULT_GREETINGS.weddingAnniversary.postOnFeed,
            sticker: data.config.weddingAnniversary?.sticker || DEFAULT_GREETINGS.weddingAnniversary.sticker,
            subject: data.config.weddingAnniversary?.subject || DEFAULT_GREETINGS.weddingAnniversary.subject,
            message: data.config.weddingAnniversary?.message || DEFAULT_GREETINGS.weddingAnniversary.message
          },
          newJoining: {
            enabled: data.config.newJoining?.enabled !== undefined ? Boolean(data.config.newJoining.enabled) : DEFAULT_GREETINGS.newJoining.enabled,
            sendCopyToManagers: data.config.newJoining?.sendCopyToManagers !== undefined ? Boolean(data.config.newJoining.sendCopyToManagers) : DEFAULT_GREETINGS.newJoining.sendCopyToManagers,
            postOnFeed: data.config.newJoining?.postOnFeed !== undefined ? Boolean(data.config.newJoining.postOnFeed) : DEFAULT_GREETINGS.newJoining.postOnFeed,
            sticker: data.config.newJoining?.sticker || DEFAULT_GREETINGS.newJoining.sticker,
            subject: data.config.newJoining?.subject || DEFAULT_GREETINGS.newJoining.subject,
            message: data.config.newJoining?.message || DEFAULT_GREETINGS.newJoining.message
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
      notify('Loaded default greetings template configuration.', 'warning');
    } finally {
      setIsLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadGreetings();
  }, [loadGreetings]);

  // Handle Switch Toggles (enable, sendCopyToManagers, postOnFeed)
  const handleToggle = async (type, field) => {
    const nextVal = !greetings[type]?.[field];
    const updated = {
      ...greetings,
      [type]: {
        ...greetings[type],
        [field]: nextVal
      }
    };
    setGreetings(updated);
    try {
      await greetingService.saveGreetings(updated, currentCompanyId);
      const fieldLabels = {
        enabled: 'Greetings Status',
        sendCopyToManagers: 'Send copy to Managers',
        postOnFeed: 'Post on Organization Feed'
      };
      notify(`${fieldLabels[field] || field} updated to ${nextVal ? 'ON' : 'OFF'}.`, 'success');
    } catch (err) {
      console.error('[Greetings] Failed to auto-save toggle state:', err);
      // Revert state on failure
      setGreetings(greetings);
      notify('Failed to save toggle state: ' + (err.message || 'Network error'), 'error');
    }
  };

  // Text change handler for subject and message
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

  // Trigger manual check and dispatch for today's celebrations
  const handleDispatchNow = async () => {
    setIsDispatching(true);
    try {
      const res = await greetingService.triggerDispatch(true, currentCompanyId);
      notify(res.message || 'Greetings checked & dispatched successfully!', 'success');
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

  // Open sticker picker for a card
  const handleOpenStickerPicker = (type) => {
    setEditingStickerType(type);
    setSelectedStickerUrl(greetings[type]?.sticker || DEFAULT_GREETINGS[type]?.sticker || '');
    setCustomStickerInput('');
  };

  // Apply chosen sticker
  const handleApplySticker = async () => {
    if (!editingStickerType) return;
    const finalUrl = customStickerInput.trim() || selectedStickerUrl;
    if (!finalUrl) {
      notify('Please select or provide an image/sticker URL.', 'warning');
      return;
    }

    const updated = {
      ...greetings,
      [editingStickerType]: {
        ...greetings[editingStickerType],
        sticker: finalUrl
      }
    };
    setGreetings(updated);
    setEditingStickerType(null);

    try {
      await greetingService.saveGreetings(updated, currentCompanyId);
      notify('✓ Greeting sticker updated and saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      notify('Failed to save updated sticker: ' + err.message, 'error');
    }
  };

  // Handle local file upload for sticker
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Please select a valid image file (PNG, JPG, SVG, WebP).', 'warning');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify('Image size should be under 2MB for fast delivery.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (dataUrl) {
        setSelectedStickerUrl(dataUrl);
        setCustomStickerInput('');
      }
    };
    reader.readAsDataURL(file);
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

        {/* Page Header matching Screenshot 1 */}
        <header className={styles.pageHeader}>
          <div className={styles.headerTitles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 className={styles.pageTitle}>Greetings</h1>
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
              Configure automatic greetings for birthdays, work anniversaries, wedding anniversaries, and new joinings.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Read Help Button */}
            <button
              type="button"
              className={styles.readHelpBtn}
              onClick={() => setShowHelpModal(true)}
              title="Read Help & Instructions"
            >
              <HelpCircle size={15} />
              <span>Read Help</span>
            </button>

            {/* Refresh Button */}
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

        {/* Dynamic SMTP Status Notification */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 12.5,
            lineHeight: 1.45,
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
              <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
            )}
            <span>
              {emailConfigured ? (
                <>
                  <strong>Dynamic Company SMTP Active:</strong> Emails delivered directly to inboxes from{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{senderEmail}</span>.
                </>
              ) : (
                <>
                  <strong>SMTP Not Configured:</strong> Portal notifications will be posted automatically. To also send direct branded emails to employee & manager inboxes, configure SMTP credentials in Admin Preferences.
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
                padding: '3px 10px',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              Configure SMTP &rarr;
            </button>
          )}
        </div>

        {/* 2x2 Grid with 4 Greeting Cards (Matching Screenshot 1) */}
        <div className={styles.cardsGrid2x2}>
          {TEMPLATE_METADATA.map((tmpl) => {
            const data = greetings[tmpl.key] || DEFAULT_GREETINGS[tmpl.key];
            const stickerSrc = data.sticker || tmpl.defaultSticker;

            return (
              <div key={tmpl.key} className={styles.greetingCard}>
                <h2 className={styles.cardTitle}>{tmpl.title}</h2>

                {/* Top Section: Toggles on left, Sticker on right */}
                <div className={styles.togglesRowWrapper}>
                  <div className={styles.togglesList}>
                    {/* 1. Enable Toggle */}
                    <label className={styles.toggleRow}>
                      <span className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={Boolean(data.enabled)}
                          onChange={() => handleToggle(tmpl.key, 'enabled')}
                        />
                        <span className={styles.slider}></span>
                      </span>
                      <span className={styles.toggleLabel}>{tmpl.enableLabel}</span>
                    </label>

                    {/* 2. Send copy to Managers Toggle */}
                    <label className={styles.toggleRow}>
                      <span className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={Boolean(data.sendCopyToManagers)}
                          onChange={() => handleToggle(tmpl.key, 'sendCopyToManagers')}
                        />
                        <span className={styles.slider}></span>
                      </span>
                      <span className={styles.toggleLabel}>
                        <span>Send copy to Managers</span>
                        <span className={styles.infoIconWrapper}>
                          <span className={styles.infoIcon}>i</span>
                          <span className={styles.infoTooltip}>
                            When enabled, sends a celebration copy email and in-app notification directly to the employee's assigned reporting manager.
                          </span>
                        </span>
                      </span>
                    </label>

                    {/* 3. Post on Organization Feed Toggle */}
                    <label className={styles.toggleRow}>
                      <span className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={Boolean(data.postOnFeed)}
                          onChange={() => handleToggle(tmpl.key, 'postOnFeed')}
                        />
                        <span className={styles.slider}></span>
                      </span>
                      <span className={styles.toggleLabel}>
                        <span>Post on Organization Feed</span>
                        <span className={styles.infoIconWrapper}>
                          <span className={styles.infoIcon}>i</span>
                          <span className={styles.infoTooltip}>
                            When enabled, automatically publishes a celebratory announcement post on the company-wide organization feed.
                          </span>
                        </span>
                      </span>
                    </label>
                  </div>

                  {/* Sticker / Icon with Change Image Link */}
                  <div className={styles.flatIconImgWrapper}>
                    <img
                      src={stickerSrc}
                      alt={tmpl.title}
                      className={styles.flatIconImg}
                      onError={(e) => {
                        e.target.src = tmpl.defaultSticker;
                      }}
                    />
                    <span
                      className={styles.changeImageLink}
                      onClick={() => handleOpenStickerPicker(tmpl.key)}
                      title="Click to customize celebration sticker"
                    >
                      Change image
                    </span>
                  </div>
                </div>

                {/* Customize Message Section */}
                <div className={styles.customizeSection}>
                  <span className={styles.sectionSubLabel}>Customize Message</span>
                  <input
                    type="text"
                    className={styles.subjectInput}
                    value={data.subject || ''}
                    onChange={(e) => handleTextChange(tmpl.key, 'subject', e.target.value)}
                    placeholder="Subject line template..."
                  />
                  <textarea
                    className={styles.messageTextarea}
                    rows={5}
                    value={data.message || ''}
                    onChange={(e) => handleTextChange(tmpl.key, 'message', e.target.value)}
                    placeholder="Greeting message body..."
                  />
                  <p className={styles.templateHint}>See below for instructions and available dynamic fields</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Row: Red Save Button matching Screenshot 2 */}
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.btnSaveRed}
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>

          <button
            type="button"
            className={styles.btnDispatch}
            onClick={handleDispatchNow}
            disabled={isDispatching}
            title="Immediately check today's celebrations and dispatch emails and panel notifications"
          >
            <Send size={15} />
            <span>{isDispatching ? 'Dispatching...' : "Dispatch Today's Greetings Now"}</span>
          </button>
        </div>

        {/* Instructions and Available Dynamic Fields Section matching Screenshot 2 */}
        <div className={styles.instructionsContainer}>
          <h3 className={styles.instructionsHeading}>Instructions and Available Dynamic Fields:</h3>

          <ul className={styles.instructionsBulletList}>
            <li>Greetings are sent to employees/managers on their email, as well as push notifications on their mobile app, if registered on Workman.</li>
            <li>Greetings are processed between 7:00 AM to 8:00 AM every morning.</li>
            <li>
              Dynamic fields available in subject and message:
              <ul className={styles.nestedSubBullets}>
                <li>
                  Employee's first name:{' '}
                  <span
                    className={styles.tagChip}
                    onClick={() => handleCopyTag('{{first_name}}')}
                    title="Click to copy {{first_name}}"
                  >
                    &#123;&#123;first_name&#125;&#125;
                  </span>
                </li>
                <li>
                  Employee's last name:{' '}
                  <span
                    className={styles.tagChip}
                    onClick={() => handleCopyTag('{{last_name}}')}
                    title="Click to copy {{last_name}}"
                  >
                    &#123;&#123;last_name&#125;&#125;
                  </span>
                </li>
                <li>
                  Completed years in case of work anniversary:{' '}
                  <span
                    className={styles.tagChip}
                    onClick={() => handleCopyTag('{{work_years}}')}
                    title="Click to copy {{work_years}}"
                  >
                    &#123;&#123;work_years&#125;&#125;
                  </span>
                </li>
              </ul>
            </li>
          </ul>

          {/* Quick-copy tag chips helper */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Additional Tags:</span>
            <span className={styles.tagChip} onClick={() => handleCopyTag('{{company_name}}')}>&#123;&#123;company_name&#125;&#125;</span>
            <span className={styles.tagChip} onClick={() => handleCopyTag('{{designation}}')}>&#123;&#123;designation&#125;&#125;</span>
            <span className={styles.tagChip} onClick={() => handleCopyTag('{{department}}')}>&#123;&#123;department&#125;&#125;</span>
            <span className={styles.tagChip} onClick={() => handleCopyTag('{{manager_name}}')}>&#123;&#123;manager_name&#125;&#125;</span>
            <span className={styles.tagChip} onClick={() => handleCopyTag('{{spouse_name}}')}>&#123;&#123;spouse_name&#125;&#125;</span>
          </div>
        </div>

        {/* Upcoming Celebrations Widget */}
        <div className={styles.instructionsContainer} style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} color="#2563eb" />
              <span>Upcoming Celebrations in next 30 days ({upcomingEvents.length})</span>
            </h4>
          </div>

          {upcomingEvents.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              <Users size={22} style={{ margin: '0 auto 6px', display: 'block', color: '#cbd5e1' }} />
              No birthdays, work anniversaries, or wedding anniversaries in the next 30 days for this company.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginTop: 4 }}>
              {upcomingEvents.map((evt) => {
                let badgeStyle = { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' };
                if (evt.type === 'birthday') {
                  badgeStyle = { background: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8' };
                } else if (evt.type === 'wedding') {
                  badgeStyle = { background: '#fdf4ff', color: '#c026d3', border: '1px solid #f5d0fe' };
                } else if (evt.type === 'newJoining') {
                  badgeStyle = { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' };
                }

                return (
                  <div
                    key={evt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      fontSize: 12.5
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{evt.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {evt.date} &bull; {evt.designation || 'Staff'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 9999,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        ...badgeStyle
                      }}
                    >
                      {evt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Sticker Picker Modal */}
        {editingStickerType && (
          <div className={styles.modalOverlay} onClick={() => setEditingStickerType(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  Change Sticker: {TEMPLATE_METADATA.find((m) => m.key === editingStickerType)?.title}
                </h3>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setEditingStickerType(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* 1. Curated Preset Gallery */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 8 }}>
                    Choose from Curated Celebration Stickers:
                  </label>
                  <div className={styles.stickersGrid}>
                    {(PRESET_STICKERS[editingStickerType] || []).map((url, idx) => (
                      <div
                        key={idx}
                        className={`${styles.stickerOption} ${selectedStickerUrl === url && !customStickerInput ? styles.stickerOptionSelected : ''}`}
                        onClick={() => {
                          setSelectedStickerUrl(url);
                          setCustomStickerInput('');
                        }}
                      >
                        <img src={url} alt={`Sticker ${idx + 1}`} style={{ width: 55, height: 55, objectFit: 'contain' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Upload Custom Image */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Or Upload Custom Image from Computer:
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      background: '#f8fafc',
                      border: '1px dashed #94a3b8',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer',
                      width: '100%',
                      justifyContent: 'center'
                    }}
                  >
                    <Upload size={16} />
                    <span>Upload Image File (PNG, JPG, SVG)</span>
                  </button>
                </div>

                {/* 3. Custom Image URL */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Or Paste Custom Image URL:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <LinkIcon size={14} style={{ position: 'absolute', left: 10, top: 12, color: '#94a3b8' }} />
                      <input
                        type="url"
                        placeholder="https://example.com/sticker.png"
                        value={customStickerInput}
                        onChange={(e) => {
                          setCustomStickerInput(e.target.value);
                          if (e.target.value) {
                            setSelectedStickerUrl(e.target.value);
                          }
                        }}
                        style={{
                          width: '100%',
                          height: 38,
                          paddingLeft: 32,
                          paddingRight: 10,
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                {(selectedStickerUrl || customStickerInput) && (
                  <div style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Selected Sticker Preview
                    </span>
                    <img
                      src={customStickerInput || selectedStickerUrl}
                      alt="Preview"
                      style={{ width: 80, height: 80, objectFit: 'contain', margin: '0 auto', display: 'block' }}
                      onError={(e) => {
                        e.target.src = 'https://cdn-icons-png.flaticon.com/512/8816/8816312.png';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setEditingStickerType(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.btnApply}
                  onClick={handleApplySticker}
                >
                  Apply Sticker
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Read Help Modal */}
        {showHelpModal && (
          <div className={styles.modalOverlay} onClick={() => setShowHelpModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Automated Greetings Help Guide</h3>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setShowHelpModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody} style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>
                <p>
                  <strong>How Automated Greetings Work:</strong>
                  <br />
                  NovaSpark HRMS automatically tracks employee Birthdays, Work Anniversaries, Wedding Anniversaries, and New Joiners per company. Every morning between <strong>7:00 AM to 8:00 AM</strong>, greetings are generated and sent according to your company preferences.
                </p>

                <p>
                  <strong>Send Copy to Managers:</strong>
                  <br />
                  When active, a duplicate greeting notification and email copy is sent to the employee's assigned reporting manager / supervisor so they are notified of their team member's special day.
                </p>

                <p>
                  <strong>Post on Organization Feed:</strong>
                  <br />
                  When active, celebratory announcements are automatically published to the company-wide organization feed for team recognition.
                </p>

                <p>
                  <strong>Dynamic Placeholders:</strong>
                  <br />
                  Use placeholders like <code>&#123;&#123;first_name&#125;&#125;</code>, <code>&#123;&#123;last_name&#125;&#125;</code>, <code>&#123;&#123;work_years&#125;&#125;</code>, and <code>&#123;&#123;company_name&#125;&#125;</code> to personalize subjects and messages automatically.
                </p>

                <p>
                  <strong>Custom Stickers:</strong>
                  <br />
                  Click <em>Change image</em> on any card to select festive icons or upload your company-specific celebration stickers.
                </p>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnApply}
                  onClick={() => setShowHelpModal(false)}
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
