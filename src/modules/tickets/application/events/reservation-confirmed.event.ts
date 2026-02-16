export class ReservationConfirmedEvent {
  constructor(
    public readonly reservationId: string,
    public readonly userId: string,
    public readonly seatId: string,
  ) {}
}
