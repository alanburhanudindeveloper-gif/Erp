/**
 * Infrastructure AI Adapter for Google Gemini SDK.
 *
 * Isolates third-party AI SDK dependencies (@google/genai) from the application
 * and domain layers behind an explicit port contract.
 */

import { GoogleGenAI } from '@google/genai';
import { aiTelemetryService } from './aiTelemetryService';

export interface IAiGateway {
  callWithTimeout(prompt: string, timeoutMs?: number): Promise<string | null>;
  isConfigured(): boolean;
}

export class GoogleGenAiGatewayAdapter implements IAiGateway {
  private client: GoogleGenAI | null = null;
  private readonly apiKey: string | undefined;

  constructor(apiKey?: string | null) {
    this.apiKey = apiKey === null ? undefined : (apiKey ?? process.env.GEMINI_API_KEY);
    if (this.apiKey) {
      try {
        this.client = new GoogleGenAI();
      } catch (err) {
        console.warn('[AI Gateway Adapter] GoogleGenAI initialization warning:', err);
      }
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client && this.apiKey);
  }

  async callWithTimeout(prompt: string, timeoutMs = 5000): Promise<string | null> {
    if (!this.client || !this.apiKey) return null;

    try {
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), timeoutMs)
      );

      const apiPromise = this.client.models
        .generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        })
        .then((res) => res.text || null)
        .catch((err) => {
          console.warn('[AI Gateway Adapter API Error]', err?.message || err);
          return null;
        });

      return await Promise.race([apiPromise, timeoutPromise]);
    } catch (err) {
      console.warn('[AI Gateway Adapter Error]', err);
      return null;
    }
  }
}

export const aiGatewayAdapter: IAiGateway = new GoogleGenAiGatewayAdapter();
