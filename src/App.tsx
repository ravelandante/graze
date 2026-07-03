import { useEffect, useMemo, useState } from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  usePanelRef,
} from "react-resizable-panels";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "./store";
import { CollectionSidebar } from "./components/CollectionSidebar";
import { RecordingList } from "./components/RecordingList";
import { RecordingDetail } from "./components/RecordingDetail";
import { Playbar } from "./components/Playbar";
import { useAudioPlayer } from "./hooks/useAudioPlayer";

export default function App() {
  const recordings = useStore((s) => s.recordings);
  const memberships = useStore((s) => s.memberships);
  const selectedCollectionId = useStore((s) => s.selectedCollectionId);
  const searchQuery = useStore((s) => s.searchQuery);
  const selectedRecordingId = useStore((s) => s.selectedRecordingId);
  const status = useStore((s) => s.status);
  const loadAll = useStore((s) => s.loadAll);
  const startPeakComputation = useStore((s) => s.startPeakComputation);

  useEffect(() => {
    loadAll().then(() => startPeakComputation());
  }, [loadAll, startPeakComputation]);

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "graze-main",
    storage: localStorage,
  });
  const detailPanelRef = usePanelRef();
  const [isDetailCollapsed, setIsDetailCollapsed] = useState(false);

  const visibleRecordings = useMemo(() => {
    const collectionIds =
      selectedCollectionId !== null
        ? (memberships.get(selectedCollectionId) ?? new Set<number>())
        : null;
    const q = searchQuery.toLowerCase();
    return recordings.filter((r) => {
      if (collectionIds && !collectionIds.has(r.id)) return false;
      if (!q) return true;
      return (
        r.fileName?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q) ||
        r.originator?.toLowerCase().includes(q)
      );
    });
  }, [recordings, memberships, selectedCollectionId, searchQuery]);

  const {
    isPlaying,
    isLooping,
    isAutoAdvance,
    isAutoplay,
    currentTime,
    togglePlay,
    stop,
    playNext,
    toggleLoop,
    toggleAutoAdvance,
    toggleAutoplay,
    audioEl,
  } = useAudioPlayer(visibleRecordings);

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-white overflow-hidden">
      <div className="flex flex-1 min-h-0">
        <CollectionSidebar />
        <Group
          orientation="horizontal"
          defaultLayout={defaultLayout}
          onLayoutChanged={onLayoutChanged}
          className="flex-1 min-h-0"
        >
          <Panel
            id="list"
            defaultSize={25}
            minSize={12}
            className="flex flex-col"
          >
            <RecordingList visibleRecordings={visibleRecordings} />
          </Panel>
          <Separator className="relative w-1 bg-zinc-800 hover:bg-zinc-600 transition-colors cursor-col-resize overflow-visible">
            <button
              onClick={(e) => {
                e.stopPropagation();
                isDetailCollapsed
                  ? detailPanelRef.current?.expand()
                  : detailPanelRef.current?.collapse();
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-4 h-6 rounded bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 cursor-pointer"
              title={
                isDetailCollapsed ? "Open detail panel" : "Close detail panel"
              }
            >
              {isDetailCollapsed ? (
                <ChevronLeft size={10} strokeWidth={2.5} />
              ) : (
                <ChevronRight size={10} strokeWidth={2.5} />
              )}
            </button>
          </Separator>
          <Panel
            id="main"
            collapsible
            collapsedSize={0}
            minSize={20}
            panelRef={detailPanelRef}
            onResize={(size) => setIsDetailCollapsed(size.inPixels < 1)}
            className="flex flex-col overflow-hidden"
          >
            <main className="flex-1 flex flex-col overflow-hidden">
              {selectedRecordingId ? (
                <RecordingDetail key={selectedRecordingId} />
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
                  Select a recording
                </div>
              )}
            </main>
          </Panel>
        </Group>
      </div>
      {status && (
        <div className="fixed bottom-16 right-4 z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg px-4 py-2 text-xs text-zinc-300 pointer-events-none">
          {status}
        </div>
      )}
      <Playbar
        audioEl={audioEl}
        currentTime={currentTime}
        isPlaying={isPlaying}
        isLooping={isLooping}
        isAutoAdvance={isAutoAdvance}
        isAutoplay={isAutoplay}
        onTogglePlay={togglePlay}
        onStop={stop}
        onNext={playNext}
        onToggleLoop={toggleLoop}
        onToggleAutoAdvance={toggleAutoAdvance}
        onToggleAutoplay={toggleAutoplay}
      />
    </div>
  );
}
