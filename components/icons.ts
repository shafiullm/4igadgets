/* ============================================================
   Icon registry - real React-owned SVGs from lucide-react.
   Replaces the previous CDN `window.lucide.createIcons()` DOM-scan,
   which mutated React-managed nodes and caused removeChild crashes
   (e.g. on the polling admin Support screen). Only the icons the app
   actually uses are imported, so the bundle stays small.
   ============================================================ */
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, Banknote, Box, Cable,
  CalendarClock, Check, CheckCircle2, Circle, CircleAlert, Clock, Download,
  Eye, EyeOff, Flame, Footprints, Gamepad2, Globe, Headphones, Headset, Heart,
  Home, Image, Info, Laptop, LayoutDashboard, LayoutGrid, Lock, LogOut, Mail,
  MapPin, Menu, MessageCircle, MessagesSquare, Package, PackageCheck,
  PackageSearch, PanelLeftClose, PanelLeftOpen, Pencil, Phone, PhoneCall, Plus,
  RotateCcw, Search, SearchX, Send, Shield, ShieldCheck, Shirt, ShoppingBag,
  ShoppingCart, SlidersHorizontal, Smartphone, Sofa, Sparkles, Star, Store,
  Tag, Tags, Trash2, TrendingUp, Truck, User, Wallet, WashingMachine, Watch, X,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  "alert-triangle": AlertTriangle, "arrow-left": ArrowLeft, "arrow-right": ArrowRight,
  "badge-check": BadgeCheck, banknote: Banknote, box: Box, cable: Cable,
  "calendar-clock": CalendarClock, check: Check, "check-circle-2": CheckCircle2,
  circle: Circle, "circle-alert": CircleAlert, clock: Clock, download: Download,
  eye: Eye, "eye-off": EyeOff, flame: Flame, footprints: Footprints, "gamepad-2": Gamepad2,
  globe: Globe, headphones: Headphones, headset: Headset, heart: Heart, home: Home,
  image: Image, info: Info, laptop: Laptop, "layout-dashboard": LayoutDashboard,
  "layout-grid": LayoutGrid, lock: Lock, "log-out": LogOut, mail: Mail, "map-pin": MapPin,
  menu: Menu, "message-circle": MessageCircle, "messages-square": MessagesSquare,
  package: Package, "package-check": PackageCheck, "package-search": PackageSearch,
  "panel-left-close": PanelLeftClose, "panel-left-open": PanelLeftOpen, pencil: Pencil,
  phone: Phone, "phone-call": PhoneCall, plus: Plus, "rotate-ccw": RotateCcw,
  search: Search, "search-x": SearchX, send: Send, shield: Shield, "shield-check": ShieldCheck,
  shirt: Shirt, "shopping-bag": ShoppingBag, "shopping-cart": ShoppingCart,
  "sliders-horizontal": SlidersHorizontal, smartphone: Smartphone, sofa: Sofa,
  sparkles: Sparkles, star: Star, store: Store, tag: Tag, tags: Tags, "trash-2": Trash2,
  "trending-up": TrendingUp, truck: Truck, user: User, wallet: Wallet,
  "washing-machine": WashingMachine, watch: Watch, x: X,
};

export const FallbackIcon = Circle;
