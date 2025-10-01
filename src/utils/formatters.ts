import { ITrip } from "../models/itinerary";

export function formatPromptForItineraryCreation(data: ITrip): string {
  const {
    starting,
    destination,
    days,
    nights,
    trip_info,
    price,
    status,
    tags,
  } = data;

  const preferences: string[] = [];

  if (starting) preferences.push(`starting location: ${starting}`);
  if (destination) preferences.push(`destination: ${destination}`);
  if (days) preferences.push(`duration: ${days} days`);
  if (nights) preferences.push(`nights: ${nights}`);

  if (trip_info) {
    if (trip_info.trip_goals) preferences.push(`goals: ${trip_info.trip_goals}`);
    if (trip_info.itenary_type) preferences.push(`itinerary type: ${trip_info.itenary_type}`);
    if (trip_info.trip_types?.length) preferences.push(`trip categories: ${trip_info.trip_types.join(", ")}`);
    if (trip_info.preference) preferences.push(`preference: ${trip_info.preference}`);
    if (trip_info.preferred_price) preferences.push(`preferred pace: ${trip_info.preferred_price}`);
    if (trip_info.age_group) preferences.push(`age group: ${trip_info.age_group}`);
    if (typeof trip_info.has_kids === "boolean") {
      preferences.push(`travelling with kids: ${trip_info.has_kids ? "yes" : "no"}`);
    }
    if (trip_info.place_preference) preferences.push(`place preference: ${trip_info.place_preference}`);
    if (trip_info.place_comment) preferences.push(`place comment: ${trip_info.place_comment}`);
    if (trip_info.additional_activity) preferences.push(`additional activity: ${trip_info.additional_activity}`);
    if (trip_info.food_preference) preferences.push(`food preference: ${trip_info.food_preference}`);
    if (trip_info.food_budget) preferences.push(`food budget: ${trip_info.food_budget}`);
    if (trip_info.food_comment) preferences.push(`food comment: ${trip_info.food_comment}`);
    if (trip_info.places?.length) {
      preferences.push(`must include places: ${trip_info.places.map(p => p.name).join(", ")}`);
    }
  }

  if (price) preferences.push(`price: ${price}`);
  if (status) preferences.push(`status: ${status}`);
  if (tags?.length) preferences.push(`tags: ${tags.map(t => t.name).join(", ")}`);

  return `
Generate a detailed ${days}-day ${destination} itinerary}

Preferences to consider:
${preferences.join(', ')}

For each day, divide the activities based on time, type of activity, and logical flow of travel. Include the places from the "must include" list. Optimize travel between places.

✅ For every activity, include the distance (in kilometers) from the previous activity/place in the day under the field "distanceFromPrevious".

Return the result in this strict JSON format only (no markdown, no extra text):

{
  "location": "<destination name>",
  "days": [
    {
      "day": 1,
      "totalDistanceCovered": "<X km>",
      "date": "<YYYY-MM-DD>",
      "activities": [
        {
          "time": "<HH:MM AM/PM>",
          "title": "<short title>",
          "location": "<place name>",
          "description": "<summary>",
          "duration": "<X hours or X mins>",
          "tags": ["<tag1>", "<tag2>"],
          "distanceFromPrevious": "<X km>"
        }
      ]
    }
  ]
}
`.trim();
}

// Generic OpenAI response
interface OpenAIResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

export function extractTextFromOpenAI(response: OpenAIResponse): any | null {
  let rawText = response.choices[0].message.content.trim();
  rawText = rawText.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');

  try {
    const parsed = JSON.parse(rawText);
    if (typeof parsed === "string") return JSON.parse(parsed);
    return parsed;
  } catch (err) {
    console.error("Failed to parse OpenAI response:", err);
    return null;
  }
}
