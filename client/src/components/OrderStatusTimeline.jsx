/**
 * Visual step-by-step order status timeline.
 * Works for both customer view and admin view.
 */

const STEPS = [
  { key: 'pending',    label: 'Order Placed',  icon: '🛍️' },
  { key: 'processing', label: 'Processing',    icon: '⚙️' },
  { key: 'shipped',    label: 'Shipped',       icon: '🚚' },
  { key: 'delivered',  label: 'Delivered',     icon: '✓'  },
];

const ORDER_INDEX = { pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: -1 };

const OrderStatusTimeline = ({ currentStatus, statusHistory = [] }) => {
  const currentIdx = ORDER_INDEX[currentStatus] ?? 0;
  const isCancelled = currentStatus === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-red-50 rounded-xl border border-red-100">
        <span className="text-base">✕</span>
        <div>
          <p className="text-xs font-medium text-red-500 tracking-widest uppercase">Order Cancelled</p>
          {statusHistory.length > 0 && (
            <p className="text-[10px] text-red-400 mt-0.5">
              {new Date(statusHistory[statusHistory.length - 1].changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Step indicators */}
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done    = i < currentIdx;
          const active  = i === currentIdx;
          const pending = i > currentIdx;

          // Find history entry for this step
          const histEntry = statusHistory.find((h) => h.status === step.key);

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Node */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition duration-300 ${
                  done    ? 'bg-[#1A1A1A] text-white' :
                  active  ? 'bg-[#1A1A1A] text-white ring-4 ring-[#1A1A1A]/10' :
                            'bg-[#F5F5F5] text-[#6B7280]'
                }`}>
                  {done ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <span className="text-xs leading-none">{step.icon}</span>
                  )}
                </div>
                <p className={`text-[9px] mt-1.5 tracking-wide text-center max-w-[56px] leading-tight ${
                  active ? 'text-[#1A1A1A] font-medium' : pending ? 'text-[#D1D5DB]' : 'text-[#6B7280]'
                }`}>
                  {step.label}
                </p>
                {histEntry && (
                  <p className="text-[8px] text-[#9CA3AF] mt-0.5 text-center">
                    {new Date(histEntry.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-1 mb-5 transition duration-300 ${
                  i < currentIdx ? 'bg-[#1A1A1A]' : 'bg-[#EAEAEA]'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusTimeline;
