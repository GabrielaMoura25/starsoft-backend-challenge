import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class GetUserPurchasesUseCase {
  private readonly logger = new Logger(GetUserPurchasesUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    this.logger.debug(`Fetching purchases for user: ${userId}`);

    const purchases = await this.prisma.sale.findMany({
      where: { userId },
      include: {
        session: {
          select: {
            id: true,
            movieTitle: true,
            room: true,
            dateTime: true,
            price: true,
          },
        },
        seat: {
          select: {
            number: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = {
      userId,
      totalPurchases: purchases.length,
      purchases: purchases.map((sale) => ({
        id: sale.id,
        sessionId: sale.sessionId,
        movieTitle: sale.session.movieTitle,
        room: sale.session.room,
        dateTime: sale.session.dateTime,
        seatNumber: sale.seat.number,
        price: sale.session.price,
        purchasedAt: sale.createdAt,
      })),
    };

    this.logger.log(
      `User purchases fetched successfully: userId=${userId}, totalPurchases=${result.totalPurchases}`,
    );

    return result;
  }
}
