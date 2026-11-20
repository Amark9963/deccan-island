import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Deccan Island — Hyderabadi dum kitchen in Penang';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ display: 'flex', position: 'relative', width: '100%', height: '100%', background: '#F7EEDD', color: '#1F4A32' }}>
      <div style={{ display: 'flex', position: 'absolute', left: 0, top: 0, zIndex: 2, flexDirection: 'column', justifyContent: 'space-between', width: 696, height: 630, padding: '72px 58px 66px 76px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>deccan island</div>
          <div style={{ display: 'flex', marginTop: 10, color: '#B8581F', fontSize: 16, letterSpacing: '4px', textTransform: 'uppercase' }}>Hyderabadi dum kitchen</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'serif', fontSize: 58, lineHeight: 1.02, letterSpacing: '-2px' }}>
            <div style={{ display: 'flex' }}>Hyderabadi dum</div>
            <div style={{ display: 'flex' }}>for your table.</div>
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 21, color: '#56705C' }}>Small-batch weekend cooking · Penang</div>
        </div>
      </div>
      <div style={{ display: 'flex', position: 'absolute', right: 0, top: 0, width: 504, height: 630, overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://deccan-island.vercel.app/chicken-dum-biryani.png" alt="" width="630" height="630" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ display: 'flex', position: 'absolute', inset: 0, borderLeft: '10px solid #B8581F' }} />
      </div>
    </div>,
    size,
  );
}
