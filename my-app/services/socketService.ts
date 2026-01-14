import { io, Socket } from 'socket.io-client';
import { getBaseUrl } from './api';

let socket: Socket | null = null;
let connectionRetryCount = 0;
let currentConnectionType: string | null = null;
const MAX_RETRIES = 5;

export type SocketStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
type StatusCallback = (status: SocketStatus) => void;
const statusListeners: StatusCallback[] = [];

// Helper to get socket URL
const getSocketURL = () => {
    const baseURL = getBaseUrl();
    // Remove '/api' from the end if it exists, otherwise use base
    return baseURL.endsWith('/api') ? baseURL.slice(0, -4) : baseURL;
};

export const socketService = {
    connect: (userId: string, type: 'user' | 'driver' = 'user') => {
        const socketURL = getSocketURL();

        // If switching context (User <-> Driver), force disconnect to ensure clean state
        if (socket && socket.connected && currentConnectionType !== type) {
            console.log(`🔌 Switching socket context from ${currentConnectionType} to ${type}`);
            socket.disconnect();
            socket = null;
        }

        currentConnectionType = type;

        if (!socket || socket.disconnected) {
            console.log(`🔌 Initializing socket connection to: ${socketURL}`);

            if (socket) {
                socket.removeAllListeners();
                socket.disconnect();
            }

            // Allow both websocket and polling for maximum compatibility (React Native/Web)
            socket = io(socketURL, {
                transports: ['websocket', 'polling'],
                forceNew: true,
                reconnection: true,
                reconnectionAttempts: MAX_RETRIES,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                path: '/socket.io/',
                autoConnect: false, // We will connect manually
            });

            socket.connect();

            socket.on('connect_error', (err) => {
                console.error('❌ Socket connection error:', err.message);
                console.error('📍 Attempted connection to:', socketURL);
                console.error('💡 Troubleshooting:');
                console.error('   1. Ensure server is running: cd server && npm run dev');
                console.error('   2. Check server is on port 4000 (not 5000)');
                console.error('   3. Verify your network IP matches the server IP');
                console.error('   4. Ensure both devices are on the same WiFi');
                console.error('   5. Check firewall isn\'t blocking port 4000');
                socketService.emitStatus('error');
            });

            socket.on('reconnect_attempt', (attempt) => {
                connectionRetryCount = attempt;
                console.log(`🔄 Socket reconnection attempt #${attempt}`);
                socketService.emitStatus('connecting');
            });

            socket.on('reconnect_failed', () => {
                console.error('❌ Socket reconnection failed');
                socketService.emitStatus('error');
            });
        }

        const onConnect = () => {
            console.log(`✅ Connected to socket server as ${type}: ${userId}`);
            connectionRetryCount = 0;
            socketService.emitStatus('connected');

            // Small delay to ensure socket is fully ready
            setTimeout(() => {
                // Authenticate/Identify
                if (type === 'driver') {
                    console.log(`🔌 Emitting driver:connect for driver: ${userId}`);
                    socket?.emit('driver:connect', userId);

                    // Listen for connection success confirmation
                    socket?.once('connection:success', (data) => {
                        console.log('✅ Driver connection confirmed:', data);
                        console.log(`📍 Driver is in rooms: ${data.rooms?.join(', ') || 'unknown'}`);
                    });
                } else {
                    socket?.emit('user:connect', userId);
                }
            }, 100); // 100ms delay to ensure socket is ready
        };

        const onDisconnect = (reason: string) => {
            console.log('🔌 Socket disconnected:', reason);
            socketService.emitStatus('disconnected');
            if (reason === 'io server disconnect') {
                // the disconnection was initiated by the server, you need to manually reconnect
                socket?.connect();
            }
        };

        // Ensure we don't duplicate listeners
        socket.off('connect', onConnect); // Remove previous reference if any (though we removeAllListeners above)
        socket.off('disconnect');         // but just to be safe on re-entry without full rebuild

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        if (socket.connected) {
            onConnect();
        }

        return socket;
    },

    disconnect: () => {
        if (socket) {
            // Remove listeners to prevent "disconnect" event from firing logging
            socket.removeAllListeners('disconnect');
            socket.disconnect();
            socket = null;
            socketService.emitStatus('disconnected');
            console.log('🔌 Socket disconnected manually');
        }
    },

    emitStatus: (status: SocketStatus) => {
        statusListeners.forEach(cb => cb(status));
    },

    onStatusChange: (callback: StatusCallback) => {
        statusListeners.push(callback);
        // Instant callback with current status
        if (socket?.connected) callback('connected');
        else if (socket) callback('connecting'); // Rough approximation
        else callback('disconnected');

        return () => {
            const index = statusListeners.indexOf(callback);
            if (index > -1) statusListeners.splice(index, 1);
        };
    },

    getSocket: () => socket,

    // Generic Emit with Ack
    emitWithAck: (event: string, data: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!socket?.connected) {
                return reject(new Error('Socket not connected'));
            }
            // Add timeout for ack
            const timeout = setTimeout(() => {
                reject(new Error('Socket emit timeout'));
            }, 5000);

            socket.emit(event, data, (response: any) => {
                clearTimeout(timeout);
                if (response?.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    },

    // Listen for new booking (Driver)
    onNewBooking: (callback: (data: any) => void) => {
        socket?.off('booking:new'); // Clear previous to prevent duplicates
        socket?.on('booking:new', callback);
    },

    // Listen for booking acceptance (User)
    onBookingAccepted: (callback: (data: any) => void) => {
        socket?.off('booking:accepted');
        socket?.on('booking:accepted', callback);
    },

    // Listen for booking rejection (User)
    onBookingRejected: (callback: (data: any) => void) => {
        socket?.off('booking:rejected');
        socket?.on('booking:rejected', callback);
    },

    // Listen for booking completion (User)
    onBookingCompleted: (callback: (data: any) => void) => {
        socket?.off('booking:completed');
        socket?.on('booking:completed', callback);
    },

    // Update location (Driver)
    updateLocation: (data: { driverId: string; location: any; bookingId?: string }) => {
        if (socket?.connected) {
            socket.emit('driver:location', data);
        }
    },

    // Off listeners
    off: (event: string) => {
        socket?.off(event);
    }
};
