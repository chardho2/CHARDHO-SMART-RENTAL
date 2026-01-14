import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

// Inject Leaflet CSS
const leafleStyles = `
  .leaflet-container {
    width: 100%;
    height: 100%;
    z-index: 1;
  }
`;

// State to hold dynamically loaded components
let LeafletComponents: any = null;

const MapView = ({ children, initialRegion, region, style, ...props }: any) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        // Dynamically import Leaflet components
        const loadComponents = async () => {
            try {
                const { MapContainer, TileLayer, Marker: LeafletMarker, Popup, Polyline: LeafletPolyline, useMap } = await import('react-leaflet');
                const L = await import('leaflet');

                // Fix Leaflet default icon issues in Webpack/Expo
                const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
                const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
                const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

                const DefaultIcon = L.default.icon({
                    iconUrl,
                    iconRetinaUrl,
                    shadowUrl,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });

                L.default.Marker.prototype.options.icon = DefaultIcon;

                LeafletComponents = { MapContainer, TileLayer, LeafletMarker, Popup, LeafletPolyline, useMap, L: L.default };

                // Inject CSS if not present
                if (!document.getElementById('leaflet-css')) {
                    const link = document.createElement('link');
                    link.id = 'leaflet-css';
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    document.head.appendChild(link);
                }

                // Inject custom styles
                if (!document.getElementById('leaflet-custom-style')) {
                    const styleTag = document.createElement('style');
                    styleTag.id = 'leaflet-custom-style';
                    styleTag.innerHTML = leafleStyles;
                    document.head.appendChild(styleTag);
                }

                setIsLoaded(true);
            } catch (error) {
                console.error('Failed to load Leaflet components:', error);
            }
        };

        loadComponents();
    }, []);

    if (Platform.OS !== 'web') return null;
    if (!isLoaded || !LeafletComponents) return <View style={[styles.container, style]}><Text>Loading map...</Text></View>;

    const center = region || initialRegion || { latitude: 20.5937, longitude: 78.9629 }; // Default India

    // Helper to handle map updates
    const MapUpdater = ({ center, region }: any) => {
        const map = LeafletComponents.useMap();
        useEffect(() => {
            if (center) {
                map.flyTo([center.latitude, center.longitude], map.getZoom());
            }
            if (region) {
                map.flyTo([region.latitude, region.longitude], 13); // Default zoom roughly matches delta
            }
        }, [center, region, map]);
        return null;
    };

    return (
        <View style={[styles.container, style]}>
            <LeafletComponents.MapContainer
                center={[center.latitude, center.longitude]}
                zoom={13}
                scrollWheelZoom={true}
                style={{ width: '100%', height: '100%' }}
            >
                <LeafletComponents.TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater region={region} />
                {children}
            </LeafletComponents.MapContainer>
        </View>
    );
};

export const Marker = ({ coordinate, title, description, pinColor, children, ...props }: any) => {
    if (!LeafletComponents || !coordinate) return null;

    return (
        <LeafletComponents.LeafletMarker position={[coordinate.latitude, coordinate.longitude]} {...props}>
            <LeafletComponents.Popup>
                <div style={{ textAlign: 'center' }}>
                    <strong>{title}</strong>
                    {description && <br />}
                    {description}
                </div>
            </LeafletComponents.Popup>
        </LeafletComponents.LeafletMarker>
    );
};

export const Polyline = ({ coordinates, strokeColor = 'blue', strokeWidth = 3 }: any) => {
    if (!LeafletComponents || !coordinates || coordinates.length === 0) return null;

    const positions = coordinates.map((c: any) => [c.latitude, c.longitude]);

    return (
        <LeafletComponents.LeafletPolyline
            positions={positions}
            pathOptions={{ color: strokeColor, weight: strokeWidth }}
        />
    );
};

export const Callout = ({ children }: any) => <div className="custom-callout">{children}</div>;
export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
        borderRadius: 12, // Match native styling if used
    },
});

export default MapView;
