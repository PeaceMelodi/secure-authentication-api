import { Throttle } from '@nestjs/throttler';

// Strict throttle for sensitive endpoints: 5 requests per 60 seconds
export const StrictThrottle = () => Throttle({ default: { ttl: 60000, limit: 5 } });