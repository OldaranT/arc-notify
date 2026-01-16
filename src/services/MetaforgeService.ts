import fetch from 'node-fetch';

export interface RawEvent {
  name: string;
  map: string;
  icon: string;
  startTime: number;
  endTime: number;
}

interface MetaforgeResponse {
  data: RawEvent[];
  cachedAt: number;
}

export class MetaforgeService {
  private url = 'https://metaforge.app/api/arc-raiders/events-schedule';

  async fetchEvents(): Promise<RawEvent[]> {
    const res = await fetch(this.url);

    if (!res.ok) {
      throw new Error(`Failed to fetch events: ${res.status} ${res.statusText}`);
    }

    // Tell TypeScript what type to expect
    const json = (await res.json()) as MetaforgeResponse;

    return json.data;
  }
}
