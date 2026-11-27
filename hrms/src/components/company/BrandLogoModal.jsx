import React, { useState, useEffect, useRef } from 'react';
import {
  Image, X, UploadCloud, RotateCcw, CheckCircle2,
  AlertCircle, Sparkles, Check
} from 'lucide-react';
import styles from './BrandLogoModal.module.css';
import { useCompany } from '../../context/CompanyContext';
import rrLogo from '../../assets/rrlogo.png';
import storageService from '../../services/storageService';

function BrandLogoModal({ isOpen, onClose, onSuccess }) {
  const { brandLogo, updateMasterBrandLogo, activeCompany } = useCompany();
  const [previewLogo, setPreviewLogo] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileObj, setSelectedFileObj] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'info', message: string }
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const current = brandLogo || localStorage.getItem('novaspark_master_brand_logo') || rrLogo;
      setPreviewLogo(current);
      setSelectedFileName('');
      setSelectedFileObj(null);
      setFeedback(null);
    }
  }, [isOpen, brandLogo]);

  if (!isOpen) return null;

  const processFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Please select a valid image file (PNG, JPG, SVG, WebP).' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Image size exceeds 10MB limit. Please upload a smaller image.' });
      return;
    }

    setSelectedFileObj(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setPreviewLogo(base64);
      setSelectedFileName(file.name);
      setFeedback({
        type: 'success',
        message: `Loaded "${file.name}". Click "Update Brand Logo" to upload to Cloudflare R2.`
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleResetToDefault = () => {
    setPreviewLogo(rrLogo);
    setSelectedFileName('Default RR Security Logo');
    setFeedback({
      type: 'success',
      message: 'Reset to default RR Security logo. Click "Update Brand Logo" to apply.'
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      let logoToSave = previewLogo === rrLogo ? null : previewLogo;

      // If user selected a new file, upload to Cloudflare R2
      if (selectedFileObj) {
        setFeedback({ type: 'info', message: 'Uploading brand logo to Cloudflare R2...' });
        try {
          const uploaded = await storageService.uploadFile(selectedFileObj, 'images', activeCompany?.companyId || '');
          if (uploaded?.url) {
            logoToSave = uploaded.url;
          }
        } catch (r2Err) {
          console.warn('Direct Cloudflare R2 upload fallback:', r2Err);
        }
      }

      await updateMasterBrandLogo(logoToSave);

      if (onSuccess) {
        onSuccess(logoToSave || previewLogo);
      }
      onClose();
    } catch (err) {
      console.error('Error saving brand logo:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update brand logo in the database.'
      });
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBadge}>
              <Image size={20} />
            </div>
            <div>
              <h2 className={styles.title}>System Brand Logo</h2>
              <p className={styles.subtitle}>
                Upload brand logo to be displayed across all company sidebar headers
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Feedback banner */}
          {feedback && (
            <div className={`${styles.feedbackBanner} ${feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Current Logo Preview */}
          <div className={styles.previewContainer}>
            <div className={styles.previewLabelRow}>
              <span className={styles.previewLabel}>Current Brand Logo</span>
              {selectedFileName && (
                <span className={styles.fileNameBadge}>
                  <Check size={12} /> {selectedFileName}
                </span>
              )}
            </div>
            <div className={styles.previewBox}>
              <img
                src={previewLogo || rrLogo}
                alt="Brand Logo"
                className={styles.previewImg}
              />
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleFileChange}
          />

          {/* Simple Dropzone / Uploader */}
          <div
            className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            title="Click or drag and drop to upload image"
          >
            <div className={styles.dropzoneIconWrap}>
              <UploadCloud size={24} />
            </div>
            <div className={styles.dropzoneContent}>
              <span className={styles.dropzoneTitle}>
                Click to browse or drag & drop logo
              </span>
              <span className={styles.dropzoneSubtitle}>
                PNG, JPG, SVG, WebP up to 2MB (Recommended: Transparent PNG, 240×60px)
              </span>
            </div>
          </div>

          {/* Reset option */}
          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleResetToDefault}
              title="Reset back to default RR Security & Facilities logo"
            >
              <RotateCcw size={13} />
              <span>Reset to Default Logo</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className={styles.spinner} />
                <span>Updating Logo...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Update Brand Logo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BrandLogoModal;
