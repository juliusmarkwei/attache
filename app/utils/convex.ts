import { ConvexHttpClient } from 'convex/browser';

// Create a single instance of ConvexHttpClient
export const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
