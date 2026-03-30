import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { toast } from "@/components/ui/sonner";

const Footer = () => {
  const { t, language } = useI18n();
  const contactEmail = "qunarqu@gmail.com";
  const emailUi = {
    en: {
      copy: "Copy email",
      write: "Write email",
      subject: "QUNAR support request",
      body: "Hello! I would like to know more about QUNAR.",
      copied: "Email copied",
      copyError: "Could not copy email",
    },
    ru: {
      copy: "Скопировать",
      write: "Написать",
      subject: "Запрос поддержки QUNAR",
      body: "Здравствуйте! Хотел(а) бы узнать больше о QUNAR.",
      copied: "Email скопирован",
      copyError: "Не удалось скопировать email",
    },
    kk: {
      copy: "Көшіру",
      write: "Жазу",
      subject: "QUNAR қолдау сұрауы",
      body: "Сәлеметсіз бе! QUNAR туралы көбірек білгім келеді.",
      copied: "Email көшірілді",
      copyError: "Email көшіру сәтсіз болды",
    },
  } as const;
  const emailText = emailUi[language] ?? emailUi.en;
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}&su=${encodeURIComponent(emailText.subject)}&body=${encodeURIComponent(emailText.body)}`;

  const handleCopyEmail = async () => {
    if (!navigator?.clipboard) {
      toast.error(emailText.copyError);
      return;
    }
    try {
      await navigator.clipboard.writeText(contactEmail);
      toast.success(emailText.copied);
    } catch {
      toast.error(emailText.copyError);
    }
  };

  return (
    <footer className="border-t bg-card">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-primary mb-3">
            <Sprout className="w-6 h-6" />
            QUNAR
          </Link>
          <p className="text-muted-foreground text-sm max-w-sm">
            {t("footer.description")}
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3">{t("footer.support")}</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="group relative inline-flex flex-col items-start pb-6">
              <span className="font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                {contactEmail}
              </span>
              <div className="absolute left-0 top-full -mt-1 invisible opacity-0 translate-y-1 transition-all pointer-events-none group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 hover:pointer-events-auto hover:visible hover:opacity-100 hover:translate-y-0 z-10">
                <div className="flex min-w-[160px] items-center gap-2 rounded-full bg-foreground text-background text-xs px-3 py-1 shadow-card">
                  <button type="button" onClick={handleCopyEmail} className="hover:text-white/90">
                    {emailText.copy}
                  </button>
                  <span className="opacity-40">•</span>
                  <a
                    href={gmailComposeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white/90"
                  >
                    {emailText.write}
                  </a>
                </div>
              </div>
            </div>
            <Link to="/settings" className="hover:text-foreground transition-colors">{t("footer.accountSettings")}</Link>
          </div>
        </div>
      </div>
      <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
        (c) 2026 QUNAR. {t("footer.rights")}
      </div>
    </div>
    </footer>
  );
};

export default Footer;
