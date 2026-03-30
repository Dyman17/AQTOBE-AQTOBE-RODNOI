import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/I18nContext";

const NotFound = () => {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">{t("notFound.title")}</h1>
        <Button asChild>
          <Link to="/">{t("notFound.back")}</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
