import { useState } from 'react';
import { adminAPI } from '../services/api';

/**
 * Renders two actions: Download PDF + Email to customer.
 * Props:
 *   orderId  — string
 *   compact  — bool (icon-only style for table rows)
 */
const InvoiceButton = ({ orderId, compact = false }) => {
  const [dlLoading, setDlLoading]     = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent]     = useState(false);
  const [error, setError]             = useState('');

  const handleDownload = async () => {
    setDlLoading(true);
    setError('');
    try {
      const { data } = await adminAPI.downloadInvoice(orderId);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId.slice(-10).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed');
    } finally {
      setDlLoading(false);
    }
  };

  const handleEmail = async () => {
    setEmailLoading(true);
    setError('');
    setEmailSent(false);
    try {
      await adminAPI.emailInvoice(orderId);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 4000);
    } catch {
      setError('Email failed');
    } finally {
      setEmailLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDownload}
          disabled={dlLoading}
          title="Download Invoice PDF"
          className="w-8 h-8 flex items-center justify-center rounded-full border border-[#EAEAEA] text-[#6B7280] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition duration-300 disabled:opacity-40"
        >
          {dlLoading ? <Spinner /> : <DownloadIcon />}
        </button>
        <button
          onClick={handleEmail}
          disabled={emailLoading || emailSent}
          title={emailSent ? 'Invoice sent!' : 'Email Invoice to Customer'}
          className={`w-8 h-8 flex items-center justify-center rounded-full border transition duration-300 disabled:opacity-40 ${
            emailSent
              ? 'border-green-200 text-green-600 bg-green-50'
              : 'border-[#EAEAEA] text-[#6B7280] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
          }`}
        >
          {emailLoading ? <Spinner /> : emailSent ? <CheckIcon /> : <MailIcon />}
        </button>
        {error && <span className="text-[10px] text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <button
        onClick={handleDownload}
        disabled={dlLoading}
        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#EAEAEA] rounded-full text-xs tracking-widest uppercase text-[#1A1A1A] hover:bg-[#FAFAFA] transition duration-300 disabled:opacity-50"
      >
        {dlLoading ? (
          <><Spinner /><span>Generating...</span></>
        ) : (
          <><DownloadIcon /><span>Download Invoice</span></>
        )}
      </button>

      <button
        onClick={handleEmail}
        disabled={emailLoading || emailSent}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs tracking-widest uppercase transition duration-300 disabled:opacity-50 ${
          emailSent
            ? 'bg-green-50 text-green-600 border border-green-200'
            : 'bg-[#1A1A1A] text-white hover:opacity-80'
        }`}
      >
        {emailLoading ? (
          <><SpinnerWhite /><span>Sending...</span></>
        ) : emailSent ? (
          <><CheckIcon /><span>Invoice Sent</span></>
        ) : (
          <><MailIcon className="text-white" /><span>Email Invoice</span></>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-400 self-center">{error}</p>
      )}
    </div>
  );
};

// ── icons ────────────────────────────────────────────────────────────────────

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const MailIcon = ({ className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const Spinner = () => (
  <span className="w-3.5 h-3.5 border border-[#EAEAEA] border-t-[#1A1A1A] rounded-full animate-spin inline-block" />
);

const SpinnerWhite = () => (
  <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin inline-block" />
);

export default InvoiceButton;
