import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img src="/logo-napocut.svg" alt="Napocut Logo" {...props} />
    );
}
