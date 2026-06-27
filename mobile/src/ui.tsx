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
import { COLORS, avatarColor, initials } from './theme';

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
    </View>
  );
}

/* Título grande com rótulo (eyebrow) acima — padrão das telas. */
export function PageTitle({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.pageHead}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.pageTitle}>{title}</Text>
      </View>
      {right}
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

export function StatCard({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function SearchInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.search}>
      <Feather name="search" size={18} color={COLORS.text3} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.text3}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
    </View>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name) }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.32 }]}>{initials(name || '?')}</Text>
    </View>
  );
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
  const height = size === 'sm' ? 38 : 50;
  const isPrimary = variant === 'primary';
  const off = disabled || loading;
  const fg = isPrimary ? COLORS.onAccent : variant === 'danger' ? COLORS.danger : COLORS.text;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={off}
      style={[
        styles.btn,
        { height },
        isPrimary ? styles.btnPrimary : styles.btnGhost,
        variant === 'danger' && { backgroundColor: COLORS.dangerBg, borderColor: 'transparent' },
        off && { opacity: 0.55 },
        full && { width: '100%' },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={size === 'sm' ? 15 : 18} color={fg} /> : null}
          <Text style={[styles.btnText, { color: fg }, size === 'sm' && { fontSize: 13 }]}>{title}</Text>
        </>
      )}
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
  tone?: 'neutral' | 'lime' | 'success' | 'warning' | 'danger';
}) {
  const map = {
    neutral: { bg: COLORS.surfaceStrong, fg: COLORS.text2 },
    lime: { bg: COLORS.accent, fg: COLORS.onAccent },
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
          <TouchableOpacity key={t.key} onPress={() => onChange(t.key)} style={[styles.tab, on && styles.tabOn]} activeOpacity={0.8}>
            <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

/* Barra de navegação inferior. */
export function BottomTabBar<T extends string>({
  items,
  active,
  onChange,
}: {
  items: { key: T; label: string; icon: IconName }[];
  active: T;
  onChange: (k: T) => void;
}) {
  return (
    <View style={styles.tabBar}>
      {items.map((t) => {
        const on = t.key === active;
        return (
          <TouchableOpacity key={t.key} style={styles.tabBarItem} onPress={() => onChange(t.key)} activeOpacity={0.8}>
            <Feather name={t.icon} size={22} color={on ? COLORS.accent : COLORS.text3} />
            <Text style={[styles.tabBarLabel, on && { color: COLORS.accent }]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
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
  pageHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  eyebrow: { color: COLORS.eyebrow, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 },
  pageTitle: { color: COLORS.text, fontSize: 30, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },

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
  },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  statValue: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: COLORS.text2, fontSize: 12, marginTop: 3 },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 0 },

  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  btnPrimary: { backgroundColor: COLORS.accent },
  btnGhost: { backgroundColor: COLORS.surfaceStrong, borderWidth: 1, borderColor: COLORS.border },
  btnText: { fontWeight: '800', fontSize: 15 },

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
  badgeText: { fontSize: 11, fontWeight: '800' },

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

  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(12,12,18,0.96)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    paddingBottom: 26,
    paddingHorizontal: 8,
  },
  tabBarItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabBarLabel: { color: COLORS.text3, fontSize: 11, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: COLORS.text3, fontSize: 14 },
});
