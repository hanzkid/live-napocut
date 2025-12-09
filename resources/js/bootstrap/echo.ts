import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

console.log('🔧 Initializing Laravel Echo...');

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: InstanceType<typeof Echo>;
    }
}

window.Pusher = Pusher;

// Check environment variables
const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
const reverbHost = import.meta.env.VITE_REVERB_HOST;
const reverbPort = import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 80;
const reverbScheme = import.meta.env.VITE_REVERB_SCHEME ?? 'https';

console.log('🔍 Reverb Config:', {
    key: reverbKey ? `${reverbKey.substring(0, 10)}...` : 'MISSING',
    host: reverbHost || 'MISSING',
    port: reverbPort,
    scheme: reverbScheme,
});

if (!reverbKey || !reverbHost) {
    console.error('❌ Reverb environment variables are missing!');
    console.error('Required: VITE_REVERB_APP_KEY, VITE_REVERB_HOST');
}

const echo = new Echo({
    broadcaster: 'reverb',
    key: reverbKey,
    wsHost: reverbHost,
    wsPort: reverbPort ?? 80,
    wssPort: reverbPort ?? 443,
    forceTLS: reverbScheme === 'https',
    enabledTransports: reverbScheme === 'https' ? ['ws', 'wss'] : ['ws'],
});

console.log('📡 Echo instance created');

// Add connection event listeners for debugging
echo.connector.pusher.connection.bind('connected', () => {
    console.log('✅ Reverb connected successfully');
});

echo.connector.pusher.connection.bind('disconnected', () => {
    console.log('❌ Reverb disconnected');
});

echo.connector.pusher.connection.bind('error', (err: any) => {
    console.error('❌ Reverb connection error:', err);
});

echo.connector.pusher.connection.bind('state_change', (states: any) => {
    console.log('🔄 Reverb state changed:', states.previous, '->', states.current);
});

echo.connector.pusher.connection.bind('connecting', () => {
    console.log('🔄 Reverb connecting...');
});

window.Echo = echo;
console.log('✅ Echo assigned to window.Echo');

export default echo;

