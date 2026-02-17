import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'ID da sessão de cinema',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  sessionId!: string;

  @ApiProperty({
    description: 'ID do assento a ser reservado',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  seatId!: string;
}
