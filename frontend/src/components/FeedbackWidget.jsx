import { useState } from "react";
import toast from "react-hot-toast";
import { MessageSquare, Star } from "lucide-react";
import Modal from "./Modal";
import API, { getErrorMessage } from "../api";

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

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
        onClick={() => setOpen(true)}
        className="btn btn-primary fixed bottom-5 right-5 z-30 shadow-lg"
        aria-label="Send feedback"
      >
        <MessageSquare size={16} />
        <span className="hidden sm:inline">Feedback</span>
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
