/**
 * Placeholder — temporary screen body for the nav skeleton. Each real screen
 * replaces this in the screens build slice. Kept on-brand so the shell already
 * reads as the app while it's being fleshed out.
 */
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { colors, space } from '@/theme/tokens';

export interface PlaceholderProps {
  eyebrow: string;
  title: string;
  note: string;
}

export function Placeholder({ eyebrow, title, note }: PlaceholderProps) {
  return (
    <Screen>
      <View style={styles.wrap}>
        <AppText variant="overline">{eyebrow}</AppText>
        <AppText variant="display">{title}</AppText>
        <AppText variant="body" color={colors.muted}>
          {note}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: space(3) },
});
