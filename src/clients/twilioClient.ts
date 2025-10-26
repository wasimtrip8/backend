// src/utils/twilioClient.ts
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_FROM_NUMBER!;

if (!accountSid || !authToken || !fromNumber) {
  throw new Error('Twilio environment variables are missing!');
}

/**
 * Send SMS using Twilio REST API
 * @param to - recipient phone number in E.164 format
 * @param body - SMS body text
 */
export const sendSms = async (to: string, body: string) => {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', fromNumber);
  params.append('Body', body);

  try {
    const response = await axios.post(url, params, {
      auth: { username: accountSid, password: authToken },
    });
    console.log('Twilio message SID:', response.data.sid);
    return response.data;
  } catch (err: any) {
    console.error('Twilio API error:', err.response?.data || err.message);
    throw new Error('Failed to send SMS via Twilio');
  }
};
