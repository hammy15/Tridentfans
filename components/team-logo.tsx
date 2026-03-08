interface TeamLogoProps {
  team: string;
  size?: number;
  className?: string;
}

export function TeamLogo({ team, size = 40, className = '' }: TeamLogoProps) {
  const getTeamLogo = (teamName: string) => {
    const normalizedTeam = teamName.toLowerCase().replace(/\s+/g, '-');
    
    switch (normalizedTeam) {
      case 'seattle-mariners':
      case 'seattle':
      case 'mariners':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
            <circle cx="20" cy="20" r="20" fill="#0C2340"/>
            <path d="M20 8L20 32M12 16L20 8L28 16M15 20L20 15L25 20M20 25L18 27L22 27L20 25Z" stroke="#005C5C" strokeWidth="2" fill="#005C5C"/>
            <circle cx="20" cy="32" r="2" fill="#005C5C"/>
          </svg>
        );
      
      case 'chicago-white-sox':
      case 'white-sox':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
            <circle cx="20" cy="20" r="20" fill="#27251F"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">CWS</text>
          </svg>
        );
      
      case 'milwaukee-brewers':
      case 'brewers':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
            <circle cx="20" cy="20" r="20" fill="#12284B"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#FFC52F" textAnchor="middle">MIL</text>
          </svg>
        );
      
      case 'arizona-diamondbacks':
      case 'diamondbacks':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
            <circle cx="20" cy="20" r="20" fill="#A71930"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#E3D4AD" textAnchor="middle">ARI</text>
          </svg>
        );
      
      case 'texas-rangers':
      case 'rangers':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
            <circle cx="20" cy="20" r="20" fill="#003278"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#C4CED4" textAnchor="middle">TEX</text>
          </svg>
        );
      
      case 'houston-astros':
      case 'astros':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
            <circle cx="20" cy="20" r="20" fill="#002D62"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#EB6E1F" textAnchor="middle">HOU</text>
          </svg>
        );
      
      case 'los-angeles-angels':
      case 'angels':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
            <circle cx="20" cy="20" r="20" fill="#BA0021"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">LAA</text>
          </svg>
        );
      
      case 'oakland-athletics':
      case 'athletics':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
            <circle cx="20" cy="20" r="20" fill="#003831"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#EFB21E" textAnchor="middle">OAK</text>
          </svg>
        );
      
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
            <circle cx="20" cy="20" r="20" fill="#4A5568"/>
            <text x="20" y="26" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">MLB</text>
          </svg>
        );
    }
  };

  return getTeamLogo(team);
}