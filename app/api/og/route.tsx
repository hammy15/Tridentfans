import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type') || 'default';
  const title = searchParams.get('title') || 'TridentFans';
  const subtitle = searchParams.get('subtitle') || 'Seattle Mariners Fan Community';
  const stats = searchParams.get('stats') || '';

  // Mariners colors
  const marinersNavy = '#0C2C56';
  const marinersTeal = '#005C5C';
  const marinersSilver = '#C4CED4';

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: marinersNavy,
        backgroundImage: `linear-gradient(135deg, ${marinersNavy} 0%, ${marinersTeal} 100%)`,
      }}
    >
      {/* Trident Logo Area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            fontSize: '80px',
            display: 'flex',
          }}
        >
          🔱
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 60px',
        }}
      >
        <div
          style={{
            fontSize: type === 'prediction' ? '48px' : '64px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px',
            lineHeight: 1.2,
            maxWidth: '1000px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: '28px',
            color: marinersSilver,
            marginBottom: '20px',
            display: 'flex',
          }}
        >
          {subtitle}
        </div>

        {/* Stats row for predictions */}
        {stats && (
          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginTop: '20px',
              padding: '20px 40px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
            }}
          >
            {stats.split('|').map((stat, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: 'white',
                    display: 'flex',
                  }}
                >
                  {stat.split(':')[1]}
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    color: marinersSilver,
                    display: 'flex',
                  }}
                >
                  {stat.split(':')[0]}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: marinersSilver,
          fontSize: '24px',
        }}
      >
        <div style={{ display: 'flex' }}>tridentfans.com</div>
      </div>

      {/* Type badge */}
      {type !== 'default' && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '40px',
            backgroundColor: marinersTeal,
            color: 'white',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '18px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            display: 'flex',
          }}
        >
          {type === 'prediction' ? 'Prediction' : type === 'forum' ? 'Forum Post' : type}
        </div>
      )}
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
