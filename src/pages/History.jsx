import React from 'react'

import HistorySection from '@/components/HistorySection.jsx'

export default function HistoryPage({
  participants,
  penalties,
  showImage,
  getInitials,
  formatSigned,
  formatDate,
  getSignClass,
}) {
  return (
    <div className="space-y-10">
      <HistorySection
        participants={participants}
        penalties={penalties}
        showImage={showImage}
        getInitials={getInitials}
        formatSigned={formatSigned}
        formatDate={formatDate}
        getSignClass={getSignClass}
      />
    </div>
  )
}
