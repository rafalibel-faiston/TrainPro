import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { COLORS } from './theme';

type IconName = keyof typeof Feather.glyphMap;

export function Background() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[COLORS.bgTop, COLORS.bgMid, COLORS.bgBot]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbIndigo]} />
      <View style={[styles.orb, styles.orbViolet]} />
    </View>
  );
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Voltar">
          <Feather name="chevron-left" size={22} color={COLORS.text} />
        </TouchableOpacity>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  full,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
}) {
  const height = size === 'sm' ? 38 : 48;
  const isPrimary = variant === 'primary';
  const off = disabled || loading;

  const inner = (
    <>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : COLORS.text} />
      ) : (
        <>
          {icon ? (
            <Feather
              name={icon}
              size={size === 'sm' ? 15 : 17}
              color={isPrimary ? '#fff' : variant === 'danger' ? COLORS.danger : COLORS.text}
            />
          ) : null}
          <Text
            style={[
              styles.btnText,
              size === 'sm' && { fontSize: 13 },
              !isPrimary && { color: variant === 'danger' ? COLORS.danger : COLORS.text },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  if (isPrimary) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={off} style={[styles.btnGlow, full && { width: '100%' }]}>
        <LinearGradient
          colors={[COLORS.gradA, COLORS.gradB]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.btn, { height }, off && { opacity: 0.6 }]}
        >
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={off}
      style={[
        styles.btn,
        styles.btnGhost,
        { height },
        variant === 'danger' && { backgroundColor: COLORS.dangerBg, borderColor: 'transparent' },
        off && { opacity: 0.6 },
        full && { width: '100%' },
      ]}
    >
      {inner}
    </TouchableOpacity>
  );
}

export function Field({
  label,
  icon,
  ...props
}: { label?: string; icon?: IconName } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.field}>
        {icon ? <Feather name={icon} size={18} color={COLORS.text3} style={{ marginRight: 10 }} /> : null}
        <TextInput style={styles.input} placeholderTextColor={COLORS.text3} {...props} />
      </View>
    </View>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{children}</Text>
    </View>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const map = {
    neutral: { bg: COLORS.surfaceStrong, fg: COLORS.text2 },
    success: { bg: COLORS.successBg, fg: COLORS.success },
    warning: { bg: COLORS.warningBg, fg: COLORS.warning },
    danger: { bg: COLORS.dangerBg, fg: COLORS.danger },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text style={[styles.badgeText, { color: map.fg }]}>{children}</Text>
    </View>
  );
}

export function Tabs<T extends string>({
  items,
  active,
  onChange,
}: {
  items: { key: T; label: string }[];
  active: T;
  onChange: (k: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabs}
      style={{ flexGrow: 0, marginBottom: 16 }}
    >
      {items.map((t) => {
        const on = t.key === active;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[styles.tab, on && styles.tabOn]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function EmptyState({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.empty}>
      <Feather name={icon} size={28} color={COLORS.text3} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function Loading() {
  return <ActivityIndicator color={COLORS.accent} style={{ marginTop: 28 }} />;
}

const styles = StyleSheet.create({
  orb: { position: 'absolute', borderRadius: 9999 },
  orbIndigo: { width: 460, height: 460, top: -180, right: -150, backgroundColor: 'rgba(99,102,241,0.20)' },
  orbViolet: { width: 380, height: 380, bottom: -160, left: -130, backgroundColor: 'rgba(124,92,255,0.14)' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  headerSub: { color: COLORS.text2, fontSize: 13, marginTop: 2 },

  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  btnGhost: { backgroundColor: COLORS.surfaceStrong, borderWidth: 1, borderColor: COLORS.border },
  btnGlow: {
    borderRadius: 12,
    shadowColor: '#5B6CFF',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  label: { color: COLORS.text2, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: { flex: 1, color: COLORS.text, paddingVertical: 12, fontSize: 15 },

  chip: {
    backgroundColor: COLORS.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  chipText: { color: COLORS.text2, fontSize: 12 },

  badge: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },

  tabs: { gap: 8, paddingRight: 8 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabOn: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  tabText: { color: COLORS.text2, fontSize: 13, fontWeight: '600' },
  tabTextOn: { color: COLORS.accent },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: COLORS.text3, fontSize: 14 },
});
