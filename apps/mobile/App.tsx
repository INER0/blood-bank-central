import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Print from "expo-print";
import { StatusBar } from "expo-status-bar";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Droplets,
  Home,
  LogOut,
  MapPin,
  PackageOpen,
  Pencil,
  Phone,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  ScanLine,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

const API = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";
const RED = "#B32632";
const INK = "#211F1D";
const MUTED = "#716C67";
const BG = "#F7F5F2";
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const MALDIVES_ATOLLS = [
  "Haa Alif Atoll",
  "Haa Dhaalu Atoll",
  "Shaviyani Atoll",
  "Noonu Atoll",
  "Raa Atoll",
  "Baa Atoll",
  "Lhaviyani Atoll",
  "Kaafu Atoll",
  "Alif Alif Atoll",
  "Alif Dhaalu Atoll",
  "Vaavu Atoll",
  "Meemu Atoll",
  "Faafu Atoll",
  "Dhaalu Atoll",
  "Thaa Atoll",
  "Laamu Atoll",
  "Gaafu Alif Atoll",
  "Gaafu Dhaalu Atoll",
  "Gnaviyani Atoll",
  "Seenu Atoll",
];
const MALDIVES_ISLANDS: Record<string, string[]> = {
  "Haa Alif Atoll": [
    "Baarah",
    "Dhidhdhoo",
    "Filladhoo",
    "Hoarafushi",
    "Ihavandhoo",
    "Kelaa",
    "Maarandhoo",
    "Molhadhoo",
    "Muraidhoo",
    "Thakandhoo",
    "Thuraakunu",
    "Uligan",
    "Utheemu",
    "Vashafaru",
  ],
  "Haa Dhaalu Atoll": [
    "Finey",
    "Hanimaadhoo",
    "Hirimaradhoo",
    "Kulhudhuffushi",
    "Kumundhoo",
    "Kuribi",
    "Makunudhoo",
    "Naivaadhoo",
    "Nellaidhoo",
    "Neykurendhoo",
    "Nolhivaran",
    "Nolhivaranfaru",
    "Vaikaradhoo",
  ],
  "Shaviyani Atoll": [
    "Bileffahi",
    "Feevah",
    "Feydhoo",
    "Foakaidhoo",
    "Funadhoo",
    "Goidhoo",
    "Kanditheemu",
    "Komandoo",
    "Lhaimagu",
    "Maaungoodhoo",
    "Maroshi",
    "Milandhoo",
    "Narudhoo",
    "Noomaraa",
  ],
  "Noonu Atoll": [
    "Foddhoo",
    "Henbandhoo",
    "Holhudhoo",
    "Kendhikulhudhoo",
    "Kudafari",
    "Landhoo",
    "Lhohi",
    "Maafaru",
    "Maalhendhoo",
    "Magoodhoo",
    "Manadhoo",
    "Miladhoo",
    "Velidhoo",
  ],
  "Raa Atoll": [
    "Alifushi",
    "Angolhitheemu",
    "Dhuvaafaru",
    "Fainu",
    "Hulhudhuffaaru",
    "Inguraidhoo",
    "Innamaadhoo",
    "Kinolhas",
    "Maakurathu",
    "Maduvvaree",
    "Meedhoo",
    "Rasgetheemu",
    "Rasmaadhoo",
    "Ungoofaaru",
    "Vaadhoo",
  ],
  "Baa Atoll": [
    "Dharavandhoo",
    "Dhonfanu",
    "Eydhafushi",
    "Fehendhoo",
    "Fulhadhoo",
    "Goidhoo",
    "Hithaadhoo",
    "Kamadhoo",
    "Kendhoo",
    "Kihaadhoo",
    "Kudarikilu",
    "Maalhos",
    "Thulhaadhoo",
  ],
  "Lhaviyani Atoll": [
    "Hinnavaru",
    "Kurendhoo",
    "Maafilaafushi",
    "Naifaru",
    "Olhuvelifushi",
  ],
  "Kaafu Atoll": [
    "Male",
    "Hulhumale",
    "Villimale",
    "Dhiffushi",
    "Gaafaru",
    "Gulhi",
    "Guraidhoo",
    "Himmafushi",
    "Huraa",
    "Kaashidhoo",
    "Maafushi",
    "Thulusdhoo",
  ],
  "Alif Alif Atoll": [
    "Bodufolhudhoo",
    "Feridhoo",
    "Himandhoo",
    "Maalhos",
    "Mathiveri",
    "Rasdhoo",
    "Thoddoo",
    "Ukulhas",
  ],
  "Alif Dhaalu Atoll": [
    "Dhangethi",
    "Dhiddhoo",
    "Dhigurah",
    "Fenfushi",
    "Haggnaameedhoo",
    "Kunburudhoo",
    "Maamingili",
    "Mahibadhoo",
    "Mandhoo",
    "Omadhoo",
  ],
  "Vaavu Atoll": ["Felidhoo", "Fulidhoo", "Keyodhoo", "Rakeedhoo", "Thinadhoo"],
  "Meemu Atoll": [
    "Dhiggaru",
    "Kolhufushi",
    "Madifushi",
    "Maduvvaree",
    "Mulah",
    "Muli",
    "Naalaafushi",
    "Veyvah",
  ],
  "Faafu Atoll": [
    "Bileiydhoo",
    "Dharanboodhoo",
    "Feeali",
    "Magoodhoo",
    "Nilandhoo",
  ],
  "Dhaalu Atoll": [
    "Bandidhoo",
    "Hulhudheli",
    "Kudahuvadhoo",
    "Maaenboodhoo",
    "Meedhoo",
    "Rinbudhoo",
    "Vaanee",
  ],
  "Thaa Atoll": [
    "Buruni",
    "Dhiyamigili",
    "Gaadhiffushi",
    "Guraidhoo",
    "Hirilandhoo",
    "Kandoodhoo",
    "Kinbidhoo",
    "Madifushi",
    "Omadhoo",
    "Thimarafushi",
    "Vandhoo",
    "Veymandoo",
    "Vilufushi",
  ],
  "Laamu Atoll": [
    "Dhanbidhoo",
    "Fonadhoo",
    "Gaadhoo",
    "Gan",
    "Hithadhoo",
    "Isdhoo",
    "Kalaidhoo",
    "Kunahandhoo",
    "Maabaidhoo",
    "Maamendhoo",
    "Maavah",
    "Mundoo",
  ],
  "Gaafu Alif Atoll": [
    "Dhaandhoo",
    "Dhevvadhoo",
    "Gemanafushi",
    "Kanduhulhudhoo",
    "Kolamaafushi",
    "Konddhey",
    "Maamendhoo",
    "Nilandhoo",
    "Villingili",
  ],
  "Gaafu Dhaalu Atoll": [
    "Faresmaathodaa",
    "Fiyoaree",
    "Gadhdhoo",
    "Hoandeddhoo",
    "Madaveli",
    "Nadellaa",
    "Rathafandhoo",
    "Thinadhoo",
    "Vaadhoo",
  ],
  "Gnaviyani Atoll": ["Fuvahmulah"],
  "Seenu Atoll": [
    "Addu City",
    "Feydhoo",
    "Hithadhoo",
    "Hulhudhoo",
    "Maradhoo",
    "Maradhoo-Feydhoo",
    "Meedhoo",
  ],
};

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  hospitalId?: string;
  hospitalName?: string;
  bloodType?: string;
  eligible?: boolean;
  eligibilityNote?: string;
  ineligibleUntil?: string;
  lastDonationDate?: string;
  identificationType?: string;
  identificationNumber?: string;
  atoll?: string;
  island?: string;
};
type Session = { token: string; user: User };

async function request(
  path: string,
  options: RequestInit = {},
  token?: string,
) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = Array.isArray(data.issues)
      ? data.issues
          .map(
            (issue: any) =>
              `${fieldName(issue.path?.at(-1))}: ${friendlyIssue(issue.message)}`,
          )
          .join("\n")
      : data.message;
    throw new Error(details || "Unable to complete this request");
  }
  return data;
}

function fieldName(value?: string) {
  return value
    ? value.replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase())
    : "Field";
}
function friendlyIssue(message: string) {
  return message
    .replace("Invalid email address", "Enter a valid email address")
    .replace(
      /Too small: expected string to have >=(\d+) characters/,
      "Must contain at least $1 characters",
    );
}
function showFormErrors(title: string, errors: string[]) {
  if (errors.length) {
    Alert.alert(title, errors.join("\n"));
    return true;
  }
  return false;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem("session")
      .then((value) => value && setSession(JSON.parse(value)))
      .finally(() => setBooting(false));
  }, []);
  const updateSession = async (next: Session | null) => {
    setSession(next);
    next
      ? await AsyncStorage.setItem("session", JSON.stringify(next))
      : await AsyncStorage.removeItem("session");
  };
  if (booting)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={RED} size="large" />
      </View>
    );
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {session ? (
        <Main session={session} logout={() => updateSession(null)} />
      ) : (
        <Login onLogin={updateSession} />
      )}
    </SafeAreaView>
  );
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [registering, setRegistering] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodType, setBloodType] = useState("O+");
  const [atoll, setAtoll] = useState("");
  const [island, setIsland] = useState("");
  const [identificationType, setIdentificationType] = useState("maldives_id");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const changeMode = (next: boolean) => {
    setRegistering(next);
    setFullName("");
    setPhone("");
    setAtoll("");
    setIsland("");
    setIdentificationType("maldives_id");
    setIdentificationNumber("");
    setBloodType("O+");
    setEmail("");
    setPassword("");
    setPasswordConfirmation("");
    setTemporaryPassword("");
  };
  const submit = async () => {
    const errors: string[] = [];
    if (registering && !fullName.trim()) errors.push("Full name is required.");
    if (!email.trim()) errors.push("Email is required.");
    else if (!/^\S+@\S+\.\S+$/.test(email))
      errors.push("Enter a valid email address.");
    if (registering && !phone.trim()) errors.push("Phone number is required.");
    else if (registering && phone.trim().length < 7)
      errors.push("Phone number must contain at least 7 characters.");
    if (registering && !atoll) errors.push("Atoll is required.");
    if (registering && !island.trim())
      errors.push("City or island is required.");
    if (registering && !identificationNumber.trim())
      errors.push(
        identificationType === "maldives_id"
          ? "Maldives ID Card number is required."
          : "Passport number is required.",
      );
    else if (
      registering &&
      identificationType === "maldives_id" &&
      !/^A\d{6}$/i.test(identificationNumber.trim())
    )
      errors.push(
        "Maldives ID must be A followed by 6 digits, for example A123456.",
      );
    if (!password) errors.push("Password is required.");
    else if (password.length < 8)
      errors.push("Password must contain at least 8 characters.");
    if (registering && !passwordConfirmation)
      errors.push("Confirm password is required.");
    else if (registering && password !== passwordConfirmation)
      errors.push("Passwords do not match.");
    if (
      showFormErrors(
        registering
          ? "Check your signup details"
          : "Check your sign-in details",
        errors,
      )
    )
      return;
    try {
      setLoading(true);
      const path = registering ? "/auth/register" : "/auth/login";
      const body = registering
        ? {
            fullName,
            email: email.trim(),
            password,
            passwordConfirmation,
            temporaryPassword: temporaryPassword.trim() || undefined,
            phone,
            atoll,
            island,
            bloodType,
            identificationType,
            identificationNumber,
          }
        : { email: email.trim(), password };
      onLogin(
        await request(path, { method: "POST", body: JSON.stringify(body) }),
      );
    } catch (e) {
      Alert.alert(
        registering ? "Sign up failed" : "Sign in failed",
        (e as Error).message,
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.login}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.mark}>
        <Droplets color="white" size={34} strokeWidth={2.4} />
      </View>
      <Text style={styles.brand}>Blood Bank Central</Text>
      <Text style={styles.loginCopy}>
        One network for donors, patients, and hospitals.
      </Text>
      <View style={styles.authSwitch}>
        <Pressable
          onPress={() => changeMode(false)}
          style={[styles.authOption, !registering && styles.authOptionActive]}
        >
          <Text
            style={[styles.authOptionText, !registering && { color: "white" }]}
          >
            Sign in
          </Text>
        </Pressable>
        <Pressable
          onPress={() => changeMode(true)}
          style={[styles.authOption, registering && styles.authOptionActive]}
        >
          <Text
            style={[styles.authOptionText, registering && { color: "white" }]}
          >
            Sign up
          </Text>
        </Pressable>
      </View>
      <ScrollView
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        {registering && (
          <Field
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
          />
        )}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {registering && (
          <Field
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        )}
        {registering && (
          <LocationFields
            atoll={atoll}
            island={island}
            onAtollChange={setAtoll}
            onIslandChange={setIsland}
          />
        )}
        {registering && (
          <>
            <Text style={styles.fieldLabel}>Identification</Text>
            <ChoiceRow
              values={["maldives_id", "passport"]}
              value={identificationType}
              onChange={setIdentificationType}
            />
            <Field
              label={
                identificationType === "maldives_id"
                  ? "Maldives ID Card number"
                  : "Passport number"
              }
              value={identificationNumber}
              onChangeText={setIdentificationNumber}
              autoCapitalize="characters"
              placeholder={
                identificationType === "maldives_id"
                  ? "A123456"
                  : "Enter passport number"
              }
            />
          </>
        )}
        {registering && (
          <>
            <Text style={styles.fieldLabel}>Blood type</Text>
            <BloodTypePicker value={bloodType} onChange={setBloodType} />
          </>
        )}
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        {registering && (
          <Field
            label="Staff-issued temporary password (if registered as a walk-in)"
            value={temporaryPassword}
            onChangeText={setTemporaryPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
        {registering && (
          <Field
            label="Confirm password"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
        <Button
          label={
            loading
              ? "Please wait..."
              : registering
                ? "Create account"
                : "Sign in"
          }
          onPress={submit}
          disabled={loading}
        />
        {!registering && (
          <Text style={styles.demo}>Demo: donor@demo.local / Password123!</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Main({ session, logout }: { session: Session; logout: () => void }) {
  const staff = session.user.role !== "public";
  const tabs =
    session.user.role === "admin"
      ? ["Admin", "Profile"]
      : staff
        ? session.user.role === "hospital_manager"
          ? [
              "Overview",
              "Inventory",
              "Patients",
              "Requests",
              "Hospital",
            ]
          : [
              "Overview",
              "Inventory",
              "Patients",
              "Requests",
              "Profile",
            ]
        : ["Home", "Availability", "Donate", "Requests", "Profile"];
  const [tab, setTab] = useState(tabs[0]!);
  const icons: any = {
    Home,
    Overview: Home,
    Availability: Droplets,
    Donate: CalendarDays,
    Appointments: CalendarDays,
    Requests: ClipboardList,
    Inventory: PackageOpen,
    Patients: Users,
    Hospital: Users,
    Profile: UserRound,
    Admin: ShieldCheck,
  };
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.wordmark}>BLOOD BANK CENTRAL</Text>
          <Text style={styles.role}>
            {session.user.role.replaceAll("_", " ")}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Sign out"
          onPress={logout}
          style={styles.iconButton}
        >
          <LogOut size={20} color={INK} />
        </Pressable>
      </View>
      <View style={{ flex: 1 }}>
        {tab === "Home" && <DonorHome session={session} onNavigate={setTab} />}
        {tab === "Overview" && (
          <StaffHome session={session} onNavigate={setTab} />
        )}
        {tab === "Availability" && <Availability session={session} />}
        {tab === "Donate" && <Donate session={session} />}
        {tab === "Requests" && <Requests session={session} />}
        {tab === "Inventory" && <Inventory session={session} />}
        {tab === "Patients" && <Patients session={session} />}
        {tab === "Hospital" && <HospitalAdmin session={session} />}
        {tab === "Profile" && <Profile session={session} />}
        {tab === "Admin" && <AdminPortal session={session} />}
      </View>
      <View style={styles.tabbar}>
        {tabs.map((name) => {
          const Icon = icons[name];
          const active = tab === name;
          return (
            <Pressable
              key={name}
              onPress={() => setTab(name)}
              style={styles.tab}
            >
              <Icon size={21} color={active ? RED : MUTED} />
              <Text
                style={[styles.tabText, active && styles.tabActive]}
                numberOfLines={1}
              >
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DonorHome({
  session,
  onNavigate,
}: {
  session: Session;
  onNavigate: (tab: string) => void;
}) {
  const [profile, setProfile] = useState<User | null>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [needs, setNeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    return Promise.all([
      request("/auth/me", {}, session.token),
      request("/public/availability"),
      request("/requests/community", {}, session.token),
    ])
      .then(([p, a, activeNeeds]) => {
        setProfile(p);
        setAvailability(a);
        setNeeds(activeNeeds);
      })
      .catch((e) => Alert.alert("Home unavailable", e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  const total = availability.reduce((sum, item) => sum + item.units, 0);
  const matchingStock = availability
    .filter((item) => item.bloodType === profile?.bloodType)
    .reduce((sum, item) => sum + item.units, 0);
  const localNeeds = needs
    .filter(
      (item) =>
        !profile?.atoll ||
        item.atoll === profile.atoll ||
        item.island === profile.island,
    )
    .slice(0, 3);
  return (
    <ScrollView
      contentContainerStyle={styles.page}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={RED} />
      }
    >
      <Text style={styles.eyebrow}>YOUR BLOOD NETWORK</Text>
      <Text style={styles.title}>
        Hello, {session.user.fullName.split(" ")[0]}
      </Text>
      <Text style={styles.lead}>
        {profile?.island && profile?.atoll
          ? `${profile.island}, ${profile.atoll}`
          : "Maldives"}
      </Text>
      <View style={styles.eligibility}>
        <View style={styles.dropCircle}>
          <Droplets color="white" size={26} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardLabel}>DONOR STATUS</Text>
          <Text style={styles.cardTitle}>
            {profile?.eligible === false
              ? "Not eligible to donate"
              : "Eligible to donate"}
          </Text>
          <Text style={[styles.cardCopy, { color: "#D7E8DE" }]}>
            {profile?.bloodType || "Blood type pending"} ·{" "}
            {profile?.lastDonationDate
              ? `Last donated ${formatDate(profile.lastDonationDate)}`
              : "No previous donation"}
          </Text>
          {profile?.eligible === false && (
            <Text style={styles.eligibilityDetail}>
              {profile.ineligibleUntil
                ? `Eligible again ${formatDate(profile.ineligibleUntil)}`
                : profile.eligibilityNote || "Contact a hospital for details"}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.homeActions}>
        <Pressable
          onPress={() => onNavigate("Availability")}
          style={styles.homeAction}
        >
          <Droplets size={21} color={RED} />
          <Text style={styles.homeActionTitle}>Find blood</Text>
          <Text style={styles.homeActionMeta}>Search nearby stock</Text>
        </Pressable>
        <Pressable
          onPress={() => onNavigate("Donate")}
          style={styles.homeAction}
        >
          <CalendarDays size={21} color={RED} />
          <Text style={styles.homeActionTitle}>Donate</Text>
          <Text style={styles.homeActionMeta}>Find a walk-in centre</Text>
        </Pressable>
        <Pressable
          onPress={() => onNavigate("Requests")}
          style={styles.homeAction}
        >
          <ClipboardList size={21} color={RED} />
          <Text style={styles.homeActionTitle}>Request</Text>
          <Text style={styles.homeActionMeta}>Request blood</Text>
        </Pressable>
      </View>
      <SectionTitle title="Blood availability" />
      <View style={styles.homeStockBand}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardLabel, { color: MUTED }]}>
            YOUR BLOOD TYPE
          </Text>
          <Text style={styles.homeStockValue}>
            {matchingStock} {profile?.bloodType || ""} units
          </Text>
          <Text style={styles.rowMeta}>Available across the network</Text>
        </View>
        <View style={styles.homeStockDivider} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardLabel, { color: MUTED }]}>ALL STOCK</Text>
          <Text style={styles.homeStockValue}>{total} units</Text>
          <Text style={styles.rowMeta}>
            {new Set(availability.map((x) => x.hospitalId)).size} centre
            {new Set(availability.map((x) => x.hospitalId)).size !== 1
              ? "s"
              : ""}
          </Text>
        </View>
      </View>
      <View style={styles.resultsHeading}>
        <SectionTitle title="Needs near you" />
        <Pressable onPress={() => onNavigate("Donate")}>
          <Text style={styles.textAction}>View all</Text>
        </Pressable>
      </View>
      {localNeeds.length ? (
        localNeeds.map((need) => <BloodNeedRow key={need.id} need={need} />)
      ) : (
        <Empty text="No active blood requests in your area." />
      )}
    </ScrollView>
  );
}

function StaffHome({
  session,
  onNavigate,
}: {
  session: Session;
  onNavigate: (tab: string) => void;
}) {
  const [bags, setBags] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    return Promise.all([
      request("/inventory", {}, session.token),
      request("/requests", {}, session.token),
      request("/auth/me", {}, session.token),
    ])
      .then(([b, r, p]) => {
        setBags(b);
        setRequests(r);
        setProfile(p);
      })
      .catch((e) => Alert.alert("Overview unavailable", e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  const ownRequests = requests.filter(
    (requestItem) => requestItem.hospitalId === session.user.hospitalId,
  );
  const activeRequests = ownRequests.filter(
    (requestItem) => !["fulfilled", "rejected"].includes(requestItem.status),
  );
  const expiring = bags
    .filter(
      (bag) =>
        bag.status === "available" &&
        daysUntil(bag.expiresAt) >= 0 &&
        daysUntil(bag.expiresAt) <= 7,
    )
    .sort(
      (a, b) =>
        new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
    );
  const critical = activeRequests
    .filter((requestItem) => requestItem.urgency === "critical")
    .slice(0, 3);
  return (
    <ScrollView
      contentContainerStyle={styles.page}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={RED} />
      }
    >
      <Text style={styles.eyebrow}>HOSPITAL OPERATIONS</Text>
      <Text style={styles.title}>
        {profile?.hospitalName || "Hospital overview"}
      </Text>
      <Text style={styles.lead}>
        {session.user.role === "hospital_manager"
          ? "Hospital administrator account"
          : `${profile?.fullName || session.user.fullName} · Staff`}
      </Text>
      <View style={styles.staffMetricGrid}>
        <Pressable
          onPress={() => onNavigate("Inventory")}
          style={styles.staffMetric}
        >
          <PackageOpen size={19} color={RED} />
          <Text style={styles.staffMetricValue}>
            {bags.filter((bag) => bag.status === "available").length}
          </Text>
          <Text style={styles.staffMetricLabel}>Available units</Text>
        </Pressable>
        <Pressable
          onPress={() => onNavigate("Requests")}
          style={styles.staffMetric}
        >
          <ClipboardList size={19} color={RED} />
          <Text style={styles.staffMetricValue}>{activeRequests.length}</Text>
          <Text style={styles.staffMetricLabel}>Open requests</Text>
        </Pressable>
        <Pressable
          onPress={() => onNavigate("Inventory")}
          style={styles.staffMetric}
        >
          <Droplets size={19} color={RED} />
          <Text style={styles.staffMetricValue}>
            {bags.filter((bag) => bag.status === "reserved").length}
          </Text>
          <Text style={styles.staffMetricLabel}>Reserved units</Text>
        </Pressable>
      </View>
      <View style={styles.staffQuickActions}>
        {[
          ["Inventory", PackageOpen],
          ["Patients", Users],
          ["Requests", ClipboardList],
        ].map(([label, Icon]: any) => (
          <Pressable
            key={label}
            onPress={() => onNavigate(label)}
            style={styles.staffQuickAction}
          >
            <Icon size={19} color={INK} />
            <Text style={styles.staffQuickText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.resultsHeading}>
        <SectionTitle title="Expiring soon" />
        <Pressable onPress={() => onNavigate("Inventory")}>
          <Text style={styles.textAction}>View inventory</Text>
        </Pressable>
      </View>
      {expiring.length ? (
        <View style={styles.staffAttentionBand}>
          <View style={{ flex: 1 }}>
            <Text style={styles.staffAttentionValue}>{expiring.length}</Text>
            <Text style={styles.rowTitle}>units expire within 7 days</Text>
            <Text style={styles.rowMeta}>
              Issue {expiring[0].code} first · expires{" "}
              {formatDate(expiring[0].expiresAt)}
            </Text>
          </View>
          <Status value="attention" />
        </View>
      ) : (
        <View style={styles.staffClearState}>
          <PackageOpen size={20} color="#477A61" />
          <Text style={styles.staffClearText}>
            No available units expire within 7 days.
          </Text>
        </View>
      )}
      <View style={styles.resultsHeading}>
        <SectionTitle title="Critical requests" />
        <Pressable onPress={() => onNavigate("Requests")}>
          <Text style={styles.textAction}>View requests</Text>
        </Pressable>
      </View>
      {critical.length ? (
        critical.map((requestItem) => (
          <RequestRow key={requestItem.id} item={requestItem} />
        ))
      ) : (
        <View style={styles.staffClearState}>
          <ClipboardList size={20} color="#477A61" />
          <Text style={styles.staffClearText}>
            No critical requests for your hospital.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function Availability({ session }: { session: Session }) {
  const [items, setItems] = useState<any[]>([]);
  const [donors, setDonors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bloodType, setBloodType] = useState("All");
  const [windowDays, setWindowDays] = useState("All");
  const [area, setArea] = useState("My atoll");
  const [radius, setRadius] = useState("5");
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    try {
      let position = coords;
      if (area === "Radius" && !position) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          setArea("My atoll");
          throw new Error(
            "Location permission is required for radius search. You can continue using the atoll filter.",
          );
        }
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        position = current.coords;
        setCoords(position);
      }
      const params = new URLSearchParams({
        bloodType: bloodType === "All" ? "" : bloodType,
        windowDays: windowDays === "All" ? "0" : windowDays,
        atoll: area === "My atoll" ? session.user.atoll || "" : "",
        island: "",
        radiusKm: area === "Radius" ? radius : "0",
        latitude: String(position?.latitude || 0),
        longitude: String(position?.longitude || 0),
      });
      const donorParams = new URLSearchParams({
        bloodType: bloodType === "All" ? "" : bloodType,
        atoll: area === "My atoll" ? session.user.atoll || "" : "",
        island: "",
      });
      const [stock, donorData] = await Promise.all([
        request(`/public/availability?${params}`),
        request(`/public/donors/count?${donorParams}`),
      ]);
      setItems(stock);
      setDonors(donorData.count);
    } catch (e) {
      Alert.alert("Availability search", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [bloodType, windowDays, area, radius]);
  const hospitals = useMemo(
    () =>
      Array.from(
        new Map(
          items.map((item) => [
            item.hospitalId,
            {
              id: item.hospitalId,
              name: item.hospital,
              island: item.island,
              atoll: item.atoll,
              distanceKm: item.distanceKm,
              rows: items.filter((x) => x.hospitalId === item.hospitalId),
            },
          ]),
        ).values(),
      ) as any[],
    [items],
  );
  const total = items.reduce((sum, item) => sum + item.units, 0);
  const expiring = items.reduce((sum, item) => sum + item.expiringSoon, 0);
  const types = new Set(items.map((item) => item.bloodType)).size;
  return (
    <ScrollView
      contentContainerStyle={styles.page}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={RED} />
      }
    >
      <Text style={styles.eyebrow}>LIVE INVENTORY</Text>
      <Text style={styles.title}>Blood availability</Text>
      <View style={styles.statBar}>
        <Metric value={String(total)} label="available units" />
        <Metric value={String(types)} label="blood types" />
        <Metric value={String(donors)} label="eligible donors" />
      </View>
      <Text style={styles.expiryNote}>
        {expiring} filtered units expire within 7 days
      </Text>
      <SectionTitle title="Blood type" />
      <FilterGrid
        values={["All", ...BLOOD_TYPES]}
        value={bloodType}
        onChange={setBloodType}
      />
      <SectionTitle title="Blood expiry" />
      <ChoiceRow
        values={["7", "30", "All"]}
        labels={{
          "7": "Expires within 7 days",
          "30": "Expires within 30 days",
          All: "All available blood",
        }}
        value={windowDays}
        onChange={setWindowDays}
      />
      <SectionTitle title="Search area" />
      <ChoiceRow
        values={["My atoll", "Radius", "All areas"]}
        value={area}
        onChange={setArea}
      />
      {area === "Radius" && (
        <ChoiceRow
          values={["2.5", "5", "10", "25"]}
          labels={{
            "2.5": "2.5 km",
            "5": "5 km",
            "10": "10 km",
            "25": "25 km",
          }}
          value={radius}
          onChange={setRadius}
        />
      )}
      <View style={styles.resultsHeading}>
        <SectionTitle title={`${hospitals.length} hospitals and blood banks`} />
        {loading && <ActivityIndicator color={RED} />}
      </View>
      {hospitals.length === 0 && !loading ? (
        <Empty text="No matching blood stock was found in this area." />
      ) : (
        hospitals.map((hospital) => (
          <Pressable
            key={hospital.id}
            onPress={() =>
              setExpanded(expanded === hospital.id ? null : hospital.id)
            }
            style={styles.hospitalResult}
          >
            <View style={styles.hospitalHeader}>
              <View style={styles.locationIcon}>
                <MapPin size={19} color={RED} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{hospital.name}</Text>
                <Text style={styles.rowMeta}>
                  {hospital.island}, {hospital.atoll}
                  {hospital.distanceKm ? ` · ${hospital.distanceKm} km` : ""}
                </Text>
              </View>
              <ChevronDown
                size={19}
                color={MUTED}
                style={{
                  transform: [
                    { rotate: expanded === hospital.id ? "180deg" : "0deg" },
                  ],
                }}
              />
            </View>
            {expanded === hospital.id && (
              <View style={styles.stockBreakdown}>
                {hospital.rows.map((row: any) => (
                  <View key={row.bloodType} style={styles.stockRow}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>{row.bloodType}</Text>
                    </View>
                    <Text style={styles.stockLabel}>Available</Text>
                    <Text style={styles.units}>{row.units}</Text>
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function Donate({ session }: { session: Session }) {
  const [view, setView] = useState("Centres");
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [centres, setCentres] = useState<any[]>([]);
  const [needs, setNeeds] = useState<any[]>([]);
  const load = () =>
    Promise.all([
      request("/public/donation-centres"),
      request("/requests/community", {}, session.token),
    ]).then(([c, n]) => {
      setCentres(c);
      setNeeds(n);
    });
  useEffect(() => {
    load().catch((e) =>
      Alert.alert("Donation information unavailable", e.message),
    );
  }, []);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.headingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>DONATE</Text>
          <Text style={styles.title}>Give blood nearby</Text>
        </View>
        <Pressable
          accessibilityLabel="Create blood request"
          onPress={() => setCreatingRequest(true)}
          style={styles.addButton}
        >
          <Plus size={22} color="white" />
        </Pressable>
      </View>
      <View style={styles.authSwitch}>
        <Pressable
          onPress={() => setView("Centres")}
          style={[
            styles.authOption,
            view === "Centres" && styles.authOptionActive,
          ]}
        >
          <Text
            style={[
              styles.authOptionText,
              view === "Centres" && { color: "white" },
            ]}
          >
            Walk-in centres
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setView("Needs")}
          style={[
            styles.authOption,
            view === "Needs" && styles.authOptionActive,
          ]}
        >
          <Text
            style={[
              styles.authOptionText,
              view === "Needs" && { color: "white" },
            ]}
          >
            All requests
          </Text>
        </Pressable>
      </View>
      {view === "Centres" ? (
        <>
          <View style={styles.notice}>
            <Text style={styles.cardLabel}>WALK-IN DONATION</Text>
            <Text style={styles.noticeTitle}>No appointment needed</Text>
            <Text style={styles.cardCopy}>
              Visit during the donation hours shown below. Bring your Maldives ID Card or passport.
            </Text>
          </View>
          <SectionTitle title="Hospitals and blood banks accepting walk-ins" />
          {centres.map((centre) => (
            <View key={centre.id} style={styles.centreResult}>
              <View style={styles.hospitalHeader}>
                <View style={styles.locationIcon}>
                  <MapPin size={19} color={RED} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{centre.name}</Text>
                  <Text style={styles.rowMeta}>
                    {centre.island}, {centre.atoll}
                  </Text>
                  <Text style={styles.hours}>
                    {centre.donationDays} · {centre.opensAt || "Hours not set"}
                    {centre.closesAt ? `-${centre.closesAt}` : ""}
                  </Text>
                </View>
              </View>
              <Text style={styles.noSlots}>
                Walk in during donation hours. Please call the centre before travelling if hours may change.
              </Text>
            </View>
          ))}
        </>
      ) : (
        <>
          <SectionTitle title="Requests from people in need" />
          {needs.length === 0 ? (
            <Empty text="No active blood needs nearby." />
          ) : (
            needs.map((need) => <BloodNeedRow key={need.id} need={need} />)
          )}
        </>
      )}
      <Modal
        visible={creatingRequest}
        animationType="slide"
        onRequestClose={() => setCreatingRequest(false)}
      >
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.headingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>BLOOD REQUEST</Text>
                <Text style={styles.title}>Create request</Text>
              </View>
              <Pressable
                accessibilityLabel="Close request form"
                onPress={() => setCreatingRequest(false)}
                style={styles.iconButton}
              >
                <X size={23} color={INK} />
              </Pressable>
            </View>
            <RequestForm
              session={session}
              onDone={async () => {
                setCreatingRequest(false);
                setView("Needs");
                await load();
                Alert.alert(
                  "Request created",
                  "Your blood request is now listed.",
                );
              }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

function BloodNeedRow({ need }: { need: any }) {
  const [expanded, setExpanded] = useState(false);
  const phoneNumber = String(need.contactDetail || "").replace(/[^\d+]/g, "");
  const canCall = phoneNumber.replace(/\D/g, "").length >= 7;
  const contact = async () => {
    if (!canCall) {
      Alert.alert("Contact details", need.contactDetail);
      return;
    }
    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch {
      Alert.alert("Could not open phone", `Call ${need.contactDetail}`);
    }
  };
  return (
    <View style={styles.needCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={styles.needSummary}
      >
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{need.bloodType}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>
            {need.urgency.toUpperCase()} · {need.units} unit
            {need.units !== 1 ? "s" : ""}
          </Text>
          <Text style={styles.rowMeta}>{need.hospital}</Text>
          <Text style={styles.rowMeta}>
            {need.island}, {need.atoll} · Needed {formatDate(need.neededBy)}
          </Text>
        </View>
        <ChevronDown
          size={19}
          color={MUTED}
          style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
        />
      </Pressable>
      {expanded && (
        <View style={styles.needDetails}>
          {need.notes ? (
            <View>
              <Text style={styles.fieldLabel}>Extra information</Text>
              <Text style={styles.needCopy}>{need.notes}</Text>
            </View>
          ) : (
            <Text style={styles.needCopy}>No extra information provided.</Text>
          )}
          {need.contactDetail ? (
            <View style={styles.contactRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Contact details</Text>
                <Text style={styles.contactValue}>{need.contactDetail}</Text>
              </View>
              <Pressable
                accessibilityLabel={
                  canCall ? "Call contact" : "View contact details"
                }
                onPress={contact}
                style={styles.contactButton}
              >
                <Phone size={18} color="white" />
                <Text style={styles.smallButtonText}>
                  {canCall ? "Call" : "View"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.privateContact}>
              Contact details are available to hospital and blood bank staff
              only.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function StaffAppointments({ session }: { session: Session }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingStatus, setBookingStatus] = useState("booked");
  const [bookingDate, setBookingDate] = useState("Upcoming");
  const [bookingSearch, setBookingSearch] = useState("");
  const [centre, setCentre] = useState<any>(null);
  const [opensAt, setOpensAt] = useState("09:00");
  const [closesAt, setClosesAt] = useState("16:00");
  const [days, setDays] = useState("Sunday-Thursday");
  const [date, setDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [time, setTime] = useState("10:00");
  const [capacity, setCapacity] = useState("10");
  const load = () =>
    Promise.all([
      request("/appointments/manage", {}, session.token),
      request("/appointments/centres", {}, session.token),
    ]).then(([b, c]) => {
      setBookings(b);
      const own = c.find((x: any) => x.id === session.user.hospitalId) || c[0];
      if (own) {
        setCentre(own);
        setOpensAt(own.opensAt || "09:00");
        setClosesAt(own.closesAt || "16:00");
        setDays(own.donationDays || "Sunday-Thursday");
      }
    });
  useEffect(() => {
    load().catch((e) => Alert.alert("Appointments unavailable", e.message));
  }, []);
  const save = async () => {
    try {
      await request(
        "/appointments/settings",
        {
          method: "PATCH",
          body: JSON.stringify({
            opensAt,
            closesAt,
            donationDays: days,
            enabled: true,
          }),
        },
        session.token,
      );
      Alert.alert("Donation hours saved");
      await load();
    } catch (e) {
      Alert.alert("Settings not saved", (e as Error).message);
    }
  };
  const addSlot = async () => {
    try {
      const startsAt = new Date(`${date}T${time}:00`).toISOString();
      await request(
        "/appointments/slots",
        {
          method: "POST",
          body: JSON.stringify({ startsAt, capacity: Number(capacity) }),
        },
        session.token,
      );
      Alert.alert("Appointment time published");
      await load();
    } catch (e) {
      Alert.alert("Time not published", (e as Error).message);
    }
  };
  const update = async (id: string, status: string) => {
    try {
      await request(
        `/appointments/${id}/status`,
        { method: "PATCH", body: JSON.stringify({ status }) },
        session.token,
      );
      await load();
    } catch (e) {
      Alert.alert("Booking not updated", (e as Error).message);
    }
  };
  const visibleBookings = bookings.filter(
    (booking) =>
      (bookingStatus === "All" || booking.status === bookingStatus) &&
      appointmentMatchesDate(booking.startsAt, bookingDate) &&
      [booking.donorName, booking.bloodType, booking.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(bookingSearch.trim().toLowerCase()),
  );
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>DONATION OPERATIONS</Text>
      <Text style={styles.title}>Appointments</Text>
      {centre && (
        <Text style={styles.lead}>
          {centre.name} · {centre.island}, {centre.atoll}
        </Text>
      )}
      <SectionTitle title="Donation hours" />
      <View style={styles.panel}>
        <Field
          label="Opening time (HH:MM)"
          value={opensAt}
          onChangeText={setOpensAt}
        />
        <Field
          label="Closing time (HH:MM)"
          value={closesAt}
          onChangeText={setClosesAt}
        />
        <Field label="Open days" value={days} onChangeText={setDays} />
        <Button label="Save hours" onPress={save} />
      </View>
      <SectionTitle title="Publish appointment time" />
      <View style={styles.panel}>
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <Field label="Time (HH:MM)" value={time} onChangeText={setTime} />
        <Field
          label="Capacity"
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="number-pad"
        />
        <Button label="Publish time" onPress={addSlot} />
      </View>
      <SectionTitle title="Manage bookings" />
      <View style={styles.assignmentSearch}>
        <Search size={19} color={MUTED} />
        <TextInput
          accessibilityLabel="Search appointments"
          value={bookingSearch}
          onChangeText={setBookingSearch}
          placeholder="Search donor, blood type, or phone"
          placeholderTextColor="#9B9690"
          style={styles.assignmentSearchInput}
        />
        {bookingSearch.length > 0 && (
          <Pressable
            accessibilityLabel="Clear appointment search"
            onPress={() => setBookingSearch("")}
            style={styles.miniIcon}
          >
            <X size={17} color={MUTED} />
          </Pressable>
        )}
      </View>
      <Text style={styles.fieldLabel}>Status</Text>
      <ChoiceRow
        values={["All", "booked", "completed", "cancelled", "missed"]}
        labels={{
          All: "All",
          booked: "Pending",
          completed: "Completed",
          cancelled: "Cancelled",
          missed: "Missed",
        }}
        value={bookingStatus}
        onChange={(value) => {
          setBookingStatus(value);
          setBookingDate(value === "booked" ? "Upcoming" : "All dates");
        }}
      />
      <Text style={styles.fieldLabel}>Date</Text>
      <ChoiceRow
        values={["Upcoming", "Today", "7 days", "30 days", "All dates"]}
        value={bookingDate}
        onChange={setBookingDate}
      />
      <Text style={styles.sectionTitle}>
        {visibleBookings.length} matching bookings
      </Text>
      {visibleBookings.length === 0 ? (
        <Empty text="No appointments match these filters." />
      ) : (
        visibleBookings.map((booking) => (
          <View key={booking.id} style={styles.bookingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {booking.donorName} · {booking.bloodType}
              </Text>
              <Text style={styles.rowMeta}>
                {formatDateTime(booking.startsAt)} ·{" "}
                {booking.phone || "No phone"}
              </Text>
              <Status value={booking.status} />
            </View>
            {booking.status === "booked" && (
              <View style={styles.bookingActions}>
                <Pressable
                  style={styles.smallButton}
                  onPress={() => update(booking.id, "completed")}
                >
                  <Text style={styles.smallButtonText}>Complete</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => update(booking.id, "missed")}
                >
                  <Text style={styles.secondaryButtonText}>Missed</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function Requests({ session }: { session: Session }) {
  const staff = session.user.role !== "public";
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [hospitalScope, setHospitalScope] = useState("All");
  const [requestView, setRequestView] = useState("Active");
  const [requestSearch, setRequestSearch] = useState("");
  const load = () =>
    request("/requests", {}, session.token)
      .then(setItems)
      .catch((e) => Alert.alert("Could not load requests", e.message));
  useEffect(() => {
    load();
  }, []);
  const visibleItems = staff
    ? items.filter(
        (item) =>
          (requestView === "Completed"
            ? item.status === "fulfilled"
            : item.status !== "fulfilled") &&
          (hospitalScope === "All" ||
            (hospitalScope === "Mine" &&
              item.hospitalId === session.user.hospitalId) ||
            (hospitalScope === "Others" &&
              item.hospitalId !== session.user.hospitalId)) &&
          [
            item.patientName,
            item.patientIdNumber,
            item.bloodType,
            item.hospital,
            item.island,
            item.atoll,
            item.contactDetail,
            item.notes,
            item.urgency,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(requestSearch.trim().toLowerCase()),
      )
    : items;
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.headingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>
              {staff ? "HOSPITAL QUEUE" : "PATIENT CARE"}
            </Text>
            <Text style={styles.title}>Blood requests</Text>
          </View>
          {!staff && (
            <Pressable
              accessibilityLabel="New request"
              style={styles.addButton}
              onPress={() => setShowForm(!showForm)}
            >
              <Plus color="white" size={22} />
            </Pressable>
          )}
        </View>
        {showForm && (
          <RequestForm
            session={session}
            onDone={() => {
              setShowForm(false);
              load();
            }}
          />
        )}
        {staff && (
          <View style={styles.authSwitch}>
            {(["Active", "Completed"] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => setRequestView(value)}
                style={[
                  styles.authOption,
                  requestView === value && styles.authOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.authOptionText,
                    requestView === value && { color: "white" },
                  ]}
                >
                  {value} (
                  {
                    items.filter((item) =>
                      value === "Completed"
                        ? item.status === "fulfilled"
                        : item.status !== "fulfilled",
                    ).length
                  }
                  )
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {staff && (
          <View style={styles.authSwitch}>
            {(
              [
                ["All", "All hospitals"],
                ["Mine", "My hospital"],
                ["Others", "Other hospitals"],
              ] as [string, string][]
            ).map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setHospitalScope(value)}
                style={[
                  styles.authOption,
                  hospitalScope === value && styles.authOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.authOptionText,
                    hospitalScope === value && { color: "white" },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {staff && (
          <View style={styles.assignmentSearch}>
            <Search size={19} color={MUTED} />
            <TextInput
              accessibilityLabel="Search blood requests"
              value={requestSearch}
              onChangeText={setRequestSearch}
              placeholder="Search patient, ID, blood type, hospital, or location"
              placeholderTextColor="#9B9690"
              autoCapitalize="none"
              style={styles.assignmentSearchInput}
            />
            {requestSearch.length > 0 && (
              <Pressable
                accessibilityLabel="Clear request search"
                onPress={() => setRequestSearch("")}
                style={styles.miniIcon}
              >
                <X size={17} color={MUTED} />
              </Pressable>
            )}
          </View>
        )}
        {visibleItems.length === 0 ? (
          <Empty
            text={
              requestSearch.trim()
                ? "No blood requests match this search."
                : `No ${requestView.toLowerCase()} blood requests in this hospital view.`
            }
          />
        ) : (
          visibleItems.map((x) => (
            <RequestRow
              key={x.id}
              item={x}
              session={staff ? session : undefined}
              editSession={!staff ? session : undefined}
              onChanged={load}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function RequestForm({
  session,
  onDone,
}: {
  session: Session;
  onDone: () => void;
}) {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [idType, setIdType] = useState("maldives_id");
  const [idNumber, setIdNumber] = useState("");
  const [atoll, setAtoll] = useState(session.user.atoll || "");
  const [island, setIsland] = useState(session.user.island || "");
  const [hospitalId, setHospitalId] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [type, setType] = useState("O+");
  const [urgency, setUrgency] = useState("normal");
  useEffect(() => {
    request("/public/hospitals")
      .then(setHospitals)
      .catch((e) => Alert.alert("Hospitals unavailable", e.message));
  }, []);
  const matchingHospitals = hospitals.filter(
    (h) =>
      (!atoll || h.atoll === atoll) &&
      (!island || h.island.toLowerCase() === island.trim().toLowerCase()),
  );
  const changeAtoll = (value: string) => {
    setAtoll(value);
    setHospitalId("");
  };
  const changeIsland = (value: string) => {
    setIsland(value);
    setHospitalId("");
  };
  const submit = async () => {
    const errors: string[] = [];
    if (!name.trim()) errors.push("Patient name is required.");
    else if (name.trim().length < 2)
      errors.push("Patient name must contain at least 2 characters.");
    if (!idNumber.trim())
      errors.push(
        idType === "maldives_id"
          ? "Maldives ID Card number is required."
          : "Passport number is required.",
      );
    else if (idType === "maldives_id" && !/^A\d{6}$/i.test(idNumber.trim()))
      errors.push(
        "Maldives ID must be A followed by 6 digits, for example A123456.",
      );
    else if (idType === "passport" && idNumber.trim().length < 5)
      errors.push("Passport number must contain at least 5 characters.");
    if (!atoll) errors.push("Select the atoll where blood is needed.");
    if (island.trim().length < 2)
      errors.push("Enter the city or island where blood is needed.");
    if (!hospitalId)
      errors.push("Select the hospital or blood bank that needs the blood.");
    if (contact.trim().length < 7)
      errors.push("Enter a valid phone number or other contact detail.");
    if (showFormErrors("Check the request details", errors)) return;
    try {
      const needed = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      await request(
        "/requests",
        {
          method: "POST",
          body: JSON.stringify({
            hospitalId,
            patientName: name.trim(),
            patientIdType: idType,
            patientIdNumber: idNumber.trim(),
            bloodType: type,
            units: 1,
            urgency,
            neededBy: needed,
            atoll,
            island: island.trim(),
            contactDetail: contact.trim(),
            notes: notes.trim() || undefined,
            visibility,
          }),
        },
        session.token,
      );
      onDone();
    } catch (e) {
      Alert.alert("Request not submitted", (e as Error).message);
    }
  };
  return (
    <View style={styles.panel}>
      <Field label="Patient name" value={name} onChangeText={setName} />
      <Text style={styles.fieldLabel}>Patient identification</Text>
      <ChoiceRow
        values={["maldives_id", "passport"]}
        value={idType}
        onChange={setIdType}
      />
      <Field
        label={
          idType === "maldives_id"
            ? "Maldives ID Card number"
            : "Passport number"
        }
        value={idNumber}
        onChangeText={setIdNumber}
        autoCapitalize="characters"
        placeholder={
          idType === "maldives_id" ? "A123456" : "Enter passport number"
        }
      />
      <Text style={styles.fieldLabel}>Blood type</Text>
      <BloodTypePicker value={type} onChange={setType} />
      <Text style={styles.fieldLabel}>Urgency</Text>
      <ChoiceRow
        values={["normal", "urgent", "critical"]}
        value={urgency}
        onChange={setUrgency}
      />
      <Text style={styles.formSection}>Where blood is needed</Text>
      <LocationFields
        atoll={atoll}
        island={island}
        onAtollChange={changeAtoll}
        onIslandChange={changeIsland}
      />
      <HospitalPicker
        hospitals={matchingHospitals}
        value={hospitalId}
        onChange={setHospitalId}
      />
      <Field
        label="Contact phone or details"
        value={contact}
        onChangeText={setContact}
        placeholder="Phone number or preferred contact"
        keyboardType="phone-pad"
      />
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Extra information (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={500}
          placeholder="Add any information staff or donors should know"
          placeholderTextColor="#9B9690"
          style={styles.textarea}
        />
      </View>
      <Text style={styles.fieldLabel}>Contact visibility</Text>
      <ChoiceRow
        values={["public", "staff_only"]}
        labels={{ public: "Show contact", staff_only: "Hide contact" }}
        value={visibility}
        onChange={setVisibility}
      />
      <Text style={styles.visibilityNote}>
        {visibility === "public"
          ? "Your contact details will appear with the public blood request."
          : "The request will still appear publicly, but contact details will only be shown to hospital and blood bank staff."}
      </Text>
      <Button label="Submit request" onPress={submit} />
    </View>
  );
}

function Inventory({ session }: { session: Session }) {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [tag, setTag] = useState<any | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const load = () =>
    request("/inventory", {}, session.token)
      .then(setItems)
      .catch((e) => Alert.alert("Could not load inventory", e.message));
  useEffect(() => {
    load();
  }, []);
  const statusMatches = (item: any) =>
    statusFilter === "All" ||
    item.status === statusFilter ||
    (statusFilter === "attention" &&
      ["quarantined", "expired", "disposed"].includes(item.status));
  const visible = items.filter(
    (item) =>
      (filter === "All" || item.bloodType === filter) &&
      statusMatches(item) &&
      (!search.trim() ||
        [
          item.code,
          item.donorName,
          item.donorIdentification,
          item.assignedPatientName,
          item.storageLocation,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
        )),
  );
  const fefoIds = new Set(
    BLOOD_TYPES.map(
      (type) =>
        items
          .filter(
            (item) => item.status === "available" && item.bloodType === type,
          )
          .sort(
            (a, b) =>
              new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
          )[0]?.id,
    ).filter(Boolean),
  );
  const statusCount = (status: string) =>
    items.filter((item) =>
      status === "attention"
        ? ["quarantined", "expired", "disposed"].includes(item.status)
        : item.status === status,
    ).length;
  const add = () => {
    setEditing(null);
    setShowForm(true);
  };
  const scan = async () => {
    const result = permission?.granted ? permission : await requestPermission();
    if (!result.granted) {
      Alert.alert(
        "Camera permission required",
        "Allow camera access to scan blood bag tags.",
      );
      return;
    }
    setShowScanner(true);
  };
  const scanned = async ({ data }: { data: string }) => {
    setShowScanner(false);
    try {
      const item = await request(
        `/inventory/${encodeURIComponent(data.trim())}`,
        {},
        session.token,
      );
      setEditing(item);
      setShowForm(true);
    } catch (e) {
      Alert.alert("Tag not found", (e as Error).message);
    }
  };
  const remove = (item: any) =>
    Alert.alert("Delete blood bag", `Permanently delete ${item.code}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await request(
              `/inventory/${item.id}`,
              { method: "DELETE" },
              session.token,
            );
            await load();
          } catch (e) {
            Alert.alert("Could not delete bag", (e as Error).message);
          }
        },
      },
    ]);
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={visible}
        keyExtractor={(x) => x.id}
        contentContainerStyle={styles.page}
        ListHeaderComponent={
          <>
            <Text style={styles.eyebrow}>BAG TRACKING</Text>
            <View style={styles.headingRow}>
              <Text style={[styles.title, { flex: 1 }]}>Inventory</Text>
              <Pressable
                accessibilityLabel="Scan blood bag tag"
                onPress={scan}
                style={styles.inventoryTool}
              >
                <ScanLine size={21} color={INK} />
              </Pressable>
              <Pressable
                accessibilityLabel="Add blood bag"
                onPress={add}
                style={[styles.inventoryTool, { backgroundColor: RED }]}
              >
                <Plus size={21} color="white" />
              </Pressable>
            </View>
            <View style={styles.inventoryStats}>
              <Metric
                value={String(statusCount("available"))}
                label="available"
              />
              <Metric
                value={String(statusCount("reserved"))}
                label="reserved"
              />
              <Metric value={String(statusCount("issued"))} label="issued" />
              <Metric
                value={String(statusCount("attention"))}
                label="attention"
              />
            </View>
            <Field
              label="Search inventory"
              value={search}
              onChangeText={setSearch}
              placeholder="Bag code, donor, patient, ID, or storage"
            />
            <Text style={styles.sectionTitle}>Status</Text>
            <ChoiceRow
              values={["All", "available", "reserved", "issued", "attention"]}
              labels={{
                All: "All",
                available: "Available",
                reserved: "Reserved",
                issued: "Issued",
                attention: "Attention",
              }}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <Text style={styles.sectionTitle}>Blood type</Text>
            <ChoiceRow
              values={["All", ...BLOOD_TYPES]}
              value={filter}
              onChange={setFilter}
            />
            <Text style={styles.sectionTitle}>
              {visible.length} matching bags
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.inventoryCard}>
            <Pressable
              onPress={() => setTag(item)}
              style={styles.inventoryCardMain}
            >
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{item.bloodType}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.inventoryCardTitle}>
                  <Text style={styles.rowTitle}>{item.code}</Text>
                  <Status value={item.status} />
                </View>
                <Text style={styles.patientId}>
                  Donor · {item.donorName} ·{" "}
                  {item.donorIdentification || "ID pending"}
                </Text>
                {item.assignedPatientName && (
                  <Text style={styles.assignedPatient}>
                    Assigned · {item.assignedPatientName}
                  </Text>
                )}
                {item.status === "reserved" && (
                  <Text style={styles.custodyText}>
                    Reserved for{" "}
                    {item.assignedPatientName || "patient not recorded"}
                    {"\n"}By {item.reservedByName || "staff not recorded"} at{" "}
                    {item.hospital}
                    {item.reservedAt ? ` · ${formatDate(item.reservedAt)}` : ""}
                  </Text>
                )}
                {item.status === "issued" && (
                  <Text style={styles.custodyText}>
                    Used for{" "}
                    {item.assignedPatientName || "patient not recorded"}
                    {"\n"}Issued by {item.issuedByName || "staff not recorded"}{" "}
                    at {item.hospital}
                    {item.issuedAt ? ` · ${formatDate(item.issuedAt)}` : ""}
                  </Text>
                )}
                <Text style={styles.rowMeta}>
                  {item.storageLocation || "Storage pending"} · Expires{" "}
                  {formatDate(item.expiresAt)}
                </Text>
                {item.status === "available" && fefoIds.has(item.id) && (
                  <Text style={styles.fefoLabel}>
                    ISSUE FIRST · {Math.max(0, daysUntil(item.expiresAt))} days
                    remaining
                  </Text>
                )}
              </View>
            </Pressable>
            <View style={styles.inventoryCardActions}>
              <Pressable
                accessibilityLabel={`View ${item.donorName} history`}
                onPress={() => setHistoryId(item.donorId)}
                style={styles.inventoryActionButton}
              >
                <Users size={17} color={INK} />
                <Text style={styles.inventoryActionText}>Donor history</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`Edit ${item.code}`}
                onPress={() => {
                  setEditing(item);
                  setShowForm(true);
                }}
                style={styles.inventoryActionButton}
              >
                <Pencil size={17} color={INK} />
                <Text style={styles.inventoryActionText}>Edit</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`Delete ${item.code}`}
                onPress={() => remove(item)}
                style={styles.inventoryDeleteButton}
              >
                <Trash2 size={17} color={RED} />
              </Pressable>
            </View>
          </View>
        )}
      />
      <InventoryForm
        visible={showForm}
        item={editing}
        session={session}
        onClose={() => setShowForm(false)}
        onSaved={async (saved) => {
          setShowForm(false);
          await load();
          setTag(saved);
        }}
      />
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerPage}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned}
          />
          <View style={styles.scanFrame} />
          <Text style={styles.scanText}>
            Place the blood bag QR tag inside the frame
          </Text>
          <Pressable
            accessibilityLabel="Close scanner"
            onPress={() => setShowScanner(false)}
            style={styles.scannerClose}
          >
            <X size={24} color="white" />
          </Pressable>
        </View>
      </Modal>
      <BloodBagTag item={tag} onClose={() => setTag(null)} />
      <PatientHistory
        patientId={historyId}
        session={session}
        onClose={() => setHistoryId(null)}
      />
    </View>
  );
}

function InventoryForm({
  visible,
  item,
  session,
  onClose,
  onSaved,
}: {
  visible: boolean;
  item: any;
  session: Session;
  onClose: () => void;
  onSaved: (item: any) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultExpiry = new Date(Date.now() + 35 * 86400000)
    .toISOString()
    .slice(0, 10);
  const [bloodType, setBloodType] = useState("O+");
  const [component, setComponent] = useState("Whole Blood");
  const [volume, setVolume] = useState("450");
  const [collectedAt, setCollectedAt] = useState(today);
  const [expiresAt, setExpiresAt] = useState(defaultExpiry);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("available");
  const [patients, setPatients] = useState<any[]>([]);
  const [donorId, setDonorId] = useState("");
  const [assignedPatientId, setAssignedPatientId] = useState("");
  useEffect(() => {
    if (!visible) return;
    request("/patients", {}, session.token)
      .then(setPatients)
      .catch((e) => Alert.alert("Patients unavailable", e.message));
    setDonorId(item?.donorId || "");
    setAssignedPatientId(item?.assignedPatientId || "");
    setBloodType(item?.bloodType || "O+");
    setComponent(item?.component || "Whole Blood");
    setVolume(String(item?.volumeMl || 450));
    setCollectedAt(String(item?.collectedAt || today).slice(0, 10));
    setExpiresAt(String(item?.expiresAt || defaultExpiry).slice(0, 10));
    setLocation(item?.storageLocation || "");
    setNotes(item?.notes || "");
    setStatus(item?.status || "available");
  }, [visible, item]);
  const save = async () => {
    const errors: string[] = [];
    if (component.trim().length < 2) errors.push("Enter the blood component.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(collectedAt))
      errors.push("Collection date must use YYYY-MM-DD.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt))
      errors.push("Expiry date must use YYYY-MM-DD.");
    if (expiresAt <= collectedAt)
      errors.push("Expiry date must be after collection date.");
    if (!Number.isInteger(Number(volume)) || Number(volume) <= 0)
      errors.push("Volume must be a positive whole number.");
    if (!donorId)
      errors.push("Select the registered donor this blood came from.");
    if (showFormErrors("Check bag details", errors)) return;
    const code = item?.code || `BBC-${Date.now().toString(36).toUpperCase()}`;
    const body = {
      code,
      donorId,
      bloodType,
      component: component.trim(),
      volumeMl: Number(volume),
      collectedAt,
      expiresAt,
      storageLocation: location.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
      assignedPatientId: ["reserved", "issued"].includes(status)
        ? assignedPatientId || null
        : null,
    };
    try {
      await request(
        item ? `/inventory/${item.id}` : "/inventory",
        {
          method: item ? "PATCH" : "POST",
          body: JSON.stringify(item ? { ...body, code: undefined } : body),
        },
        session.token,
      );
      const donor = patients.find((x) => x.id === donorId);
      onSaved({
        ...item,
        ...body,
        donorName: donor?.fullName || item?.donorName,
        donorIdentification:
          donor?.identificationNumber || item?.donorIdentification,
        assignedPatientName:
          patients.find((x) => x.id === assignedPatientId)?.fullName || null,
        assignedPatientIdentification:
          patients.find((x) => x.id === assignedPatientId)
            ?.identificationNumber || null,
        id: item?.id,
      });
    } catch (e) {
      Alert.alert("Could not save blood bag", (e as Error).message);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.headingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>
                {item ? "UPDATE BAG" : "NEW BAG"}
              </Text>
              <Text style={styles.title}>{item?.code || "Register blood"}</Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.iconButton}
            >
              <X size={23} color={INK} />
            </Pressable>
          </View>
          <PatientPicker
            patients={patients}
            value={donorId}
            onChange={(id) => {
              setDonorId(id);
              const donor = patients.find((x) => x.id === id);
              if (donor?.bloodType) setBloodType(donor.bloodType);
            }}
          />
          <Text style={styles.fieldLabel}>Blood type</Text>
          <BloodTypePicker value={bloodType} onChange={setBloodType} />
          <Field
            label="Component"
            value={component}
            onChangeText={setComponent}
          />
          <Field
            label="Volume (ml)"
            value={volume}
            onChangeText={setVolume}
            keyboardType="number-pad"
          />
          <Field
            label="Collected date (YYYY-MM-DD)"
            value={collectedAt}
            onChangeText={setCollectedAt}
          />
          <Field
            label="Expiry date (YYYY-MM-DD)"
            value={expiresAt}
            onChangeText={setExpiresAt}
          />
          <Field
            label="Storage location"
            value={location}
            onChangeText={setLocation}
            placeholder="Fridge and shelf"
          />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Staff note (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={1000}
              placeholder="Add handling, testing, reservation, or other bag notes"
              placeholderTextColor="#9B9690"
              style={styles.textarea}
            />
          </View>
          {item && (
            <>
              <Text style={styles.fieldLabel}>Status</Text>
              <ChoiceRow
                values={[
                  "available",
                  "reserved",
                  "issued",
                  "quarantined",
                  "expired",
                  "disposed",
                ]}
                value={status}
                onChange={setStatus}
              />
              {["reserved", "issued"].includes(status) && (
                <PatientPicker
                  patients={patients}
                  value={assignedPatientId}
                  onChange={setAssignedPatientId}
                  label="Assigned patient (optional)"
                  placeholder="No patient assigned"
                  allowClear
                />
              )}
            </>
          )}
          <Button
            label={item ? "Save changes" : "Register and generate tag"}
            onPress={save}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function PatientPicker({
  patients,
  value,
  onChange,
  label = "Donor / patient",
  placeholder = "Select registered donor",
  allowClear = false,
}: {
  patients: any[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  placeholder?: string;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = patients.find((x) => x.id === value);
  return (
    <>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Pressable
          accessibilityLabel="Select donor"
          onPress={() => setOpen(true)}
          style={styles.selectField}
        >
          <Users size={18} color={MUTED} />
          <Text
            numberOfLines={1}
            style={[styles.selectText, !selected && { color: "#9B9690" }]}
          >
            {selected
              ? `${selected.fullName} · ${selected.identificationNumber}`
              : placeholder}
          </Text>
          <ChevronDown size={18} color={MUTED} />
        </Pressable>
      </View>
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalShade}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable
                accessibilityLabel="Close"
                onPress={() => setOpen(false)}
                style={styles.iconButton}
              >
                <X size={22} color={INK} />
              </Pressable>
            </View>
            <FlatList
              data={patients}
              keyExtractor={(x) => x.id}
              ListHeaderComponent={
                allowClear ? (
                  <Pressable
                    onPress={() => {
                      onChange("");
                      setOpen(false);
                    }}
                    style={styles.hospitalOption}
                  >
                    <Text style={styles.rowTitle}>No patient assigned</Text>
                    {!value && (
                      <Text style={styles.selectedMark}>Selected</Text>
                    )}
                  </Pressable>
                ) : null
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  style={styles.hospitalOption}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>
                      {item.fullName} · {item.bloodType}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {item.identificationNumber} · {item.phone || "No phone"}
                    </Text>
                  </View>
                  {item.id === value && (
                    <Text style={styles.selectedMark}>Selected</Text>
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

function Patients({ session }: { session: Session }) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const load = () =>
    request(`/patients?search=${encodeURIComponent(search)}`, {}, session.token)
      .then(setItems)
      .catch((e) => Alert.alert("Patients unavailable", e.message));
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [search]);
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={styles.page}
        ListHeaderComponent={
          <>
            <Text style={styles.eyebrow}>CLINICAL RECORDS</Text>
            <View style={styles.headingRow}>
              <Text style={[styles.title, { flex: 1 }]}>
                Patients and donors
              </Text>
              <Pressable
                accessibilityLabel="Register walk-in patient or donor"
                onPress={() => setRegistering(true)}
                style={styles.addButton}
              >
                <Plus size={22} color="white" />
              </Pressable>
            </View>
            <Field
              label="Search"
              value={search}
              onChangeText={setSearch}
              placeholder="Name, ID card, passport, or phone"
            />
            <Text style={styles.sectionTitle}>
              {items.length} registered people
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelected(item.id)}
            style={styles.patientRow}
          >
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{item.bloodType}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.fullName}</Text>
              <Text style={styles.patientId}>{item.identificationNumber}</Text>
              <Text style={styles.rowMeta}>
                {item.island}, {item.atoll} · {item.donationCount} donations
                here
              </Text>
            </View>
            <ChevronDown
              size={18}
              color={MUTED}
              style={{ transform: [{ rotate: "-90deg" }] }}
            />
          </Pressable>
        )}
      />
      <PatientHistory
        patientId={selected}
        session={session}
        onClose={() => setSelected(null)}
      />
      <WalkInRegistration
        visible={registering}
        session={session}
        onClose={() => setRegistering(false)}
        onCreated={() => {
          setRegistering(false);
          load();
        }}
      />
    </View>
  );
}

function WalkInRegistration({
  visible,
  session,
  onClose,
  onCreated,
}: {
  visible: boolean;
  session: Session;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [registrationType, setRegistrationType] = useState("patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identificationType, setIdentificationType] = useState("maldives_id");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [bloodType, setBloodType] = useState("O+");
  const [atoll, setAtoll] = useState("Kaafu Atoll");
  const [island, setIsland] = useState("Male");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!visible) return;
    setRegistrationType("patient");
    setFullName("");
    setEmail("");
    setPhone("");
    setIdentificationType("maldives_id");
    setIdentificationNumber("");
    setBloodType("O+");
    setAtoll("Kaafu Atoll");
    setIsland("Male");
  }, [visible]);
  const changeAtoll = (value: string) => {
    setAtoll(value);
    setIsland(MALDIVES_ISLANDS[value]?.[0] || "");
  };
  const save = async () => {
    const errors: string[] = [];
    if (fullName.trim().length < 2)
      errors.push("Enter the person's full name.");
    if (phone.trim().length < 7) errors.push("Enter a valid phone number.");
    if (
      identificationType === "maldives_id" &&
      !/^A\d{6}$/i.test(identificationNumber.trim())
    )
      errors.push("Maldives ID must be A followed by 6 digits.");
    if (identificationNumber.trim().length < 5)
      errors.push("Enter the identification number.");
    if (showFormErrors("Check registration details", errors)) return;
    setSaving(true);
    try {
      const created = await request(
        "/patients",
        {
          method: "POST",
          body: JSON.stringify({
            registrationType,
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            identificationType,
            identificationNumber: identificationNumber.trim(),
            bloodType,
            atoll,
            island,
          }),
        },
        session.token,
      );
      Alert.alert(
        "Walk-in account created",
        `Login: ${created.email}\nTemporary password: ${created.temporaryPassword}`,
        [{ text: "Done", onPress: onCreated }],
      );
    } catch (e) {
      Alert.alert("Could not register person", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.headingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>WALK-IN REGISTRATION</Text>
              <Text style={styles.title}>Create user</Text>
            </View>
            <Pressable
              accessibilityLabel="Close registration"
              onPress={onClose}
              style={styles.iconButton}
            >
              <X size={23} color={INK} />
            </Pressable>
          </View>
          <Text style={styles.fieldLabel}>Registration type</Text>
          <ChoiceRow
            values={["patient", "donor"]}
            labels={{ patient: "Patient", donor: "Donor" }}
            value={registrationType}
            onChange={setRegistrationType}
          />
          <Field
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
          />
          <Field
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="A walk-in login will be generated if blank"
          />
          <Field
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Text style={styles.fieldLabel}>Identification</Text>
          <ChoiceRow
            values={["maldives_id", "passport"]}
            labels={{ maldives_id: "Maldives ID", passport: "Passport" }}
            value={identificationType}
            onChange={setIdentificationType}
          />
          <Field
            label={
              identificationType === "maldives_id"
                ? "Maldives ID Card number"
                : "Passport number"
            }
            value={identificationNumber}
            onChangeText={setIdentificationNumber}
            autoCapitalize="characters"
            placeholder={
              identificationType === "maldives_id"
                ? "A123456"
                : "Passport number"
            }
          />
          <Text style={styles.fieldLabel}>Blood type</Text>
          <BloodTypePicker value={bloodType} onChange={setBloodType} />
          <LocationFields
            atoll={atoll}
            island={island}
            onAtollChange={changeAtoll}
            onIslandChange={setIsland}
          />
          <Button
            label={saving ? "Creating user..." : "Create user"}
            onPress={save}
            disabled={saving}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function AdminPortal({ session }: { session: Session }) {
  const [view, setView] = useState("Overview");
  const [overview, setOverview] = useState<any>({});
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const load = () =>
    Promise.all([
      request("/admin/overview", {}, session.token),
      request("/admin/hospitals", {}, session.token),
      request(
        `/admin/users?search=${encodeURIComponent(search)}`,
        {},
        session.token,
      ),
    ])
      .then(([metrics, facilityRows, userRows]) => {
        setOverview(metrics);
        setHospitals(facilityRows);
        setUsers(userRows);
      })
      .catch((e) => Alert.alert("Administration unavailable", e.message));
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const setHospitalApproval = async (hospital: any) => {
    try {
      await request(
        `/admin/hospitals/${hospital.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ approved: !hospital.approved }),
        },
        session.token,
      );
      await load();
    } catch (e) {
      Alert.alert("Hospital not updated", (e as Error).message);
    }
  };
  const setUserAccess = async (user: any) => {
    try {
      await request(
        `/admin/users/${user.id}`,
        { method: "PATCH", body: JSON.stringify({ active: !user.active }) },
        session.token,
      );
      await load();
    } catch (e) {
      Alert.alert("Account not updated", (e as Error).message);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>APPLICATION ADMIN</Text>
      <Text style={styles.title}>Network control</Text>
      <Text style={styles.lead}>Blood Bank Central</Text>
      <View style={styles.authSwitch}>
        {["Overview", "Hospitals", "Users"].map((item) => (
          <Pressable
            key={item}
            onPress={() => setView(item)}
            style={[
              styles.authOption,
              view === item && styles.authOptionActive,
            ]}
          >
            <Text
              style={[
                styles.authOptionText,
                view === item && { color: "white" },
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
      {view === "Overview" ? (
        <>
          <View style={styles.staffMetricGrid}>
            {[
              [
                overview.approvedHospitals || 0,
                "Approved hospitals",
                Building2,
              ],
              [overview.publicUsers || 0, "Public users", Users],
              [overview.hospitalUsers || 0, "Hospital accounts", ShieldCheck],
              [overview.availableUnits || 0, "Available units", Droplets],
              [overview.activeRequests || 0, "Active requests", ClipboardList],
              [overview.hospitals || 0, "All facilities", Building2],
            ].map(([value, label, Icon]: any) => (
              <View key={label} style={styles.staffMetric}>
                <Icon size={19} color={RED} />
                <Text style={styles.staffMetricValue}>{value}</Text>
                <Text style={styles.staffMetricLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </>
      ) : view === "Hospitals" ? (
        <>
          <View style={styles.staffHeading}>
            <SectionTitle title={`${hospitals.length} hospitals`} />
            <Pressable
              accessibilityLabel="Create hospital"
              onPress={() => setCreating(true)}
              style={styles.addButton}
            >
              <Plus size={21} color="white" />
            </Pressable>
          </View>
          {hospitals.map((hospital) => (
            <View key={hospital.id} style={styles.adminRow}>
              <Building2
                size={22}
                color={hospital.approved ? "#477A61" : RED}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{hospital.name}</Text>
                <Text style={styles.rowMeta}>
                  {hospital.island}, {hospital.atoll} · {hospital.accountCount}{" "}
                  accounts
                </Text>
                <Text style={styles.patientId}>
                  {hospital.bagCount} blood bags
                </Text>
              </View>
              <Pressable
                onPress={() => setHospitalApproval(hospital)}
                style={
                  hospital.approved
                    ? styles.secondaryButton
                    : styles.smallButton
                }
              >
                <Text
                  style={
                    hospital.approved
                      ? styles.secondaryButtonText
                      : styles.smallButtonText
                  }
                >
                  {hospital.approved ? "Suspend" : "Approve"}
                </Text>
              </Pressable>
            </View>
          ))}
        </>
      ) : (
        <>
          <Field
            label="Search accounts"
            value={search}
            onChangeText={setSearch}
            placeholder="Name, email, ID, or hospital"
          />
          <Text style={styles.sectionTitle}>{users.length} accounts</Text>
          {users.map((user) => (
            <View key={user.id} style={styles.adminRow}>
              <UserRound size={21} color={user.active ? INK : MUTED} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{user.fullName}</Text>
                <Text style={styles.rowMeta}>{user.email}</Text>
                <Text style={styles.patientId}>
                  {user.role.replaceAll("_", " ")} ·{" "}
                  {user.hospital || "Network"}
                </Text>
              </View>
              {user.id !== session.user.id && (
                <Pressable
                  onPress={() => setUserAccess(user)}
                  style={
                    user.active ? styles.secondaryButton : styles.smallButton
                  }
                >
                  <Text
                    style={
                      user.active
                        ? styles.secondaryButtonText
                        : styles.smallButtonText
                    }
                  >
                    {user.active ? "Disable" : "Enable"}
                  </Text>
                </Pressable>
              )}
            </View>
          ))}
        </>
      )}
      <CreateHospitalForm
        visible={creating}
        session={session}
        onClose={() => setCreating(false)}
        onCreated={async () => {
          setCreating(false);
          await load();
        }}
      />
    </ScrollView>
  );
}

function CreateHospitalForm({
  visible,
  session,
  onClose,
  onCreated,
}: {
  visible: boolean;
  session: Session;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [atoll, setAtoll] = useState("Kaafu Atoll");
  const [island, setIsland] = useState("Male");
  const [phone, setPhone] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const changeAtoll = (value: string) => {
    setAtoll(value);
    setIsland(MALDIVES_ISLANDS[value]?.[0] || "");
  };
  const save = async () => {
    const errors: string[] = [];
    if (name.trim().length < 2) errors.push("Enter the hospital name.");
    if (address.trim().length < 3) errors.push("Enter the hospital address.");
    if (phone.trim().length < 7) errors.push("Enter a valid hospital phone.");
    if (managerName.trim().length < 2)
      errors.push("Enter the administrator name.");
    if (!/^\S+@\S+\.\S+$/.test(managerEmail.trim()))
      errors.push("Enter a valid administrator email.");
    if (managerPassword.length < 8)
      errors.push("Administrator password must contain at least 8 characters.");
    if (showFormErrors("Check hospital details", errors)) return;
    try {
      await request(
        "/admin/hospitals",
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            address: address.trim(),
            atoll,
            island,
            phone: phone.trim(),
            managerName: managerName.trim(),
            managerEmail: managerEmail.trim(),
            managerPassword,
          }),
        },
        session.token,
      );
      onCreated();
    } catch (e) {
      Alert.alert("Hospital not created", (e as Error).message);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.headingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>NEW HOSPITAL</Text>
              <Text style={styles.title}>Create hospital</Text>
            </View>
            <Pressable onPress={onClose} style={styles.iconButton}>
              <X size={23} color={INK} />
            </Pressable>
          </View>
          <Field label="Hospital name" value={name} onChangeText={setName} />
          <Field label="Address" value={address} onChangeText={setAddress} />
          <LocationFields
            atoll={atoll}
            island={island}
            onAtollChange={changeAtoll}
            onIslandChange={setIsland}
          />
          <Field label="Hospital phone" value={phone} onChangeText={setPhone} />
          <Text style={styles.formSection}>Hospital administrator</Text>
          <Field
            label="Full name"
            value={managerName}
            onChangeText={setManagerName}
          />
          <Field
            label="Email"
            value={managerEmail}
            onChangeText={setManagerEmail}
            autoCapitalize="none"
          />
          <Field
            label="Temporary password"
            value={managerPassword}
            onChangeText={setManagerPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <Button label="Create hospital account" onPress={save} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function HospitalAdmin({ session }: { session: Session }) {
  const [account, setAccount] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | undefined>(undefined);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [atoll, setAtoll] = useState("");
  const [island, setIsland] = useState("");
  const [phone, setPhone] = useState("");
  const [opensAt, setOpensAt] = useState("09:00");
  const [closesAt, setClosesAt] = useState("16:00");
  const [donationDays, setDonationDays] = useState("Sunday-Thursday");
  const [walkInsEnabled, setWalkInsEnabled] = useState(true);
  const load = () =>
    Promise.all([
      request("/hospital-admin/account", {}, session.token),
      request("/hospital-admin/staff", {}, session.token),
      request("/hospital-admin/donation-settings", {}, session.token),
    ])
      .then(([a, s, donation]) => {
        setAccount(a);
        setStaff(s);
        setName(a.name);
        setAddress(a.address);
        setAtoll(a.atoll);
        setIsland(a.island);
        setPhone(a.phone || "");
        setOpensAt(String(donation.opensAt || "09:00").slice(0, 5));
        setClosesAt(String(donation.closesAt || "16:00").slice(0, 5));
        setDonationDays(donation.donationDays || "Sunday-Thursday");
        setWalkInsEnabled(donation.enabled !== false);
      })
      .catch((e) =>
        Alert.alert("Hospital administration unavailable", e.message),
      );
  useEffect(() => {
    load();
  }, []);
  const saveHospital = async () => {
    const errors: string[] = [];
    if (name.trim().length < 2) errors.push("Hospital name is required.");
    if (address.trim().length < 3) errors.push("Hospital address is required.");
    if (!atoll) errors.push("Select the hospital atoll.");
    if (island.trim().length < 2)
      errors.push("Enter the hospital city or island.");
    if (phone.trim().length < 7)
      errors.push("Hospital phone must contain at least 7 characters.");
    if (showFormErrors("Check hospital details", errors)) return;
    try {
      await request(
        "/hospital-admin/account",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: name.trim(),
            address: address.trim(),
            atoll,
            island: island.trim(),
            phone: phone.trim(),
          }),
        },
        session.token,
      );
      Alert.alert("Hospital details saved");
      await load();
    } catch (e) {
      Alert.alert("Hospital not updated", (e as Error).message);
    }
  };
  const saveDonationSettings = async () => {
    const errors: string[] = [];
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(opensAt))
      errors.push("Opening time must use HH:MM format.");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(closesAt))
      errors.push("Closing time must use HH:MM format.");
    if (opensAt >= closesAt)
      errors.push("Closing time must be later than opening time.");
    if (donationDays.trim().length < 3)
      errors.push("Enter the days that accept walk-in donations.");
    if (showFormErrors("Check walk-in hours", errors)) return;
    try {
      await request(
        "/hospital-admin/donation-settings",
        {
          method: "PATCH",
          body: JSON.stringify({
            opensAt,
            closesAt,
            donationDays: donationDays.trim(),
            enabled: walkInsEnabled,
          }),
        },
        session.token,
      );
      Alert.alert("Walk-in donation hours saved");
      await load();
    } catch (e) {
      Alert.alert("Walk-in hours not updated", (e as Error).message);
    }
  };
  const deactivate = (item: any) =>
    Alert.alert(
      "Deactivate staff",
      `${item.fullName} will immediately lose access to this hospital.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              await request(
                `/hospital-admin/staff/${item.id}`,
                { method: "DELETE" },
                session.token,
              );
              await load();
            } catch (e) {
              Alert.alert("Staff not deactivated", (e as Error).message);
            }
          },
        },
      ],
    );
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>HOSPITAL ADMIN</Text>
      <Text style={styles.title}>{account?.name || "Hospital account"}</Text>
      <Text style={styles.lead}>
        Staff accounts operate as members of this hospital and share its
        authorized records and workflows.
      </Text>
      <SectionTitle title="Hospital profile" />
      <View style={styles.panel}>
        <Field label="Hospital name" value={name} onChangeText={setName} />
        <Field label="Address" value={address} onChangeText={setAddress} />
        <LocationFields
          atoll={atoll}
          island={island}
          onAtollChange={setAtoll}
          onIslandChange={setIsland}
        />
        <Field
          label="Hospital phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Button label="Save hospital profile" onPress={saveHospital} />
      </View>
      <SectionTitle title="Walk-in donations" />
      <View style={styles.panel}>
        <ChoiceRow
          values={["Enabled", "Paused"]}
          value={walkInsEnabled ? "Enabled" : "Paused"}
          onChange={(value) => setWalkInsEnabled(value === "Enabled")}
        />
        <Field
          label="Opening time (HH:MM)"
          value={opensAt}
          onChangeText={setOpensAt}
        />
        <Field
          label="Closing time (HH:MM)"
          value={closesAt}
          onChangeText={setClosesAt}
        />
        <Field
          label="Walk-in donation days"
          value={donationDays}
          onChangeText={setDonationDays}
        />
        <Button label="Save walk-in hours" onPress={saveDonationSettings} />
      </View>
      <View style={styles.staffHeading}>
        <SectionTitle title={`${staff.length} hospital accounts`} />
        <Pressable
          accessibilityLabel="Add staff"
          onPress={() => setEditing(null)}
          style={styles.addButton}
        >
          <Plus size={21} color="white" />
        </Pressable>
      </View>
      {staff.map((item) => (
        <View key={item.id} style={styles.staffRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{item.fullName}</Text>
            <Text style={styles.rowMeta}>
              {item.email} · {item.phone || "No phone"}
            </Text>
            <Text style={styles.patientId}>
              {item.role === "hospital_manager"
                ? "Hospital administrator"
                : item.active
                  ? "Active staff proxy"
                  : "Deactivated"}
            </Text>
          </View>
          {item.role === "hospital_staff" && (
            <View style={styles.inventoryActions}>
              <Pressable
                accessibilityLabel={`Edit ${item.fullName}`}
                onPress={() => setEditing(item)}
                style={styles.miniIcon}
              >
                <Pencil size={17} color={INK} />
              </Pressable>
              {item.active && (
                <Pressable
                  accessibilityLabel={`Deactivate ${item.fullName}`}
                  onPress={() => deactivate(item)}
                  style={styles.miniIcon}
                >
                  <Trash2 size={17} color={RED} />
                </Pressable>
              )}
            </View>
          )}
        </View>
      ))}
      <StaffAccountForm
        visible={editing !== undefined}
        item={editing}
        session={session}
        onClose={() => setEditing(undefined)}
        onSaved={async () => {
          setEditing(undefined);
          await load();
        }}
      />
    </ScrollView>
  );
}

function StaffAccountForm({
  visible,
  item,
  session,
  onClose,
  onSaved,
}: {
  visible: boolean;
  item: any;
  session: Session;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState("yes");
  useEffect(() => {
    if (!visible) return;
    setName(item?.fullName || "");
    setEmail(item?.email || "");
    setPhone(item?.phone || "");
    setPassword("");
    setActive(item?.active === false ? "no" : "yes");
  }, [visible, item]);
  const save = async () => {
    const errors: string[] = [];
    if (name.trim().length < 2) errors.push("Staff name is required.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      errors.push("Enter a valid staff email.");
    if (phone.trim().length < 7)
      errors.push("Staff phone must contain at least 7 characters.");
    if (!item && password.length < 8)
      errors.push("A password of at least 8 characters is required.");
    if (item && password && password.length < 8)
      errors.push("New password must contain at least 8 characters.");
    if (showFormErrors("Check staff details", errors)) return;
    try {
      await request(
        item ? `/hospital-admin/staff/${item.id}` : "/hospital-admin/staff",
        {
          method: item ? "PATCH" : "POST",
          body: JSON.stringify({
            fullName: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password: password || undefined,
            ...(item ? { active: active === "yes" } : {}),
          }),
        },
        session.token,
      );
      onSaved();
    } catch (e) {
      Alert.alert("Staff account not saved", (e as Error).message);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.headingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>
                {item ? "EDIT STAFF" : "NEW STAFF"}
              </Text>
              <Text style={styles.title}>
                {item?.fullName || "Staff proxy account"}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close staff editor"
              onPress={onClose}
              style={styles.iconButton}
            >
              <X size={23} color={INK} />
            </Pressable>
          </View>
          <Field label="Full name" value={name} onChangeText={setName} />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Field
            label={item ? "New password (optional)" : "Temporary password"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {item && (
            <>
              <Text style={styles.fieldLabel}>Account access</Text>
              <ChoiceRow
                values={["yes", "no"]}
                labels={{ yes: "Active", no: "Deactivated" }}
                value={active}
                onChange={setActive}
              />
            </>
          )}
          <Button
            label={item ? "Save staff account" : "Create staff account"}
            onPress={save}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function PatientHistory({
  patientId,
  session,
  onClose,
}: {
  patientId: string | null;
  session: Session;
  onClose: () => void;
}) {
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [historyEntry, setHistoryEntry] = useState<any | undefined>(undefined);
  const loadRecord = () =>
    request(`/patients/${patientId}`, {}, session.token).then(setRecord);
  useEffect(() => {
    if (!patientId) {
      setRecord(null);
      return;
    }
    setLoading(true);
    loadRecord()
      .catch((e) => {
        onClose();
        Alert.alert("History unavailable", e.message);
      })
      .finally(() => setLoading(false));
  }, [patientId]);
  const events = record
    ? [
        ...record.donations.map((x: any) => ({
          ...x,
          type: "Donation",
          summary: `${x.code} · ${x.bloodType} · ${x.component}`,
        })),
        ...record.requests.map((x: any) => ({
          ...x,
          type: "Blood request",
          summary: `${x.bloodType} · ${x.units} units · ${x.status}`,
        })),
        ...record.changes.map((x: any) => ({
          ...x,
          type: "Profile change",
          summary:
            Object.keys(x.changes || {})
              .map(fieldName)
              .join(", ") || "Patient details updated",
        })),
        ...record.manualHistory.map((x: any) => ({
          ...x,
          type: "Clinical history",
          summary: x.title,
          manual: true,
        })),
        ...record.receivedBags.map((x: any) => ({
          ...x,
          type: "Blood assignment",
          summary: `${x.code} · ${x.bloodType} · ${x.status}`,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
  return (
    <Modal visible={!!patientId} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        {loading || !record ? (
          <View style={styles.center}>
            <ActivityIndicator color={RED} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.headingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>PATIENT HISTORY</Text>
                <Text style={styles.title}>{record.fullName}</Text>
              </View>
              <Pressable
                accessibilityLabel="Edit patient"
                onPress={() => setEditing(true)}
                style={styles.iconButton}
              >
                <Pencil size={21} color={INK} />
              </Pressable>
              <Pressable
                accessibilityLabel="Close history"
                onPress={onClose}
                style={styles.iconButton}
              >
                <X size={23} color={INK} />
              </Pressable>
            </View>
            <View style={styles.profileBlock}>
              <Detail
                label="Identification"
                value={record.identificationNumber || "Not recorded"}
              />
              <Detail label="Blood type" value={record.bloodType} />
              <Detail label="Phone" value={record.phone || "Not recorded"} />
              <Detail
                label="Location"
                value={`${record.island || ""}, ${record.atoll || ""}`}
              />
              <Detail
                label="Donor eligibility"
                value={
                  record.eligible
                    ? "Eligible"
                    : record.ineligibilityType === "permanent"
                      ? "Ineligible for lifetime"
                      : `Ineligible until ${formatDate(record.ineligibleUntil)}`
                }
              />
            </View>
            <SectionTitle title="History at this hospital" />
            <Pressable
              onPress={() => setHistoryEntry(null)}
              style={styles.addHistoryButton}
            >
              <Plus size={18} color="white" />
              <Text style={styles.smallButtonText}>Add history</Text>
            </Pressable>
            {events.length === 0 ? (
              <Empty text="No hospital history was found." />
            ) : (
              events.map((event: any, index: number) => (
                <View
                  key={`${event.type}-${event.id}-${index}`}
                  style={styles.historyRow}
                >
                  <Text style={styles.cardLabelDark}>
                    {event.type.toUpperCase()}
                  </Text>
                  <Text style={styles.rowTitle}>{event.summary}</Text>
                  <Text style={styles.rowMeta}>
                    {event.hospital} · {formatDate(event.date)}
                  </Text>
                  {event.staffName && (
                    <Text style={styles.rowMeta}>
                      {event.manual ? "Added by" : "Changed by"}{" "}
                      {event.staffName}
                    </Text>
                  )}
                  {event.manual && event.updatedByName && (
                    <Text style={styles.rowMeta}>
                      Last edited by {event.updatedByName} · {event.hospital}
                    </Text>
                  )}
                  {event.manual && (
                    <View style={styles.historyActions}>
                      <Pressable
                        onPress={() => setHistoryEntry(event)}
                        style={styles.secondaryButton}
                      >
                        <Text style={styles.secondaryButtonText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          Alert.alert(
                            "Delete history",
                            `Delete ${event.title}?`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: async () => {
                                  try {
                                    await request(
                                      `/patients/${patientId}/history/${event.id}`,
                                      { method: "DELETE" },
                                      session.token,
                                    );
                                    await loadRecord();
                                  } catch (e) {
                                    Alert.alert(
                                      "History not deleted",
                                      (e as Error).message,
                                    );
                                  }
                                },
                              },
                            ],
                          )
                        }
                        style={styles.secondaryButton}
                      >
                        <Trash2 size={15} color={RED} />
                      </Pressable>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
      <PatientEdit
        visible={editing}
        patient={record}
        session={session}
        onClose={() => setEditing(false)}
        onSaved={async () => {
          setEditing(false);
          setLoading(true);
          await loadRecord();
          setLoading(false);
        }}
      />
      <HistoryEntryForm
        visible={historyEntry !== undefined}
        item={historyEntry}
        patientId={patientId}
        session={session}
        onClose={() => setHistoryEntry(undefined)}
        onSaved={async () => {
          setHistoryEntry(undefined);
          await loadRecord();
        }}
      />
    </Modal>
  );
}

function PatientEdit({
  visible,
  patient,
  session,
  onClose,
  onSaved,
}: {
  visible: boolean;
  patient: any;
  session: Session;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [atoll, setAtoll] = useState("");
  const [island, setIsland] = useState("");
  const [idType, setIdType] = useState("maldives_id");
  const [idNumber, setIdNumber] = useState("");
  const [bloodType, setBloodType] = useState("O+");
  const [eligibility, setEligibility] = useState("eligible");
  const [ineligibleUntil, setIneligibleUntil] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    if (!visible || !patient) return;
    setName(patient.fullName || "");
    setPhone(patient.phone || "");
    setAtoll(patient.atoll || "");
    setIsland(patient.island || "");
    setIdType(patient.identificationType || "maldives_id");
    setIdNumber(patient.identificationNumber || "");
    setBloodType(patient.bloodType || "O+");
    setEligibility(
      patient.eligible ? "eligible" : patient.ineligibilityType || "temporary",
    );
    setIneligibleUntil(String(patient.ineligibleUntil || "").slice(0, 10));
    setNote(patient.eligibilityNote || "");
  }, [visible, patient]);
  const save = async () => {
    const errors: string[] = [];
    if (name.trim().length < 2)
      errors.push("Patient name must contain at least 2 characters.");
    if (phone.trim().length < 7)
      errors.push("Phone number must contain at least 7 characters.");
    if (!atoll) errors.push("Select an atoll.");
    if (island.trim().length < 2) errors.push("Enter the city or island.");
    if (idType === "maldives_id" && !/^A\d{6}$/i.test(idNumber.trim()))
      errors.push("Maldives ID must be A followed by 6 digits.");
    if (idType === "passport" && idNumber.trim().length < 5)
      errors.push("Passport number must contain at least 5 characters.");
    if (
      eligibility === "temporary" &&
      !/^\d{4}-\d{2}-\d{2}$/.test(ineligibleUntil)
    )
      errors.push(
        "Temporary ineligibility requires an end date in YYYY-MM-DD format.",
      );
    if (showFormErrors("Check patient details", errors)) return;
    try {
      await request(
        `/patients/${patient.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            fullName: name.trim(),
            phone: phone.trim(),
            atoll,
            island: island.trim(),
            identificationType: idType,
            identificationNumber: idNumber.trim(),
            bloodType,
            eligible: eligibility === "eligible",
            eligibilityNote: note.trim() || undefined,
            ineligibilityType: eligibility === "eligible" ? null : eligibility,
            ineligibleUntil:
              eligibility === "temporary" ? ineligibleUntil : null,
          }),
        },
        session.token,
      );
      onSaved();
    } catch (e) {
      Alert.alert("Patient not updated", (e as Error).message);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.headingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>EDIT PATIENT</Text>
              <Text style={styles.title}>{patient?.fullName}</Text>
            </View>
            <Pressable
              accessibilityLabel="Close editor"
              onPress={onClose}
              style={styles.iconButton}
            >
              <X size={23} color={INK} />
            </Pressable>
          </View>
          <Field label="Full name" value={name} onChangeText={setName} />
          <Field
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <LocationFields
            atoll={atoll}
            island={island}
            onAtollChange={setAtoll}
            onIslandChange={setIsland}
          />
          <Text style={styles.fieldLabel}>Identification</Text>
          <ChoiceRow
            values={["maldives_id", "passport"]}
            value={idType}
            onChange={setIdType}
          />
          <Field
            label={
              idType === "maldives_id"
                ? "Maldives ID Card number"
                : "Passport number"
            }
            value={idNumber}
            onChangeText={setIdNumber}
            autoCapitalize="characters"
          />
          <Text style={styles.fieldLabel}>Blood type</Text>
          <BloodTypePicker value={bloodType} onChange={setBloodType} />
          <Text style={styles.fieldLabel}>Donor eligibility</Text>
          <ChoiceRow
            values={["eligible", "temporary", "permanent"]}
            labels={{
              eligible: "Eligible",
              temporary: "Temporary",
              permanent: "Lifetime",
            }}
            value={eligibility}
            onChange={setEligibility}
          />
          {eligibility === "temporary" && (
            <Field
              label="Ineligible until (YYYY-MM-DD)"
              value={ineligibleUntil}
              onChangeText={setIneligibleUntil}
            />
          )}
          <Field
            label="Eligibility note"
            value={note}
            onChangeText={setNote}
            placeholder="Optional clinical note"
          />
          <Button label="Save patient details" onPress={save} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function HistoryEntryForm({
  visible,
  item,
  patientId,
  session,
  onClose,
  onSaved,
}: {
  visible: boolean;
  item: any;
  patientId: string | null;
  session: Session;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [entryType, setEntryType] = useState("clinical_note");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  useEffect(() => {
    if (!visible) return;
    setEntryType(item?.entryType || "clinical_note");
    setTitle(item?.title || "");
    setDetails(item?.details || "");
    setOccurredAt(String(item?.date || new Date().toISOString()).slice(0, 10));
  }, [visible, item]);
  const save = async () => {
    const errors: string[] = [];
    if (title.trim().length < 2) errors.push("Enter a history title.");
    if (details.trim().length < 2) errors.push("Enter the history details.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredAt))
      errors.push("History date must use YYYY-MM-DD.");
    if (showFormErrors("Check history entry", errors)) return;
    try {
      await request(
        item
          ? `/patients/${patientId}/history/${item.id}`
          : `/patients/${patientId}/history`,
        {
          method: item ? "PATCH" : "POST",
          body: JSON.stringify({
            entryType,
            title: title.trim(),
            details: details.trim(),
            occurredAt,
          }),
        },
        session.token,
      );
      onSaved();
    } catch (e) {
      Alert.alert("History not saved", (e as Error).message);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.headingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>
                {item ? "EDIT HISTORY" : "ADD HISTORY"}
              </Text>
              <Text style={styles.title}>Clinical entry</Text>
            </View>
            <Pressable
              accessibilityLabel="Close history editor"
              onPress={onClose}
              style={styles.iconButton}
            >
              <X size={23} color={INK} />
            </Pressable>
          </View>
          <Text style={styles.fieldLabel}>Entry type</Text>
          <ChoiceRow
            values={[
              "clinical_note",
              "diagnosis",
              "procedure",
              "transfusion",
              "other",
            ]}
            labels={{
              clinical_note: "Clinical note",
              diagnosis: "Diagnosis",
              procedure: "Procedure",
              transfusion: "Transfusion",
              other: "Other",
            }}
            value={entryType}
            onChange={setEntryType}
          />
          <Field label="Title" value={title} onChangeText={setTitle} />
          <Field
            label="Date (YYYY-MM-DD)"
            value={occurredAt}
            onChangeText={setOccurredAt}
          />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Details</Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={2000}
              placeholder="Enter clinical history details"
              placeholderTextColor="#9B9690"
              style={styles.textarea}
            />
          </View>
          <Button
            label={item ? "Save history changes" : "Add to patient history"}
            onPress={save}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function BloodBagTag({ item, onClose }: { item: any; onClose: () => void }) {
  const qrRef = useRef<any>(null);
  const [printing, setPrinting] = useState(false);
  if (!item) return null;
  const print = async () => {
    setPrinting(true);
    try {
      const qr = await new Promise<string>((resolve, reject) => {
        if (!qrRef.current) return reject(new Error("QR tag is not ready"));
        qrRef.current.toDataURL(resolve);
      });
      await Print.printAsync({
        html: `<html><body style="font-family:Arial;text-align:center;padding:30px"><h1>BLOOD BANK CENTRAL</h1><img width="180" height="180" src="data:image/png;base64,${qr}"/><h2>${item.code}</h2><div style="font-size:52px;font-weight:bold;color:#b32632">${item.bloodType}</div><p><strong>Donor: ${item.donorName || "Not recorded"}</strong><br/>${item.donorIdentification || ""}</p>${item.assignedPatientName ? `<p><strong>Assigned to: ${item.assignedPatientName}</strong><br/>${item.assignedPatientIdentification || ""}</p>` : ""}<p>${item.component} · ${item.volumeMl} ml</p><p>Collected: ${String(item.collectedAt).slice(0, 10)}<br/>Expires: ${String(item.expiresAt).slice(0, 10)}</p><p>Storage: ${item.storageLocation || "Not assigned"}</p>${item.status === "reserved" ? `<p><strong>Reserved by:</strong> ${item.reservedByName || "Staff not recorded"}<br/><strong>Facility:</strong> ${item.hospital || "Not recorded"}${item.reservedAt ? `<br/><strong>Date:</strong> ${formatDate(item.reservedAt)}` : ""}</p>` : ""}${item.status === "issued" ? `<p><strong>Used for:</strong> ${item.assignedPatientName || "Patient not recorded"}<br/><strong>Issued by:</strong> ${item.issuedByName || "Staff not recorded"}<br/><strong>Facility:</strong> ${item.hospital || "Not recorded"}${item.issuedAt ? `<br/><strong>Date:</strong> ${formatDate(item.issuedAt)}` : ""}</p>` : ""}</body></html>`,
      });
    } catch (error) {
      Alert.alert("Tag not printed", (error as Error).message);
    } finally {
      setPrinting(false);
    }
  };
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalShade}>
        <View style={styles.tagSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Blood bag tag</Text>
            <Pressable
              accessibilityLabel="Close tag"
              onPress={onClose}
              style={styles.iconButton}
            >
              <X size={22} color={INK} />
            </Pressable>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagBrand}>BLOOD BANK CENTRAL</Text>
            <QRCode
              getRef={(ref) => {
                qrRef.current = ref;
              }}
              value={item.code}
              size={150}
              color={INK}
              backgroundColor="white"
            />
            <Text style={styles.tagCode}>{item.code}</Text>
            <Text style={styles.tagBlood}>{item.bloodType}</Text>
            <Text style={styles.tagDonor}>
              {item.donorName || "Donor not recorded"}
            </Text>
            <Text style={styles.tagDetails}>
              {item.donorIdentification || ""}
            </Text>
            {item.assignedPatientName && (
              <Text style={styles.tagAssigned}>
                Assigned to {item.assignedPatientName} ·{" "}
                {item.assignedPatientIdentification}
              </Text>
            )}
            {item.status === "reserved" && (
              <Text style={styles.tagCustody}>
                Reserved by {item.reservedByName || "staff not recorded"}
                {item.reservedAt ? ` on ${formatDate(item.reservedAt)}` : ""}
                {"\n"}Facility: {item.hospital || "Not recorded"}
              </Text>
            )}
            {item.status === "issued" && (
              <Text style={styles.tagCustody}>
                Used for {item.assignedPatientName || "patient not recorded"}
                {"\n"}Issued by {item.issuedByName || "staff not recorded"}
                {item.issuedAt ? ` on ${formatDate(item.issuedAt)}` : ""}
                {"\n"}Facility: {item.hospital || "Not recorded"}
              </Text>
            )}
            <Text style={styles.tagDetails}>
              {item.component} · {item.volumeMl} ml
            </Text>
            <Text style={styles.tagDetails}>
              Expires {String(item.expiresAt).slice(0, 10)} ·{" "}
              {item.storageLocation || "Location pending"}
            </Text>
          </View>
          <Pressable
            disabled={printing}
            onPress={print}
            style={[styles.printButton, printing && { opacity: 0.6 }]}
          >
            <Printer size={19} color="white" />
            <Text style={styles.buttonText}>
              {printing ? "Opening printer..." : "Print tag"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Profile({ session }: { session: Session }) {
  const [profile, setProfile] = useState<User>(session.user);
  useEffect(() => {
    request("/auth/me", {}, session.token)
      .then(setProfile)
      .catch(() => {});
  }, []);
  const idLabel =
    profile.identificationType === "maldives_id"
      ? "Maldives ID Card"
      : "Passport";
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>ACCOUNT</Text>
      <Text style={styles.title}>{profile.fullName}</Text>
      <View style={styles.profileBlock}>
        <Detail label="Email" value={profile.email} />
        {profile.identificationNumber && (
          <Detail label={idLabel} value={profile.identificationNumber} />
        )}
        {profile.atoll && (
          <Detail
            label="Location"
            value={`${profile.island}, ${profile.atoll}`}
          />
        )}
        <Detail label="Role" value={profile.role.replaceAll("_", " ")} />
        {profile.hospitalName && (
          <Detail label="Hospital group" value={profile.hospitalName} />
        )}
        <Detail label="User ID" value={profile.id} />
      </View>
      <Text style={styles.privacy}>
        Medical and donor information is only visible to authorized users.
      </Text>
    </ScrollView>
  );
}

function RequestRow({
  item,
  session,
  editSession,
  onChanged,
}: {
  item: any;
  session?: Session;
  editSession?: Session;
  onChanged?: () => void;
}) {
  const [assigning, setAssigning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const actingSession = session || editSession;
  const complete = () =>
    Alert.alert(
      "Mark request as completed?",
      "Assigned blood bags will be marked as issued and this request will move to the Completed tab.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete request",
          onPress: async () => {
            setCompleting(true);
            try {
              await request(
                `/requests/${item.id}/status`,
                {
                  method: "PATCH",
                  body: JSON.stringify({ status: "fulfilled" }),
                },
                session!.token,
              );
              onChanged?.();
            } catch (e) {
              Alert.alert("Could not complete request", (e as Error).message);
            } finally {
              setCompleting(false);
            }
          },
        },
      ],
    );
  const idLabel =
    item.patientIdType === "maldives_id" ? "Maldives ID Card" : "Passport";
  return (
    <View style={styles.requestRow}>
      <View style={styles.requestTop}>
        <Text style={styles.rowTitle}>{item.patientName}</Text>
        <Status value={item.status} />
      </View>
      {item.patientIdNumber && (
        <Text style={styles.patientId}>
          {idLabel} · {item.patientIdNumber}
        </Text>
      )}
      <Text style={styles.requestBlood}>
        {item.bloodType} · {item.units} unit{item.units !== 1 ? "s" : ""}
      </Text>
      <Text style={styles.rowMeta}>
        {item.hospital} · Needed {formatDate(item.neededBy)}
      </Text>
      {session && (
        <Text style={styles.patientId}>
          {item.hospitalId === session.user.hospitalId
            ? "MY HOSPITAL"
            : "OTHER HOSPITAL"}
        </Text>
      )}
      {item.island && (
        <Text style={styles.rowMeta}>
          {item.island}, {item.atoll}
        </Text>
      )}
      {item.contactDetail && (
        <Text style={styles.patientId}>Contact · {item.contactDetail}</Text>
      )}
      {item.notes && <Text style={styles.rowMeta}>{item.notes}</Text>}
      {actingSession && item.status !== "fulfilled" && (
        <>
          <Pressable
            onPress={() => setEditing(true)}
            style={[
              styles.secondaryButton,
              { alignSelf: "flex-start", marginTop: 12 },
            ]}
          >
            <Pencil size={15} color={INK} />
            <Text style={styles.secondaryButtonText}>Edit request</Text>
          </Pressable>
          <RequestEdit
            visible={editing}
            item={item}
            session={actingSession}
            onClose={() => setEditing(false)}
            onChanged={() => {
              setEditing(false);
              onChanged?.();
            }}
          />
        </>
      )}
      {session && item.status === "fulfilled" && (
        <>
          <Pressable
            onPress={() => setViewing(true)}
            style={[
              styles.secondaryButton,
              { alignSelf: "flex-start", marginTop: 12 },
            ]}
          >
            <ClipboardList size={16} color={INK} />
            <Text style={styles.secondaryButtonText}>View details</Text>
          </Pressable>
          <RequestDetails
            visible={viewing}
            item={item}
            onClose={() => setViewing(false)}
          />
        </>
      )}
      {session && item.status !== "fulfilled" && (
        <>
          <View style={styles.assignmentSummary}>
            <Text style={styles.rowMeta}>
              {item.assignedBags?.length || 0} bags assigned ·{" "}
              {item.assignedDonors?.length || 0} donors assigned
            </Text>
            <Pressable
              onPress={() => setAssigning(true)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Manage assignments</Text>
            </Pressable>
          </View>
          <RequestAssignments
            visible={assigning}
            item={item}
            session={session}
            onClose={() => setAssigning(false)}
            onChanged={() => {
              setAssigning(false);
              onChanged?.();
            }}
          />
          <Pressable
            disabled={completing}
            onPress={complete}
            style={[
              styles.button,
              { marginTop: 12 },
              completing && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.buttonText}>
              {completing ? "Completing..." : "Mark as completed"}
            </Text>
          </Pressable>
        </>
      )}
      <Text
        style={[styles.urgency, item.urgency === "critical" && { color: RED }]}
      >
        {item.urgency.toUpperCase()} ·{" "}
        {item.visibility === "staff_only"
          ? "CONTACT HIDDEN PUBLICLY"
          : "CONTACT PUBLIC"}
      </Text>
    </View>
  );
}

function RequestDetails({
  visible,
  item,
  onClose,
}: {
  visible: boolean;
  item: any;
  onClose: () => void;
}) {
  const idLabel =
    item.patientIdType === "maldives_id" ? "Maldives ID Card" : "Passport";
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.headingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>COMPLETED REQUEST</Text>
              <Text style={styles.title}>{item.patientName}</Text>
              <Text style={styles.lead}>
                {item.bloodType} · {item.units} unit
                {item.units !== 1 ? "s" : ""}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close request details"
              onPress={onClose}
              style={styles.iconButton}
            >
              <X size={23} color={INK} />
            </Pressable>
          </View>
          <View style={styles.detailsPanel}>
            <Detail label="Status" value="Completed" />
            <Detail
              label={idLabel}
              value={item.patientIdNumber || "Not recorded"}
            />
            <Detail label="Hospital" value={item.hospital} />
            <Detail label="Region" value={`${item.island}, ${item.atoll}`} />
            <Detail label="Needed by" value={formatDate(item.neededBy)} />
            <Detail
              label="Urgency"
              value={String(item.urgency).toUpperCase()}
            />
            <Detail
              label="Contact details"
              value={item.contactDetail || "No contact details recorded"}
            />
            <Detail
              label="Contact visibility"
              value={item.visibility === "staff_only" ? "Staff only" : "Public"}
            />
            <Detail label="Extra information" value={item.notes || "None"} />
          </View>
          <SectionTitle title="Assigned blood bags" />
          {item.assignedBags?.length ? (
            item.assignedBags.map((bag: any) => (
              <View key={bag.id} style={styles.assignmentRow}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{bag.bloodType}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{bag.code}</Text>
                  <Text style={styles.rowMeta}>Issued blood bag</Text>
                </View>
              </View>
            ))
          ) : (
            <Empty text="No blood bags were assigned." />
          )}
          <SectionTitle title="Assigned donors" />
          {item.assignedDonors?.length ? (
            item.assignedDonors.map((donor: any) => (
              <View key={donor.id} style={styles.assignmentRow}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{donor.bloodType}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{donor.fullName}</Text>
                  <Text style={styles.rowMeta}>
                    {donor.identificationNumber} · {donor.phone || "No phone"}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Empty text="No donors were assigned." />
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function RequestEdit({
  visible,
  item,
  session,
  onClose,
  onChanged,
}: {
  visible: boolean;
  item: any;
  session: Session;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [patientName, setPatientName] = useState(item.patientName || "");
  const [patientIdType, setPatientIdType] = useState(
    item.patientIdType || "maldives_id",
  );
  const [patientIdNumber, setPatientIdNumber] = useState(
    item.patientIdNumber || "",
  );
  const [bloodType, setBloodType] = useState(item.bloodType || "O+");
  const [units, setUnits] = useState(String(item.units || 1));
  const [urgency, setUrgency] = useState(item.urgency || "normal");
  const [neededBy, setNeededBy] = useState(
    String(item.neededBy || "").slice(0, 10),
  );
  const [contactDetail, setContactDetail] = useState(item.contactDetail || "");
  const [visibility, setVisibility] = useState(item.visibility || "public");
  const [notes, setNotes] = useState(item.notes || "");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!visible) return;
    setPatientName(item.patientName || "");
    setPatientIdType(item.patientIdType || "maldives_id");
    setPatientIdNumber(item.patientIdNumber || "");
    setBloodType(item.bloodType || "O+");
    setUnits(String(item.units || 1));
    setUrgency(item.urgency || "normal");
    setNeededBy(String(item.neededBy || "").slice(0, 10));
    setContactDetail(item.contactDetail || "");
    setVisibility(item.visibility || "public");
    setNotes(item.notes || "");
  }, [visible, item]);
  const save = async () => {
    setSaving(true);
    try {
      await request(
        `/requests/${item.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            patientName: patientName.trim(),
            patientIdType,
            patientIdNumber: patientIdNumber.trim(),
            bloodType,
            units: Number(units),
            urgency,
            neededBy,
            contactDetail: contactDetail.trim(),
            visibility,
            notes: notes.trim(),
          }),
        },
        session.token,
      );
      onChanged();
    } catch (e) {
      Alert.alert("Could not update request", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.headingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>EDIT BLOOD REQUEST</Text>
              <Text style={styles.title}>{item.hospital}</Text>
              <Text style={styles.lead}>
                {session.user.role === "public"
                  ? "Update the details for your active blood request."
                  : "Staff can see the contact below whether it is public or staff only."}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close request editor"
              onPress={onClose}
              style={styles.iconButton}
            >
              <X size={23} color={INK} />
            </Pressable>
          </View>
          <Field
            label="Patient name"
            value={patientName}
            onChangeText={setPatientName}
          />
          <Text style={styles.fieldLabel}>Identification</Text>
          <ChoiceRow
            values={["maldives_id", "passport"]}
            labels={{ maldives_id: "Maldives ID", passport: "Passport" }}
            value={patientIdType}
            onChange={setPatientIdType}
          />
          <Field
            label={
              patientIdType === "maldives_id"
                ? "Maldives ID Card number"
                : "Passport number"
            }
            value={patientIdNumber}
            onChangeText={setPatientIdNumber}
            autoCapitalize="characters"
          />
          <Text style={styles.fieldLabel}>Blood type</Text>
          <ChoiceRow
            values={BLOOD_TYPES}
            value={bloodType}
            onChange={setBloodType}
          />
          <Field
            label="Units"
            value={units}
            onChangeText={setUnits}
            keyboardType="number-pad"
          />
          <Text style={styles.fieldLabel}>Urgency</Text>
          <ChoiceRow
            values={["normal", "urgent", "critical"]}
            value={urgency}
            onChange={setUrgency}
          />
          <Field
            label="Needed by (YYYY-MM-DD)"
            value={neededBy}
            onChangeText={setNeededBy}
          />
          <Field
            label="Contact details"
            value={contactDetail}
            onChangeText={setContactDetail}
          />
          <Text style={styles.fieldLabel}>Contact visibility</Text>
          <ChoiceRow
            values={["public", "staff_only"]}
            labels={{ public: "Public", staff_only: "Staff only" }}
            value={visibility}
            onChange={setVisibility}
          />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Extra information</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={500}
              placeholder="Optional notes"
              placeholderTextColor="#9B9690"
              style={styles.textarea}
            />
          </View>
          <Button
            label={saving ? "Saving..." : "Save changes"}
            onPress={save}
            disabled={saving}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function RequestAssignments({
  visible,
  item,
  session,
  onClose,
  onChanged,
}: {
  visible: boolean;
  item: any;
  session: Session;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [view, setView] = useState("Bags");
  const [candidates, setCandidates] = useState<any>({ bags: [], donors: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [bagComponent, setBagComponent] = useState("All");
  const [donorArea, setDonorArea] = useState("All areas");
  useEffect(() => {
    if (!visible) return;
    setSearch("");
    setBagComponent("All");
    setDonorArea("All areas");
    setLoading(true);
    request(`/requests/${item.id}/candidates`, {}, session.token)
      .then(setCandidates)
      .catch((e) => Alert.alert("Assignments unavailable", e.message))
      .finally(() => setLoading(false));
  }, [visible, item.id]);
  const bagComponents = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set<string>(
          candidates.bags.map((bag: any) => bag.component).filter(Boolean),
        ),
      ),
    ],
    [candidates.bags],
  );
  const normalizedSearch = search.trim().toLowerCase();
  const visibleBags = candidates.bags.filter((bag: any) => {
    const matchesComponent =
      bagComponent === "All" || bag.component === bagComponent;
    const searchable = [bag.code, bag.component, bag.storageLocation]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesComponent && searchable.includes(normalizedSearch);
  });
  const visibleDonors = candidates.donors.filter((donor: any) => {
    const matchesArea =
      donorArea === "All areas" ||
      (donorArea === "Request island" && donor.island === item.island) ||
      (donorArea === "Request atoll" && donor.atoll === item.atoll);
    const searchable = [
      donor.fullName,
      donor.identificationNumber,
      donor.phone,
      donor.island,
      donor.atoll,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesArea && searchable.includes(normalizedSearch);
  });
  const assignDirect = async (kind: string, targetId: string) => {
    try {
      await request(
        `/requests/${item.id}/assignments`,
        { method: "POST", body: JSON.stringify({ kind, targetId }) },
        session.token,
      );
      onChanged();
    } catch (e) {
      Alert.alert("Could not assign", (e as Error).message);
    }
  };
  const assign = (kind: string, targetId: string) => {
    if (kind !== "bag" || candidates.bags[0]?.id === targetId) {
      void assignDirect(kind, targetId);
      return;
    }
    const earliest = candidates.bags[0];
    Alert.alert(
      "Earlier-expiring stock is available",
      `${earliest.code} expires ${formatDate(earliest.expiresAt)}. Use it first to reduce avoidable waste.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Use ${earliest.code}`,
          onPress: () => void assignDirect("bag", earliest.id),
        },
        {
          text: "Assign selected",
          onPress: () => void assignDirect("bag", targetId),
        },
      ],
    );
  };
  const remove = async (kind: string, targetId: string) => {
    try {
      await request(
        `/requests/${item.id}/assignments/${kind}/${targetId}`,
        { method: "DELETE" },
        session.token,
      );
      onChanged();
    } catch (e) {
      Alert.alert("Could not remove assignment", (e as Error).message);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.headingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>REQUEST ALLOCATION</Text>
              <Text style={styles.title}>
                {item.bloodType} · {item.patientName}
              </Text>
              <Text style={styles.lead}>
                {item.units} unit{item.units !== 1 ? "s" : ""} needed at{" "}
                {item.hospital}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close assignments"
              onPress={onClose}
              style={styles.iconButton}
            >
              <X size={23} color={INK} />
            </Pressable>
          </View>
          {(item.assignedBags?.length > 0 ||
            item.assignedDonors?.length > 0) && (
            <>
              <SectionTitle title="Currently assigned" />
              {item.assignedBags?.map((bag: any) => (
                <View key={bag.id} style={styles.assignmentRow}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{bag.bloodType}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{bag.code}</Text>
                    <Text style={styles.rowMeta}>Reserved blood bag</Text>
                  </View>
                  <Pressable
                    accessibilityLabel={`Remove ${bag.code}`}
                    onPress={() => remove("bag", bag.id)}
                    style={styles.miniIcon}
                  >
                    <X size={18} color={RED} />
                  </Pressable>
                </View>
              ))}
              {item.assignedDonors?.map((donor: any) => (
                <View key={donor.id} style={styles.assignmentRow}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{donor.bloodType}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{donor.fullName}</Text>
                    <Text style={styles.rowMeta}>
                      {donor.phone || "No phone"} · {donor.identificationNumber}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel={`Remove ${donor.fullName}`}
                    onPress={() => remove("donor", donor.id)}
                    style={styles.miniIcon}
                  >
                    <X size={18} color={RED} />
                  </Pressable>
                </View>
              ))}
            </>
          )}
          <SectionTitle title="Assign resources" />
          <View style={styles.authSwitch}>
            <Pressable
              onPress={() => setView("Bags")}
              style={[
                styles.authOption,
                view === "Bags" && styles.authOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.authOptionText,
                  view === "Bags" && { color: "white" },
                ]}
              >
                Blood bags
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setView("Donors")}
              style={[
                styles.authOption,
                view === "Donors" && styles.authOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.authOptionText,
                  view === "Donors" && { color: "white" },
                ]}
              >
                Eligible donors
              </Text>
            </Pressable>
          </View>
          <View style={styles.assignmentSearch}>
            <Search size={19} color={MUTED} />
            <TextInput
              accessibilityLabel={`Search ${view === "Bags" ? "blood bags" : "donors"}`}
              value={search}
              onChangeText={setSearch}
              placeholder={
                view === "Bags"
                  ? "Search bag code, component, or storage"
                  : "Search name, ID, phone, island, or atoll"
              }
              placeholderTextColor="#9B9690"
              autoCapitalize="none"
              style={styles.assignmentSearchInput}
            />
            {search.length > 0 && (
              <Pressable
                accessibilityLabel="Clear search"
                onPress={() => setSearch("")}
                style={styles.miniIcon}
              >
                <X size={17} color={MUTED} />
              </Pressable>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.assignmentFilters}
          >
            {(view === "Bags"
              ? bagComponents
              : ["All areas", "Request island", "Request atoll"]
            ).map((filter) => {
              const active =
                view === "Bags"
                  ? bagComponent === filter
                  : donorArea === filter;
              return (
                <Pressable
                  key={filter}
                  onPress={() =>
                    view === "Bags"
                      ? setBagComponent(filter)
                      : setDonorArea(filter)
                  }
                  style={[
                    styles.assignmentFilter,
                    active && styles.assignmentFilterActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.assignmentFilterText,
                      active && { color: "white" },
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {loading ? (
            <ActivityIndicator color={RED} style={{ marginTop: 30 }} />
          ) : view === "Bags" ? (
            visibleBags.length ? (
              <>
                <View style={styles.fefoNotice}>
                  <Text style={styles.fefoNoticeTitle}>EXPIRY PRIORITY</Text>
                  <Text style={styles.rowMeta}>
                    Use the earliest-expiring matching unit first unless
                    clinical requirements prevent it.
                  </Text>
                </View>
                <Text style={styles.assignmentResultCount}>
                  {visibleBags.length} matching bag
                  {visibleBags.length !== 1 ? "s" : ""}
                </Text>
                {visibleBags.map((bag: any) => (
                  <View key={bag.id} style={styles.assignmentRow}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>{bag.bloodType}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>
                        {bag.code} · {bag.component}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {bag.storageLocation} · Expires{" "}
                        {formatDate(bag.expiresAt)}
                      </Text>
                      {bag.id === candidates.bags[0]?.id && (
                        <Text style={styles.fefoLabel}>
                          RECOMMENDED FIRST ·{" "}
                          {Math.max(0, daysUntil(bag.expiresAt))} days remaining
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => assign("bag", bag.id)}
                      style={styles.smallButton}
                    >
                      <Text style={styles.smallButtonText}>Assign</Text>
                    </Pressable>
                  </View>
                ))}
              </>
            ) : (
              <Empty text="No blood bags match these search filters." />
            )
          ) : visibleDonors.length ? (
            <>
              <Text style={styles.assignmentResultCount}>
                {visibleDonors.length} matching donor
                {visibleDonors.length !== 1 ? "s" : ""}
              </Text>
              {visibleDonors.map((donor: any) => (
                <View key={donor.id} style={styles.assignmentRow}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{donor.bloodType}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{donor.fullName}</Text>
                    <Text style={styles.rowMeta}>
                      {donor.island}, {donor.atoll} ·{" "}
                      {donor.phone || "No phone"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => assign("donor", donor.id)}
                    style={styles.smallButton}
                  >
                    <Text style={styles.smallButtonText}>Assign</Text>
                  </Pressable>
                </View>
              ))}
            </>
          ) : (
            <Empty text="No eligible donors match these search filters." />
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
function Field(props: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#9B9690"
        style={styles.input}
      />
    </View>
  );
}
function Button({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && { opacity: 0.6 }]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}
function ChoiceRow({
  values,
  value,
  onChange,
  labels = {},
}: {
  values: string[];
  value: string;
  onChange: (x: string) => void;
  labels?: Record<string, string>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.choices}
    >
      {values.map((x) => (
        <Pressable
          key={x}
          onPress={() => onChange(x)}
          style={[styles.choice, value === x && styles.choiceActive]}
        >
          <Text style={[styles.choiceText, value === x && { color: "white" }]}>
            {labels[x] || (x === "maldives_id" ? "Maldives ID Card" : x)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
function BloodTypePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (x: string) => void;
}) {
  return (
    <View style={styles.bloodPicker}>
      {BLOOD_TYPES.map((type) => (
        <Pressable
          key={type}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === type }}
          onPress={() => onChange(type)}
          style={[styles.bloodChoice, value === type && styles.choiceActive]}
        >
          <Text
            style={[
              styles.bloodChoiceText,
              value === type && { color: "white" },
            ]}
          >
            {type}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function FilterGrid({
  values,
  value,
  onChange,
}: {
  values: string[];
  value: string;
  onChange: (x: string) => void;
}) {
  return (
    <View style={styles.filterGrid}>
      {values.map((item) => (
        <Pressable
          key={item}
          onPress={() => onChange(item)}
          style={[styles.filterChoice, value === item && styles.choiceActive]}
        >
          <Text
            style={[
              styles.bloodChoiceText,
              value === item && { color: "white" },
            ]}
          >
            {item}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function LocationFields({
  atoll,
  island,
  onAtollChange,
  onIslandChange,
}: {
  atoll: string;
  island: string;
  onAtollChange: (x: string) => void;
  onIslandChange: (x: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [islandOpen, setIslandOpen] = useState(false);
  return (
    <>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Atoll</Text>
        <Pressable
          accessibilityLabel="Select atoll"
          onPress={() => setOpen(true)}
          style={styles.selectField}
        >
          <MapPin size={18} color={MUTED} />
          <Text style={[styles.selectText, !atoll && { color: "#9B9690" }]}>
            {atoll || "Select atoll"}
          </Text>
          <ChevronDown size={18} color={MUTED} />
        </Pressable>
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>City / island</Text>
        <Pressable
          accessibilityLabel="Select city or island"
          disabled={!atoll}
          onPress={() => setIslandOpen(true)}
          style={[styles.selectField, !atoll && { opacity: 0.55 }]}
        >
          <MapPin size={18} color={MUTED} />
          <Text style={[styles.selectText, !island && { color: "#9B9690" }]}>
            {island ||
              (atoll ? "Select city or island" : "Select an atoll first")}
          </Text>
          <ChevronDown size={18} color={MUTED} />
        </Pressable>
      </View>
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalShade}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select atoll</Text>
              <Pressable
                accessibilityLabel="Close"
                onPress={() => setOpen(false)}
                style={styles.iconButton}
              >
                <X size={22} color={INK} />
              </Pressable>
            </View>
            <FlatList
              data={MALDIVES_ATOLLS}
              keyExtractor={(x) => x}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    if (item !== atoll) onIslandChange("");
                    onAtollChange(item);
                    setOpen(false);
                  }}
                  style={styles.atollRow}
                >
                  <Text style={styles.rowTitle}>{item}</Text>
                  {item === atoll && (
                    <Text style={styles.selectedMark}>Selected</Text>
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
      <Modal
        visible={islandOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIslandOpen(false)}
      >
        <View style={styles.modalShade}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select city or island</Text>
              <Pressable
                accessibilityLabel="Close"
                onPress={() => setIslandOpen(false)}
                style={styles.iconButton}
              >
                <X size={22} color={INK} />
              </Pressable>
            </View>
            <FlatList
              data={MALDIVES_ISLANDS[atoll] || []}
              keyExtractor={(x) => x}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onIslandChange(item);
                    setIslandOpen(false);
                  }}
                  style={styles.atollRow}
                >
                  <Text style={styles.rowTitle}>{item}</Text>
                  {item === island && (
                    <Text style={styles.selectedMark}>Selected</Text>
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
function HospitalPicker({
  hospitals,
  value,
  onChange,
}: {
  hospitals: any[];
  value: string;
  onChange: (x: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = hospitals.find((h) => h.id === value);
  return (
    <>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Hospital or blood bank</Text>
        <Pressable
          accessibilityLabel="Select hospital or blood bank"
          onPress={() => setOpen(true)}
          style={styles.selectField}
        >
          <MapPin size={18} color={MUTED} />
          <Text
            numberOfLines={1}
            style={[styles.selectText, !selected && { color: "#9B9690" }]}
          >
            {selected?.name || "Select a facility in this area"}
          </Text>
          <ChevronDown size={18} color={MUTED} />
        </Pressable>
        {hospitals.length === 0 && (
          <Text style={styles.visibilityNote}>
            No registered facility matches this atoll and city or island.
          </Text>
        )}
      </View>
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalShade}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select facility</Text>
              <Pressable
                accessibilityLabel="Close"
                onPress={() => setOpen(false)}
                style={styles.iconButton}
              >
                <X size={22} color={INK} />
              </Pressable>
            </View>
            <FlatList
              data={hospitals}
              keyExtractor={(x) => x.id}
              ListEmptyComponent={
                <Empty text="No hospitals or blood banks match this area." />
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  style={styles.hospitalOption}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    <Text style={styles.rowMeta}>
                      {item.island}, {item.atoll}
                    </Text>
                  </View>
                  {item.id === value && (
                    <Text style={styles.selectedMark}>Selected</Text>
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}
function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}
function Status({ value }: { value: string }) {
  return (
    <View
      style={[
        styles.status,
        value === "pending" && { backgroundColor: "#FFF0D7" },
        value === "available" && { backgroundColor: "#E2F1E8" },
        value === "fulfilled" && { backgroundColor: "#E2F1E8" },
      ]}
    >
      <Text style={styles.statusText}>
        {value === "fulfilled"
          ? "completed"
          : value === "booked"
            ? "pending"
            : value}
      </Text>
    </View>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.rowMeta}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <ClipboardList size={28} color={MUTED} />
      <Text style={styles.cardCopy}>{text}</Text>
    </View>
  );
}
function formatDate(x: string) {
  return new Date(x).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function appointmentMatchesDate(value: string, filter: string) {
  if (filter === "All dates") return true;
  const appointment = new Date(value);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTomorrow = new Date(startToday);
  startTomorrow.setDate(startTomorrow.getDate() + 1);
  if (filter === "Today")
    return appointment >= startToday && appointment < startTomorrow;
  if (filter === "Upcoming") return appointment >= now;
  const days = filter === "7 days" ? 7 : 30;
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  return appointment >= now && appointment <= end;
}
function formatDateTime(x: string) {
  return new Date(x).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
function daysUntil(x: string) {
  return Math.ceil((new Date(x).getTime() - Date.now()) / 86400000);
}

const styles: any = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG,
  },
  login: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: BG,
  },
  mark: {
    width: 62,
    height: 62,
    borderRadius: 8,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  brand: { fontSize: 32, fontWeight: "800", color: INK, letterSpacing: 0 },
  loginCopy: {
    fontSize: 16,
    color: MUTED,
    lineHeight: 24,
    marginTop: 8,
    maxWidth: 340,
  },
  authSwitch: {
    flexDirection: "row",
    backgroundColor: "#E9E4DF",
    borderRadius: 6,
    padding: 3,
    marginTop: 24,
  },
  authOption: {
    flex: 1,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  authOptionActive: { backgroundColor: INK },
  authOptionText: { fontSize: 13, fontWeight: "800", color: MUTED },
  form: { paddingTop: 18, gap: 16 },
  demo: { textAlign: "center", fontSize: 12, color: MUTED },
  topbar: {
    height: 68,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E6E1DC",
    backgroundColor: BG,
  },
  wordmark: { fontSize: 13, fontWeight: "900", color: RED, letterSpacing: 0 },
  role: {
    fontSize: 11,
    color: MUTED,
    textTransform: "capitalize",
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  page: { padding: 20, paddingBottom: 36 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: RED,
    marginBottom: 8,
    letterSpacing: 0,
  },
  title: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "800",
    color: INK,
    letterSpacing: 0,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: MUTED,
    marginTop: 10,
    marginBottom: 20,
  },
  eligibility: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#2E5140",
    padding: 18,
    borderRadius: 8,
    marginTop: 24,
    alignItems: "center",
  },
  eligibilityDetail: {
    marginTop: 7,
    color: "#F3D9DC",
    fontSize: 12,
    lineHeight: 17,
  },
  homeActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  homeAction: {
    flex: 1,
    minHeight: 104,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E6E1DC",
    borderRadius: 8,
    backgroundColor: "white",
  },
  homeActionTitle: {
    marginTop: 9,
    color: INK,
    fontSize: 14,
    fontWeight: "800",
  },
  homeActionMeta: {
    marginTop: 3,
    color: MUTED,
    fontSize: 10,
    lineHeight: 14,
  },
  homeAppointment: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E6E1DC",
    borderRadius: 8,
    backgroundColor: "white",
  },
  homeStockBand: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#DED8D2",
  },
  homeStockDivider: { width: 1, backgroundColor: "#DED8D2" },
  homeStockValue: {
    marginTop: 5,
    color: INK,
    fontSize: 20,
    fontWeight: "800",
  },
  textAction: { color: RED, fontSize: 12, fontWeight: "800" },
  staffMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22,
  },
  staffMetric: {
    width: "48%",
    minHeight: 112,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E6E1DC",
    borderRadius: 8,
    backgroundColor: "white",
  },
  staffMetricValue: {
    marginTop: 8,
    color: INK,
    fontSize: 27,
    fontWeight: "900",
  },
  staffMetricLabel: { marginTop: 2, color: MUTED, fontSize: 12 },
  staffQuickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 7,
    marginTop: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#DED8D2",
  },
  staffQuickAction: {
    flex: 1,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  staffQuickText: { color: INK, fontSize: 10, fontWeight: "700" },
  staffAttentionBand: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: RED,
    backgroundColor: "white",
  },
  staffAttentionValue: { color: RED, fontSize: 28, fontWeight: "900" },
  staffClearState: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 13,
    borderLeftWidth: 3,
    borderLeftColor: "#477A61",
    backgroundColor: "#EEF4F0",
  },
  staffClearText: { flex: 1, color: "#355B47", fontSize: 12 },
  dropCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#477A61",
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#C8E0D2",
    marginBottom: 4,
    letterSpacing: 0,
  },
  cardTitle: { fontSize: 19, fontWeight: "800", color: "white" },
  cardCopy: { fontSize: 13, color: MUTED, lineHeight: 19, marginTop: 4 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: INK,
    marginTop: 26,
    marginBottom: 12,
  },
  metrics: { flexDirection: "row", gap: 10 },
  statBar: { flexDirection: "row", gap: 8, marginTop: 20 },
  expiryNote: { fontSize: 12, color: MUTED, marginTop: 10 },
  metric: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E6E1DC",
    borderRadius: 8,
    padding: 12,
  },
  metricValue: { fontSize: 25, fontWeight: "800", color: INK },
  metricLabel: { fontSize: 11, color: MUTED, marginTop: 3 },
  filterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChoice: {
    width: "31%",
    height: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D8D2CC",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  resultsHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hospitalResult: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E6E1DC",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  hospitalHeader: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F5E8E7",
    alignItems: "center",
    justifyContent: "center",
  },
  stockBreakdown: {
    borderTopWidth: 1,
    borderTopColor: "#E6E1DC",
    paddingHorizontal: 14,
  },
  stockRow: { height: 60, flexDirection: "row", alignItems: "center", gap: 12 },
  stockLabel: { flex: 1, fontSize: 13, color: MUTED },
  notice: {
    backgroundColor: "#F5E8E7",
    borderLeftWidth: 4,
    borderLeftColor: RED,
    padding: 16,
    borderRadius: 4,
    marginBottom: 10,
  },
  noticeTitle: { fontSize: 16, fontWeight: "800", color: INK },
  bloodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  bloodTile: {
    width: "22.5%",
    minWidth: 68,
    aspectRatio: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E6E1DC",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  bloodType: { fontSize: 21, fontWeight: "900", color: RED },
  bloodUnits: { fontSize: 11, color: MUTED, marginTop: 5 },
  bloodPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bloodChoice: {
    width: "23%",
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D8D2CC",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  bloodChoiceText: { fontSize: 14, fontWeight: "800", color: INK },
  selectField: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#D8D2CC",
    backgroundColor: "white",
    borderRadius: 6,
    paddingHorizontal: 14,
  },
  selectText: { flex: 1, fontSize: 15, color: INK },
  modalShade: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    height: "72%",
    backgroundColor: BG,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingHorizontal: 20,
  },
  modalHeader: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E6E1DC",
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: INK },
  atollRow: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E6E1DC",
  },
  selectedMark: { fontSize: 11, fontWeight: "800", color: RED },
  listRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E1DC",
  },
  typeBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5E8E7",
    alignItems: "center",
    justifyContent: "center",
  },
  typeText: { fontSize: 15, fontWeight: "900", color: RED },
  rowTitle: { fontSize: 15, fontWeight: "700", color: INK },
  rowMeta: { fontSize: 12, color: MUTED, marginTop: 4 },
  units: { fontSize: 18, fontWeight: "800", color: INK },
  smallButton: {
    backgroundColor: INK,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  smallButtonText: { color: "white", fontWeight: "700" },
  headingRow: { flexDirection: "row", alignItems: "center" },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E6E1DC",
    padding: 16,
    borderRadius: 8,
    marginTop: 18,
    gap: 10,
  },
  requestRow: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E6E1DC",
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  requestTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  patientId: { fontSize: 12, fontWeight: "700", color: INK, marginTop: 8 },
  requestBlood: { fontSize: 20, fontWeight: "900", color: RED, marginTop: 10 },
  urgency: { fontSize: 10, fontWeight: "900", color: MUTED, marginTop: 10 },
  field: { gap: 7 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: INK },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D8D2CC",
    backgroundColor: "white",
    borderRadius: 6,
    paddingHorizontal: 14,
    fontSize: 15,
    color: INK,
  },
  button: {
    height: 50,
    backgroundColor: RED,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonText: { color: "white", fontSize: 15, fontWeight: "800" },
  choices: { gap: 7, paddingBottom: 5 },
  choice: {
    height: 38,
    minWidth: 48,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#D8D2CC",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  choiceActive: { backgroundColor: RED, borderColor: RED },
  choiceText: {
    fontSize: 12,
    fontWeight: "700",
    color: INK,
    textTransform: "capitalize",
  },
  status: {
    backgroundColor: "#ECE9E6",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: INK,
    textTransform: "capitalize",
  },
  profileBlock: { marginTop: 24, borderTopWidth: 1, borderTopColor: "#E6E1DC" },
  detail: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E1DC",
  },
  detailValue: {
    fontSize: 15,
    color: INK,
    marginTop: 5,
    textTransform: "capitalize",
  },
  privacy: { fontSize: 12, lineHeight: 18, color: MUTED, marginTop: 24 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 50 },
  tabbar: {
    height: 70,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#DDD7D0",
    backgroundColor: "white",
    paddingBottom: 5,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 0,
  },
  tabText: { fontSize: 9, color: MUTED },
  tabActive: { color: RED, fontWeight: "800" },
});

Object.assign(
  styles,
  StyleSheet.create({
    centreResult: {
      backgroundColor: "white",
      borderWidth: 1,
      borderColor: "#E6E1DC",
      borderRadius: 8,
      marginBottom: 12,
      overflow: "hidden",
    },
    hours: { fontSize: 12, fontWeight: "700", color: INK, marginTop: 6 },
    slotRow: {
      minHeight: 66,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      borderTopWidth: 1,
      borderTopColor: "#E6E1DC",
    },
    noSlots: {
      fontSize: 12,
      color: MUTED,
      paddingHorizontal: 14,
      paddingBottom: 14,
    },
    needCard: {
      backgroundColor: "white",
      borderWidth: 1,
      borderColor: "#E6E1DC",
      borderRadius: 8,
      marginBottom: 10,
      overflow: "hidden",
    },
    needSummary: {
      minHeight: 94,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
    },
    needDetails: {
      gap: 16,
      borderTopWidth: 1,
      borderTopColor: "#E6E1DC",
      padding: 14,
    },
    needCopy: { fontSize: 14, lineHeight: 20, color: INK, marginTop: 5 },
    contactRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    contactValue: { fontSize: 15, fontWeight: "700", color: INK, marginTop: 5 },
    contactButton: {
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      backgroundColor: RED,
      paddingHorizontal: 16,
      borderRadius: 6,
    },
    privateContact: {
      fontSize: 12,
      lineHeight: 18,
      color: MUTED,
      backgroundColor: "#F3F0ED",
      padding: 12,
      borderRadius: 6,
    },
    bookingRow: {
      backgroundColor: "white",
      borderWidth: 1,
      borderColor: "#E6E1DC",
      borderRadius: 8,
      padding: 14,
      marginBottom: 10,
      flexDirection: "row",
      gap: 10,
    },
    bookingActions: { gap: 8, justifyContent: "center" },
    secondaryButton: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#D8D2CC",
    },
    secondaryButtonText: { fontSize: 12, fontWeight: "700", color: INK },
    textarea: {
      minHeight: 96,
      borderWidth: 1,
      borderColor: "#D8D2CC",
      backgroundColor: "white",
      borderRadius: 6,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: INK,
      textAlignVertical: "top",
    },
    formSection: { fontSize: 16, fontWeight: "800", color: INK, marginTop: 12 },
    visibilityNote: { fontSize: 12, lineHeight: 18, color: MUTED },
    hospitalOption: {
      minHeight: 70,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#E6E1DC",
    },
    inventoryTool: {
      width: 42,
      height: 42,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#D8D2CC",
      backgroundColor: "white",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
    inventoryActions: { flexDirection: "row", gap: 3, marginLeft: 5 },
    inventoryStats: {
      flexDirection: "row",
      gap: 6,
      marginTop: 18,
      marginBottom: 18,
    },
    inventoryCard: {
      backgroundColor: "white",
      borderWidth: 1,
      borderColor: "#E6E1DC",
      borderRadius: 8,
      marginBottom: 10,
      overflow: "hidden",
    },
    inventoryCardMain: {
      minHeight: 98,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
    },
    inventoryCardTitle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    inventoryCardActions: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: "#E6E1DC",
      paddingHorizontal: 8,
    },
    inventoryActionButton: {
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 10,
    },
    inventoryActionText: { fontSize: 11, fontWeight: "700", color: INK },
    inventoryDeleteButton: {
      width: 42,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: "auto",
    },
    miniIcon: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
    },
    scannerPage: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "black",
    },
    scanFrame: {
      width: 250,
      height: 250,
      borderWidth: 3,
      borderColor: "white",
      borderRadius: 8,
    },
    scanText: {
      position: "absolute",
      bottom: 90,
      color: "white",
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
    },
    scannerClose: {
      position: "absolute",
      top: 50,
      right: 20,
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: "rgba(0,0,0,.55)",
      alignItems: "center",
      justifyContent: "center",
    },
    tagSheet: {
      backgroundColor: BG,
      paddingHorizontal: 20,
      paddingBottom: 28,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    tag: {
      backgroundColor: "white",
      borderWidth: 1,
      borderColor: "#D8D2CC",
      borderRadius: 8,
      alignItems: "center",
      padding: 22,
    },
    tagBrand: { fontSize: 12, fontWeight: "900", color: INK, marginBottom: 16 },
    tagCode: { fontSize: 17, fontWeight: "800", color: INK, marginTop: 12 },
    tagBlood: { fontSize: 42, fontWeight: "900", color: RED, marginTop: 8 },
    tagDonor: { fontSize: 15, fontWeight: "800", color: INK, marginTop: 8 },
    tagAssigned: {
      fontSize: 13,
      fontWeight: "800",
      color: RED,
      marginTop: 8,
      textAlign: "center",
    },
    assignedPatient: {
      fontSize: 11,
      fontWeight: "800",
      color: RED,
      marginTop: 5,
    },
    custodyText: {
      fontSize: 11,
      lineHeight: 17,
      color: INK,
      marginTop: 6,
    },
    tagCustody: {
      width: "100%",
      marginTop: 12,
      padding: 10,
      borderWidth: 1,
      borderColor: "#E6E1DC",
      borderRadius: 6,
      fontSize: 12,
      lineHeight: 18,
      color: INK,
      textAlign: "center",
    },
    tagDetails: {
      fontSize: 13,
      color: MUTED,
      marginTop: 5,
      textAlign: "center",
    },
    printButton: {
      height: 50,
      flexDirection: "row",
      gap: 9,
      backgroundColor: RED,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 14,
    },
    patientRow: {
      minHeight: 84,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: "white",
      borderWidth: 1,
      borderColor: "#E6E1DC",
      borderRadius: 8,
      padding: 14,
      marginBottom: 10,
    },
    historyRow: {
      borderLeftWidth: 3,
      borderLeftColor: RED,
      paddingLeft: 13,
      paddingVertical: 9,
      marginBottom: 8,
    },
    cardLabelDark: {
      fontSize: 10,
      fontWeight: "800",
      color: RED,
      marginBottom: 5,
    },
    addHistoryButton: {
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: RED,
      borderRadius: 6,
      marginBottom: 14,
    },
    historyActions: { flexDirection: "row", gap: 8, marginTop: 9 },
    staffHeading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    staffRow: {
      minHeight: 82,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#E6E1DC",
      paddingVertical: 12,
    },
    adminRow: {
      minHeight: 82,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#E6E1DC",
    },
    assignmentSummary: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    assignmentRow: {
      minHeight: 74,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#E6E1DC",
      paddingVertical: 10,
    },
    assignmentSearch: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginTop: 14,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: "#D8D2CC",
      borderRadius: 6,
      backgroundColor: "white",
    },
    assignmentSearchInput: {
      flex: 1,
      minWidth: 0,
      color: INK,
      fontSize: 14,
      paddingVertical: 10,
    },
    assignmentFilters: { gap: 8, paddingVertical: 12 },
    assignmentFilter: {
      minHeight: 38,
      justifyContent: "center",
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: "#D8D2CC",
      borderRadius: 6,
      backgroundColor: "white",
    },
    assignmentFilterActive: { backgroundColor: RED, borderColor: RED },
    assignmentFilterText: { color: INK, fontSize: 12, fontWeight: "700" },
    assignmentResultCount: { color: MUTED, fontSize: 12, marginBottom: 3 },
    fefoLabel: {
      marginTop: 5,
      color: RED,
      fontSize: 10,
      fontWeight: "900",
    },
    fefoNotice: {
      marginBottom: 10,
      padding: 11,
      borderLeftWidth: 3,
      borderLeftColor: RED,
      backgroundColor: "#F4ECEC",
    },
    fefoNoticeTitle: {
      marginBottom: 3,
      color: RED,
      fontSize: 10,
      fontWeight: "900",
    },
    detailsPanel: {
      marginTop: 22,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: "#E6E1DC",
      borderRadius: 8,
      backgroundColor: "white",
    },
  }),
);
