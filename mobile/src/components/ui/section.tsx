import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { colors, space } from '@/theme/tokens';

export interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function Section({ title, subtitle, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <AppText variant="sectionHero">{title}</AppText>
      {subtitle ? (
        <AppText variant="meta" color={colors.muted}>
          {subtitle}
        </AppText>
      ) : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space(2) },
  body: { marginTop: space(2) },
});
