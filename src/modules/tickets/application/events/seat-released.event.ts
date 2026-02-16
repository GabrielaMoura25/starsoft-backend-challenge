export class SeatReleasedEvent {
  constructor(
    public readonly seatId: string,
    public readonly sessionId: string,
  ) {}
}
