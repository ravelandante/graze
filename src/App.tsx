import { useEffect, useState } from "react";
import { CollectionSidebar } from "./components/CollectionSidebar";
export default function App() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    number | null
  >(null);
  async function handleCreateCollection(name: string) {
    const db = await getDb();
    await db.execute("INSERT INTO collections (name) VALUES (?)", [name]);
    await loadAll();
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      <CollectionSidebar
        collections={collections}
        selectedId={selectedCollectionId}
        onSelect={setSelectedCollectionId}
        onCreate={handleCreateCollection}
      />
    </div>
  );
}
