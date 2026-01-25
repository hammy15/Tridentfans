import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import type { DigestContent, Profile } from '@/types';

// Mariners brand colors
const colors = {
  navy: '#0C2C56',
  teal: '#005C5C',
  silver: '#C4CED4',
  white: '#FFFFFF',
  lightGray: '#F4F4F5',
  mediumGray: '#6B7280',
  darkGray: '#374151',
};

interface WeeklyDigestEmailProps {
  user: Pick<Profile, 'username' | 'display_name'>;
  content: DigestContent;
  unsubscribeToken: string;
  siteUrl?: string;
}

export function WeeklyDigestEmail({
  user,
  content,
  unsubscribeToken,
  siteUrl = 'https://tridentfans.com',
}: WeeklyDigestEmailProps) {
  const username = user.display_name || user.username || 'Fan';
  const accuracy =
    content.predictionsThisWeek > 0
      ? Math.round((content.correctPredictions / content.predictionsThisWeek) * 100)
      : 0;

  const rankChangeText =
    content.rankChange > 0
      ? `+${content.rankChange} spots`
      : content.rankChange < 0
        ? `${content.rankChange} spots`
        : 'No change';
  const rankChangeColor =
    content.rankChange > 0 ? '#10B981' : content.rankChange < 0 ? '#EF4444' : colors.mediumGray;

  return (
    <Html>
      <Head />
      <Preview>Your TridentFans Weekly Digest - See your stats, upcoming games, and more!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>TridentFans</Text>
            <Text style={tagline}>Seattle Mariners Fan Community</Text>
          </Section>

          {/* Welcome */}
          <Section style={contentSection}>
            <Heading style={heading}>Your Weekly Digest</Heading>
            <Text style={greeting}>Hey {username}, here&apos;s your week in review!</Text>
          </Section>

          {/* Prediction Stats */}
          <Section style={statsSection}>
            <Heading as="h2" style={sectionHeading}>
              Your Prediction Stats This Week
            </Heading>
            <Row>
              <Column style={statBox}>
                <Text style={statNumber}>{content.predictionsThisWeek}</Text>
                <Text style={statLabel}>Predictions</Text>
              </Column>
              <Column style={statBox}>
                <Text style={statNumber}>{content.correctPredictions}</Text>
                <Text style={statLabel}>Correct</Text>
              </Column>
              <Column style={statBox}>
                <Text style={statNumber}>{accuracy}%</Text>
                <Text style={statLabel}>Accuracy</Text>
              </Column>
              <Column style={{ ...statBox, ...statBoxLast }}>
                <Text style={statNumber}>+{content.pointsEarnedThisWeek}</Text>
                <Text style={statLabel}>Points</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Leaderboard Position */}
          <Section style={contentSection}>
            <Heading as="h2" style={sectionHeading}>
              Leaderboard Position
            </Heading>
            <Row style={leaderboardRow}>
              <Column style={rankColumn}>
                <Text style={rankNumber}>#{content.currentRank}</Text>
                <Text style={rankLabel}>Current Rank</Text>
              </Column>
              <Column style={rankChangeColumn}>
                <Text style={{ ...rankChangeText as React.CSSProperties, color: rankChangeColor }}>
                  {content.rankChange > 0 ? '\u2191' : content.rankChange < 0 ? '\u2193' : '\u2194'}{' '}
                  {rankChangeText}
                </Text>
              </Column>
              <Column style={totalPointsColumn}>
                <Text style={totalPoints}>{content.totalPoints.toLocaleString()}</Text>
                <Text style={rankLabel}>Total Points</Text>
              </Column>
            </Row>
            <Button style={ctaButton} href={`${siteUrl}/leaderboard`}>
              View Full Leaderboard
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Upcoming Games */}
          {content.upcomingGames.length > 0 && (
            <>
              <Section style={contentSection}>
                <Heading as="h2" style={sectionHeading}>
                  Upcoming Games
                </Heading>
                {content.upcomingGames.map((game, index) => (
                  <Row key={game.id} style={index > 0 ? gameRowWithBorder : gameRow}>
                    <Column style={gameInfo}>
                      <Text style={gameName}>
                        {game.isHome ? 'vs' : '@'} {game.opponent}
                      </Text>
                      <Text style={gameDate}>
                        {new Date(game.gameDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at {game.gameTime}
                      </Text>
                    </Column>
                    <Column style={gameAction}>
                      <Link href={`${siteUrl}/predictions`} style={predictLink}>
                        Make Prediction
                      </Link>
                    </Column>
                  </Row>
                ))}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* Hot Forum Topics */}
          {content.hotTopics.length > 0 && (
            <>
              <Section style={contentSection}>
                <Heading as="h2" style={sectionHeading}>
                  Hot Forum Topics
                </Heading>
                {content.hotTopics.slice(0, 3).map((topic, index) => (
                  <Row key={topic.id} style={index > 0 ? topicRowWithBorder : topicRow}>
                    <Column>
                      <Link href={`${siteUrl}/forum/post/${topic.id}`} style={topicTitle}>
                        {topic.title}
                      </Link>
                      <Text style={topicMeta}>
                        by {topic.author} - {topic.commentCount} comments
                      </Text>
                    </Column>
                  </Row>
                ))}
                <Button style={secondaryButton} href={`${siteUrl}/forum`}>
                  Browse All Discussions
                </Button>
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* On This Day */}
          {content.onThisDay && (
            <>
              <Section style={onThisDaySection}>
                <Heading as="h2" style={sectionHeading}>
                  On This Day in Mariners History
                </Heading>
                <Text style={onThisDayYear}>{content.onThisDay.year}</Text>
                <Text style={onThisDayTitle}>{content.onThisDay.title}</Text>
                <Text style={onThisDayDescription}>{content.onThisDay.description}</Text>
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Text style={ctaText}>Ready to make your predictions for the week?</Text>
            <Button style={primaryButton} href={`${siteUrl}/predictions`}>
              Make Your Predictions
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Go Mariners!</Text>
            <Text style={footerLinks}>
              <Link href={siteUrl} style={footerLink}>
                tridentfans.com
              </Link>{' '}
              |{' '}
              <Link href={`${siteUrl}/profile`} style={footerLink}>
                Manage Preferences
              </Link>{' '}
              |{' '}
              <Link href={`${siteUrl}/unsubscribe?token=${unsubscribeToken}`} style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
            <Text style={footerCopyright}>
              &copy; {new Date().getFullYear()} TridentFans. Seattle Mariners Fan Community.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main: React.CSSProperties = {
  backgroundColor: colors.lightGray,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container: React.CSSProperties = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const header: React.CSSProperties = {
  background: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.teal} 100%)`,
  padding: '30px 40px',
  borderRadius: '12px 12px 0 0',
  textAlign: 'center' as const,
};

const logoText: React.CSSProperties = {
  color: colors.white,
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
};

const tagline: React.CSSProperties = {
  color: colors.silver,
  fontSize: '14px',
  margin: '8px 0 0 0',
};

const contentSection: React.CSSProperties = {
  backgroundColor: colors.white,
  padding: '30px 40px',
};

const heading: React.CSSProperties = {
  color: colors.navy,
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
};

const greeting: React.CSSProperties = {
  color: colors.darkGray,
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
};

const sectionHeading: React.CSSProperties = {
  color: colors.navy,
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
};

const statsSection: React.CSSProperties = {
  backgroundColor: colors.white,
  padding: '30px 40px',
};

const statBox: React.CSSProperties = {
  backgroundColor: colors.lightGray,
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  marginRight: '8px',
};

const statBoxLast: React.CSSProperties = {
  marginRight: '0',
};

const statNumber: React.CSSProperties = {
  color: colors.navy,
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const statLabel: React.CSSProperties = {
  color: colors.mediumGray,
  fontSize: '12px',
  margin: '4px 0 0 0',
  textTransform: 'uppercase' as const,
};

const divider: React.CSSProperties = {
  borderColor: '#E5E7EB',
  margin: '0',
};

const leaderboardRow: React.CSSProperties = {
  backgroundColor: colors.lightGray,
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
};

const rankColumn: React.CSSProperties = {
  textAlign: 'center' as const,
  width: '33%',
};

const rankNumber: React.CSSProperties = {
  color: colors.teal,
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
};

const rankLabel: React.CSSProperties = {
  color: colors.mediumGray,
  fontSize: '12px',
  margin: '4px 0 0 0',
};

const rankChangeColumn: React.CSSProperties = {
  textAlign: 'center' as const,
  width: '33%',
  verticalAlign: 'middle',
};

const rankChangeText: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const totalPointsColumn: React.CSSProperties = {
  textAlign: 'center' as const,
  width: '33%',
};

const totalPoints: React.CSSProperties = {
  color: colors.navy,
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const gameRow: React.CSSProperties = {
  padding: '12px 0',
};

const gameRowWithBorder: React.CSSProperties = {
  ...gameRow,
  borderTop: '1px solid #E5E7EB',
};

const gameInfo: React.CSSProperties = {
  width: '70%',
};

const gameName: React.CSSProperties = {
  color: colors.navy,
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const gameDate: React.CSSProperties = {
  color: colors.mediumGray,
  fontSize: '14px',
  margin: '4px 0 0 0',
};

const gameAction: React.CSSProperties = {
  width: '30%',
  textAlign: 'right' as const,
  verticalAlign: 'middle',
};

const predictLink: React.CSSProperties = {
  color: colors.teal,
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
};

const topicRow: React.CSSProperties = {
  padding: '12px 0',
};

const topicRowWithBorder: React.CSSProperties = {
  ...topicRow,
  borderTop: '1px solid #E5E7EB',
};

const topicTitle: React.CSSProperties = {
  color: colors.navy,
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'block',
};

const topicMeta: React.CSSProperties = {
  color: colors.mediumGray,
  fontSize: '13px',
  margin: '4px 0 0 0',
};

const onThisDaySection: React.CSSProperties = {
  backgroundColor: `${colors.navy}08`,
  padding: '30px 40px',
};

const onThisDayYear: React.CSSProperties = {
  color: colors.teal,
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const onThisDayTitle: React.CSSProperties = {
  color: colors.navy,
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const onThisDayDescription: React.CSSProperties = {
  color: colors.darkGray,
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const ctaSection: React.CSSProperties = {
  backgroundColor: colors.white,
  padding: '30px 40px',
  textAlign: 'center' as const,
};

const ctaText: React.CSSProperties = {
  color: colors.darkGray,
  fontSize: '16px',
  margin: '0 0 20px 0',
};

const primaryButton: React.CSSProperties = {
  backgroundColor: colors.teal,
  borderRadius: '8px',
  color: colors.white,
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '14px 28px',
  textDecoration: 'none',
};

const secondaryButton: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: `2px solid ${colors.teal}`,
  borderRadius: '8px',
  color: colors.teal,
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '600',
  padding: '10px 20px',
  textDecoration: 'none',
  marginTop: '16px',
};

const ctaButton: React.CSSProperties = {
  backgroundColor: colors.navy,
  borderRadius: '8px',
  color: colors.white,
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
};

const footer: React.CSSProperties = {
  backgroundColor: '#F9FAFB',
  padding: '24px 40px',
  borderRadius: '0 0 12px 12px',
  textAlign: 'center' as const,
};

const footerText: React.CSSProperties = {
  color: colors.navy,
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const footerLinks: React.CSSProperties = {
  color: colors.mediumGray,
  fontSize: '13px',
  margin: '0 0 16px 0',
};

const footerLink: React.CSSProperties = {
  color: colors.teal,
  textDecoration: 'none',
};

const footerCopyright: React.CSSProperties = {
  color: '#9CA3AF',
  fontSize: '12px',
  margin: '0',
};

export default WeeklyDigestEmail;
