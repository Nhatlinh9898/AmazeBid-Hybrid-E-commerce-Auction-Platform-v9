import { ShippingOption, ShippingInfo, TrackingEvent } from '../types';

/**
 * ShippingService simulates integration with real shipping APIs (GHN, GHTK, DHL, etc.)
 */
export const shippingService = {
  /**
   * Calculate shipping rates based on origin, destination, and package weight
   */
  async getShippingRates(origin: string, destination: string, weight: number): Promise<ShippingOption[]> {
    // In a real app, this would be a fetch to a shipping provider's API
    console.log(`Calculating shipping from ${origin} to ${destination} for ${weight}kg`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return [
      {
        id: 'ghn_standard',
        name: 'Giao Hàng Nhanh (GHN)',
        provider: 'GHN',
        estimatedDays: '2-3 ngày',
        price: 2.5 + (weight * 0.5)
      },
      {
        id: 'ghtk_fast',
        name: 'Giao Hàng Tiết Kiệm (GHTK)',
        provider: 'GHTK',
        estimatedDays: '1-2 ngày',
        price: 3.0 + (weight * 0.7)
      },
      {
        id: 'dhl_express',
        name: 'DHL Express',
        provider: 'DHL',
        estimatedDays: '24 giờ',
        price: 15.0 + (weight * 2.0)
      }
    ];
  },

  /**
   * Generate a real-looking tracking number and initial shipping info
   */
  generateTrackingInfo(provider: string): ShippingInfo {
    const trackingNumber = `${provider.substring(0, 2).toUpperCase()}${Math.floor(100000000 + Math.random() * 900000000)}`;
    const now = new Date();
    
    const initialEvents: TrackingEvent[] = [
      {
        id: 'event_1',
        status: 'PICKED_UP',
        location: 'Kho tổng AmazeBid',
        timestamp: now.toISOString(),
        description: 'Đơn hàng đã được lấy bởi đơn vị vận chuyển.'
      }
    ];

    return {
      trackingNumber,
      carrier: provider,
      status: 'IN_TRANSIT',
      events: initialEvents,
      estimatedDelivery: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
    };
  },

  /**
   * Mock real-time tracking updates
   */
  async getTrackingUpdate(): Promise<TrackingEvent[]> {
    // Simulate fetching latest events from carrier API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const now = new Date();
    const mockEvents: TrackingEvent[] = [
      {
        id: 'event_1',
        status: 'PICKED_UP',
        location: 'Kho tổng AmazeBid',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        description: 'Đơn hàng đã được lấy bởi đơn vị vận chuyển.'
      },
      {
        id: 'event_2',
        status: 'IN_TRANSIT',
        location: 'Trung tâm phân loại Miền Nam',
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        description: 'Đơn hàng đang được phân loại tại trung tâm trung chuyển.'
      },
      {
        id: 'event_3',
        status: 'OUT_FOR_DELIVERY',
        location: 'Bưu cục địa phương',
        timestamp: now.toISOString(),
        description: 'Shipper đang giao hàng đến bạn.'
      }
    ];

    return mockEvents;
  }
};
