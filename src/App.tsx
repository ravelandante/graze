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
import { registerWatcherListeners } from "./lib/watcher";
import { isFilterActive, matchesFilter } from "./lib/filterColumns";
import { CollectionSidebar } from "@components/collections/CollectionSidebar";
import { RecordingList } from "@components/recordings/RecordingList";
import { RecordingDetail } from "@components/recordings/RecordingDetail";
import { Playbar } from "@components/player/Playbar";
import { useAudioPlayer } from "./hooks/useAudioPlayer";

export default function App() {
  const recordings = useStore((s) => s.recordings);
  const memberships = useStore((s) => s.memberships);
  const filterCollectionIds = useStore((s) => s.filterCollectionIds);
  const columnFilters = useStore((s) => s.columnFilters);
  const searchQuery = useStore((s) => s.searchQuery);
  const selectedRecordingId = useStore((s) => s.selectedRecordingId);
  const status = useStore((s) => s.status);
  const loadAll = useStore((s) => s.loadAll);
  const reconcileLibrary = useStore((s) => s.reconcileLibrary);
  const handleFilesAdded = useStore((s) => s.handleFilesAdded);
  const handleFilesRemoved = useStore((s) => s.handleFilesRemoved);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    async function setup() {
      unlisten = await registerWatcherListeners(
        handleFilesAdded,
        handleFilesRemoved,
      );
      await loadAll();
      await reconcileLibrary();
    }
    void setup();
    return () => {
      unlisten?.();
    };
  }, [loadAll, reconcileLibrary, handleFilesAdded, handleFilesRemoved]);

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "graze-main",
    storage: localStorage,
  });
  const detailPanelRef = usePanelRef();
  const [isDetailCollapsed, setIsDetailCollapsed] = useState(false);

  const visibleRecordings = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const activeFilters = columnFilters.filter(isFilterActive);
    return recordings.filter((r) => {
      if (filterCollectionIds.size > 0) {
        const inAny = [...filterCollectionIds].some((cid) =>
          memberships.get(cid)?.has(r.id),
        );
        if (!inAny) return false;
      }
      for (const f of activeFilters) {
        if (!matchesFilter(r, f)) return false;
      }
      if (!q) return true;
      return (
        r.fileName?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q) ||
        r.originator?.toLowerCase().includes(q)
      );
    });
  }, [
    recordings,
    memberships,
    filterCollectionIds,
    columnFilters,
    searchQuery,
  ]);

  const {
    isPlaying,
    isLooping,
    isAutoAdvance,
    isAutoplay,
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
                if (isDetailCollapsed) {
                  detailPanelRef.current?.expand();
                } else {
                  detailPanelRef.current?.collapse();
                }
              }}
              className="absolute top-1/2 left-1/2 -translate-x-3/4 -translate-y-1/2 z-20 flex items-center justify-center w-4 h-6 rounded bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 cursor-pointer"
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
