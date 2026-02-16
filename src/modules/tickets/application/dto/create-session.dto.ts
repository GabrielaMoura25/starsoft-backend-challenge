import { IsNumber, IsString, Min } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  movieTitle!: string;

  @IsString()
  room!: string;

  @IsString()
  dateTime!: string;

  @IsNumber()
  @Min(1)
  price!: number;

  @IsNumber()
  @Min(16)
  totalSeats!: number;
}
