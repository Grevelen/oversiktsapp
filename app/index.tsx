import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type TabName = 'Oversikt' | 'Forsikringer' | 'Hverdag' | 'Sparing' | 'Abonnement';
type FormKind = 'insurance' | 'subscription' | 'goal' | null;

type Insurance = {
  id: string;
  type: string;
  provider: string;
  monthly: number;
  coverage: string;
  renewal: string;
};

type Subscription = {
  id: string;
  name: string;
  category: string;
  monthly: number;
};

type SavingsGoal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  targetDate: string;
};

type AppData = {
  insurance: Insurance[];
  subscriptions: Subscription[];
  goals: SavingsGoal[];
};

const STORAGE_KEY = '@oversiktsapp/v0.5/data';

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
  line: '#E3E8E4',
  danger: '#A8453C',
  paleDanger: '#FBEAE8',
  amber: '#95610F',
  paleAmber: '#FFF3D7',
};

const defaultData: AppData = {
  insurance: [
    {
      id: 'insurance-house',
      type: 'Hus og innbo',
      provider: 'Eksempelselskap',
      monthly: 1180,
      coverage: 'Bygning og innbo',
      renewal: '01.05.2027',
    },
    {
      id: 'insurance-car',
      type: 'Bilforsikring',
      provider: 'Eksempelselskap',
      monthly: 920,
      coverage: 'Kasko',
      renewal: '15.03.2027',
    },
    {
      id: 'insurance-travel',
      type: 'Reiseforsikring',
      provider: 'Eksempelselskap',
      monthly: 250,
      coverage: 'Familie',
      renewal: '01.01.2027',
    },
  ],
  subscriptions: [
    { id: 'subscription-streaming', name: 'Strømmetjeneste', category: 'Underholdning', monthly: 179 },
    { id: 'subscription-music', name: 'Musikktjeneste', category: 'Underholdning', monthly: 129 },
    { id: 'subscription-cloud', name: 'Skylagring', category: 'Programvare', monthly: 99 },
  ],
  goals: [
    { id: 'goal-trip', name: 'Sydentur 2030', target: 80000, saved: 12500, targetDate: 'Sommer 2030' },
  ],
};

const tabs: { name: TabName; icon: IconName }[] = [
  { name: 'Oversikt', icon: 'home-outline' },
  { name: 'Forsikringer', icon: 'shield-checkmark-outline' },
  { name: 'Hverdag', icon: 'cart-outline' },
  { name: 'Sparing', icon: 'flag-outline' },
  { name: 'Abonnement', icon: 'repeat-outline' },
];

const money = (value: number) =>
  new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(value);

const parseAmount = (value: string) => {
  const normalized = value.replace(/\s/g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function App() {
  const [tab, setTab] = useState<TabName>('Oversikt');
  const [data, setData] = useState<AppData>(defaultData);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<FormKind>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setData(JSON.parse(stored) as AppData);
      } catch {
        Alert.alert('Kunne ikke lese lagrede data', 'Appen bruker testdata i denne økten.');
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {
      Alert.alert('Kunne ikke lagre', 'Endringen ble ikke lagret på telefonen.');
    });
  }, [data, loaded]);

  const totals = useMemo(() => {
    const insuranceMonthly = data.insurance.reduce((sum, item) => sum + item.monthly, 0);
    const subscriptionsMonthly = data.subscriptions.reduce((sum, item) => sum + item.monthly, 0);
    const saved = data.goals.reduce((sum, item) => sum + item.saved, 0);
    const targets = data.goals.reduce((sum, item) => sum + item.target, 0);
    return { insuranceMonthly, subscriptionsMonthly, saved, targets };
  }, [data]);

  const addInsurance = (item: Omit<Insurance, 'id'>) => {
    setData((current) => ({
      ...current,
      insurance: [...current.insurance, { ...item, id: createId('insurance') }],
    }));
    setForm(null);
  };

  const addSubscription = (item: Omit<Subscription, 'id'>) => {
    setData((current) => ({
      ...current,
      subscriptions: [...current.subscriptions, { ...item, id: createId('subscription') }],
    }));
    setForm(null);
  };

  const addGoal = (item: Omit<SavingsGoal, 'id'>) => {
    setData((current) => ({
      ...current,
      goals: [...current.goals, { ...item, id: createId('goal') }],
    }));
    setForm(null);
  };

  const removeItem = (kind: Exclude<FormKind, null>, id: string, title: string) => {
    Alert.alert('Fjern post?', title, [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Fjern',
        style: 'destructive',
        onPress: () => {
          setData((current) => {
            if (kind === 'insurance') {
              return { ...current, insurance: current.insurance.filter((item) => item.id !== id) };
            }
            if (kind === 'subscription') {
              return { ...current, subscriptions: current.subscriptions.filter((item) => item.id !== id) };
            }
            return { ...current, goals: current.goals.filter((item) => item.id !== id) };
          });
        },
      },
    ]);
  };

  const updateGoalSaved = (id: string, change: number) => {
    setData((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === id
          ? { ...goal, saved: Math.min(goal.target, Math.max(0, goal.saved + change)) }
          : goal,
      ),
    }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.page}>
        <Header title={tab} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {tab === 'Oversikt' && <Overview data={data} totals={totals} onTab={setTab} />}
          {tab === 'Forsikringer' && (
            <InsuranceScreen
              items={data.insurance}
              total={totals.insuranceMonthly}
              onAdd={() => setForm('insurance')}
              onRemove={(id, title) => removeItem('insurance', id, title)}
            />
          )}
          {tab === 'Hverdag' && <EverydayScreen />}
          {tab === 'Sparing' && (
            <SavingsScreen
              goals={data.goals}
              totalSaved={totals.saved}
              totalTargets={totals.targets}
              onAdd={() => setForm('goal')}
              onRemove={(id, title) => removeItem('goal', id, title)}
              onAdjust={updateGoalSaved}
            />
          )}
          {tab === 'Abonnement' && (
            <SubscriptionsScreen
              items={data.subscriptions}
              total={totals.subscriptionsMonthly}
              onAdd={() => setForm('subscription')}
              onRemove={(id, title) => removeItem('subscription', id, title)}
            />
          )}
        </ScrollView>
        <BottomNav active={tab} onTab={setTab} />
        <DataForm
          kind={form}
          onClose={() => setForm(null)}
          onInsurance={addInsurance}
          onSubscription={addSubscription}
          onGoal={addGoal}
        />
      </View>
    </SafeAreaView>
  );
}

function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>FAMILIEØKONOMI</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.avatar}>
        <Ionicons name="people" size={20} color={colors.green} />
      </View>
    </View>
  );
}

function Overview({
  data,
  totals,
  onTab,
}: {
  data: AppData;
  totals: { insuranceMonthly: number; subscriptionsMonthly: number; saved: number; targets: number };
  onTab: (tab: TabName) => void;
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kontrollsenter</Text>
        <Text style={styles.sectionHint}>Trykk for detaljer</Text>
      </View>

      <OverviewCard
        icon="shield-checkmark-outline"
        title="Forsikringer"
        value={`${data.insurance.length} avtaler`}
        sub={`${money(totals.insuranceMonthly)} / mnd`}
        onPress={() => onTab('Forsikringer')}
      />
      <OverviewCard
        icon="repeat-outline"
        title="Abonnement"
        value={`${data.subscriptions.length} aktive`}
        sub={`${money(totals.subscriptionsMonthly)} / mnd`}
        onPress={() => onTab('Abonnement')}
      />
      <OverviewCard
        icon="flag-outline"
        title="Sparemål"
        value={`${data.goals.length} mål`}
        sub={`${money(totals.saved)} spart`}
        onPress={() => onTab('Sparing')}
      />
      <OverviewCard
        icon="cart-outline"
        title="Hverdagsøkonomi"
        value="14 700 kr"
        sub="av 17 000 kr denne måneden"
        onPress={() => onTab('Hverdag')}
      />

      <View style={styles.tipCard}>
        <View style={styles.tipIcon}>
          <Ionicons name="sparkles" size={22} color={colors.green} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.tipLabel}>NESTE SPAREKONTROLL</Text>
          <Text style={styles.tipTitle}>Se over abonnementene</Text>
          <Text style={styles.tipText}>Små månedlige trekk blir tydeligere når årsbeløpet vises.</Text>
        </View>
      </View>
    </>
  );
}

function InsuranceScreen({
  items,
  total,
  onAdd,
  onRemove,
}: {
  items: Insurance[];
  total: number;
  onAdd: () => void;
  onRemove: (id: string, title: string) => void;
}) {
  return (
    <>
      <SummaryCard
        kicker="SAMLET FORSIKRING"
        amount={`${money(total)} / mnd`}
        detail={`${money(total * 12)} / år • ${items.length} registrerte avtaler`}
      />
      <SectionTitle title="Mine forsikringer" action="Legg til" onAction={onAdd} />
      {items.length === 0 ? (
        <EmptyState icon="shield-outline" text="Ingen forsikringer er lagt inn ennå." />
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.listCard}>
            <View style={styles.listTopRow}>
              <View style={styles.iconBox}>
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.green} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.listTitle}>{item.type}</Text>
                <Text style={styles.listSub}>{item.provider}</Text>
              </View>
              <Pressable onPress={() => onRemove(item.id, item.type)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
            <View style={styles.listDetails}>
              <Detail label="Pris" value={`${money(item.monthly)} / mnd`} />
              <Detail label="Dekning" value={item.coverage || 'Ikke registrert'} />
              <Detail label="Fornyelse" value={item.renewal || 'Ikke registrert'} />
            </View>
          </View>
        ))
      )}
    </>
  );
}

function SubscriptionsScreen({
  items,
  total,
  onAdd,
  onRemove,
}: {
  items: Subscription[];
  total: number;
  onAdd: () => void;
  onRemove: (id: string, title: string) => void;
}) {
  return (
    <>
      <SummaryCard
        kicker="LØPENDE ABONNEMENT"
        amount={`${money(total)} / mnd`}
        detail={`${money(total * 12)} / år • ${items.length} aktive tjenester`}
      />
      <SectionTitle title="Mine abonnement" action="Legg til" onAction={onAdd} />
      {items.length === 0 ? (
        <EmptyState icon="repeat-outline" text="Ingen abonnement er lagt inn ennå." />
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.compactCard}>
            <View style={styles.iconBox}>
              <Ionicons name="globe-outline" size={22} color={colors.green} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.listTitle}>{item.name}</Text>
              <Text style={styles.listSub}>{item.category}</Text>
              <Text style={styles.annualText}>{money(item.monthly * 12)} / år</Text>
            </View>
            <View style={styles.rightColumn}>
              <Text style={styles.compactValue}>{money(item.monthly)}</Text>
              <Text style={styles.perMonth}>per mnd</Text>
              <Pressable onPress={() => onRemove(item.id, item.name)} style={styles.smallDelete}>
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              </Pressable>
            </View>
          </View>
        ))
      )}
      <View style={styles.noticeCard}>
        <Ionicons name="eye-outline" size={21} color={colors.amber} />
        <Text style={styles.noticeText}>
          Årsprisen vises for å gjøre små, gjentakende trekk lettere å vurdere.
        </Text>
      </View>
    </>
  );
}

function SavingsScreen({
  goals,
  totalSaved,
  totalTargets,
  onAdd,
  onRemove,
  onAdjust,
}: {
  goals: SavingsGoal[];
  totalSaved: number;
  totalTargets: number;
  onAdd: () => void;
  onRemove: (id: string, title: string) => void;
  onAdjust: (id: string, change: number) => void;
}) {
  return (
    <>
      <SummaryCard
        kicker="SAMLET SPARING"
        amount={money(totalSaved)}
        detail={totalTargets > 0 ? `${money(totalTargets)} i samlede mål` : 'Legg til et sparemål'}
      />
      <SectionTitle title="Mine sparemål" action="Nytt mål" onAction={onAdd} />
      {goals.length === 0 ? (
        <EmptyState icon="flag-outline" text="Ingen sparemål er lagt inn ennå." />
      ) : (
        goals.map((goal) => {
          const progress = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0;
          return (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.listTopRow}>
                <View style={styles.goalIcon}>
                  <Ionicons name="airplane-outline" size={23} color={colors.green} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.listTitle}>{goal.name}</Text>
                  <Text style={styles.listSub}>{goal.targetDate || 'Ingen måldato'}</Text>
                </View>
                <Pressable onPress={() => onRemove(goal.id, goal.name)} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
              <View style={styles.goalNumbers}>
                <Text style={styles.goalSaved}>{money(goal.saved)}</Text>
                <Text style={styles.goalTarget}>av {money(goal.target)}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{Math.round(progress * 100)} % fullført</Text>
              <View style={styles.adjustRow}>
                <AdjustButton label="− 500" onPress={() => onAdjust(goal.id, -500)} />
                <AdjustButton label="+ 500" onPress={() => onAdjust(goal.id, 500)} />
                <AdjustButton label="+ 1 000" onPress={() => onAdjust(goal.id, 1000)} />
              </View>
            </View>
          );
        })
      )}
    </>
  );
}

function EverydayScreen() {
  return (
    <>
      <View style={styles.everydayHero}>
        <Text style={styles.heroLabel}>Oktober</Text>
        <Text style={styles.everydayTitle}>Hverdagsbudsjett</Text>
        <Text style={styles.everydayAmount}>14 700 av 17 000 kr</Text>
        <View style={styles.progressTrackDark}>
          <View style={[styles.progressFillLight, { width: '86%' }]} />
        </View>
        <Text style={styles.everydayNote}>2 300 kr igjen i månedens ramme</Text>
      </View>
      <BudgetRow title="Mat og husholdning" spent={11000} budget={12000} icon="basket-outline" />
      <BudgetRow title="Klær og utstyr" spent={1700} budget={2000} icon="shirt-outline" />
      <BudgetRow title="Restaurant og takeaway" spent={1200} budget={1500} icon="restaurant-outline" />
      <BudgetRow title="Annet" spent={800} budget={1500} icon="ellipsis-horizontal-circle-outline" />
      <View style={styles.noticeCard}>
        <Ionicons name="information-circle-outline" size={21} color={colors.amber} />
        <Text style={styles.noticeText}>
          Hverdagsdelen er foreløpig en prototype. Redigering kommer etter at hovedstrukturen er testet.
        </Text>
      </View>
    </>
  );
}

function DataForm({
  kind,
  onClose,
  onInsurance,
  onSubscription,
  onGoal,
}: {
  kind: FormKind;
  onClose: () => void;
  onInsurance: (item: Omit<Insurance, 'id'>) => void;
  onSubscription: (item: Omit<Subscription, 'id'>) => void;
  onGoal: (item: Omit<SavingsGoal, 'id'>) => void;
}) {
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    setFields({});
  }, [kind]);

  if (!kind) return null;

  const set = (name: string, value: string) => setFields((current) => ({ ...current, [name]: value }));

  const submit = () => {
    if (kind === 'insurance') {
      if (!fields.type?.trim()) return Alert.alert('Mangler type', 'Skriv inn hvilken forsikring dette er.');
      onInsurance({
        type: fields.type.trim(),
        provider: fields.provider?.trim() || 'Ikke registrert',
        monthly: parseAmount(fields.monthly || ''),
        coverage: fields.coverage?.trim() || '',
        renewal: fields.renewal?.trim() || '',
      });
      return;
    }
    if (kind === 'subscription') {
      if (!fields.name?.trim()) return Alert.alert('Mangler navn', 'Skriv inn navnet på abonnementet.');
      onSubscription({
        name: fields.name.trim(),
        category: fields.category?.trim() || 'Annet',
        monthly: parseAmount(fields.monthly || ''),
      });
      return;
    }
    if (!fields.name?.trim()) return Alert.alert('Mangler navn', 'Skriv inn navnet på sparemålet.');
    const target = parseAmount(fields.target || '');
    if (target <= 0) return Alert.alert('Mangler målbeløp', 'Målbeløpet må være større enn 0.');
    onGoal({
      name: fields.name.trim(),
      target,
      saved: parseAmount(fields.saved || ''),
      targetDate: fields.targetDate?.trim() || '',
    });
  };

  const config =
    kind === 'insurance'
      ? {
          title: 'Legg til forsikring',
          fields: [
            ['type', 'Type, f.eks. husforsikring'],
            ['provider', 'Forsikringsselskap'],
            ['monthly', 'Pris per måned', 'numeric'],
            ['coverage', 'Kort om dekningen'],
            ['renewal', 'Fornyelsesdato'],
          ],
        }
      : kind === 'subscription'
        ? {
            title: 'Legg til abonnement',
            fields: [
              ['name', 'Navn på tjenesten'],
              ['category', 'Kategori, f.eks. underholdning'],
              ['monthly', 'Pris per måned', 'numeric'],
            ],
          }
        : {
            title: 'Legg til sparemål',
            fields: [
              ['name', 'Navn, f.eks. Sydentur 2030'],
              ['target', 'Målbeløp', 'numeric'],
              ['saved', 'Allerede spart', 'numeric'],
              ['targetDate', 'Måldato eller periode'],
            ],
          };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalWrap}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{config.title}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {config.fields.map(([name, placeholder, keyboard]) => (
              <TextInput
                key={name}
                value={fields[name] || ''}
                onChangeText={(value) => set(name, value)}
                placeholder={placeholder}
                placeholderTextColor="#9AA19D"
                keyboardType={keyboard === 'numeric' ? 'decimal-pad' : 'default'}
                style={styles.input}
              />
            ))}
            <Pressable onPress={submit} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>Lagre</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function BottomNav({ active, onTab }: { active: TabName; onTab: (tab: TabName) => void }) {
  return (
    <View style={styles.nav}>
      {tabs.map((item) => {
        const selected = item.name === active;
        return (
          <Pressable key={item.name} onPress={() => onTab(item.name)} style={styles.navItem}>
            <Ionicons name={item.icon} size={21} color={selected ? colors.green : colors.muted} />
            <Text numberOfLines={1} style={[styles.navText, selected && styles.navActive]}>
              {item.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function OverviewCard({
  icon,
  title,
  value,
  sub,
  onPress,
}: {
  icon: IconName;
  title: string;
  value: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.overviewCard, pressed && styles.pressed]}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color={colors.green} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.listTitle}>{title}</Text>
        <Text style={styles.listSub}>{sub}</Text>
      </View>
      <Text style={styles.overviewValue}>{value}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function SummaryCard({ kicker, amount, detail }: { kicker: string; amount: string; detail: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.cardKicker}>{kicker}</Text>
      <Text style={styles.summaryAmount}>{amount}</Text>
      <Text style={styles.summaryDetail}>{detail}</Text>
    </View>
  );
}

function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onAction} style={styles.addButton}>
        <Ionicons name="add" size={18} color={colors.green} />
        <Text style={styles.addButtonText}>{action}</Text>
      </Pressable>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function BudgetRow({ title, spent, budget, icon }: { title: string; spent: number; budget: number; icon: IconName }) {
  const progress = Math.min(1, budget > 0 ? spent / budget : 0);
  return (
    <View style={styles.budgetCard}>
      <View style={styles.budgetHeader}>
        <View style={styles.budgetTitleRow}>
          <Ionicons name={icon} size={20} color={colors.green} />
          <Text style={styles.listTitle}>{title}</Text>
        </View>
        <Text style={styles.budgetValue}>{money(spent)} / {money(budget)}</Text>
      </View>
      <View style={styles.progressTrackSmall}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
    </View>
  );
}

function AdjustButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.adjustButton, pressed && styles.pressed]}>
      <Text style={styles.adjustButtonText}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={31} color={colors.green} />
      <Text style={styles.emptyText}>{text}</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: '#7A817D' },
  title: { fontSize: 29, fontWeight: '800', color: colors.ink, marginTop: 2 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DDEBE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { backgroundColor: colors.darkGreen, borderRadius: 24, padding: 22, marginBottom: 22 },
  heroLabel: { color: '#BCD0C8', fontSize: 14 },
  heroAmount: { color: '#FFFFFF', fontSize: 38, fontWeight: '800', marginTop: 5, marginBottom: 22 },
  heroStats: { flexDirection: 'row', gap: 20 },
  statLabel: { color: '#9FB8AE', fontSize: 12 },
  statValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginTop: 3 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  sectionHint: { color: colors.muted, fontSize: 11 },
  overviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 17,
    padding: 15,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.iconGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewValue: { fontSize: 13, fontWeight: '800', color: colors.ink },
  tipCard: {
    backgroundColor: colors.paleGreen,
    borderRadius: 19,
    padding: 17,
    marginTop: 13,
    flexDirection: 'row',
    gap: 12,
  },
  tipIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipLabel: { color: '#347363', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  tipTitle: { color: colors.darkGreen, fontSize: 17, fontWeight: '800', marginTop: 3 },
  tipText: { color: '#51766B', fontSize: 12, lineHeight: 18, marginTop: 3 },
  summaryCard: { backgroundColor: colors.darkGreen, borderRadius: 23, padding: 22, marginBottom: 19 },
  cardKicker: { color: '#72A798', fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  summaryAmount: { color: '#FFFFFF', fontSize: 29, fontWeight: '850', marginTop: 5 },
  summaryDetail: { color: '#B9CEC7', fontSize: 12, marginTop: 8 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.iconGreen,
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  addButtonText: { color: colors.green, fontSize: 12, fontWeight: '800' },
  listCard: { backgroundColor: colors.surface, borderRadius: 19, padding: 16, marginBottom: 11 },
  listTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  listTitle: { color: colors.ink, fontSize: 15, fontWeight: '750' },
  listSub: { color: colors.secondary, fontSize: 11, marginTop: 3 },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.paleDanger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listDetails: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    marginTop: 14,
    paddingTop: 12,
    gap: 10,
  },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  detailLabel: { color: colors.muted, fontSize: 11 },
  detailValue: { color: colors.ink, fontSize: 12, fontWeight: '700', textAlign: 'right', flex: 1 },
  compactCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 15,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  rightColumn: { alignItems: 'flex-end' },
  compactValue: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  perMonth: { color: colors.muted, fontSize: 10, marginTop: 1 },
  annualText: { color: colors.green, fontSize: 11, fontWeight: '700', marginTop: 4 },
  smallDelete: { padding: 6, marginTop: 3 },
  noticeCard: {
    backgroundColor: colors.paleAmber,
    borderRadius: 17,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 10,
  },
  noticeText: { color: colors.amber, fontSize: 12, lineHeight: 18, flex: 1 },
  goalCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 17, marginBottom: 12 },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalNumbers: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 18 },
  goalSaved: { color: colors.darkGreen, fontSize: 22, fontWeight: '850' },
  goalTarget: { color: colors.muted, fontSize: 12 },
  progressTrack: {
    height: 10,
    backgroundColor: '#E3EAE6',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: { height: 10, backgroundColor: '#68B49D', borderRadius: 5 },
  progressLabel: { color: colors.secondary, fontSize: 11, marginTop: 7 },
  adjustRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  adjustButton: {
    backgroundColor: colors.iconGreen,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  adjustButtonText: { color: colors.green, fontSize: 12, fontWeight: '800' },
  everydayHero: { backgroundColor: colors.darkGreen, borderRadius: 23, padding: 22, marginBottom: 14 },
  everydayTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 5 },
  everydayAmount: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 17 },
  progressTrackDark: {
    height: 10,
    backgroundColor: '#31564B',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 11,
  },
  progressFillLight: { height: 10, backgroundColor: '#A5E0CE', borderRadius: 5 },
  everydayNote: { color: '#B9CEC7', fontSize: 12, marginTop: 10 },
  budgetCard: { backgroundColor: colors.surface, borderRadius: 17, padding: 15, marginBottom: 9 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  budgetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  budgetValue: { color: colors.secondary, fontSize: 11, fontWeight: '700' },
  progressTrackSmall: {
    height: 7,
    backgroundColor: '#E3EAE6',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 12,
  },
  nav: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 9,
    height: 74,
    borderRadius: 24,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 4, minWidth: 0 },
  navText: { color: colors.muted, fontSize: 9, fontWeight: '600' },
  navActive: { color: colors.green, fontWeight: '800' },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: 19,
    padding: 27,
    alignItems: 'center',
  },
  emptyText: { color: colors.secondary, fontSize: 13, marginTop: 10, textAlign: 'center' },
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13, 30, 24, 0.35)' },
  modalCard: {
    maxHeight: '82%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 32,
  },
  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C8CECA',
    alignSelf: 'center',
    marginBottom: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { color: colors.ink, fontSize: 21, fontWeight: '850' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.ink,
    fontSize: 14,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: colors.green,
    borderRadius: 15,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 7,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '850' },
});
