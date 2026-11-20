import { ImageResponse } from 'next/og';

export const alt = 'Deccan Island — Hyderabadi dum kitchen in Penang';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ display: 'flex', position: 'relative', width: '100%', height: '100%', background: '#1F4A32', color: '#F7EEDD' }}>
      <div style={{ display: 'flex', position: 'absolute', left: 0, top: 0, flexDirection: 'column', justifyContent: 'space-between', width: 650, height: 630, padding: '54px 58px 58px 64px' }}>
        <div style={{ display: 'flex', width: 328, height: 132, alignItems: 'center', justifyContent: 'center', padding: '15px 20px', background: '#F7EEDD', borderRadius: 12 }}>
          <img src="https://deccan-island.vercel.app/deccan-island-logo.svg" alt="Deccan Island" width="288" height="116" style={{ width: 288, height: 116, objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', color: '#D9C3A0', fontSize: 16, letterSpacing: '4px', textTransform: 'uppercase' }}>Weekend pre-orders · Penang</div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22, fontFamily: 'serif', fontSize: 58, lineHeight: 1.02, letterSpacing: '-1.5px' }}>
            <div style={{ display: 'flex' }}>Hyderabadi dum</div>
            <div style={{ display: 'flex', color: '#D9C3A0' }}>for your table.</div>
          </div>
          <div style={{ display: 'flex', width: 92, height: 5, marginTop: 28, background: '#B8581F' }} />
          <div style={{ display: 'flex', marginTop: 22, fontSize: 19, color: '#F7EEDD' }}>Small-batch cooking from our home kitchen.</div>
        </div>
      </div>
      <div style={{ display: 'flex', position: 'absolute', right: 0, top: 0, width: 550, height: 630, overflow: 'hidden' }}>
        <img src="https://deccan-island.vercel.app/chicken-dum-biryani.png" alt="" width="630" height="630" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ display: 'flex', position: 'absolute', inset: 0, borderLeft: '8px solid #B8581F', boxShadow: 'inset 50px 0 80px rgba(31,74,50,.22)' }} />
      </div>
    </div>,
    size,
  );
}
