import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MessageSquare, Star } from "lucide-react";
import Modal from "./Modal";
import API, { getErrorMessage } from "../api";

const SIZE = 44;
const MARGIN = 12;
const STORAGE_KEY = "feedback-pos";

function clamp(pos) {
  return {
    x: Math.min(Math.max(pos.x, MARGIN), Math.max(window.innerWidth - SIZE - MARGIN, MARGIN)),
    y: Math.min(Math.max(pos.y, MARGIN), Math.max(window.innerHeight - SIZE - MARGIN, MARGIN)),
  };
}

function initialPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return clamp(saved);
  } catch {
    // storage unavailable or corrupt, use the default
  }
  // Default: bottom-left, small, away from the page content and the right-hand scrollbar area.
  return clamp({ x: MARGIN, y: window.innerHeight - SIZE - MARGIN });
}

export default function FeedbackWidget() {
  const [pos, setPos] = useState(initialPosition);
  const drag = useRef(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  // Keep the button on screen if the window is resized or the phone is rotated.
  useEffect(() => {
    const onResize = () => setPos((current) => clamp(current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function onPointerDown(event) {
    drag.current = { startX: event.clientX, startY: event.clientY, originX: pos.x, originY: pos.y, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 5) return; // small movement still counts as a click
    d.moved = true;
    setPos(clamp({ x: d.originX + dx, y: d.originY + dy }));
  }

  function onPointerUp(event) {
    const d = drag.current;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!d) return;
    if (d.moved) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clamp(pos)));
      } catch {
        // ignore
      }
    } else {
      setOpen(true);
    }
  }

  function onKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function close() {
    setOpen(false);
  }

  async function submit(event) {
    event.preventDefault();
    if (!rating) {
      toast.error("Pick a star rating first.");
      return;
    }
    setSending(true);
    try {
      await API.post("/feedback", { rating, comment: comment.trim() || null });
      toast.success("Thanks for your feedback.");
      setRating(0);
      setComment("");
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={onKeyDown}
        style={{ left: pos.x, top: pos.y, width: SIZE, height: SIZE, touchAction: "none" }}
        className="fixed z-30 grid cursor-grab touch-none select-none place-items-center rounded-full border border-accent/50 bg-surface text-accent shadow-lg transition-colors hover:bg-accent hover:text-accent-fg active:cursor-grabbing"
        aria-label="Send feedback (drag to move)"
        title="Feedback (drag to move)"
      >
        <MessageSquare size={18} />
      </button>

      <Modal open={open} onClose={close} title="Send feedback">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-fg-muted">How is CyberGuard AI working for you?</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value > 1 ? "s" : ""}`}
                  onClick={() => setRating(value)}
                  className="rounded p-1"
                >
                  <Star
                    size={26}
                    className={value <= rating ? "fill-warn text-warn" : "text-fg-subtle"}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="feedback-comment" className="mb-1.5 block text-sm font-medium text-fg-muted">
              Comment (optional)
            </label>
            <textarea
              id="feedback-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={4}
              className="input resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={sending} className="btn btn-primary">
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
