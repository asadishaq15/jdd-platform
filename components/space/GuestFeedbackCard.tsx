"use client";

import { useEffect, useState } from "react";

const options = [
  ["at_home", "I felt at home"],
  ["some_parts", "Some parts felt right"],
  ["not_for_me", "It wasn’t for me"],
  ["not_sure", "I’m not sure yet"],
] as const;

type Feedback = { sentiment: string; comment: string | null; submitted_at: string };

export default function GuestFeedbackCard({ stayId, propertyName, checkOut }: { stayId: string; propertyName: string; checkOut: string | null }) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [sentiment, setSentiment] = useState("");
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const eligible = Boolean(checkOut && checkOut <= today);

  useEffect(() => {
    if (!eligible) return;
    void fetch(`/api/feedback?stayId=${encodeURIComponent(stayId)}`).then((response) => response.json()).then((result) => {
      if (result.feedback) {
        setFeedback(result.feedback);
        setSentiment(result.feedback.sentiment);
        setComment(result.feedback.comment || "");
      }
    }).finally(() => setLoading(false));
  }, [eligible, stayId]);

  if (!eligible || loading) return null;

  async function save() {
    if (!sentiment) { setError("Choose the response that feels closest."); return; }
    setSaving(true); setError("");
    const response = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ stayId, sentiment, comment }) });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) { setError(result.error || "Feedback could not be saved."); return; }
    setFeedback(result.feedback); setEditing(false);
  }

  async function withdraw() {
    setSaving(true);
    const response = await fetch("/api/feedback", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ stayId }) });
    setSaving(false);
    if (!response.ok) { setError("Feedback could not be withdrawn."); return; }
    setFeedback(null); setSentiment(""); setComment(""); setEditing(false);
  }

  if (feedback && !editing) {
    return <article className="sec reveal in guest-feedback"><p className="c-eye">After your stay</p><h2>Thank you for reflecting.</h2><p className="feedback-answer">{options.find(([value]) => value === feedback.sentiment)?.[1]}</p>{feedback.comment && <p className="feedback-comment">“{feedback.comment}”</p>}<div className="feedback-actions"><button type="button" onClick={() => setEditing(true)}>Edit response</button><button type="button" disabled={saving} onClick={withdraw}>Withdraw</button></div></article>;
  }

  return <article className="sec reveal in guest-feedback"><p className="c-eye">After your stay · {propertyName}</p><h2>How did this world feel?</h2><p className="sec-text">Choose the response that comes closest. You can change or withdraw it later.</p><div className="feedback-options">{options.map(([value, label]) => <button className={sentiment === value ? "selected" : ""} type="button" key={value} onClick={() => { setSentiment(value); setError(""); }}>{label}</button>)}</div><label className="feedback-note"><span>Anything you would like to add? <em>Optional</em></span><textarea maxLength={600} rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Your words, if you wish" /></label>{error && <p className="feedback-error" role="alert">{error}</p>}<div className="feedback-actions"><button className="primary" type="button" disabled={saving} onClick={save}>{saving ? "Saving…" : "Share reflection"}</button>{feedback && <button type="button" onClick={() => setEditing(false)}>Cancel</button>}</div></article>;
}
