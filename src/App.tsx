import { useEffect } from 'react';
import { useStore } from './store';
import { setAIHeadersProvider, setImgHeadersProvider, setVidHeadersProvider } from './api';
import Sidebar from './components/Sidebar';
import EditorPanel from './components/EditorPanel';
import ChatPanel from './components/ChatPanel';
import EmptyState from './components/EmptyState';
import SettingsPage from './components/SettingsPage';

export default function App() {
  const {
    loadProjects,
    loadModules,
    currentProject,
    sidebarOpen,
    showSettings,
    toggleSettings,
    getAIConfigHeaders,
    getImgConfigHeaders,
    getVidConfigHeaders,
    customBackground,
  } = useStore();

  useEffect(() => {
    setAIHeadersProvider(getAIConfigHeaders);
    setImgHeadersProvider(getImgConfigHeaders);
    setVidHeadersProvider(getVidConfigHeaders);
  }, [getAIConfigHeaders, getImgConfigHeaders, getVidConfigHeaders]);

  useEffect(() => {
    loadProjects();
    loadModules();
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden relative" style={{ background: '#1C1815' }}>
      {/* 🎞️ Custom Background Image */}
      {customBackground && (
        <>
          <img src={customBackground} alt="" className="custom-bg-image" />
          <div className="custom-bg-overlay" />
        </>
      )}

      {/* 🎞️ Film Frame Background Layers (only when no custom background) */}
      {!customBackground && (
        <>
          <div className="film-vignette" />
          <div className="film-ambient" />
          <div
            style={{
              position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
              background:
                'radial-gradient(ellipse 70% 50% at 15% 85%, rgba(90,60,30,0.13) 0%, transparent 70%), ' +
                'radial-gradient(ellipse 50% 70% at 85% 15%, rgba(140,110,60,0.08) 0%, transparent 60%), ' +
                'linear-gradient(160deg, rgba(28,24,21,0) 0%, rgba(28,24,21,0.25) 100%)',
            }}
          />
        </>
      )}

      {/* 🎞️ Film grain (always on) */}
      <div className="film-grain" />

      {/* Content */}
      <div className="relative z-10 flex h-full w-full">
        {sidebarOpen && <Sidebar />}

        {currentProject ? (
          <div className="flex flex-1 overflow-hidden">
            <EditorPanel />
            <ChatPanel />
          </div>
        ) : (
          <EmptyState />
        )}

        {showSettings && <SettingsPage onClose={toggleSettings} />}
      </div>
    </div>
  );
}
