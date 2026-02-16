import { IsUUID } from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  sessionId!: string;

  @IsUUID()
  seatId!: string;
}
