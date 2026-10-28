import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type TabName = 'Oversikt' | 'Avtaler' | 'Hverdag' | 'Sparing' | 'Mer';
type ScreenName = TabName | 'Sparemuligheter' | 'Kategori';
type CategoryKey = 'bolig' | 'forsikring' | 'hverdag' | 'abonnement' | 'faste';

type Category = {
  key: CategoryKey;
  icon: IconName;
  title: string;
  monthly: number;
  subtitle: string;
  items: { label: string; value: string; note?: string }[];
};

type Saving = {
  icon: IconName;
  title: string;
  explanation: string;
  annual: number;
  status: 'Bør sjekkes' | 'Mulig tiltak' | 'Følg med';
};

const colors = {
  background: '#F4F6F3',
  surface: '#FFFFFF',
  ink: '#13231E',
  secondary: '#66716C',
  muted: '#8A918E',
  green: '#0C624E',
  darkGreen: '#173D32',
  paleGreen: '#DDF3E9',
  iconGreen: '#E7F1EC',
  line: '#E6EAE7',
  amber: '#9A6416',
  paleAmber: '#FFF3D9',
};

const money = (value: number) =>
  new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(value);

const categories: Category[] = [
  {
    key: 'bolig',
    icon: 'home-outline',
    title: 'Bolig',
    monthly: 31200,
    subtitle: 'Lån, strøm og kommunale kostnader',
    items: [
      { label: 'Boliglån', value: '27 900 kr/mnd', note: 'Renter og avdrag' },
      { label: 'Strøm', value: '1 800 kr/mnd', note: 'Budsjettert gjennomsnitt' },
      { label: 'Kommunale kostnader', value: '1 666 kr/mnd' },
      { label: 'Vedlikehold', value: '834 kr/mnd', note: 'Månedlig avsetning' },
    ],
  },
  {
    key: 'forsikring',
    icon: 'shield-checkmark-outline',
    title: 'Forsikring',
    monthly: 2600,
    subtitle: 'Familiens registrerte forsikringer',
    items: [
      { label: 'Hus og innbo', value: '1 180 kr/mnd', note: 'Dekninger samlet' },
      { label: 'Bil', value: '920 kr/mnd', note: 'Skoda Enyaq' },
      { label: 'Reise og person', value: '500 kr/mnd' },
    ],
  },
  {
    key: 'hverdag',
    icon: 'cart-outline',
    title: 'Hverdag',
    monthly: 14700,
    subtitle: 'Mat, husholdning og løpende forbruk',
    items: [
      { label: 'Mat og husholdning', value: '11 000 kr/mnd' },
      { label: 'Klær og utstyr', value: '1 700 kr/mnd' },
      { label: 'Restaurant og takeaway', value: '1 200 kr/mnd' },
      { label: 'Annet hverdagsforbruk', value: '800 kr/mnd' },
    ],
  },
  {
    key: 'abonnement',
    icon: 'repeat-outline',
    title: 'Abonnement',
    monthly: 1950,
    subtitle: 'Digitale og løpende medlemskap',
    items: [
      { label: 'Mobil og internett', value: '1 090 kr/mnd' },
      { label: 'Strømming', value: '510 kr/mnd' },
      { label: 'Programvare og skylagring', value: '350 kr/mnd' },
    ],
  },
  {
    key: 'faste',
    icon: 'flash-outline',
    title: 'Andre faste',
    monthly: 6300,
    subtitle: 'Barnehage, studielån og transport',
    items: [
      { label: 'Barnehage', value: '3 136 kr/mnd' },
      { label: 'Lånekassen', value: '6 500 kr/mnd', note: 'Vises separat i full oversikt' },
      { label: 'Bom og transport', value: '167 kr/mnd' },
    ],
  },
];

const savings: Saving[] = [
  {
    icon: 'business-outline',
    title: 'Undersøk boliglånsrenten',
    explanation: 'En liten renteforskjell kan gi stor årlig effekt. Beløpet er et scenario, ikke et tilbud.',
    annual: 9800,
    status: 'Bør sjekkes',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Gjennomgå forsikringspakken',
    explanation: 'Kontroller pris, egenandeler, dekninger og mulig overlapp før neste fornyelse.',
    annual: 3000,
    status: 'Mulig tiltak',
  },
  {
    icon: 'repeat-outline',
    title: 'Rydd i abonnementene',
    explanation: 'To registrerte avtaler er markert for gjennomgang i denne prototypen.',
    annual: 1800,
    status: 'Følg med',
  },
];

const tabs: { name: TabName; icon: IconName }[] = [
  { name: 'Oversikt', icon: 'home-outline' },
  { name: 'Avtaler', icon: 'documents-outline' },
  { name: 'Hverdag', icon: 'cart-outline' },
  { name: 'Sparing', icon: 'trending-up-outline' },
  { name: 'Mer', icon: 'ellipsis-horizontal' },
];

export default function App() {
  const [tab, setTab] = useState<TabName>('Oversikt');
  const [screen, setScreen] = useState<ScreenName>('Oversikt');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('bolig');

  const category = useMemo(
    () => categories.find((item) => item.key === selectedCategory) ?? categories[0],
    [selectedCategory],
  );

  const navigateTab = (nextTab: TabName) => {
    setTab(nextTab);
    setScreen(nextTab);
  };

  const openCategory = (key: CategoryKey) => {
    setSelectedCategory(key);
    setScreen('Kategori');
  };

  const goBack = () => setScreen(tab);
  const title = screen === 'Kategori' ? category.title : screen;
  const isDetail = screen === 'Kategori' || screen === 'Sparemuligheter';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.page}>
        <Header title={title} detail={isDetail} onBack={goBack} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {screen === 'Oversikt' && (
            <Overview onCategory={openCategory} onSavings={() => setScreen('Sparemuligheter')} />
          )}
          {screen === 'Avtaler' && <Agreements onCategory={openCategory} />}
          {screen === 'Hverdag' && <Everyday onCategory={() => openCategory('hverdag')} />}
          {screen === 'Sparing' && <SavingsScreen />}
          {screen === 'Mer' && <MoreScreen />}
          {screen === 'Sparemuligheter' && <SavingsScreen />}
          {screen === 'Kategori' && <CategoryScreen category={category} />}
        </ScrollView>

        <BottomNav active={tab} onTab={navigateTab} />
      </View>
    </SafeAreaView>
  );
}

function Header({ title, detail, onBack }: { title: string; detail: boolean; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {detail && (
          <Pressable accessibilityLabel="Gå tilbake" onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.green} />
          </Pressable>
        )}
        <View>
          <Text style={styles.eyebrow}>FAMILIEØKONOMI</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      <View style={styles.avatar}>
        <Ionicons name="people" size={20} color={colors.green} />
      </View>
    </View>
  );
}

function Overview({
  onCategory,
  onSavings,
}: {
  onCategory: (key: CategoryKey) => void;
  onSavings: () => void;
}) {
  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Penger igjen denne måneden</Text>
        <Text style={styles.heroAmount}>{money(18420)}</Text>
        <View style={styles.heroStats}>
          <Stat label="Inntekter" value={money(88000)} />
          <Stat label="Utgifter" value={money(69580)} />
        </View>
      </View>

      <Pressable onPress={onSavings} style={({ pressed }) => [styles.savingHero, pressed && styles.pressed]}>
        <View style={styles.savingIcon}>
          <Ionicons name="sparkles" size={23} color={colors.green} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.savingLabel}>MULIG Å SPARE</Text>
          <Text style={styles.savingAmount}>{money(14600)} / år</Text>
          <Text style={styles.savingSub}>3 ting er verdt å undersøke</Text>
        </View>
        <Ionicons name="chevron-forward" size={23} color={colors.green} />
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Familiens kostnader</Text>
        <Text style={styles.sectionHint}>Trykk for detaljer</Text>
      </View>

      {categories.map((item) => (
        <CategoryRow key={item.key} category={item} onPress={() => onCategory(item.key)} />
      ))}
    </>
  );
}

function Agreements({ onCategory }: { onCategory: (key: CategoryKey) => void }) {
  return (
    <>
      <InfoCard
        icon="documents-outline"
        title="Alle avtaler samlet"
        text="Finn pris, leverandør, vilkår og dokumentasjon uten å lete gjennom e-post og mapper."
      />
      {categories
        .filter((item) => item.key !== 'hverdag')
        .map((item) => (
          <CategoryRow key={item.key} category={item} onPress={() => onCategory(item.key)} />
        ))}
    </>
  );
}

function Everyday({ onCategory }: { onCategory: () => void }) {
  return (
    <>
      <View style={styles.progressCard}>
        <Text style={styles.cardKicker}>OKTOBER</Text>
        <Text style={styles.progressTitle}>Hverdagsbudsjett</Text>
        <Text style={styles.progressAmount}>14 700 av 17 000 kr</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '86%' }]} />
        </View>
        <Text style={styles.progressNote}>2 300 kr igjen i månedens ramme</Text>
      </View>
      <Pressable onPress={onCategory} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
        <View style={styles.iconBox}>
          <Ionicons name="cart-outline" size={24} color={colors.green} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.actionTitle}>Se hverdagskategoriene</Text>
          <Text style={styles.actionSub}>Mat, klær, restaurant og annet forbruk</Text>
        </View>
        <Ionicons name="chevron-forward" size={21} color={colors.muted} />
      </Pressable>
      <InfoCard
        icon="information-circle-outline"
        title="Bevisst enkelt"
        text="V0.3 bruker få kategorier. Målet er oversikt uten at familien må føre regnskap hver dag."
      />
    </>
  );
}

function SavingsScreen() {
  const total = savings.reduce((sum, item) => sum + item.annual, 0);
  return (
    <>
      <View style={styles.savingsTotal}>
        <Text style={styles.cardKicker}>ESTIMERT POTENSIAL</Text>
        <Text style={styles.savingsTotalAmount}>{money(total)} / år</Text>
        <Text style={styles.savingsDisclaimer}>
          Scenarioene er veiledende beregninger basert på registrerte testdata, ikke konkrete tilbud.
        </Text>
      </View>
      {savings.map((item) => (
        <View key={item.title} style={styles.savingCard}>
          <View style={styles.savingCardTop}>
            <View style={styles.iconBox}>
              <Ionicons name={item.icon} size={22} color={colors.green} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.savingCardAmount}>{money(item.annual)} / år</Text>
            </View>
          </View>
          <Text style={styles.savingExplanation}>{item.explanation}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      ))}
    </>
  );
}

function MoreScreen() {
  return (
    <>
      <InfoCard
        icon="lock-closed-outline"
        title="Personvern først"
        text="Denne prototypen lagrer foreløpig ingen familieopplysninger i en ekstern database."
      />
      <InfoCard
        icon="flask-outline"
        title="Prototypedata"
        text="Tallene i appen brukes for å teste produktet og er ikke en ferdig økonomisk analyse."
      />
      <InfoCard
        icon="phone-portrait-outline"
        title="Versjon 0.3"
        text="Interaktive kategorier, avtaleoversikt, hverdagsbudsjett og sparemuligheter er nå samlet i én testbar prototype."
      />
    </>
  );
}

function CategoryScreen({ category }: { category: Category }) {
  return (
    <>
      <View style={styles.categoryHero}>
        <View style={styles.categoryHeroIcon}>
          <Ionicons name={category.icon} size={28} color={colors.green} />
        </View>
        <Text style={styles.categoryHeroTitle}>{category.title}</Text>
        <Text style={styles.categoryHeroAmount}>{money(category.monthly)} / mnd</Text>
        <Text style={styles.categoryHeroAnnual}>{money(category.monthly * 12)} / år</Text>
        <Text style={styles.categoryHeroSub}>{category.subtitle}</Text>
      </View>

      <Text style={styles.sectionTitle}>Registrerte poster</Text>
      <View style={styles.detailsCard}>
        {category.items.map((item, index) => (
          <View
            key={item.label}
            style={[styles.detailRow, index < category.items.length - 1 && styles.detailDivider]}
          >
            <View style={styles.flex}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              {item.note && <Text style={styles.detailNote}>{item.note}</Text>}
            </View>
            <Text style={styles.detailValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <InfoCard
        icon="create-outline"
        title="Neste nivå"
        text="Senere kan familien legge til, endre og dokumentere postene direkte på denne siden."
      />
    </>
  );
}

function CategoryRow({ category, onPress }: { category: Category; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.categoryRow, pressed && styles.pressed]}>
      <View style={styles.categoryRowLeft}>
        <Ionicons name={category.icon} size={21} color={colors.green} />
        <View>
          <Text style={styles.categoryRowTitle}>{category.title}</Text>
          <Text style={styles.categoryRowSub}>{category.subtitle}</Text>
        </View>
      </View>
      <View style={styles.categoryRowRight}>
        <Text style={styles.categoryRowValue}>{money(category.monthly)}/mnd</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </View>
    </Pressable>
  );
}

function BottomNav({ active, onTab }: { active: TabName; onTab: (tab: TabName) => void }) {
  return (
    <View style={styles.nav}>
      {tabs.map((item) => {
        const selected = item.name === active;
        return (
          <Pressable key={item.name} onPress={() => onTab(item.name)} style={styles.navItem}>
            <Ionicons name={item.icon} size={22} color={selected ? colors.green : colors.muted} />
            <Text style={[styles.navText, selected && styles.navActive]}>{item.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.flex}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function InfoCard({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={23} color={colors.green} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.995 }] },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 118 },
  header: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: '#7A817D' },
  title: { fontSize: 31, fontWeight: '800', color: colors.ink, marginTop: 2 },
  avatar: {
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: '#DDEBE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { backgroundColor: colors.darkGreen, borderRadius: 24, padding: 22, marginBottom: 14 },
  heroLabel: { fontSize: 14, color: '#BCD0C8' },
  heroAmount: { fontSize: 38, fontWeight: '800', color: '#FFFFFF', marginTop: 5, marginBottom: 22 },
  heroStats: { flexDirection: 'row', gap: 20 },
  statLabel: { color: '#9FB8AE', fontSize: 12 },
  statValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginTop: 3 },
  savingHero: {
    backgroundColor: colors.paleGreen,
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  savingIcon: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#347363' },
  savingAmount: { fontSize: 21, fontWeight: '800', color: '#103E32', marginTop: 2 },
  savingSub: { fontSize: 12, color: '#51766B', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 8 },
  sectionHint: { fontSize: 11, color: colors.muted },
  categoryRow: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 17,
    marginBottom: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  categoryRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  categoryRowTitle: { fontSize: 15, fontWeight: '700', color: '#24312D' },
  categoryRowSub: { fontSize: 10, color: colors.muted, marginTop: 2 },
  categoryRowRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  categoryRowValue: { fontSize: 13, fontWeight: '750', color: '#24312D' },
  nav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navText: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  navActive: { color: colors.green, fontWeight: '800' },
  iconBox: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: colors.iconGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 19,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 19,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 12,
  },
  actionTitle: { fontSize: 16, fontWeight: '750', color: colors.ink },
  actionSub: { fontSize: 12, lineHeight: 18, color: colors.secondary, marginTop: 4 },
  progressCard: { backgroundColor: colors.darkGreen, borderRadius: 23, padding: 22, marginBottom: 14 },
  cardKicker: { fontSize: 11, letterSpacing: 1.1, fontWeight: '800', color: '#72A798' },
  progressTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginTop: 5 },
  progressAmount: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginTop: 17 },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#31564B',
    overflow: 'hidden',
    marginTop: 11,
  },
  progressFill: { height: 10, borderRadius: 5, backgroundColor: '#A5E0CE' },
  progressNote: { color: '#B9CEC7', fontSize: 12, marginTop: 10 },
  savingsTotal: { backgroundColor: colors.paleGreen, padding: 21, borderRadius: 22, marginBottom: 13 },
  savingsTotalAmount: { fontSize: 29, fontWeight: '850', color: colors.darkGreen, marginTop: 5 },
  savingsDisclaimer: { color: '#51766B', fontSize: 12, lineHeight: 18, marginTop: 8 },
  savingCard: { backgroundColor: colors.surface, borderRadius: 19, padding: 17, marginBottom: 11 },
  savingCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  savingCardAmount: { fontSize: 15, fontWeight: '800', color: colors.green, marginTop: 4 },
  savingExplanation: { fontSize: 12, lineHeight: 18, color: colors.secondary, marginTop: 13 },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.paleAmber,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 13,
  },
  statusText: { fontSize: 11, fontWeight: '750', color: colors.amber },
  categoryHero: {
    backgroundColor: colors.surface,
    borderRadius: 23,
    padding: 22,
    alignItems: 'center',
    marginBottom: 21,
  },
  categoryHeroIcon: {
    height: 56,
    width: 56,
    borderRadius: 18,
    backgroundColor: colors.iconGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryHeroTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 12 },
  categoryHeroAmount: { fontSize: 28, fontWeight: '850', color: colors.darkGreen, marginTop: 5 },
  categoryHeroAnnual: { fontSize: 13, fontWeight: '700', color: colors.green, marginTop: 3 },
  categoryHeroSub: { fontSize: 12, color: colors.secondary, marginTop: 8, textAlign: 'center' },
  detailsCard: { backgroundColor: colors.surface, borderRadius: 19, paddingHorizontal: 16, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 16 },
  detailDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  detailLabel: { fontSize: 14, fontWeight: '700', color: colors.ink },
  detailNote: { fontSize: 10, color: colors.muted, marginTop: 3 },
  detailValue: { fontSize: 13, fontWeight: '750', color: '#26352F', textAlign: 'right' },
});
