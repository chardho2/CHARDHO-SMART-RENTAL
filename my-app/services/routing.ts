import axios from 'axios';

const OSRM_BASE_URL = 'http://router.project-osrm.org/route/v1/driving';

export interface Coordinate {
    latitude: number;
    longitude: number;
}

export interface RouteOption {
    type: 'fastest' | 'shortest' | 'balanced';
    name: string;
    description: string;
    coordinates: Coordinate[];
    distance: number; // in kilometers
    duration: number; // in minutes
    estimatedCost: number; // in rupees
    savings?: {
        timeSaved?: number; // minutes compared to other routes
        moneySaved?: number; // rupees compared to other routes
    };
}

export interface RouteResponse {
    routes: RouteOption[];
    recommended: 'fastest' | 'shortest' | 'balanced';
}

// Pricing configuration per km for different vehicle types
const PRICING_PER_KM = {
    bike: 5,
    auto: 10,
    car: 15,
    suv: 20
};

export const routingService = {
    /**
     * Get route coordinates between two points using OSRM (legacy method)
     */
    getRoute: async (start: Coordinate, end: Coordinate): Promise<Coordinate[]> => {
        try {
            // OSRM expects: longitude,latitude
            const url = `${OSRM_BASE_URL}/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;

            const response = await axios.get(url);

            if (response.data.routes && response.data.routes.length > 0) {
                const coordinates = response.data.routes[0].geometry.coordinates.map((coord: number[]) => ({
                    latitude: coord[1],
                    longitude: coord[0]
                }));
                return coordinates;
            }
            return [];
        } catch (error) {
            console.error('Error fetching route:', error);
            // Fallback to straight line if routing fails
            return [start, end];
        }
    },

    /**
     * Get multiple route options with time and cost optimization
     * @param start Starting coordinate
     * @param end Destination coordinate
     * @param vehicleType Type of vehicle (affects cost calculation)
     * @returns Multiple route options with detailed metrics
     */
    getRouteOptions: async (
        start: Coordinate,
        end: Coordinate,
        vehicleType: 'bike' | 'auto' | 'car' | 'suv' = 'bike'
    ): Promise<RouteResponse> => {
        try {
            // OSRM expects: longitude,latitude
            const baseUrl = `${OSRM_BASE_URL}/${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;

            // Request multiple alternative routes
            const url = `${baseUrl}?overview=full&geometries=geojson&alternatives=true&steps=true`;

            const response = await axios.get(url);

            if (!response.data.routes || response.data.routes.length === 0) {
                // Fallback to straight line
                return routingService.getFallbackRoute(start, end, vehicleType);
            }

            const routes: RouteOption[] = [];
            const pricePerKm = PRICING_PER_KM[vehicleType];

            // Process all available routes from OSRM
            for (let i = 0; i < Math.min(response.data.routes.length, 3); i++) {
                const route = response.data.routes[i];
                const distanceKm = route.distance / 1000; // Convert meters to km
                const durationMin = route.duration / 60; // Convert seconds to minutes
                const estimatedCost = Math.round(distanceKm * pricePerKm);

                const coordinates = route.geometry.coordinates.map((coord: number[]) => ({
                    latitude: coord[1],
                    longitude: coord[0]
                }));

                // Determine route type based on characteristics
                let type: 'fastest' | 'shortest' | 'balanced';
                let name: string;
                let description: string;

                if (i === 0) {
                    // First route is typically the fastest
                    type = 'fastest';
                    name = 'Fastest Route';
                    description = 'Optimized for quickest arrival time';
                } else if (routes.length > 0 && distanceKm < routes[0].distance) {
                    // If shorter than the first route, it's the shortest
                    type = 'shortest';
                    name = 'Shortest Route';
                    description = 'Optimized for minimum distance and cost';
                } else {
                    type = 'balanced';
                    name = 'Balanced Route';
                    description = 'Good balance between time and cost';
                }

                routes.push({
                    type,
                    name,
                    description,
                    coordinates,
                    distance: parseFloat(distanceKm.toFixed(2)),
                    duration: Math.ceil(durationMin),
                    estimatedCost
                });
            }

            // If we only got one route, create variations
            if (routes.length === 1) {
                const baseRoute = routes[0];

                // Create a "shortest" variant (slightly different calculation)
                routes.push({
                    type: 'shortest',
                    name: 'Shortest Route',
                    description: 'Optimized for minimum distance and cost',
                    coordinates: baseRoute.coordinates,
                    distance: baseRoute.distance,
                    duration: Math.ceil(baseRoute.duration * 1.1), // Slightly longer time
                    estimatedCost: baseRoute.estimatedCost
                });

                // Update first route to be "fastest"
                routes[0] = {
                    ...baseRoute,
                    type: 'fastest',
                    name: 'Fastest Route',
                    description: 'Optimized for quickest arrival time'
                };
            }

            // Calculate savings for each route
            const maxCost = Math.max(...routes.map(r => r.estimatedCost));
            const maxTime = Math.max(...routes.map(r => r.duration));

            routes.forEach(route => {
                route.savings = {
                    moneySaved: maxCost - route.estimatedCost,
                    timeSaved: maxTime - route.duration
                };
            });

            // Determine recommended route (balanced approach)
            let recommended: 'fastest' | 'shortest' | 'balanced' = 'fastest';

            // If there's significant cost savings (>20%) with minimal time loss (<15%), recommend shortest
            const fastestRoute = routes.find(r => r.type === 'fastest');
            const shortestRoute = routes.find(r => r.type === 'shortest');

            if (fastestRoute && shortestRoute) {
                const costSavingsPercent = ((fastestRoute.estimatedCost - shortestRoute.estimatedCost) / fastestRoute.estimatedCost) * 100;
                const timeLossPercent = ((shortestRoute.duration - fastestRoute.duration) / fastestRoute.duration) * 100;

                if (costSavingsPercent > 20 && timeLossPercent < 15) {
                    recommended = 'shortest';
                } else if (routes.some(r => r.type === 'balanced')) {
                    recommended = 'balanced';
                }
            }

            return {
                routes: routes.sort((a, b) => {
                    // Sort: fastest, shortest, balanced
                    const order = { fastest: 0, shortest: 1, balanced: 2 };
                    return order[a.type] - order[b.type];
                }),
                recommended
            };

        } catch (error) {
            console.error('Error fetching route options:', error);
            return routingService.getFallbackRoute(start, end, vehicleType);
        }
    },

    /**
     * Get fallback route when OSRM fails
     */
    getFallbackRoute: (
        start: Coordinate,
        end: Coordinate,
        vehicleType: 'bike' | 'auto' | 'car' | 'suv'
    ): RouteResponse => {
        // Calculate straight-line distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (end.latitude - start.latitude) * Math.PI / 180;
        const dLon = (end.longitude - start.longitude) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(start.latitude * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;

        // Estimate road distance (typically 1.3x straight line)
        const roadDistance = distanceKm * 1.3;
        const pricePerKm = PRICING_PER_KM[vehicleType];

        // Average speed estimates
        const avgSpeed = { bike: 25, auto: 20, car: 30, suv: 30 }[vehicleType];
        const duration = Math.ceil((roadDistance / avgSpeed) * 60);
        const estimatedCost = Math.round(roadDistance * pricePerKm);

        const coordinates = [start, end];

        const fastestRoute: RouteOption = {
            type: 'fastest',
            name: 'Fastest Route',
            description: 'Optimized for quickest arrival time',
            coordinates,
            distance: parseFloat(roadDistance.toFixed(2)),
            duration,
            estimatedCost,
            savings: { moneySaved: 0, timeSaved: 0 }
        };

        return {
            routes: [fastestRoute],
            recommended: 'fastest'
        };
    }
};
