import "server-only";

import type { AdminContext } from "./admin-auth";
import type { OverviewRange } from "./admin-analytics";
import { createAdminClient } from "./supabase/admin";

export const SENTIMENT_LABELS = {
  at_home: "I felt at home",
  some_parts: "Some parts felt right",
  not_for_me: "It wasn’t for me",
  not_sure: "I’m not sure yet",
} as const;

type Sentiment = keyof typeof SENTIMENT_LABELS;
type StayRow = { id: string; property_id: string };
type FeedbackRow = { stay_id: string; property_id: string; sentiment: Sentiment; comment: string | null; submitted_at: string };

export type FeedbackAnalytics = {
  eligibleStays: number;
  responses: number;
  responseRate: number;
  distribution: Array<{ sentiment: Sentiment; label: string; count: number; percentage: number }>;
  properties: Array<{ id: string; name: string; eligible: number; responses: number; responseRate: number; positiveRate: number }>;
  comments: Array<{ comment: string; property: string; submittedAt: string }>;
  commentsSuppressed: boolean;
};

export async function loadFeedbackAnalytics(context: AdminContext, range: OverviewRange, requestedProperty?: string): Promise<FeedbackAnalytics> {
  const selectedProperty = requestedProperty && context.properties.some((property) => property.id === requestedProperty) ? requestedProperty : null;
  const propertyIds = selectedProperty ? [selectedProperty] : context.properties.map((property) => property.id);
  if (!propertyIds.length) return emptyFeedback();
  const admin = createAdminClient();
  const { data: stayData, error: stayError } = await admin.from("stays").select("id, property_id").in("property_id", propertyIds).gte("check_out", range.start).lte("check_out", range.end).limit(10000);
  if (stayError) throw new Error(`Unable to load feedback cohort: ${stayError.message}`);
  const stays = (stayData || []) as StayRow[];
  const feedback: FeedbackRow[] = [];
  for (let index = 0; index < stays.length; index += 200) {
    const ids = stays.slice(index, index + 200).map((stay) => stay.id);
    if (!ids.length) continue;
    const { data, error } = await admin.from("guest_feedback").select("stay_id, property_id, sentiment, comment, submitted_at").in("stay_id", ids).is("withdrawn_at", null).limit(10000);
    if (error) throw new Error(`Unable to load guest feedback: ${error.message}`);
    feedback.push(...((data || []) as FeedbackRow[]));
  }

  const counts = new Map<Sentiment, number>((Object.keys(SENTIMENT_LABELS) as Sentiment[]).map((sentiment) => [sentiment, 0]));
  feedback.forEach((item) => counts.set(item.sentiment, (counts.get(item.sentiment) || 0) + 1));
  const responses = feedback.length;
  const propertyNames = new Map(context.properties.map((property) => [property.id, property.name]));
  const properties = propertyIds.map((propertyId) => {
    const eligible = stays.filter((stay) => stay.property_id === propertyId).length;
    const propertyFeedback = feedback.filter((item) => item.property_id === propertyId);
    const positive = propertyFeedback.filter((item) => item.sentiment === "at_home" || item.sentiment === "some_parts").length;
    return { id: propertyId, name: propertyNames.get(propertyId) || "Unknown property", eligible, responses: propertyFeedback.length, responseRate: eligible ? Math.round(propertyFeedback.length / eligible * 100) : 0, positiveRate: propertyFeedback.length ? Math.round(positive / propertyFeedback.length * 100) : 0 };
  }).filter((property) => property.eligible || property.responses).sort((a, b) => b.responses - a.responses || a.name.localeCompare(b.name));

  return {
    eligibleStays: stays.length,
    responses,
    responseRate: stays.length ? Math.round(responses / stays.length * 100) : 0,
    distribution: (Object.keys(SENTIMENT_LABELS) as Sentiment[]).map((sentiment) => ({ sentiment, label: SENTIMENT_LABELS[sentiment], count: counts.get(sentiment) || 0, percentage: responses ? Math.round((counts.get(sentiment) || 0) / responses * 100) : 0 })),
    properties,
    comments: responses >= 5 ? feedback.filter((item) => item.comment).slice(0, 50).map((item) => ({ comment: item.comment!, property: propertyNames.get(item.property_id) || "Property", submittedAt: item.submitted_at })) : [],
    commentsSuppressed: responses > 0 && responses < 5,
  };
}

function emptyFeedback(): FeedbackAnalytics {
  return { eligibleStays: 0, responses: 0, responseRate: 0, distribution: (Object.keys(SENTIMENT_LABELS) as Sentiment[]).map((sentiment) => ({ sentiment, label: SENTIMENT_LABELS[sentiment], count: 0, percentage: 0 })), properties: [], comments: [], commentsSuppressed: false };
}
