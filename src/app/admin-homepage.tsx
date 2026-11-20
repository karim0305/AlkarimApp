import React, { useState } from 'react';
import { AnnouncementsAdmin, BannersAdmin, SectionsAdmin } from '@/components/homepage-admin';
import { Chip, ChipRow, Screen } from '@/components/ui';

const TABS = [['announcements', 'Announcement bar'], ['banners', 'Hero slider'], ['rows', 'Product rows']] as const;

export default function AdminHomepage() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('announcements');
  return (
    <Screen>
      <ChipRow>{TABS.map(([k, l]) => <Chip key={k} label={l} selected={tab === k} onPress={() => setTab(k)} />)}</ChipRow>
      {tab === 'announcements' && <AnnouncementsAdmin />}
      {tab === 'banners' && <BannersAdmin />}
      {tab === 'rows' && <SectionsAdmin />}
    </Screen>
  );
}
