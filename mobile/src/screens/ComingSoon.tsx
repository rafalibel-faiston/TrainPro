import { ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PageTitle } from '../ui';
import { COLORS } from '../theme';

export function ComingSoon({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 110 }}>
      <PageTitle eyebrow={eyebrow} title={title} />
      <View style={{ alignItems: 'center', paddingVertical: 70, gap: 12 }}>
        <Feather name="tool" size={30} color={COLORS.text3} />
        <Text style={{ color: COLORS.text2, fontSize: 14, textAlign: 'center', paddingHorizontal: 20 }}>{text}</Text>
      </View>
    </ScrollView>
  );
}
