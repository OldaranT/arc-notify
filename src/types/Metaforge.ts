export interface MetaforgeEvent {
  name: string;
  map: string;
  icon: string;
  startTime: number;
  endTime: number;
}

export interface MetaforgeResponse {
  data: MetaforgeEvent[];
}