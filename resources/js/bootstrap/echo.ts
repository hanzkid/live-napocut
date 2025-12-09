import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: InstanceType<typeof Echo>;
    }
}

window.Pusher = Pusher;

const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
const reverbHost = import.meta.env.VITE_REVERB_HOST;
const reverbPort = import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 80;
const reverbScheme = import.meta.env.VITE_REVERB_SCHEME ?? 'https';

const echo = new Echo({
    broadcaster: 'reverb',
    key: reverbKey,
    wsHost: reverbHost,
    wsPort: reverbPort ?? 80,
    wssPort: reverbPort ?? 443,
    forceTLS: reverbScheme === 'https',
    enabledTransports: reverbScheme === 'https' ? ['ws', 'wss'] : ['ws'],
});

window.Echo = echo;

export default echo;

