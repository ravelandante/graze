import { Modal } from "./Modal";

interface Props {
  onClose: () => void;
}

export function WatchedFoldersModal({ onClose }: Props) {
  return (
    <Modal title="Watched Folders" onClose={onClose}>
      <p className="text-sm text-zinc-500">No watched folders yet.</p>
    </Modal>
  );
}
