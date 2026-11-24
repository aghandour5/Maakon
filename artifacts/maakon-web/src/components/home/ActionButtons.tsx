import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { ShieldAlert, HeartHandshake, ArrowRight, type LucideIcon } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface ActionCard {
  href: string;
  titleKey: string;
  descriptionKey: string;
  Icon: LucideIcon;
  colorClasses: string;
}

// Both journeys start without sign-in: /need/new saves a draft and finishes via the email link, /give is public.
const ACTION_CARDS: readonly ActionCard[] = [
  {
    href: "/need/new",
    titleKey: "i_need_help",
    descriptionKey: "i_need_help_desc",
    Icon: ShieldAlert,
    colorClasses: "bg-action-need group-hover:bg-action-need-hover",
  },
  {
    href: "/give",
    titleKey: "i_want_to_help",
    descriptionKey: "i_want_to_help_subtitle",
    Icon: HeartHandshake,
    colorClasses: "bg-action-give group-hover:bg-action-give-hover",
  },
];

export default function ActionButtons() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay: 0.15 }}
      className="w-full max-w-2xl flex flex-col gap-3 sm:gap-4"
    >
      {ACTION_CARDS.map(({ href, titleKey, descriptionKey, Icon, colorClasses }) => (
        <Link
          key={href}
          href={href}
          className="group block w-full rounded-xl text-white no-underline focus-ring-on-dark"
        >
          {/* Lift only this inner layer; moving the link itself shifts its hover area away from an edge cursor and flickers. */}
          <span
            className={`min-h-20 rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-lg transition-[background-color,box-shadow,transform] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-xl group-active:translate-y-0 ${colorClasses}`}
          >
            <span
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center shrink-0 bg-white/20"
              aria-hidden="true"
            >
              <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
            </span>

            <span className="flex-1 min-w-0 text-start">
              <span className="block text-lg sm:text-xl font-bold leading-tight">{t(titleKey)}</span>
              <span className="block text-sm font-medium mt-0.5">{t(descriptionKey)}</span>
            </span>

            <span
              className={`shrink-0 opacity-80 group-hover:opacity-100 transition-[opacity,transform] duration-200 ${
                isRtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"
              }`}
              aria-hidden="true"
            >
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 rtl:rotate-180" />
            </span>
          </span>
        </Link>
      ))}
    </motion.div>
  );
}
