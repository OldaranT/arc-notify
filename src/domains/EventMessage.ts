export class EventMessage {
  name: string;
  map: string;
  icon: string;
  startTime: Date;
  endTime: Date;
  key: string;

  constructor(data: {
    name: string;
    map: string;
    icon: string;
    startTime: number;
    endTime: number;
  }) {
    this.name = data.name;
    this.map = data.map;
    this.icon = data.icon;
    this.startTime = new Date(data.startTime);
    this.endTime = new Date(data.endTime);
    this.key = `${this.name}-${this.startTime.getTime()}-${this.endTime.getTime()}`;
  }
}