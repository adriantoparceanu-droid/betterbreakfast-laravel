import { useState } from 'react';
import { SettingsModal } from './SettingsModal';
import { useT } from '@/hooks/useT';

export function AppHeader() {
    const { t } = useT();
    const [settingsOpen, setSettingsOpen] = useState(false);
    return (
        <>
            <div className="flex items-center justify-between px-4 py-3">
                <span />
                <button onClick={() => setSettingsOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-lg"
                    aria-label={t('header.settings')}>⚙</button>
            </div>
            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </>
    );
}
