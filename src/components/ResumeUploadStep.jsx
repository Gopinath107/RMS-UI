import React, { useCallback, useRef, useState } from 'react';
import { EmployeeService } from '../services/EmployeeManagementService';

const ACCEPTED_EXT = ['.pdf', '.doc', '.docx'];
const MAX_SIZE = 5 * 1024 * 1024;

const PARSE_MESSAGES = [
  'Reading resume...',
  'Extracting contact details...',
  'Identifying skills & experience...',
  'Detecting education info...',
  'Populating your form...',
];

export default function ResumeUploadStep({ resourceType = 'internal', onParsed, onSkip, onClose }) {
  const [step, setStep] = useState('upload'); // upload | parsing | success | error
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [validErr, setValidErr] = useState('');
  const [parseErr, setParseErr] = useState('');
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);
  const intervalRef = useRef(null);

  const validate = (f) => {
    if (!f) return 'Please select a file.';
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) return 'Only PDF, DOC, or DOCX files are supported.';
    if (f.size > MAX_SIZE) return 'File size must be under 5MB.';
    return null;
  };

  const pick = (f) => {
    const err = validate(f);
    if (err) { setValidErr(err); setFile(null); } else { setValidErr(''); setFile(f); }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.[0]) pick(e.dataTransfer.files[0]);
  }, []);

  const startProgress = () => {
    setProgress(0); setMsgIdx(0);
    let p = 0; let m = 0;
    intervalRef.current = setInterval(() => {
      p = Math.min(p + Math.random() * 8, 92);
      m = Math.min(Math.floor(p / 20), PARSE_MESSAGES.length - 1);
      setProgress(p); setMsgIdx(m);
    }, 400);
  };

  const stopProgress = (final) => {
    clearInterval(intervalRef.current);
    setProgress(final);
  };

  const handleParse = async () => {
    if (!file) return;
    setStep('parsing'); setParseErr('');
    startProgress();
    try {
      const res = await EmployeeService.parseResume(file);
      stopProgress(100);
      if (res.data?.success) {
        setStep('success');
        const parsed = res.data.result;
        const filledCount = Object.values(parsed).filter(v => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)).length;
        const total = Object.keys(parsed).length;
        const partial = filledCount < total * 0.4;
        setTimeout(() => onParsed(parsed, file, partial), 700);
      } else {
        const msg = res.data?.errors?.[0] || "We couldn't parse this resume. Please fill the form manually.";
        setParseErr(msg); setStep('error');
      }
    } catch (err) {
      stopProgress(0);
      const msg = err.response?.data?.errors?.[0] || "We couldn't parse this resume. Please fill the form manually.";
      setParseErr(msg); setStep('error');
    }
  };

  const fmt = (b) => b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
  const icon = (n) => { const e = n.split('.').pop().toLowerCase(); return e === 'pdf' ? '📄' : '📝'; };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
          <div style={styles.headerIcon}>✨</div>
          <h2 style={styles.title}>Upload Resume</h2>
          <p style={styles.subtitle}>Auto-fill candidate details from their resume</p>
          {/* Stepper */}
          <div style={styles.stepper}>
            {['Upload', 'Parse', 'Fill Form'].map((s, i) => {
              const stepMap = { upload: 0, parsing: 1, success: 2, error: 0 };
              const cur = stepMap[step];
              return (
                <React.Fragment key={s}>
                  <div style={{ ...styles.stepItem, ...(i <= cur ? styles.stepActive : {}) }}>
                    <div style={{ ...styles.stepNum, ...(i <= cur ? styles.stepNumActive : {}) }}>{i + 1}</div>
                    <span style={styles.stepLabel}>{s}</span>
                  </div>
                  {i < 2 && <div style={{ ...styles.stepLine, ...(i < cur ? styles.stepLineActive : {}) }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={styles.body}>

          {/* ── UPLOAD ── */}
          {step === 'upload' && (
            <div>
              <div
                style={{
                  ...styles.dropzone,
                  ...(dragOver ? styles.dropzoneActive : {}),
                  ...(file ? styles.dropzoneFilled : {}),
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && pick(e.target.files[0])} />
                {file ? (
                  <div style={styles.fileCard}>
                    <span style={{ fontSize: 40 }}>{icon(file.name)}</span>
                    <div>
                      <div style={styles.fileName}>{file.name}</div>
                      <div style={styles.fileSize}>{fmt(file.size)}</div>
                    </div>
                    <button
                      style={styles.removeBtn}
                      onClick={(e) => { e.stopPropagation(); setFile(null); setValidErr(''); }}
                    >✕ Remove</button>
                  </div>
                ) : (
                  <div style={styles.dropPlaceholder}>
                    <div style={styles.uploadIconWrap}>
                      <span style={{ fontSize: 32 }}>📤</span>
                    </div>
                    <p style={styles.dropTitle}>{dragOver ? 'Drop it here!' : 'Drag & drop your resume'}</p>
                    <p style={styles.dropSub}>or click to browse</p>
                    <p style={styles.dropHint}>PDF, DOC, DOCX · Max 5MB</p>
                  </div>
                )}
              </div>

              {validErr && (
                <div style={styles.errBox}>⚠ {validErr}</div>
              )}

              <button
                onClick={handleParse}
                disabled={!file}
                style={{ ...styles.primaryBtn, ...(!file ? styles.primaryBtnDisabled : {}) }}
              >
                ✨ Parse Resume &amp; Auto-Fill
              </button>
              <button onClick={onSkip} style={styles.skipBtn}>
                ↷ Skip &amp; Fill Manually
              </button>
            </div>
          )}

          {/* ── PARSING ── */}
          {step === 'parsing' && (
            <div style={styles.center}>
              <div style={styles.parseIconWrap}>
                <span style={{ fontSize: 36 }}>🤖</span>
              </div>
              <p style={styles.parseTitle}>AI is reading your resume...</p>
              <p style={styles.parseMsg}>{PARSE_MESSAGES[msgIdx]}</p>
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressBar, width: `${progress}%` }} />
              </div>
              <p style={styles.progressPct}>{Math.round(progress)}%</p>
              <p style={styles.parseNote}>This may take 10–30 seconds</p>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div style={styles.center}>
              <div style={styles.successIcon}>✅</div>
              <p style={styles.parseTitle}>Resume Parsed Successfully!</p>
              <p style={styles.parseMsg}>Opening form with auto-filled details...</p>
            </div>
          )}

          {/* ── ERROR ── */}
          {step === 'error' && (
            <div style={styles.center}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
              <p style={styles.parseTitle}>Parsing Failed</p>
              <p style={{ ...styles.parseMsg, color: '#ef4444', marginBottom: 20 }}>{parseErr}</p>
              <button onClick={() => { setStep('upload'); setFile(null); }} style={styles.primaryBtn}>Try Another File</button>
              <button onClick={onSkip} style={styles.skipBtn}>Fill Manually Instead</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    width: '100%', maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
    animation: 'slideUp 0.25s ease',
  },
  header: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    padding: '28px 24px 20px',
    position: 'relative',
    color: '#fff',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    background: 'rgba(255,255,255,0.2)', border: 'none',
    color: '#fff', borderRadius: 8, width: 32, height: 32,
    cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  headerIcon: { fontSize: 28, marginBottom: 8 },
  title: { margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#fff' },
  subtitle: { margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 },
  stepItem: { display: 'flex', alignItems: 'center', gap: 6, opacity: 0.5 },
  stepActive: { opacity: 1 },
  stepNum: {
    width: 22, height: 22, borderRadius: '50%',
    background: 'rgba(255,255,255,0.3)',
    color: '#fff', fontSize: 11, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  stepNumActive: { background: '#fff', color: '#4f46e5' },
  stepLabel: { fontSize: 12, color: '#fff', fontWeight: 600 },
  stepLine: { width: 32, height: 2, background: 'rgba(255,255,255,0.3)', margin: '0 4px' },
  stepLineActive: { background: '#fff' },
  body: { padding: '28px 28px 24px' },
  dropzone: {
    border: '2px dashed #d1d5db',
    borderRadius: 14,
    padding: '32px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#f9fafb',
    marginBottom: 14,
    minHeight: 160,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dropzoneActive: {
    borderColor: '#4f46e5', backgroundColor: '#eef2ff',
    transform: 'scale(1.01)',
  },
  dropzoneFilled: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  fileCard: {
    display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
    width: '100%', justifyContent: 'space-between',
  },
  fileName: { fontWeight: 600, fontSize: 14, color: '#111', wordBreak: 'break-all' },
  fileSize: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  removeBtn: {
    background: 'none', border: '1px solid #e5e7eb', borderRadius: 8,
    fontSize: 12, color: '#6b7280', cursor: 'pointer', padding: '4px 10px',
    whiteSpace: 'nowrap',
  },
  dropPlaceholder: { width: '100%' },
  uploadIconWrap: {
    width: 64, height: 64, borderRadius: '50%',
    background: '#ede9fe', margin: '0 auto 12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dropTitle: { fontSize: 15, fontWeight: 600, color: '#374151', margin: '0 0 4px' },
  dropSub: { fontSize: 13, color: '#9ca3af', margin: '0 0 8px' },
  dropHint: { fontSize: 12, color: '#d1d5db', margin: 0 },
  errBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#dc2626', borderRadius: 8, padding: '10px 14px',
    fontSize: 13, marginBottom: 12,
  },
  primaryBtn: {
    width: '100%', padding: '14px 0',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    marginBottom: 10, transition: 'opacity 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryBtnDisabled: { opacity: 0.45, cursor: 'not-allowed' },
  skipBtn: {
    width: '100%', padding: '11px 0',
    background: '#f3f4f6', color: '#6b7280',
    border: '1px solid #e5e7eb', borderRadius: 12,
    fontSize: 14, cursor: 'pointer', fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  center: { textAlign: 'center', padding: '12px 0' },
  parseIconWrap: {
    width: 72, height: 72, borderRadius: '50%',
    background: '#ede9fe', margin: '0 auto 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'pulse 1.5s infinite',
  },
  parseTitle: { fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 6px' },
  parseMsg: { fontSize: 13, color: '#6b7280', margin: '0 0 20px' },
  progressTrack: {
    height: 10, backgroundColor: '#e5e7eb', borderRadius: 10,
    overflow: 'hidden', marginBottom: 8,
  },
  progressBar: {
    height: '100%', borderRadius: 10,
    background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
    transition: 'width 0.4s ease',
  },
  progressPct: { fontSize: 13, fontWeight: 600, color: '#4f46e5', margin: '0 0 12px' },
  parseNote: { fontSize: 12, color: '#9ca3af', margin: 0 },
  successIcon: { fontSize: 56, marginBottom: 12 },
};
