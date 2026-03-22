import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AdminJwtAuthGuard } from 'src/auth/guard/admin-jwt.guard';

@Controller('analytics')
@UseGuards(AdminJwtAuthGuard)
export class AnalyticsController {
    constructor(private readonly analytics: AnalyticsService) { }

    @Get('stats')
    getStats() {
        return this.analytics.getStats();
    }



    // GET analytics/time-series?days=30
    // Area/line chart data — daily revenue, orders, visitors
    @Get('time-series')
    getTimeSeries(
        @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    ) {
        return this.analytics.getTimeSeries(days);
    }



    // GET analytics/category-breakdown
    // Pie chart — revenue percentage by category
    @Get('category-breakdown')
    getCategoryBreakdown() {
        return this.analytics.getCategoryBreakdown();
    }




    // GET analytics/top-products?limit=5
    // Top products by sales volume
    @Get('top-products')
    getTopProducts(
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    ) {
        return this.analytics.getTopProducts(limit);
    }





    // GET analytics/recent-orders?limit=10
    // Latest orders for the table
    @Get('recent-orders')
    getRecentOrders(
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
        return this.analytics.getRecentOrders(limit);
    }



}
