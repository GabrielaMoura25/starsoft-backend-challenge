import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Título do filme',
    example: 'Inception',
  })
  @IsString()
  movieTitle!: string;

  @ApiProperty({
    description: 'Sala de cinema',
    example: 'Sala 1',
  })
  @IsString()
  room!: string;

  @ApiProperty({
    description: 'Data e hora da sessão (ISO 8601)',
    example: '2026-02-17T19:00:00Z',
  })
  @IsString()
  dateTime!: string;

  @ApiProperty({
    description: 'Preço do ingresso em reais',
    example: 45.5,
  })
  @IsNumber()
  @Min(1)
  price!: number;

  @ApiProperty({
    description: 'Número total de assentos',
    example: 100,
    minimum: 16,
  })
  @IsNumber()
  @Min(16)
  totalSeats!: number;
}
